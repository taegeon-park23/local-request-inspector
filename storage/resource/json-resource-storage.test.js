const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { JsonResourceStorage, buildResourceManifestPayload, serializeJsonDeterministically } = require('./json-resource-storage');
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
})();
