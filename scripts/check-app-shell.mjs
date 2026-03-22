import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { inspectEsbuildTransformSupport } from './esbuild-sandbox-compat.mjs';

const require = createRequire(import.meta.url);
const { buildStorageLayout } = require('../storage/shared/data-root.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const clientDistPath = path.join(repoRoot, 'client', 'dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const layout = buildStorageLayout();

const builtClientAvailable = fs.existsSync(clientIndexPath);
const storageBootstrapped =
  fs.existsSync(layout.versionManifestPath) &&
  fs.existsSync(layout.resourceManifestPath) &&
  fs.existsSync(layout.runtimeDbPath);
const buildLane = await inspectEsbuildTransformSupport('build:client');
const testUiLane = await inspectEsbuildTransformSupport('test:ui');

function describeLane(result) {
  if (result.supported) {
    return 'ready';
  }

  if (result.status === 'sandbox-blocked') {
    return 'blocked by sandboxed esbuild worker startup';
  }

  return 'blocked before transform startup';
}

const lines = [
  '[app-shell] Packaging and dev-experience status',
  '',
  'Built client shell: ' + (builtClientAvailable ? 'available' : 'missing'),
  'Built client entry: ' + clientIndexPath,
  'Server legacy route: http://localhost:5671/',
  'Server app route: http://localhost:5671/app',
  'Vite dev route: http://localhost:6173/',
  '',
  'Storage bootstrap: ' + (storageBootstrapped ? 'ready' : 'not bootstrapped yet'),
  'Storage root: ' + layout.rootDir,
  '',
  'Sandbox compatibility:',
  '  build:client  ' + describeLane(buildLane),
  '  test:ui       ' + describeLane(testUiLane),
  '',
  'Recommended commands:',
  '  npm run dev:app       Start the server lane and the Vite client lane together.',
  '  npm run build:client  Build the React client shell for /app serving.',
  '  npm run serve:app     Serve the legacy / route plus the built /app shell.',
  '  npm run bootstrap:storage  Create storage manifests and the runtime database.',
  '  npm run test:node     Run the plain Node seam verification lane.',
  '  npm run test:ui       Run the Vitest UI lane.',
];

if (builtClientAvailable === false) {
  lines.push('');
  lines.push('Built shell note: /app stays on a bounded fallback page until you run "npm run build:client".');
}

if (buildLane.supported === false) {
  lines.push('');
  lines.push('Build limitation note: ' + buildLane.message);
}

if (testUiLane.supported === false) {
  lines.push('');
  lines.push('UI test limitation note: ' + testUiLane.message);
}

if (storageBootstrapped === false) {
  lines.push('');
  lines.push('Storage note: run "npm run bootstrap:storage" before expecting persisted resource/runtime data.');
}

console.log(lines.join('\n'));
