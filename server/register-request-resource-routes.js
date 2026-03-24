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
      const existingRequestGroup = findRequestGroupByName(
        listWorkspaceRequestGroupRecords(collection.workspaceId || defaultWorkspaceId),
        req.params.collectionId,
        input.name,
      );

      if (existingRequestGroup) {
        return sendError(res, 409, 'request_group_name_conflict', 'A request group with this name already exists in the collection.', {
          collectionId: req.params.collectionId,
          requestGroupId: existingRequestGroup.id,
        });
      }

      const requestGroup = persistRequestGroupRecord(createRequestGroupRecord(
        {
          ...input,
          collectionId: req.params.collectionId,
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
    });

    if (validationError) {
      return sendError(res, 400, 'invalid_request_group', validationError, {
        requestGroupId: req.params.requestGroupId,
      });
    }

    try {
      const workspaceId = existingRecord.workspaceId || defaultWorkspaceId;
      const conflictingRequestGroup = listWorkspaceRequestGroupRecords(workspaceId)
        .find((record) => (
          record.id !== req.params.requestGroupId
          && record.collectionId === existingRecord.collectionId
          && String(record.name || '').trim().toLowerCase() === String(input.name || '').trim().toLowerCase()
        ));

      if (conflictingRequestGroup) {
        return sendError(res, 409, 'request_group_name_conflict', 'A request group with this name already exists in the collection.', {
          requestGroupId: req.params.requestGroupId,
          conflictingRequestGroupId: conflictingRequestGroup.id,
        });
      }

      const requestGroup = persistRequestGroupRecord(createRequestGroupRecord(
        {
          ...input,
          id: req.params.requestGroupId,
          collectionId: existingRecord.collectionId,
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

      const requests = listWorkspaceSavedRequestRecords(existingRecord.workspaceId || defaultWorkspaceId)
        .filter((record) => record.requestGroupId === req.params.requestGroupId);

      if (requests.length > 0) {
        return sendError(res, 409, 'request_group_not_empty', 'Request group still contains saved requests and cannot be deleted.', {
          requestGroupId: req.params.requestGroupId,
          requestCount: requests.length,
        });
      }

      requestGroupRepository.delete(req.params.requestGroupId);
      return sendData(res, { deletedRequestGroupId: req.params.requestGroupId });
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

