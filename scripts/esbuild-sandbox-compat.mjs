import { EventEmitter } from 'node:events';
import { createRequire, syncBuiltinESMExports } from 'node:module';

const require = createRequire(import.meta.url);
const childProcess = require('node:child_process');
const esbuild = require('esbuild');
const originalExec = childProcess.exec;
let windowsNetUsePatched = false;

export function shouldSkipCompatibilityProbe(args = []) {
  return args.some((arg) => ['--help', '-h', '--version', '-v'].includes(arg));
}

export function isEsbuildSandboxBlock(error) {
  const message = String(error?.message || '');
  const code = String(error?.code || '');

  return code === 'EPERM'
    || code === 'EINVAL'
    || message.includes('spawn EPERM')
    || message.includes('spawn EINVAL');
}

export function patchWindowsNetUseExec() {
  if (windowsNetUsePatched) {
    return;
  }

  childProcess.exec = function patchedExec(command, ...args) {
    const isWindowsNetUseCommand = process.platform === 'win32'
      && typeof command === 'string'
      && command.trim().toLowerCase() === 'net use';

    if (!isWindowsNetUseCommand) {
      return originalExec.call(this, command, ...args);
    }

    const blockedProcess = new EventEmitter();
    blockedProcess.kill = () => true;
    blockedProcess.stdin = null;
    blockedProcess.stdout = null;
    blockedProcess.stderr = null;

    const callback = typeof args[0] === 'function'
      ? args[0]
      : typeof args[1] === 'function'
        ? args[1]
        : undefined;

    if (typeof callback === 'function') {
      queueMicrotask(() => {
        const error = new Error(
          'Sandbox blocked Windows "net use"; wrappers are falling back to plain realpath resolution for Vite and Vitest startup.',
        );
        error.code = 'EPERM';
        callback(error, '', '');
      });
    }

    return blockedProcess;
  };

  syncBuiltinESMExports();
  windowsNetUsePatched = true;
}

export async function inspectEsbuildTransformSupport(lane) {
  try {
    await esbuild.transform('export const Probe = () => <div>probe</div>;', {
      loader: 'tsx',
      jsx: 'automatic',
      format: 'esm',
      target: 'es2022',
    });

    return {
      lane,
      supported: true,
      status: 'supported',
      code: null,
      originalCode: null,
      message: 'esbuild transform worker started successfully for this lane.',
    };
  } catch (error) {
    const sandboxBlocked = isEsbuildSandboxBlock(error);

    return {
      lane,
      supported: false,
      status: sandboxBlocked ? 'sandbox-blocked' : 'failed',
      code: sandboxBlocked ? 'sandbox_esbuild_transform_blocked' : 'esbuild_transform_failed',
      originalCode: error?.code || null,
      message: error?.message || String(error),
    };
  }
}

export function formatEsbuildCompatibilityMessage(result, options = {}) {
  const fallbackCommands = options.fallbackCommands || [];
  const lines = [
    '[' + result.lane + '] esbuild transform preflight ' + (result.supported ? 'passed.' : 'failed.'),
  ];

  if (result.supported) {
    lines.push(result.message);
    return lines.join('\n');
  }

  if (result.status === 'sandbox-blocked') {
    lines.push('This sandboxed environment blocked the esbuild helper process before Vite/Vitest transform work could start.');
  } else {
    lines.push('The esbuild transform preflight failed before the main Vite/Vitest lane could continue.');
  }

  lines.push('Error code: ' + result.code + (result.originalCode ? ' (original: ' + result.originalCode + ')' : ''));
  lines.push('Details: ' + result.message);

  if (fallbackCommands.length > 0) {
    lines.push('Fallback: ' + fallbackCommands.join(' | '));
  }

  return lines.join('\n');
}

export async function assertEsbuildTransformSupport(lane, options = {}) {
  const result = await inspectEsbuildTransformSupport(lane);

  if (!result.supported) {
    console.error(formatEsbuildCompatibilityMessage(result, options));
    process.exit(1);
  }

  return result;
}
