const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildStorageLayout } = require('../shared/data-root');
const { STORAGE_COMPATIBILITY_STATES } = require('../shared/constants');
const {
  SqliteRuntimeStorage,
  createExpectedRuntimeMetadata,
  inspectRuntimeMetadataCompatibility,
  validateRuntimeMetadataMap,
} = require('./sqlite-runtime-storage');

function createTempLayout() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lri-runtime-storage-'));
  return buildStorageLayout({ explicitDataRoot: rootDir });
}

(function run() {
  const layout = createTempLayout();
  const storage = new SqliteRuntimeStorage({
    layout,
    migrationsDir: path.join(__dirname, 'migrations'),
  });

  storage.ensureStructure();
  assert.deepEqual(storage.readMetadataMap(), createExpectedRuntimeMetadata());
  assert.equal(
    inspectRuntimeMetadataCompatibility(storage.readMetadataMap()).state,
    STORAGE_COMPATIBILITY_STATES.READ_COMPATIBLE,
  );
  storage.close();

  assert.equal(
    inspectRuntimeMetadataCompatibility({}).state,
    STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE,
  );

  const mismatchStorage = new SqliteRuntimeStorage({
    layout,
    migrationsDir: path.join(__dirname, 'migrations'),
  });

  mismatchStorage.ensureStructure();
  mismatchStorage.database.prepare(
    'UPDATE runtime_metadata SET value = ? WHERE key = ?',
  ).run('0', 'schemaVersion');
  mismatchStorage.close();

  const restartedStorage = new SqliteRuntimeStorage({
    layout,
    migrationsDir: path.join(__dirname, 'migrations'),
  });

  assert.throws(
    () => restartedStorage.ensureStructure(),
    (error) => error && error.code === 'runtime_metadata_migration_needed' && error.details?.compatibilityState === 'migration-needed',
  );

  if (restartedStorage.database) {
    restartedStorage.close();
  }

  assert.throws(
    () => validateRuntimeMetadataMap({ schemaVersion: '999' }),
    (error) => error && error.code === 'runtime_metadata_unsupported_version' && error.details?.compatibilityState === 'unsupported-version',
  );
})();
