function registerEnvironmentScriptRoutes(app, dependencies) {
  const {
    sendData,
    sendError,
    repositories,
    defaultWorkspaceId,
    validateEnvironmentInput,
    createEnvironmentRecord,
    normalizePersistedEnvironmentRecord,
    presentEnvironmentRecord,
    summarizePresentedEnvironmentRecord,
    listWorkspaceEnvironmentRecords,
    upsertWorkspaceEnvironmentRecord,
    reconcileWorkspaceEnvironmentDefaults,
    validateSavedScriptInput,
    createSavedScriptRecord,
    normalizePersistedSavedScriptRecord,
    listWorkspaceSavedScriptRecords,
    listSystemScriptTemplates,
    readSystemScriptTemplate,
  } = dependencies;
  const environmentRepository = repositories.resources.environments;
  const scriptRepository = repositories.resources.scripts;

  app.get('/api/workspaces/:workspaceId/environments', (req, res) => {
    try {
      const items = listWorkspaceEnvironmentRecords(req.params.workspaceId)
        .map((record) => summarizePresentedEnvironmentRecord(record));
      return sendData(res, { items });
    } catch (error) {
      return sendError(res, 500, 'environment_list_failed', error.message);
    }
  });

  app.post('/api/workspaces/:workspaceId/environments', (req, res) => {
    const input = req.body?.environment;
    const validationError = validateEnvironmentInput(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_environment', validationError);
    }

    if (typeof input?.id === 'string' && input.id.trim().length > 0) {
      return sendError(res, 400, 'environment_create_requires_new_identity', 'Use the update route for an existing environment id.', {
        environmentId: input.id,
      });
    }

    try {
      const candidateRecord = createEnvironmentRecord(input, null, req.params.workspaceId);
      const environment = upsertWorkspaceEnvironmentRecord(
        req.params.workspaceId,
        candidateRecord,
        input?.isDefault === true ? candidateRecord.id : null,
      );

      return sendData(res, { environment: presentEnvironmentRecord(environment) }, 201);
    } catch (error) {
      return sendError(res, 500, 'environment_create_failed', error.message);
    }
  });

  app.get('/api/environments/:environmentId', (req, res) => {
    try {
      const environment = normalizePersistedEnvironmentRecord(
        environmentRepository.read(req.params.environmentId),
      );

      if (!environment) {
        return sendError(res, 404, 'environment_not_found', 'Environment was not found.', {
          environmentId: req.params.environmentId,
        });
      }

      return sendData(res, { environment: presentEnvironmentRecord(environment) });
    } catch (error) {
      return sendError(res, 500, 'environment_detail_failed', error.message, {
        environmentId: req.params.environmentId,
      });
    }
  });

  app.patch('/api/environments/:environmentId', (req, res) => {
    const input = req.body?.environment;
    const validationError = validateEnvironmentInput(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_environment', validationError, {
        environmentId: req.params.environmentId,
      });
    }

    try {
      const existingRecord = normalizePersistedEnvironmentRecord(
        environmentRepository.read(req.params.environmentId),
      );

      if (!existingRecord) {
        return sendError(res, 404, 'environment_not_found', 'Environment was not found.', {
          environmentId: req.params.environmentId,
        });
      }

      const candidateRecord = createEnvironmentRecord(
        {
          ...input,
          id: req.params.environmentId,
        },
        existingRecord,
        existingRecord.workspaceId || defaultWorkspaceId,
      );
      const environment = upsertWorkspaceEnvironmentRecord(
        existingRecord.workspaceId || defaultWorkspaceId,
        candidateRecord,
        input?.isDefault === true ? candidateRecord.id : null,
      );

      return sendData(res, { environment: presentEnvironmentRecord(environment) });
    } catch (error) {
      return sendError(res, 500, 'environment_update_failed', error.message, {
        environmentId: req.params.environmentId,
      });
    }
  });

  app.delete('/api/environments/:environmentId', (req, res) => {
    try {
      const existingRecord = normalizePersistedEnvironmentRecord(
        environmentRepository.read(req.params.environmentId),
      );

      if (!existingRecord) {
        return sendError(res, 404, 'environment_not_found', 'Environment was not found.', {
          environmentId: req.params.environmentId,
        });
      }

      environmentRepository.delete(req.params.environmentId);
      reconcileWorkspaceEnvironmentDefaults(existingRecord.workspaceId || defaultWorkspaceId);

      return sendData(res, { deletedEnvironmentId: req.params.environmentId });
    } catch (error) {
      return sendError(res, 500, 'environment_delete_failed', error.message, {
        environmentId: req.params.environmentId,
      });
    }
  });

  app.get('/api/workspaces/:workspaceId/scripts', (req, res) => {
    try {
      const items = listWorkspaceSavedScriptRecords(req.params.workspaceId);
      return sendData(res, { items });
    } catch (error) {
      return sendError(res, 500, 'script_list_failed', error.message);
    }
  });

  app.post('/api/workspaces/:workspaceId/scripts', (req, res) => {
    const input = req.body?.script;
    const validationError = validateSavedScriptInput(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_script', validationError);
    }

    if (typeof input?.id === 'string' && input.id.trim().length > 0) {
      return sendError(res, 400, 'script_create_requires_new_identity', 'Use the update route for an existing script id.', {
        scriptId: input.id,
      });
    }

    try {
      const script = createSavedScriptRecord(input, null, req.params.workspaceId);
      scriptRepository.save(script);
      return sendData(res, { script }, 201);
    } catch (error) {
      return sendError(res, 500, 'script_create_failed', error.message);
    }
  });

  app.get('/api/scripts/:scriptId', (req, res) => {
    try {
      const script = normalizePersistedSavedScriptRecord(
        scriptRepository.read(req.params.scriptId),
      );

      if (!script) {
        return sendError(res, 404, 'script_not_found', 'Saved script was not found.', {
          scriptId: req.params.scriptId,
        });
      }

      return sendData(res, { script });
    } catch (error) {
      return sendError(res, 500, 'script_detail_failed', error.message, {
        scriptId: req.params.scriptId,
      });
    }
  });

  app.patch('/api/scripts/:scriptId', (req, res) => {
    const input = req.body?.script;
    const validationError = validateSavedScriptInput(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_script', validationError, {
        scriptId: req.params.scriptId,
      });
    }

    try {
      const existingRecord = normalizePersistedSavedScriptRecord(
        scriptRepository.read(req.params.scriptId),
      );

      if (!existingRecord) {
        return sendError(res, 404, 'script_not_found', 'Saved script was not found.', {
          scriptId: req.params.scriptId,
        });
      }

      const script = createSavedScriptRecord(
        {
          ...input,
          id: req.params.scriptId,
        },
        existingRecord,
        existingRecord.workspaceId || defaultWorkspaceId,
      );
      scriptRepository.save(script);
      return sendData(res, { script });
    } catch (error) {
      return sendError(res, 500, 'script_update_failed', error.message, {
        scriptId: req.params.scriptId,
      });
    }
  });

  app.delete('/api/scripts/:scriptId', (req, res) => {
    try {
      const deleted = scriptRepository.delete(req.params.scriptId);

      if (!deleted) {
        return sendError(res, 404, 'script_not_found', 'Saved script was not found.', {
          scriptId: req.params.scriptId,
        });
      }

      return sendData(res, { deletedScriptId: req.params.scriptId });
    } catch (error) {
      return sendError(res, 500, 'script_delete_failed', error.message, {
        scriptId: req.params.scriptId,
      });
    }
  });

  app.get('/api/script-templates', (req, res) => {
    try {
      return sendData(res, { items: listSystemScriptTemplates() });
    } catch (error) {
      return sendError(res, 500, 'script_template_list_failed', error.message);
    }
  });

  app.get('/api/script-templates/:templateId', (req, res) => {
    try {
      const template = readSystemScriptTemplate(req.params.templateId);

      if (!template) {
        return sendError(res, 404, 'script_template_not_found', 'Script template was not found.', {
          templateId: req.params.templateId,
        });
      }

      return sendData(res, { template });
    } catch (error) {
      return sendError(res, 500, 'script_template_detail_failed', error.message, {
        templateId: req.params.templateId,
      });
    }
  });
}

module.exports = {
  registerEnvironmentScriptRoutes,
};

