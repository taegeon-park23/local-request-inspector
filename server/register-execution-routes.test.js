const assert = require('node:assert/strict');
const { registerExecutionRoutes } = require('./register-execution-routes');
const {
  createRepositories,
  requestJson,
  sendData,
  sendError,
  withServer,
} = require('./test-support');

function createBaseRequest(selectedEnvironmentId = null) {
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

(async function run() {
  await testMissingLinkedScriptBlocksExecutionAndPersistsError();
  await testUnresolvedEnvironmentPlaceholderBlocksExecution();
})();
