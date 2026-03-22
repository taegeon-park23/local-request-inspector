import assert from 'node:assert/strict';
import {
  formatEsbuildCompatibilityMessage,
  inspectEsbuildTransformSupport,
  isEsbuildSandboxBlock,
  shouldSkipCompatibilityProbe,
} from './esbuild-sandbox-compat.mjs';

assert.equal(shouldSkipCompatibilityProbe(['--help']), true);
assert.equal(shouldSkipCompatibilityProbe(['run', '--version']), true);
assert.equal(shouldSkipCompatibilityProbe(['run']), false);

assert.equal(isEsbuildSandboxBlock({ code: 'EPERM' }), true);
assert.equal(isEsbuildSandboxBlock({ message: 'spawn EPERM' }), true);
assert.equal(isEsbuildSandboxBlock({ code: 'EINVAL' }), true);
assert.equal(isEsbuildSandboxBlock({ message: 'different failure' }), false);

const compatibilityMessage = formatEsbuildCompatibilityMessage(
  {
    lane: 'build:client',
    supported: false,
    status: 'sandbox-blocked',
    code: 'sandbox_esbuild_transform_blocked',
    originalCode: 'EPERM',
    message: 'spawn EPERM',
  },
  {
    fallbackCommands: ['npm run check', 'npm run test:node'],
  },
);

assert.match(compatibilityMessage, /build:client/);
assert.match(compatibilityMessage, /Fallback: npm run check \| npm run test:node/);

const probe = await inspectEsbuildTransformSupport('test:ui');
assert.equal(probe.lane, 'test:ui');
assert.equal(typeof probe.supported, 'boolean');

if (probe.supported) {
  assert.equal(probe.status, 'supported');
} else {
  assert.match(probe.code, /esbuild_transform|sandbox_esbuild_transform_blocked/);
}
