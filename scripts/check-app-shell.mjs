import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

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

const lines = [
  '[app-shell] Packaging and dev-experience status',
  '',
  'Built client shell: ' + (builtClientAvailable ? 'available' : 'missing'),
  'Built client entry: ' + clientIndexPath,
  'Server legacy route: http://localhost:5671/',
  'Server app route: http://localhost:5671/app',
  'Vite dev route: http://localhost:5173/',
  '',
  'Storage bootstrap: ' + (storageBootstrapped ? 'ready' : 'not bootstrapped yet'),
  'Storage root: ' + layout.rootDir,
  '',
  'Recommended commands:',
  '  npm run dev:app       Start the server lane and the Vite client lane together.',
  '  npm run build:client  Build the React client shell for /app serving.',
  '  npm run serve:app     Serve the legacy / route plus the built /app shell.',
  '  npm run bootstrap:storage  Create storage manifests and the runtime database.',
  '  npm run test:node     Run the plain Node seam verification lane.',
  '  npm run test:ui       Run the Vitest UI lane (may still hit sandbox EPERM during TS transform).',
];

if (builtClientAvailable === false) {
  lines.push('');
  lines.push('Built shell note: /app stays on a bounded fallback page until you run "npm run build:client".');
  lines.push('Build limitation note: some sandboxed Windows environments can still fail later at Vite HTML transform with "vite:build-html spawn EPERM".');
}

if (storageBootstrapped === false) {
  lines.push('');
  lines.push('Storage note: run "npm run bootstrap:storage" before expecting persisted resource/runtime data.');
}

console.log(lines.join('\n'));
