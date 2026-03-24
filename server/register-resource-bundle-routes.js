function registerResourceBundleRoutes(app, dependencies) {
  const {
    sendData,
    sendError,
    resourceStorage,
    defaultWorkspaceId,
    buildAuthoredResourceBundle,
    normalizePersistedRequestRecord,
    reconcileWorkspaceRequestPlacementState,
    serializeRequestRecordForBundle,
    listWorkspaceMockRuleRecords,
    listWorkspaceSavedScriptRecords,
    collectRequestBundleSavedScripts,
    parseWorkspaceResourceBundleImportRequest,
    prepareWorkspaceResourceBundleImport,
  } = dependencies;

  app.get('/api/workspaces/:workspaceId/resource-bundle', (req, res) => {
    try {
      const {
        collections,
        requestGroups,
        requests,
      } = reconcileWorkspaceRequestPlacementState(req.params.workspaceId);
      const bundle = buildAuthoredResourceBundle({
        workspaceId: req.params.workspaceId,
        collections,
        requestGroups,
        requests: requests.map((requestRecord) => serializeRequestRecordForBundle(requestRecord)),
        mockRules: listWorkspaceMockRuleRecords(req.params.workspaceId),
        scripts: listWorkspaceSavedScriptRecords(req.params.workspaceId),
      });

      return sendData(res, { bundle });
    } catch (error) {
      return sendError(res, 500, 'resource_bundle_export_failed', error.message, {
        workspaceId: req.params.workspaceId,
      });
    }
  });

  app.get('/api/requests/:requestId/resource-bundle', (req, res) => {
    try {
      const requestRecord = normalizePersistedRequestRecord(resourceStorage.read('request', req.params.requestId));

      if (!requestRecord) {
        return sendError(res, 404, 'request_not_found', 'Saved request was not found.', {
          requestId: req.params.requestId,
        });
      }

      const reconciledState = reconcileWorkspaceRequestPlacementState(requestRecord.workspaceId || defaultWorkspaceId);
      const reconciledRequest = reconciledState.requests.find((record) => record.id === req.params.requestId) ?? requestRecord;
      const collectionRecord = reconciledState.collections.find((record) => record.id === reconciledRequest.collectionId) ?? null;
      const requestGroupRecord = reconciledState.requestGroups.find((record) => record.id === reconciledRequest.requestGroupId) ?? null;
      const linkedScripts = collectRequestBundleSavedScripts(
        reconciledRequest,
        requestRecord.workspaceId || defaultWorkspaceId,
      );

      const bundle = buildAuthoredResourceBundle({
        workspaceId: requestRecord.workspaceId || defaultWorkspaceId,
        collections: collectionRecord ? [collectionRecord] : [],
        requestGroups: requestGroupRecord ? [requestGroupRecord] : [],
        requests: [serializeRequestRecordForBundle(reconciledRequest)],
        mockRules: [],
        scripts: linkedScripts,
      });

      return sendData(res, { bundle });
    } catch (error) {
      return sendError(res, 500, 'resource_bundle_export_failed', error.message, {
        requestId: req.params.requestId,
      });
    }
  });

  app.post('/api/workspaces/:workspaceId/resource-bundle/import', (req, res) => {
    const bundle = parseWorkspaceResourceBundleImportRequest(req, res);

    if (!bundle) {
      return undefined;
    }

    try {
      const importPlan = prepareWorkspaceResourceBundleImport(bundle, req.params.workspaceId);

      for (const collectionRecord of importPlan.acceptedCollections) {
        resourceStorage.save('collection', collectionRecord);
      }

      for (const requestGroupRecord of importPlan.acceptedRequestGroups) {
        resourceStorage.save('request-group', requestGroupRecord);
      }

      for (const requestRecord of importPlan.acceptedRequests) {
        resourceStorage.save('request', requestRecord);
      }

      for (const mockRuleRecord of importPlan.acceptedMockRules) {
        resourceStorage.save('mock-rule', mockRuleRecord);
      }

      for (const scriptRecord of importPlan.acceptedScripts) {
        resourceStorage.save('script', scriptRecord);
      }

      return sendData(res, {
        result: {
          acceptedCollections: importPlan.acceptedCollections,
          acceptedRequestGroups: importPlan.acceptedRequestGroups,
          acceptedRequests: importPlan.acceptedRequests,
          acceptedMockRules: importPlan.acceptedMockRules,
          acceptedScripts: importPlan.acceptedScripts,
          rejected: importPlan.rejected,
          summary: importPlan.summary,
        },
      });
    } catch (error) {
      return sendError(res, 500, 'resource_bundle_import_failed', error.message, {
        workspaceId: req.params.workspaceId,
      });
    }
  });

  app.post('/api/workspaces/:workspaceId/resource-bundle/import-preview', (req, res) => {
    const bundle = parseWorkspaceResourceBundleImportRequest(req, res);

    if (!bundle) {
      return undefined;
    }

    try {
      const preview = prepareWorkspaceResourceBundleImport(bundle, req.params.workspaceId);

      return sendData(res, {
        preview: {
          rejected: preview.rejected,
          summary: preview.summary,
        },
      });
    } catch (error) {
      return sendError(res, 500, 'resource_bundle_import_preview_failed', error.message, {
        workspaceId: req.params.workspaceId,
      });
    }
  });
}

module.exports = {
  registerResourceBundleRoutes,
};
