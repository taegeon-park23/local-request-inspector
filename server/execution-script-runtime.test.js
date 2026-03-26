const assert = require('node:assert/strict');
const { executeScriptStageInProcess } = require('./execution-script-runtime');

function createExecutionRequest() {
  return {
    id: 'request-1',
    workspaceId: 'local-workspace',
    name: 'Health check',
    method: 'GET',
    url: 'https://example.test/health',
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

async function runScript(scriptSource) {
  return executeScriptStageInProcess({
    stageId: 'post-response',
    scriptSource,
    executionRequest: createExecutionRequest(),
    targetUrl: 'https://example.test/health',
    responseStatus: 200,
    responseHeaders: [{ name: 'content-type', value: 'application/json' }],
    responseBodyText: '{"ok":true}',
  });
}

async function testCrossRealmErrorMessageIsPreserved() {
  const spreadMessage = 'Spread syntax requires ...iterable[Symbol.iterator] to be a function';
  const result = await runScript(`throw new Error(${JSON.stringify(spreadMessage)});`);

  assert.equal(result.outcome, 'failed');
  assert.equal(result.summary, spreadMessage);
  assert.equal(result.errorSummary, spreadMessage);
  assert.equal(result.errorCode, 'script_stage_failed');
}

async function testFallbackMessageUsedWhenThrownValueHasNoMessage() {
  const result = await runScript('throw { code: "custom_script_error" };');

  assert.equal(result.outcome, 'failed');
  assert.equal(result.summary, 'Post-response failed.');
  assert.equal(result.errorSummary, 'Post-response failed.');
  assert.equal(result.errorCode, 'custom_script_error');
}

(async function run() {
  await testCrossRealmErrorMessageIsPreserved();
  await testFallbackMessageUsedWhenThrownValueHasNoMessage();
})();
