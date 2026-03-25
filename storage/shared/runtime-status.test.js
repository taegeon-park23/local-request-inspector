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
    secretStorage: {
      secureBackendAvailable: false,
      backendLabel: 'unavailable',
      providerId: 'stub-provider',
      providerVersion: '1.0.0',
      providerStatus: 'unavailable',
      capabilities: ['store', 'resolve', 'clear'],
      readModelPolicy: 'Secret rows remain write-only and expose only hasStoredValue in read responses.',
      replacementWritePolicy: 'Secret replacement writes fail closed until a secure backend is configured.',
      runtimeResolutionPolicy: 'Run time continues to resolve plain variables only. Secret-backed placeholders stay unavailable until a secure backend is configured.',
      sanitizedLegacyEnvironmentCount: 1,
      sanitizedLegacySecretRowCount: 2,
      legacySanitizationNote: 'Sanitized 2 legacy secret row(s) across 1 environment(s) during this diagnostics pass.',
      note: 'A secure backend is not configured in this runtime. Secret replacement writes remain blocked, while ordinary environment JSON stays free of raw secret values.',
    },
  });

  assert.equal(snapshot.appShell.appRoute, '/app');
  assert.equal(snapshot.storage.ready, true);
  assert.equal(snapshot.storage.runtimeDbAvailable, true);
  assert.equal(snapshot.secretStorage?.secureBackendAvailable, false);
  assert.equal(snapshot.secretStorage?.providerId, 'stub-provider');
  assert.equal(snapshot.secretStorage?.providerVersion, '1.0.0');
  assert.equal(snapshot.secretStorage?.providerStatus, 'unavailable');
  assert.deepEqual(snapshot.secretStorage?.capabilities, ['store', 'resolve', 'clear']);
  assert.equal(snapshot.secretStorage?.sanitizedLegacySecretRowCount, 2);
  assert.equal(snapshot.commands.some((item) => item.command === 'npm run check'), true);
  assert.equal(snapshot.routes.some((item) => item.path === 'http://localhost:6173/'), true);
})();
