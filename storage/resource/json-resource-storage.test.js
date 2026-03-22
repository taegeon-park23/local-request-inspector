const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { STORAGE_COMPATIBILITY_STATES } = require('../shared/constants');
const {
  JsonResourceStorage,
  buildResourceManifestPayload,
  serializeJsonDeterministically,
  readJsonFileState,
  inspectResourceManifestCompatibility,
} = require('./json-resource-storage');
const { buildStorageLayout } = require('../shared/data-root');

function createTempLayout() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lri-resource-storage-'));
  return buildStorageLayout({ explicitDataRoot: rootDir });
}

(function run() {
  const layout = createTempLayout();
  const storage = new JsonResourceStorage({ layout });

  fs.mkdirSync(layout.metadataDir, { recursive: true });
  fs.writeFileSync(layout.resourceManifestPath, '{ invalid json');

  storage.ensureStructure();

  const manifest = JSON.parse(fs.readFileSync(layout.resourceManifestPath, 'utf8'));
  assert.equal(manifest.schemaVersion, buildResourceManifestPayload().schemaVersion);
  assert.equal(manifest.storageKind, buildResourceManifestPayload().storageKind);
  assert.deepEqual(manifest.recordSchemaVersions, buildResourceManifestPayload().recordSchemaVersions);
  assert.equal(
    inspectResourceManifestCompatibility(readJsonFileState(layout.resourceManifestPath)).state,
    STORAGE_COMPATIBILITY_STATES.READ_COMPATIBLE,
  );

  const entity = {
    workspaceId: 'local-workspace',
    name: 'Health check',
    id: 'request-1',
    params: [{ value: '1', key: 'page' }],
    nested: { zeta: 2, alpha: 1 },
  };

  storage.save('request', entity);
  const serializedText = fs.readFileSync(storage.getEntityPath('request', 'request-1'), 'utf8');

  assert.equal(serializedText, serializeJsonDeterministically(entity));

  fs.writeFileSync(storage.getEntityPath('request', 'request-invalid'), '{ invalid json');
  assert.throws(
    () => storage.list('request'),
    (error) => error && error.code === 'resource_record_invalid_json',
  );

  const migrationLayout = createTempLayout();
  const migrationStorage = new JsonResourceStorage({ layout: migrationLayout });
  fs.mkdirSync(migrationLayout.metadataDir, { recursive: true });
  fs.writeFileSync(
    migrationLayout.resourceManifestPath,
    JSON.stringify({
      ...buildResourceManifestPayload(),
      schemaVersion: 0,
    }, null, 2),
  );

  const migrationCompatibility = inspectResourceManifestCompatibility(
    readJsonFileState(migrationLayout.resourceManifestPath),
  );
  assert.equal(migrationCompatibility.state, STORAGE_COMPATIBILITY_STATES.MIGRATION_NEEDED);
  assert.equal(migrationCompatibility.code, 'resource_manifest_migration_needed');
  assert.throws(
    () => migrationStorage.ensureStructure(),
    (error) => error && error.code === 'resource_manifest_migration_needed',
  );
})();
