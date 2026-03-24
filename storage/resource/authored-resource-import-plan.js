function createImportResultSummary({
  acceptedCollections,
  acceptedRequestGroups,
  acceptedRequests,
  acceptedMockRules,
  acceptedScripts,
  rejected,
  renamedCount,
}) {
  const acceptedCount = acceptedCollections.length
    + acceptedRequestGroups.length
    + acceptedRequests.length
    + acceptedMockRules.length
    + acceptedScripts.length;
  const rejectedCount = rejected.length;
  const rejectedReasonCounts = new Map();

  for (const rejection of rejected) {
    const reason = typeof rejection?.reason === 'string' && rejection.reason.trim().length > 0
      ? rejection.reason.trim()
      : 'Import validation failed.';
    rejectedReasonCounts.set(reason, (rejectedReasonCounts.get(reason) || 0) + 1);
  }

  return {
    acceptedCount,
    rejectedCount,
    createdCollectionCount: acceptedCollections.length,
    createdRequestGroupCount: acceptedRequestGroups.length,
    createdRequestCount: acceptedRequests.length,
    createdMockRuleCount: acceptedMockRules.length,
    createdScriptCount: acceptedScripts.length,
    renamedCount,
    importedNamesPreview: [
      ...acceptedCollections,
      ...acceptedRequestGroups,
      ...acceptedRequests,
      ...acceptedMockRules,
      ...acceptedScripts,
    ]
      .map((resource) => resource.name)
      .filter((name) => typeof name === 'string' && name.trim().length > 0)
      .slice(0, 5),
    rejectedReasonSummary: [...rejectedReasonCounts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count;
        }

        return left.reason.localeCompare(right.reason);
      })
      .slice(0, 5),
    duplicateIdentityPolicy: 'new_identity',
  };
}

function normalizeNameSet(names) {
  return new Set(
    (Array.isArray(names) ? names : [])
      .map((name) => String(name || '').trim().toLowerCase())
      .filter(Boolean),
  );
}

function identitySort(items) {
  return [...items];
}

function prepareAuthoredResourceImport({
  bundle,
  workspaceId,
  existingCollectionNames = [],
  existingRequestGroupNames = [],
  existingRequestNames = [],
  existingMockRuleNames = [],
  existingScriptNames = [],
  createImportedCollection,
  createImportedRequestGroup,
  createImportedRequest,
  createImportedMockRule,
  createImportedScript,
  sortAcceptedCollections = identitySort,
  sortAcceptedRequestGroups = identitySort,
  sortAcceptedRequests = identitySort,
  sortAcceptedMockRules = identitySort,
  sortAcceptedScripts = identitySort,
}) {
  if (!bundle || typeof bundle !== 'object') {
    throw new TypeError('Bundle payload is required to prepare authored-resource import.');
  }

  if (
    typeof createImportedCollection !== 'function'
    || typeof createImportedRequestGroup !== 'function'
    || typeof createImportedRequest !== 'function'
    || typeof createImportedMockRule !== 'function'
    || typeof createImportedScript !== 'function'
  ) {
    throw new TypeError('Import preparation requires collection, request-group, request, mock-rule, and script import callbacks.');
  }

  const usedCollectionNames = normalizeNameSet(existingCollectionNames);
  const usedRequestGroupNames = normalizeNameSet(existingRequestGroupNames);
  const usedRequestNames = normalizeNameSet(existingRequestNames);
  const usedMockRuleNames = normalizeNameSet(existingMockRuleNames);
  const usedScriptNames = normalizeNameSet(existingScriptNames);
  const acceptedCollections = [];
  const acceptedRequestGroups = [];
  const acceptedRequests = [];
  const acceptedMockRules = [];
  const acceptedScripts = [];
  const rejected = [];
  let renamedCount = 0;

  for (const collectionResource of Array.isArray(bundle.collections) ? bundle.collections : []) {
    const importResult = createImportedCollection(collectionResource, workspaceId, usedCollectionNames);

    if (importResult?.rejection) {
      rejected.push(importResult.rejection);
      continue;
    }

    if (!importResult?.record) {
      throw new TypeError('Collection import callback must return a record or a rejection.');
    }

    acceptedCollections.push(importResult.record);
    if (importResult.renamed) {
      renamedCount += 1;
    }
  }

  for (const requestGroupResource of Array.isArray(bundle.requestGroups) ? bundle.requestGroups : []) {
    const importResult = createImportedRequestGroup(requestGroupResource, workspaceId, usedRequestGroupNames);

    if (importResult?.rejection) {
      rejected.push(importResult.rejection);
      continue;
    }

    if (!importResult?.record) {
      throw new TypeError('Request-group import callback must return a record or a rejection.');
    }

    acceptedRequestGroups.push(importResult.record);
    if (importResult.renamed) {
      renamedCount += 1;
    }
  }

  for (const scriptResource of Array.isArray(bundle.scripts) ? bundle.scripts : []) {
    const importResult = createImportedScript(scriptResource, workspaceId, usedScriptNames);

    if (importResult?.rejection) {
      rejected.push(importResult.rejection);
      continue;
    }

    if (!importResult?.record) {
      throw new TypeError('Script import callback must return a record or a rejection.');
    }

    acceptedScripts.push(importResult.record);
    if (importResult.renamed) {
      renamedCount += 1;
    }
  }

  for (const requestResource of Array.isArray(bundle.requests) ? bundle.requests : []) {
    const importResult = createImportedRequest(requestResource, workspaceId, usedRequestNames);

    if (importResult?.rejection) {
      rejected.push(importResult.rejection);
      continue;
    }

    if (!importResult?.record) {
      throw new TypeError('Request import callback must return a record or a rejection.');
    }

    acceptedRequests.push(importResult.record);
    if (importResult.renamed) {
      renamedCount += 1;
    }
  }

  for (const mockRuleResource of Array.isArray(bundle.mockRules) ? bundle.mockRules : []) {
    const importResult = createImportedMockRule(mockRuleResource, workspaceId, usedMockRuleNames);

    if (importResult?.rejection) {
      rejected.push(importResult.rejection);
      continue;
    }

    if (!importResult?.record) {
      throw new TypeError('Mock-rule import callback must return a record or a rejection.');
    }

    acceptedMockRules.push(importResult.record);
    if (importResult.renamed) {
      renamedCount += 1;
    }
  }

  const sortedAcceptedCollections = sortAcceptedCollections(acceptedCollections);
  const sortedAcceptedRequestGroups = sortAcceptedRequestGroups(acceptedRequestGroups);
  const sortedAcceptedRequests = sortAcceptedRequests(acceptedRequests);
  const sortedAcceptedMockRules = sortAcceptedMockRules(acceptedMockRules);
  const sortedAcceptedScripts = sortAcceptedScripts(acceptedScripts);

  return {
    acceptedCollections: sortedAcceptedCollections,
    acceptedRequestGroups: sortedAcceptedRequestGroups,
    acceptedRequests: sortedAcceptedRequests,
    acceptedMockRules: sortedAcceptedMockRules,
    acceptedScripts: sortedAcceptedScripts,
    rejected,
    summary: createImportResultSummary({
      acceptedCollections: sortedAcceptedCollections,
      acceptedRequestGroups: sortedAcceptedRequestGroups,
      acceptedRequests: sortedAcceptedRequests,
      acceptedMockRules: sortedAcceptedMockRules,
      acceptedScripts: sortedAcceptedScripts,
      rejected,
      renamedCount,
    }),
  };
}

module.exports = {
  createImportResultSummary,
  prepareAuthoredResourceImport,
};
