const { SCRIPT_TIMEOUT_MS } = require('./execution-script-runtime');

const SCRIPT_CONSOLE_PREVIEW_LIMIT = 8;
const SCRIPT_MESSAGE_LIMIT = 240;

function createExecutionFlowService(dependencies) {
  const {
    cloneRows,
    cloneAuth,
    cloneScripts,
    normalizeText,
    requestScriptStageIds,
    runScriptStageInChildProcess,
  } = dependencies;

  function truncatePreview(value, maxLength = 400) {
    if (typeof value !== 'string') {
      return '';
    }

    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }

  function redactFreeformText(value) {
    const normalizedValue = typeof value === 'string' ? value : String(value ?? '');

    return truncatePreview(
      normalizedValue
        .replace(/(Bearer\s+)[^\s'"]+/gi, '$1[redacted]')
        .replace(/((?:token|secret|password|api[-_]?key)\s*[:=]\s*)[^\s,;]+/gi, '$1[redacted]'),
      SCRIPT_MESSAGE_LIMIT,
    );
  }

  function normalizeRowValueType(valueType) {
    return valueType === 'file' ? 'file' : 'text';
  }

  function isMultipartFileMethodSupported(method) {
    return method === 'POST' || method === 'PUT';
  }

  function createMultipartValidationError(code, message, details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
  }

  function cloneMultipartFilesByRowId(multipartFilesByRowId) {
    if (!multipartFilesByRowId || typeof multipartFilesByRowId !== 'object') {
      return {};
    }

    const cloned = {};

    for (const [rowId, files] of Object.entries(multipartFilesByRowId)) {
      if (!Array.isArray(files) || rowId.trim().length === 0) {
        continue;
      }

      const nextFiles = files
        .map((file) => {
          if (!file || typeof file !== 'object') {
            return null;
          }

          const normalizedBuffer = Buffer.isBuffer(file.buffer)
            ? Buffer.from(file.buffer)
            : file.buffer instanceof Uint8Array
              ? Buffer.from(file.buffer)
              : null;

          if (!normalizedBuffer) {
            return null;
          }

          return {
            name: typeof file.name === 'string' ? file.name : 'upload.bin',
            type: typeof file.type === 'string' && file.type.trim().length > 0
              ? file.type.trim()
              : 'application/octet-stream',
            buffer: normalizedBuffer,
          };
        })
        .filter(Boolean);

      if (nextFiles.length > 0) {
        cloned[rowId] = nextFiles;
      }
    }

    return cloned;
  }

  function createMultipartBlobPart(file, rowId, fileIndex) {
    const fileName = typeof file?.name === 'string' && file.name.trim().length > 0
      ? file.name.trim()
      : `${rowId || 'upload'}-${fileIndex + 1}.bin`;
    const fileType = typeof file?.type === 'string' && file.type.trim().length > 0
      ? file.type.trim()
      : 'application/octet-stream';

    return {
      blob: new Blob([file.buffer], { type: fileType }),
      fileName,
    };
  }

  function createExecutionRequestSeed(input) {
    return {
      id: input.id || null,
      workspaceId: input.workspaceId || null,
      name: input.name,
      method: input.method,
      url: input.url,
      selectedEnvironmentId: typeof input.selectedEnvironmentId === 'string' && input.selectedEnvironmentId.trim().length > 0
        ? input.selectedEnvironmentId.trim()
        : null,
      params: cloneRows(input.params),
      headers: cloneRows(input.headers),
      bodyMode: input.bodyMode || 'none',
      bodyText: input.bodyText || '',
      formBody: cloneRows(input.formBody),
      multipartBody: cloneRows(input.multipartBody, { allowFileValues: true, sanitizeFileValues: true }),
      multipartFilesByRowId: cloneMultipartFilesByRowId(input.multipartFilesByRowId),
      auth: cloneAuth(input.auth),
      scripts: cloneScripts(input.scripts),
      collectionId: input.collectionId || null,
      collectionName: input.collectionName || null,
      requestGroupId: input.requestGroupId || null,
      requestGroupName: input.requestGroupName || input.folderName || null,
    };
  }

  function normalizeScriptStageStatus(status) {
    switch (status) {
      case 'blocked':
        return 'Blocked';
      case 'timed_out':
        return 'Timed out';
      case 'failed':
        return 'Failed';
      case 'succeeded':
        return 'Succeeded';
      default:
        return 'Skipped';
    }
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

  function createFriendlyStageSummary(stageId, stageResult) {
    return {
      stageId,
      label: createStageLabel(stageId),
      status: normalizeScriptStageStatus(stageResult?.status),
      summary: stageResult?.summary || `${createStageLabel(stageId)} did not run.`,
      ...(stageResult?.errorCode ? { errorCode: stageResult.errorCode } : {}),
      ...(stageResult?.errorSummary ? { errorSummary: stageResult.errorSummary } : {}),
    };
  }

  function createStageStatusRecord(stageId, status, summary, options = {}) {
    return {
      stageId,
      status,
      summary: redactFreeformText(summary),
      ...(options.errorCode ? { errorCode: options.errorCode } : {}),
      ...(options.errorSummary ? { errorSummary: redactFreeformText(options.errorSummary) } : {}),
    };
  }

  function createEmptyScriptStageResult(stageId, summary) {
    return {
      ...createStageStatusRecord(stageId, 'skipped', summary),
      consoleEntries: [],
      consoleLogCount: 0,
      consoleWarningCount: 0,
      testResults: [],
    };
  }

  function createScriptStageTimeoutResult(stageId) {
    return {
      ...createStageStatusRecord(
        stageId,
        'timed_out',
        `${createStageLabel(stageId)} exceeded the bounded ${SCRIPT_TIMEOUT_MS} ms timeout.`,
        {
          errorCode: 'script_timed_out',
          errorSummary: `${createStageLabel(stageId)} exceeded the bounded execution timeout.`,
        },
      ),
      consoleEntries: [],
      consoleLogCount: 0,
      consoleWarningCount: 0,
      testResults: [],
    };
  }

  function createScriptStageBlockedResult(stageId, message, errorCode = 'script_capability_blocked') {
    return {
      ...createStageStatusRecord(stageId, 'blocked', message, {
        errorCode,
        errorSummary: message,
      }),
      consoleEntries: [],
      consoleLogCount: 0,
      consoleWarningCount: 0,
      testResults: [],
    };
  }

  function createScriptStageFailureResult(stageId, message, errorCode = 'script_stage_failed', consoleEntries = [], consoleWarningCount = 0) {
    return {
      ...createStageStatusRecord(stageId, 'failed', message, {
        errorCode,
        errorSummary: message,
      }),
      consoleEntries,
      consoleLogCount: consoleEntries.length,
      consoleWarningCount,
      testResults: [],
    };
  }

  async function executeScriptStage(stageId, scriptSource, options) {
    const childResult = await runScriptStageInChildProcess({
      stageId,
      scriptSource,
      executionRequest: options.executionRequest,
      target: options.target,
      responseStatus: options.responseStatus,
      responseHeaders: options.responseHeaders,
      responseBodyText: options.responseBodyText,
      signal: options.signal,
    });

    if (childResult.outcome === 'skipped') {
      return {
        stageResult: createEmptyScriptStageResult(
          stageId,
          childResult.summary || `No ${createStageLabel(stageId)} script was saved for this request.`,
        ),
        ...(childResult.mutatedExecutionRequest ? { executionRequest: childResult.mutatedExecutionRequest } : {}),
      };
    }

    if (childResult.outcome === 'timed_out') {
      return {
        stageResult: createScriptStageTimeoutResult(stageId),
      };
    }

    if (childResult.outcome === 'blocked' || childResult.outcome === 'cancelled') {
      return {
        stageResult: {
          ...createScriptStageBlockedResult(
            stageId,
            childResult.errorSummary
            || childResult.summary
            || `${createStageLabel(stageId)} was blocked before completion.`,
            childResult.errorCode || (childResult.outcome === 'cancelled' ? 'execution_cancelled' : 'script_capability_blocked'),
          ),
          consoleEntries: Array.isArray(childResult.consoleEntries) ? childResult.consoleEntries : [],
          consoleLogCount: Number(childResult.consoleLogCount || 0),
          consoleWarningCount: Number(childResult.consoleWarningCount || 0),
          testResults: Array.isArray(childResult.testResults) ? childResult.testResults : [],
        },
        ...(childResult.mutatedExecutionRequest ? { executionRequest: childResult.mutatedExecutionRequest } : {}),
      };
    }

    if (childResult.outcome === 'failed') {
      return {
        stageResult: {
          ...createScriptStageFailureResult(
            stageId,
            childResult.errorSummary || childResult.summary || `${createStageLabel(stageId)} failed.`,
            childResult.errorCode || 'script_stage_failed',
            Array.isArray(childResult.consoleEntries) ? childResult.consoleEntries : [],
            Number(childResult.consoleWarningCount || 0),
          ),
          consoleLogCount: Number(childResult.consoleLogCount || 0),
          testResults: Array.isArray(childResult.testResults) ? childResult.testResults : [],
        },
        ...(childResult.mutatedExecutionRequest ? { executionRequest: childResult.mutatedExecutionRequest } : {}),
      };
    }

    const baseStageResult = {
      ...createStageStatusRecord(
        stageId,
        stageId === 'tests'
          && Array.isArray(childResult.testResults)
          && childResult.testResults.some((result) => result.status === 'failed')
          ? 'failed'
          : 'succeeded',
        childResult.summary || `${createStageLabel(stageId)} completed.`,
        stageId === 'tests'
          && Array.isArray(childResult.testResults)
          && childResult.testResults.some((result) => result.status === 'failed')
          ? {
            errorCode: childResult.errorCode || 'script_assertion_failed',
            errorSummary: childResult.errorSummary || childResult.summary,
          }
          : {},
      ),
      consoleEntries: Array.isArray(childResult.consoleEntries) ? childResult.consoleEntries : [],
      consoleLogCount: Number(childResult.consoleLogCount || 0),
      consoleWarningCount: Number(childResult.consoleWarningCount || 0),
      testResults: Array.isArray(childResult.testResults) ? childResult.testResults : [],
    };

    return {
      stageResult: baseStageResult,
      ...(childResult.mutatedExecutionRequest ? { executionRequest: childResult.mutatedExecutionRequest } : {}),
    };
  }

  function createTransportStageResult(responseStatus, hostPathHint) {
    return createStageStatusRecord(
      'transport',
      'succeeded',
      `Transport completed with HTTP ${responseStatus} against ${hostPathHint}.`,
    );
  }

  function createTransportFailureStageResult(error) {
    return createStageStatusRecord('transport', 'failed', 'Transport failed before a response was received.', {
      errorCode: error?.code || error?.cause?.code || 'transport_failed',
      errorSummary: error?.message || 'Transport failed before a response was received.',
    });
  }

  function createTransportCancelledStageResult(reason = 'Transport was cancelled before a response was received.') {
    return createStageStatusRecord('transport', 'blocked', reason, {
      errorCode: 'execution_cancelled',
      errorSummary: reason,
    });
  }

  function createTransportSkippedStageResult(reason) {
    return createStageStatusRecord('transport', 'skipped', reason);
  }

  function createSkippedScriptStageAfterTransport(stageId, reason) {
    return createEmptyScriptStageResult(stageId, reason);
  }

  function createTransportBlockedStageResult(summary, errorCode, errorSummary) {
    return createStageStatusRecord('transport', 'blocked', summary, {
      ...(errorCode ? { errorCode } : {}),
      ...(errorSummary ? { errorSummary } : {}),
    });
  }

  function createResolvedEnvironmentLabel(environmentRecord) {
    return environmentRecord?.name || 'No environment selected';
  }

  function createLinkedScriptRunStageResult(error) {
    const stageId = requestScriptStageIds.includes(error?.details?.stageId)
      ? error.details.stageId
      : 'pre-request';
    const stageLabel = createStageLabel(stageId);
    const scriptName = normalizeText(error?.details?.savedScriptNameSnapshot) || normalizeText(error?.details?.savedScriptId) || 'linked saved script';
    const stageSummary = error?.code === 'request_linked_script_stage_mismatch'
      ? `${stageLabel} did not run because linked saved script "${scriptName}" no longer matches this stage type.`
      : `${stageLabel} did not run because linked saved script "${scriptName}" is missing.`;
    const skippedSummary = 'Run did not start because linked saved script validation failed before execution.';
    const stageResults = {
      'pre-request': createEmptyScriptStageResult('pre-request', stageId === 'pre-request' ? stageSummary : skippedSummary),
      transport: createTransportBlockedStageResult(
        'Transport did not run because linked saved script validation failed before execution started.',
        error?.code || 'request_linked_script_invalid',
        error?.message || stageSummary,
      ),
      'post-response': createSkippedScriptStageAfterTransport('post-response', stageId === 'post-response' ? stageSummary : skippedSummary),
      tests: createSkippedScriptStageAfterTransport('tests', stageId === 'tests' ? stageSummary : skippedSummary),
    };

    stageResults[stageId] = createStageStatusRecord(stageId, 'blocked', stageSummary, {
      errorCode: error?.code || 'request_linked_script_invalid',
      errorSummary: error?.message || stageSummary,
    });

    return stageResults;
  }

  function deriveExecutionOutcome(stageResults) {
    const normalizedResults = Object.values(stageResults || {}).filter(Boolean);

    if (normalizedResults.some((result) => result.errorCode === 'execution_cancelled')) {
      return 'Cancelled';
    }

    if (normalizedResults.some((result) => result.status === 'blocked')) {
      return 'Blocked';
    }

    if (normalizedResults.some((result) => result.status === 'timed_out')) {
      return 'Timed out';
    }

    if (normalizedResults.some((result) => result.status === 'failed')) {
      return 'Failed';
    }

    return 'Succeeded';
  }

  function createObservationConsoleSummary(stageResults, consoleEntries, warningCount) {
    if (consoleEntries.length === 0) {
      if (stageResults['post-response']?.status === 'succeeded') {
        return stageResults['post-response'].summary;
      }

      if (stageResults.tests?.status === 'failed') {
        return 'No console entries were captured. Tests failed without emitting bounded console output.';
      }

      return 'No console entries were captured. Script stages were skipped or completed without console output.';
    }

    return `${consoleEntries.length} console preview entr${consoleEntries.length === 1 ? 'y is' : 'ies are'} available${warningCount > 0 ? `, including ${warningCount} warning(s).` : '.'}`;
  }

  function createObservationTestsSummary(stageResults) {
    const testsResult = stageResults.tests;
    const testResults = Array.isArray(testsResult?.testResults) ? testsResult.testResults : [];
    const failedAssertions = testResults.filter((result) => result.status === 'failed').length;

    if (testResults.length === 0) {
      return testsResult?.summary || 'No tests were recorded for this run.';
    }

    if (failedAssertions > 0) {
      return `${failedAssertions} assertion(s) failed and ${testResults.length - failedAssertions} passed.`;
    }

    return `${testResults.length} assertion(s) passed.`;
  }

  function createObservationTestEntries(stageResults) {
    const testResults = Array.isArray(stageResults.tests?.testResults) ? stageResults.tests.testResults : [];

    return testResults.map((result) => `${result.status === 'passed' ? 'Passed' : 'Failed'}: ${result.name} - ${result.message}`);
  }

  function createObservationStageSummaries(stageResults) {
    return ['pre-request', 'transport', 'post-response', 'tests']
      .map((stageId) => {
        const stageResult = stageResults[stageId];
        return stageResult ? createFriendlyStageSummary(stageId, stageResult) : null;
      })
      .filter(Boolean);
  }

  function createCombinedConsoleEntries(stageResults) {
    return ['pre-request', 'post-response', 'tests']
      .flatMap((stageId) => Array.isArray(stageResults[stageId]?.consoleEntries) ? stageResults[stageId].consoleEntries : [])
      .slice(0, SCRIPT_CONSOLE_PREVIEW_LIMIT);
  }

  function countConsoleEntries(stageResults) {
    return ['pre-request', 'post-response', 'tests']
      .reduce((count, stageId) => count + Number(stageResults[stageId]?.consoleLogCount || 0), 0);
  }

  function countConsoleWarnings(stageResults) {
    return ['pre-request', 'post-response', 'tests']
      .reduce((count, stageId) => count + Number(stageResults[stageId]?.consoleWarningCount || 0), 0);
  }

  function createExecutionRequestTarget(url, params, auth) {
    const target = new URL(url);

    for (const row of params || []) {
      if (row && row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0) {
        target.searchParams.append(row.key, typeof row.value === 'string' ? row.value : '');
      }
    }

    if (auth?.type === 'api-key' && auth.apiKeyPlacement === 'query' && auth.apiKeyName && auth.apiKeyValue) {
      target.searchParams.append(auth.apiKeyName, auth.apiKeyValue);
    }

    return target;
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

  function createExecutionBody(request, headers) {
    const method = typeof request?.method === 'string' ? request.method.toUpperCase() : '';

    if (method === 'GET' || method === 'DELETE') {
      const hasEnabledMultipartFileRows = request.bodyMode === 'multipart-form-data'
        && Array.isArray(request.multipartBody)
        && request.multipartBody.some((row) => (
          row
          && row.enabled !== false
          && typeof row.key === 'string'
          && row.key.trim().length > 0
          && normalizeRowValueType(row.valueType) === 'file'
        ));

      if (hasEnabledMultipartFileRows) {
        throw createMultipartValidationError(
          'multipart_file_method_not_allowed',
          'Multipart file fields can run only with POST or PUT methods.',
          { method },
        );
      }

      return undefined;
    }

    if (request.bodyMode === 'none') {
      return undefined;
    }

    if (request.bodyMode === 'json') {
      const bodyText = typeof request.bodyText === 'string' ? request.bodyText : '';

      if (bodyText.trim().length === 0) {
        return undefined;
      }

      JSON.parse(bodyText);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return bodyText;
    }

    if (request.bodyMode === 'text') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'text/plain');
      }
      return request.bodyText || '';
    }

    if (request.bodyMode === 'form-urlencoded') {
      const params = new URLSearchParams();
      for (const row of request.formBody || []) {
        if (row && row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0) {
          params.append(row.key, typeof row.value === 'string' ? row.value : '');
        }
      }
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/x-www-form-urlencoded');
      }
      return params;
    }

    if (request.bodyMode === 'multipart-form-data') {
      const formData = new FormData();
      const multipartFilesByRowId = request?.multipartFilesByRowId || {};
      const method = typeof request?.method === 'string' ? request.method.toUpperCase() : '';

      for (const row of request.multipartBody || []) {
        if (!row || row.enabled === false || typeof row.key !== 'string') {
          continue;
        }

        const key = row.key.trim();
        if (key.length === 0) {
          continue;
        }

        if (normalizeRowValueType(row.valueType) === 'file') {
          if (!isMultipartFileMethodSupported(method)) {
            throw createMultipartValidationError(
              'multipart_file_method_not_allowed',
              'Multipart file fields can run only with POST or PUT methods.',
              { method },
            );
          }

          const rowId = typeof row.id === 'string' ? row.id.trim() : '';
          const files = rowId && Array.isArray(multipartFilesByRowId[rowId])
            ? multipartFilesByRowId[rowId]
            : [];

          if (files.length === 0) {
            throw createMultipartValidationError(
              'multipart_file_missing',
              `Multipart file field "${key}" is enabled but no files were attached.`,
              {
                rowId: rowId || null,
                key,
              },
            );
          }

          files.forEach((file, fileIndex) => {
            const { blob, fileName } = createMultipartBlobPart(file, rowId, fileIndex);
            formData.append(key, blob, fileName);
          });
          continue;
        }

        formData.append(key, typeof row.value === 'string' ? row.value : '');
      }
      headers.delete('Content-Type');
      return formData;
    }
    return undefined;
  }

  return {
    createLinkedScriptRunStageResult,
    createExecutionRequestSeed,
    createFriendlyStageSummary,
    createStageStatusRecord,
    createEmptyScriptStageResult,
    executeScriptStage,
    createTransportStageResult,
    createTransportFailureStageResult,
    createTransportCancelledStageResult,
    createTransportSkippedStageResult,
    createSkippedScriptStageAfterTransport,
    createTransportBlockedStageResult,
    createResolvedEnvironmentLabel,
    deriveExecutionOutcome,
    createObservationConsoleSummary,
    createObservationTestsSummary,
    createObservationTestEntries,
    createObservationStageSummaries,
    createCombinedConsoleEntries,
    countConsoleEntries,
    countConsoleWarnings,
    createExecutionRequestTarget,
    createExecutionHeaders,
    createExecutionBody,
  };
}

module.exports = {
  createExecutionFlowService,
};



