const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildStorageLayout } = require('../shared/data-root');
const {
  SqliteRuntimeStorage,
  createExpectedRuntimeMetadata,
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
  storage.close();

  assert.throws(
    () => validateRuntimeMetadataMap({ schemaVersion: '999' }),
    (error) => error && error.code === 'runtime_storage_metadata_mismatch',
  );

  const mismatchStorage = new SqliteRuntimeStorage({
    layout,
    migrationsDir: path.join(__dirname, 'migrations'),
  });

  mismatchStorage.ensureStructure();
  mismatchStorage.database.prepare(
    'UPDATE runtime_metadata SET value = ? WHERE key = ?',
  ).run('999', 'schemaVersion');
  mismatchStorage.close();

  const restartedStorage = new SqliteRuntimeStorage({
    layout,
    migrationsDir: path.join(__dirname, 'migrations'),
  });

  assert.throws(
    () => restartedStorage.ensureStructure(),
    (error) => error && error.code === 'runtime_storage_metadata_mismatch',
  );

  if (restartedStorage.database) {
    restartedStorage.close();
  }
})();
