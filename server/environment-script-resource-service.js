function createEnvironmentScriptResourceService(dependencies) {
  const {
    repositories,
    countLegacySecretRows,
    enforceEnvironmentDefaults,
    normalizePersistedEnvironmentRecord,
    compareEnvironmentRecords,
    normalizePersistedSavedScriptRecord,
    compareSavedScriptRecords,
  } = dependencies;
  const environmentRepository = repositories.resources.environments;
  const scriptRepository = repositories.resources.scripts;

  function normalizeAndPersistEnvironmentRecord(record) {
    const legacySecretRowCount = countLegacySecretRows(record?.variables);
    const normalizedRecord = normalizePersistedEnvironmentRecord(record);

    if (!normalizedRecord || typeof normalizedRecord !== 'object') {
      return normalizedRecord;
    }

    if (legacySecretRowCount > 0) {
      environmentRepository.save(normalizePersistedEnvironmentRecord(record));
    }

    return {
      ...normalizedRecord,
      legacySecretRowCount,
    };
  }

  function listWorkspaceEnvironmentRecords(workspaceId) {
    return environmentRepository
      .listByWorkspace(workspaceId)
      .map((record) => normalizeAndPersistEnvironmentRecord(record))
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

    return normalizeAndPersistEnvironmentRecord(
      environmentRepository.readByWorkspace(workspaceId, environmentId.trim()),
    );
  }

  function readEnvironmentRecord(environmentId) {
    if (typeof environmentId !== 'string' || environmentId.trim().length === 0) {
      return null;
    }

    return normalizeAndPersistEnvironmentRecord(environmentRepository.read(environmentId.trim()));
  }

  function collectEnvironmentSecretDiagnostics() {
    const environmentRecords = environmentRepository.listAll();
    let sanitizedLegacyEnvironmentCount = 0;
    let sanitizedLegacySecretRowCount = 0;

    for (const record of environmentRecords) {
      const legacySecretRowCount = countLegacySecretRows(record?.variables);

      if (legacySecretRowCount === 0) {
        continue;
      }

      sanitizedLegacyEnvironmentCount += 1;
      sanitizedLegacySecretRowCount += legacySecretRowCount;
      environmentRepository.save(normalizePersistedEnvironmentRecord(record));
    }

    return {
      environmentCount: environmentRecords.length,
      sanitizedLegacyEnvironmentCount,
      sanitizedLegacySecretRowCount,
    };
  }

  return {
    listWorkspaceEnvironmentRecords,
    listWorkspaceSavedScriptRecords,
    upsertWorkspaceEnvironmentRecord,
    reconcileWorkspaceEnvironmentDefaults,
    readWorkspaceEnvironmentReference,
    readEnvironmentRecord,
    collectEnvironmentSecretDiagnostics,
  };
}

module.exports = {
  createEnvironmentScriptResourceService,
};
