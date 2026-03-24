function registerMockRuleRoutes(app, dependencies) {
  const {
    sendData,
    sendError,
    resourceStorage,
    defaultWorkspaceId,
    buildAuthoredResourceBundle,
    validateMockRuleInput,
    createMockRuleRecord,
    normalizePersistedMockRuleRecord,
    listWorkspaceMockRuleRecords,
  } = dependencies;

  app.get('/api/workspaces/:workspaceId/mock-rules', (req, res) => {
    try {
      const items = listWorkspaceMockRuleRecords(req.params.workspaceId);
      return sendData(res, { items });
    } catch (error) {
      return sendError(res, 500, 'mock_rule_list_failed', error.message);
    }
  });

  app.post('/api/workspaces/:workspaceId/mock-rules', (req, res) => {
    const input = req.body?.rule;
    const validationError = validateMockRuleInput(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_mock_rule', validationError);
    }

    try {
      const rule = createMockRuleRecord(input, null, req.params.workspaceId);
      resourceStorage.save('mock-rule', rule);
      return sendData(res, { rule }, 201);
    } catch (error) {
      return sendError(res, 500, 'mock_rule_create_failed', error.message);
    }
  });

  app.get('/api/mock-rules/:mockRuleId', (req, res) => {
    try {
      const rule = normalizePersistedMockRuleRecord(
        resourceStorage.read('mock-rule', req.params.mockRuleId),
      );

      if (!rule) {
        return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
          mockRuleId: req.params.mockRuleId,
        });
      }

      return sendData(res, { rule });
    } catch (error) {
      return sendError(res, 500, 'mock_rule_detail_failed', error.message, {
        mockRuleId: req.params.mockRuleId,
      });
    }
  });

  app.patch('/api/mock-rules/:mockRuleId', (req, res) => {
    const input = req.body?.rule;
    const validationError = validateMockRuleInput(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_mock_rule', validationError, {
        mockRuleId: req.params.mockRuleId,
      });
    }

    try {
      const existingRule = normalizePersistedMockRuleRecord(
        resourceStorage.read('mock-rule', req.params.mockRuleId),
      );

      if (!existingRule) {
        return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
          mockRuleId: req.params.mockRuleId,
        });
      }

      const rule = createMockRuleRecord(input, existingRule, existingRule.workspaceId || defaultWorkspaceId);
      resourceStorage.save('mock-rule', rule);
      return sendData(res, { rule });
    } catch (error) {
      return sendError(res, 500, 'mock_rule_update_failed', error.message, {
        mockRuleId: req.params.mockRuleId,
      });
    }
  });

  app.delete('/api/mock-rules/:mockRuleId', (req, res) => {
    try {
      const deleted = resourceStorage.delete('mock-rule', req.params.mockRuleId);

      if (!deleted) {
        return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
          mockRuleId: req.params.mockRuleId,
        });
      }

      return sendData(res, { deletedRuleId: req.params.mockRuleId });
    } catch (error) {
      return sendError(res, 500, 'mock_rule_delete_failed', error.message, {
        mockRuleId: req.params.mockRuleId,
      });
    }
  });

  app.post('/api/mock-rules/:mockRuleId/enable', (req, res) => {
    try {
      const existingRule = normalizePersistedMockRuleRecord(
        resourceStorage.read('mock-rule', req.params.mockRuleId),
      );

      if (!existingRule) {
        return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
          mockRuleId: req.params.mockRuleId,
        });
      }

      const rule = createMockRuleRecord(
        {
          ...existingRule,
          enabled: true,
        },
        existingRule,
        existingRule.workspaceId || defaultWorkspaceId,
      );
      resourceStorage.save('mock-rule', rule);
      return sendData(res, { rule });
    } catch (error) {
      return sendError(res, 500, 'mock_rule_enable_failed', error.message, {
        mockRuleId: req.params.mockRuleId,
      });
    }
  });

  app.post('/api/mock-rules/:mockRuleId/disable', (req, res) => {
    try {
      const existingRule = normalizePersistedMockRuleRecord(
        resourceStorage.read('mock-rule', req.params.mockRuleId),
      );

      if (!existingRule) {
        return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
          mockRuleId: req.params.mockRuleId,
        });
      }

      const rule = createMockRuleRecord(
        {
          ...existingRule,
          enabled: false,
        },
        existingRule,
        existingRule.workspaceId || defaultWorkspaceId,
      );
      resourceStorage.save('mock-rule', rule);
      return sendData(res, { rule });
    } catch (error) {
      return sendError(res, 500, 'mock_rule_disable_failed', error.message, {
        mockRuleId: req.params.mockRuleId,
      });
    }
  });

  app.get('/api/mock-rules/:mockRuleId/resource-bundle', (req, res) => {
    try {
      const mockRule = normalizePersistedMockRuleRecord(
        resourceStorage.read('mock-rule', req.params.mockRuleId),
      );

      if (!mockRule) {
        return sendError(res, 404, 'mock_rule_not_found', 'Mock rule was not found.', {
          mockRuleId: req.params.mockRuleId,
        });
      }

      const bundle = buildAuthoredResourceBundle({
        workspaceId: mockRule.workspaceId || defaultWorkspaceId,
        collections: [],
        requestGroups: [],
        requests: [],
        mockRules: [mockRule],
        scripts: [],
      });

      return sendData(res, { bundle });
    } catch (error) {
      return sendError(res, 500, 'resource_bundle_export_failed', error.message, {
        mockRuleId: req.params.mockRuleId,
      });
    }
  });
}

module.exports = {
  registerMockRuleRoutes,
};
