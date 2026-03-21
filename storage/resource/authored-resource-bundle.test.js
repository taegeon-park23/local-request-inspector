const assert = require('node:assert/strict');
const {
  AUTHORED_RESOURCE_BUNDLE_KIND,
  AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
  buildAuthoredResourceBundle,
  parseAuthoredResourceBundleText,
  createImportedResourceName,
} = require('./authored-resource-bundle');

(function run() {
  const bundle = buildAuthoredResourceBundle({
    workspaceId: 'local-workspace',
    exportedAt: '2026-03-21T00:00:00.000Z',
    requests: [{ id: 'request-1', name: 'Health check' }],
    mockRules: [{ id: 'mock-rule-1', name: 'Health mock' }],
  });

  assert.deepEqual(Object.keys(bundle).sort(), [
    'exportedAt',
    'mockRules',
    'requests',
    'resourceKind',
    'schemaVersion',
    'workspaceId',
  ]);
  assert.equal(bundle.resourceKind, AUTHORED_RESOURCE_BUNDLE_KIND);
  assert.equal(bundle.schemaVersion, AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION);
  assert.equal(bundle.requests.length, 1);
  assert.equal(bundle.mockRules.length, 1);
  assert.equal(bundle.executionHistories, undefined);
  assert.equal(bundle.capturedRequests, undefined);

  assert.throws(
    () => parseAuthoredResourceBundleText('not valid json'),
    (error) => error && error.code === 'resource_bundle_invalid_json',
  );

  assert.throws(
    () => parseAuthoredResourceBundleText(JSON.stringify({
      schemaVersion: 99,
      resourceKind: AUTHORED_RESOURCE_BUNDLE_KIND,
      workspaceId: 'local-workspace',
      requests: [],
      mockRules: [],
    })),
    (error) => error && error.code === 'resource_bundle_unsupported_schema',
  );

  const usedNames = new Set(['health check']);
  assert.equal(createImportedResourceName('New request', usedNames), 'New request');
  assert.equal(createImportedResourceName('Health check', usedNames), 'Health check (Imported)');
  assert.equal(createImportedResourceName('Health check', usedNames), 'Health check (Imported 2)');
})();
