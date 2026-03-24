const assert = require('node:assert/strict');
const { registerResourceBundleRoutes } = require('./register-resource-bundle-routes');
const {
  createRepositories,
  requestJson,
  sendData,
  sendError,
  withServer,
} = require('./test-support');

function createImportPlan() {
  return {
    acceptedCollections: [{ id: 'collection-1', workspaceId: 'local-workspace', name: 'Imported Collection' }],
    acceptedRequestGroups: [{ id: 'group-1', workspaceId: 'local-workspace', collectionId: 'collection-1', name: 'Imported Group' }],
    acceptedRequests: [{ id: 'request-1', workspaceId: 'local-workspace', collectionId: 'collection-1', requestGroupId: 'group-1', name: 'Imported Request' }],
    acceptedMockRules: [{ id: 'mock-1', workspaceId: 'local-workspace', name: 'Imported Mock' }],
    acceptedScripts: [{ id: 'script-1', workspaceId: 'local-workspace', name: 'Imported Script' }],
    rejected: [{ resourceKind: 'request', sourceId: 'legacy-1', reason: 'duplicate_name' }],
    summary: {
      acceptedCount: 5,
      rejectedCount: 1,
      createdCollectionCount: 1,
      createdRequestGroupCount: 1,
      createdRequestCount: 1,
      createdMockRuleCount: 1,
      createdScriptCount: 1,
      renamedCount: 1,
      importedNamesPreview: ['Imported Collection', 'Imported Request'],
      rejectedReasonSummary: [{ reason: 'duplicate_name', count: 1 }],
    },
  };
}

async function testImportPreviewAndImportPersistThroughRepositories() {
  const repositories = createRepositories();
  const importPlan = createImportPlan();

  await withServer(
    (app) => registerResourceBundleRoutes(app, {
      sendData,
      sendError,
      repositories,
      defaultWorkspaceId: 'local-workspace',
      buildAuthoredResourceBundle: (payload) => payload,
      normalizePersistedRequestRecord: (record) => record,
      reconcileWorkspaceRequestPlacementState: () => ({ collections: [], requestGroups: [], requests: [] }),
      serializeRequestRecordForBundle: (record) => record,
      listWorkspaceMockRuleRecords: () => [],
      listWorkspaceSavedScriptRecords: () => [],
      collectRequestBundleSavedScripts: () => [],
      parseWorkspaceResourceBundleImportRequest: (req) => req.body?.bundle || null,
      prepareWorkspaceResourceBundleImport: () => importPlan,
    }),
    async ({ baseUrl }) => {
      const previewResponse = await requestJson(baseUrl, '/api/workspaces/local-workspace/resource-bundle/import-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bundle: { resourceKind: 'authored-resource-bundle' } }),
      });

      assert.equal(previewResponse.status, 200);
      assert.equal(previewResponse.payload.data.preview.rejected.length, 1);
      assert.equal(repositories.resources.collections.listAll().length, 0);

      const importResponse = await requestJson(baseUrl, '/api/workspaces/local-workspace/resource-bundle/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bundle: { resourceKind: 'authored-resource-bundle' } }),
      });

      assert.equal(importResponse.status, 200);
      assert.equal(importResponse.payload.data.result.summary.acceptedCount, 5);
      assert.equal(importResponse.payload.data.result.rejected[0].reason, 'duplicate_name');
      assert.equal(repositories.resources.collections.read('collection-1').name, 'Imported Collection');
      assert.equal(repositories.resources.requests.read('request-1').name, 'Imported Request');
      assert.equal(repositories.resources.mockRules.read('mock-1').name, 'Imported Mock');
      assert.equal(repositories.resources.scripts.read('script-1').name, 'Imported Script');
    },
  );
}

(async function run() {
  await testImportPreviewAndImportPersistThroughRepositories();
})();
