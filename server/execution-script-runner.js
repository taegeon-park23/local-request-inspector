const path = require('node:path');
const { Worker } = require('node:worker_threads');
const { SCRIPT_TIMEOUT_MS } = require('./execution-script-runtime');
const { runJsonChildProcess } = require('./shared/run-json-child-process');

function createStageLabel(stageId) {
  switch (stageId) {
    case 'pre-request':
      return 'Pre-request';
    case 'post-response':
      return 'Post-response';
    case 'tests':
      return 'Tests';
    default:
      return 'Transport';
  }
}

function createRunnerPayload(options) {
  return {
    stageId: options.stageId,
    scriptSource: options.scriptSource,
    executionRequest: options.executionRequest,
    targetUrl: options.target ? options.target.toString() : null,
    responseStatus: options.responseStatus ?? null,
    responseHeaders: options.responseHeaders ?? [],
    responseBodyText: options.responseBodyText ?? '',
  };
}

function createWorkerFailureResult(stageLabel, error) {
  return {
    outcome: 'failed',
    errorCode: error?.code || 'worker_execution_failed',
    errorSummary: error?.message || `${stageLabel} worker execution failed.`,
  };
}

function runScriptStageInWorkerThread(options) {
  const stageLabel = createStageLabel(options.stageId);
  const payload = createRunnerPayload(options);
  const runtimeModulePath = path.join(__dirname, 'execution-script-runtime.js');
  const workerTimeoutMs = SCRIPT_TIMEOUT_MS + 250;
  const timeoutResult = {
    outcome: 'timed_out',
    errorCode: 'script_timed_out',
    errorSummary: `${stageLabel} exceeded the bounded execution timeout.`,
  };
  const cancelResult = {
    outcome: 'cancelled',
    errorCode: 'execution_cancelled',
    errorSummary: `${stageLabel} was cancelled before completion.`,
  };

  return new Promise((resolve) => {
    const worker = new Worker(`
const { parentPort, workerData } = require('node:worker_threads');
const { executeScriptStageInProcess } = require(workerData.runtimeModulePath);
Promise.resolve()
  .then(() => executeScriptStageInProcess(workerData.payload))
  .then((result) => {
    parentPort.postMessage({ type: 'result', result });
  })
  .catch((error) => {
    parentPort.postMessage({
      type: 'error',
      error: {
        code: error && error.code ? error.code : 'worker_execution_failed',
        message: error && error.message ? error.message : 'Worker execution failed.',
      },
    });
  });
`, {
      eval: true,
      workerData: {
        runtimeModulePath,
        payload,
      },
    });
    let settled = false;
    let timeoutHandle = null;

    const finish = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (options.signal) {
        options.signal.removeEventListener('abort', handleAbort);
      }
      resolve(result);
    };

    const handleAbort = () => {
      worker.terminate().catch(() => {});
      finish(cancelResult);
    };

    worker.once('message', (message) => {
      if (!message || typeof message !== 'object') {
        finish(createWorkerFailureResult(stageLabel));
        return;
      }

      if (message.type === 'result') {
        finish(message.result);
        return;
      }

      finish(createWorkerFailureResult(stageLabel, message.error));
    });

    worker.once('error', (error) => {
      finish(createWorkerFailureResult(stageLabel, error));
    });

    if (workerTimeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        worker.terminate().catch(() => {});
        finish(timeoutResult);
      }, workerTimeoutMs);
    }

    if (options.signal) {
      if (options.signal.aborted) {
        handleAbort();
        return;
      }

      options.signal.addEventListener('abort', handleAbort, { once: true });
    }
  });
}

function runScriptStageInChildProcess(options) {
  const stageLabel = createStageLabel(options.stageId);
  const payload = createRunnerPayload(options);

  return Promise.resolve()
    .then(() => runJsonChildProcess({
      modulePath: path.join(__dirname, 'execution-script-child.js'),
      payload,
      timeoutMs: SCRIPT_TIMEOUT_MS + 250,
      signal: options.signal,
      timeoutResult: {
        outcome: 'timed_out',
        errorCode: 'script_timed_out',
        errorSummary: `${stageLabel} exceeded the bounded execution timeout.`,
      },
      cancelResult: {
        outcome: 'cancelled',
        errorCode: 'execution_cancelled',
        errorSummary: `${stageLabel} was cancelled before completion.`,
      },
    }))
    .then((result) => {
      if (result?.errorCode === 'child_process_spawn_failed' && /EPERM/i.test(result?.errorSummary || '')) {
        return runScriptStageInWorkerThread(options);
      }

      return result;
    })
    .catch((error) => {
      if (error?.code === 'EPERM') {
        return runScriptStageInWorkerThread(options);
      }

      throw error;
    });
}

module.exports = {
  runScriptStageInChildProcess,
};
