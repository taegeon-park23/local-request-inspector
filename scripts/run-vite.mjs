import {
  assertEsbuildTransformSupport,
  formatEsbuildCompatibilityMessage,
  isEsbuildSandboxBlock,
  patchWindowsNetUseExec,
  shouldSkipCompatibilityProbe,
} from './esbuild-sandbox-compat.mjs';

patchWindowsNetUseExec();

const viteArgs = process.argv.slice(2);
const isBuildCommand = viteArgs[0] === 'build';

if (isBuildCommand && !shouldSkipCompatibilityProbe(viteArgs)) {
  await assertEsbuildTransformSupport('build:client', {
    fallbackCommands: ['npm run check', 'npm run check:app', 'npm run test:node', 'npm run dev:app'],
  });
}

process.argv = [
  process.argv[0] ?? process.execPath,
  process.argv[1] ?? new URL(import.meta.url).pathname,
  '--configLoader',
  'runner',
  ...viteArgs,
];

try {
  await import('../node_modules/vite/bin/vite.js');
} catch (error) {
  if (isEsbuildSandboxBlock(error)) {
    console.error(
      formatEsbuildCompatibilityMessage(
        {
          lane: isBuildCommand ? 'build:client' : 'dev:client',
          supported: false,
          status: 'sandbox-blocked',
          code: 'sandbox_esbuild_transform_blocked',
          originalCode: error?.code || null,
          message: error?.message || String(error),
        },
        {
          fallbackCommands: ['npm run check', 'npm run check:app', 'npm run test:node'],
        },
      ),
    );
    process.exit(1);
  }

  throw error;
}
