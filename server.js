const express = require('express');
const path = require('path');
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
  createCollectionRecord,
  normalizePersistedCollectionRecord,
  createRequestGroupRecord,
  normalizePersistedRequestGroupRecord,
  compareRequestPlacementRecords,
  validateCollectionInput,
  validateRequestGroupInput,
  createStableCollectionId,
  createStableRequestGroupId,
  DEFAULT_REQUEST_COLLECTION_NAME,
  DEFAULT_REQUEST_GROUP_NAME,
} = require('./storage/resource/request-placement-record');
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
  createEnvironmentResolutionSummary,
  resolveExecutionRequestWithEnvironment,
  sanitizeEnvironmentResolutionSummary,
  summarizeUnresolvedEnvironmentPlaceholders,
} = require('./storage/resource/environment-resolution');
const {
  createSavedScriptRecord,
  normalizePersistedSavedScriptRecord,
  compareSavedScriptRecords,
  validateSavedScriptInput,
  listSystemScriptTemplates,
  readSystemScriptTemplate,
} = require('./storage/resource/script-record');
const {
  REQUEST_SCRIPT_STAGE_IDS,
  listLinkedRequestScriptStages,
  normalizeRequestScriptsState,
  remapRequestScriptsForImport,
  resolveRequestScriptsForExecution,
  serializeRequestScriptsForBundle,
} = require('./storage/resource/request-script-binding');
const {
  COLLECTION_RESOURCE_SCHEMA_VERSION,
  MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  REQUEST_RESOURCE_SCHEMA_VERSION,
  REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
  SCRIPT_RESOURCE_SCHEMA_VERSION,
  RESOURCE_RECORD_KINDS,
  RUNTIME_REQUEST_SNAPSHOT_SCHEMA_VERSION,
} = require('./storage/shared/constants');
const { createRuntimeStatusSnapshot } = require('./storage/shared/runtime-status');
const { runScriptStageInChildProcess } = require('./server/execution-script-runner');
const { runLegacyCallbackInChildProcess } = require('./server/legacy-callback-runner');
const { registerAppShellRoutes } = require('./server/register-app-shell-routes');
const { configureRuntimeStream } = require('./server/configure-runtime-stream');
const { registerEnvironmentScriptRoutes } = require('./server/register-environment-script-routes');
const { registerExecutionRoutes } = require('./server/register-execution-routes');
const { registerLegacyInspectorRoutes } = require('./server/register-legacy-inspector-routes');
const { registerMockRuleRoutes } = require('./server/register-mock-rule-routes');
const { createCaptureObservationService } = require('./server/capture-observation-service');
const { createExecutionObservationService } = require('./server/execution-observation-service');
const { createRequestResourceService } = require('./server/request-resource-service');
const { registerRequestResourceRoutes } = require('./server/register-request-resource-routes');
const { registerResourceBundleRoutes } = require('./server/register-resource-bundle-routes');
const { registerRuntimeRoutes } = require('./server/register-runtime-routes');
const { registerStatusRoutes } = require('./server/register-status-routes');

const app = express();
const PORT = 5671;
const persistence = bootstrapPersistence();
const resourceStorage = persistence.resourceStorage;
const repositories = persistence.repositories;
const activeExecutions = new Map();

function registerActiveExecution(executionId) {
  const controller = new AbortController();
  activeExecutions.set(executionId, {
    controller,
    startedAt: new Date().toISOString(),
  });
  return controller;
}

function clearActiveExecution(executionId) {
  activeExecutions.delete(executionId);
}

function cancelActiveExecution(executionId) {
  const activeExecution = activeExecutions.get(executionId);

  if (!activeExecution) {
    return false;
  }

  activeExecution.controller.abort('Execution was cancelled by API request.');
  return true;
}

const { getClientShellStatus } = registerAppShellRoutes(app, {
  express,
  fs,
  rootDir: __dirname,
});
const { getEventClients } = configureRuntimeStream(app, express);

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

const {
  cloneRows,
  cloneAuth,
  cloneScripts,
  createRequestSummary,
  validateRequestDefinition,
  normalizeText,
  readWorkspaceCollectionReference,
  persistCollectionRecord,
  persistRequestGroupRecord,
  findCollectionByName,
  findRequestGroupByName,
  sortRequestGroups,
  normalizeSavedRequest,
  normalizePersistedRequestRecord,
  serializeRequestRecordForBundle,
  collectRequestBundleSavedScripts,
  listWorkspaceSavedRequestRecords,
  listWorkspaceCollectionRecords,
  listWorkspaceRequestGroupRecords,
  reconcileWorkspaceRequestPlacementState,
  presentCollectionRecord,
  presentRequestGroupRecord,
  buildWorkspaceRequestTree,
} = createRequestResourceService({
  randomUUID,
  resourceStorage,
  defaultWorkspaceId: DEFAULT_WORKSPACE_ID,
  normalizeRequestScriptsState,
  serializeRequestScriptsForBundle,
  listLinkedRequestScriptStages,
  compareSavedScriptRecords,
  compareSavedRequestRecords,
  listWorkspaceSavedScriptRecords,
  createCollectionRecord,
  normalizePersistedCollectionRecord,
  createRequestGroupRecord,
  normalizePersistedRequestGroupRecord,
  compareRequestPlacementRecords,
  createStableCollectionId,
  createStableRequestGroupId,
  defaultRequestCollectionName: DEFAULT_REQUEST_COLLECTION_NAME,
  defaultRequestGroupName: DEFAULT_REQUEST_GROUP_NAME,
  requestResourceKind: RESOURCE_RECORD_KINDS.REQUEST,
  requestResourceSchemaVersion: REQUEST_RESOURCE_SCHEMA_VERSION,
});

const {
  createPersistedCapturedRequestRecord,
  createCapturedRequestRecord,
  createCaptureEventPayload,
  createCaptureReplayRequestSeed,
} = createCaptureObservationService({
  randomUUID,
  defaultWorkspaceId: DEFAULT_WORKSPACE_ID,
  sanitizeFieldValue,
  truncatePreview,
  redactStructuredJson,
  cloneAuth,
  createExecutionRequestSeed,
});

const {
  createPersistedLogSummary,
  createPersistedTestResultRecords,
  createExecutionErrorMetadata,
  createPersistedExecutionStatus,
  createHostPathHint,
  createHistoryRecord,
} = createExecutionObservationService({
  randomUUID,
  countConsoleEntries,
  countConsoleWarnings,
  createCombinedConsoleEntries,
  createStageStatusRecord,
  createEmptyScriptStageResult,
  createObservationStageSummaries,
  readPersistedEnvironmentResolutionSummary,
  createRequestSnapshotSummary,
  createRequestInputSummary,
  createPersistedAuthSnapshot,
  createPreviewSizeLabel,
  createResponsePreviewPolicy,
});

function createLinkedScriptRunStageResult(error) {
  const stageId = REQUEST_SCRIPT_STAGE_IDS.includes(error?.details?.stageId)
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

  const allowsLegacyRequestImport = (
    expectedKind === RESOURCE_RECORD_KINDS.REQUEST
    && Number(input.resourceSchemaVersion) === 1
    && supportedSchemaVersion === REQUEST_RESOURCE_SCHEMA_VERSION
    && REQUEST_RESOURCE_SCHEMA_VERSION === 2
  );

  if (input.resourceSchemaVersion != null && input.resourceSchemaVersion !== supportedSchemaVersion && !allowsLegacyRequestImport) {
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

  const collectionDiff = String(left.collectionName || DEFAULT_REQUEST_COLLECTION_NAME).localeCompare(
    String(right.collectionName || DEFAULT_REQUEST_COLLECTION_NAME),
  );
  if (collectionDiff !== 0) {
    return collectionDiff;
  }

  const requestGroupDiff = String(left.requestGroupName || DEFAULT_REQUEST_GROUP_NAME).localeCompare(
    String(right.requestGroupName || DEFAULT_REQUEST_GROUP_NAME),
  );
  if (requestGroupDiff !== 0) {
    return requestGroupDiff;
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

function readPersistedEnvironmentResolutionSummary(summary) {
  return sanitizeEnvironmentResolutionSummary(summary) || undefined;
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
  const environmentResolutionSummary = readPersistedEnvironmentResolutionSummary(
    requestSnapshot?.environmentResolutionSummary,
  );

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
    environmentId: typeof requestSnapshot?.environmentId === 'string' && requestSnapshot.environmentId.length > 0
      ? requestSnapshot.environmentId
      : null,
    environmentLabel: typeof requestSnapshot?.environmentLabel === 'string' && requestSnapshot.environmentLabel.length > 0
      ? requestSnapshot.environmentLabel
      : 'No environment selected',
    ...(environmentResolutionSummary ? { environmentResolutionSummary } : {}),
    requestCollectionName: requestSnapshot?.collectionName || undefined,
    requestGroupName: requestSnapshot?.requestGroupName || requestSnapshot?.folderName || undefined,
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
  const environmentResolutionSummary = readPersistedEnvironmentResolutionSummary(
    request?.environmentResolutionSummary,
  );
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
    environmentId: typeof request.selectedEnvironmentId === 'string' && request.selectedEnvironmentId.length > 0
      ? request.selectedEnvironmentId
      : null,
    environmentLabel: typeof request.selectedEnvironmentLabel === 'string' && request.selectedEnvironmentLabel.length > 0
      ? request.selectedEnvironmentLabel
      : 'No environment selected',
    collectionId: typeof request.collectionId === 'string' ? request.collectionId : '',
    collectionName: typeof request.collectionName === 'string' ? request.collectionName : '',
    requestGroupId: typeof request.requestGroupId === 'string' ? request.requestGroupId : '',
    requestGroupName: typeof request.requestGroupName === 'string'
      ? request.requestGroupName
      : (typeof request.folderName === 'string' ? request.folderName : ''),
    sourceLabel: request.id ? 'Saved request snapshot' : 'Ad hoc request snapshot',
    ...(environmentResolutionSummary ? { environmentResolutionSummary } : {}),
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
const SCRIPT_MESSAGE_LIMIT = 240;

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
    const environmentResolutionSummary = readPersistedEnvironmentResolutionSummary(
      request?.environmentResolutionSummary,
    );

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
      environmentId: typeof request?.selectedEnvironmentId === 'string' && request.selectedEnvironmentId.length > 0
        ? request.selectedEnvironmentId
        : null,
      environmentLabel: typeof request?.selectedEnvironmentLabel === 'string' && request.selectedEnvironmentLabel.length > 0
        ? request.selectedEnvironmentLabel
        : 'No environment selected',
      collectionId: typeof request?.collectionId === 'string' ? request.collectionId : '',
      collectionName: typeof request?.collectionName === 'string' ? request.collectionName : '',
      requestGroupId: typeof request?.requestGroupId === 'string' ? request.requestGroupId : '',
      requestGroupName: typeof request?.requestGroupName === 'string'
        ? request.requestGroupName
        : (typeof request?.folderName === 'string' ? request.folderName : ''),
      sourceLabel: request?.id ? 'Saved request snapshot' : 'Ad hoc request snapshot',
      ...(environmentResolutionSummary ? { environmentResolutionSummary } : {}),
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
    selectedEnvironmentId: typeof input.selectedEnvironmentId === 'string' && input.selectedEnvironmentId.trim().length > 0
      ? input.selectedEnvironmentId.trim()
      : null,
    params: cloneRows(input.params),
    headers: cloneRows(input.headers),
    bodyMode: input.bodyMode || 'none',
    bodyText: input.bodyText || '',
    formBody: cloneRows(input.formBody),
    multipartBody: cloneRows(input.multipartBody),
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
      ...(stageId === 'tests'
        && Array.isArray(childResult.testResults)
        && childResult.testResults.some((result) => result.status === 'failed')
        ? {
          errorCode: childResult.errorCode || 'script_assertion_failed',
          errorSummary: childResult.errorSummary || childResult.summary,
        }
        : {}),
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

registerStatusRoutes(app, {
  sendData,
  sendError,
  getClientShellStatus,
  createRuntimeStatusSnapshot,
  layout: persistence.layout,
});

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

function readWorkspaceEnvironmentReference(workspaceId, environmentId) {
  if (typeof environmentId !== 'string' || environmentId.trim().length === 0) {
    return null;
  }

  const environment = normalizePersistedEnvironmentRecord(
    resourceStorage.read('environment', environmentId.trim()),
  );

  if (!environment || environment.workspaceId !== workspaceId) {
    return null;
  }

  return environment;
}

function createImportedResourceRejection(kind, reason, name) {
  return {
    kind,
    reason,
    ...(typeof name === 'string' && name.trim().length > 0 ? { name: name.trim() } : {}),
  };
}

function createImportedScopedRequestGroupName(name, collectionId, usedScopedNames) {
  const baseName = normalizeText(name) || DEFAULT_REQUEST_GROUP_NAME;
  const scopedNames = usedScopedNames || new Set();
  const normalizedBaseKey = `${collectionId}::${baseName.toLowerCase()}`;

  if (!scopedNames.has(normalizedBaseKey)) {
    scopedNames.add(normalizedBaseKey);
    return baseName;
  }

  let suffixIndex = 1;
  while (true) {
    const nextName = suffixIndex === 1 ? `${baseName} (Imported)` : `${baseName} (Imported ${suffixIndex})`;
    const nextKey = `${collectionId}::${nextName.toLowerCase()}`;

    if (!scopedNames.has(nextKey)) {
      scopedNames.add(nextKey);
      return nextName;
    }

    suffixIndex += 1;
  }
}

function normalizeWorkspaceResourceBundle(bundle, workspaceId) {
  const collections = Array.isArray(bundle.collections) ? bundle.collections.map((record) => ({ ...record })) : [];
  const requestGroups = Array.isArray(bundle.requestGroups) ? bundle.requestGroups.map((record) => ({ ...record })) : [];
  const collectionByName = new Map(
    collections
      .filter((record) => normalizeText(record?.name).length > 0)
      .map((record) => [normalizeText(record.name).toLowerCase(), record]),
  );
  const requestGroupKeys = new Set(
    requestGroups.map((record) => `${normalizeText(record.collectionId)}::${normalizeText(record.name).toLowerCase()}`),
  );

  for (const request of Array.isArray(bundle.requests) ? bundle.requests : []) {
    const collectionName = normalizeText(request?.collectionName) || DEFAULT_REQUEST_COLLECTION_NAME;
    let collectionRecord = collectionByName.get(collectionName.toLowerCase()) ?? null;

    if (!collectionRecord) {
      collectionRecord = {
        resourceKind: RESOURCE_RECORD_KINDS.COLLECTION,
        resourceSchemaVersion: COLLECTION_RESOURCE_SCHEMA_VERSION,
        id: normalizeText(request?.collectionId) || createStableCollectionId(workspaceId, collectionName),
        workspaceId,
        name: collectionName,
        description: '',
      };
      collections.push(collectionRecord);
      collectionByName.set(collectionName.toLowerCase(), collectionRecord);
    }

    const requestGroupName = normalizeText(request?.requestGroupName || request?.folderName) || DEFAULT_REQUEST_GROUP_NAME;
    const requestGroupKey = `${collectionRecord.id}::${requestGroupName.toLowerCase()}`;

    if (!requestGroupKeys.has(requestGroupKey)) {
      requestGroups.push({
        resourceKind: RESOURCE_RECORD_KINDS.REQUEST_GROUP,
        resourceSchemaVersion: REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
        id: normalizeText(request?.requestGroupId) || createStableRequestGroupId(workspaceId, collectionRecord.id, requestGroupName),
        workspaceId,
        collectionId: collectionRecord.id,
        name: requestGroupName,
        description: '',
      });
      requestGroupKeys.add(requestGroupKey);
    }
  }

  return {
    ...bundle,
    collections,
    requestGroups,
  };
}

function createImportedCollectionResource(input, workspaceId, usedNames, state) {
  const compatibilityError = validateImportedResourceCompatibility(
    input,
    RESOURCE_RECORD_KINDS.COLLECTION,
    COLLECTION_RESOURCE_SCHEMA_VERSION,
  );

  if (compatibilityError) {
    return {
      rejection: createImportedResourceRejection('collection', compatibilityError, input?.name),
    };
  }

  const validationError = validateCollectionInput(input);

  if (validationError) {
    return {
      rejection: createImportedResourceRejection('collection', validationError, input?.name),
    };
  }

  const importedName = createImportedResourceName(input.name, usedNames);
  const record = createCollectionRecord(
    {
      ...input,
      id: randomUUID(),
      name: importedName,
    },
    null,
    workspaceId,
  );

  if (normalizeText(input?.id)) {
    state.collectionIdMap.set(normalizeText(input.id), record.id);
  }
  state.collectionRecordBySourceName.set(normalizeText(input?.name).toLowerCase(), record);

  return {
    record,
    renamed: importedName !== normalizeText(input?.name),
  };
}

function createImportedRequestGroupResource(input, workspaceId, state) {
  const compatibilityError = validateImportedResourceCompatibility(
    input,
    RESOURCE_RECORD_KINDS.REQUEST_GROUP,
    REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
  );

  if (compatibilityError) {
    return {
      rejection: createImportedResourceRejection('request-group', compatibilityError, input?.name),
    };
  }

  const sourceCollectionId = normalizeText(input?.collectionId);
  const mappedCollectionId = state.collectionIdMap.get(sourceCollectionId) || sourceCollectionId;
  const collectionRecord = readWorkspaceCollectionReference(workspaceId, mappedCollectionId)
    || state.importedCollectionById.get(mappedCollectionId)
    || state.collectionRecordBySourceName.get(normalizeText(input?.collectionName).toLowerCase())
    || null;

  if (!collectionRecord) {
    return {
      rejection: createImportedResourceRejection(
        'request-group',
        'Request group references a collection that is not available in this workspace import.',
        input?.name,
      ),
    };
  }

  const validationError = validateRequestGroupInput({
    ...input,
    collectionId: collectionRecord.id,
  });

  if (validationError) {
    return {
      rejection: createImportedResourceRejection('request-group', validationError, input?.name),
    };
  }

  const importedName = createImportedScopedRequestGroupName(input.name, collectionRecord.id, state.usedRequestGroupKeys);
  const record = createRequestGroupRecord(
    {
      ...input,
      id: randomUUID(),
      collectionId: collectionRecord.id,
      name: importedName,
    },
    null,
    workspaceId,
  );

  if (normalizeText(input?.id)) {
    state.requestGroupIdMap.set(normalizeText(input.id), record.id);
  }
  state.importedRequestGroupById.set(record.id, record);
  state.requestGroupRecordBySourceKey.set(
    `${sourceCollectionId || normalizeText(input?.collectionName).toLowerCase()}::${normalizeText(input?.name).toLowerCase()}`,
    record,
  );

  return {
    record,
    renamed: importedName !== normalizeText(input?.name),
  };
}

function createImportedRequestRecord(input, workspaceId, usedNames, state) {
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
  const remappedScripts = remapRequestScriptsForImport(
    input.scripts,
    (sourceSavedScriptId, linkedStage) =>
      state.importedScriptBySourceId.get(normalizeText(sourceSavedScriptId))
      || state.importedScriptBySourceName.get(normalizeText(linkedStage?.savedScriptNameSnapshot).toLowerCase())
      || null,
  );

  if (remappedScripts.unresolvedLinks.length > 0) {
    const unresolvedLink = remappedScripts.unresolvedLinks[0];
    const unresolvedScriptName = normalizeText(unresolvedLink.savedScriptNameSnapshot)
      || normalizeText(unresolvedLink.savedScriptId)
      || 'linked saved script';

    return {
      rejection: createImportedResourceRejection(
        'request',
        `Request references linked saved script "${unresolvedScriptName}" in the ${unresolvedLink.stageId} stage, but that script is not available in this bundle.`,
        input?.name,
      ),
    };
  }

  return {
    record: normalizeSavedRequest(
      {
        ...input,
        id: randomUUID(),
        workspaceId,
        name: importedName,
        scripts: remappedScripts.scripts,
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

function createImportedScriptResource(input, workspaceId, usedNames, state) {
  const compatibilityError = validateImportedResourceCompatibility(
    input,
    RESOURCE_RECORD_KINDS.SCRIPT,
    SCRIPT_RESOURCE_SCHEMA_VERSION,
  );

  if (compatibilityError) {
    return {
      rejection: createImportedResourceRejection('script', compatibilityError, input?.name),
    };
  }

  const validationError = validateSavedScriptInput(input);

  if (validationError) {
    return {
      rejection: createImportedResourceRejection('script', validationError, input?.name),
    };
  }

  const importedName = createImportedResourceName(input.name, usedNames);
  const record = createSavedScriptRecord(
    {
      ...input,
      id: randomUUID(),
      name: importedName,
    },
    null,
    workspaceId,
  );

  if (normalizeText(input?.id)) {
    state.importedScriptBySourceId.set(normalizeText(input.id), record);
  }
  state.importedScriptBySourceName.set(normalizeText(input?.name).toLowerCase(), record);

  return {
    record,
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
  const normalizedBundle = normalizeWorkspaceResourceBundle(bundle, workspaceId);
  const {
    collections: existingCollections,
    requestGroups: existingRequestGroups,
    requests: existingRequests,
  } = reconcileWorkspaceRequestPlacementState(workspaceId);
  const existingMockRules = listWorkspaceMockRuleRecords(workspaceId);
  const existingScripts = listWorkspaceSavedScriptRecords(workspaceId);
  const importState = {
    collectionIdMap: new Map(),
    collectionRecordBySourceName: new Map(),
    importedCollectionById: new Map(existingCollections.map((record) => [record.id, record])),
    requestGroupIdMap: new Map(),
    requestGroupRecordBySourceKey: new Map(),
    importedRequestGroupById: new Map(existingRequestGroups.map((record) => [record.id, record])),
    usedRequestGroupKeys: new Set(
      existingRequestGroups.map((record) => `${record.collectionId}::${normalizeText(record.name).toLowerCase()}`),
    ),
    importedScriptBySourceId: new Map(),
    importedScriptBySourceName: new Map(),
  };

  return prepareAuthoredResourceImport({
    bundle: normalizedBundle,
    workspaceId,
    existingCollectionNames: existingCollections.map((record) => record.name),
    existingRequestGroupNames: [],
    existingRequestNames: existingRequests.map((record) => record.name),
    existingMockRuleNames: existingMockRules.map((record) => record.name),
    existingScriptNames: existingScripts.map((record) => record.name),
    createImportedCollection: (input, nextWorkspaceId, usedNames) => {
      const result = createImportedCollectionResource(input, nextWorkspaceId, usedNames, importState);

      if (result.record) {
        importState.importedCollectionById.set(result.record.id, result.record);
      }

      return result;
    },
    createImportedRequestGroup: (input, nextWorkspaceId) =>
      createImportedRequestGroupResource(input, nextWorkspaceId, importState),
    createImportedRequest: (input, nextWorkspaceId, usedNames) => {
      const sourceCollectionId = normalizeText(input?.collectionId);
      const sourceRequestGroupId = normalizeText(input?.requestGroupId);
      const mappedCollectionId = importState.collectionIdMap.get(sourceCollectionId) || sourceCollectionId;
      const mappedRequestGroupId = importState.requestGroupIdMap.get(sourceRequestGroupId) || sourceRequestGroupId;
      const sourceCollectionRecord = importState.importedCollectionById.get(mappedCollectionId)
        || importState.collectionRecordBySourceName.get(normalizeText(input?.collectionName).toLowerCase())
        || null;
      const requestGroupSourceKey = `${sourceCollectionId || normalizeText(input?.collectionName).toLowerCase()}::${normalizeText(input?.requestGroupName || input?.folderName).toLowerCase()}`;
      const sourceRequestGroupRecord = importState.importedRequestGroupById.get(mappedRequestGroupId)
        || importState.requestGroupRecordBySourceKey.get(requestGroupSourceKey)
        || null;

      return createImportedRequestRecord(
        {
          ...input,
          ...(sourceCollectionRecord
            ? {
                collectionId: sourceCollectionRecord.id,
                collectionName: sourceCollectionRecord.name,
              }
            : {}),
          ...(sourceRequestGroupRecord
            ? {
                requestGroupId: sourceRequestGroupRecord.id,
                requestGroupName: sourceRequestGroupRecord.name,
              }
            : {}),
        },
        nextWorkspaceId,
        usedNames,
        importState,
      );
    },
    createImportedMockRule: createImportedMockRuleResource,
    createImportedScript: (input, nextWorkspaceId, usedNames) =>
      createImportedScriptResource(input, nextWorkspaceId, usedNames, importState),
    sortAcceptedCollections: (records) => [...records].sort(compareRequestPlacementRecords),
    sortAcceptedRequestGroups: (records) => sortRequestGroups(records),
    sortAcceptedRequests: (records) => [...records].sort(compareSavedRequestRecords),
    sortAcceptedMockRules: (records) => [...records].sort(compareMockRuleRecords),
    sortAcceptedScripts: (records) => [...records].sort(compareSavedScriptRecords),
  });
}
registerRequestResourceRoutes(app, {
  sendData,
  sendError,
  repositories,
  defaultWorkspaceId: DEFAULT_WORKSPACE_ID,
  listWorkspaceSavedRequestRecords,
  buildWorkspaceRequestTree,
  listWorkspaceCollectionRecords,
  presentCollectionRecord,
  validateCollectionInput,
  findCollectionByName,
  persistCollectionRecord,
  createCollectionRecord,
  normalizePersistedCollectionRecord,
  listWorkspaceRequestGroupRecords,
  presentRequestGroupRecord,
  validateRequestGroupInput,
  findRequestGroupByName,
  persistRequestGroupRecord,
  createRequestGroupRecord,
  normalizePersistedRequestGroupRecord,
  validateRequestDefinition,
  readWorkspaceEnvironmentReference,
  normalizeSavedRequest,
  normalizePersistedRequestRecord,
});

registerEnvironmentScriptRoutes(app, {
  sendData,
  sendError,
  repositories,
  defaultWorkspaceId: DEFAULT_WORKSPACE_ID,
  validateEnvironmentInput,
  createEnvironmentRecord,
  normalizePersistedEnvironmentRecord,
  presentEnvironmentRecord,
  summarizePresentedEnvironmentRecord,
  listWorkspaceEnvironmentRecords,
  upsertWorkspaceEnvironmentRecord,
  reconcileWorkspaceEnvironmentDefaults,
  validateSavedScriptInput,
  createSavedScriptRecord,
  normalizePersistedSavedScriptRecord,
  listWorkspaceSavedScriptRecords,
  listSystemScriptTemplates,
  readSystemScriptTemplate,
});

registerResourceBundleRoutes(app, {
  sendData,
  sendError,
  repositories,
  defaultWorkspaceId: DEFAULT_WORKSPACE_ID,
  buildAuthoredResourceBundle,
  normalizePersistedRequestRecord,
  reconcileWorkspaceRequestPlacementState,
  serializeRequestRecordForBundle,
  listWorkspaceMockRuleRecords,
  listWorkspaceSavedScriptRecords,
  collectRequestBundleSavedScripts,
  parseWorkspaceResourceBundleImportRequest,
  prepareWorkspaceResourceBundleImport,
});

registerMockRuleRoutes(app, {
  sendData,
  sendError,
  repositories,
  defaultWorkspaceId: DEFAULT_WORKSPACE_ID,
  buildAuthoredResourceBundle,
  validateMockRuleInput,
  createMockRuleRecord,
  normalizePersistedMockRuleRecord,
  listWorkspaceMockRuleRecords,
});


registerExecutionRoutes(app, {
  sendData,
  sendError,
  repositories,
  defaultWorkspaceId: DEFAULT_WORKSPACE_ID,
  registerActiveExecution,
  clearActiveExecution,
  validateRequestDefinition,
  createExecutionRequestSeed,
  resolveRequestScriptsForExecution,
  normalizePersistedSavedScriptRecord,
  createLinkedScriptRunStageResult,
  createEnvironmentResolutionSummary,
  executeScriptStage,
  readWorkspaceEnvironmentReference,
  createTransportSkippedStageResult,
  createSkippedScriptStageAfterTransport,
  createTransportBlockedStageResult,
  resolveExecutionRequestWithEnvironment,
  createResolvedEnvironmentLabel,
  summarizeUnresolvedEnvironmentPlaceholders,
  createExecutionRequestTarget,
  createExecutionHeaders,
  createExecutionBody,
  createTransportStageResult,
  createHostPathHint,
  createTransportCancelledStageResult,
  createTransportFailureStageResult,
  createPersistedRequestSnapshotSafely,
  deriveExecutionOutcome,
  createCombinedConsoleEntries,
  countConsoleWarnings,
  createObservationTestsSummary,
  createObservationTestEntries,
  createExecutionErrorMetadata,
  createExecutionObservation,
  createObservationConsoleSummary,
  countConsoleEntries,
  createObservationStageSummaries,
  createPersistedExecutionStatus,
  createPersistedLogSummary,
  createPersistedTestResultRecords,
  createFriendlyStageSummary,
});


registerRuntimeRoutes(app, {
  repositories,
  sendData,
  sendError,
  cancelActiveExecution,
  createHistoryRecord,
  createCapturedRequestRecord,
  createCaptureReplayRequestSeed,
});

registerLegacyInspectorRoutes(app, {
  fs,
  path,
  rootDir: __dirname,
  defaultWorkspaceId: DEFAULT_WORKSPACE_ID,
  repositories,
  evaluateMockRules,
  runLegacyCallbackInChildProcess,
  createPersistedCapturedRequestRecord,
  createCapturedRequestRecord,
  createCaptureEventPayload,
  getEventClients,
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








