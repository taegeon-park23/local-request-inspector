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
const { createRuntimePresentationService } = require('./server/runtime-presentation-service');
const { createRequestResourceService } = require('./server/request-resource-service');
const { createEnvironmentScriptResourceService } = require('./server/environment-script-resource-service');
const { createEnvironmentSecretPolicyService } = require('./server/environment-secret-policy-service');
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
const { validateEnvironmentSecretMutation } = createEnvironmentSecretPolicyService();

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
  readPersistedEnvironmentResolutionSummary,
  truncatePreview,
  sanitizeFieldValue,
  redactStructuredJson,
  createPersistedAuthSnapshot,
  createPreviewSizeLabel,
  createRequestInputSummary,
  createRequestSnapshotSummary,
  createResponsePreviewPolicy,
  createPersistedRequestSnapshotSafely,
  createExecutionObservation,
} = createRuntimePresentationService({
  sanitizeEnvironmentResolutionSummary,
  createRequestSummary,
  runtimeRequestSnapshotSchemaVersion: RUNTIME_REQUEST_SNAPSHOT_SCHEMA_VERSION,
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
  validateEnvironmentSecretMutation,
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









