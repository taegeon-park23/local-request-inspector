const assert = require('node:assert/strict');
const { prepareAuthoredResourceImport } = require('./authored-resource-import-plan');
const { createImportedResourceName } = require('./authored-resource-bundle');

function createImportedRecord(kind, input, workspaceId, usedNames) {
  if (input.name === 'Broken resource') {
    return {
      rejection: {
        kind,
        name: input.name,
        reason: `${kind} validation failed.`,
      },
    };
  }

  const importedName = createImportedResourceName(input.name, usedNames);

  return {
    record: {
      id: `${kind}-${importedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      workspaceId,
      name: importedName,
    },
    renamed: importedName !== input.name,
  };
}

(function run() {
  const bundle = {
    requests: [
      { name: 'Health check' },
      { name: 'Broken resource' },
    ],
    mockRules: [
      { name: 'Latency guard' },
      { name: 'Latency guard' },
    ],
  };

  const plan = prepareAuthoredResourceImport({
    bundle,
    workspaceId: 'local-workspace',
    existingRequestNames: ['health check'],
    existingMockRuleNames: ['latency guard'],
    createImportedRequest: (input, workspaceId, usedNames) =>
      createImportedRecord('request', input, workspaceId, usedNames),
    createImportedMockRule: (input, workspaceId, usedNames) =>
      createImportedRecord('mock-rule', input, workspaceId, usedNames),
    sortAcceptedRequests: (records) => [...records].sort((left, right) => left.name.localeCompare(right.name)),
    sortAcceptedMockRules: (records) => [...records].sort((left, right) => left.name.localeCompare(right.name)),
  });

  assert.equal(plan.acceptedRequests.length, 1);
  assert.equal(plan.acceptedMockRules.length, 2);
  assert.equal(plan.rejected.length, 1);
  assert.deepEqual(plan.rejected[0], {
    kind: 'request',
    name: 'Broken resource',
    reason: 'request validation failed.',
  });
  assert.deepEqual(plan.acceptedRequests.map((record) => record.name), ['Health check (Imported)']);
  assert.deepEqual(plan.acceptedMockRules.map((record) => record.name), [
    'Latency guard (Imported 2)',
    'Latency guard (Imported)',
  ]);
  assert.deepEqual(plan.summary, {
    acceptedCount: 3,
    rejectedCount: 1,
    createdRequestCount: 1,
    createdMockRuleCount: 2,
    renamedCount: 3,
    importedNamesPreview: [
      'Health check (Imported)',
      'Latency guard (Imported 2)',
      'Latency guard (Imported)',
    ],
    rejectedReasonSummary: [
      {
        reason: 'request validation failed.',
        count: 1,
      },
    ],
    duplicateIdentityPolicy: 'new_identity',
  });
})();
