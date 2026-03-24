const assert = require('node:assert/strict');
const {
  createEnvironmentRecord,
  enforceEnvironmentDefaults,
  normalizePersistedEnvironmentRecord,
  presentEnvironmentRecord,
  summarizePresentedEnvironmentRecord,
  compareEnvironmentRecords,
  validateEnvironmentInput,
} = require('../storage/resource/environment-record');
const {
  createSavedScriptRecord,
  normalizePersistedSavedScriptRecord,
  compareSavedScriptRecords,
  validateSavedScriptInput,
  listSystemScriptTemplates,
  readSystemScriptTemplate,
} = require('../storage/resource/script-record');
const { createEnvironmentScriptResourceService } = require('./environment-script-resource-service');
const { registerEnvironmentScriptRoutes } = require('./register-environment-script-routes');
const {
  createRepositories,
  requestJson,
  sendData,
  sendError,
  withServer,
} = require('./test-support');

function createRouteDependencies(repositories) {
  const environmentScriptService = createEnvironmentScriptResourceService({
    repositories,
    enforceEnvironmentDefaults,
    normalizePersistedEnvironmentRecord,
    compareEnvironmentRecords,
    normalizePersistedSavedScriptRecord,
    compareSavedScriptRecords,
  });

  return {
    sendData,
    sendError,
    repositories,
    defaultWorkspaceId: 'local-workspace',
    validateEnvironmentInput,
    createEnvironmentRecord,
    normalizePersistedEnvironmentRecord,
    presentEnvironmentRecord,
    summarizePresentedEnvironmentRecord,
    validateSavedScriptInput,
    createSavedScriptRecord,
    normalizePersistedSavedScriptRecord,
    listSystemScriptTemplates,
    readSystemScriptTemplate,
    ...environmentScriptService,
  };
}

async function testCreatingDefaultEnvironmentDemotesPreviousDefault() {
  const repositories = createRepositories();
  repositories.resources.environments.save(normalizePersistedEnvironmentRecord({
    id: 'env-1',
    workspaceId: 'local-workspace',
    name: 'Local',
    description: '',
    isDefault: true,
    variables: [],
    createdAt: '2026-03-24T00:00:00.000Z',
    updatedAt: '2026-03-24T00:00:00.000Z',
  }));

  await withServer(
    (app) => registerEnvironmentScriptRoutes(app, createRouteDependencies(repositories)),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/workspaces/local-workspace/environments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environment: {
            name: 'Staging',
            description: 'Shared staging values',
            isDefault: true,
            variables: [
              {
                key: 'API_BASE_URL',
                description: 'Upstream base URL',
                isEnabled: true,
                isSecret: false,
                valueType: 'plain',
                value: 'https://staging.example.test',
              },
            ],
          },
        }),
      });

      assert.equal(response.status, 201);
      assert.equal(response.payload.data.environment.isDefault, true);
      assert.equal(repositories.resources.environments.read('env-1').isDefault, false);
      assert.equal(
        repositories.resources.environments.read(response.payload.data.environment.id).isDefault,
        true,
      );
    },
  );
}

async function testDeletingDefaultEnvironmentPromotesRemainingFallback() {
  const repositories = createRepositories();
  repositories.resources.environments.save(normalizePersistedEnvironmentRecord({
    id: 'env-1',
    workspaceId: 'local-workspace',
    name: 'Local',
    description: '',
    isDefault: true,
    variables: [],
    createdAt: '2026-03-24T00:00:00.000Z',
    updatedAt: '2026-03-24T00:00:00.000Z',
  }));
  repositories.resources.environments.save(normalizePersistedEnvironmentRecord({
    id: 'env-2',
    workspaceId: 'local-workspace',
    name: 'Backup',
    description: '',
    isDefault: false,
    variables: [],
    createdAt: '2026-03-24T00:01:00.000Z',
    updatedAt: '2026-03-24T00:01:00.000Z',
  }));

  await withServer(
    (app) => registerEnvironmentScriptRoutes(app, createRouteDependencies(repositories)),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/environments/env-1', {
        method: 'DELETE',
      });

      assert.equal(response.status, 200);
      assert.equal(response.payload.data.deletedEnvironmentId, 'env-1');
      assert.equal(repositories.resources.environments.read('env-1'), null);
      assert.equal(repositories.resources.environments.read('env-2').isDefault, true);
    },
  );
}

async function testListingWorkspaceScriptsUsesServiceOrdering() {
  const repositories = createRepositories();
  repositories.resources.scripts.save(normalizePersistedSavedScriptRecord({
    id: 'script-old',
    workspaceId: 'local-workspace',
    name: 'Older script',
    description: '',
    scriptType: 'pre-request',
    sourceCode: 'request.headers.set("x-old", "1");',
    createdAt: '2026-03-24T00:00:00.000Z',
    updatedAt: '2026-03-24T00:00:00.000Z',
  }));
  repositories.resources.scripts.save(normalizePersistedSavedScriptRecord({
    id: 'script-new',
    workspaceId: 'local-workspace',
    name: 'Newer script',
    description: '',
    scriptType: 'tests',
    sourceCode: 'assert(response.status === 200);',
    createdAt: '2026-03-24T00:02:00.000Z',
    updatedAt: '2026-03-24T00:02:00.000Z',
  }));

  await withServer(
    (app) => registerEnvironmentScriptRoutes(app, createRouteDependencies(repositories)),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/workspaces/local-workspace/scripts');

      assert.equal(response.status, 200);
      assert.deepEqual(
        response.payload.data.items.map((record) => record.id),
        ['script-new', 'script-old'],
      );
    },
  );
}

(async function run() {
  await testCreatingDefaultEnvironmentDemotesPreviousDefault();
  await testDeletingDefaultEnvironmentPromotesRemainingFallback();
  await testListingWorkspaceScriptsUsesServiceOrdering();
})();
