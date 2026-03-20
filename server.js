const express = require('express');
const path = require('path');
const vm = require('vm');
const fs = require('fs');
const { randomUUID } = require('node:crypto');
const { bootstrapPersistence } = require('./storage');

const app = express();
const PORT = 5671;
const persistence = bootstrapPersistence();
const resourceStorage = persistence.resourceStorage;
const runtimeStorage = persistence.runtimeStorage;

const clientDistPath = path.join(__dirname, 'client', 'dist');
const hasClientDist = fs.existsSync(clientDistPath);

app.use(express.static(path.join(__dirname, 'public')));

if (hasClientDist) {
  app.use('/app', express.static(clientDistPath));

  app.get(['/app', '/app/*'], (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get(['/app', '/app/*'], (req, res) => {
    res.status(503).send(
      'The React client shell is available through the Vite dev server during S1. Build the client to enable the /app coexistence entrypoint.',
    );
  });
}

function sendData(res, data, status = 200) {
  res.status(status).json({
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

function sendError(res, status, code, message, details = {}, retryable = false) {
  res.status(status).json({
    error: {
      code,
      message,
      details,
      retryable,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

function cloneRows(rows = []) {
  return rows.map((row) => ({
    id: row.id || randomUUID(),
    key: typeof row.key === 'string' ? row.key : '',
    value: typeof row.value === 'string' ? row.value : '',
    enabled: row.enabled !== false,
  }));
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

function cloneScripts(scripts = {}) {
  return {
    activeStage: scripts.activeStage || 'pre-request',
    preRequest: scripts.preRequest || '',
    postResponse: scripts.postResponse || '',
    tests: scripts.tests || '',
  };
}

function createRequestSummary(method, url) {
  return typeof url === 'string' && url.trim().length > 0 ? `${method} ${url}` : `${method} request definition`;
}

function validateRequestDefinition(input) {
  if (!input || typeof input !== 'object') {
    return 'Request payload is required.';
  }

  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    return 'Request name is required.';
  }

  if (typeof input.method !== 'string' || input.method.trim().length === 0) {
    return 'Request method is required.';
  }

  if (typeof input.url !== 'string' || input.url.trim().length === 0) {
    return 'Request URL is required.';
  }

  return null;
}

function normalizeSavedRequest(input, existingRecord, workspaceId) {
  const now = new Date().toISOString();
  const recordId = input.id || existingRecord?.id || randomUUID();
  const collectionName = input.collectionName || existingRecord?.collectionName || 'Saved Requests';

  return {
    id: recordId,
    workspaceId,
    name: input.name.trim(),
    method: input.method,
    url: input.url,
    params: cloneRows(input.params),
    headers: cloneRows(input.headers),
    bodyMode: input.bodyMode || 'none',
    bodyText: input.bodyText || '',
    formBody: cloneRows(input.formBody),
    multipartBody: cloneRows(input.multipartBody),
    auth: cloneAuth(input.auth),
    scripts: cloneScripts(input.scripts),
    collectionName,
    ...(input.folderName ? { folderName: input.folderName } : {}),
    summary: createRequestSummary(input.method, input.url),
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
  };
}

function createExecutionObservation({
  executionId,
  executionOutcome,
  responseStatus,
  responseHeaders,
  responseBodyPreview,
  responsePreviewLength,
  responsePreviewTruncated,
  startedAt,
  completedAt,
  durationMs,
  requestSnapshot,
  errorCode,
  errorSummary,
}) {
  const requestParamCount = Array.isArray(requestSnapshot?.params) ? requestSnapshot.params.length : 0;
  const requestHeaderCount = Array.isArray(requestSnapshot?.headers) ? requestSnapshot.headers.length : 0;

  return {
    executionId,
    executionOutcome,
    responseStatus,
    responseStatusLabel: responseStatus === null ? 'No response' : `HTTP ${responseStatus}`,
    responseHeaders,
    responseHeadersSummary:
      responseHeaders.length > 0
        ? `${responseHeaders.length} response headers captured from the latest run.`
        : 'No response headers were captured.',
    responseBodyPreview,
    responseBodyHint:
      responseBodyPreview.length > 0
        ? `${responseBodyPreview.length} characters captured from the latest run preview.`
        : 'No response body preview was captured.',
    responsePreviewSizeLabel:
      typeof responsePreviewLength === 'number' && responsePreviewLength > 0
        ? `${responsePreviewLength} B response body`
        : createPreviewSizeLabel(
            responseBodyPreview,
            responseStatus === null ? 'No preview stored' : 'Empty preview',
          ),
    responsePreviewPolicy: createResponsePreviewPolicy({
      preview: responseBodyPreview,
      redactionApplied: false,
      previewTruncated: responsePreviewTruncated,
      absentSummary: executionOutcome === 'Failed'
        ? 'No response preview is available because the run failed before transport completed.'
        : 'No response preview is available for this execution.',
    }),
    startedAt,
    completedAt,
    durationMs,
    consoleSummary: 'No console entries were captured. Script execution is not wired yet.',
    consoleEntries: [],
    consoleLogCount: 0,
    consoleWarningCount: 0,
    testsSummary: 'No tests ran. Script execution is not wired yet.',
    testEntries: [],
    requestSnapshotSummary: createRequestSnapshotSummary(requestSnapshot),
    requestInputSummary: createRequestInputSummary(requestSnapshot),
    requestHeaderCount,
    requestParamCount,
    requestBodyMode: requestSnapshot?.bodyMode || 'none',
    authSummary: createAuthSummary(requestSnapshot?.auth),
    ...(errorCode ? { errorCode } : {}),
    ...(errorSummary ? { errorSummary } : {}),
  };
}

const SENSITIVE_FIELD_PATTERN = /authorization|cookie|token|secret|password|api[-_]?key|session|credential|bearer/i;

function truncatePreview(value, maxLength = 400) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
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

function createSanitizedRows(rows = []) {
  return (rows || [])
    .filter((row) => row && row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0)
    .map((row) => ({
      key: row.key,
      value: sanitizeFieldValue(row.key, typeof row.value === 'string' ? row.value : ''),
    }));
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

function createPersistedBodyPreview(request) {
  switch (request.bodyMode) {
    case 'json': {
      const bodyText = typeof request.bodyText === 'string' ? request.bodyText.trim() : '';

      if (bodyText.length === 0) {
        return '';
      }

      try {
        const parsedJson = JSON.parse(bodyText);
        return truncatePreview(JSON.stringify(redactStructuredJson(parsedJson), null, 2), 2000);
      } catch {
        return 'JSON body preview is unavailable because the persisted runtime snapshot keeps only bounded redacted summaries.';
      }
    }
    case 'text':
      return typeof request.bodyText === 'string' && request.bodyText.trim().length > 0
        ? 'Text body preview is omitted by redacted-only runtime persistence.'
        : '';
    case 'form-urlencoded':
      return createSanitizedRows(request.formBody)
        .map((row) => `${row.key}=${row.value}`)
        .join('\n');
    case 'multipart-form-data':
      return createSanitizedRows(request.multipartBody)
        .map((row) => `${row.key}=${row.value}`)
        .join('\n');
    default:
      return '';
  }
}

function createPersistedAuthSnapshot(auth = {}) {
  const type = auth.type || 'none';

  if (type === 'bearer') {
    return {
      type,
      bearerToken: auth.bearerToken ? '[redacted]' : '',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    };
  }

  if (type === 'basic') {
    return {
      type,
      bearerToken: '',
      basicUsername: auth.basicUsername ? truncatePreview(auth.basicUsername, 120) : '',
      basicPassword: auth.basicPassword ? '[redacted]' : '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    };
  }

  if (type === 'api-key') {
    return {
      type,
      bearerToken: '',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: auth.apiKeyName || '',
      apiKeyValue: auth.apiKeyValue ? '[redacted]' : '',
      apiKeyPlacement: auth.apiKeyPlacement || 'header',
    };
  }

  return {
    type: 'none',
    bearerToken: '',
    basicUsername: '',
    basicPassword: '',
    apiKeyName: '',
    apiKeyValue: '',
    apiKeyPlacement: 'header',
  };
}

function createPersistedRequestSnapshot(request, targetUrl) {
  const persistedUrl = new URL(targetUrl.toString());
  const persistedParams = Array.from(persistedUrl.searchParams.entries()).map(([key, value]) => ({
    key,
    value: sanitizeFieldValue(key, value),
  }));
  const persistedSearch = new URLSearchParams();

  for (const row of persistedParams) {
    persistedSearch.append(row.key, row.value);
  }

  persistedUrl.search = persistedSearch.toString();
  persistedUrl.hash = '';

  return {
    name: typeof request.name === 'string' && request.name.trim().length > 0
      ? request.name.trim()
      : createRequestSummary(request.method, request.url),
    method: request.method,
    url: persistedUrl.toString(),
    params: persistedParams,
    headers: createSanitizedRows(request.headers),
    bodyMode: request.bodyMode || 'none',
    bodyText: createPersistedBodyPreview(request),
    auth: createPersistedAuthSnapshot(request.auth),
    sourceLabel: request.id ? 'Saved request snapshot' : 'Ad hoc request snapshot',
  };
}

function createPreviewSizeLabel(preview, emptyLabel = 'No preview stored') {
  if (typeof preview !== 'string' || preview.length === 0) {
    return emptyLabel;
  }

  return `${Buffer.byteLength(preview, 'utf8')} B preview`;
}

function createBodyModeSummary(bodyMode) {
  switch (bodyMode) {
    case 'json':
      return 'JSON body';
    case 'text':
      return 'Text body';
    case 'form-urlencoded':
      return 'Form body';
    case 'multipart-form-data':
      return 'Multipart body';
    default:
      return 'No body';
  }
}

function createAuthSummary(auth = createPersistedAuthSnapshot()) {
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

function createRequestInputSummary(requestSnapshot = {}) {
  const paramsCount = Array.isArray(requestSnapshot?.params) ? requestSnapshot.params.length : 0;
  const headerCount = Array.isArray(requestSnapshot?.headers) ? requestSnapshot.headers.length : 0;
  return `${paramsCount} params · ${headerCount} headers · ${createBodyModeSummary(requestSnapshot?.bodyMode)} · ${createAuthSummary(requestSnapshot?.auth)}`;
}

function createRequestSnapshotSummary(requestSnapshot = {}) {
  const method = typeof requestSnapshot?.method === 'string' && requestSnapshot.method.length > 0
    ? requestSnapshot.method
    : 'GET';
  const url = typeof requestSnapshot?.url === 'string' && requestSnapshot.url.length > 0
    ? requestSnapshot.url
    : 'request snapshot unavailable';
  const sourceLabel = typeof requestSnapshot?.sourceLabel === 'string' && requestSnapshot.sourceLabel.length > 0
    ? requestSnapshot.sourceLabel.toLowerCase()
    : 'request snapshot';

  return `${method} ${url} executed from ${sourceLabel} with ${createRequestInputSummary(requestSnapshot)}.`;
}

function createResponsePreviewPolicy({
  preview,
  redactionApplied,
  previewTruncated,
  absentSummary,
}) {
  if (typeof preview !== 'string' || preview.length === 0) {
    return absentSummary || 'No response preview is available.';
  }

  if (previewTruncated) {
    return 'Preview was truncated at the bounded diagnostics limit before richer inspection is added.';
  }

  if (redactionApplied) {
    return 'Preview is bounded and redacted before persistence and downstream diagnostics surfaces.';
  }

  return 'Preview is bounded before richer diagnostics and raw payload inspection are added.';
}

function createCaptureBodyPreviewPolicy(preview, wasRedacted) {
  if (typeof preview !== 'string' || preview.length === 0) {
    return 'No request body preview was persisted for this capture.';
  }

  return wasRedacted
    ? 'Captured request body preview is redacted and bounded before persistence.'
    : 'Captured request body preview is bounded before persistence.';
}

function createCaptureStorageSummary(headerCount, bodyPreview) {
  if (typeof bodyPreview === 'string' && bodyPreview.length > 0) {
    return `Persisted capture keeps ${headerCount} header(s) and a bounded request-body preview for observation and replay.`;
  }

  return `Persisted capture keeps ${headerCount} header(s) and no request body preview for this inbound request.`;
}

function createExecutionOutcomeLabel(status, cancellationOutcome) {
  switch (status) {
    case 'succeeded':
      return 'Succeeded';
    case 'timed_out':
      return 'Timed out';
    case 'cancelled':
      return 'Cancelled';
    case 'blocked':
      return 'Blocked';
    default:
      return cancellationOutcome === 'blocked' ? 'Blocked' : 'Failed';
  }
}

function createTransportOutcomeLabel(responseStatus, executionOutcome) {
  if (responseStatus === 200) {
    return '200 OK';
  }

  if (responseStatus === 404) {
    return '404 Not Found';
  }

  if (responseStatus === 503) {
    return '503 Service Unavailable';
  }

  if (typeof responseStatus === 'number') {
    return `HTTP ${responseStatus}`;
  }

  return executionOutcome === 'Blocked' ? 'Blocked before transport' : 'No response';
}

function createTestSummary(assertionCount, failedAssertions, skippedAssertions) {
  if (assertionCount === 0 && skippedAssertions > 0) {
    return {
      outcome: 'Tests skipped',
      label: 'Tests skipped',
      summary: 'Tests were skipped before a persisted assertion summary was recorded.',
      preview: ['Tests were skipped before persisted assertions were available.'],
    };
  }

  if (assertionCount === 0) {
    return {
      outcome: 'No tests',
      label: 'No tests persisted',
      summary: 'No persisted test assertions are available for this execution.',
      preview: ['No persisted test assertions are available for this execution.'],
    };
  }

  if (failedAssertions > 0) {
    return {
      outcome: 'Some tests failed',
      label: `${failedAssertions} / ${assertionCount} tests failed`,
      summary: 'Persisted assertion summary shows at least one failed test.',
      preview: [`${assertionCount - failedAssertions} assertions passed.`, `${failedAssertions} assertions failed.`],
    };
  }

  return {
    outcome: 'All tests passed',
    label: `${assertionCount} / ${assertionCount} tests passed`,
    summary: 'All persisted assertions passed.',
    preview: ['All persisted assertions passed.'],
  };
}

function createHostPathHint(url) {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.host}${parsedUrl.pathname}`;
  } catch {
    return url;
  }
}

function createHistoryTimelineEntries(historyRecord) {
  const transportSummary = historyRecord.transportStatusCode === null
    ? 'No persisted transport response was recorded for this execution.'
    : `Persisted transport summary recorded ${historyRecord.transportOutcome}.`;

  const entries = [
    {
      id: `${historyRecord.executionId}-prepared`,
      title: 'Request prepared',
      summary: `Prepared ${historyRecord.method} ${historyRecord.hostPathHint} from a redacted request snapshot.`,
    },
    {
      id: `${historyRecord.executionId}-transport`,
      title: historyRecord.transportStatusCode === null ? 'Transport summary' : 'Transport completed',
      summary: transportSummary,
    },
  ];

  if (historyRecord.assertionCount > 0) {
    entries.push({
      id: `${historyRecord.executionId}-tests`,
      title: 'Tests completed',
      summary: historyRecord.testsSummary,
    });
  }

  entries.push({
    id: `${historyRecord.executionId}-finalized`,
    title: 'Result finalized',
    summary: 'Persisted history keeps redacted response, console, tests, and execution metadata summaries.',
  });

  return entries;
}

function createHistoryRecord(runtimeRecord) {
  const requestSnapshot = runtimeRecord.requestSnapshot || {};
  const method = typeof requestSnapshot.method === 'string' && requestSnapshot.method.length > 0
    ? requestSnapshot.method
    : 'GET';
  const url = typeof requestSnapshot.url === 'string' && requestSnapshot.url.length > 0
    ? requestSnapshot.url
    : 'http://localhost/request-snapshot-unavailable';
  const requestLabel = typeof requestSnapshot.name === 'string' && requestSnapshot.name.length > 0
    ? requestSnapshot.name
    : `${method} request`;
  const executionOutcome = createExecutionOutcomeLabel(runtimeRecord.status, runtimeRecord.cancellationOutcome);
  const transportOutcome = createTransportOutcomeLabel(runtimeRecord.responseStatus, executionOutcome);
  const responseHeaders = Array.isArray(runtimeRecord.responseHeaders) ? runtimeRecord.responseHeaders : [];
  const requestParams = Array.isArray(requestSnapshot.params) ? requestSnapshot.params : [];
  const requestHeaders = Array.isArray(requestSnapshot.headers) ? requestSnapshot.headers : [];
  const responseBodyPreview = typeof runtimeRecord.responseBodyPreview === 'string' ? runtimeRecord.responseBodyPreview : '';
  const consoleLogCount = Number(runtimeRecord.logSummary?.consoleEntries || 0);
  const consoleWarningCount = Number(runtimeRecord.logSummary?.consoleWarnings || runtimeRecord.logSummary?.warnings || 0);
  const tests = createTestSummary(
    runtimeRecord.assertionCount,
    runtimeRecord.failedAssertions,
    runtimeRecord.skippedAssertions,
  );

  const historyRecord = {
    id: runtimeRecord.executionId,
    executionId: runtimeRecord.executionId,
    requestLabel,
    method,
    url,
    hostPathHint: createHostPathHint(url),
    executedAtLabel: runtimeRecord.completedAt || runtimeRecord.startedAt,
    durationLabel:
      typeof runtimeRecord.durationMs === 'number'
        ? `${runtimeRecord.durationMs} ms`
        : 'No persisted duration',
    durationMs: typeof runtimeRecord.durationMs === 'number' ? runtimeRecord.durationMs : 0,
    executionOutcome,
    transportOutcome,
    transportStatusCode: runtimeRecord.responseStatus ?? null,
    testOutcome: tests.outcome,
    testSummaryLabel: tests.label,
    requestSnapshotSummary: createRequestSnapshotSummary(requestSnapshot),
    requestInputSummary: createRequestInputSummary(requestSnapshot),
    requestParamCount: requestParams.length,
    requestHeaderCount: requestHeaders.length,
    requestParams,
    requestHeaders,
    requestBodyMode: requestSnapshot.bodyMode || 'none',
    requestBodyText: requestSnapshot.bodyText || '',
    requestAuth: requestSnapshot.auth || createPersistedAuthSnapshot(),
    responseSummary:
      runtimeRecord.responseStatus === null
        ? 'Persisted history does not include a transport response body for this execution.'
        : `Persisted history captured ${transportOutcome} and a bounded response preview.`,
    headersSummary:
      responseHeaders.length > 0
        ? `${responseHeaders.length} response headers persisted in redacted summary form.`
        : 'No response headers were persisted for this execution.',
    bodyHint:
      responseBodyPreview.length > 0
        ? `${responseBodyPreview.length} characters captured from the persisted response preview.`
        : 'No response body preview was persisted for this execution.',
    bodyPreview:
      responseBodyPreview.length > 0
        ? responseBodyPreview
        : 'No persisted response body preview is available for this execution.',
    responsePreviewSizeLabel: createPreviewSizeLabel(
      responseBodyPreview,
      runtimeRecord.responseStatus === null ? 'No persisted preview' : 'Empty preview',
    ),
    responsePreviewPolicy: createResponsePreviewPolicy({
      preview: responseBodyPreview,
      redactionApplied: runtimeRecord.redactionApplied || runtimeRecord.responseBodyRedacted,
      previewTruncated: responseBodyPreview.length >= 4000,
      absentSummary: 'No response preview was persisted for this execution.',
    }),
    consoleSummary:
      consoleLogCount > 0
        ? `${consoleLogCount} persisted console summaries are available${consoleWarningCount > 0 ? `, including ${consoleWarningCount} warning(s).` : '.'}`
        : 'No console entries were persisted. Live script-linked console remains deferred.',
    consolePreview: [],
    consoleLogCount,
    consoleWarningCount,
    testsSummary: tests.summary,
    assertionCount: runtimeRecord.assertionCount,
    passedAssertions: runtimeRecord.passedAssertions,
    failedAssertions: runtimeRecord.failedAssertions,
    testsPreview: tests.preview,
    startedAtLabel: runtimeRecord.startedAt,
    completedAtLabel: runtimeRecord.completedAt || runtimeRecord.startedAt,
    environmentLabel: runtimeRecord.environmentId || 'No environment persisted',
    sourceLabel: requestSnapshot.sourceLabel || 'Runtime request snapshot',
    errorCode: runtimeRecord.errorCode || null,
    errorSummary: runtimeRecord.errorMessage || 'No execution error was reported.',
    timelineEntries: [],
  };

  historyRecord.timelineEntries = createHistoryTimelineEntries(historyRecord);
  return historyRecord;
}

function formatCaptureReceivedAtLabel(receivedAtIso) {
  return new Date(receivedAtIso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function createSanitizedCaptureHeaders(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => {
      const normalizedValue = Array.isArray(value) ? value.join(', ') : String(value ?? '');
      return [key, sanitizeFieldValue(key, normalizedValue)];
    }),
  );
}

function createCapturedRequestBodyMode(contentType, parsedBody, rawBody) {
  const normalizedContentType = String(contentType || '').toLowerCase();
  const normalizedRawBody = typeof rawBody === 'string' ? rawBody.trim() : '';

  if (normalizedRawBody.length === 0 || normalizedRawBody === 'No Body or Binary') {
    return 'none';
  }

  if (normalizedContentType.includes('application/x-www-form-urlencoded')) {
    return 'text';
  }

  if (parsedBody && typeof parsedBody === 'object') {
    return 'json';
  }

  return normalizedContentType.includes('json') ? 'json' : 'text';
}

function createCapturedRequestBodyPreview(parsedBody, rawBody, contentType) {
  const normalizedContentType = String(contentType || '').toLowerCase();
  const normalizedRawBody = typeof rawBody === 'string' ? rawBody.trim() : '';

  if (normalizedRawBody.length === 0 || normalizedRawBody === 'No Body or Binary') {
    return '';
  }

  if (normalizedContentType.includes('application/x-www-form-urlencoded')) {
    const bodyEntries = parsedBody && typeof parsedBody === 'object'
      ? Object.entries(parsedBody)
      : Array.from(new URLSearchParams(normalizedRawBody).entries());

    return bodyEntries
      .map(([key, value]) => `${key}=${sanitizeFieldValue(key, String(value ?? ''))}`)
      .join('\n');
  }

  if (parsedBody && typeof parsedBody === 'object') {
    return truncatePreview(JSON.stringify(redactStructuredJson(parsedBody), null, 2), 2000);
  }

  if (normalizedContentType.includes('application/json')) {
    try {
      const parsedJson = JSON.parse(normalizedRawBody);
      return truncatePreview(JSON.stringify(redactStructuredJson(parsedJson), null, 2), 2000);
    } catch {
      return 'JSON body preview is unavailable because runtime persistence keeps only bounded redacted summaries.';
    }
  }

  return 'Text body preview is omitted by redacted-only runtime persistence.';
}

function createPersistedCapturedRequestRecord(req) {
  const receivedAt = new Date().toISOString();
  const host = req.get('host') || 'localhost';
  const fullUrl = new URL(req.originalUrl, `${req.protocol}://${host}`).toString();
  const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : '');
  const contentType = req.headers['content-type'] || '';
  const sanitizedHeaders = createSanitizedCaptureHeaders(req.headers);
  const requestBodyMode = createCapturedRequestBodyMode(contentType, req.body, rawBody);

  return {
    id: randomUUID(),
    workspaceId: null,
    method: req.method.toUpperCase(),
    url: fullUrl,
    path: req.originalUrl,
    statusCode: Number(mockConfig.statusCode),
    matchedMockRuleId: null,
    requestHeadersJson: JSON.stringify(sanitizedHeaders),
    requestBodyPreview: createCapturedRequestBodyPreview(req.body, rawBody, contentType),
    requestBodyRedacted: true,
    receivedAt,
    mockOutcome: 'Mocked',
    scopeLabel: 'All runtime captures',
    requestBodyMode,
  };
}

function createCaptureBodyHint(bodyModeHint, bodyPreview) {
  if (bodyModeHint === 'json' && bodyPreview.length > 0) {
    return `JSON body · ${bodyPreview.length} characters captured in bounded summary form.`;
  }

  if (bodyModeHint === 'text' && bodyPreview.length > 0) {
    return 'Text body · bounded redacted summary';
  }

  return 'No request body payload was persisted for this capture.';
}

function createCaptureHeadersSummary(headers) {
  const headerNames = Object.keys(headers || {});
  const contentType = headers['content-type'] || headers['Content-Type'];

  if (headerNames.length === 0) {
    return 'No headers were persisted for this capture.';
  }

  if (contentType) {
    return `${headerNames.length} header(s) · ${contentType}`;
  }

  return `${headerNames.length} header(s) observed`;
}

function createCaptureMockSummary(mockOutcome, statusCode, matchedMockRuleId) {
  if (mockOutcome === 'Mocked' && matchedMockRuleId) {
    return `Matched runtime mock rule ${matchedMockRuleId} and returned HTTP ${statusCode ?? 200}.`;
  }

  if (mockOutcome === 'Mocked') {
    return `Returned a local mock response with HTTP ${statusCode ?? 200}.`;
  }

  if (mockOutcome === 'Blocked') {
    return 'The runtime blocked response generation before a fallback response completed.';
  }

  if (mockOutcome === 'No rule matched') {
    return 'No enabled rule matched this capture, so the runtime fell back without richer diagnostics.';
  }

  return 'The runtime bypassed mock handling and continued through the fallback path.';
}

function createCaptureResponseSummary(mockOutcome, statusCode) {
  if (mockOutcome === 'Mocked') {
    return `Response handling stayed inside the local mock path and returned HTTP ${statusCode ?? 200}.`;
  }

  if (mockOutcome === 'Blocked') {
    return 'The runtime blocked response generation before a mock or fallback response could complete.';
  }

  if (mockOutcome === 'No rule matched') {
    return 'No rule matched, so response handling fell back without richer transport detail in this slice.';
  }

  return 'The runtime let this request continue through the fallback handling path.';
}

function createCaptureTimelineEntries(captureRecord) {
  return [
    {
      id: `${captureRecord.id}-received`,
      title: 'Request received',
      summary: `${captureRecord.method} ${captureRecord.path} was captured at ${captureRecord.receivedAtLabel}.`,
    },
    {
      id: `${captureRecord.id}-mock`,
      title: 'Mock evaluation summary',
      summary: captureRecord.mockSummary,
    },
    {
      id: `${captureRecord.id}-response`,
      title: 'Response handling summary',
      summary: captureRecord.responseSummary,
    },
  ];
}

function createCapturedRequestRecord(runtimeRecord) {
  const normalizedUrl = new URL(runtimeRecord.url);
  const requestHeaders = runtimeRecord.requestHeaders || {};
  const requestHeadersEntries = Object.entries(requestHeaders).map(([key, value]) => ({ key, value }));
  const requestHeaderCount = requestHeadersEntries.length;
  const requestBodyPreview = runtimeRecord.requestBodyPreview || '';
  const bodyModeHint = runtimeRecord.requestBodyMode === 'json' ? 'json' : runtimeRecord.requestBodyMode === 'text' ? 'text' : 'none';
  const mockOutcome = runtimeRecord.mockOutcome || 'Mocked';
  const receivedAtIso = runtimeRecord.receivedAt;
  const receivedAtLabel = formatCaptureReceivedAtLabel(receivedAtIso);
  const host = normalizedUrl.host;
  const path = runtimeRecord.path || `${normalizedUrl.pathname}${normalizedUrl.search}`;
  const mockSummary = createCaptureMockSummary(mockOutcome, runtimeRecord.statusCode, runtimeRecord.matchedMockRuleId);
  const responseSummary = createCaptureResponseSummary(mockOutcome, runtimeRecord.statusCode);

  const captureRecord = {
    id: runtimeRecord.id,
    method: runtimeRecord.method,
    url: normalizedUrl.toString(),
    host,
    path,
    receivedAtIso,
    receivedAtLabel,
    statusCode: runtimeRecord.statusCode ?? null,
    bodyHint: createCaptureBodyHint(bodyModeHint, requestBodyPreview),
    requestSummary: `${runtimeRecord.method} ${path} reached ${host} as an inbound capture.`,
    headersSummary: createCaptureHeadersSummary(requestHeaders),
    bodyPreview: requestBodyPreview.length > 0
      ? requestBodyPreview
      : 'No request body payload was captured for this request.',
    bodyPreviewPolicy: createCaptureBodyPreviewPolicy(requestBodyPreview, runtimeRecord.requestBodyRedacted),
    storageSummary: createCaptureStorageSummary(requestHeaderCount, requestBodyPreview),
    bodyModeHint,
    requestHeaders: requestHeadersEntries,
    requestHeaderCount,
    mockOutcome,
    mockSummary,
    responseSummary,
    scopeLabel: runtimeRecord.scopeLabel || 'All runtime captures',
    timelineEntries: [],
    ...(runtimeRecord.matchedMockRuleId ? { mockRuleName: runtimeRecord.matchedMockRuleId } : {}),
  };

  captureRecord.timelineEntries = createCaptureTimelineEntries(captureRecord);
  return captureRecord;
}

function createCaptureEventPayload(captureRecord) {
  const parsedHeaders = Object.fromEntries(
    captureRecord.requestHeaders.map((header) => [header.key, header.value]),
  );

  return {
    id: captureRecord.id,
    method: captureRecord.method,
    url: captureRecord.url,
    receivedAtIso: captureRecord.receivedAtIso,
    statusCode: captureRecord.statusCode,
    parsedHeaders,
    rawBody: captureRecord.bodyPreview,
    mockOutcome: captureRecord.mockOutcome,
    mockRuleName: captureRecord.mockRuleName,
    workspaceLabel: captureRecord.scopeLabel,
  };
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
  if (request.method === 'GET' || request.method === 'DELETE') {
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
    for (const row of request.multipartBody || []) {
      if (row && row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0) {
        formData.append(row.key, typeof row.value === 'string' ? row.value : '');
      }
    }
    headers.delete('Content-Type');
    return formData;
  }

  return undefined;
}

let clients = [];
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  clients.push(res);
  req.on('close', () => {
    clients = clients.filter((c) => c !== res);
  });
});

const captureRawBody = (req, res, buf) => {
  req.rawBody = buf.toString();
};
app.use(express.json({ verify: captureRawBody }));
app.use(express.urlencoded({ extended: true, verify: captureRawBody }));
app.use(express.text({ type: '*/*' }));

app.get('/api/workspaces/:workspaceId/requests', (req, res) => {
  try {
    const items = resourceStorage
      .list('request')
      .filter((record) => record.workspaceId === req.params.workspaceId)
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));

    return sendData(res, { items });
  } catch (error) {
    return sendError(res, 500, 'request_list_failed', error.message);
  }
});

app.post('/api/workspaces/:workspaceId/requests', (req, res) => {
  const input = req.body?.request;
  const validationError = validateRequestDefinition(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_request_definition', validationError);
  }

  try {
    const existingRecord = input.id ? resourceStorage.read('request', input.id) : null;
    const record = normalizeSavedRequest(input, existingRecord, req.params.workspaceId);
    resourceStorage.save('request', record);
    return sendData(res, { request: record });
  } catch (error) {
    return sendError(res, 500, 'request_save_failed', error.message);
  }
});

app.post('/api/executions/run', async (req, res) => {
  const input = req.body?.request;
  const validationError = validateRequestDefinition(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_request_execution', validationError);
  }

  const executionId = randomUUID();
  const startedAt = new Date().toISOString();
  const startedAtMs = Date.now();

  try {
    const target = createExecutionRequestTarget(input.url, input.params, input.auth);
    const headers = createExecutionHeaders(input.headers, input.auth);
    const body = createExecutionBody(input, headers);
    const requestSnapshot = createPersistedRequestSnapshot(input, target);
    const response = await fetch(target.toString(), {
      method: input.method,
      headers,
      ...(body !== undefined ? { body } : {}),
    });

    const responseBodyText = await response.text();
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAtMs;
    const responseHeaders = Array.from(response.headers.entries()).map(([name, value]) => ({ name, value }));
    const execution = createExecutionObservation({
      executionId,
      executionOutcome: 'Succeeded',
      responseStatus: response.status,
      responseHeaders,
      responseBodyPreview: responseBodyText.slice(0, 4000),
      responsePreviewLength: Buffer.byteLength(responseBodyText, 'utf8'),
      responsePreviewTruncated: responseBodyText.length > 4000,
      startedAt,
      completedAt,
      durationMs,
      requestSnapshot,
    });

    runtimeStorage.insertExecutionHistory({
      id: executionId,
      workspaceId: input.workspaceId || null,
      requestId: input.id || null,
      environmentId: null,
      status: 'succeeded',
      cancellationOutcome: null,
      startedAt,
      completedAt,
      durationMs,
      errorCode: null,
      errorMessage: null,
    });
    runtimeStorage.insertExecutionResult({
      executionId,
      responseStatus: response.status,
      responseHeadersJson: JSON.stringify(responseHeaders),
      responseBodyPreview: execution.responseBodyPreview,
      responseBodyRedacted: true,
      stageStatusJson: JSON.stringify({ scripts: 'deferred', tests: 'deferred' }),
      logSummaryJson: JSON.stringify({ consoleEntries: 0, tests: 0 }),
      requestSnapshotJson: JSON.stringify(requestSnapshot),
      redactionApplied: true,
    });

    return sendData(res, { execution });
  } catch (error) {
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAtMs;
    let requestSnapshot = {};
    let requestSnapshotJson = '{}';

    try {
      const failureTarget = createExecutionRequestTarget(input.url, input.params, input.auth);
      requestSnapshot = createPersistedRequestSnapshot(input, failureTarget);
      requestSnapshotJson = JSON.stringify(requestSnapshot);
    } catch {
      requestSnapshot = {};
      requestSnapshotJson = '{}';
    }

    const execution = createExecutionObservation({
      executionId,
      executionOutcome: 'Failed',
      responseStatus: null,
      responseHeaders: [],
      responseBodyPreview: '',
      responsePreviewLength: 0,
      responsePreviewTruncated: false,
      startedAt,
      completedAt,
      durationMs,
      requestSnapshot,
      errorCode: error?.code || error?.cause?.code || 'execution_failed',
      errorSummary: error.message,
    });

    try {
      runtimeStorage.insertExecutionHistory({
        id: executionId,
        workspaceId: input.workspaceId || null,
        requestId: input.id || null,
        environmentId: null,
        status: 'failed',
        cancellationOutcome: null,
        startedAt,
        completedAt,
        durationMs,
        errorCode: error?.code || error?.cause?.code || 'execution_failed',
        errorMessage: error.message,
      });
      runtimeStorage.insertExecutionResult({
        executionId,
        responseStatus: null,
        responseHeadersJson: '[]',
        responseBodyPreview: '',
        responseBodyRedacted: true,
        stageStatusJson: JSON.stringify({ scripts: 'deferred', tests: 'deferred' }),
        logSummaryJson: JSON.stringify({ consoleEntries: 0, tests: 0 }),
        requestSnapshotJson,
        redactionApplied: true,
      });
    } catch (storageError) {
      console.error('Execution persistence error:', storageError);
    }

    return sendError(res, 500, 'execution_failed', error.message, {
      executionId: execution.executionId,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      durationMs: execution.durationMs,
    });
  }
});

app.get('/api/execution-histories', (req, res) => {
  try {
    const items = runtimeStorage.listExecutionHistories().map(createHistoryRecord);
    return sendData(res, { items });
  } catch (error) {
    return sendError(res, 500, 'execution_history_list_failed', error.message);
  }
});

app.get('/api/execution-histories/:executionId', (req, res) => {
  try {
    const history = runtimeStorage.readExecutionHistory(req.params.executionId);

    if (!history) {
      return sendError(res, 404, 'execution_history_not_found', 'Execution history was not found.', {
        executionId: req.params.executionId,
      });
    }

    return sendData(res, { history: createHistoryRecord(history) });
  } catch (error) {
    return sendError(res, 500, 'execution_history_detail_failed', error.message, {
      executionId: req.params.executionId,
    });
  }
});

app.get('/api/captured-requests', (req, res) => {
  try {
    const items = runtimeStorage.listCapturedRequests().map(createCapturedRequestRecord);
    return sendData(res, { items });
  } catch (error) {
    return sendError(res, 500, 'captured_request_list_failed', error.message);
  }
});

app.get('/api/captured-requests/:capturedRequestId', (req, res) => {
  try {
    const capture = runtimeStorage.readCapturedRequest(req.params.capturedRequestId);

    if (!capture) {
      return sendError(res, 404, 'captured_request_not_found', 'Captured request was not found.', {
        capturedRequestId: req.params.capturedRequestId,
      });
    }

    return sendData(res, { capture: createCapturedRequestRecord(capture) });
  } catch (error) {
    return sendError(res, 500, 'captured_request_detail_failed', error.message, {
      capturedRequestId: req.params.capturedRequestId,
    });
  }
});
let mockConfig = {
  statusCode: 200,
  contentType: 'application/json',
  body: '{\n  "message": "Request captured by Local Request Inspector"\n}',
};

app.post('/__inspector/mock', (req, res) => {
  mockConfig = { ...mockConfig, ...req.body };
  res.json({
    success: true,
    message: 'Mock config updated',
    currentConfig: mockConfig,
  });
});

const getContentType = (ext) => {
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

app.get('/__inspector/assets', async (req, res) => {
  const assetsPath = path.join(__dirname, 'assets');
  try {
    if (!fs.existsSync(assetsPath)) {
      return res.json({ success: true, files: [] });
    }
    const files = await fs.promises.readdir(assetsPath);
    const fileDetails = await Promise.all(
      files.map(async (fileName) => {
        const filePath = path.join(assetsPath, fileName);
        const stat = await fs.promises.stat(filePath);
        const ext = path.extname(fileName).toLowerCase();

        return {
          filename: fileName,
          sizeBytes: stat.size,
          extension: ext,
          contentType: getContentType(ext),
          isDirectory: stat.isDirectory(),
        };
      }),
    );
    const onlyFiles = fileDetails.filter((f) => !f.isDirectory);
    res.json({ success: true, files: onlyFiles });
  } catch (err) {
    console.error('Assets read error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/__inspector/execute', async (req, res) => {
  const { requestConfig, callbackCode } = req.body;
  const logs = [];

  try {
    logs.push(`[System] 1차 API 요청 시작: ${requestConfig.method} ${requestConfig.url}`);

    const fetchOptions = {
      method: requestConfig.method,
      headers: requestConfig.headers || { 'Content-Type': 'application/json' },
    };

    if (requestConfig.method !== 'GET' && requestConfig.body) {
      if (requestConfig.bodyType === 'application/x-www-form-urlencoded') {
        const formParams = new URLSearchParams();
        if (typeof requestConfig.body === 'object') {
          for (const key in requestConfig.body) {
            formParams.append(key, requestConfig.body[key]);
          }
        } else {
          formParams.append('data', requestConfig.body);
        }
        fetchOptions.body = formParams;
      } else if (requestConfig.bodyType === 'application/json') {
        fetchOptions.body =
          typeof requestConfig.body === 'string'
            ? requestConfig.body
            : JSON.stringify(requestConfig.body);
      } else {
        fetchOptions.body = String(requestConfig.body);
      }
    }

    if (typeof global.fetch === 'undefined') {
      throw new Error(
        '시스템에 fetch API가 내장되어 있지 않습니다. Node.js 18 이상 버전이 필요합니다.',
      );
    }
    const initialRes = await global.fetch(requestConfig.url, fetchOptions);

    let responseData;
    const resText = await initialRes.text();
    try {
      responseData = JSON.parse(resText);
    } catch (e) {
      responseData = resText;
    }
    logs.push(`[System] 1차 응답 수신 완료 (Status: ${initialRes.status})`);

    const sandbox = {
      fetch: global.fetch,
      URLSearchParams: global.URLSearchParams,
      FormData: global.FormData,
      Blob: global.Blob,
      fs: fs.promises,
      path: path,
      __dirname: __dirname,
      response: responseData,
      console: {
        log: (...args) => logs.push(`[Log] ${args.join(' ')}`),
        error: (...args) => logs.push(`[Error] ${args.join(' ')}`),
        warn: (...args) => logs.push(`[Warn] ${args.join(' ')}`),
        info: (...args) => logs.push(`[Info] ${args.join(' ')}`),
      },
    };
    vm.createContext(sandbox);

    const wrappedCode = `(async () => { \n${callbackCode}\n })()`;
    logs.push('[System] 콜백 코드 실행 시작...');

    const executionResult = await vm.runInContext(wrappedCode, sandbox);

    logs.push('[System] 실행 완료');
    res.json({ success: true, logs, result: executionResult });
  } catch (err) {
    logs.push(`[Error] 시스템/문법 오류: ${err.message}`);
    res.status(500).json({ success: false, error: err.message, logs });
  }
});

app.all(/.*/, (req, res) => {
  if (req.path === '/events' || req.path.startsWith('/__inspector') || req.path.startsWith('/api/')) {
    return;
  }

  const persistedCapture = createPersistedCapturedRequestRecord(req);
  const captureRecord = createCapturedRequestRecord({
    id: persistedCapture.id,
    workspaceId: persistedCapture.workspaceId,
    method: persistedCapture.method,
    url: persistedCapture.url,
    path: persistedCapture.path,
    statusCode: persistedCapture.statusCode,
    matchedMockRuleId: persistedCapture.matchedMockRuleId,
    requestHeaders: JSON.parse(persistedCapture.requestHeadersJson),
    requestBodyPreview: persistedCapture.requestBodyPreview,
    requestBodyRedacted: persistedCapture.requestBodyRedacted,
    receivedAt: persistedCapture.receivedAt,
    mockOutcome: persistedCapture.mockOutcome,
    scopeLabel: persistedCapture.scopeLabel,
    requestBodyMode: persistedCapture.requestBodyMode,
  });

  try {
    runtimeStorage.insertCapturedRequest(persistedCapture);
  } catch (error) {
    console.error('Captured request persistence error:', error);
  }

  const requestEvent = createCaptureEventPayload(captureRecord);
  clients.forEach((client) =>
    client.write(`data: ${JSON.stringify(requestEvent)}\n\n`),
  );

  res
    .status(Number(mockConfig.statusCode))
    .set('Content-Type', mockConfig.contentType)
    .send(mockConfig.body);
});

app.listen(PORT, () => console.log(`[Ready] http://localhost:${PORT}`));





