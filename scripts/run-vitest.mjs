import { EventEmitter } from 'node:events';
import { createRequire, syncBuiltinESMExports } from 'node:module';

const require = createRequire(import.meta.url);
const childProcess = require('node:child_process');
const originalExec = childProcess.exec;

function isWindowsNetUseCommand(command) {
  return process.platform === 'win32'
    && typeof command === 'string'
    && command.trim().toLowerCase() === 'net use';
}

function createBlockedExecResult(callback) {
  const blockedProcess = new EventEmitter();
  blockedProcess.kill = () => true;
  blockedProcess.stdin = null;
  blockedProcess.stdout = null;
  blockedProcess.stderr = null;

  if (typeof callback === 'function') {
    queueMicrotask(() => {
      const error = new Error(
        'Sandbox blocked Windows "net use"; Vite is falling back to plain realpath resolution for Vitest startup.',
      );
      error.code = 'EPERM';
      callback(error, '', '');
    });
  }

  return blockedProcess;
}

childProcess.exec = function patchedExec(command, ...args) {
  if (isWindowsNetUseCommand(command)) {
    const callback = typeof args[0] === 'function'
      ? args[0]
      : typeof args[1] === 'function'
        ? args[1]
        : undefined;

    return createBlockedExecResult(callback);
  }

  return originalExec.call(this, command, ...args);
};

syncBuiltinESMExports();

process.argv = [
  process.argv[0] ?? process.execPath,
  process.argv[1] ?? new URL(import.meta.url).pathname,
  '--configLoader',
  'runner',
  ...process.argv.slice(2),
];

await import('../node_modules/vitest/vitest.mjs');
