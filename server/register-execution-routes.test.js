const assert = require('node:assert/strict');
const { registerExecutionRoutes } = require('./register-execution-routes');
const {
  createRepositories,
  requestJson,
  sendData,
  sendError,
  withServer,
} = require('./test-support');
const { createExecutionConfigResolver } = require('./execution-config-resolver');
const {
  normalizeAuthDefaults,
  normalizeScriptDefaults,
  normalizeRunConfig,
  normalizeScopeVariables,
} = require('../storage/resource/request-placement-record');
const { normalizeRequestScriptsState } = require('../storage/resource/request-script-binding');

function createBaseRequest(selectedEnvironmentId = null, overrides = {}) {
  return {
    id: 'request-1',
    workspaceId: 'local-workspace',
    name: 'Health check',
    method: 'GET',
    url: 'https://example.test/health',
    selectedEnvironmentId,
    params: [],
    headers: [],
    bodyMode: 'none',
    bodyText: '',
    formBody: [],
    multipartBody: [],
    auth: { type: 'none' },
    scripts: {
      preRequest: null,
      postResponse: null,
      tests: null,
    },
    ...overrides,
  };
}

function createExecutionDependencies(repositories, runtimeState, overrides = {}) {
  return {
    sendData,
    sendError,
    repositories,
    defaultWorkspaceId: 'local-workspace',
    registerActiveExecution: () => ({ signal: new AbortController().signal }),
    clearActiveExecution: () => {},
    validateRequestDefinition: () => null,
    createExecutionRequestSeed: (input) => ({ ...input }),
    resolveRequestScriptsForExecution: (scripts) => ({ resolvedScripts: scripts }),
    normalizePersistedSavedScriptRecord: (record) => record,
    createLinkedScriptRunStageResult: (error) => ({
      'pre-request': { stageId: 'pre-request', status: 'skipped', summary: 'Linked-script validation blocked the run.' },
      transport: { stageId: 'transport', status: 'blocked', summary: 'Transport blocked.', errorCode: error.code, errorSummary: error.message },
      'post-response': { stageId: 'post-response', status: 'skipped', summary: 'Skipped after blocked transport.' },
      tests: { stageId: 'tests', status: 'blocked', summary: error.message, errorCode: error.code, errorSummary: error.message },
    }),
    createEnvironmentResolutionSummary: ({ selectedEnvironmentId, unresolved = [] }) => ({
      selectedEnvironmentId,
      resolvedPlaceholderCount: 0,
      unresolvedPlaceholderCount: unresolved.length,
      summary: unresolved.length > 0 ? 'Unresolved placeholders remain.' : 'Environment resolved.',
    }),
    executeScriptStage: async (stageId) => ({
      stageResult: { stageId, status: 'succeeded', summary: `${stageId} succeeded.` },
    }),
    readWorkspaceEnvironmentReference: () => null,
    resolveEnvironmentSecretValues: async () => ({ secretValuesByKey: {} }),
    createTransportSkippedStageResult: (summary) => ({ stageId: 'transport', status: 'skipped', summary }),
    createSkippedScriptStageAfterTransport: (stageId, summary) => ({ stageId, status: 'skipped', summary }),
    createTransportBlockedStageResult: (summary, errorCode, errorSummary) => ({
      stageId: 'transport',
      status: 'blocked',
      summary,
      errorCode,
      errorSummary,
    }),
    resolveExecutionRequestWithEnvironment: (request) => ({ request, resolvedPlaceholderCount: 0, unresolved: [], affectedInputAreas: [] }),
    createResolvedEnvironmentLabel: () => 'Resolved environment',
    summarizeUnresolvedEnvironmentPlaceholders: () => 'Unresolved placeholders remain.',
    createExecutionRequestTarget: () => new URL('https://example.test/health'),
    createExecutionHeaders: () => ({}),
    createExecutionBody: () => undefined,
    createTransportStageResult: (statusCode, summary) => ({ stageId: 'transport', status: 'succeeded', statusCode, summary }),
    createHostPathHint: (value) => value,
    createTransportCancelledStageResult: (summary) => ({ stageId: 'transport', status: 'cancelled', summary }),
    createTransportFailureStageResult: (error) => ({ stageId: 'transport', status: 'failed', summary: error.message, errorCode: 'transport_failed', errorSummary: error.message }),
    createPersistedRequestSnapshotSafely: (request, target) => ({
      url: request.url,
      target: target ? String(target) : null,
      selectedEnvironmentId: request.selectedEnvironmentId ?? null,
    }),
    deriveExecutionOutcome: (stageResults) => {
      if (stageResults.transport?.status === 'failed') {
        return 'Failed';
      }
      if (stageResults.transport?.status === 'blocked') {
        return 'Blocked';
      }
      return 'Succeeded';
    },
    createCombinedConsoleEntries: () => [],
    countConsoleWarnings: () => 0,
    createObservationTestsSummary: () => 'No tests recorded.',
    createObservationTestEntries: () => [],
    createExecutionErrorMetadata: (stageResults) => ({
      errorCode: stageResults.transport?.errorCode || null,
      errorSummary: stageResults.transport?.errorSummary || null,
    }),
    createExecutionObservation: (payload) => payload,
    createObservationConsoleSummary: () => 'No console entries.',
    countConsoleEntries: () => 0,
    createObservationStageSummaries: (stageResults) => Object.values(stageResults),
    createPersistedExecutionStatus: (outcome) => outcome.toLowerCase(),
    createPersistedLogSummary: () => ({ consoleEntries: 0, consoleWarnings: 0, consolePreview: [] }),
    createPersistedTestResultRecords: () => [],
    createFriendlyStageSummary: (stageId, stageResult) => ({ stageId, ...stageResult }),
    ...overrides,
  };
}

function createSavedRequest(id, name, url) {
  return createBaseRequest(null, {
    id,
    name,
    url,
  });
}

function createRequestLeaf(request, requestGroupId, requestGroupName) {
  return {
    id: request.id,
    name: request.name,
    methodLabel: request.method,
    summary: `${request.name} summary`,
    collectionId: 'collection-saved-requests',
    collectionName: 'Saved Requests',
    requestGroupId,
    requestGroupName,
  };
}

async function testMissingLinkedScriptBlocksExecutionAndPersistsError() {
  const runtimeState = {
    histories: [],
    results: [],
    testResults: [],
  };
  const repositories = createRepositories({
    runtime: {
      queries: {
        insertExecutionHistory(record) {
          runtimeState.histories.push(record);
        },
        insertExecutionResult(record) {
          runtimeState.results.push(record);
        },
        insertTestResults(records) {
          runtimeState.testResults.push(records);
        },
      },
    },
  });

  const dependencies = createExecutionDependencies(repositories, runtimeState, {
    resolveRequestScriptsForExecution: () => {
      const error = new Error('Linked saved script "Smoke Tests" is missing.');
      error.code = 'request_linked_script_missing';
      error.details = { stageId: 'tests', savedScriptNameSnapshot: 'Smoke Tests' };
      throw error;
    },
    executeScriptStage: async () => {
      throw new Error('executeScriptStage should not run when linked-script validation blocks execution.');
    },
  });

  await withServer(
    (app) => registerExecutionRoutes(app, dependencies),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/executions/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: createBaseRequest() }),
      });

      assert.equal(response.status, 200);
      assert.equal(response.payload.data.execution.executionOutcome, 'Blocked');
      assert.equal(response.payload.data.execution.errorCode, 'request_linked_script_missing');
      assert.equal(runtimeState.histories.length, 1);
      assert.equal(runtimeState.histories[0].status, 'blocked');
      assert.equal(runtimeState.histories[0].errorCode, 'request_linked_script_missing');
      assert.equal(runtimeState.results.length, 1);
      assert.deepEqual(runtimeState.testResults, [[]]);
    },
  );
}

async function testUnresolvedEnvironmentPlaceholderBlocksExecution() {
  const runtimeState = {
    histories: [],
    results: [],
    testResults: [],
  };
  const repositories = createRepositories({
    runtime: {
      queries: {
        insertExecutionHistory(record) {
          runtimeState.histories.push(record);
        },
        insertExecutionResult(record) {
          runtimeState.results.push(record);
        },
        insertTestResults(records) {
          runtimeState.testResults.push(records);
        },
      },
    },
  });

  const dependencies = createExecutionDependencies(repositories, runtimeState, {
    readWorkspaceEnvironmentReference: () => ({ id: 'env-1', name: 'Local' }),
    resolveExecutionRequestWithEnvironment: (request) => ({
      request,
      resolvedPlaceholderCount: 0,
      unresolved: [{ inputArea: 'url', placeholder: '{{api_url}}' }],
      affectedInputAreas: ['url'],
    }),
  });

  await withServer(
    (app) => registerExecutionRoutes(app, dependencies),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/executions/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: createBaseRequest('env-1') }),
      });

      assert.equal(response.status, 200);
      assert.equal(response.payload.data.execution.executionOutcome, 'Blocked');
      assert.equal(response.payload.data.execution.errorCode, 'environment_resolution_unresolved');
      assert.equal(runtimeState.histories.length, 1);
      assert.equal(runtimeState.histories[0].errorCode, 'environment_resolution_unresolved');
      assert.equal(runtimeState.results.length, 1);
      assert.deepEqual(runtimeState.testResults, [[]]);
    },
  );
}


async function testResolvedSecretValuesArePassedIntoEnvironmentResolution() {
  const runtimeState = {
    histories: [],
    results: [],
    testResults: [],
  };
  const repositories = createRepositories({
    runtime: {
      queries: {
        insertExecutionHistory(record) {
          runtimeState.histories.push(record);
        },
        insertExecutionResult(record) {
          runtimeState.results.push(record);
        },
        insertTestResults(records) {
          runtimeState.testResults.push(records);
        },
      },
    },
  });

  let capturedSecretLookup = null;
  const dependencies = createExecutionDependencies(repositories, runtimeState, {
    readWorkspaceEnvironmentReference: () => ({
      id: 'env-1',
      workspaceId: 'local-workspace',
      name: 'Local',
      variables: [],
    }),
    resolveEnvironmentSecretValues: async () => ({
      secretValuesByKey: {
        api_token: 'resolved-secret-token',
      },
    }),
    resolveExecutionRequestWithEnvironment: (request, environmentRecord, options = {}) => {
      capturedSecretLookup = options.secretValuesByKey || {};
      return {
        request: {
          ...request,
          headers: [{ id: 'header-1', key: 'Authorization', value: 'Bearer resolved-secret-token', enabled: true }],
        },
        resolvedPlaceholderCount: 1,
        unresolved: [],
        affectedInputAreas: ['headers'],
      };
    },
  });

  const originalFetch = global.fetch;
  global.fetch = async (input, init) => {
    const url = String(input);

    if (!url.startsWith('https://example.test/')) {
      return originalFetch(input, init);
    }

    return new Response('{"ok":true}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  try {
    await withServer(
      (app) => registerExecutionRoutes(app, dependencies),
      async ({ baseUrl }) => {
        const response = await requestJson(baseUrl, '/api/executions/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request: createBaseRequest('env-1', {
              headers: [{ id: 'header-1', key: 'Authorization', value: 'Bearer {{API_TOKEN}}', enabled: true }],
            }),
          }),
        });

        assert.equal(response.status, 200);
        assert.equal(response.payload.data.execution.executionOutcome, 'Succeeded');
        assert.equal(capturedSecretLookup.api_token, 'resolved-secret-token');
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
}

async function testSecretProviderErrorBlocksExecution() {
  const runtimeState = {
    histories: [],
    results: [],
    testResults: [],
  };
  const repositories = createRepositories({
    runtime: {
      queries: {
        insertExecutionHistory(record) {
          runtimeState.histories.push(record);
        },
        insertExecutionResult(record) {
          runtimeState.results.push(record);
        },
        insertTestResults(records) {
          runtimeState.testResults.push(records);
        },
      },
    },
  });

  const dependencies = createExecutionDependencies(repositories, runtimeState, {
    readWorkspaceEnvironmentReference: () => ({
      id: 'env-1',
      workspaceId: 'local-workspace',
      name: 'Local',
      variables: [],
    }),
    resolveEnvironmentSecretValues: async () => {
      throw {
        code: 'secret_provider_error',
        details: {
          action: 'resolve',
        },
        message: 'sensitive provider internals',
      };
    },
  });

  await withServer(
    (app) => registerExecutionRoutes(app, dependencies),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/executions/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: createBaseRequest('env-1') }),
      });

      assert.equal(response.status, 200);
      assert.equal(response.payload.data.execution.executionOutcome, 'Blocked');
      assert.equal(response.payload.data.execution.errorCode, 'secret_provider_error');
      assert.equal(
        response.payload.data.execution.errorSummary,
        'Secret provider resolve failed while preparing environment placeholders.',
      );
      assert.equal(response.payload.data.execution.errorSummary.includes('sensitive'), false);
      assert.equal(runtimeState.histories.length, 1);
      assert.equal(runtimeState.histories[0].errorCode, 'secret_provider_error');
    },
  );
}
async function testExecutionRouteAppliesInheritedDefaultsBeforeEnvironmentResolution() {
  const runtimeState = {
    histories: [],
    results: [],
    testResults: [],
  };
  const repositories = createRepositories({
    runtime: {
      queries: {
        insertExecutionHistory(record) {
          runtimeState.histories.push(record);
        },
        insertExecutionResult(record) {
          runtimeState.results.push(record);
        },
        insertTestResults(records) {
          runtimeState.testResults.push(records);
        },
      },
    },
  });

  let capturedExecutionRequest = null;
  let capturedEnvironmentRecord = null;
  const { applyExecutionDefaults, createEffectiveEnvironmentContext } = createExecutionConfigResolver({
    normalizeRequestScriptsState,
    normalizeAuthDefaults,
    normalizeScriptDefaults,
    normalizeRunConfig,
    normalizeScopeVariables,
    workspaceGlobalConfig: {
      variables: [
        { key: 'SHARED_KEY', value: 'global', isEnabled: true },
      ],
      authDefaults: {
        type: 'bearer',
        bearerToken: 'global-token',
        basicUsername: '',
        basicPassword: '',
        apiKeyName: '',
        apiKeyValue: '',
        apiKeyPlacement: 'header',
      },
      scriptDefaults: {
        preRequest: 'global-pre',
        postResponse: 'global-post',
        tests: 'global-tests',
      },
      runConfig: {
        timeoutMs: 1000,
        retries: 0,
        strictSsl: true,
      },
    },
  });

  const dependencies = createExecutionDependencies(repositories, runtimeState, {
    listWorkspaceCollectionRecords: () => ([{
      id: 'collection-1',
      workspaceId: 'local-workspace',
      runConfig: {
        timeoutMs: 2000,
      },
      authDefaults: {
        type: 'bearer',
        bearerToken: 'collection-token',
        basicUsername: '',
        basicPassword: '',
        apiKeyName: '',
        apiKeyValue: '',
        apiKeyPlacement: 'header',
      },
      scriptDefaults: {
        preRequest: 'collection-pre',
        postResponse: 'collection-post',
        tests: 'collection-tests',
      },
      variables: [
        { key: 'SHARED_KEY', value: 'collection', isEnabled: true },
      ],
    }]),
    listWorkspaceRequestGroupRecords: () => ([{
      id: 'group-1',
      workspaceId: 'local-workspace',
      collectionId: 'collection-1',
      runConfig: {
        retries: 2,
        traceEnabled: true,
      },
      authDefaults: {
        type: 'bearer',
        bearerToken: 'group-token',
        basicUsername: '',
        basicPassword: '',
        apiKeyName: '',
        apiKeyValue: '',
        apiKeyPlacement: 'header',
      },
      scriptDefaults: {
        preRequest: 'group-pre',
        postResponse: '',
        tests: 'group-tests',
      },
      variables: [
        { key: 'SHARED_KEY', value: 'group', isEnabled: true },
      ],
    }]),
    readWorkspaceEnvironmentReference: () => ({
      id: 'env-1',
      workspaceId: 'local-workspace',
      name: 'Local',
      variables: [
        { key: 'SHARED_KEY', value: 'environment', isEnabled: true },
      ],
    }),
    applyExecutionDefaults,
    createEffectiveEnvironmentContext,
    resolveExecutionRequestWithEnvironment: (request, environmentRecord) => {
      capturedExecutionRequest = request;
      capturedEnvironmentRecord = environmentRecord;
      return {
        request,
        resolvedPlaceholderCount: 0,
        unresolved: [],
        affectedInputAreas: [],
      };
    },
    createExecutionRequestTarget: (url) => new URL(url),
  });

  const originalFetch = global.fetch;
  global.fetch = async (input, init) => {
    const url = String(input);

    if (!url.startsWith('https://example.test/')) {
      return originalFetch(input, init);
    }

    return new Response('{"ok":true}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  try {
    await withServer(
      (app) => registerExecutionRoutes(app, dependencies),
      async ({ baseUrl }) => {
        const response = await requestJson(baseUrl, '/api/executions/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request: createBaseRequest('env-1', {
              collectionId: 'collection-1',
              requestGroupId: 'group-1',
              auth: {
                type: 'none',
                bearerToken: '',
                basicUsername: '',
                basicPassword: '',
                apiKeyName: '',
                apiKeyValue: '',
                apiKeyPlacement: 'header',
              },
              scripts: {
                activeStage: 'tests',
                preRequest: '',
                postResponse: '',
                tests: '',
              },
            }),
          }),
        });

        assert.equal(response.status, 200);
        assert.equal(response.payload.data.execution.executionOutcome, 'Succeeded');
        assert.ok(capturedExecutionRequest);
        assert.equal(capturedExecutionRequest.auth.type, 'bearer');
        assert.equal(capturedExecutionRequest.auth.bearerToken, 'group-token');
        assert.equal(capturedExecutionRequest.scripts.preRequest.mode, 'inline');
        assert.equal(capturedExecutionRequest.scripts.preRequest.sourceCode, 'group-pre');
        assert.equal(capturedExecutionRequest.scripts.postResponse.sourceCode, 'collection-post');
        assert.equal(capturedExecutionRequest.scripts.tests.sourceCode, 'group-tests');
        assert.deepEqual(capturedExecutionRequest.runConfig, {
          timeoutMs: 2000,
          retries: 2,
          strictSsl: true,
          traceEnabled: true,
        });
        assert.ok(capturedEnvironmentRecord);
        assert.equal(
          capturedEnvironmentRecord.variables.find((row) => row.key === 'SHARED_KEY')?.value,
          'group',
        );
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
}

async function testCollectionBatchRunTraversesNestedGroupsDepthFirstAndContinuesOnError() {
  const runtimeState = {
    histories: [],
    results: [],
    testResults: [],
  };
  const repositories = createRepositories({
    runtime: {
      queries: {
        insertExecutionHistory(record) {
          runtimeState.histories.push(record);
        },
        insertExecutionResult(record) {
          runtimeState.results.push(record);
        },
        insertTestResults(records) {
          runtimeState.testResults.push(records);
        },
      },
    },
  });
  const savedRequests = [
    createSavedRequest('request-1', 'Health check', 'https://example.test/health'),
    createSavedRequest('request-2', 'Create user', 'https://example.test/users'),
    createSavedRequest('request-3', 'List projects', 'https://example.test/projects'),
  ];
  const fetchCalls = [];
  const originalFetch = global.fetch;
  global.fetch = async (input, init) => {
    const url = String(input);

    if (!url.startsWith('https://example.test/')) {
      return originalFetch(input, init);
    }

    fetchCalls.push(url);

    if (url.endsWith('/users')) {
      throw new Error('Transport failed for Create user.');
    }

    return new Response('{"ok":true}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const dependencies = createExecutionDependencies(repositories, runtimeState, {
    listWorkspaceSavedRequestRecords: () => savedRequests,
    buildWorkspaceRequestTree: () => ({
      defaults: null,
      collections: [],
      requestGroups: [],
      tree: [
        {
          id: 'collection-node-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          childGroups: [
            {
              id: 'group-node-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'group-general',
              name: 'General',
              childGroups: [
                {
                  id: 'group-node-nested',
                  kind: 'request-group',
                  collectionId: 'collection-saved-requests',
                  requestGroupId: 'group-nested',
                  name: 'Nested',
                  childGroups: [],
                  requests: [
                    {
                      id: 'request-node-request-2',
                      kind: 'request',
                      name: 'Create user',
                      request: createRequestLeaf(savedRequests[1], 'group-nested', 'Nested'),
                    },
                  ],
                },
              ],
              requests: [
                {
                  id: 'request-node-request-1',
                  kind: 'request',
                  name: 'Health check',
                  request: createRequestLeaf(savedRequests[0], 'group-general', 'General'),
                },
              ],
            },
            {
              id: 'group-node-secondary',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'group-secondary',
              name: 'Secondary',
              childGroups: [],
              requests: [
                {
                  id: 'request-node-request-3',
                  kind: 'request',
                  name: 'List projects',
                  request: createRequestLeaf(savedRequests[2], 'group-secondary', 'Secondary'),
                },
              ],
            },
          ],
        },
      ],
    }),
    createExecutionRequestTarget: (url) => new URL(url),
  });

  try {
    await withServer(
      (app) => registerExecutionRoutes(app, dependencies),
      async ({ baseUrl }) => {
        const response = await requestJson(baseUrl, '/api/collections/collection-saved-requests/run', {
          method: 'POST',
        });

        assert.equal(response.status, 200);
        assert.deepEqual(fetchCalls, [
          'https://example.test/users',
          'https://example.test/health',
          'https://example.test/projects',
        ]);
        assert.deepEqual(
          response.payload.data.batchExecution.steps.map((step) => step.requestId),
          ['request-2', 'request-1', 'request-3'],
        );
        assert.equal(response.payload.data.batchExecution.failedCount, 1);
        assert.equal(response.payload.data.batchExecution.succeededCount, 2);
        assert.equal(response.payload.data.batchExecution.aggregateOutcome, 'Failed');
        assert.equal(response.payload.data.batchExecution.continuedAfterFailure, true);
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
}

async function testRequestGroupBatchRunTraversesSelectedSubtreeDepthFirst() {
  const runtimeState = {
    histories: [],
    results: [],
    testResults: [],
  };
  const repositories = createRepositories({
    runtime: {
      queries: {
        insertExecutionHistory(record) {
          runtimeState.histories.push(record);
        },
        insertExecutionResult(record) {
          runtimeState.results.push(record);
        },
        insertTestResults(records) {
          runtimeState.testResults.push(records);
        },
      },
    },
  });
  const savedRequests = [
    createSavedRequest('request-1', 'Health check', 'https://example.test/health'),
    createSavedRequest('request-2', 'Create user', 'https://example.test/users'),
    createSavedRequest('request-3', 'List projects', 'https://example.test/projects'),
  ];
  const fetchCalls = [];
  const originalFetch = global.fetch;
  global.fetch = async (input, init) => {
    const url = String(input);

    if (!url.startsWith('https://example.test/')) {
      return originalFetch(input, init);
    }

    fetchCalls.push(url);
    return new Response('{"ok":true}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const dependencies = createExecutionDependencies(repositories, runtimeState, {
    listWorkspaceSavedRequestRecords: () => savedRequests,
    buildWorkspaceRequestTree: () => ({
      defaults: null,
      collections: [],
      requestGroups: [],
      tree: [
        {
          id: 'collection-node-saved-requests',
          kind: 'collection',
          collectionId: 'collection-saved-requests',
          name: 'Saved Requests',
          childGroups: [
            {
              id: 'group-node-general',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'group-general',
              name: 'General',
              childGroups: [
                {
                  id: 'group-node-nested',
                  kind: 'request-group',
                  collectionId: 'collection-saved-requests',
                  requestGroupId: 'group-nested',
                  name: 'Nested',
                  childGroups: [],
                  requests: [
                    {
                      id: 'request-node-request-2',
                      kind: 'request',
                      name: 'Create user',
                      request: createRequestLeaf(savedRequests[1], 'group-nested', 'Nested'),
                    },
                  ],
                },
              ],
              requests: [
                {
                  id: 'request-node-request-1',
                  kind: 'request',
                  name: 'Health check',
                  request: createRequestLeaf(savedRequests[0], 'group-general', 'General'),
                },
              ],
            },
            {
              id: 'group-node-secondary',
              kind: 'request-group',
              collectionId: 'collection-saved-requests',
              requestGroupId: 'group-secondary',
              name: 'Secondary',
              childGroups: [],
              requests: [
                {
                  id: 'request-node-request-3',
                  kind: 'request',
                  name: 'List projects',
                  request: createRequestLeaf(savedRequests[2], 'group-secondary', 'Secondary'),
                },
              ],
            },
          ],
        },
      ],
    }),
    createExecutionRequestTarget: (url) => new URL(url),
  });

  try {
    await withServer(
      (app) => registerExecutionRoutes(app, dependencies),
      async ({ baseUrl }) => {
        const response = await requestJson(baseUrl, '/api/request-groups/group-general/run', {
          method: 'POST',
        });

        assert.equal(response.status, 200);
        assert.deepEqual(fetchCalls, [
          'https://example.test/users',
          'https://example.test/health',
        ]);
        assert.equal(response.payload.data.batchExecution.containerType, 'request-group');
        assert.equal(response.payload.data.batchExecution.containerId, 'group-general');
        assert.deepEqual(
          response.payload.data.batchExecution.steps.map((step) => step.requestId),
          ['request-2', 'request-1'],
        );
        assert.equal(response.payload.data.batchExecution.requestCount, 2);
        assert.equal(response.payload.data.batchExecution.succeededCount, 2);
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
}

async function testRequestGroupBatchRunReturnsNotFoundForUnknownGroup() {
  const runtimeState = {
    histories: [],
    results: [],
    testResults: [],
  };
  const repositories = createRepositories({
    runtime: {
      queries: {
        insertExecutionHistory(record) {
          runtimeState.histories.push(record);
        },
        insertExecutionResult(record) {
          runtimeState.results.push(record);
        },
        insertTestResults(records) {
          runtimeState.testResults.push(records);
        },
      },
    },
  });

  const dependencies = createExecutionDependencies(repositories, runtimeState, {
    listWorkspaceSavedRequestRecords: () => [],
    buildWorkspaceRequestTree: () => ({
      defaults: null,
      collections: [],
      requestGroups: [],
      tree: [],
    }),
  });

  await withServer(
    (app) => registerExecutionRoutes(app, dependencies),
    async ({ baseUrl }) => {
      const response = await requestJson(baseUrl, '/api/request-groups/group-missing/run', {
        method: 'POST',
      });

      assert.equal(response.status, 404);
      assert.equal(response.payload.error.code, 'request_group_not_found');
      assert.equal(response.payload.error.details.requestGroupId, 'group-missing');
    },
  );
}
(async function run() {
  await testMissingLinkedScriptBlocksExecutionAndPersistsError();
  await testUnresolvedEnvironmentPlaceholderBlocksExecution();
  await testResolvedSecretValuesArePassedIntoEnvironmentResolution();
  await testSecretProviderErrorBlocksExecution();
  await testExecutionRouteAppliesInheritedDefaultsBeforeEnvironmentResolution();
  await testCollectionBatchRunTraversesNestedGroupsDepthFirstAndContinuesOnError();
  await testRequestGroupBatchRunTraversesSelectedSubtreeDepthFirst();
  await testRequestGroupBatchRunReturnsNotFoundForUnknownGroup();
})();





