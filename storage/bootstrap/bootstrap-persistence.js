const fs = require('fs');
const { buildStorageLayout } = require('../shared/data-root');
const { STORAGE_SCHEMA_VERSION } = require('../shared/constants');
const { JsonResourceStorage } = require('../resource/json-resource-storage');
const { SqliteRuntimeStorage } = require('../runtime/sqlite-runtime-storage');
const { createRepositoryRegistry } = require('../repositories/repository-registry');

function writeVersionManifest(layout) {
  fs.mkdirSync(layout.metadataDir, { recursive: true });

  const payload = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    resourceStorage: 'json-files',
    runtimeStorage: 'sqlite',
    runtimePersistencePolicy: 'redacted-only',
    note: 'Bootstrap manifest only. DTO shapes must remain decoupled from storage shapes.',
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(layout.versionManifestPath, JSON.stringify(payload, null, 2));
}

function bootstrapPersistence(options = {}) {
  const layout = buildStorageLayout(options);
  const resourceStorage = new JsonResourceStorage({ layout });
  const runtimeStorage = new SqliteRuntimeStorage({
    layout,
    migrationsDir: options.migrationsDir || require('path').join(__dirname, '..', 'runtime', 'migrations'),
  });

  writeVersionManifest(layout);
  resourceStorage.ensureStructure();
  runtimeStorage.ensureStructure();

  return {
    layout,
    resourceStorage,
    runtimeStorage,
    repositories: createRepositoryRegistry({ resourceStorage, runtimeStorage }),
  };
}

module.exports = {
  bootstrapPersistence,
};
