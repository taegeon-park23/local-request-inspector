const assert = require('node:assert/strict');
const {
  AUTHORED_RESOURCE_BUNDLE_KIND,
  AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
  buildAuthoredResourceBundle,
  inspectAuthoredResourceBundleCompatibility,
  parseAuthoredResourceBundleText,
  createImportedResourceName,
} = require('./authored-resource-bundle');

(function run() {
  const bundle = buildAuthoredResourceBundle({
    workspaceId: 'local-workspace',
    exportedAt: '2026-03-21T00:00:00.000Z',
    collections: [{ id: 'collection-1', name: 'Saved Requests' }],
    requestGroups: [{ id: 'request-group-1', collectionId: 'collection-1', name: 'General' }],
    requests: [{ id: 'request-1', name: 'Health check' }],
    mockRules: [{ id: 'mock-rule-1', name: 'Health mock' }],
  });

  assert.deepEqual(Object.keys(bundle).sort(), [
    'collections',
    'exportedAt',
    'mockRules',
    'requestGroups',
    'requests',
    'resourceKind',
    'schemaVersion',
    'workspaceId',
  ]);
  assert.equal(bundle.resourceKind, AUTHORED_RESOURCE_BUNDLE_KIND);
  assert.equal(bundle.schemaVersion, AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION);
  assert.equal(bundle.collections.length, 1);
  assert.equal(bundle.requestGroups.length, 1);
  assert.equal(bundle.requests.length, 1);
  assert.equal(bundle.mockRules.length, 1);
  assert.equal(bundle.executionHistories, undefined);
  assert.equal(bundle.capturedRequests, undefined);

  const singleRequestBundle = buildAuthoredResourceBundle({
    workspaceId: 'local-workspace',
    exportedAt: '2026-03-21T00:00:00.000Z',
    collections: [],
    requestGroups: [],
    requests: [{ id: 'request-only-1', name: 'Single request export' }],
    mockRules: [],
  });
  assert.equal(singleRequestBundle.collections.length, 0);
  assert.equal(singleRequestBundle.requestGroups.length, 0);
  assert.equal(singleRequestBundle.requests.length, 1);
  assert.equal(singleRequestBundle.mockRules.length, 0);
  assert.equal(singleRequestBundle.executionHistories, undefined);
  assert.equal(singleRequestBundle.capturedRequests, undefined);

  const singleMockRuleBundle = buildAuthoredResourceBundle({
    workspaceId: 'local-workspace',
    exportedAt: '2026-03-21T00:00:00.000Z',
    collections: [],
    requestGroups: [],
    requests: [],
    mockRules: [{ id: 'mock-rule-only-1', name: 'Single mock export' }],
  });
  assert.equal(singleMockRuleBundle.collections.length, 0);
  assert.equal(singleMockRuleBundle.requestGroups.length, 0);
  assert.equal(singleMockRuleBundle.requests.length, 0);
  assert.equal(singleMockRuleBundle.mockRules.length, 1);
  assert.equal(singleMockRuleBundle.executionHistories, undefined);
  assert.equal(singleMockRuleBundle.capturedRequests, undefined);

  assert.throws(
    () => parseAuthoredResourceBundleText('not valid json'),
    (error) => error && error.code === 'resource_bundle_invalid_json',
  );

  assert.throws(
    () => parseAuthoredResourceBundleText(JSON.stringify({
      schemaVersion: 9,
      resourceKind: AUTHORED_RESOURCE_BUNDLE_KIND,
      workspaceId: 'local-workspace',
      collections: [],
      requestGroups: [],
      requests: [],
      mockRules: [],
    })),
    (error) => error && error.code === 'resource_bundle_unsupported_schema' && error.details?.compatibilityState === 'unsupported-version',
  );

  assert.throws(
    () => parseAuthoredResourceBundleText(JSON.stringify({
      schemaVersion: 0,
      resourceKind: AUTHORED_RESOURCE_BUNDLE_KIND,
      workspaceId: 'local-workspace',
      exportedAt: '2026-03-21T00:00:00.000Z',
      collections: [],
      requestGroups: [],
      requests: [],
      mockRules: [],
    })),
    (error) => error && error.code === 'resource_bundle_unsupported_schema' && error.details?.compatibilityState === 'migration-needed',
  );

  assert.throws(
    () => parseAuthoredResourceBundleText(JSON.stringify({
      schemaVersion: AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
      resourceKind: AUTHORED_RESOURCE_BUNDLE_KIND,
      workspaceId: '',
      exportedAt: '',
      collections: [],
      requestGroups: [],
      requests: [],
      mockRules: [],
    })),
    (error) => error && error.code === 'resource_bundle_invalid_exported_at',
  );

  assert.throws(
    () => parseAuthoredResourceBundleText(JSON.stringify({
      schemaVersion: AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
      resourceKind: AUTHORED_RESOURCE_BUNDLE_KIND,
      workspaceId: 'local-workspace',
      exportedAt: '2026-03-21T00:00:00.000Z',
      collections: [],
      requestGroups: [],
      requests: [
        {
          id: 'request-1',
          name: 'Health check',
          resourceKind: 'mock-rule',
        },
      ],
      mockRules: [],
    })),
    (error) => error && error.code === 'resource_bundle_unsupported_resource_kind',
  );

  assert.throws(
    () => parseAuthoredResourceBundleText(JSON.stringify({
      schemaVersion: AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
      resourceKind: AUTHORED_RESOURCE_BUNDLE_KIND,
      workspaceId: 'local-workspace',
      exportedAt: '2026-03-21T00:00:00.000Z',
      collections: [],
      requestGroups: [],
      requests: [],
      mockRules: [
        {
          id: 'mock-rule-1',
          name: 'Health mock',
          resourceKind: 'mock-rule',
          resourceSchemaVersion: 99,
        },
      ],
    })),
    (error) => error && error.code === 'resource_bundle_unsupported_resource_schema',
  );

  const compatibility = inspectAuthoredResourceBundleCompatibility({
    schemaVersion: AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION,
    resourceKind: AUTHORED_RESOURCE_BUNDLE_KIND,
    workspaceId: 'local-workspace',
    exportedAt: '2026-03-21T00:00:00.000Z',
    collections: [],
    requestGroups: [],
    requests: [],
    mockRules: [],
  });
  assert.equal(compatibility.state, 'read-compatible');

  const usedNames = new Set(['health check']);
  assert.equal(createImportedResourceName('New request', usedNames), 'New request');
  assert.equal(createImportedResourceName('Health check', usedNames), 'Health check (Imported)');
  assert.equal(createImportedResourceName('Health check', usedNames), 'Health check (Imported 2)');
})();
