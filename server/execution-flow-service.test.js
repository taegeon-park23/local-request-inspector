const assert = require('node:assert/strict');
const { createExecutionFlowService } = require('./execution-flow-service');

function createCloneRows(rows = []) {
  return (rows || []).map((row, index) => ({
    id: row?.id || `row-${index + 1}`,
    key: typeof row?.key === 'string' ? row.key : '',
    value: typeof row?.value === 'string' ? row.value : '',
    enabled: row?.enabled !== false,
  }));
}

function createService(overrides = {}) {
  return createExecutionFlowService({
    cloneRows: createCloneRows,
    cloneAuth: (auth = {}) => ({
      type: auth.type || 'none',
      bearerToken: auth.bearerToken || '',
      basicUsername: auth.basicUsername || '',
      basicPassword: auth.basicPassword || '',
      apiKeyName: auth.apiKeyName || '',
      apiKeyValue: auth.apiKeyValue || '',
      apiKeyPlacement: auth.apiKeyPlacement || 'header',
    }),
    cloneScripts: (scripts = {}) => ({
      preRequest: scripts.preRequest || null,
      postResponse: scripts.postResponse || null,
      tests: scripts.tests || null,
    }),
    normalizeText: (value) => (typeof value === 'string' ? value.trim() : ''),
    requestScriptStageIds: ['pre-request', 'post-response', 'tests'],
    runScriptStageInChildProcess: async () => ({ outcome: 'skipped', summary: 'No script saved.' }),
    ...overrides,
  });
}

function testCreateExecutionRequestTargetAddsQueryAuth() {
  const service = createService();
  const target = service.createExecutionRequestTarget(
    'https://example.test/health',
    [
      { key: 'debug', value: '1', enabled: true },
      { key: 'ignored', value: '0', enabled: false },
    ],
    {
      type: 'api-key',
      apiKeyPlacement: 'query',
      apiKeyName: 'api_key',
      apiKeyValue: 'secret-value',
    },
  );

  assert.equal(target.toString(), 'https://example.test/health?debug=1&api_key=secret-value');
}

function testCreateLinkedScriptRunStageResultBlocksReferencedStage() {
  const service = createService();
  const error = new Error('Linked saved script "Smoke Tests" is missing.');
  error.code = 'request_linked_script_missing';
  error.details = {
    stageId: 'tests',
    savedScriptNameSnapshot: 'Smoke Tests',
  };

  const result = service.createLinkedScriptRunStageResult(error);

  assert.equal(result.transport.status, 'blocked');
  assert.equal(result.tests.status, 'blocked');
  assert.equal(result.tests.errorCode, 'request_linked_script_missing');
  assert.match(result.tests.summary, /Smoke Tests/);
  assert.equal(result['pre-request'].status, 'skipped');
}

async function testExecuteScriptStageMapsBlockedChildResult() {
  const service = createService({
    runScriptStageInChildProcess: async () => ({
      outcome: 'blocked',
      errorCode: 'script_capability_blocked',
      errorSummary: 'Mutation is not available in this bounded slice.',
      consoleEntries: ['[Pre-request] blocked'],
      consoleLogCount: 1,
      consoleWarningCount: 1,
      testResults: [],
      mutatedExecutionRequest: { method: 'POST' },
    }),
  });

  const result = await service.executeScriptStage('pre-request', 'request.method = "POST";', {
    executionRequest: { method: 'GET' },
  });

  assert.equal(result.stageResult.status, 'blocked');
  assert.equal(result.stageResult.errorCode, 'script_capability_blocked');
  assert.deepEqual(result.stageResult.consoleEntries, ['[Pre-request] blocked']);
  assert.equal(result.executionRequest.method, 'POST');
}

(async function run() {
  testCreateExecutionRequestTargetAddsQueryAuth();
  testCreateLinkedScriptRunStageResultBlocksReferencedStage();
  await testExecuteScriptStageMapsBlockedChildResult();
})();
