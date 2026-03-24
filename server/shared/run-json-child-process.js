const { spawn } = require('node:child_process');
const process = require('node:process');

function createChildProcessFailureResult(code, message) {
  return {
    outcome: 'failed',
    errorCode: code,
    errorSummary: message,
  };
}

function runJsonChildProcess(options) {
  const {
    modulePath,
    payload,
    timeoutMs = 1000,
    signal,
    timeoutResult = {
      outcome: 'timed_out',
      errorCode: 'child_process_timed_out',
      errorSummary: 'Child process execution exceeded the configured timeout.',
    },
    cancelResult = {
      outcome: 'cancelled',
      errorCode: 'execution_cancelled',
      errorSummary: 'Child process execution was cancelled before completion.',
    },
  } = options;

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [modulePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const stdoutChunks = [];
    const stderrChunks = [];
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
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
      resolve(result);
    };

    const handleAbort = () => {
      try {
        child.kill();
      } catch {
        // Ignore kill errors during cancellation cleanup.
      }
      finish(cancelResult);
    };

    child.once('error', (error) => {
      finish(createChildProcessFailureResult(
        'child_process_spawn_failed',
        error.message || 'Child process failed before execution could start.',
      ));
    });

    child.stdout.on('data', (chunk) => {
      stdoutChunks.push(Buffer.from(chunk));
    });

    child.stderr.on('data', (chunk) => {
      stderrChunks.push(Buffer.from(chunk));
    });

    child.once('spawn', () => {
      child.stdin.end(JSON.stringify(payload ?? {}));
    });

    child.once('close', (code) => {
      if (settled) {
        return;
      }

      const stdoutText = Buffer.concat(stdoutChunks).toString('utf8').trim();
      const stderrText = Buffer.concat(stderrChunks).toString('utf8').trim();

      if (stdoutText.length > 0) {
        try {
          finish(JSON.parse(stdoutText));
          return;
        } catch (error) {
          if (code === 0) {
            finish(createChildProcessFailureResult(
              'child_process_invalid_output',
              error.message || stderrText || 'Child process returned malformed JSON output.',
            ));
            return;
          }
        }
      }

      if (code === 0) {
        finish(createChildProcessFailureResult(
          'child_process_empty_output',
          'Child process completed without returning JSON output.',
        ));
        return;
      }

      finish(createChildProcessFailureResult(
        'child_process_failed',
        stderrText || `Child process exited with code ${code ?? 'unknown'}.`,
      ));
    });

    if (timeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        try {
          child.kill();
        } catch {
          // Ignore kill errors during timeout cleanup.
        }
        finish(timeoutResult);
      }, timeoutMs);
    }

    if (signal) {
      if (signal.aborted) {
        handleAbort();
        return;
      }

      signal.addEventListener('abort', handleAbort, { once: true });
    }
  });
}

module.exports = {
  runJsonChildProcess,
};
