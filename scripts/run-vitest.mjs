import {
  assertEsbuildTransformSupport,
  formatEsbuildCompatibilityMessage,
  isEsbuildSandboxBlock,
  patchWindowsNetUseExec,
  shouldSkipCompatibilityProbe,
} from './esbuild-sandbox-compat.mjs';

patchWindowsNetUseExec();

const vitestArgs = process.argv.slice(2);

if (!shouldSkipCompatibilityProbe(vitestArgs)) {
  await assertEsbuildTransformSupport('test:ui', {
    fallbackCommands: ['npm run check', 'npm run test:node', 'npm run check:app'],
  });
}

process.argv = [
  process.argv[0] ?? process.execPath,
  process.argv[1] ?? new URL(import.meta.url).pathname,
  '--configLoader',
  'runner',
  ...vitestArgs,
];

try {
  await import('../node_modules/vitest/vitest.mjs');
} catch (error) {
  if (isEsbuildSandboxBlock(error)) {
    console.error(
      formatEsbuildCompatibilityMessage(
        {
          lane: 'test:ui',
          supported: false,
          status: 'sandbox-blocked',
          code: 'sandbox_esbuild_transform_blocked',
          originalCode: error?.code || null,
          message: error?.message || String(error),
        },
        {
          fallbackCommands: ['npm run check', 'npm run test:node', 'npm run check:app'],
        },
      ),
    );
    process.exit(1);
  }

  throw error;
}
