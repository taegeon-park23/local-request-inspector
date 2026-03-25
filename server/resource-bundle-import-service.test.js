/* global require */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { createResourceBundleImportService } = require('./resource-bundle-import-service');
const { createRequestResourceService } = require('./request-resource-service');
const { createImportedResourceName } = require('../storage/resource/authored-resource-bundle');
const { prepareAuthoredResourceImport } = require('../storage/resource/authored-resource-import-plan');
const {
  DEFAULT_REQUEST_COLLECTION_NAME,
  DEFAULT_REQUEST_GROUP_NAME,
  createCollectionRecord,
  createRequestGroupRecord,
  normalizePersistedCollectionRecord,
  normalizePersistedRequestGroupRecord,
  compareRequestPlacementRecords,
  createStableCollectionId,
  createStableRequestGroupId,
  validateCollectionInput,
  validateRequestGroupInput,
} = require('../storage/resource/request-placement-record');
const {
  normalizeRequestScriptsState,
  serializeRequestScriptsForBundle,
  listLinkedRequestScriptStages,
  remapRequestScriptsForImport,
} = require('../storage/resource/request-script-binding');
const {
  createSavedScriptRecord,
  compareSavedScriptRecords,
  validateSavedScriptInput,
} = require('../storage/resource/script-record');
const {
  COLLECTION_RESOURCE_SCHEMA_VERSION,
  REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
  REQUEST_RESOURCE_SCHEMA_VERSION,
  MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  SCRIPT_RESOURCE_SCHEMA_VERSION,
  RESOURCE_RECORD_KINDS,
} = require('../storage/shared/constants');
const { createMockRuleRecord, validateMockRuleInput } = require('../mock-rule-engine');

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
  const nameDiff = String(left.name || '').localeCompare(String(right.name || ''));
  if (nameDiff !== 0) {
    return nameDiff;
  }

  return String(left.id || '').localeCompare(String(right.id || ''));
}

function createInMemoryResourceStorage(initialRecords = {}) {
  const recordsByKind = new Map(
    Object.entries(initialRecords).map(([kind, records]) => [kind, new Map(records.map((record) => [record.id, record]))]),
  );

  return {
    list(kind) {
      return [...(recordsByKind.get(kind)?.values() ?? [])];
    },
    read(kind, id) {
      return recordsByKind.get(kind)?.get(id) ?? null;
    },
    save(kind, record) {
      if (!recordsByKind.has(kind)) {
        recordsByKind.set(kind, new Map());
      }

      recordsByKind.get(kind).set(record.id, record);
      return record;
    },
  };
}

function createRequestService(initialRecords = {}) {
  let nextId = 0;
  const resourceStorage = createInMemoryResourceStorage(initialRecords);
  const service = createRequestResourceService({
    randomUUID: () => `request-service-${++nextId}`,
    resourceStorage,
    defaultWorkspaceId: 'local-workspace',
    normalizeRequestScriptsState,
    serializeRequestScriptsForBundle,
    listLinkedRequestScriptStages,
    compareSavedScriptRecords,
    compareSavedRequestRecords,
    listWorkspaceSavedScriptRecords: () => [],
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

  return {
    resourceStorage,
    service,
  };
}

function createBundleService(existingState = {}) {
  let nextId = 0;
  const { resourceStorage, service: requestService } = createRequestService({
    collection: existingState.collections ?? [],
    'request-group': existingState.requestGroups ?? [],
    request: existingState.requests ?? [],
  });
  const collections = existingState.collections ?? [];
  const requestGroups = existingState.requestGroups ?? [];
  const requests = existingState.requests ?? [];
  const mockRules = existingState.mockRules ?? [];
  const scripts = existingState.scripts ?? [];

  return {
    resourceStorage,
    service: createResourceBundleImportService({
      randomUUID: () => `bundle-import-${++nextId}`,
      sendError: () => undefined,
      parseAuthoredResourceBundleText: JSON.parse,
      prepareAuthoredResourceImport,
      createImportedResourceName,
      normalizeText: requestService.normalizeText,
      readWorkspaceCollectionReference: (workspaceId, collectionId) => (
        collections.find((record) => record.workspaceId === workspaceId && record.id === collectionId) ?? null
      ),
      reconcileWorkspaceRequestPlacementState: () => ({
        collections: [...collections],
        requestGroups: [...requestGroups],
        requests: [...requests],
      }),
      listWorkspaceMockRuleRecords: () => [...mockRules],
      listWorkspaceSavedScriptRecords: () => [...scripts],
      compareRequestPlacementRecords,
      sortRequestGroups: requestService.sortRequestGroups,
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
      cloneRows: requestService.cloneRows,
      cloneAuth: requestService.cloneAuth,
      cloneScripts: requestService.cloneScripts,
      createRequestSummary: requestService.createRequestSummary,
      validateRequestDefinition: requestService.validateRequestDefinition,
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
    }),
  };
}

function createFlatBundleRequest(overrides = {}) {
  return {
    resourceKind: RESOURCE_RECORD_KINDS.REQUEST,
    resourceSchemaVersion: REQUEST_RESOURCE_SCHEMA_VERSION,
    id: 'request-source-health-check',
    name: 'Health check',
    method: 'GET',
    url: 'https://example.test/health',
    selectedEnvironmentId: null,
    params: [],
    headers: [],
    bodyMode: 'none',
    bodyText: '',
    formBody: [],
    multipartBody: [],
    auth: { type: 'none' },
    scripts: {},
    collectionName: 'Core APIs',
    requestGroupName: 'General',
    ...overrides,
  };
}

function testPrepareWorkspaceResourceBundleImportSupportsLegacyFlatBundlesWithoutMutatingStorage() {
  const { resourceStorage, service } = createBundleService();

  const plan = service.prepareWorkspaceResourceBundleImport({
    collections: [],
    requestGroups: [],
    requests: [createFlatBundleRequest()],
    mockRules: [],
    scripts: [],
  }, 'local-workspace');

  assert.equal(plan.acceptedCollections.length, 1);
  assert.equal(plan.acceptedCollections[0].name, 'Core APIs');
  assert.equal(plan.acceptedRequestGroups.length, 1);
  assert.equal(plan.acceptedRequestGroups[0].name, 'General');
  assert.equal(plan.acceptedRequestGroups[0].parentRequestGroupId, null);
  assert.equal(plan.acceptedRequests.length, 1);
  assert.equal(plan.acceptedRequests[0].collectionId, plan.acceptedCollections[0].id);
  assert.equal(plan.acceptedRequests[0].requestGroupId, plan.acceptedRequestGroups[0].id);
  assert.equal(resourceStorage.list('collection').length, 0);
  assert.equal(resourceStorage.list('request-group').length, 0);
  assert.equal(resourceStorage.list('request').length, 0);
}

function testPrepareWorkspaceResourceBundleImportScopesDuplicateGroupNamesByParent() {
  const { service } = createBundleService();

  const plan = service.prepareWorkspaceResourceBundleImport({
    collections: [
      {
        resourceKind: RESOURCE_RECORD_KINDS.COLLECTION,
        resourceSchemaVersion: COLLECTION_RESOURCE_SCHEMA_VERSION,
        id: 'source-collection-core-apis',
        workspaceId: 'local-workspace',
        name: 'Core APIs',
        description: '',
      },
    ],
    requestGroups: [
      {
        resourceKind: RESOURCE_RECORD_KINDS.REQUEST_GROUP,
        resourceSchemaVersion: REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
        id: 'source-parent-a',
        workspaceId: 'local-workspace',
        collectionId: 'source-collection-core-apis',
        parentRequestGroupId: null,
        name: 'Parent A',
        description: '',
      },
      {
        resourceKind: RESOURCE_RECORD_KINDS.REQUEST_GROUP,
        resourceSchemaVersion: REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
        id: 'source-parent-b',
        workspaceId: 'local-workspace',
        collectionId: 'source-collection-core-apis',
        parentRequestGroupId: null,
        name: 'Parent B',
        description: '',
      },
      {
        resourceKind: RESOURCE_RECORD_KINDS.REQUEST_GROUP,
        resourceSchemaVersion: REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
        id: 'source-shared-a',
        workspaceId: 'local-workspace',
        collectionId: 'source-collection-core-apis',
        parentRequestGroupId: 'source-parent-a',
        name: 'Shared',
        description: '',
      },
      {
        resourceKind: RESOURCE_RECORD_KINDS.REQUEST_GROUP,
        resourceSchemaVersion: REQUEST_GROUP_RESOURCE_SCHEMA_VERSION,
        id: 'source-shared-b',
        workspaceId: 'local-workspace',
        collectionId: 'source-collection-core-apis',
        parentRequestGroupId: 'source-parent-b',
        name: 'Shared',
        description: '',
      },
    ],
    requests: [],
    mockRules: [],
    scripts: [],
  }, 'local-workspace');

  const sharedGroups = plan.acceptedRequestGroups.filter((record) => record.name === 'Shared');

  assert.equal(plan.acceptedRequestGroups.length, 4);
  assert.equal(sharedGroups.length, 2);
  assert.notEqual(sharedGroups[0].parentRequestGroupId, sharedGroups[1].parentRequestGroupId);
}

(function run() {
  testPrepareWorkspaceResourceBundleImportSupportsLegacyFlatBundlesWithoutMutatingStorage();
  testPrepareWorkspaceResourceBundleImportScopesDuplicateGroupNamesByParent();
})();