const { randomUUID } = require('node:crypto');
const vm = require('node:vm');

const SENSITIVE_FIELD_PATTERN = /authorization|cookie|token|secret|password|api[-_]?key|session|credential|bearer/i;
const SCRIPT_TIMEOUT_MS = 250;
const SCRIPT_CONSOLE_PREVIEW_LIMIT = 8;
const SCRIPT_TEST_PREVIEW_LIMIT = 8;
const SCRIPT_MESSAGE_LIMIT = 240;
const FORBIDDEN_SCRIPT_TOKEN_PATTERN = /\b(?:process|require|module|exports|__dirname|__filename|globalThis|global|fs|path|child_process)\b/;
const FREEFORM_SECRET_PATTERNS = [
  /\b(Bearer)\s+[^\s,;]+/gi,
  /\b(Basic)\s+[A-Za-z0-9+/=]+/gi,
  /\b((?:api[-_]?key|token|secret|password|session|credential))\b(\s*[:=]\s*)([^\s,;]+)/gi,
];

class ScriptStageExecutionError extends Error {
  constructor(code, message, stageStatus = 'failed') {
    super(message);
    this.name = 'ScriptStageExecutionError';
    this.code = code;
    this.stageStatus = stageStatus;
  }
}

function truncatePreview(value, maxLength = 400) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function isSensitiveFieldName(name = '') {
  return SENSITIVE_FIELD_PATTERN.test(name);
}

function sanitizeFieldValue(name, value) {
  if (typeof value !== 'string') {
    return '';
  }

  return isSensitiveFieldName(name) ? '[redacted]' : truncatePreview(value, 240);
}

function redactStructuredJson(value, keyHint = '') {
  if (Array.isArray(value)) {
    return value.map((item) => redactStructuredJson(item, keyHint));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        redactStructuredJson(nestedValue, key),
      ]),
    );
  }

  if (typeof value === 'string') {
    return sanitizeFieldValue(keyHint, value);
  }

  return value;
}

function redactFreeformText(value) {
  const normalizedValue = typeof value === 'string' ? value : String(value ?? '');
  const redactedValue = FREEFORM_SECRET_PATTERNS.reduce(
    (currentValue, pattern) => currentValue.replace(pattern, (_match, label, separator = '') => `${label}${separator}[redacted]`),
    normalizedValue,
  );

  return truncatePreview(redactedValue, SCRIPT_MESSAGE_LIMIT);
}

function cloneAuth(auth = {}) {
  return {
    type: auth.type || 'none',
    bearerToken: auth.bearerToken || '',
    basicUsername: auth.basicUsername || '',
    basicPassword: auth.basicPassword || '',
    apiKeyName: auth.apiKeyName || '',
    apiKeyValue: auth.apiKeyValue || '',
    apiKeyPlacement: auth.apiKeyPlacement || 'header',
  };
}

function createAuthSummary(auth = cloneAuth()) {
  switch (auth?.type) {
    case 'bearer':
      return 'Bearer auth';
    case 'basic':
      return 'Basic auth';
    case 'api-key':
      return auth.apiKeyPlacement === 'query' ? 'API key in query' : 'API key in header';
    default:
      return 'No auth';
  }
}

function cloneExecutionRequest(executionRequest = {}) {
  return JSON.parse(JSON.stringify({
    name: executionRequest.name || '',
    method: executionRequest.method || 'GET',
    url: executionRequest.url || '',
    params: Array.isArray(executionRequest.params) ? executionRequest.params : [],
    headers: Array.isArray(executionRequest.headers) ? executionRequest.headers : [],
    bodyMode: executionRequest.bodyMode || 'none',
    bodyText: executionRequest.bodyText || '',
    formBody: Array.isArray(executionRequest.formBody) ? executionRequest.formBody : [],
    multipartBody: Array.isArray(executionRequest.multipartBody) ? executionRequest.multipartBody : [],
    auth: cloneAuth(executionRequest.auth),
  }));
}

function createStageLabel(stageId) {
  switch (stageId) {
    case 'pre-request':
      return 'Pre-request';
    case 'post-response':
      return 'Post-response';
    case 'tests':
      return 'Tests';
    default:
      return 'Transport';
  }
}

function createMutableRowCollection(rows) {
  const findRowIndex = (key) =>
    rows.findIndex((row) =>
      row.enabled !== false
      && typeof row.key === 'string'
      && row.key.toLowerCase() === String(key).toLowerCase(),
    );

  return {
    get(name) {
      const index = findRowIndex(name);
      return index >= 0 ? rows[index].value : undefined;
    },
    set(name, value) {
      const normalizedName = String(name ?? '').trim();

      if (normalizedName.length === 0) {
        throw new ScriptStageExecutionError(
          'script_mutation_blocked',
          'Empty keys are not supported in request mutations.',
          'blocked',
        );
      }

      const index = findRowIndex(normalizedName);

      if (index >= 0) {
        rows[index].value = String(value ?? '');
        rows[index].enabled = true;
        return;
      }

      rows.push({
        id: randomUUID(),
        key: normalizedName,
        value: String(value ?? ''),
        enabled: true,
      });
    },
    delete(name) {
      const index = findRowIndex(name);

      if (index >= 0) {
        rows.splice(index, 1);
      }
    },
    entries() {
      return rows
        .filter((row) => row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0)
        .map((row) => [row.key, row.value]);
    },
  };
}

function createMutableRequestContext(executionRequest) {
  const headers = createMutableRowCollection(executionRequest.headers);
  const params = createMutableRowCollection(executionRequest.params);

  return {
    get method() {
      return executionRequest.method;
    },
    set method(nextMethod) {
      executionRequest.method = String(nextMethod || executionRequest.method || 'GET').toUpperCase();
    },
    get url() {
      return executionRequest.url;
    },
    set url(nextUrl) {
      executionRequest.url = String(nextUrl || '');
    },
    headers,
    params,
    body: {
      get mode() {
        return executionRequest.bodyMode;
      },
      get text() {
        return executionRequest.bodyText || '';
      },
      setText(nextBodyText) {
        if (executionRequest.bodyMode === 'form-urlencoded' || executionRequest.bodyMode === 'multipart-form-data') {
          throw new ScriptStageExecutionError(
            'script_mutation_blocked',
            'Pre-request body text mutation is limited to none, text, or json modes in this slice.',
            'blocked',
          );
        }

        executionRequest.bodyMode = executionRequest.bodyMode === 'none' ? 'text' : executionRequest.bodyMode;
        executionRequest.bodyText = String(nextBodyText ?? '');
      },
      clear() {
        executionRequest.bodyMode = 'none';
        executionRequest.bodyText = '';
        executionRequest.formBody = [];
        executionRequest.multipartBody = [];
      },
    },
    auth: {
      get type() {
        return executionRequest.auth.type;
      },
      setBearerToken(token) {
        executionRequest.auth = {
          ...cloneAuth(executionRequest.auth),
          type: 'bearer',
          bearerToken: String(token ?? ''),
        };
      },
      clear() {
        executionRequest.auth = cloneAuth({ type: 'none' });
      },
      setBasic() {
        throw new ScriptStageExecutionError(
          'script_mutation_blocked',
          'Basic auth mutation is not available in this bounded script slice.',
          'blocked',
        );
      },
      setApiKey() {
        throw new ScriptStageExecutionError(
          'script_mutation_blocked',
          'API key auth mutation is not available in this bounded script slice.',
          'blocked',
        );
      },
    },
  };
}

function createReadonlyHeadersContext(headerEntries) {
  const headersMap = new Map(
    (headerEntries || []).map((header) => [
      String(header.name || header.key).toLowerCase(),
      String(header.value || ''),
    ]),
  );

  return {
    get(name) {
      return headersMap.get(String(name).toLowerCase());
    },
    entries() {
      return Array.from(headersMap.entries());
    },
  };
}

function createExecutionHeaders(headers, auth) {
  const nextHeaders = new Headers();

  for (const row of headers || []) {
    if (row && row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0) {
      nextHeaders.set(row.key, typeof row.value === 'string' ? row.value : '');
    }
  }

  if (auth?.type === 'bearer' && auth.bearerToken) {
    nextHeaders.set('Authorization', `Bearer ${auth.bearerToken}`);
  }

  if (auth?.type === 'basic' && auth.basicUsername) {
    const encoded = Buffer.from(`${auth.basicUsername}:${auth.basicPassword || ''}`).toString('base64');
    nextHeaders.set('Authorization', `Basic ${encoded}`);
  }

  if (auth?.type === 'api-key' && auth.apiKeyPlacement === 'header' && auth.apiKeyName && auth.apiKeyValue) {
    nextHeaders.set(auth.apiKeyName, auth.apiKeyValue);
  }

  return nextHeaders;
}

function createReadonlyRequestContext(executionRequest, targetUrl) {
  const normalizedTarget = targetUrl ? new URL(targetUrl) : new URL(executionRequest.url);
  const headers = createExecutionHeaders(executionRequest.headers, executionRequest.auth);

  return {
    method: executionRequest.method,
    url: normalizedTarget.toString(),
    headers: createReadonlyHeadersContext(
      Array.from(headers.entries()).map(([name, value]) => ({ name, value })),
    ),
    params: Array.from(normalizedTarget.searchParams.entries()).map(([key, value]) => ({ key, value })),
    bodyMode: executionRequest.bodyMode,
    bodyText: executionRequest.bodyText || '',
    authSummary: createAuthSummary(executionRequest.auth),
  };
}

function createReadonlyResponseContext(responseStatus, responseHeaders, responseBodyText) {
  let parsedJson;
  let parsedJsonReady = false;

  return {
    status: responseStatus,
    ok: typeof responseStatus === 'number' && responseStatus >= 200 && responseStatus < 300,
    headers: createReadonlyHeadersContext(responseHeaders),
    body: {
      text: responseBodyText,
      preview: truncatePreview(responseBodyText, 4000),
      json() {
        if (!parsedJsonReady) {
          parsedJson = JSON.parse(responseBodyText);
          parsedJsonReady = true;
        }

        return redactStructuredJson(parsedJson);
      },
    },
  };
}

function formatConsoleArgument(value) {
  if (typeof value === 'string') {
    return redactFreeformText(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value === null || value === undefined) {
    return String(value);
  }

  try {
    return truncatePreview(JSON.stringify(redactStructuredJson(value), null, 2), SCRIPT_MESSAGE_LIMIT);
  } catch {
    return redactFreeformText(String(value));
  }
}

function createConsoleSink(stageId) {
  const stageLabel = createStageLabel(stageId);
  const previewEntries = [];
  let entryCount = 0;
  let warningCount = 0;

  const pushEntry = (level, args) => {
    const message = args.map((value) => formatConsoleArgument(value)).join(' ');
    const prefixedMessage = `[${stageLabel}] ${message}`;

    entryCount += 1;
    if (level !== 'log') {
      warningCount += 1;
    }

    if (previewEntries.length < SCRIPT_CONSOLE_PREVIEW_LIMIT) {
      previewEntries.push(prefixedMessage);
    }
  };

  return {
    previewEntries,
    get entryCount() {
      return entryCount;
    },
    get warningCount() {
      return warningCount;
    },
    consoleApi: {
      log(...args) {
        pushEntry('log', args);
      },
      warn(...args) {
        pushEntry('warn', args);
      },
      error(...args) {
        pushEntry('error', args);
      },
    },
  };
}

function createStageSummaryController() {
  let currentSummary = '';

  return {
    stageSummaryApi: {
      set(nextSummary) {
        currentSummary = redactFreeformText(nextSummary);
      },
      clear() {
        currentSummary = '';
      },
    },
    readSummary() {
      return currentSummary;
    },
  };
}

function createTestsApi() {
  const testResults = [];
  let currentTestName = null;
  let assertionSequence = 1;

  const pushResult = (name, status, message) => {
    testResults.push({
      id: randomUUID(),
      name,
      status,
      message: redactFreeformText(message),
    });
  };

  return {
    assert(condition, message = 'Assertion failed.') {
      const testName = currentTestName || `Assertion ${assertionSequence++}`;

      if (condition) {
        pushResult(testName, 'passed', message);
        return true;
      }

      pushResult(testName, 'failed', message);
      throw new ScriptStageExecutionError('script_assertion_failed', message, 'failed');
    },
    test(name, callback) {
      const normalizedName = redactFreeformText(name || `Assertion ${assertionSequence}`);
      const previousTestName = currentTestName;
      currentTestName = normalizedName;
      const beforeCount = testResults.length;

      try {
        callback();

        if (testResults.length === beforeCount) {
          pushResult(normalizedName, 'passed', `${normalizedName} passed.`);
        }
      } catch (error) {
        if (testResults.length === beforeCount) {
          pushResult(
            normalizedName,
            'failed',
            error instanceof Error ? error.message : `${normalizedName} failed.`,
          );
        }
      } finally {
        currentTestName = previousTestName;
      }
    },
    readResults() {
      return testResults.slice(0, SCRIPT_TEST_PREVIEW_LIMIT);
    },
  };
}

function createScriptContext(stageId, options) {
  const consoleSink = createConsoleSink(stageId);
  const summaryController = createStageSummaryController();
  const baseContext = {
    console: consoleSink.consoleApi,
    summary: summaryController.stageSummaryApi,
  };

  if (stageId === 'pre-request') {
    return {
      context: {
        ...baseContext,
        request: createMutableRequestContext(options.executionRequest),
      },
      consoleSink,
      summaryController,
      testsApi: null,
    };
  }

  const sharedContext = {
    ...baseContext,
    request: createReadonlyRequestContext(options.executionRequest, options.targetUrl),
    response: createReadonlyResponseContext(
      options.responseStatus,
      options.responseHeaders,
      options.responseBodyText,
    ),
  };

  if (stageId === 'tests') {
    const testsApi = createTestsApi();
    return {
      context: {
        ...sharedContext,
        assert: testsApi.assert,
        test: testsApi.test,
      },
      consoleSink,
      summaryController,
      testsApi,
    };
  }

  return {
    context: sharedContext,
    consoleSink,
    summaryController,
    testsApi: null,
  };
}

async function executeScriptStageInProcess(payload = {}) {
  const stageId = payload.stageId || 'pre-request';
  const stageLabel = createStageLabel(stageId);
  const normalizedSource = typeof payload.scriptSource === 'string' ? payload.scriptSource.trim() : '';

  if (normalizedSource.length === 0) {
    return {
      outcome: 'skipped',
      summary: `No ${stageLabel} script was saved for this request.`,
      consoleEntries: [],
      consoleLogCount: 0,
      consoleWarningCount: 0,
      testResults: [],
    };
  }

  if (FORBIDDEN_SCRIPT_TOKEN_PATTERN.test(normalizedSource)) {
    const message = `${stageLabel} attempted to use a blocked runtime capability. Only bounded request, response, console, summary, and test helpers are available in this slice.`;
    return {
      outcome: 'blocked',
      summary: message,
      errorCode: 'script_capability_blocked',
      errorSummary: message,
      consoleEntries: [],
      consoleLogCount: 0,
      consoleWarningCount: 0,
      testResults: [],
    };
  }

  const executionRequest = cloneExecutionRequest(payload.executionRequest);
  const { context, consoleSink, summaryController, testsApi } = createScriptContext(stageId, {
    executionRequest,
    targetUrl: payload.targetUrl || null,
    responseStatus: payload.responseStatus ?? null,
    responseHeaders: Array.isArray(payload.responseHeaders) ? payload.responseHeaders : [],
    responseBodyText: typeof payload.responseBodyText === 'string' ? payload.responseBodyText : '',
  });

  try {
    const script = new vm.Script(normalizedSource, {
      displayErrors: true,
      filename: `${stageId}-script.js`,
    });
    const executionResult = script.runInNewContext(context, { timeout: SCRIPT_TIMEOUT_MS });

    if (executionResult && typeof executionResult.then === 'function') {
      await executionResult;
    }
  } catch (error) {
    if (error?.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || /timed out/i.test(error?.message || '')) {
      return {
        outcome: 'timed_out',
        summary: `${stageLabel} exceeded the bounded ${SCRIPT_TIMEOUT_MS} ms timeout.`,
        errorCode: 'script_timed_out',
        errorSummary: `${stageLabel} exceeded the bounded execution timeout.`,
        consoleEntries: [],
        consoleLogCount: 0,
        consoleWarningCount: 0,
        testResults: [],
      };
    }

    if (error instanceof ScriptStageExecutionError && error.stageStatus === 'blocked') {
      return {
        outcome: 'blocked',
        summary: error.message,
        errorCode: error.code,
        errorSummary: error.message,
        consoleEntries: consoleSink.previewEntries,
        consoleLogCount: consoleSink.entryCount,
        consoleWarningCount: consoleSink.warningCount,
        testResults: [],
      };
    }

    return {
      outcome: 'failed',
      summary: error instanceof Error ? error.message : `${stageLabel} failed.`,
      errorCode: error?.code || 'script_stage_failed',
      errorSummary: error instanceof Error ? error.message : `${stageLabel} failed.`,
      consoleEntries: consoleSink.previewEntries,
      consoleLogCount: consoleSink.entryCount,
      consoleWarningCount: consoleSink.warningCount,
      testResults: testsApi ? testsApi.readResults() : [],
    };
  }

  if (stageId === 'pre-request') {
    return {
      outcome: 'succeeded',
      summary: summaryController.readSummary() || 'Pre-request script completed before transport.',
      consoleEntries: consoleSink.previewEntries,
      consoleLogCount: consoleSink.entryCount,
      consoleWarningCount: consoleSink.warningCount,
      testResults: [],
      mutatedExecutionRequest: executionRequest,
    };
  }

  if (stageId === 'post-response') {
    return {
      outcome: 'succeeded',
      summary: summaryController.readSummary()
        || (consoleSink.entryCount > 0
          ? 'Post-response script completed and emitted bounded console diagnostics.'
          : 'Post-response script completed without derived diagnostics.'),
      consoleEntries: consoleSink.previewEntries,
      consoleLogCount: consoleSink.entryCount,
      consoleWarningCount: consoleSink.warningCount,
      testResults: [],
    };
  }

  const testResults = testsApi ? testsApi.readResults() : [];
  const failedAssertions = testResults.filter((result) => result.status === 'failed').length;
  const passedAssertions = testResults.filter((result) => result.status === 'passed').length;
  const testsSummary = failedAssertions > 0
    ? `${failedAssertions} assertion(s) failed in Tests.`
    : testResults.length > 0
      ? `${passedAssertions} assertion(s) passed in Tests.`
      : 'Tests script completed without recording assertions.';

  return {
    outcome: failedAssertions > 0 ? 'failed' : 'succeeded',
    summary: summaryController.readSummary() || testsSummary,
    ...(failedAssertions > 0
      ? {
        errorCode: 'script_assertion_failed',
        errorSummary: testsSummary,
      }
      : {}),
    consoleEntries: consoleSink.previewEntries,
    consoleLogCount: consoleSink.entryCount,
    consoleWarningCount: consoleSink.warningCount,
    testResults,
  };
}

module.exports = {
  FORBIDDEN_SCRIPT_TOKEN_PATTERN,
  SCRIPT_TIMEOUT_MS,
  executeScriptStageInProcess,
};
