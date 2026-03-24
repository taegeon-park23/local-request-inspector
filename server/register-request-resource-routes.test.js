const assert = require('node:assert/strict');
const { registerRequestResourceRoutes } = require('./register-request-resource-routes');
const {
  createRepositories,
  requestJson,
  sendData,
  sendError,
  withServer,
} = require('./test-support');

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
    (app) => registerRequestResourceRoutes(app, {
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
      listWorkspaceRequestGroupRecords: () => [],
      presentRequestGroupRecord: (record) => record,
      validateRequestGroupInput: () => null,
      findRequestGroupByName: () => null,
      persistRequestGroupRecord: (record) => record,
      createRequestGroupRecord: (input) => input,
      normalizePersistedRequestGroupRecord: (record) => record,
      validateRequestDefinition: () => null,
      readWorkspaceEnvironmentReference: () => null,
      normalizeSavedRequest: (record) => record,
      normalizePersistedRequestRecord: (record) => record,
    }),
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

(async function run() {
  await testCollectionRenameUpdatesRelatedRequests();
})();
