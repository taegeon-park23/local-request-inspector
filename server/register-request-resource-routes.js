function registerRequestResourceRoutes(app, dependencies) {
  const {
    sendData,
    sendError,
    repositories,
    defaultWorkspaceId,
    listWorkspaceSavedRequestRecords,
    buildWorkspaceRequestTree,
    listWorkspaceCollectionRecords,
    presentCollectionRecord,
    validateCollectionInput,
    findCollectionByName,
    persistCollectionRecord,
    createCollectionRecord,
    normalizePersistedCollectionRecord,
    listWorkspaceRequestGroupRecords,
    presentRequestGroupRecord,
    validateRequestGroupInput,
    findRequestGroupByName,
    persistRequestGroupRecord,
    createRequestGroupRecord,
    normalizePersistedRequestGroupRecord,
    validateRequestDefinition,
    readWorkspaceEnvironmentReference,
    normalizeSavedRequest,
    normalizePersistedRequestRecord,
  } = dependencies;
  const collectionRepository = repositories.resources.collections;
  const requestGroupRepository = repositories.resources.requestGroups;
  const requestRepository = repositories.resources.requests;

  function createChildGroupsByParentId(requestGroups) {
    const childGroupsByParentId = new Map();

    for (const requestGroup of requestGroups) {
      const parentRequestGroupId = typeof requestGroup.parentRequestGroupId === 'string' && requestGroup.parentRequestGroupId.trim().length > 0
        ? requestGroup.parentRequestGroupId.trim()
        : null;

      if (!parentRequestGroupId) {
        continue;
      }

      const childGroups = childGroupsByParentId.get(parentRequestGroupId) ?? [];
      childGroups.push(requestGroup);
      childGroupsByParentId.set(parentRequestGroupId, childGroups);
    }

    return childGroupsByParentId;
  }

  function listDescendantRequestGroupIds(childGroupsByParentId, requestGroupId) {
    if (!requestGroupId) {
      return [];
    }

    const pendingRequestGroupIds = [requestGroupId];
    const visitedRequestGroupIds = new Set(pendingRequestGroupIds);
    const descendantRequestGroupIds = [];

    while (pendingRequestGroupIds.length > 0) {
      const currentRequestGroupId = pendingRequestGroupIds.pop();

      for (const childRequestGroup of childGroupsByParentId.get(currentRequestGroupId) ?? []) {
        if (!visitedRequestGroupIds.has(childRequestGroup.id)) {
          visitedRequestGroupIds.add(childRequestGroup.id);
          descendantRequestGroupIds.push(childRequestGroup.id);
          pendingRequestGroupIds.push(childRequestGroup.id);
        }
      }
    }

    return descendantRequestGroupIds;
  }

  function isRequestGroupDescendant(requestGroups, requestGroupId, candidateParentRequestGroupId) {
    if (!requestGroupId || !candidateParentRequestGroupId) {
      return false;
    }

    const childGroupsByParentId = createChildGroupsByParentId(requestGroups);
    const descendantRequestGroupIds = listDescendantRequestGroupIds(childGroupsByParentId, requestGroupId);
    return descendantRequestGroupIds.includes(candidateParentRequestGroupId);
  }

  app.get('/api/workspaces/:workspaceId/requests', (req, res) => {
    try {
      const items = listWorkspaceSavedRequestRecords(req.params.workspaceId);
      return sendData(res, { items });
    } catch (error) {
      return sendError(res, 500, 'request_list_failed', error.message);
    }
  });

  app.get('/api/workspaces/:workspaceId/request-tree', (req, res) => {
    try {
      const requestTree = buildWorkspaceRequestTree(req.params.workspaceId);
      return sendData(res, requestTree);
    } catch (error) {
      return sendError(res, 500, 'request_tree_failed', error.message, {
        workspaceId: req.params.workspaceId,
      });
    }
  });

  app.get('/api/workspaces/:workspaceId/collections', (req, res) => {
    try {
      const items = listWorkspaceCollectionRecords(req.params.workspaceId)
        .map((record) => presentCollectionRecord(record));
      return sendData(res, { items });
    } catch (error) {
      return sendError(res, 500, 'collection_list_failed', error.message, {
        workspaceId: req.params.workspaceId,
      });
    }
  });

  app.post('/api/workspaces/:workspaceId/collections', (req, res) => {
    const input = req.body?.collection;
    const validationError = validateCollectionInput(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_collection', validationError, {
        workspaceId: req.params.workspaceId,
      });
    }

    try {
      const existingCollection = findCollectionByName(
        listWorkspaceCollectionRecords(req.params.workspaceId),
        input.name,
      );

      if (existingCollection) {
        return sendError(res, 409, 'collection_name_conflict', 'A collection with this name already exists in the workspace.', {
          workspaceId: req.params.workspaceId,
          collectionId: existingCollection.id,
        });
      }

      const collection = persistCollectionRecord(createCollectionRecord(input, null, req.params.workspaceId));
      return sendData(res, { collection: presentCollectionRecord(collection) }, 201);
    } catch (error) {
      return sendError(res, 500, 'collection_create_failed', error.message, {
        workspaceId: req.params.workspaceId,
      });
    }
  });

  app.get('/api/collections/:collectionId', (req, res) => {
    try {
      const collection = normalizePersistedCollectionRecord(
        collectionRepository.read(req.params.collectionId),
      );

      if (!collection) {
        return sendError(res, 404, 'collection_not_found', 'Collection was not found.', {
          collectionId: req.params.collectionId,
        });
      }

      return sendData(res, { collection: presentCollectionRecord(collection) });
    } catch (error) {
      return sendError(res, 500, 'collection_detail_failed', error.message, {
        collectionId: req.params.collectionId,
      });
    }
  });

  app.patch('/api/collections/:collectionId', (req, res) => {
    const input = req.body?.collection;
    const validationError = validateCollectionInput(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_collection', validationError, {
        collectionId: req.params.collectionId,
      });
    }

    try {
      const existingRecord = normalizePersistedCollectionRecord(
        collectionRepository.read(req.params.collectionId),
      );

      if (!existingRecord) {
        return sendError(res, 404, 'collection_not_found', 'Collection was not found.', {
          collectionId: req.params.collectionId,
        });
      }

      const workspaceId = existingRecord.workspaceId || defaultWorkspaceId;
      const conflictingCollection = listWorkspaceCollectionRecords(workspaceId)
        .find((record) => (
          record.id !== req.params.collectionId
          && String(record.name || '').trim().toLowerCase() === String(input.name || '').trim().toLowerCase()
        ));

      if (conflictingCollection) {
        return sendError(res, 409, 'collection_name_conflict', 'A collection with this name already exists in the workspace.', {
          collectionId: req.params.collectionId,
          conflictingCollectionId: conflictingCollection.id,
        });
      }

      const collection = persistCollectionRecord(createCollectionRecord(
        {
          ...input,
          id: req.params.collectionId,
        },
        existingRecord,
        workspaceId,
      ));
      const relatedRequests = listWorkspaceSavedRequestRecords(workspaceId)
        .filter((record) => record.collectionId === req.params.collectionId);

      for (const requestRecord of relatedRequests) {
        requestRepository.save({
          ...requestRecord,
          collectionName: collection.name,
        });
      }

      return sendData(res, { collection: presentCollectionRecord(collection) });
    } catch (error) {
      return sendError(res, 500, 'collection_update_failed', error.message, {
        collectionId: req.params.collectionId,
      });
    }
  });

  app.delete('/api/collections/:collectionId', (req, res) => {
    try {
      const existingRecord = normalizePersistedCollectionRecord(
        collectionRepository.read(req.params.collectionId),
      );

      if (!existingRecord) {
        return sendError(res, 404, 'collection_not_found', 'Collection was not found.', {
          collectionId: req.params.collectionId,
        });
      }

      const workspaceId = existingRecord.workspaceId || defaultWorkspaceId;
      const requestGroups = listWorkspaceRequestGroupRecords(workspaceId)
        .filter((record) => record.collectionId === req.params.collectionId);

      if (requestGroups.length > 0) {
        return sendError(res, 409, 'collection_not_empty', 'Collection still contains request groups and cannot be deleted.', {
          collectionId: req.params.collectionId,
          requestGroupCount: requestGroups.length,
        });
      }

      collectionRepository.delete(req.params.collectionId);
      return sendData(res, { deletedCollectionId: req.params.collectionId });
    } catch (error) {
      return sendError(res, 500, 'collection_delete_failed', error.message, {
        collectionId: req.params.collectionId,
      });
    }
  });

  app.get('/api/collections/:collectionId/request-groups', (req, res) => {
    try {
      const collection = normalizePersistedCollectionRecord(
        collectionRepository.read(req.params.collectionId),
      );

      if (!collection) {
        return sendError(res, 404, 'collection_not_found', 'Collection was not found.', {
          collectionId: req.params.collectionId,
        });
      }

      const items = listWorkspaceRequestGroupRecords(collection.workspaceId || defaultWorkspaceId)
        .filter((record) => record.collectionId === req.params.collectionId)
        .map((record) => presentRequestGroupRecord(record));
      return sendData(res, { items });
    } catch (error) {
      return sendError(res, 500, 'request_group_list_failed', error.message, {
        collectionId: req.params.collectionId,
      });
    }
  });

  app.post('/api/collections/:collectionId/request-groups', (req, res) => {
    const input = req.body?.requestGroup;
    const collection = normalizePersistedCollectionRecord(
      collectionRepository.read(req.params.collectionId),
    );

    if (!collection) {
      return sendError(res, 404, 'collection_not_found', 'Collection was not found.', {
        collectionId: req.params.collectionId,
      });
    }

    const validationError = validateRequestGroupInput({
      ...input,
      collectionId: req.params.collectionId,
    });

    if (validationError) {
      return sendError(res, 400, 'invalid_request_group', validationError, {
        collectionId: req.params.collectionId,
      });
    }

    try {
      const workspaceRequestGroups = listWorkspaceRequestGroupRecords(collection.workspaceId || defaultWorkspaceId);
      const parentRequestGroupId = typeof input?.parentRequestGroupId === 'string' && input.parentRequestGroupId.trim().length > 0
        ? input.parentRequestGroupId.trim()
        : null;
      const parentRequestGroup = parentRequestGroupId
        ? workspaceRequestGroups.find((record) => record.id === parentRequestGroupId) ?? null
        : null;

      if (parentRequestGroupId && !parentRequestGroup) {
        return sendError(res, 404, 'request_group_parent_not_found', 'Parent request group was not found.', {
          collectionId: req.params.collectionId,
          parentRequestGroupId,
        });
      }

      if (parentRequestGroup && parentRequestGroup.collectionId !== req.params.collectionId) {
        return sendError(res, 400, 'request_group_parent_collection_mismatch', 'Parent request group must belong to the same collection.', {
          collectionId: req.params.collectionId,
          parentRequestGroupId,
        });
      }

      const existingRequestGroup = findRequestGroupByName(
        workspaceRequestGroups,
        req.params.collectionId,
        input.name,
        parentRequestGroupId,
      );

      if (existingRequestGroup) {
        return sendError(res, 409, 'request_group_name_conflict', 'A request group with this name already exists in the same parent scope.', {
          collectionId: req.params.collectionId,
          requestGroupId: existingRequestGroup.id,
          parentRequestGroupId,
        });
      }

      const requestGroup = persistRequestGroupRecord(createRequestGroupRecord(
        {
          ...input,
          collectionId: req.params.collectionId,
          parentRequestGroupId,
        },
        null,
        collection.workspaceId || defaultWorkspaceId,
      ));
      return sendData(res, { requestGroup: presentRequestGroupRecord(requestGroup) }, 201);
    } catch (error) {
      return sendError(res, 500, 'request_group_create_failed', error.message, {
        collectionId: req.params.collectionId,
      });
    }
  });

  app.get('/api/request-groups/:requestGroupId', (req, res) => {
    try {
      const requestGroup = normalizePersistedRequestGroupRecord(
        requestGroupRepository.read(req.params.requestGroupId),
      );

      if (!requestGroup) {
        return sendError(res, 404, 'request_group_not_found', 'Request group was not found.', {
          requestGroupId: req.params.requestGroupId,
        });
      }

      return sendData(res, { requestGroup: presentRequestGroupRecord(requestGroup) });
    } catch (error) {
      return sendError(res, 500, 'request_group_detail_failed', error.message, {
        requestGroupId: req.params.requestGroupId,
      });
    }
  });

  app.patch('/api/request-groups/:requestGroupId', (req, res) => {
    const input = req.body?.requestGroup;
    let existingRecord;

    try {
      existingRecord = normalizePersistedRequestGroupRecord(
        requestGroupRepository.read(req.params.requestGroupId),
      );

      if (!existingRecord) {
        return sendError(res, 404, 'request_group_not_found', 'Request group was not found.', {
          requestGroupId: req.params.requestGroupId,
        });
      }
    } catch (error) {
      return sendError(res, 500, 'request_group_detail_failed', error.message, {
        requestGroupId: req.params.requestGroupId,
      });
    }

    const validationError = validateRequestGroupInput({
      ...input,
      collectionId: existingRecord.collectionId,
      parentRequestGroupId: input?.parentRequestGroupId ?? existingRecord.parentRequestGroupId ?? null,
    });

    if (validationError) {
      return sendError(res, 400, 'invalid_request_group', validationError, {
        requestGroupId: req.params.requestGroupId,
      });
    }

    try {
      const workspaceId = existingRecord.workspaceId || defaultWorkspaceId;
      const workspaceRequestGroups = listWorkspaceRequestGroupRecords(workspaceId);
      const nextParentRequestGroupId = typeof input?.parentRequestGroupId === 'string' && input.parentRequestGroupId.trim().length > 0
        ? input.parentRequestGroupId.trim()
        : null;
      const parentRequestGroup = nextParentRequestGroupId
        ? workspaceRequestGroups.find((record) => record.id === nextParentRequestGroupId) ?? null
        : null;

      if (nextParentRequestGroupId === req.params.requestGroupId) {
        return sendError(res, 400, 'request_group_parent_cycle', 'Request group cannot be its own parent.', {
          requestGroupId: req.params.requestGroupId,
          parentRequestGroupId: nextParentRequestGroupId,
        });
      }

      if (nextParentRequestGroupId && !parentRequestGroup) {
        return sendError(res, 404, 'request_group_parent_not_found', 'Parent request group was not found.', {
          requestGroupId: req.params.requestGroupId,
          parentRequestGroupId: nextParentRequestGroupId,
        });
      }

      if (parentRequestGroup && parentRequestGroup.collectionId !== existingRecord.collectionId) {
        return sendError(res, 400, 'request_group_parent_collection_mismatch', 'Parent request group must belong to the same collection.', {
          requestGroupId: req.params.requestGroupId,
          parentRequestGroupId: nextParentRequestGroupId,
        });
      }

      if (parentRequestGroup && isRequestGroupDescendant(workspaceRequestGroups, req.params.requestGroupId, nextParentRequestGroupId)) {
        return sendError(res, 400, 'request_group_parent_cycle', 'Request group cannot move inside one of its descendants.', {
          requestGroupId: req.params.requestGroupId,
          parentRequestGroupId: nextParentRequestGroupId,
        });
      }

      const conflictingRequestGroup = workspaceRequestGroups
        .find((record) => (
          record.id !== req.params.requestGroupId
          && record.collectionId === existingRecord.collectionId
          && String(record.parentRequestGroupId || '') === String(nextParentRequestGroupId || '')
          && String(record.name || '').trim().toLowerCase() === String(input.name || '').trim().toLowerCase()
        ));

      if (conflictingRequestGroup) {
        return sendError(res, 409, 'request_group_name_conflict', 'A request group with this name already exists in the same parent scope.', {
          requestGroupId: req.params.requestGroupId,
          conflictingRequestGroupId: conflictingRequestGroup.id,
          parentRequestGroupId: nextParentRequestGroupId,
        });
      }

      const requestGroup = persistRequestGroupRecord(createRequestGroupRecord(
        {
          ...input,
          id: req.params.requestGroupId,
          collectionId: existingRecord.collectionId,
          parentRequestGroupId: nextParentRequestGroupId,
        },
        existingRecord,
        workspaceId,
      ));
      const relatedRequests = listWorkspaceSavedRequestRecords(workspaceId)
        .filter((record) => record.requestGroupId === req.params.requestGroupId);

      for (const requestRecord of relatedRequests) {
        requestRepository.save({
          ...requestRecord,
          requestGroupName: requestGroup.name,
        });
      }

      return sendData(res, { requestGroup: presentRequestGroupRecord(requestGroup) });
    } catch (error) {
      return sendError(res, 500, 'request_group_update_failed', error.message, {
        requestGroupId: req.params.requestGroupId,
      });
    }
  });

  app.delete('/api/request-groups/:requestGroupId', (req, res) => {
    try {
      const existingRecord = normalizePersistedRequestGroupRecord(
        requestGroupRepository.read(req.params.requestGroupId),
      );

      if (!existingRecord) {
        return sendError(res, 404, 'request_group_not_found', 'Request group was not found.', {
          requestGroupId: req.params.requestGroupId,
        });
      }

      const workspaceId = existingRecord.workspaceId || defaultWorkspaceId;
      const workspaceRequestGroups = listWorkspaceRequestGroupRecords(workspaceId);
      const childGroupsByParentId = createChildGroupsByParentId(workspaceRequestGroups);
      const descendantRequestGroupIds = listDescendantRequestGroupIds(
        childGroupsByParentId,
        req.params.requestGroupId,
      );
      const directChildRequestGroupCount = (childGroupsByParentId.get(req.params.requestGroupId) ?? []).length;
      const subtreeRequestGroupIds = new Set([req.params.requestGroupId, ...descendantRequestGroupIds]);
      const subtreeRequests = listWorkspaceSavedRequestRecords(workspaceId)
        .filter((record) => subtreeRequestGroupIds.has(record.requestGroupId));

      if (subtreeRequests.length > 0) {
        return sendError(res, 409, 'request_group_not_empty', 'Request group still contains saved requests or nested request groups and cannot be deleted.', {
          requestGroupId: req.params.requestGroupId,
          requestCount: subtreeRequests.length,
          childRequestGroupCount: directChildRequestGroupCount,
          descendantRequestGroupCount: descendantRequestGroupIds.length,
        });
      }

      for (const descendantRequestGroupId of descendantRequestGroupIds) {
        requestGroupRepository.delete(descendantRequestGroupId);
      }
      requestGroupRepository.delete(req.params.requestGroupId);
      return sendData(res, {
        deletedRequestGroupId: req.params.requestGroupId,
        deletedRequestGroupIds: [req.params.requestGroupId, ...descendantRequestGroupIds],
      });
    } catch (error) {
      return sendError(res, 500, 'request_group_delete_failed', error.message, {
        requestGroupId: req.params.requestGroupId,
      });
    }
  });

  app.post('/api/workspaces/:workspaceId/requests', (req, res) => {
    const input = req.body?.request;
    const validationError = validateRequestDefinition(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_request_definition', validationError);
    }

    if (typeof input?.id === 'string' && input.id.trim().length > 0) {
      return sendError(res, 400, 'request_create_requires_new_identity', 'Use the update route for an existing saved request id.', {
        requestId: input.id,
      });
    }

    if (
      typeof input?.selectedEnvironmentId === 'string'
      && input.selectedEnvironmentId.trim().length > 0
      && !readWorkspaceEnvironmentReference(req.params.workspaceId, input.selectedEnvironmentId)
    ) {
      return sendError(
        res,
        400,
        'request_environment_not_found',
        'Selected environment was not found in this workspace.',
        {
          workspaceId: req.params.workspaceId,
          environmentId: input.selectedEnvironmentId,
        },
      );
    }

    try {
      const record = normalizeSavedRequest(input, null, req.params.workspaceId);
      requestRepository.save(record);
      return sendData(res, { request: record }, 201);
    } catch (error) {
      if (error.code) {
        return sendError(res, 400, error.code, error.message, {
          workspaceId: req.params.workspaceId,
          ...(error.details || {}),
        });
      }
      return sendError(res, 500, 'request_save_failed', error.message);
    }
  });

  app.get('/api/requests/:requestId', (req, res) => {
    try {
      const existingRecord = normalizePersistedRequestRecord(
        requestRepository.read(req.params.requestId),
      );

      if (!existingRecord) {
        return sendError(res, 404, 'request_not_found', 'Saved request was not found.', {
          requestId: req.params.requestId,
        });
      }

      const record = listWorkspaceSavedRequestRecords(existingRecord.workspaceId || defaultWorkspaceId)
        .find((item) => item.id === req.params.requestId) ?? existingRecord;
      return sendData(res, { request: record });
    } catch (error) {
      return sendError(res, 500, 'request_detail_failed', error.message, {
        requestId: req.params.requestId,
      });
    }
  });

  app.patch('/api/requests/:requestId', (req, res) => {
    const input = req.body?.request;
    const validationError = validateRequestDefinition(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_request_definition', validationError, {
        requestId: req.params.requestId,
      });
    }

    try {
      const existingRecord = normalizePersistedRequestRecord(
        requestRepository.read(req.params.requestId),
      );

      if (!existingRecord) {
        return sendError(res, 404, 'request_not_found', 'Saved request was not found.', {
          requestId: req.params.requestId,
        });
      }

      const ifMatchUpdatedAt = typeof input?.ifMatchUpdatedAt === 'string' && input.ifMatchUpdatedAt.trim().length > 0
        ? input.ifMatchUpdatedAt.trim()
        : null;

      if (ifMatchUpdatedAt && String(existingRecord.updatedAt || '') !== ifMatchUpdatedAt) {
        return sendError(res, 409, 'request_conflict', 'Saved request has changed since this tab loaded. Refresh, overwrite, or save as new.', {
          requestId: req.params.requestId,
          ifMatchUpdatedAt,
          currentUpdatedAt: existingRecord.updatedAt || null,
        });
      }

      if (
        typeof input?.selectedEnvironmentId === 'string'
        && input.selectedEnvironmentId.trim().length > 0
        && !readWorkspaceEnvironmentReference(existingRecord.workspaceId || defaultWorkspaceId, input.selectedEnvironmentId)
      ) {
        return sendError(
          res,
          400,
          'request_environment_not_found',
          'Selected environment was not found in this workspace.',
          {
            requestId: req.params.requestId,
            environmentId: input.selectedEnvironmentId,
          },
        );
      }

      const record = normalizeSavedRequest(
        {
          ...input,
          id: req.params.requestId,
        },
        existingRecord,
        existingRecord.workspaceId || req.body?.request?.workspaceId || defaultWorkspaceId,
      );
      requestRepository.save(record);
      return sendData(res, { request: record });
    } catch (error) {
      if (error.code) {
        return sendError(res, 400, error.code, error.message, {
          requestId: req.params.requestId,
          ...(error.details || {}),
        });
      }
      return sendError(res, 500, 'request_update_failed', error.message, {
        requestId: req.params.requestId,
      });
    }
  });

  app.delete('/api/requests/:requestId', (req, res) => {
    try {
      const existingRecord = normalizePersistedRequestRecord(
        requestRepository.read(req.params.requestId),
      );

      if (!existingRecord) {
        return sendError(res, 404, 'request_not_found', 'Saved request was not found.', {
          requestId: req.params.requestId,
        });
      }

      requestRepository.delete(req.params.requestId);
      return sendData(res, { deletedRequestId: req.params.requestId });
    } catch (error) {
      return sendError(res, 500, 'request_delete_failed', error.message, {
        requestId: req.params.requestId,
      });
    }
  });
}

module.exports = {
  registerRequestResourceRoutes,
};



