function createResourceBundleImportService(dependencies) {
  const {
    randomUUID,
    sendError,
    parseAuthoredResourceBundleText,
    prepareAuthoredResourceImport,
    createImportedResourceName,
    normalizeText,
    readWorkspaceCollectionReference,
    reconcileWorkspaceRequestPlacementState,
    listWorkspaceMockRuleRecords,
    listWorkspaceSavedScriptRecords,
    compareRequestPlacementRecords,
    sortRequestGroups,
    compareSavedRequestRecords,
    compareMockRuleRecords,
    compareSavedScriptRecords,
    createCollectionRecord,
    validateCollectionInput,
    createStableCollectionId,
    defaultRequestCollectionName,
    createRequestGroupRecord,
    validateRequestGroupInput,
    createStableRequestGroupId,
    defaultRequestGroupName,
    normalizeSavedRequest,
    validateRequestDefinition,
    remapRequestScriptsForImport,
    createMockRuleRecord,
    validateMockRuleInput,
    createSavedScriptRecord,
    validateSavedScriptInput,
    collectionResourceSchemaVersion,
    requestGroupResourceSchemaVersion,
    requestResourceSchemaVersion,
    mockRuleResourceSchemaVersion,
    scriptResourceSchemaVersion,
    resourceRecordKinds,
  } = dependencies;

  function validateImportedResourceCompatibility(input, expectedKind, supportedSchemaVersion) {
    if (!input || typeof input !== 'object') {
      return null;
    }

    if (typeof input.resourceKind === 'string' && input.resourceKind !== expectedKind) {
      return `Imported resource kind ${input.resourceKind} is not supported for ${expectedKind}.`;
    }

    const allowsLegacyRequestImport = (
      expectedKind === resourceRecordKinds.REQUEST
      && Number(input.resourceSchemaVersion) === 1
      && supportedSchemaVersion === requestResourceSchemaVersion
      && requestResourceSchemaVersion === 2
    );

    if (input.resourceSchemaVersion != null && input.resourceSchemaVersion !== supportedSchemaVersion && !allowsLegacyRequestImport) {
      return `Imported ${expectedKind} resource schema version ${input.resourceSchemaVersion} is not supported.`;
    }

    return null;
  }

  function createImportedResourceRejection(kind, reason, name) {
    return {
      kind,
      reason,
      ...(typeof name === 'string' && name.trim().length > 0 ? { name: name.trim() } : {}),
    };
  }

  function createImportedScopedRequestGroupName(name, collectionId, usedScopedNames) {
    const baseName = normalizeText(name) || defaultRequestGroupName;
    const scopedNames = usedScopedNames || new Set();
    const normalizedBaseKey = `${collectionId}::${baseName.toLowerCase()}`;

    if (!scopedNames.has(normalizedBaseKey)) {
      scopedNames.add(normalizedBaseKey);
      return baseName;
    }

    let suffixIndex = 1;
    while (true) {
      const nextName = suffixIndex === 1 ? `${baseName} (Imported)` : `${baseName} (Imported ${suffixIndex})`;
      const nextKey = `${collectionId}::${nextName.toLowerCase()}`;

      if (!scopedNames.has(nextKey)) {
        scopedNames.add(nextKey);
        return nextName;
      }

      suffixIndex += 1;
    }
  }

  function normalizeWorkspaceResourceBundle(bundle, workspaceId) {
    const collections = Array.isArray(bundle.collections) ? bundle.collections.map((record) => ({ ...record })) : [];
    const requestGroups = Array.isArray(bundle.requestGroups) ? bundle.requestGroups.map((record) => ({ ...record })) : [];
    const collectionByName = new Map(
      collections
        .filter((record) => normalizeText(record?.name).length > 0)
        .map((record) => [normalizeText(record.name).toLowerCase(), record]),
    );
    const requestGroupKeys = new Set(
      requestGroups.map((record) => `${normalizeText(record.collectionId)}::${normalizeText(record.name).toLowerCase()}`),
    );

    for (const request of Array.isArray(bundle.requests) ? bundle.requests : []) {
      const collectionName = normalizeText(request?.collectionName) || defaultRequestCollectionName;
      let collectionRecord = collectionByName.get(collectionName.toLowerCase()) ?? null;

      if (!collectionRecord) {
        collectionRecord = {
          resourceKind: resourceRecordKinds.COLLECTION,
          resourceSchemaVersion: collectionResourceSchemaVersion,
          id: normalizeText(request?.collectionId) || createStableCollectionId(workspaceId, collectionName),
          workspaceId,
          name: collectionName,
          description: '',
        };
        collections.push(collectionRecord);
        collectionByName.set(collectionName.toLowerCase(), collectionRecord);
      }

      const requestGroupName = normalizeText(request?.requestGroupName || request?.folderName) || defaultRequestGroupName;
      const requestGroupKey = `${collectionRecord.id}::${requestGroupName.toLowerCase()}`;

      if (!requestGroupKeys.has(requestGroupKey)) {
        requestGroups.push({
          resourceKind: resourceRecordKinds.REQUEST_GROUP,
          resourceSchemaVersion: requestGroupResourceSchemaVersion,
          id: normalizeText(request?.requestGroupId) || createStableRequestGroupId(workspaceId, collectionRecord.id, requestGroupName),
          workspaceId,
          collectionId: collectionRecord.id,
          name: requestGroupName,
          description: '',
        });
        requestGroupKeys.add(requestGroupKey);
      }
    }

    return {
      ...bundle,
      collections,
      requestGroups,
    };
  }

  function createImportedCollectionResource(input, workspaceId, usedNames, state) {
    const compatibilityError = validateImportedResourceCompatibility(
      input,
      resourceRecordKinds.COLLECTION,
      collectionResourceSchemaVersion,
    );

    if (compatibilityError) {
      return {
        rejection: createImportedResourceRejection('collection', compatibilityError, input?.name),
      };
    }

    const validationError = validateCollectionInput(input);

    if (validationError) {
      return {
        rejection: createImportedResourceRejection('collection', validationError, input?.name),
      };
    }

    const importedName = createImportedResourceName(input.name, usedNames);
    const record = createCollectionRecord(
      {
        ...input,
        id: randomUUID(),
        name: importedName,
      },
      null,
      workspaceId,
    );

    if (normalizeText(input?.id)) {
      state.collectionIdMap.set(normalizeText(input.id), record.id);
    }
    state.collectionRecordBySourceName.set(normalizeText(input?.name).toLowerCase(), record);

    return {
      record,
      renamed: importedName !== normalizeText(input?.name),
    };
  }

  function createImportedRequestGroupResource(input, workspaceId, state) {
    const compatibilityError = validateImportedResourceCompatibility(
      input,
      resourceRecordKinds.REQUEST_GROUP,
      requestGroupResourceSchemaVersion,
    );

    if (compatibilityError) {
      return {
        rejection: createImportedResourceRejection('request-group', compatibilityError, input?.name),
      };
    }

    const sourceCollectionId = normalizeText(input?.collectionId);
    const mappedCollectionId = state.collectionIdMap.get(sourceCollectionId) || sourceCollectionId;
    const collectionRecord = readWorkspaceCollectionReference(workspaceId, mappedCollectionId)
      || state.importedCollectionById.get(mappedCollectionId)
      || state.collectionRecordBySourceName.get(normalizeText(input?.collectionName).toLowerCase())
      || null;

    if (!collectionRecord) {
      return {
        rejection: createImportedResourceRejection(
          'request-group',
          'Request group references a collection that is not available in this workspace import.',
          input?.name,
        ),
      };
    }

    const validationError = validateRequestGroupInput({
      ...input,
      collectionId: collectionRecord.id,
    });

    if (validationError) {
      return {
        rejection: createImportedResourceRejection('request-group', validationError, input?.name),
      };
    }

    const importedName = createImportedScopedRequestGroupName(input.name, collectionRecord.id, state.usedRequestGroupKeys);
    const record = createRequestGroupRecord(
      {
        ...input,
        id: randomUUID(),
        collectionId: collectionRecord.id,
        name: importedName,
      },
      null,
      workspaceId,
    );

    if (normalizeText(input?.id)) {
      state.requestGroupIdMap.set(normalizeText(input.id), record.id);
    }
    state.importedRequestGroupById.set(record.id, record);
    state.requestGroupRecordBySourceKey.set(
      `${sourceCollectionId || normalizeText(input?.collectionName).toLowerCase()}::${normalizeText(input?.name).toLowerCase()}`,
      record,
    );

    return {
      record,
      renamed: importedName !== normalizeText(input?.name),
    };
  }

  function createImportedRequestRecord(input, workspaceId, usedNames, state) {
    const compatibilityError = validateImportedResourceCompatibility(
      input,
      resourceRecordKinds.REQUEST,
      requestResourceSchemaVersion,
    );

    if (compatibilityError) {
      return {
        rejection: createImportedResourceRejection('request', compatibilityError, input?.name),
      };
    }

    const validationError = validateRequestDefinition(input);

    if (validationError) {
      return {
        rejection: createImportedResourceRejection('request', validationError, input?.name),
      };
    }

    const importedName = createImportedResourceName(input.name, usedNames);
    const remappedScripts = remapRequestScriptsForImport(
      input.scripts,
      (sourceSavedScriptId, linkedStage) =>
        state.importedScriptBySourceId.get(normalizeText(sourceSavedScriptId))
        || state.importedScriptBySourceName.get(normalizeText(linkedStage?.savedScriptNameSnapshot).toLowerCase())
        || null,
    );

    if (remappedScripts.unresolvedLinks.length > 0) {
      const unresolvedLink = remappedScripts.unresolvedLinks[0];
      const unresolvedScriptName = normalizeText(unresolvedLink.savedScriptNameSnapshot)
        || normalizeText(unresolvedLink.savedScriptId)
        || 'linked saved script';

      return {
        rejection: createImportedResourceRejection(
          'request',
          `Request references linked saved script "${unresolvedScriptName}" in the ${unresolvedLink.stageId} stage, but that script is not available in this bundle.`,
          input?.name,
        ),
      };
    }

    return {
      record: normalizeSavedRequest(
        {
          ...input,
          id: randomUUID(),
          workspaceId,
          name: importedName,
          scripts: remappedScripts.scripts,
        },
        null,
        workspaceId,
      ),
      renamed: importedName !== String(input.name || '').trim(),
    };
  }

  function createImportedMockRuleResource(input, workspaceId, usedNames) {
    const compatibilityError = validateImportedResourceCompatibility(
      input,
      resourceRecordKinds.MOCK_RULE,
      mockRuleResourceSchemaVersion,
    );

    if (compatibilityError) {
      return {
        rejection: createImportedResourceRejection('mock-rule', compatibilityError, input?.name),
      };
    }

    const validationError = validateMockRuleInput(input);

    if (validationError) {
      return {
        rejection: createImportedResourceRejection('mock-rule', validationError, input?.name),
      };
    }

    const importedName = createImportedResourceName(input.name, usedNames);

    return {
      record: createMockRuleRecord(
        {
          ...input,
          id: randomUUID(),
          name: importedName,
        },
        null,
        workspaceId,
      ),
      renamed: importedName !== String(input.name || '').trim(),
    };
  }

  function createImportedScriptResource(input, workspaceId, usedNames, state) {
    const compatibilityError = validateImportedResourceCompatibility(
      input,
      resourceRecordKinds.SCRIPT,
      scriptResourceSchemaVersion,
    );

    if (compatibilityError) {
      return {
        rejection: createImportedResourceRejection('script', compatibilityError, input?.name),
      };
    }

    const validationError = validateSavedScriptInput(input);

    if (validationError) {
      return {
        rejection: createImportedResourceRejection('script', validationError, input?.name),
      };
    }

    const importedName = createImportedResourceName(input.name, usedNames);
    const record = createSavedScriptRecord(
      {
        ...input,
        id: randomUUID(),
        name: importedName,
      },
      null,
      workspaceId,
    );

    if (normalizeText(input?.id)) {
      state.importedScriptBySourceId.set(normalizeText(input.id), record);
    }
    state.importedScriptBySourceName.set(normalizeText(input?.name).toLowerCase(), record);

    return {
      record,
      renamed: importedName !== String(input.name || '').trim(),
    };
  }

  function parseWorkspaceResourceBundleImportRequest(req, res) {
    const bundleText = req.body?.bundleText;

    if (typeof bundleText !== 'string') {
      sendError(res, 400, 'resource_bundle_invalid_json', 'Import request must include bundle JSON text.', {
        workspaceId: req.params.workspaceId,
      });
      return null;
    }

    try {
      return parseAuthoredResourceBundleText(bundleText);
    } catch (error) {
      sendError(
        res,
        400,
        error.code || 'resource_bundle_import_failed',
        error.message,
        {
          workspaceId: req.params.workspaceId,
          ...(error.details || {}),
        },
      );
      return null;
    }
  }

  function prepareWorkspaceResourceBundleImport(bundle, workspaceId) {
    const normalizedBundle = normalizeWorkspaceResourceBundle(bundle, workspaceId);
    const {
      collections: existingCollections,
      requestGroups: existingRequestGroups,
      requests: existingRequests,
    } = reconcileWorkspaceRequestPlacementState(workspaceId);
    const existingMockRules = listWorkspaceMockRuleRecords(workspaceId);
    const existingScripts = listWorkspaceSavedScriptRecords(workspaceId);
    const importState = {
      collectionIdMap: new Map(),
      collectionRecordBySourceName: new Map(),
      importedCollectionById: new Map(existingCollections.map((record) => [record.id, record])),
      requestGroupIdMap: new Map(),
      requestGroupRecordBySourceKey: new Map(),
      importedRequestGroupById: new Map(existingRequestGroups.map((record) => [record.id, record])),
      usedRequestGroupKeys: new Set(
        existingRequestGroups.map((record) => `${record.collectionId}::${normalizeText(record.name).toLowerCase()}`),
      ),
      importedScriptBySourceId: new Map(),
      importedScriptBySourceName: new Map(),
    };

    return prepareAuthoredResourceImport({
      bundle: normalizedBundle,
      workspaceId,
      existingCollectionNames: existingCollections.map((record) => record.name),
      existingRequestGroupNames: [],
      existingRequestNames: existingRequests.map((record) => record.name),
      existingMockRuleNames: existingMockRules.map((record) => record.name),
      existingScriptNames: existingScripts.map((record) => record.name),
      createImportedCollection: (input, nextWorkspaceId, usedNames) => {
        const result = createImportedCollectionResource(input, nextWorkspaceId, usedNames, importState);

        if (result.record) {
          importState.importedCollectionById.set(result.record.id, result.record);
        }

        return result;
      },
      createImportedRequestGroup: (input, nextWorkspaceId) =>
        createImportedRequestGroupResource(input, nextWorkspaceId, importState),
      createImportedRequest: (input, nextWorkspaceId, usedNames) => {
        const sourceCollectionId = normalizeText(input?.collectionId);
        const sourceRequestGroupId = normalizeText(input?.requestGroupId);
        const mappedCollectionId = importState.collectionIdMap.get(sourceCollectionId) || sourceCollectionId;
        const mappedRequestGroupId = importState.requestGroupIdMap.get(sourceRequestGroupId) || sourceRequestGroupId;
        const sourceCollectionRecord = importState.importedCollectionById.get(mappedCollectionId)
          || importState.collectionRecordBySourceName.get(normalizeText(input?.collectionName).toLowerCase())
          || null;
        const requestGroupSourceKey = `${sourceCollectionId || normalizeText(input?.collectionName).toLowerCase()}::${normalizeText(input?.requestGroupName || input?.folderName).toLowerCase()}`;
        const sourceRequestGroupRecord = importState.importedRequestGroupById.get(mappedRequestGroupId)
          || importState.requestGroupRecordBySourceKey.get(requestGroupSourceKey)
          || null;

        return createImportedRequestRecord(
          {
            ...input,
            ...(sourceCollectionRecord
              ? {
                  collectionId: sourceCollectionRecord.id,
                  collectionName: sourceCollectionRecord.name,
                }
              : {}),
            ...(sourceRequestGroupRecord
              ? {
                  requestGroupId: sourceRequestGroupRecord.id,
                  requestGroupName: sourceRequestGroupRecord.name,
                }
              : {}),
          },
          nextWorkspaceId,
          usedNames,
          importState,
        );
      },
      createImportedMockRule: createImportedMockRuleResource,
      createImportedScript: (input, nextWorkspaceId, usedNames) =>
        createImportedScriptResource(input, nextWorkspaceId, usedNames, importState),
      sortAcceptedCollections: (records) => [...records].sort(compareRequestPlacementRecords),
      sortAcceptedRequestGroups: (records) => sortRequestGroups(records),
      sortAcceptedRequests: (records) => [...records].sort(compareSavedRequestRecords),
      sortAcceptedMockRules: (records) => [...records].sort(compareMockRuleRecords),
      sortAcceptedScripts: (records) => [...records].sort(compareSavedScriptRecords),
    });
  }

  return {
    parseWorkspaceResourceBundleImportRequest,
    prepareWorkspaceResourceBundleImport,
  };
}

module.exports = {
  createResourceBundleImportService,
};
