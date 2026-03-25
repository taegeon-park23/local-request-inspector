/* global require */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { createRequestResourceService } = require('./request-resource-service');
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
} = require('../storage/resource/request-placement-record');
const {
  normalizeRequestScriptsState,
  serializeRequestScriptsForBundle,
  listLinkedRequestScriptStages,
} = require('../storage/resource/request-script-binding');
const { compareSavedScriptRecords } = require('../storage/resource/script-record');
const {
  REQUEST_RESOURCE_SCHEMA_VERSION,
  RESOURCE_RECORD_KINDS,
} = require('../storage/shared/constants');

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

function createService(initialRecords = {}) {
  let nextId = 0;
  const resourceStorage = createInMemoryResourceStorage(initialRecords);
  const service = createRequestResourceService({
    randomUUID: () => `uuid-${++nextId}`,
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

function createSavedRequestInput(overrides = {}) {
  return {
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
    ...overrides,
  };
}

function testListWorkspaceRequestGroupRecordsBackfillsLegacyParentScope() {
  const collection = createCollectionRecord({
    id: 'collection-saved-requests',
    name: DEFAULT_REQUEST_COLLECTION_NAME,
  }, null, 'local-workspace');
  const legacyRequestGroup = {
    id: 'request-group-general',
    resourceKind: 'request-group',
    resourceSchemaVersion: 1,
    workspaceId: 'local-workspace',
    collectionId: collection.id,
    name: DEFAULT_REQUEST_GROUP_NAME,
    description: '',
    createdAt: '2026-03-25T00:00:00.000Z',
    updatedAt: '2026-03-25T00:00:00.000Z',
  };
  const { resourceStorage, service } = createService({
    collection: [collection],
    'request-group': [legacyRequestGroup],
  });

  const requestGroups = service.listWorkspaceRequestGroupRecords('local-workspace');
  const normalizedRequestGroup = requestGroups.find((record) => record.id === legacyRequestGroup.id);

  assert.ok(normalizedRequestGroup);
  assert.equal(normalizedRequestGroup.parentRequestGroupId, null);
  assert.equal(resourceStorage.read('request-group', legacyRequestGroup.id).parentRequestGroupId, null);
}

function testBuildWorkspaceRequestTreeCreatesRecursiveGroupBranches() {
  const collection = createCollectionRecord({
    id: 'collection-saved-requests',
    name: DEFAULT_REQUEST_COLLECTION_NAME,
  }, null, 'local-workspace');
  const rootRequestGroup = createRequestGroupRecord({
    id: 'request-group-general',
    collectionId: collection.id,
    parentRequestGroupId: null,
    name: DEFAULT_REQUEST_GROUP_NAME,
  }, null, 'local-workspace');
  const nestedRequestGroup = createRequestGroupRecord({
    id: 'request-group-auth-flows',
    collectionId: collection.id,
    parentRequestGroupId: rootRequestGroup.id,
    name: 'Auth flows',
  }, null, 'local-workspace');
  const { resourceStorage, service } = createService({
    collection: [collection],
    'request-group': [rootRequestGroup, nestedRequestGroup],
  });

  const rootRequest = service.normalizeSavedRequest(
    createSavedRequestInput({
      name: 'Workspace root request',
      collectionId: collection.id,
      requestGroupId: rootRequestGroup.id,
      collectionName: collection.name,
      requestGroupName: rootRequestGroup.name,
    }),
    null,
    'local-workspace',
  );
  const nestedRequest = service.normalizeSavedRequest(
    createSavedRequestInput({
      name: 'Nested request',
      method: 'POST',
      url: 'https://example.test/sessions',
      collectionId: collection.id,
      requestGroupId: nestedRequestGroup.id,
      collectionName: collection.name,
      requestGroupName: nestedRequestGroup.name,
    }),
    null,
    'local-workspace',
  );
  resourceStorage.save('request', rootRequest);
  resourceStorage.save('request', nestedRequest);

  const requestTree = service.buildWorkspaceRequestTree('local-workspace');
  const collectionNode = requestTree.tree[0];

  assert.equal(requestTree.defaults.collectionId, collection.id);
  assert.equal(requestTree.defaults.requestGroupId, rootRequestGroup.id);
  assert.ok(collectionNode);
  assert.equal(collectionNode.childGroups.length, 1);
  assert.equal(collectionNode.childGroups[0].requestGroupId, rootRequestGroup.id);
  assert.equal(collectionNode.childGroups[0].requests[0].request.id, rootRequest.id);
  assert.equal(collectionNode.childGroups[0].childGroups.length, 1);
  assert.equal(collectionNode.childGroups[0].childGroups[0].requestGroupId, nestedRequestGroup.id);
  assert.equal(collectionNode.childGroups[0].childGroups[0].parentRequestGroupId, rootRequestGroup.id);
  assert.equal(collectionNode.childGroups[0].childGroups[0].requests[0].request.id, nestedRequest.id);
}

function testNormalizeSavedRequestRejectsCollectionMismatchForRequestGroup() {
  const collectionA = createCollectionRecord({
    id: 'collection-saved-requests',
    name: DEFAULT_REQUEST_COLLECTION_NAME,
  }, null, 'local-workspace');
  const collectionB = createCollectionRecord({
    id: 'collection-diagnostics',
    name: 'Diagnostics',
  }, null, 'local-workspace');
  const requestGroup = createRequestGroupRecord({
    id: 'request-group-general',
    collectionId: collectionA.id,
    parentRequestGroupId: null,
    name: DEFAULT_REQUEST_GROUP_NAME,
  }, null, 'local-workspace');
  const { service } = createService({
    collection: [collectionA, collectionB],
    'request-group': [requestGroup],
  });

  assert.throws(
    () => service.normalizeSavedRequest(
      createSavedRequestInput({
        collectionId: collectionB.id,
        requestGroupId: requestGroup.id,
        collectionName: collectionB.name,
        requestGroupName: requestGroup.name,
      }),
      null,
      'local-workspace',
    ),
    (error) => error.code === 'request_group_collection_mismatch',
  );
}

(function run() {
  testListWorkspaceRequestGroupRecordsBackfillsLegacyParentScope();
  testBuildWorkspaceRequestTreeCreatesRecursiveGroupBranches();
  testNormalizeSavedRequestRejectsCollectionMismatchForRequestGroup();
})();