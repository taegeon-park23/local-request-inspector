function identity(value) {
  return value;
}

function createWorkspaceScopedResourceRepository(options) {
  const {
    entityType,
    resourceStorage,
    normalizeRecord = identity,
    compareRecords = null,
  } = options;

  function normalizeMany(records) {
    const normalizedRecords = (Array.isArray(records) ? records : [])
      .map((record) => normalizeRecord(record))
      .filter(Boolean);

    if (typeof compareRecords === 'function') {
      return [...normalizedRecords].sort(compareRecords);
    }

    return normalizedRecords;
  }

  function listAll() {
    return normalizeMany(resourceStorage.list(entityType));
  }

  function listByWorkspace(workspaceId) {
    return listAll().filter((record) => record.workspaceId === workspaceId);
  }

  function read(entityId) {
    return normalizeRecord(resourceStorage.read(entityType, entityId));
  }

  function readByWorkspace(workspaceId, entityId) {
    const record = read(entityId);

    if (!record || record.workspaceId !== workspaceId) {
      return null;
    }

    return record;
  }

  function save(record) {
    const normalizedRecord = normalizeRecord(record);
    resourceStorage.save(entityType, normalizedRecord);
    return normalizedRecord;
  }

  function remove(entityId) {
    return resourceStorage.delete(entityType, entityId);
  }

  return {
    entityType,
    listAll,
    listByWorkspace,
    read,
    readByWorkspace,
    save,
    delete: remove,
  };
}

module.exports = {
  createWorkspaceScopedResourceRepository,
};
