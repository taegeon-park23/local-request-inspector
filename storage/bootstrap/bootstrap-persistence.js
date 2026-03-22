const fs = require('fs');
const { buildStorageLayout } = require('../shared/data-root');
const {
  AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
  MOCK_RULE_RESOURCE_SCHEMA_VERSION,
  REQUEST_RESOURCE_SCHEMA_VERSION,
  RESOURCE_MANIFEST_SCHEMA_VERSION,
  RESOURCE_STORAGE_KIND,
  RUNTIME_CAPTURE_SUMMARY_SCHEMA_VERSION,
  RUNTIME_METADATA_SCHEMA_VERSION,
  RUNTIME_PERSISTENCE_POLICY,
  RUNTIME_REQUEST_SNAPSHOT_SCHEMA_VERSION,
  RUNTIME_SCHEMA_VERSION,
  RUNTIME_STORAGE_KIND,
  STORAGE_SCHEMA_VERSION,
} = require('../shared/constants');
const { JsonResourceStorage } = require('../resource/json-resource-storage');
const { SqliteRuntimeStorage } = require('../runtime/sqlite-runtime-storage');
const { createRepositoryRegistry } = require('../repositories/repository-registry');

function buildStorageVersionManifestPayload() {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    resourceManifestSchemaVersion: RESOURCE_MANIFEST_SCHEMA_VERSION,
    resourceStorage: RESOURCE_STORAGE_KIND,
    runtimeStorage: RUNTIME_STORAGE_KIND,
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    runtimeMetadataSchemaVersion: RUNTIME_METADATA_SCHEMA_VERSION,
    runtimePersistencePolicy: RUNTIME_PERSISTENCE_POLICY,
    authoredRequestSchemaVersion: REQUEST_RESOURCE_SCHEMA_VERSION,
    mockRuleSchemaVersion: MOCK_RULE_RESOURCE_SCHEMA_VERSION,
    requestSnapshotSchemaVersion: RUNTIME_REQUEST_SNAPSHOT_SCHEMA_VERSION,
    capturedRequestSummarySchemaVersion: RUNTIME_CAPTURE_SUMMARY_SCHEMA_VERSION,
    authoredResourceBundleSchemaVersion: AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
    note: 'Bootstrap manifest only. Resource lane stores authored definitions. Runtime lane stores bounded observation summaries. DTO shapes must remain decoupled from storage shapes.',
    updatedAt: new Date().toISOString(),
  };
}

function ensureVersionManifest(layout) {
  fs.mkdirSync(layout.metadataDir, { recursive: true });

  const payload = buildStorageVersionManifestPayload();
  let shouldRewriteManifest = true;

  if (fs.existsSync(layout.versionManifestPath)) {
    try {
      const existingManifest = JSON.parse(fs.readFileSync(layout.versionManifestPath, 'utf8'));
      shouldRewriteManifest = !(
        existingManifest
        && existingManifest.schemaVersion === payload.schemaVersion
        && existingManifest.resourceStorage === payload.resourceStorage
        && existingManifest.runtimeStorage === payload.runtimeStorage
      );
    } catch {
      shouldRewriteManifest = true;
    }
  }

  if (shouldRewriteManifest) {
    fs.writeFileSync(layout.versionManifestPath, JSON.stringify(payload, null, 2));
  }
}

function bootstrapPersistence(options = {}) {
  const layout = buildStorageLayout(options);
  const resourceStorage = new JsonResourceStorage({ layout });
  const runtimeStorage = new SqliteRuntimeStorage({
    layout,
    migrationsDir: options.migrationsDir || require('path').join(__dirname, '..', 'runtime', 'migrations'),
  });

  ensureVersionManifest(layout);
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
  buildStorageVersionManifestPayload,
};
