const assert = require('node:assert/strict');
const { registerRequestResourceRoutes } = require('./register-request-resource-routes');
const {
  createRepositories,
  requestJson,
  sendData,
  sendError,
  withServer,
} = require('./test-support');

function createRequestRouteDependencies(repositories) {
  return {
    sendData,
    sendError,
    repositories,
    defaultWorkspaceId: 'local-workspace',
    listWorkspaceSavedRequestRecords: (workspaceId) => repositories.resources.requests.listByWorkspace(workspaceId),
    buildWorkspaceRequestTree: () => ({ defaults: null, collections: [], requestGroups: [], tree: [] }),
    listWorkspaceCollectionRecords: (workspaceId) => repositories.resources.collections.listByWorkspace(workspaceId),
    presentCollectionRecord: (record) => record,
    validateCollectionInput: () => null,
    findCollectionByName: (records, name) => records.find((record) => record.name === name) ?? null,
    persistCollectionRecord: (record) => repositories.resources.collections.save(record),
    createCollectionRecord: (input, existingRecord, workspaceId) => ({
      ...(existingRecord || {}),
      ...input,
      id: input.id || existingRecord?.id || 'collection-created',
      workspaceId,
    }),
    normalizePersistedCollectionRecord: (record) => record,
    listWorkspaceRequestGroupRecords: (workspaceId) => repositories.resources.requestGroups.listByWorkspace(workspaceId),
    presentRequestGroupRecord: (record) => record,
    validateRequestGroupInput: () => null,
    findRequestGroupByName: (records, collectionId, name, parentRequestGroupId = null) => (
      records.find((record) => (
        record.collectionId === collectionId
        && String(record.parentRequestGroupId || '') === String(parentRequestGroupId || '')
        && String(record.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase()
      )) ?? null
    ),
    persistRequestGroupRecord: (record) => repositories.resources.requestGroups.save(record),
    createRequestGroupRecord: (input, existingRecord, workspaceId) => ({
      ...(existingRecord || {}),
      ...input,
      id: input.id || existingRecord?.id || `request-group-${String(input.name || 'created').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      workspaceId,
    }),
    normalizePersistedRequestGroupRecord: (record) => record,
    validateRequestDefinition: () => null,
    readWorkspaceEnvironmentReference: () => null,
    normalizeSavedRequest: (record) => record,
    normalizePersistedRequestRecord: (record) => record,
  };
}

async function testCollectionRenameUpdatesRelatedRequests() {
  const repositories = createRepositories();
  repositories.resources.collections.save({
    id: 'collection-1',
    workspaceId: 'local-workspace',
    name: 'Saved Requests',
  });
  repositories.resources.requests.save({
    id: 'request-1',
    workspaceId: 'local-workspace',
    name: 'Health check',
    collectionId: 'collection-1',
    collectionName: 'Saved Requests',
    requestGroupId: 'group-1',
    requestGroupName: 'General',
    method: 'GET',
    url: 'https://example.test/health',
    summary: 'Simple request',
  });

  await withServer(
    (app) => registerRequestResourceRoutes(app, createRequestRouteDependencies(repositories)),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/collections/collection-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection: {
            name: 'Core APIs',
          },
        }),
      });

      assert.equal(response.status, 200);
      assert.equal(response.payload.data.collection.name, 'Core APIs');
      assert.equal(repositories.resources.requests.read('request-1').collectionName, 'Core APIs');
    },
  );
}

async function testNestedRequestGroupCreationPersistsParentScope() {
  const repositories = createRepositories();
  repositories.resources.collections.save({
    id: 'collection-1',
    workspaceId: 'local-workspace',
    name: 'Saved Requests',
  });
  repositories.resources.requestGroups.save({
    id: 'group-parent',
    workspaceId: 'local-workspace',
    collectionId: 'collection-1',
    parentRequestGroupId: null,
    name: 'Parent',
  });

  await withServer(
    (app) => registerRequestResourceRoutes(app, createRequestRouteDependencies(repositories)),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/collections/collection-1/request-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestGroup: {
            name: 'Nested Group',
            parentRequestGroupId: 'group-parent',
          },
        }),
      });

      assert.equal(response.status, 201);
      assert.equal(response.payload.data.requestGroup.parentRequestGroupId, 'group-parent');
      assert.equal(repositories.resources.requestGroups.read('request-group-nested-group').parentRequestGroupId, 'group-parent');
    },
  );
}

async function testDeletingGroupWithNestedChildrenIsBlocked() {
  const repositories = createRepositories();
  repositories.resources.collections.save({
    id: 'collection-1',
    workspaceId: 'local-workspace',
    name: 'Saved Requests',
  });
  repositories.resources.requestGroups.save({
    id: 'group-parent',
    workspaceId: 'local-workspace',
    collectionId: 'collection-1',
    parentRequestGroupId: null,
    name: 'Parent',
  });
  repositories.resources.requestGroups.save({
    id: 'group-child',
    workspaceId: 'local-workspace',
    collectionId: 'collection-1',
    parentRequestGroupId: 'group-parent',
    name: 'Child',
  });

  await withServer(
    (app) => registerRequestResourceRoutes(app, createRequestRouteDependencies(repositories)),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/request-groups/group-parent', {
        method: 'DELETE',
      });

      assert.equal(response.status, 409);
      assert.equal(response.payload.error.code, 'request_group_not_empty');
      assert.equal(response.payload.error.details.childRequestGroupCount, 1);
    },
  );
}

async function testMovingGroupIntoDescendantIsRejected() {
  const repositories = createRepositories();
  repositories.resources.collections.save({
    id: 'collection-1',
    workspaceId: 'local-workspace',
    name: 'Saved Requests',
  });
  repositories.resources.requestGroups.save({
    id: 'group-parent',
    workspaceId: 'local-workspace',
    collectionId: 'collection-1',
    parentRequestGroupId: null,
    name: 'Parent',
  });
  repositories.resources.requestGroups.save({
    id: 'group-child',
    workspaceId: 'local-workspace',
    collectionId: 'collection-1',
    parentRequestGroupId: 'group-parent',
    name: 'Child',
  });

  await withServer(
    (app) => registerRequestResourceRoutes(app, createRequestRouteDependencies(repositories)),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/request-groups/group-parent', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestGroup: {
            name: 'Parent',
            parentRequestGroupId: 'group-child',
          },
        }),
      });

      assert.equal(response.status, 400);
      assert.equal(response.payload.error.code, 'request_group_parent_cycle');
    },
  );
}

(async function run() {
  await testCollectionRenameUpdatesRelatedRequests();
  await testNestedRequestGroupCreationPersistsParentScope();
  await testDeletingGroupWithNestedChildrenIsBlocked();
  await testMovingGroupIntoDescendantIsRejected();
})();
