const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildStorageLayout } = require('./data-root');
const { createRuntimeStatusSnapshot } = require('./runtime-status');

(function run() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lri-runtime-status-'));
  const layout = buildStorageLayout({ explicitDataRoot: rootDir });
  fs.mkdirSync(layout.metadataDir, { recursive: true });
  fs.mkdirSync(path.dirname(layout.runtimeDbPath), { recursive: true });
  fs.writeFileSync(layout.versionManifestPath, '{}');
  fs.writeFileSync(layout.resourceManifestPath, '{}');
  fs.writeFileSync(layout.runtimeDbPath, '');

  const snapshot = createRuntimeStatusSnapshot({
    appShell: {
      builtClientAvailable: false,
      clientDistPath: 'client/dist',
      clientIndexPath: 'client/dist/index.html',
      legacyRoute: '/',
      appRoute: '/app',
      devClientUrl: 'http://localhost:6173/',
      buildCommand: 'npm run build:client',
      serveCommand: 'npm run serve:app',
      devCommand: 'npm run dev:app',
      note: 'Built shell not available.',
    },
    layout,
  });

  assert.equal(snapshot.appShell.appRoute, '/app');
  assert.equal(snapshot.storage.ready, true);
  assert.equal(snapshot.storage.runtimeDbAvailable, true);
  assert.equal(snapshot.commands.some((item) => item.command === 'npm run check'), true);
  assert.equal(snapshot.routes.some((item) => item.path === 'http://localhost:6173/'), true);
})();
