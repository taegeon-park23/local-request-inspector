const express = require('express');
const path = require('path');
const vm = require('vm');
const fs = require('fs');
const { randomUUID } = require('node:crypto');
const {
  DEFAULT_WORKSPACE_ID,
  createMockRuleRecord,
  evaluateMockRules,
  validateMockRuleInput,
} = require('./mock-rule-engine');
const { bootstrapPersistence } = require('./storage');
const {
  buildAuthoredResourceBundle,
  parseAuthoredResourceBundleText,
  createImportedResourceName,
} = require('./storage/resource/authored-resource-bundle');
const {
  prepareAuthoredResourceImport,
} = require('./storage/resource/authored-resource-import-plan');
const {
  createEnvironmentRecord,
  enforceEnvironmentDefaults,
  normalizePersistedEnvironmentRecord,
  presentEnvironmentRecord,
  summarizePresentedEnvironmentRecord,
  compareEnvironmentRecords,
  validateEnvironmentInput,
} = require('./storage/resource/environment-record');
const {
  createSavedScriptRecord,
  normalizePersistedSavedScriptRecord,
  compareSavedScriptRecords,
  validateSavedScriptInput,
  listSystemScriptTemplates,
  readSystemScriptTemplate,
} = require('./storage/resource/script-record');
const {
  MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  REQUEST_RESOURCE_SCHEMA_VERSION,
  RESOURCE_RECORD_KINDS,
  RUNTIME_REQUEST_SNAPSHOT_SCHEMA_VERSION,
} = require('./storage/shared/constants');
const { createRuntimeStatusSnapshot } = require('./storage/shared/runtime-status');

const app = express();
const PORT = 5671;
const persistence = bootstrapPersistence();
const resourceStorage = persistence.resourceStorage;
const runtimeStorage = persistence.runtimeStorage;

const clientDistPath = path.join(__dirname, 'client', 'dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const appShellStatic = express.static(clientDistPath);

function getClientShellStatus() {
  const builtClientAvailable = fs.existsSync(clientIndexPath);

  return {
    builtClientAvailable,
    clientDistPath,
    clientIndexPath,
    legacyRoute: '/',
    appRoute: '/app',
    devClientUrl: 'http://localhost:6173/',
    buildCommand: 'npm run build:client',
    serveCommand: 'npm run serve:app',
    devCommand: 'npm run dev:app',
    note: builtClientAvailable
      ? 'Built React app shell is available from the server-backed /app route.'
      : 'Built React app shell is not available yet. Build the client shell or use the Vite dev server for authoring.',
  };
}

function renderAppShellUnavailablePage(status) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>App shell not built</title>
    <style>
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background: #0f172a;
        color: #e2e8f0;
      }
      main {
        max-width: 760px;
        margin: 0 auto;
        padding: 48px 24px;
      }
      h1 {
        margin-top: 0;
        font-size: 2rem;
      }
      p,
      li {
        line-height: 1.6;
      }
      code {
        background: rgba(148, 163, 184, 0.18);
        border-radius: 6px;
        padding: 2px 6px;
      }
      .panel {
        margin-top: 24px;
        padding: 20px;
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.28);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Built app shell is not available yet</h1>
      <p>${status.note}</p>
      <div class="panel">
        <p><strong>Server routes</strong></p>
        <ul>
          <li><code>${status.legacyRoute}</code> keeps serving the legacy prototype.</li>
          <li><code>${status.appRoute}</code> serves the built React shell after <code>${status.buildCommand}</code>.</li>
        </ul>
      </div>
      <div class="panel">
        <p><strong>Recommended next steps</strong></p>
        <ul>
          <li>Build the shell: <code>${status.buildCommand}</code></li>
          <li>Serve the built shell: <code>${status.serveCommand}</code></li>
          <li>For iterative authoring, run <code>${status.devCommand}</code> and open <code>${status.devClientUrl}</code></li>
        </ul>
      </div>
    </main>
  </body>
</html>`;
}

function sendAppShellUnavailable(req, res) {
  const status = getClientShellStatus();

  if (req.method === 'GET' && req.accepts('html')) {
    return res.status(503).send(renderAppShellUnavailablePage(status));
  }

  return res.status(503).type('text/plain').send(
    `${status.note} Run "${status.buildCommand}" to enable ${status.appRoute} or use ${status.devClientUrl} during development.`,
  );
}

app.use(express.static(path.join(__dirname, 'public')));

app.use('/app', (req, res, next) => {
  if (!getClientShellStatus().builtClientAvailable) {
    return sendAppShellUnavailable(req, res);
  }

  return appShellStatic(req, res, next);
});

app.get(/^\/app(?:\/.*)?$/, (req, res) => {
  const status = getClientShellStatus();

  if (!status.builtClientAvailable) {
    return sendAppShellUnavailable(req, res);
  }

  return res.sendFile(status.clientIndexPath);
});

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
    resourceKind: RESOURCE_RECORD_KINDS.REQUEST,
    resourceSchemaVersion: REQUEST_RESOURCE_SCHEMA_VERSION,
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

function normalizePersistedRequestRecord(record) {
  if (!record || typeof record !== 'object') {
    return record;
  }

  return {
    ...record,
    resourceKind: RESOURCE_RECORD_KINDS.REQUEST,
    resourceSchemaVersion: REQUEST_RESOURCE_SCHEMA_VERSION,
    collectionName: record.collectionName || 'Saved Requests',
    summary: record.summary || createRequestSummary(record.method, record.url),
  };
}

function normalizePersistedMockRuleRecord(record) {
  if (!record || typeof record !== 'object') {
    return record;
  }

  return {
    ...record,
    resourceKind: RESOURCE_RECORD_KINDS.MOCK_RULE,
    resourceSchemaVersion: MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  };
}

function validateImportedResourceCompatibility(input, expectedKind, supportedSchemaVersion) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  if (typeof input.resourceKind === 'string' && input.resourceKind !== expectedKind) {
    return `Imported resource kind ${input.resourceKind} is not supported for ${expectedKind}.`;
  }

  if (input.resourceSchemaVersion != null && input.resourceSchemaVersion !== supportedSchemaVersion) {
    return `Imported ${expectedKind} resource schema version ${input.resourceSchemaVersion} is not supported.`;
  }

  return null;
}

function compareIsoDescending(left, right) {
  return String(right || '').localeCompare(String(left || ''));
}

function compareSavedRequestRecords(left, right) {
  const updatedAtDiff = compareIsoDescending(left.updatedAt, right.updatedAt);
  if (updatedAtDiff !== 0) {
    return updatedAtDiff;
  }

  const createdAtDiff = compareIsoDescending(left.createdAt, right.createdAt);
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  const collectionDiff = String(left.collectionName || 'Saved Requests').localeCompare(String(right.collectionName || 'Saved Requests'));
  if (collectionDiff !== 0) {
    return collectionDiff;
  }

  const folderDiff = String(left.folderName || '').localeCompare(String(right.folderName || ''));
  if (folderDiff !== 0) {
    return folderDiff;
  }

  const nameDiff = String(left.name || '').localeCompare(String(right.name || ''));
  if (nameDiff !== 0) {
    return nameDiff;
  }

  return String(left.id || '').localeCompare(String(right.id || ''));
}

function compareMockRuleRecords(left, right) {
  if (Boolean(left.enabled) !== Boolean(right.enabled)) {
    return left.enabled ? -1 : 1;
  }

  if ((right.priority || 0) !== (left.priority || 0)) {
    return (right.priority || 0) - (left.priority || 0);
  }

  const updatedAtDiff = compareIsoDescending(left.updatedAt, right.updatedAt);
  if (updatedAtDiff !== 0) {
    return updatedAtDiff;
  }

  const createdAtDiff = compareIsoDescending(left.createdAt, right.createdAt);
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  const nameDiff = String(left.name || '').localeCompare(String(right.name || ''));
  if (nameDiff !== 0) {
    return nameDiff;
  }

  return String(left.id || '').localeCompare(String(right.id || ''));
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
  consoleSummary,
  consoleEntries,
  consoleLogCount,
  consoleWarningCount,
  testsSummary,
  testEntries,
  stageSummaries,
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
      absentSummary: executionOutcome === 'Succeeded'
        ? 'No response preview is available for this execution.'
        : `No response preview is available because the run ended as ${executionOutcome.toLowerCase()} before transport completed cleanly.`,
    }),
    startedAt,
    completedAt,
    durationMs,
    consoleSummary: consoleSummary || 'No console entries were captured for this run.',
    consoleEntries: consoleEntries || [],
    consoleLogCount: typeof consoleLogCount === 'number' ? consoleLogCount : (consoleEntries || []).length,
    consoleWarningCount: typeof consoleWarningCount === 'number' ? consoleWarningCount : 0,
    testsSummary: testsSummary || 'No tests were recorded for this run.',
    testEntries: testEntries || [],
    requestSnapshotSummary: createRequestSnapshotSummary(requestSnapshot),
    requestInputSummary: createRequestInputSummary(requestSnapshot),
    requestHeaderCount,
    requestParamCount,
    requestBodyMode: requestSnapshot?.bodyMode || 'none',
    authSummary: createAuthSummary(requestSnapshot?.auth),
    requestResourceId: typeof requestSnapshot?.requestId === 'string' && requestSnapshot.requestId.length > 0
      ? requestSnapshot.requestId
      : null,
    requestCollectionName: requestSnapshot?.collectionName || undefined,
    requestFolderName: requestSnapshot?.folderName || undefined,
    requestSourceLabel: requestSnapshot?.sourceLabel || 'Runtime request snapshot',
    stageSummaries: stageSummaries || [],
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
    snapshotKind: 'execution-request',
    snapshotSchemaVersion: RUNTIME_REQUEST_SNAPSHOT_SCHEMA_VERSION,
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
    requestId: request.id || null,
    collectionName: typeof request.collectionName === 'string' ? request.collectionName : '',
    folderName: typeof request.folderName === 'string' ? request.folderName : '',
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
    return 'Preview is truncated at the bounded diagnostics limit before richer inspection is added.';
  }

  if (redactionApplied) {
    return 'Preview is redacted and bounded before persistence and downstream diagnostics surfaces.';
  }

  return 'Preview is bounded before richer diagnostics and raw payload inspection are added.';
}

const SCRIPT_TIMEOUT_MS = 250;
const SCRIPT_CONSOLE_PREVIEW_LIMIT = 8;
const SCRIPT_TEST_PREVIEW_LIMIT = 8;
const SCRIPT_MESSAGE_LIMIT = 240;
const FORBIDDEN_SCRIPT_TOKEN_PATTERN = /\b(?:process|require|module|exports|__dirname|__filename|globalThis|global|fs|path|child_process)\b/;

class ScriptStageExecutionError extends Error {
  constructor(code, message, status = 'failed') {
    super(message);
    this.name = 'ScriptStageExecutionError';
    this.code = code;
    this.stageStatus = status;
  }
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

function createPersistedRequestSnapshotSafely(request, targetUrl) {
  try {
    return createPersistedRequestSnapshot(request, targetUrl);
  } catch {
    return {
      snapshotKind: 'execution-request',
      snapshotSchemaVersion: RUNTIME_REQUEST_SNAPSHOT_SCHEMA_VERSION,
      name: typeof request?.name === 'string' && request.name.trim().length > 0
        ? request.name.trim()
        : createRequestSummary(request?.method || 'GET', request?.url || ''),
      method: request?.method || 'GET',
      url: typeof request?.url === 'string' && request.url.trim().length > 0
        ? truncatePreview(request.url.trim(), 2000)
        : 'request snapshot unavailable',
      params: createSanitizedRows(request?.params),
      headers: createSanitizedRows(request?.headers),
      bodyMode: request?.bodyMode || 'none',
      bodyText: createPersistedBodyPreview(request || {}),
      auth: createPersistedAuthSnapshot(request?.auth),
      requestId: request?.id || null,
      collectionName: typeof request?.collectionName === 'string' ? request.collectionName : '',
      folderName: typeof request?.folderName === 'string' ? request.folderName : '',
      sourceLabel: request?.id ? 'Saved request snapshot' : 'Ad hoc request snapshot',
    };
  }
}

function createExecutionRequestSeed(input) {
  return {
    id: input.id || null,
    workspaceId: input.workspaceId || null,
    name: input.name,
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
    collectionName: input.collectionName || null,
    folderName: input.folderName || null,
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

function createMutableRowCollection(rows) {
  const findRowIndex = (key) =>
    rows.findIndex((row) => row.enabled !== false && typeof row.key === 'string' && row.key.toLowerCase() === String(key).toLowerCase());

  return {
    get(name) {
      const index = findRowIndex(name);
      return index >= 0 ? rows[index].value : undefined;
    },
    set(name, value) {
      const normalizedName = String(name ?? '').trim();
      if (normalizedName.length === 0) {
        throw new ScriptStageExecutionError('script_mutation_blocked', 'Empty keys are not supported in request mutations.', 'blocked');
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
    (headerEntries || []).map((header) => [String(header.name || header.key).toLowerCase(), String(header.value || '')]),
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

function createReadonlyRequestContext(executionRequest, target) {
  const normalizedTarget = target ? new URL(target.toString()) : new URL(executionRequest.url);
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

  const assertionApi = {
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

  return assertionApi;
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
    request: createReadonlyRequestContext(options.executionRequest, options.target),
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

function executeScriptStage(stageId, scriptSource, options) {
  const normalizedSource = typeof scriptSource === 'string' ? scriptSource.trim() : '';

  if (normalizedSource.length === 0) {
    return createEmptyScriptStageResult(stageId, `No ${createStageLabel(stageId)} script was saved for this request.`);
  }

  if (FORBIDDEN_SCRIPT_TOKEN_PATTERN.test(normalizedSource)) {
    return createScriptStageBlockedResult(
      stageId,
      `${createStageLabel(stageId)} attempted to use a blocked runtime capability. Only bounded request, response, console, summary, and test helpers are available in this slice.`,
    );
  }

  const { context, consoleSink, summaryController, testsApi } = createScriptContext(stageId, options);

  try {
    const script = new vm.Script(normalizedSource, {
      displayErrors: true,
      filename: `${stageId}-script.js`,
    });

    script.runInNewContext(context, { timeout: SCRIPT_TIMEOUT_MS });
  } catch (error) {
    if (error?.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || /timed out/i.test(error?.message || '')) {
      return createScriptStageTimeoutResult(stageId);
    }

    if (error instanceof ScriptStageExecutionError && error.stageStatus === 'blocked') {
      return {
        ...createScriptStageBlockedResult(stageId, error.message, error.code),
        consoleEntries: consoleSink.previewEntries,
        consoleLogCount: consoleSink.entryCount,
        consoleWarningCount: consoleSink.warningCount,
      };
    }

    const message = error instanceof Error ? error.message : `${createStageLabel(stageId)} failed.`;
    return {
      ...createScriptStageFailureResult(
        stageId,
        message,
        error?.code || 'script_stage_failed',
        consoleSink.previewEntries,
        consoleSink.warningCount,
      ),
      testResults: testsApi ? testsApi.readResults() : [],
    };
  }

  if (stageId === 'pre-request') {
    const summary = summaryController.readSummary() || 'Pre-request script completed before transport.';
    return {
      ...createStageStatusRecord(stageId, 'succeeded', summary),
      consoleEntries: consoleSink.previewEntries,
      consoleLogCount: consoleSink.entryCount,
      consoleWarningCount: consoleSink.warningCount,
      testResults: [],
    };
  }

  if (stageId === 'post-response') {
    const summary = summaryController.readSummary()
      || (consoleSink.entryCount > 0
        ? 'Post-response script completed and emitted bounded console diagnostics.'
        : 'Post-response script completed without derived diagnostics.');

    return {
      ...createStageStatusRecord(stageId, 'succeeded', summary),
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
    ...createStageStatusRecord(stageId, failedAssertions > 0 ? 'failed' : 'succeeded', summaryController.readSummary() || testsSummary, {
      ...(failedAssertions > 0 ? { errorCode: 'script_assertion_failed', errorSummary: testsSummary } : {}),
    }),
    consoleEntries: consoleSink.previewEntries,
    consoleLogCount: consoleSink.entryCount,
    consoleWarningCount: consoleSink.warningCount,
    testResults,
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

app.get('/api/app-shell-status', (req, res) => {
  return sendData(res, {
    appShell: getClientShellStatus(),
  });
});

app.get('/api/settings/runtime-status', (req, res) => {
  try {
    return sendData(res, {
      status: createRuntimeStatusSnapshot({
        appShell: getClientShellStatus(),
        layout: persistence.layout,
      }),
    });
  } catch (error) {
    return sendError(res, 500, 'runtime_status_failed', error.message);
  }
});

function createTransportSkippedStageResult(reason) {
  return createStageStatusRecord('transport', 'skipped', reason);
}

function createSkippedScriptStageAfterTransport(stageId, reason) {
  return createEmptyScriptStageResult(stageId, reason);
}

function deriveExecutionOutcome(stageResults) {
  const normalizedResults = Object.values(stageResults || {}).filter(Boolean);

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

function createPersistedLogSummary(stageResults) {
  return {
    consoleEntries: countConsoleEntries(stageResults),
    consoleWarnings: countConsoleWarnings(stageResults),
    consolePreview: createCombinedConsoleEntries(stageResults),
  };
}

function createPersistedTestResultRecords(executionId, testsStageResult) {
  if (!Array.isArray(testsStageResult?.testResults) || testsStageResult.testResults.length === 0) {
    return [];
  }

  const recordedAt = new Date().toISOString();

  return testsStageResult.testResults.map((result) => ({
    id: result.id || randomUUID(),
    executionId,
    testName: result.name,
    status: result.status,
    message: result.message,
    detailsJson: JSON.stringify({ stage: 'tests' }),
    recordedAt,
  }));
}

function createExecutionErrorMetadata(stageResults, fallbackError) {
  const failureStage = ['pre-request', 'transport', 'post-response', 'tests']
    .map((stageId) => stageResults[stageId])
    .find((stageResult) => stageResult && stageResult.status !== 'succeeded' && stageResult.status !== 'skipped');

  if (!failureStage) {
    return {
      errorCode: fallbackError?.code || fallbackError?.cause?.code || null,
      errorSummary: fallbackError?.message || null,
    };
  }

  return {
    errorCode: failureStage.errorCode || fallbackError?.code || fallbackError?.cause?.code || null,
    errorSummary: failureStage.errorSummary || failureStage.summary || fallbackError?.message || null,
  };
}

function createPersistedExecutionStatus(executionOutcome) {
  switch (executionOutcome) {
    case 'Succeeded':
      return 'succeeded';
    case 'Blocked':
      return 'blocked';
    case 'Timed out':
      return 'timed_out';
    default:
      return 'failed';
  }
}

function createCaptureBodyPreviewPolicy(preview, wasRedacted) {
  if (typeof preview !== 'string' || preview.length === 0) {
    return 'No request body preview was stored for this inbound capture.';
  }

  return wasRedacted
    ? 'Request body preview is redacted and bounded before capture persistence.'
    : 'Request body preview is bounded before capture persistence.';
}

function createCaptureStorageSummary(headerCount, bodyPreview) {
  if (typeof bodyPreview === 'string' && bodyPreview.length > 0) {
    return `Persisted capture keeps ${headerCount} header(s) and one bounded request-body preview for observation and replay.`;
  }

  return `Persisted capture keeps ${headerCount} header(s) and no request-body preview for this inbound capture.`;
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

function createPersistedTransportStageResult(runtimeRecord, executionOutcome, transportOutcome) {
  if (runtimeRecord.responseStatus === null) {
    if (executionOutcome === 'Blocked') {
      return createStageStatusRecord(
        'transport',
        'blocked',
        'Transport was blocked before any upstream request was sent.',
        {
          errorCode: runtimeRecord.errorCode || 'transport_blocked',
          errorSummary: runtimeRecord.errorMessage || 'Transport was blocked before any upstream request was sent.',
        },
      );
    }

    if (executionOutcome === 'Timed out') {
      return createStageStatusRecord(
        'transport',
        'timed_out',
        'Transport timed out before a persisted response summary was available.',
        {
          errorCode: runtimeRecord.errorCode || 'transport_timed_out',
          errorSummary: runtimeRecord.errorMessage || 'Transport timed out before a persisted response summary was available.',
        },
      );
    }

    return createStageStatusRecord(
      'transport',
      'failed',
      'Transport failed before a persisted response summary was available.',
      {
        errorCode: runtimeRecord.errorCode || 'transport_failed',
        errorSummary: runtimeRecord.errorMessage || 'Transport failed before a persisted response summary was available.',
      },
    );
  }

  return createStageStatusRecord(
    'transport',
    'succeeded',
    `Transport completed with ${transportOutcome}.`,
  );
}

function createPersistedStageResults(runtimeRecord, executionOutcome, transportOutcome) {
  const rawStageStatus = runtimeRecord.stageStatus || {};

  if (rawStageStatus.preRequest || rawStageStatus.transport || rawStageStatus.postResponse || rawStageStatus.tests) {
    return {
      preRequest: rawStageStatus.preRequest || createEmptyScriptStageResult(
        'pre-request',
        'No persisted Pre-request stage summary is available for this execution.',
      ),
      transport: rawStageStatus.transport || createPersistedTransportStageResult(runtimeRecord, executionOutcome, transportOutcome),
      postResponse: rawStageStatus.postResponse || createEmptyScriptStageResult(
        'post-response',
        'No persisted Post-response stage summary is available for this execution.',
      ),
      tests: rawStageStatus.tests || createEmptyScriptStageResult(
        'tests',
        'No persisted Tests stage summary is available for this execution.',
      ),
    };
  }

  return {
    preRequest: createEmptyScriptStageResult(
      'pre-request',
      rawStageStatus.scripts === 'deferred'
        ? 'Persisted history predates Pre-request diagnostics wiring.'
        : 'No Pre-request script was saved for this request.',
    ),
    transport: createPersistedTransportStageResult(runtimeRecord, executionOutcome, transportOutcome),
    postResponse: createEmptyScriptStageResult(
      'post-response',
      rawStageStatus.scripts === 'deferred'
        ? 'Persisted history predates Post-response diagnostics wiring.'
        : 'No Post-response script was saved for this request.',
    ),
    tests: createEmptyScriptStageResult(
      'tests',
      rawStageStatus.tests === 'deferred'
        ? 'Persisted history predates Tests diagnostics wiring.'
        : 'No Tests script was saved for this request.',
    ),
  };
}

function createTestSummary(assertionCount, failedAssertions, skippedAssertions, testsStageResult, testResults = []) {
  if (Array.isArray(testResults) && testResults.length > 0) {
    if (failedAssertions > 0) {
      return {
        outcome: 'Some tests failed',
        label: `${failedAssertions} / ${assertionCount} tests failed`,
        summary: testsStageResult?.summary || 'Persisted assertion summary shows at least one failed test.',
        preview: testResults.map((result) => `${result.status === 'passed' ? 'Passed' : 'Failed'}: ${result.testName} - ${result.message}`),
      };
    }

    return {
      outcome: 'All tests passed',
      label: `${assertionCount} / ${assertionCount} tests passed`,
      summary: testsStageResult?.summary || 'All persisted assertions passed.',
      preview: testResults.map((result) => `Passed: ${result.testName} - ${result.message}`),
    };
  }

  if (testsStageResult?.status === 'failed' || testsStageResult?.status === 'blocked' || testsStageResult?.status === 'timed_out') {
    return {
      outcome: 'Some tests failed',
      label: 'Tests stage failed',
      summary: testsStageResult.summary,
      preview: [testsStageResult.summary],
    };
  }

  if (testsStageResult?.status === 'skipped') {
    const shouldTreatAsSkipped = /transport|response|blocked|timed out/i.test(testsStageResult.summary);

    return {
      outcome: shouldTreatAsSkipped ? 'Tests skipped' : 'No tests',
      label: shouldTreatAsSkipped ? 'Tests skipped' : 'No tests persisted',
      summary: testsStageResult.summary,
      preview: [testsStageResult.summary],
    };
  }

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
  const entries = [
    {
      id: `${historyRecord.executionId}-prepared`,
      title: 'Request prepared',
      summary: historyRecord.stageSummaries?.find((entry) => entry.stageId === 'pre-request')?.summary
        || `Prepared ${historyRecord.method} ${historyRecord.hostPathHint} from a redacted request snapshot.`,
    },
    {
      id: `${historyRecord.executionId}-transport`,
      title: historyRecord.transportStatusCode === null ? 'Transport summary' : 'Transport completed',
      summary: historyRecord.stageSummaries?.find((entry) => entry.stageId === 'transport')?.summary
        || (historyRecord.transportStatusCode === null
          ? 'No persisted transport response was recorded for this execution.'
          : `Persisted transport summary recorded ${historyRecord.transportOutcome}.`),
    },
  ];

  const postResponseStage = historyRecord.stageSummaries?.find((entry) => entry.stageId === 'post-response');
  if (postResponseStage && postResponseStage.status !== 'Skipped') {
    entries.push({
      id: `${historyRecord.executionId}-post-response`,
      title: 'Post-response summary',
      summary: postResponseStage.summary,
    });
  }

  const testsStage = historyRecord.stageSummaries?.find((entry) => entry.stageId === 'tests');
  if (historyRecord.assertionCount > 0 || (testsStage && testsStage.status !== 'Skipped')) {
    entries.push({
      id: `${historyRecord.executionId}-tests`,
      title: 'Tests completed',
      summary: testsStage?.summary || historyRecord.testsSummary,
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
  const persistedStageResults = createPersistedStageResults(runtimeRecord, executionOutcome, transportOutcome);
  const stageSummaries = createObservationStageSummaries(persistedStageResults);
  const consoleLogCount = Number(runtimeRecord.logSummary?.consoleEntries || 0);
  const consoleWarningCount = Number(runtimeRecord.logSummary?.consoleWarnings || runtimeRecord.logSummary?.warnings || 0);
  const consolePreview = Array.isArray(runtimeRecord.logSummary?.consolePreview)
    ? runtimeRecord.logSummary.consolePreview
    : [];
  const tests = createTestSummary(
    runtimeRecord.assertionCount,
    runtimeRecord.failedAssertions,
    runtimeRecord.skippedAssertions,
    persistedStageResults.tests,
    runtimeRecord.testResults,
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
    requestResourceId: runtimeRecord.requestId || requestSnapshot.requestId || null,
    requestCollectionName: requestSnapshot.collectionName || undefined,
    requestFolderName: requestSnapshot.folderName || undefined,
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
        ? `${consoleLogCount} persisted console entr${consoleLogCount === 1 ? 'y is' : 'ies are'} available${consoleWarningCount > 0 ? `, including ${consoleWarningCount} warning(s).` : '.'}`
        : persistedStageResults['post-response']?.summary || persistedStageResults['pre-request']?.summary || 'No console entries were persisted for this execution.',
    consolePreview,
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
    stageSummaries,
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

function createPersistedCapturedRequestRecord(req, evaluationResult) {
  const receivedAt = new Date().toISOString();
  const host = req.get('host') || 'localhost';
  const fullUrl = new URL(req.originalUrl, `${req.protocol}://${host}`).toString();
  const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : '');
  const contentType = req.headers['content-type'] || '';
  const sanitizedHeaders = createSanitizedCaptureHeaders(req.headers);
  const requestBodyMode = createCapturedRequestBodyMode(contentType, req.body, rawBody);

  return {
    id: randomUUID(),
    workspaceId: DEFAULT_WORKSPACE_ID,
    method: req.method.toUpperCase(),
    url: fullUrl,
    path: req.originalUrl,
    statusCode: Number(evaluationResult.response.statusCode),
    matchedMockRuleId: evaluationResult.matchedRuleId || null,
    matchedMockRuleName: evaluationResult.matchedRuleName || null,
    requestHeadersJson: JSON.stringify(sanitizedHeaders),
    requestBodyPreview: createCapturedRequestBodyPreview(req.body, rawBody, contentType),
    requestBodyRedacted: true,
    receivedAt,
    mockOutcome: evaluationResult.outcome,
    mockEvaluationSummary: evaluationResult.mockEvaluationSummary || '',
    appliedDelayMs: typeof evaluationResult.appliedDelayMs === 'number' ? evaluationResult.appliedDelayMs : null,
    scopeLabel: 'All runtime captures',
    requestBodyMode,
  };
}

function createCaptureBodyHint(bodyModeHint, bodyPreview) {
  if (bodyModeHint === 'json' && bodyPreview.length > 0) {
    return `JSON body · ${bodyPreview.length} characters persisted in bounded summary form.`;
  }

  if (bodyModeHint === 'text' && bodyPreview.length > 0) {
    return 'Text body · bounded redacted preview';
  }

  return 'No request body preview was stored for this inbound capture.';
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

function createCaptureMockSummary(mockOutcome, statusCode, matchedMockRuleId, matchedMockRuleName, evaluationSummary) {
  if (typeof evaluationSummary === 'string' && evaluationSummary.trim().length > 0) {
    return evaluationSummary;
  }

  if (mockOutcome === 'Mocked' && matchedMockRuleName) {
    return `Matched runtime mock rule "${matchedMockRuleName}" and returned HTTP ${statusCode ?? 200}.`;
  }

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

function createCaptureResponseSummary(mockOutcome, statusCode, appliedDelayMs) {
  if (mockOutcome === 'Mocked') {
    return `Response handling stayed inside the local mock path and returned HTTP ${statusCode ?? 200}.${appliedDelayMs > 0 ? ` Applied ${appliedDelayMs} ms fixed delay.` : ''}`;
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
  const mockSummary = createCaptureMockSummary(
    mockOutcome,
    runtimeRecord.statusCode,
    runtimeRecord.matchedMockRuleId,
    runtimeRecord.matchedMockRuleName,
    runtimeRecord.mockEvaluationSummary,
  );
  const responseSummary = createCaptureResponseSummary(
    mockOutcome,
    runtimeRecord.statusCode,
    runtimeRecord.appliedDelayMs,
  );

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
    requestSummary: `${runtimeRecord.method} ${path} was observed at ${host} as an inbound capture.`,
    headersSummary: createCaptureHeadersSummary(requestHeaders),
    bodyPreview: requestBodyPreview.length > 0
      ? requestBodyPreview
      : 'No request body preview was stored for this inbound capture.',
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
    ...(runtimeRecord.matchedMockRuleName ? { mockRuleName: runtimeRecord.matchedMockRuleName } : {}),
    ...(typeof runtimeRecord.appliedDelayMs === 'number' && runtimeRecord.appliedDelayMs > 0
      ? { delayLabel: `Applied ${runtimeRecord.appliedDelayMs} ms delay` }
      : {}),
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

function listWorkspaceSavedRequestRecords(workspaceId) {
  return resourceStorage
    .list('request')
    .map((record) => normalizePersistedRequestRecord(record))
    .filter((record) => record.workspaceId === workspaceId)
    .sort(compareSavedRequestRecords);
}

function listWorkspaceMockRuleRecords(workspaceId) {
  return resourceStorage
    .list('mock-rule')
    .map((record) => normalizePersistedMockRuleRecord(record))
    .filter((record) => record.workspaceId === workspaceId)
    .sort(compareMockRuleRecords);
}

function listWorkspaceEnvironmentRecords(workspaceId) {
  return resourceStorage
    .list('environment')
    .map((record) => normalizePersistedEnvironmentRecord(record))
    .filter((record) => record.workspaceId === workspaceId)
    .sort(compareEnvironmentRecords);
}

function listWorkspaceSavedScriptRecords(workspaceId) {
  return resourceStorage
    .list('script')
    .map((record) => normalizePersistedSavedScriptRecord(record))
    .filter((record) => record.workspaceId === workspaceId)
    .sort(compareSavedScriptRecords);
}

function persistWorkspaceEnvironmentRecords(records) {
  for (const record of records) {
    resourceStorage.save('environment', normalizePersistedEnvironmentRecord(record));
  }
}

function upsertWorkspaceEnvironmentRecord(workspaceId, candidateRecord, preferredDefaultId) {
  const reconciledRecords = enforceEnvironmentDefaults(
    [...listWorkspaceEnvironmentRecords(workspaceId).filter((record) => record.id !== candidateRecord.id), candidateRecord],
    preferredDefaultId,
  );
  persistWorkspaceEnvironmentRecords(reconciledRecords);
  return reconciledRecords.find((record) => record.id === candidateRecord.id) ?? null;
}

function reconcileWorkspaceEnvironmentDefaults(workspaceId) {
  const reconciledRecords = enforceEnvironmentDefaults(listWorkspaceEnvironmentRecords(workspaceId));
  persistWorkspaceEnvironmentRecords(reconciledRecords);
  return reconciledRecords;
}

function createImportedResourceRejection(kind, reason, name) {
  return {
    kind,
    reason,
    ...(typeof name === 'string' && name.trim().length > 0 ? { name: name.trim() } : {}),
  };
}

function createImportedRequestRecord(input, workspaceId, usedNames) {
  const compatibilityError = validateImportedResourceCompatibility(
    input,
    RESOURCE_RECORD_KINDS.REQUEST,
    REQUEST_RESOURCE_SCHEMA_VERSION,
  );

  if (compatibilityError) {
    return {
      rejection: createImportedResourceRejection('request', compatibilityError, input?.name),
    };
  }

  const validationError = validateRequestDefinition(input);

  if (validationError) {
    return {
      rejection: createImportedResourceRejection('request', validationError, input?.name),
    };
  }

  const importedName = createImportedResourceName(input.name, usedNames);

  return {
    record: normalizeSavedRequest(
      {
        ...input,
        id: randomUUID(),
        workspaceId,
        name: importedName,
      },
      null,
      workspaceId,
    ),
    renamed: importedName !== String(input.name || '').trim(),
  };
}

function createImportedMockRuleResource(input, workspaceId, usedNames) {
  const compatibilityError = validateImportedResourceCompatibility(
    input,
    RESOURCE_RECORD_KINDS.MOCK_RULE,
    MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  );

  if (compatibilityError) {
    return {
      rejection: createImportedResourceRejection('mock-rule', compatibilityError, input?.name),
    };
  }

  const validationError = validateMockRuleInput(input);

  if (validationError) {
    return {
      rejection: createImportedResourceRejection('mock-rule', validationError, input?.name),
    };
  }

  const importedName = createImportedResourceName(input.name, usedNames);

  return {
    record: createMockRuleRecord(
      {
        ...input,
        id: randomUUID(),
        name: importedName,
      },
      null,
      workspaceId,
    ),
    renamed: importedName !== String(input.name || '').trim(),
  };
}

function parseWorkspaceResourceBundleImportRequest(req, res) {
  const bundleText = req.body?.bundleText;

  if (typeof bundleText !== 'string') {
    sendError(res, 400, 'resource_bundle_invalid_json', 'Import request must include bundle JSON text.', {
      workspaceId: req.params.workspaceId,
    });
    return null;
  }

  try {
    return parseAuthoredResourceBundleText(bundleText);
  } catch (error) {
    sendError(
      res,
      400,
      error.code || 'resource_bundle_import_failed',
      error.message,
      {
        workspaceId: req.params.workspaceId,
        ...(error.details || {}),
      },
    );
    return null;
  }
}

function prepareWorkspaceResourceBundleImport(bundle, workspaceId) {
  const existingRequests = listWorkspaceSavedRequestRecords(workspaceId);
  const existingMockRules = listWorkspaceMockRuleRecords(workspaceId);

  return prepareAuthoredResourceImport({
    bundle,
    workspaceId,
    existingRequestNames: existingRequests.map((record) => record.name),
    existingMockRuleNames: existingMockRules.map((record) => record.name),
    createImportedRequest: createImportedRequestRecord,
    createImportedMockRule: createImportedMockRuleResource,
    sortAcceptedRequests: (records) => [...records].sort(compareSavedRequestRecords),
    sortAcceptedMockRules: (records) => [...records].sort(compareMockRuleRecords),
  });
}
app.get('/api/workspaces/:workspaceId/requests', (req, res) => {
  try {
    const items = listWorkspaceSavedRequestRecords(req.params.workspaceId);
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

  if (typeof input?.id === 'string' && input.id.trim().length > 0) {
    return sendError(res, 400, 'request_create_requires_new_identity', 'Use the update route for an existing saved request id.', {
      requestId: input.id,
    });
  }

  try {
    const record = normalizeSavedRequest(input, null, req.params.workspaceId);
    resourceStorage.save('request', record);
    return sendData(res, { request: record }, 201);
  } catch (error) {
    return sendError(res, 500, 'request_save_failed', error.message);
  }
});

app.patch('/api/requests/:requestId', (req, res) => {
  const input = req.body?.request;
  const validationError = validateRequestDefinition(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_request_definition', validationError, {
      requestId: req.params.requestId,
    });
  }

  try {
    const existingRecord = normalizePersistedRequestRecord(
      resourceStorage.read('request', req.params.requestId),
    );

    if (!existingRecord) {
      return sendError(res, 404, 'request_not_found', 'Saved request was not found.', {
        requestId: req.params.requestId,
      });
    }

    const record = normalizeSavedRequest(
      {
        ...input,
        id: req.params.requestId,
      },
      existingRecord,
      existingRecord.workspaceId || req.body?.request?.workspaceId || DEFAULT_WORKSPACE_ID,
    );
    resourceStorage.save('request', record);
    return sendData(res, { request: record });
  } catch (error) {
    return sendError(res, 500, 'request_update_failed', error.message, {
      requestId: req.params.requestId,
    });
  }
});

app.get('/api/workspaces/:workspaceId/environments', (req, res) => {
  try {
    const items = listWorkspaceEnvironmentRecords(req.params.workspaceId)
      .map((record) => summarizePresentedEnvironmentRecord(record));
    return sendData(res, { items });
  } catch (error) {
    return sendError(res, 500, 'environment_list_failed', error.message);
  }
});

app.post('/api/workspaces/:workspaceId/environments', (req, res) => {
  const input = req.body?.environment;
  const validationError = validateEnvironmentInput(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_environment', validationError);
  }

  if (typeof input?.id === 'string' && input.id.trim().length > 0) {
    return sendError(res, 400, 'environment_create_requires_new_identity', 'Use the update route for an existing environment id.', {
      environmentId: input.id,
    });
  }

  try {
    const candidateRecord = createEnvironmentRecord(input, null, req.params.workspaceId);
    const environment = upsertWorkspaceEnvironmentRecord(
      req.params.workspaceId,
      candidateRecord,
      input?.isDefault === true ? candidateRecord.id : null,
    );

    return sendData(res, { environment: presentEnvironmentRecord(environment) }, 201);
  } catch (error) {
    return sendError(res, 500, 'environment_create_failed', error.message);
  }
});

app.get('/api/environments/:environmentId', (req, res) => {
  try {
    const environment = normalizePersistedEnvironmentRecord(
      resourceStorage.read('environment', req.params.environmentId),
    );

    if (!environment) {
      return sendError(res, 404, 'environment_not_found', 'Environment was not found.', {
        environmentId: req.params.environmentId,
      });
    }

    return sendData(res, { environment: presentEnvironmentRecord(environment) });
  } catch (error) {
    return sendError(res, 500, 'environment_detail_failed', error.message, {
      environmentId: req.params.environmentId,
    });
  }
});

app.patch('/api/environments/:environmentId', (req, res) => {
  const input = req.body?.environment;
  const validationError = validateEnvironmentInput(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_environment', validationError, {
      environmentId: req.params.environmentId,
    });
  }

  try {
    const existingRecord = normalizePersistedEnvironmentRecord(
      resourceStorage.read('environment', req.params.environmentId),
    );

    if (!existingRecord) {
      return sendError(res, 404, 'environment_not_found', 'Environment was not found.', {
        environmentId: req.params.environmentId,
      });
    }

    const candidateRecord = createEnvironmentRecord(
      {
        ...input,
        id: req.params.environmentId,
      },
      existingRecord,
      existingRecord.workspaceId || DEFAULT_WORKSPACE_ID,
    );
    const environment = upsertWorkspaceEnvironmentRecord(
      existingRecord.workspaceId || DEFAULT_WORKSPACE_ID,
      candidateRecord,
      input?.isDefault === true ? candidateRecord.id : null,
    );

    return sendData(res, { environment: presentEnvironmentRecord(environment) });
  } catch (error) {
    return sendError(res, 500, 'environment_update_failed', error.message, {
      environmentId: req.params.environmentId,
    });
  }
});

app.delete('/api/environments/:environmentId', (req, res) => {
  try {
    const existingRecord = normalizePersistedEnvironmentRecord(
      resourceStorage.read('environment', req.params.environmentId),
    );

    if (!existingRecord) {
      return sendError(res, 404, 'environment_not_found', 'Environment was not found.', {
        environmentId: req.params.environmentId,
      });
    }

    resourceStorage.delete('environment', req.params.environmentId);
    reconcileWorkspaceEnvironmentDefaults(existingRecord.workspaceId || DEFAULT_WORKSPACE_ID);

    return sendData(res, { deletedEnvironmentId: req.params.environmentId });
  } catch (error) {
    return sendError(res, 500, 'environment_delete_failed', error.message, {
      environmentId: req.params.environmentId,
    });
  }
});

app.get('/api/workspaces/:workspaceId/scripts', (req, res) => {
  try {
    const items = listWorkspaceSavedScriptRecords(req.params.workspaceId);
    return sendData(res, { items });
  } catch (error) {
    return sendError(res, 500, 'script_list_failed', error.message);
  }
});

app.post('/api/workspaces/:workspaceId/scripts', (req, res) => {
  const input = req.body?.script;
  const validationError = validateSavedScriptInput(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_script', validationError);
  }

  if (typeof input?.id === 'string' && input.id.trim().length > 0) {
    return sendError(res, 400, 'script_create_requires_new_identity', 'Use the update route for an existing script id.', {
      scriptId: input.id,
    });
  }

  try {
    const script = createSavedScriptRecord(input, null, req.params.workspaceId);
    resourceStorage.save('script', script);
    return sendData(res, { script }, 201);
  } catch (error) {
    return sendError(res, 500, 'script_create_failed', error.message);
  }
});

app.get('/api/scripts/:scriptId', (req, res) => {
  try {
    const script = normalizePersistedSavedScriptRecord(
      resourceStorage.read('script', req.params.scriptId),
    );

    if (!script) {
      return sendError(res, 404, 'script_not_found', 'Saved script was not found.', {
        scriptId: req.params.scriptId,
      });
    }

    return sendData(res, { script });
  } catch (error) {
    return sendError(res, 500, 'script_detail_failed', error.message, {
      scriptId: req.params.scriptId,
    });
  }
});

app.patch('/api/scripts/:scriptId', (req, res) => {
  const input = req.body?.script;
  const validationError = validateSavedScriptInput(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_script', validationError, {
      scriptId: req.params.scriptId,
    });
  }

  try {
    const existingRecord = normalizePersistedSavedScriptRecord(
      resourceStorage.read('script', req.params.scriptId),
    );

    if (!existingRecord) {
      return sendError(res, 404, 'script_not_found', 'Saved script was not found.', {
        scriptId: req.params.scriptId,
      });
    }

    const script = createSavedScriptRecord(
      {
        ...input,
        id: req.params.scriptId,
      },
      existingRecord,
      existingRecord.workspaceId || DEFAULT_WORKSPACE_ID,
    );
    resourceStorage.save('script', script);
    return sendData(res, { script });
  } catch (error) {
    return sendError(res, 500, 'script_update_failed', error.message, {
      scriptId: req.params.scriptId,
    });
  }
});

app.delete('/api/scripts/:scriptId', (req, res) => {
  try {
    const deleted = resourceStorage.delete('script', req.params.scriptId);

    if (!deleted) {
      return sendError(res, 404, 'script_not_found', 'Saved script was not found.', {
        scriptId: req.params.scriptId,
      });
    }

    return sendData(res, { deletedScriptId: req.params.scriptId });
  } catch (error) {
    return sendError(res, 500, 'script_delete_failed', error.message, {
      scriptId: req.params.scriptId,
    });
  }
});

app.get('/api/script-templates', (req, res) => {
  try {
    return sendData(res, { items: listSystemScriptTemplates() });
  } catch (error) {
    return sendError(res, 500, 'script_template_list_failed', error.message);
  }
});

app.get('/api/script-templates/:templateId', (req, res) => {
  try {
    const template = readSystemScriptTemplate(req.params.templateId);

    if (!template) {
      return sendError(res, 404, 'script_template_not_found', 'Script template was not found.', {
        templateId: req.params.templateId,
      });
    }

    return sendData(res, { template });
  } catch (error) {
    return sendError(res, 500, 'script_template_detail_failed', error.message, {
      templateId: req.params.templateId,
    });
  }
});

app.get('/api/workspaces/:workspaceId/resource-bundle', (req, res) => {
  try {
    const bundle = buildAuthoredResourceBundle({
      workspaceId: req.params.workspaceId,
      requests: listWorkspaceSavedRequestRecords(req.params.workspaceId),
      mockRules: listWorkspaceMockRuleRecords(req.params.workspaceId),
    });

    return sendData(res, { bundle });
  } catch (error) {
    return sendError(res, 500, 'resource_bundle_export_failed', error.message, {
      workspaceId: req.params.workspaceId,
    });
  }
});

app.get('/api/requests/:requestId/resource-bundle', (req, res) => {
  try {
    const requestRecord = normalizePersistedRequestRecord(
      resourceStorage.read('request', req.params.requestId),
    );

    if (!requestRecord) {
      return sendError(res, 404, 'request_not_found', 'Saved request was not found.', {
        requestId: req.params.requestId,
      });
    }

    const bundle = buildAuthoredResourceBundle({
      workspaceId: requestRecord.workspaceId || DEFAULT_WORKSPACE_ID,
      requests: [requestRecord],
      mockRules: [],
    });

    return sendData(res, { bundle });
  } catch (error) {
    return sendError(res, 500, 'resource_bundle_export_failed', error.message, {
      requestId: req.params.requestId,
    });
  }
});

app.get('/api/mock-rules/:mockRuleId/resource-bundle', (req, res) => {
  try {
    const mockRule = normalizePersistedMockRuleRecord(
      resourceStorage.read('mock-rule', req.params.mockRuleId),
    );

    if (!mockRule) {
      return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
        mockRuleId: req.params.mockRuleId,
      });
    }

    const bundle = buildAuthoredResourceBundle({
      workspaceId: mockRule.workspaceId || DEFAULT_WORKSPACE_ID,
      requests: [],
      mockRules: [mockRule],
    });

    return sendData(res, { bundle });
  } catch (error) {
    return sendError(res, 500, 'resource_bundle_export_failed', error.message, {
      mockRuleId: req.params.mockRuleId,
    });
  }
});

app.post('/api/workspaces/:workspaceId/resource-bundle/import', (req, res) => {
  const bundle = parseWorkspaceResourceBundleImportRequest(req, res);

  if (!bundle) {
    return undefined;
  }

  try {
    const importPlan = prepareWorkspaceResourceBundleImport(bundle, req.params.workspaceId);

    for (const requestRecord of importPlan.acceptedRequests) {
      resourceStorage.save('request', requestRecord);
    }

    for (const mockRuleRecord of importPlan.acceptedMockRules) {
      resourceStorage.save('mock-rule', mockRuleRecord);
    }

    return sendData(res, {
      result: {
        acceptedRequests: importPlan.acceptedRequests,
        acceptedMockRules: importPlan.acceptedMockRules,
        rejected: importPlan.rejected,
        summary: importPlan.summary,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'resource_bundle_import_failed', error.message, {
      workspaceId: req.params.workspaceId,
    });
  }
});

app.post('/api/workspaces/:workspaceId/resource-bundle/import-preview', (req, res) => {
  const bundle = parseWorkspaceResourceBundleImportRequest(req, res);

  if (!bundle) {
    return undefined;
  }

  try {
    const preview = prepareWorkspaceResourceBundleImport(bundle, req.params.workspaceId);

    return sendData(res, {
      preview: {
        rejected: preview.rejected,
        summary: preview.summary,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'resource_bundle_import_preview_failed', error.message, {
      workspaceId: req.params.workspaceId,
    });
  }
});

app.get('/api/workspaces/:workspaceId/mock-rules', (req, res) => {
  try {
    const items = listWorkspaceMockRuleRecords(req.params.workspaceId);
    return sendData(res, { items });
  } catch (error) {
    return sendError(res, 500, 'mock_rule_list_failed', error.message);
  }
});

app.post('/api/workspaces/:workspaceId/mock-rules', (req, res) => {
  const input = req.body?.rule;
  const validationError = validateMockRuleInput(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_mock_rule', validationError);
  }

  try {
    const rule = createMockRuleRecord(input, null, req.params.workspaceId);
    resourceStorage.save('mock-rule', rule);
    return sendData(res, { rule }, 201);
  } catch (error) {
    return sendError(res, 500, 'mock_rule_create_failed', error.message);
  }
});

app.get('/api/mock-rules/:mockRuleId', (req, res) => {
  try {
    const rule = normalizePersistedMockRuleRecord(
      resourceStorage.read('mock-rule', req.params.mockRuleId),
    );

    if (!rule) {
      return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
        mockRuleId: req.params.mockRuleId,
      });
    }

    return sendData(res, { rule });
  } catch (error) {
    return sendError(res, 500, 'mock_rule_detail_failed', error.message, {
      mockRuleId: req.params.mockRuleId,
    });
  }
});

app.patch('/api/mock-rules/:mockRuleId', (req, res) => {
  const input = req.body?.rule;
  const validationError = validateMockRuleInput(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_mock_rule', validationError, {
      mockRuleId: req.params.mockRuleId,
    });
  }

  try {
    const existingRule = normalizePersistedMockRuleRecord(
      resourceStorage.read('mock-rule', req.params.mockRuleId),
    );

    if (!existingRule) {
      return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
        mockRuleId: req.params.mockRuleId,
      });
    }

    const rule = createMockRuleRecord(input, existingRule, existingRule.workspaceId || DEFAULT_WORKSPACE_ID);
    resourceStorage.save('mock-rule', rule);
    return sendData(res, { rule });
  } catch (error) {
    return sendError(res, 500, 'mock_rule_update_failed', error.message, {
      mockRuleId: req.params.mockRuleId,
    });
  }
});

app.delete('/api/mock-rules/:mockRuleId', (req, res) => {
  try {
    const deleted = resourceStorage.delete('mock-rule', req.params.mockRuleId);

    if (!deleted) {
      return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
        mockRuleId: req.params.mockRuleId,
      });
    }

    return sendData(res, { deletedRuleId: req.params.mockRuleId });
  } catch (error) {
    return sendError(res, 500, 'mock_rule_delete_failed', error.message, {
      mockRuleId: req.params.mockRuleId,
    });
  }
});

app.post('/api/mock-rules/:mockRuleId/enable', (req, res) => {
  try {
    const existingRule = normalizePersistedMockRuleRecord(
      resourceStorage.read('mock-rule', req.params.mockRuleId),
    );

    if (!existingRule) {
      return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
        mockRuleId: req.params.mockRuleId,
      });
    }

    const rule = createMockRuleRecord(
      {
        ...existingRule,
        enabled: true,
      },
      existingRule,
      existingRule.workspaceId || DEFAULT_WORKSPACE_ID,
    );
    resourceStorage.save('mock-rule', rule);
    return sendData(res, { rule });
  } catch (error) {
    return sendError(res, 500, 'mock_rule_enable_failed', error.message, {
      mockRuleId: req.params.mockRuleId,
    });
  }
});

app.post('/api/mock-rules/:mockRuleId/disable', (req, res) => {
  try {
    const existingRule = normalizePersistedMockRuleRecord(
      resourceStorage.read('mock-rule', req.params.mockRuleId),
    );

    if (!existingRule) {
      return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
        mockRuleId: req.params.mockRuleId,
      });
    }

    const rule = createMockRuleRecord(
      {
        ...existingRule,
        enabled: false,
      },
      existingRule,
      existingRule.workspaceId || DEFAULT_WORKSPACE_ID,
    );
    resourceStorage.save('mock-rule', rule);
    return sendData(res, { rule });
  } catch (error) {
    return sendError(res, 500, 'mock_rule_disable_failed', error.message, {
      mockRuleId: req.params.mockRuleId,
    });
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
    const executionRequest = createExecutionRequestSeed(input);
    const stageResults = {};
    let target = null;
    let responseStatus = null;
    let responseHeaders = [];
    let responseBodyText = '';

    stageResults['pre-request'] = executeScriptStage('pre-request', executionRequest.scripts.preRequest, {
      executionRequest,
    });

    if (stageResults['pre-request'].status === 'blocked'
      || stageResults['pre-request'].status === 'failed'
      || stageResults['pre-request'].status === 'timed_out') {
      stageResults.transport = createTransportSkippedStageResult(
        'Transport did not start because the Pre-request stage did not complete successfully.',
      );
      stageResults['post-response'] = createSkippedScriptStageAfterTransport(
        'post-response',
        'Post-response did not run because transport never started.',
      );
      stageResults.tests = createSkippedScriptStageAfterTransport(
        'tests',
        'Tests did not run because transport never started.',
      );
    } else {
      try {
        target = createExecutionRequestTarget(executionRequest.url, executionRequest.params, executionRequest.auth);
        const headers = createExecutionHeaders(executionRequest.headers, executionRequest.auth);
        const body = createExecutionBody(executionRequest, headers);
        const response = await fetch(target.toString(), {
          method: executionRequest.method,
          headers,
          ...(body !== undefined ? { body } : {}),
        });

        responseStatus = response.status;
        responseBodyText = await response.text();
        responseHeaders = Array.from(response.headers.entries()).map(([name, value]) => ({ name, value }));
        stageResults.transport = createTransportStageResult(
          response.status,
          createHostPathHint(target.toString()),
        );
        stageResults['post-response'] = executeScriptStage('post-response', executionRequest.scripts.postResponse, {
          executionRequest,
          target,
          responseStatus,
          responseHeaders,
          responseBodyText,
        });
        stageResults.tests = executeScriptStage('tests', executionRequest.scripts.tests, {
          executionRequest,
          target,
          responseStatus,
          responseHeaders,
          responseBodyText,
        });
      } catch (error) {
        stageResults.transport = createTransportFailureStageResult(error);
        stageResults['post-response'] = createSkippedScriptStageAfterTransport(
          'post-response',
          'Post-response did not run because transport failed before a response snapshot was available.',
        );
        stageResults.tests = createSkippedScriptStageAfterTransport(
          'tests',
          'Tests did not run because transport failed before a response snapshot was available.',
        );
      }
    }

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAtMs;
    const requestSnapshot = createPersistedRequestSnapshotSafely(executionRequest, target);
    const responseBodyPreview = responseBodyText.slice(0, 4000);
    const executionOutcome = deriveExecutionOutcome(stageResults);
    const consoleEntries = createCombinedConsoleEntries(stageResults);
    const consoleWarningCount = countConsoleWarnings(stageResults);
    const testsSummary = createObservationTestsSummary(stageResults);
    const testEntries = createObservationTestEntries(stageResults);
    const { errorCode, errorSummary } = createExecutionErrorMetadata(stageResults);
    const execution = createExecutionObservation({
      executionId,
      executionOutcome,
      responseStatus,
      responseHeaders,
      responseBodyPreview,
      responsePreviewLength: responseBodyText.length > 0 ? Buffer.byteLength(responseBodyText, 'utf8') : 0,
      responsePreviewTruncated: responseBodyText.length > 4000,
      startedAt,
      completedAt,
      durationMs,
      requestSnapshot,
      consoleSummary: createObservationConsoleSummary(stageResults, consoleEntries, consoleWarningCount),
      consoleEntries,
      consoleLogCount: countConsoleEntries(stageResults),
      consoleWarningCount,
      testsSummary,
      testEntries,
      stageSummaries: createObservationStageSummaries(stageResults),
      ...(errorCode ? { errorCode } : {}),
      ...(errorSummary ? { errorSummary } : {}),
    });

    runtimeStorage.insertExecutionHistory({
      id: executionId,
      workspaceId: input.workspaceId || null,
      requestId: input.id || null,
      environmentId: null,
      status: createPersistedExecutionStatus(executionOutcome),
      cancellationOutcome: null,
      startedAt,
      completedAt,
      durationMs,
      errorCode: errorCode || null,
      errorMessage: errorSummary || null,
    });
    runtimeStorage.insertExecutionResult({
      executionId,
      responseStatus,
      responseHeadersJson: JSON.stringify(responseHeaders),
      responseBodyPreview,
      responseBodyRedacted: true,
      stageStatusJson: JSON.stringify({
        preRequest: stageResults['pre-request'],
        transport: stageResults.transport,
        postResponse: stageResults['post-response'],
        tests: stageResults.tests,
      }),
      logSummaryJson: JSON.stringify(createPersistedLogSummary(stageResults)),
      requestSnapshotJson: JSON.stringify(requestSnapshot),
      redactionApplied: true,
    });
    runtimeStorage.insertTestResults(createPersistedTestResultRecords(executionId, stageResults.tests));

    return sendData(res, { execution });
  } catch (error) {
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAtMs;
    const requestSnapshot = createPersistedRequestSnapshotSafely(input, null);

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
      consoleSummary: 'No console entries were captured because the run lane itself failed before script diagnostics could be summarized.',
      consoleEntries: [],
      consoleLogCount: 0,
      consoleWarningCount: 0,
      testsSummary: 'No tests were recorded because the run lane failed before execution could complete.',
      testEntries: [],
      stageSummaries: [
        createFriendlyStageSummary('transport', createTransportFailureStageResult(error)),
      ],
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
        stageStatusJson: JSON.stringify({
          transport: createTransportFailureStageResult(error),
        }),
        logSummaryJson: JSON.stringify({ consoleEntries: 0, consoleWarnings: 0, consolePreview: [] }),
        requestSnapshotJson: JSON.stringify(requestSnapshot),
        redactionApplied: true,
      });
    } catch (storageError) {
      console.error('Execution persistence error:', storageError);
    }

    return sendData(res, { execution });
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

function waitForDelay(delayMs) {
  if (!delayMs || delayMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

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
    } catch {
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

app.all(/.*/, async (req, res) => {
  if (req.path === '/events' || req.path.startsWith('/__inspector') || req.path.startsWith('/api/')) {
    return;
  }

  const host = req.get('host') || 'localhost';
  const inboundUrl = new URL(req.originalUrl, `${req.protocol}://${host}`);
  const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : '');

  let evaluationResult;

  try {
    const persistedRules = resourceStorage
      .list('mock-rule')
      .filter((rule) => rule.workspaceId === DEFAULT_WORKSPACE_ID);

    evaluationResult = evaluateMockRules(
      persistedRules,
      {
        method: req.method.toUpperCase(),
        pathname: inboundUrl.pathname,
        searchParams: inboundUrl.searchParams,
        headers: req.headers,
        rawBody,
      },
      mockConfig,
    );
  } catch (error) {
    evaluationResult = {
      outcome: 'Blocked',
      matchedRuleId: null,
      matchedRuleName: null,
      appliedDelayMs: null,
      mockEvaluationSummary: `Mock evaluation was blocked before response generation. ${error.message}`,
      response: {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            blocked: true,
            reason: 'Mock evaluation failed before a response could be generated.',
          },
          null,
          2,
        ),
      },
    };
  }

  if (typeof evaluationResult.appliedDelayMs === 'number' && evaluationResult.appliedDelayMs > 0) {
    await waitForDelay(evaluationResult.appliedDelayMs);
  }

  const persistedCapture = createPersistedCapturedRequestRecord(req, evaluationResult);
  const captureRecord = createCapturedRequestRecord({
    id: persistedCapture.id,
    workspaceId: persistedCapture.workspaceId,
    method: persistedCapture.method,
    url: persistedCapture.url,
    path: persistedCapture.path,
    statusCode: persistedCapture.statusCode,
    matchedMockRuleId: persistedCapture.matchedMockRuleId,
    matchedMockRuleName: persistedCapture.matchedMockRuleName,
    requestHeaders: JSON.parse(persistedCapture.requestHeadersJson),
    requestBodyPreview: persistedCapture.requestBodyPreview,
    requestBodyRedacted: persistedCapture.requestBodyRedacted,
    receivedAt: persistedCapture.receivedAt,
    mockOutcome: persistedCapture.mockOutcome,
    mockEvaluationSummary: persistedCapture.mockEvaluationSummary,
    appliedDelayMs: persistedCapture.appliedDelayMs,
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

  res.status(Number(evaluationResult.response.statusCode));

  for (const [headerName, headerValue] of Object.entries(evaluationResult.response.headers || {})) {
    res.set(headerName, headerValue);
  }

  res.send(evaluationResult.response.body);
});

app.listen(PORT, () => {
  const appShellStatus = getClientShellStatus();

  console.log(`[Ready] Server: http://localhost:${PORT}`);
  console.log(`[Ready] Legacy prototype: http://localhost:${PORT}/`);
  console.log(
    appShellStatus.builtClientAvailable
      ? `[Ready] Built app shell: http://localhost:${PORT}${appShellStatus.appRoute}`
      : `[Ready] Built app shell unavailable at ${appShellStatus.appRoute}. Run "${appShellStatus.buildCommand}" or use ${appShellStatus.devClientUrl} for development.`,
  );
});






