const assert = require('node:assert/strict');
const { STORAGE_COMPATIBILITY_STATES } = require('./constants');
const {
  classifyExactValueCompatibility,
  classifySchemaVersion,
  createCompatibilityReport,
} = require('./compatibility');

(function run() {
  const supportedVersion = createCompatibilityReport([
    classifySchemaVersion({
      subject: 'Test schema',
      currentVersion: 1,
      supportedVersion: 1,
      missingCode: 'test_schema_missing',
      malformedCode: 'test_schema_malformed',
      migrationNeededCode: 'test_schema_migration_needed',
      unsupportedCode: 'test_schema_unsupported',
    }),
  ]);
  assert.equal(supportedVersion.state, STORAGE_COMPATIBILITY_STATES.READ_COMPATIBLE);

  const bootstrapRecoverable = createCompatibilityReport([
    classifySchemaVersion({
      subject: 'Test schema',
      currentVersion: null,
      supportedVersion: 1,
      missingCode: 'test_schema_missing',
      malformedCode: 'test_schema_malformed',
      migrationNeededCode: 'test_schema_migration_needed',
      unsupportedCode: 'test_schema_unsupported',
    }),
  ]);
  assert.equal(bootstrapRecoverable.state, STORAGE_COMPATIBILITY_STATES.BOOTSTRAP_RECOVERABLE);

  const migrationNeeded = createCompatibilityReport([
    classifySchemaVersion({
      subject: 'Test schema',
      currentVersion: 0,
      supportedVersion: 1,
      missingCode: 'test_schema_missing',
      malformedCode: 'test_schema_malformed',
      migrationNeededCode: 'test_schema_migration_needed',
      unsupportedCode: 'test_schema_unsupported',
    }),
  ]);
  assert.equal(migrationNeeded.state, STORAGE_COMPATIBILITY_STATES.MIGRATION_NEEDED);
  assert.equal(migrationNeeded.code, 'test_schema_migration_needed');

  const unsupportedVersion = createCompatibilityReport([
    classifySchemaVersion({
      subject: 'Test schema',
      currentVersion: 9,
      supportedVersion: 1,
      missingCode: 'test_schema_missing',
      malformedCode: 'test_schema_malformed',
      migrationNeededCode: 'test_schema_migration_needed',
      unsupportedCode: 'test_schema_unsupported',
    }),
  ]);
  assert.equal(unsupportedVersion.state, STORAGE_COMPATIBILITY_STATES.UNSUPPORTED_VERSION);
  assert.equal(unsupportedVersion.code, 'test_schema_unsupported');

  const malformedVersion = createCompatibilityReport([
    classifySchemaVersion({
      subject: 'Test schema',
      currentVersion: 'not-a-number',
      supportedVersion: 1,
      missingCode: 'test_schema_missing',
      malformedCode: 'test_schema_malformed',
      migrationNeededCode: 'test_schema_migration_needed',
      unsupportedCode: 'test_schema_unsupported',
    }),
  ]);
  assert.equal(malformedVersion.state, STORAGE_COMPATIBILITY_STATES.MALFORMED_DATA);
  assert.equal(malformedVersion.code, 'test_schema_malformed');

  const exactValueMismatch = createCompatibilityReport([
    classifyExactValueCompatibility({
      subject: 'Storage kind',
      currentValue: 'legacy-json',
      expectedValue: 'json-files',
      missingCode: 'storage_kind_missing',
      incompatibleCode: 'storage_kind_incompatible',
    }),
  ]);
  assert.equal(exactValueMismatch.state, STORAGE_COMPATIBILITY_STATES.UNSUPPORTED_VERSION);
  assert.equal(exactValueMismatch.code, 'storage_kind_incompatible');
})();
