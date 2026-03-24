function createEnvironmentScriptResourceService(dependencies) {
  const {
    repositories,
    enforceEnvironmentDefaults,
    normalizePersistedEnvironmentRecord,
    compareEnvironmentRecords,
    normalizePersistedSavedScriptRecord,
    compareSavedScriptRecords,
  } = dependencies;
  const environmentRepository = repositories.resources.environments;
  const scriptRepository = repositories.resources.scripts;

  function listWorkspaceEnvironmentRecords(workspaceId) {
    return environmentRepository
      .listByWorkspace(workspaceId)
      .map((record) => normalizePersistedEnvironmentRecord(record))
      .filter(Boolean)
      .sort(compareEnvironmentRecords);
  }

  function listWorkspaceSavedScriptRecords(workspaceId) {
    return scriptRepository
      .listByWorkspace(workspaceId)
      .map((record) => normalizePersistedSavedScriptRecord(record))
      .filter(Boolean)
      .sort(compareSavedScriptRecords);
  }

  function persistWorkspaceEnvironmentRecords(records) {
    for (const record of Array.isArray(records) ? records : []) {
      environmentRepository.save(normalizePersistedEnvironmentRecord(record));
    }
  }

  function upsertWorkspaceEnvironmentRecord(workspaceId, candidateRecord, preferredDefaultId) {
    const reconciledRecords = enforceEnvironmentDefaults(
      [...listWorkspaceEnvironmentRecords(workspaceId).filter((record) => record.id !== candidateRecord.id), candidateRecord],
      preferredDefaultId,
    );
    persistWorkspaceEnvironmentRecords(reconciledRecords);
    return reconciledRecords.find((record) => record.id === candidateRecord.id) ?? null;
  }

  function reconcileWorkspaceEnvironmentDefaults(workspaceId) {
    const reconciledRecords = enforceEnvironmentDefaults(listWorkspaceEnvironmentRecords(workspaceId));
    persistWorkspaceEnvironmentRecords(reconciledRecords);
    return reconciledRecords;
  }

  function readWorkspaceEnvironmentReference(workspaceId, environmentId) {
    if (typeof environmentId !== 'string' || environmentId.trim().length === 0) {
      return null;
    }

    return normalizePersistedEnvironmentRecord(
      environmentRepository.readByWorkspace(workspaceId, environmentId.trim()),
    );
  }

  return {
    listWorkspaceEnvironmentRecords,
    listWorkspaceSavedScriptRecords,
    upsertWorkspaceEnvironmentRecord,
    reconcileWorkspaceEnvironmentDefaults,
    readWorkspaceEnvironmentReference,
  };
}

module.exports = {
  createEnvironmentScriptResourceService,
};
