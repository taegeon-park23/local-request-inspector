function createMockRuleResourceService(dependencies) {
  const {
    repositories,
    resourceRecordKinds,
    mockRuleResourceSchemaVersion,
  } = dependencies;
  const mockRuleRepository = repositories.resources.mockRules;

  function normalizePersistedMockRuleRecord(record) {
    if (!record || typeof record !== 'object') {
      return record;
    }

    return {
      ...record,
      resourceKind: resourceRecordKinds.MOCK_RULE,
      resourceSchemaVersion: mockRuleResourceSchemaVersion,
    };
  }

  function compareIsoDescending(left, right) {
    return String(right || '').localeCompare(String(left || ''));
  }

  function compareMockRuleRecords(left, right) {
    if (Boolean(left.enabled) !== Boolean(right.enabled)) {
      return left.enabled ? -1 : 1;
    }

    if ((right.priority || 0) !== (left.priority || 0)) {
      return (right.priority || 0) - (left.priority || 0);
    }

    const updatedAtDiff = compareIsoDescending(left.updatedAt, right.updatedAt);
    if (updatedAtDiff !== 0) {
      return updatedAtDiff;
    }

    const createdAtDiff = compareIsoDescending(left.createdAt, right.createdAt);
    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    const nameDiff = String(left.name || '').localeCompare(String(right.name || ''));
    if (nameDiff !== 0) {
      return nameDiff;
    }

    return String(left.id || '').localeCompare(String(right.id || ''));
  }

  function listWorkspaceMockRuleRecords(workspaceId) {
    return mockRuleRepository
      .listByWorkspace(workspaceId)
      .map((record) => normalizePersistedMockRuleRecord(record))
      .filter(Boolean)
      .sort(compareMockRuleRecords);
  }

  return {
    normalizePersistedMockRuleRecord,
    compareMockRuleRecords,
    listWorkspaceMockRuleRecords,
  };
}

module.exports = {
  createMockRuleResourceService,
};
