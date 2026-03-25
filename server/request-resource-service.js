function createRequestResourceService(dependencies) {
  const {
    randomUUID,
    resourceStorage,
    defaultWorkspaceId,
    normalizeRequestScriptsState,
    serializeRequestScriptsForBundle,
    listLinkedRequestScriptStages,
    compareSavedScriptRecords,
    compareSavedRequestRecords,
    listWorkspaceSavedScriptRecords,
    createCollectionRecord,
    normalizePersistedCollectionRecord,
    createRequestGroupRecord,
    normalizePersistedRequestGroupRecord,
    compareRequestPlacementRecords,
    createStableCollectionId,
    createStableRequestGroupId,
    defaultRequestCollectionName,
    defaultRequestGroupName,
    requestResourceKind,
    requestResourceSchemaVersion,
  } = dependencies;

  function cloneRows(rows = []) {
    return rows.map((row) => ({
      id: row.id || randomUUID(),
      key: typeof row.key === 'string' ? row.key : '',
      value: typeof row.value === 'string' ? row.value : '',
      enabled: row.enabled !== false,
    }));
  }

  function cloneAuth(auth = {}) {
    return {
      type: auth.type || 'none',
      bearerToken: auth.bearerToken || '',
      basicUsername: auth.basicUsername || '',
      basicPassword: auth.basicPassword || '',
      apiKeyName: auth.apiKeyName || '',
      apiKeyValue: auth.apiKeyValue || '',
      apiKeyPlacement: auth.apiKeyPlacement || 'header',
    };
  }

  function cloneScripts(scripts = {}) {
    return normalizeRequestScriptsState(scripts);
  }

  function createRequestSummary(method, url) {
    return typeof url === 'string' && url.trim().length > 0 ? `${method} ${url}` : `${method} request definition`;
  }

  function validateRequestDefinition(input) {
    if (!input || typeof input !== 'object') {
      return 'Request payload is required.';
    }

    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      return 'Request name is required.';
    }

    if (typeof input.method !== 'string' || input.method.trim().length === 0) {
      return 'Request method is required.';
    }

    if (typeof input.url !== 'string' || input.url.trim().length === 0) {
      return 'Request URL is required.';
    }

    if (
      input.selectedEnvironmentId != null
      && typeof input.selectedEnvironmentId !== 'string'
    ) {
      return 'Selected environment id must be a string or null.';
    }

    return null;
  }

  function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function createRequestPlacementError(code, message, details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
  }

  function readWorkspaceCollectionReference(workspaceId, collectionId) {
    const normalizedCollectionId = normalizeText(collectionId);

    if (!normalizedCollectionId) {
      return null;
    }

    const collection = normalizePersistedCollectionRecord(
      resourceStorage.read('collection', normalizedCollectionId),
    );

    if (!collection || collection.workspaceId !== workspaceId) {
      return null;
    }

    return collection;
  }

  function persistCollectionRecord(record) {
    const normalizedRecord = normalizePersistedCollectionRecord(record);
    resourceStorage.save('collection', normalizedRecord);
    return normalizedRecord;
  }

  function persistRequestGroupRecord(record) {
    const normalizedRecord = normalizePersistedRequestGroupRecord(record);
    resourceStorage.save('request-group', normalizedRecord);
    return normalizedRecord;
  }

  function findCollectionByName(records, collectionName) {
    const normalizedCollectionName = normalizeText(collectionName).toLowerCase();

    if (!normalizedCollectionName) {
      return null;
    }

    return records.find((record) => String(record.name || '').trim().toLowerCase() === normalizedCollectionName) ?? null;
  }

  function readRequestGroupParentId(value) {
    return normalizeText(value) || null;
  }

  function findRequestGroupByName(records, collectionId, requestGroupName, parentRequestGroupId = null) {
    const normalizedCollectionId = normalizeText(collectionId);
    const normalizedRequestGroupName = normalizeText(requestGroupName).toLowerCase();
    const normalizedParentRequestGroupId = readRequestGroupParentId(parentRequestGroupId);

    if (!normalizedCollectionId || !normalizedRequestGroupName) {
      return null;
    }

    return records.find((record) => (
      record.collectionId === normalizedCollectionId
      && readRequestGroupParentId(record.parentRequestGroupId) === normalizedParentRequestGroupId
      && String(record.name || '').trim().toLowerCase() === normalizedRequestGroupName
    )) ?? null;
  }

  function compareRequestGroupRecords(left, right) {
    const collectionDiff = String(left.collectionId || '').localeCompare(String(right.collectionId || ''));
    if (collectionDiff !== 0) {
      return collectionDiff;
    }

    const parentDiff = String(left.parentRequestGroupId || '').localeCompare(String(right.parentRequestGroupId || ''));
    if (parentDiff !== 0) {
      return parentDiff;
    }

    return compareRequestPlacementRecords(left, right);
  }

  function sortRequestGroups(recordsOrLeft, maybeRight) {
    if (Array.isArray(recordsOrLeft)) {
      return [...recordsOrLeft].sort(compareRequestGroupRecords);
    }

    return compareRequestGroupRecords(recordsOrLeft, maybeRight);
  }

  function ensureWorkspaceDefaultRequestPlacement(workspaceId, collections, requestGroups) {
    const normalizedWorkspaceId = normalizeText(workspaceId) || defaultWorkspaceId;
    let nextCollections = [...collections];
    let nextRequestGroups = [...requestGroups];

    let defaultCollection = findCollectionByName(nextCollections, defaultRequestCollectionName);
    if (!defaultCollection) {
      defaultCollection = persistCollectionRecord(
        createCollectionRecord({
          id: createStableCollectionId(normalizedWorkspaceId, defaultRequestCollectionName),
          name: defaultRequestCollectionName,
        }, null, normalizedWorkspaceId),
      );
      nextCollections = [...nextCollections, defaultCollection].sort(compareRequestPlacementRecords);
    }

    let defaultRequestGroup = findRequestGroupByName(nextRequestGroups, defaultCollection.id, defaultRequestGroupName, null);
    if (!defaultRequestGroup) {
      defaultRequestGroup = persistRequestGroupRecord(
        createRequestGroupRecord({
          id: createStableRequestGroupId(normalizedWorkspaceId, defaultCollection.id, defaultRequestGroupName, null),
          collectionId: defaultCollection.id,
          parentRequestGroupId: null,
          name: defaultRequestGroupName,
        }, null, normalizedWorkspaceId),
      );
      nextRequestGroups = sortRequestGroups([...nextRequestGroups, defaultRequestGroup]);
    }

    return {
      collections: nextCollections,
      requestGroups: nextRequestGroups,
      defaultCollection,
      defaultRequestGroup,
    };
  }

  function ensureCollectionRecord({
    workspaceId,
    collections,
    collectionId,
    collectionName,
  }) {
    const normalizedCollectionId = normalizeText(collectionId);
    const normalizedCollectionName = normalizeText(collectionName) || defaultRequestCollectionName;
    let nextCollections = [...collections];

    if (normalizedCollectionId) {
      const collectionById = nextCollections.find((record) => record.id === normalizedCollectionId) ?? null;
      if (!collectionById) {
        throw createRequestPlacementError(
          'request_collection_not_found',
          'Selected collection was not found in this workspace.',
          {
            workspaceId,
            collectionId: normalizedCollectionId,
          },
        );
      }

      return {
        collections: nextCollections,
        collectionRecord: collectionById,
      };
    }

    const collectionByName = findCollectionByName(nextCollections, normalizedCollectionName);
    if (collectionByName) {
      return {
        collections: nextCollections,
        collectionRecord: collectionByName,
      };
    }

    const createdCollection = persistCollectionRecord(
      createCollectionRecord({
        id: createStableCollectionId(workspaceId, normalizedCollectionName),
        name: normalizedCollectionName,
      }, null, workspaceId),
    );
    nextCollections = [...nextCollections, createdCollection].sort(compareRequestPlacementRecords);

    return {
      collections: nextCollections,
      collectionRecord: createdCollection,
    };
  }

  function ensureRequestGroupRecord({
    workspaceId,
    requestGroups,
    collectionRecord,
    requestGroupId,
    requestGroupName,
    parentRequestGroupId = null,
  }) {
    const normalizedRequestGroupId = normalizeText(requestGroupId);
    const normalizedRequestGroupName = normalizeText(requestGroupName) || defaultRequestGroupName;
    const normalizedParentRequestGroupId = readRequestGroupParentId(parentRequestGroupId);
    let nextRequestGroups = [...requestGroups];

    if (normalizedRequestGroupId) {
      const requestGroupById = nextRequestGroups.find((record) => record.id === normalizedRequestGroupId) ?? null;
      if (!requestGroupById) {
        throw createRequestPlacementError(
          'request_group_not_found',
          'Selected request group was not found in this workspace.',
          {
            workspaceId,
            requestGroupId: normalizedRequestGroupId,
          },
        );
      }

      if (requestGroupById.collectionId !== collectionRecord.id) {
        throw createRequestPlacementError(
          'request_group_collection_mismatch',
          'Selected request group does not belong to the selected collection.',
          {
            workspaceId,
            requestGroupId: normalizedRequestGroupId,
            collectionId: collectionRecord.id,
          },
        );
      }

      return {
        requestGroups: nextRequestGroups,
        requestGroupRecord: requestGroupById,
      };
    }

    if (normalizedParentRequestGroupId) {
      const parentRequestGroupRecord = nextRequestGroups.find((record) => record.id === normalizedParentRequestGroupId) ?? null;

      if (!parentRequestGroupRecord) {
        throw createRequestPlacementError(
          'request_group_parent_not_found',
          'Selected parent request group was not found in this workspace.',
          {
            workspaceId,
            parentRequestGroupId: normalizedParentRequestGroupId,
          },
        );
      }

      if (parentRequestGroupRecord.collectionId !== collectionRecord.id) {
        throw createRequestPlacementError(
          'request_group_parent_collection_mismatch',
          'Selected parent request group does not belong to the selected collection.',
          {
            workspaceId,
            parentRequestGroupId: normalizedParentRequestGroupId,
            collectionId: collectionRecord.id,
          },
        );
      }
    }

    const requestGroupByName = findRequestGroupByName(
      nextRequestGroups,
      collectionRecord.id,
      normalizedRequestGroupName,
      normalizedParentRequestGroupId,
    );
    if (requestGroupByName) {
      return {
        requestGroups: nextRequestGroups,
        requestGroupRecord: requestGroupByName,
      };
    }

    const createdRequestGroup = persistRequestGroupRecord(
      createRequestGroupRecord({
        id: createStableRequestGroupId(workspaceId, collectionRecord.id, normalizedRequestGroupName, normalizedParentRequestGroupId),
        collectionId: collectionRecord.id,
        parentRequestGroupId: normalizedParentRequestGroupId,
        name: normalizedRequestGroupName,
      }, null, workspaceId),
    );
    nextRequestGroups = sortRequestGroups([...nextRequestGroups, createdRequestGroup]);

    return {
      requestGroups: nextRequestGroups,
      requestGroupRecord: createdRequestGroup,
    };
  }

  function listWorkspaceCollectionRecords(workspaceId) {
    const collections = resourceStorage
      .list('collection')
      .map((record) => normalizePersistedCollectionRecord(record))
      .filter((record) => record.workspaceId === workspaceId)
      .sort(compareRequestPlacementRecords);
    const requestGroups = resourceStorage
      .list('request-group')
      .map((record) => {
        const normalizedRecord = normalizePersistedRequestGroupRecord(record);
        if (JSON.stringify(normalizedRecord) !== JSON.stringify(record)) {
          resourceStorage.save('request-group', normalizedRecord);
        }
        return normalizedRecord;
      })
      .filter((record) => record.workspaceId === workspaceId)
      .sort(sortRequestGroups);

    return ensureWorkspaceDefaultRequestPlacement(workspaceId, collections, requestGroups).collections;
  }

  function listWorkspaceRequestGroupRecords(workspaceId) {
    const collections = resourceStorage
      .list('collection')
      .map((record) => normalizePersistedCollectionRecord(record))
      .filter((record) => record.workspaceId === workspaceId)
      .sort(compareRequestPlacementRecords);
    const requestGroups = resourceStorage
      .list('request-group')
      .map((record) => {
        const normalizedRecord = normalizePersistedRequestGroupRecord(record);
        if (JSON.stringify(normalizedRecord) !== JSON.stringify(record)) {
          resourceStorage.save('request-group', normalizedRecord);
        }
        return normalizedRecord;
      })
      .filter((record) => record.workspaceId === workspaceId)
      .sort(sortRequestGroups);

    return ensureWorkspaceDefaultRequestPlacement(workspaceId, collections, requestGroups).requestGroups;
  }

  function resolveRequestPlacementReferences(workspaceId, input, existingRecord, state = {}) {
    let collections = state.collections ?? listWorkspaceCollectionRecords(workspaceId);
    let requestGroups = state.requestGroups ?? listWorkspaceRequestGroupRecords(workspaceId);
    const defaults = ensureWorkspaceDefaultRequestPlacement(workspaceId, collections, requestGroups);
    collections = defaults.collections;
    requestGroups = defaults.requestGroups;

    const explicitCollectionId = normalizeText(input?.collectionId || existingRecord?.collectionId);
    const explicitRequestGroupId = normalizeText(input?.requestGroupId || existingRecord?.requestGroupId);

    if (explicitRequestGroupId) {
      const requestGroupRecord = requestGroups.find((record) => record.id === explicitRequestGroupId) ?? null;

      if (!requestGroupRecord) {
        throw createRequestPlacementError(
          'request_group_not_found',
          'Selected request group was not found in this workspace.',
          {
            workspaceId,
            requestGroupId: explicitRequestGroupId,
          },
        );
      }

      if (explicitCollectionId && requestGroupRecord.collectionId !== explicitCollectionId) {
        throw createRequestPlacementError(
          'request_group_collection_mismatch',
          'Selected request group does not belong to the selected collection.',
          {
            workspaceId,
            requestGroupId: explicitRequestGroupId,
            collectionId: explicitCollectionId,
          },
        );
      }

      const collectionRecord = collections.find((record) => record.id === requestGroupRecord.collectionId) ?? null;

      if (!collectionRecord) {
        throw createRequestPlacementError(
          'request_collection_not_found',
          'Selected collection was not found in this workspace.',
          {
            workspaceId,
            collectionId: requestGroupRecord.collectionId,
          },
        );
      }

      return {
        collections,
        requestGroups,
        defaultCollection: defaults.defaultCollection,
        defaultRequestGroup: defaults.defaultRequestGroup,
        collectionRecord,
        requestGroupRecord,
      };
    }

    const collectionResolution = ensureCollectionRecord({
      workspaceId,
      collections,
      collectionId: explicitCollectionId,
      collectionName: normalizeText(input?.collectionName || existingRecord?.collectionName) || defaults.defaultCollection.name,
    });
    collections = collectionResolution.collections;

    const requestGroupResolution = ensureRequestGroupRecord({
      workspaceId,
      requestGroups,
      collectionRecord: collectionResolution.collectionRecord,
      requestGroupId: null,
      parentRequestGroupId: null,
      requestGroupName:
        normalizeText(input?.requestGroupName || input?.folderName || existingRecord?.requestGroupName || existingRecord?.folderName)
        || defaults.defaultRequestGroup.name,
    });
    requestGroups = requestGroupResolution.requestGroups;

    return {
      collections,
      requestGroups,
      defaultCollection: defaults.defaultCollection,
      defaultRequestGroup: defaults.defaultRequestGroup,
      collectionRecord: collectionResolution.collectionRecord,
      requestGroupRecord: requestGroupResolution.requestGroupRecord,
    };
  }

  function normalizeSavedRequest(input, existingRecord, workspaceId) {
    const now = new Date().toISOString();
    const recordId = input.id || existingRecord?.id || randomUUID();
    const selectedEnvironmentId = typeof input.selectedEnvironmentId === 'string' && input.selectedEnvironmentId.trim().length > 0
      ? input.selectedEnvironmentId.trim()
      : null;
    const {
      collectionRecord,
      requestGroupRecord,
    } = resolveRequestPlacementReferences(workspaceId, input, existingRecord);

    return {
      resourceKind: requestResourceKind,
      resourceSchemaVersion: requestResourceSchemaVersion,
      id: recordId,
      workspaceId,
      name: input.name.trim(),
      method: input.method,
      url: input.url,
      selectedEnvironmentId,
      params: cloneRows(input.params),
      headers: cloneRows(input.headers),
      bodyMode: input.bodyMode || 'none',
      bodyText: input.bodyText || '',
      formBody: cloneRows(input.formBody),
      multipartBody: cloneRows(input.multipartBody),
      auth: cloneAuth(input.auth),
      scripts: cloneScripts(input.scripts),
      collectionId: collectionRecord.id,
      requestGroupId: requestGroupRecord.id,
      collectionName: collectionRecord.name,
      requestGroupName: requestGroupRecord.name,
      summary: createRequestSummary(input.method, input.url),
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
    };
  }

  function normalizePersistedRequestRecord(record) {
    if (!record || typeof record !== 'object') {
      return record;
    }

    return {
      ...record,
      resourceKind: requestResourceKind,
      resourceSchemaVersion: requestResourceSchemaVersion,
      selectedEnvironmentId: typeof record.selectedEnvironmentId === 'string' && record.selectedEnvironmentId.trim().length > 0
        ? record.selectedEnvironmentId.trim()
        : null,
      scripts: cloneScripts(record.scripts),
      collectionId: normalizeText(record.collectionId),
      requestGroupId: normalizeText(record.requestGroupId),
      collectionName: normalizeText(record.collectionName) || defaultRequestCollectionName,
      requestGroupName: normalizeText(record.requestGroupName || record.folderName) || defaultRequestGroupName,
      summary: record.summary || createRequestSummary(record.method, record.url),
    };
  }

  function serializeRequestRecordForBundle(record) {
    return {
      ...record,
      scripts: serializeRequestScriptsForBundle(record.scripts),
    };
  }

  function collectRequestBundleSavedScripts(requestRecord, workspaceId) {
    const linkedStages = listLinkedRequestScriptStages(requestRecord?.scripts);

    if (linkedStages.length === 0) {
      return [];
    }

    const workspaceScriptsById = new Map(
      listWorkspaceSavedScriptRecords(workspaceId).map((record) => [record.id, record]),
    );
    const referencedScripts = [];
    const seenScriptIds = new Set();

    for (const linkedStage of linkedStages) {
      const savedScript = workspaceScriptsById.get(linkedStage.savedScriptId);

      if (!savedScript || seenScriptIds.has(savedScript.id)) {
        continue;
      }

      seenScriptIds.add(savedScript.id);
      referencedScripts.push(savedScript);
    }

    return referencedScripts.sort(compareSavedScriptRecords);
  }

  function listWorkspaceSavedRequestRecords(workspaceId) {
    return reconcileWorkspaceRequestPlacementState(workspaceId).requests;
  }

  function stripLegacyRequestPlacementFields(record) {
    if (!record || typeof record !== 'object') {
      return record;
    }

    const nextRecord = { ...record };
    delete nextRecord.folderName;
    return nextRecord;
  }

  function reconcileWorkspaceRequestPlacementState(workspaceId) {
    let collections = resourceStorage
      .list('collection')
      .map((record) => normalizePersistedCollectionRecord(record))
      .filter((record) => record.workspaceId === workspaceId)
      .sort(compareRequestPlacementRecords);
    let requestGroups = resourceStorage
      .list('request-group')
      .map((record) => {
        const normalizedRecord = normalizePersistedRequestGroupRecord(record);
        if (JSON.stringify(normalizedRecord) !== JSON.stringify(record)) {
          resourceStorage.save('request-group', normalizedRecord);
        }
        return normalizedRecord;
      })
      .filter((record) => record.workspaceId === workspaceId)
      .sort(sortRequestGroups);
    const requestRecords = resourceStorage
      .list('request')
      .map((record) => normalizePersistedRequestRecord(record))
      .filter((record) => record.workspaceId === workspaceId);

    const defaults = ensureWorkspaceDefaultRequestPlacement(workspaceId, collections, requestGroups);
    collections = defaults.collections;
    requestGroups = defaults.requestGroups;

    const requests = requestRecords
      .map((record) => {
        const resolution = resolveRequestPlacementReferences(workspaceId, record, record, {
          collections,
          requestGroups,
        });
        collections = resolution.collections;
        requestGroups = resolution.requestGroups;

        const reconciledRecord = stripLegacyRequestPlacementFields(normalizePersistedRequestRecord({
          ...record,
          collectionId: resolution.collectionRecord.id,
          requestGroupId: resolution.requestGroupRecord.id,
          collectionName: resolution.collectionRecord.name,
          requestGroupName: resolution.requestGroupRecord.name,
          summary: record.summary || createRequestSummary(record.method, record.url),
        }));

        if (JSON.stringify(reconciledRecord) !== JSON.stringify(stripLegacyRequestPlacementFields(record))) {
          resourceStorage.save('request', reconciledRecord);
        }

        return reconciledRecord;
      })
      .sort(compareSavedRequestRecords);

    return {
      collections: [...collections].sort(compareRequestPlacementRecords),
      requestGroups: sortRequestGroups(requestGroups),
      requests,
      defaultCollection: defaults.defaultCollection,
      defaultRequestGroup: defaults.defaultRequestGroup,
    };
  }

  function presentCollectionRecord(record) {
    return {
      ...record,
    };
  }

  function presentRequestGroupRecord(record) {
    return {
      ...record,
    };
  }

  function buildWorkspaceRequestTree(workspaceId) {
    const {
      collections,
      requestGroups,
      requests,
      defaultCollection,
      defaultRequestGroup,
    } = reconcileWorkspaceRequestPlacementState(workspaceId);
    const requestsByGroupId = new Map();

    for (const request of requests) {
      const groupRequests = requestsByGroupId.get(request.requestGroupId) ?? [];
      groupRequests.push(request);
      requestsByGroupId.set(request.requestGroupId, groupRequests);
    }

    const groupsByParentKey = new Map();
    for (const requestGroup of requestGroups) {
      const parentKey = `${requestGroup.collectionId}::${requestGroup.parentRequestGroupId || '__root__'}`;
      const scopedGroups = groupsByParentKey.get(parentKey) ?? [];
      scopedGroups.push(requestGroup);
      groupsByParentKey.set(parentKey, scopedGroups);
    }

    function buildRequestGroupNode(collection, requestGroup, ancestorRequestGroupIds = new Set()) {
      if (ancestorRequestGroupIds.has(requestGroup.id)) {
        return {
          id: `request-group-node-${requestGroup.id}`,
          kind: 'request-group',
          collectionId: collection.id,
          requestGroupId: requestGroup.id,
          parentRequestGroupId: requestGroup.parentRequestGroupId || null,
          name: requestGroup.name,
          description: requestGroup.description,
          childGroups: [],
          requests: [],
        };
      }

      const nextAncestorRequestGroupIds = new Set(ancestorRequestGroupIds);
      nextAncestorRequestGroupIds.add(requestGroup.id);
      const childGroupKey = `${collection.id}::${requestGroup.id}`;
      const childGroups = (groupsByParentKey.get(childGroupKey) ?? []).map((childGroup) => (
        buildRequestGroupNode(collection, childGroup, nextAncestorRequestGroupIds)
      ));
      const requestsForGroup = (requestsByGroupId.get(requestGroup.id) ?? []).map((request) => ({
        id: `request-node-${request.id}`,
        kind: 'request',
        name: request.name,
        request: {
          id: request.id,
          name: request.name,
          methodLabel: request.method,
          summary: request.summary,
          collectionId: request.collectionId,
          collectionName: request.collectionName,
          requestGroupId: request.requestGroupId,
          requestGroupName: request.requestGroupName,
          updatedAt: request.updatedAt,
        },
      }));

      return {
        id: `request-group-node-${requestGroup.id}`,
        kind: 'request-group',
        collectionId: collection.id,
        requestGroupId: requestGroup.id,
        parentRequestGroupId: requestGroup.parentRequestGroupId || null,
        name: requestGroup.name,
        description: requestGroup.description,
        childGroups,
        requests: requestsForGroup,
      };
    }

    return {
      defaults: {
        collectionId: defaultCollection.id,
        requestGroupId: defaultRequestGroup.id,
        collectionName: defaultCollection.name,
        requestGroupName: defaultRequestGroup.name,
      },
      collections: collections.map((record) => presentCollectionRecord(record)),
      requestGroups: requestGroups.map((record) => presentRequestGroupRecord(record)),
      tree: collections.map((collection) => ({
        id: `collection-node-${collection.id}`,
        kind: 'collection',
        collectionId: collection.id,
        name: collection.name,
        description: collection.description,
        childGroups: (groupsByParentKey.get(`${collection.id}::__root__`) ?? []).map((requestGroup) => (
          buildRequestGroupNode(collection, requestGroup)
        )),
      })),
    };
  }

  return {
    cloneRows,
    cloneAuth,
    cloneScripts,
    createRequestSummary,
    validateRequestDefinition,
    normalizeText,
    readWorkspaceCollectionReference,
    persistCollectionRecord,
    persistRequestGroupRecord,
    findCollectionByName,
    findRequestGroupByName,
    sortRequestGroups,
    normalizeSavedRequest,
    normalizePersistedRequestRecord,
    serializeRequestRecordForBundle,
    collectRequestBundleSavedScripts,
    listWorkspaceSavedRequestRecords,
    listWorkspaceCollectionRecords,
    listWorkspaceRequestGroupRecords,
    reconcileWorkspaceRequestPlacementState,
    presentCollectionRecord,
    presentRequestGroupRecord,
    buildWorkspaceRequestTree,
  };
}

module.exports = {
  createRequestResourceService,
};
