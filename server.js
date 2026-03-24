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
const { createExecutionFlowService } = require('./server/execution-flow-service');
const { createRequestResourceService } = require('./server/request-resource-service');
const { createEnvironmentScriptResourceService } = require('./server/environment-script-resource-service');
const { createMockRuleResourceService } = require('./server/mock-rule-resource-service');
const { createResourceBundleImportService } = require('./server/resource-bundle-import-service');
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
  listWorkspaceEnvironmentRecords,
  listWorkspaceSavedScriptRecords,
  upsertWorkspaceEnvironmentRecord,
  reconcileWorkspaceEnvironmentDefaults,
  readWorkspaceEnvironmentReference,
} = createEnvironmentScriptResourceService({
  repositories,
  enforceEnvironmentDefaults,
  normalizePersistedEnvironmentRecord,
  compareEnvironmentRecords,
  normalizePersistedSavedScriptRecord,
  compareSavedScriptRecords,
});

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
} = createExecutionFlowService({
  cloneRows,
  cloneAuth,
  cloneScripts,
  normalizeText,
  requestScriptStageIds: REQUEST_SCRIPT_STAGE_IDS,
  runScriptStageInChildProcess,
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

const {
  normalizePersistedMockRuleRecord,
  compareMockRuleRecords,
  listWorkspaceMockRuleRecords,
} = createMockRuleResourceService({
  repositories,
  resourceRecordKinds: RESOURCE_RECORD_KINDS,
  mockRuleResourceSchemaVersion: MOCK_RULE_RESOURCE_SCHEMA_VERSION,
});

const {
  parseWorkspaceResourceBundleImportRequest,
  prepareWorkspaceResourceBundleImport,
} = createResourceBundleImportService({
  randomUUID,
  sendError,
  parseAuthoredResourceBundleText,
  prepareAuthoredResourceImport,
  createImportedResourceName,
  normalizeText,
  readWorkspaceCollectionReference,
  reconcileWorkspaceRequestPlacementState,
  listWorkspaceMockRuleRecords,
  listWorkspaceSavedScriptRecords,
  compareRequestPlacementRecords,
  sortRequestGroups,
  compareSavedRequestRecords,
  compareMockRuleRecords,
  compareSavedScriptRecords,
  createCollectionRecord,
  validateCollectionInput,
  createStableCollectionId,
  defaultRequestCollectionName: DEFAULT_REQUEST_COLLECTION_NAME,
  createRequestGroupRecord,
  validateRequestGroupInput,
  createStableRequestGroupId,
  defaultRequestGroupName: DEFAULT_REQUEST_GROUP_NAME,
  normalizeSavedRequest,
  validateRequestDefinition,
  remapRequestScriptsForImport,
  createMockRuleRecord,
  validateMockRuleInput,
  createSavedScriptRecord,
  validateSavedScriptInput,
  collectionResourceSchemaVersion: COLLECTION_RESOURCE_SCHEMA_VERSION,
  requestGroupResourceSchemaVersion: REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
  requestResourceSchemaVersion: REQUEST_RESOURCE_SCHEMA_VERSION,
  mockRuleResourceSchemaVersion: MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  scriptResourceSchemaVersion: SCRIPT_RESOURCE_SCHEMA_VERSION,
  resourceRecordKinds: RESOURCE_RECORD_KINDS,
});

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

registerStatusRoutes(app, {
  sendData,
  sendError,
  getClientShellStatus,
  createRuntimeStatusSnapshot,
  layout: persistence.layout,
});

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








