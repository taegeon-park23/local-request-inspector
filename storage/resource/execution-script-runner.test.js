const assert = require('node:assert/strict');
const { runScriptStageInChildProcess } = require('../../server/execution-script-runner');
const { runLegacyCallbackInChildProcess } = require('../../server/legacy-callback-runner');

function createExecutionRequestSeed() {
  return {
    name: 'Runner seam request',
    method: 'GET',
    url: 'http://localhost:5671/health',
    params: [],
    headers: [],
    bodyMode: 'none',
    bodyText: '',
    formBody: [],
    multipartBody: [],
    auth: {
      type: 'none',
      bearerToken: '',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    },
  };
}

(async function run() {
  const result = await runScriptStageInChildProcess({
    stageId: 'pre-request',
    scriptSource: "require('node:fs');",
    executionRequest: createExecutionRequestSeed(),
  });

  assert.equal(result.outcome, 'blocked');
  assert.equal(result.errorCode, 'script_capability_blocked');

  const timedOutResult = await runScriptStageInChildProcess({
    stageId: 'tests',
    scriptSource: 'while (true) {}',
    executionRequest: createExecutionRequestSeed(),
    responseStatus: 200,
    responseHeaders: [],
    responseBodyText: '{"ok":true}',
  });

  assert.equal(timedOutResult.outcome, 'timed_out');
  assert.equal(timedOutResult.errorCode, 'script_timed_out');

  const redactedResult = await runScriptStageInChildProcess({
    stageId: 'post-response',
    scriptSource: "console.log('Bearer super-secret-token');",
    executionRequest: createExecutionRequestSeed(),
    responseStatus: 200,
    responseHeaders: [],
    responseBodyText: '{"ok":true}',
  });

  assert.equal(redactedResult.outcome, 'succeeded');
  assert.equal(redactedResult.consoleEntries.length, 1);
  assert.match(redactedResult.consoleEntries[0], /\[redacted\]/);

  const controller = new AbortController();
  const pendingResult = runScriptStageInChildProcess({
    stageId: 'pre-request',
    scriptSource: 'while (true) {}',
    executionRequest: createExecutionRequestSeed(),
    signal: controller.signal,
  });

  setTimeout(() => {
    controller.abort();
  }, 10);

  const cancelledResult = await pendingResult;
  assert.equal(cancelledResult.outcome, 'cancelled');
  assert.equal(cancelledResult.errorCode, 'execution_cancelled');

  const legacyResult = await runLegacyCallbackInChildProcess({
    requestConfig: {
      method: 'GET',
      url: 'data:application/json,%7B%22ok%22%3Atrue%7D',
    },
    callbackCode: 'fs.readFileSync("secrets.txt");',
  });

  assert.equal(legacyResult.outcome, 'blocked');
  assert.equal(legacyResult.errorCode, 'script_capability_blocked');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
