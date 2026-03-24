const path = require('node:path');
const vm = require('node:vm');
const { runJsonChildProcess } = require('./shared/run-json-child-process');

const LEGACY_CALLBACK_TIMEOUT_MS = 1500;
const FORBIDDEN_CALLBACK_TOKEN_PATTERN = /\b(?:process|require|module|exports|__dirname|__filename|globalThis|global|fs|path|child_process)\b/;

function createFailureResult(errorCode, errorSummary, logs = []) {
  return {
    outcome: 'failed',
    errorCode,
    errorSummary,
    logs,
  };
}

async function runLegacyCallbackInProcess(options) {
  const requestConfig = options.requestConfig || {};
  const callbackCode = options.callbackCode || '';
  const normalizedCallbackCode = typeof callbackCode === 'string' ? callbackCode.trim() : '';
  const logs = [];

  if (FORBIDDEN_CALLBACK_TOKEN_PATTERN.test(normalizedCallbackCode)) {
    const message = 'Legacy callback execution attempted to use a blocked host capability.';
    logs.push(`[Error] ${message}`);
    return {
      outcome: 'blocked',
      errorCode: 'script_capability_blocked',
      errorSummary: message,
      logs,
    };
  }

  try {
    logs.push(`[System] 1차 API 요청 시작: ${requestConfig.method} ${requestConfig.url}`);

    const fetchOptions = {
      method: requestConfig.method,
      headers: requestConfig.headers || { 'Content-Type': 'application/json' },
    };

    if (requestConfig.method !== 'GET' && requestConfig.body) {
      if (requestConfig.bodyType === 'application/x-www-form-urlencoded') {
        const formParams = new URLSearchParams();

        if (typeof requestConfig.body === 'object') {
          for (const key in requestConfig.body) {
            formParams.append(key, requestConfig.body[key]);
          }
        } else {
          formParams.append('data', requestConfig.body);
        }

        fetchOptions.body = formParams;
      } else if (requestConfig.bodyType === 'application/json') {
        fetchOptions.body = typeof requestConfig.body === 'string'
          ? requestConfig.body
          : JSON.stringify(requestConfig.body);
      } else {
        fetchOptions.body = String(requestConfig.body);
      }
    }

    if (typeof global.fetch === 'undefined') {
      throw new Error('시스템에 fetch API가 내장되어 있지 않습니다. Node.js 18 이상 버전이 필요합니다.');
    }

    const initialRes = await global.fetch(requestConfig.url, fetchOptions);
    const resText = await initialRes.text();
    let responseData;

    try {
      responseData = JSON.parse(resText);
    } catch {
      responseData = resText;
    }

    logs.push(`[System] 1차 응답 수신 완료 (Status: ${initialRes.status})`);

    const sandbox = {
      fetch: global.fetch,
      URLSearchParams: global.URLSearchParams,
      FormData: global.FormData,
      Blob: global.Blob,
      response: responseData,
      console: {
        log: (...args) => logs.push(`[Log] ${args.join(' ')}`),
        error: (...args) => logs.push(`[Error] ${args.join(' ')}`),
        warn: (...args) => logs.push(`[Warn] ${args.join(' ')}`),
        info: (...args) => logs.push(`[Info] ${args.join(' ')}`),
      },
    };

    vm.createContext(sandbox);
    logs.push('[System] 콜백 코드 실행 시작...');

    const wrappedCode = `(async () => {\n${callbackCode}\n})()`;
    const script = new vm.Script(wrappedCode, {
      displayErrors: true,
      filename: 'legacy-callback.js',
    });
    const result = script.runInContext(sandbox, { timeout: LEGACY_CALLBACK_TIMEOUT_MS });
    const executionResult = result && typeof result.then === 'function'
      ? await result
      : result;

    logs.push('[System] 실행 완료');
    return {
      outcome: 'succeeded',
      logs,
      result: executionResult,
    };
  } catch (error) {
    return /timed out/i.test(error?.message || '')
      ? {
        outcome: 'timed_out',
        errorCode: error?.code || 'script_timed_out',
        errorSummary: error?.message || 'Legacy callback execution timed out.',
        logs: [...logs, `[Error] 시스템/문법 오류: ${error?.message || 'Legacy callback execution timed out.'}`],
      }
      : createFailureResult(
        error?.code || 'legacy_callback_failed',
        error?.message || 'Legacy callback execution failed.',
        [...logs, `[Error] 시스템/문법 오류: ${error?.message || 'Legacy callback execution failed.'}`],
      );
  }
}

function runLegacyCallbackInChildProcess(options) {
  return runJsonChildProcess({
    modulePath: path.join(__dirname, 'legacy-callback-child.js'),
    payload: {
      requestConfig: options.requestConfig,
      callbackCode: options.callbackCode,
    },
    timeoutMs: 2000,
    signal: options.signal,
    timeoutResult: {
      outcome: 'timed_out',
      errorCode: 'script_timed_out',
      errorSummary: 'Legacy callback execution exceeded the bounded timeout.',
      logs: ['[Error] 시스템/문법 오류: Legacy callback execution exceeded the bounded timeout.'],
    },
    cancelResult: {
      outcome: 'cancelled',
      errorCode: 'execution_cancelled',
      errorSummary: 'Legacy callback execution was cancelled before completion.',
      logs: ['[Warn] Legacy callback execution was cancelled before completion.'],
    },
  }).catch((error) => {
    if (error?.code === 'EPERM') {
      return runLegacyCallbackInProcess(options);
    }

    throw error;
  });
}

module.exports = {
  runLegacyCallbackInChildProcess,
};
