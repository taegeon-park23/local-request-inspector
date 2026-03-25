const assert = require('node:assert/strict');
const {
  countLegacySecretRows,
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
const { createEnvironmentSecretPolicyService } = require('./environment-secret-policy-service');
const { registerEnvironmentScriptRoutes } = require('./register-environment-script-routes');
const {
  createRepositories,
  requestJson,
  sendData,
  sendError,
  withServer,
} = require('./test-support');

function createRouteDependencies(repositories, options = {}) {
  const environmentScriptService = createEnvironmentScriptResourceService({
    repositories,
    countLegacySecretRows,
    enforceEnvironmentDefaults,
    normalizePersistedEnvironmentRecord,
    compareEnvironmentRecords,
    normalizePersistedSavedScriptRecord,
    compareSavedScriptRecords,
  });
  const secretPolicyService = createEnvironmentSecretPolicyService({
    ...(options.secretProvider ? { secretProvider: options.secretProvider } : {}),
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
    applyEnvironmentSecretMutations: secretPolicyService.applyEnvironmentSecretMutations,
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


async function testReadingLegacySecretRowsSanitizesPersistedEnvironmentRecord() {
  const repositories = createRepositories();
  repositories.resources.environments.save({
    id: 'env-legacy',
    workspaceId: 'local-workspace',
    name: 'Legacy secrets',
    description: 'Contains a legacy raw secret value',
    isDefault: false,
    variables: [
      {
        id: 'env-legacy-token',
        key: 'API_TOKEN',
        description: 'Legacy token',
        isEnabled: true,
        isSecret: true,
        valueType: 'plain',
        value: 'legacy-secret',
        hasStoredValue: false,
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-03-25T00:00:00.000Z',
      },
    ],
    createdAt: '2026-03-25T00:00:00.000Z',
    updatedAt: '2026-03-25T00:00:00.000Z',
  });

  await withServer(
    (app) => registerEnvironmentScriptRoutes(app, createRouteDependencies(repositories)),
    async ({ baseUrl }) => {
      const listResponse = await requestJson(baseUrl, '/api/workspaces/local-workspace/environments');
      const detailResponse = await requestJson(baseUrl, '/api/environments/env-legacy');

      assert.equal(listResponse.status, 200);
      assert.equal(detailResponse.status, 200);
      assert.equal(listResponse.payload.data.items[0].legacySecretRowCount, 1);
      assert.equal(detailResponse.payload.data.environment.legacySecretRowCount, 0);
      assert.equal(detailResponse.payload.data.environment.variables[0].value, '');
      assert.equal(detailResponse.payload.data.environment.variables[0].hasStoredValue, true);

      const sanitizedRecord = repositories.resources.environments.read('env-legacy');
      assert.equal(sanitizedRecord.variables[0].value, '');
      assert.equal(sanitizedRecord.variables[0].hasStoredValue, true);
    },
  );
}

async function testCreatingEnvironmentWithSecretReplacementFailsClosed() {
  const repositories = createRepositories();

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
            name: 'Secrets',
            description: 'Should fail closed without a secure backend',
            isDefault: false,
            variables: [
              {
                key: 'API_TOKEN',
                description: 'Secret token',
                isEnabled: true,
                isSecret: true,
                valueType: 'plain',
                replacementValue: 'secret-token',
              },
            ],
          },
        }),
      });

      assert.equal(response.status, 409);
      assert.equal(response.payload.error.code, 'secret_storage_unavailable');
      assert.deepEqual(response.payload.error.details.secretKeys, ['API_TOKEN']);
      assert.equal(repositories.resources.environments.listAll().length, 0);
    },
  );
}

async function testClearingStoredSecretWithoutBackendIsAllowed() {
  const repositories = createRepositories();
  repositories.resources.environments.save(normalizePersistedEnvironmentRecord({
    id: 'env-clear',
    workspaceId: 'local-workspace',
    name: 'Clear secret env',
    description: '',
    isDefault: false,
    variables: [
      {
        id: 'env-clear-token',
        key: 'API_TOKEN',
        description: 'Secret token',
        isEnabled: true,
        isSecret: true,
        valueType: 'plain',
        value: '',
        hasStoredValue: true,
      },
    ],
    createdAt: '2026-03-25T00:00:00.000Z',
    updatedAt: '2026-03-25T00:00:00.000Z',
  }));

  await withServer(
    (app) => registerEnvironmentScriptRoutes(app, createRouteDependencies(repositories)),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/environments/env-clear', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environment: {
            name: 'Clear secret env',
            description: '',
            isDefault: false,
            variables: [
              {
                id: 'env-clear-token',
                key: 'API_TOKEN',
                description: 'Secret token',
                isEnabled: true,
                isSecret: true,
                valueType: 'plain',
                clearStoredValue: true,
              },
            ],
          },
        }),
      });

      assert.equal(response.status, 200);
      assert.equal(response.payload.data.environment.variables[0].hasStoredValue, false);
      assert.equal(repositories.resources.environments.read('env-clear').variables[0].hasStoredValue, false);
    },
  );
}

async function testAvailableProviderStoreAndClearUseExpectedLocator() {
  const repositories = createRepositories();
  const storeCalls = [];
  const clearCalls = [];
  const secretProvider = {
    async status() {
      return {
        secureBackendAvailable: true,
        backendLabel: 'stub-provider',
        providerId: 'stub',
        providerVersion: '1.0.0',
        providerStatus: 'ready',
        capabilities: ['store', 'resolve', 'clear'],
      };
    },
    async store(input) {
      storeCalls.push(input);
      return { stored: true };
    },
    async resolve() {
      return { found: false, value: null };
    },
    async clear(input) {
      clearCalls.push(input);
      return { cleared: true };
    },
  };

  await withServer(
    (app) => registerEnvironmentScriptRoutes(app, createRouteDependencies(repositories, { secretProvider })),
    async ({ baseUrl }) => {
      const createResponse = await requestJson(baseUrl, '/api/workspaces/local-workspace/environments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environment: {
            name: 'Secret provider env',
            description: '',
            isDefault: false,
            variables: [
              {
                key: 'API_TOKEN',
                description: 'Secret token',
                isEnabled: true,
                isSecret: true,
                valueType: 'plain',
                replacementValue: 'secret-value',
              },
            ],
          },
        }),
      });

      assert.equal(createResponse.status, 201);
      assert.equal(storeCalls.length, 1);

      const environmentId = createResponse.payload.data.environment.id;
      const variableId = createResponse.payload.data.environment.variables[0].id;

      assert.deepEqual(storeCalls[0], {
        locator: {
          workspaceId: 'local-workspace',
          environmentId,
          variableId,
        },
        value: 'secret-value',
      });

      const clearResponse = await requestJson(baseUrl, `/api/environments/${environmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environment: {
            name: 'Secret provider env',
            description: '',
            isDefault: false,
            variables: [
              {
                id: variableId,
                key: 'API_TOKEN',
                description: 'Secret token',
                isEnabled: true,
                isSecret: true,
                valueType: 'plain',
                clearStoredValue: true,
              },
            ],
          },
        }),
      });

      assert.equal(clearResponse.status, 200);
      assert.equal(clearCalls.length, 1);
      assert.deepEqual(clearCalls[0], {
        locator: {
          workspaceId: 'local-workspace',
          environmentId,
          variableId,
        },
      });
      assert.equal(clearResponse.payload.data.environment.variables[0].hasStoredValue, false);
    },
  );
}
(async function run() {
  await testCreatingDefaultEnvironmentDemotesPreviousDefault();
  await testDeletingDefaultEnvironmentPromotesRemainingFallback();
  await testListingWorkspaceScriptsUsesServiceOrdering();
  await testReadingLegacySecretRowsSanitizesPersistedEnvironmentRecord();
  await testCreatingEnvironmentWithSecretReplacementFailsClosed();
  await testClearingStoredSecretWithoutBackendIsAllowed();
  await testAvailableProviderStoreAndClearUseExpectedLocator();
})();
