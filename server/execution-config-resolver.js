function createExecutionConfigResolver(dependencies = {}) {
  const {
    normalizeRequestScriptsState = (scripts) => scripts,
    normalizeAuthDefaults = (auth) => auth,
    normalizeScriptDefaults = (scripts) => scripts,
    normalizeRunConfig = (runConfig) => runConfig,
    normalizeScopeVariables = (rows) => (Array.isArray(rows) ? rows : []),
    workspaceGlobalConfig = {},
  } = dependencies;

  function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function mergeRunConfig(requestRunConfig, collectionRecord, requestGroupRecord) {
    return {
      ...normalizeRunConfig(workspaceGlobalConfig.runConfig),
      ...normalizeRunConfig(collectionRecord?.runConfig),
      ...normalizeRunConfig(requestGroupRecord?.runConfig),
      ...normalizeRunConfig(requestRunConfig),
    };
  }

  function mergeAuthDefaults(collectionRecord, requestGroupRecord) {
    const candidates = [
      workspaceGlobalConfig.authDefaults,
      collectionRecord?.authDefaults,
      requestGroupRecord?.authDefaults,
    ].map((candidate) => normalizeAuthDefaults(candidate));

    return candidates.reduce((acc, candidate) => {
      if (!candidate || typeof candidate !== 'object') {
        return acc;
      }

      if (candidate.type !== 'none') {
        return {
          ...acc,
          ...candidate,
        };
      }

      return acc;
    }, normalizeAuthDefaults(null));
  }

  function applyMergedAuthDefaults(requestAuth, mergedAuthDefaults) {
    const normalizedRequestAuth = normalizeAuthDefaults(requestAuth);

    if (!mergedAuthDefaults || mergedAuthDefaults.type === 'none') {
      return normalizedRequestAuth;
    }

    if (normalizedRequestAuth.type === 'none') {
      return {
        ...mergedAuthDefaults,
      };
    }

    if (normalizedRequestAuth.type !== mergedAuthDefaults.type) {
      return normalizedRequestAuth;
    }

    return {
      ...normalizedRequestAuth,
      bearerToken: normalizedRequestAuth.bearerToken || mergedAuthDefaults.bearerToken,
      basicUsername: normalizedRequestAuth.basicUsername || mergedAuthDefaults.basicUsername,
      basicPassword: normalizedRequestAuth.basicPassword || mergedAuthDefaults.basicPassword,
      apiKeyName: normalizedRequestAuth.apiKeyName || mergedAuthDefaults.apiKeyName,
      apiKeyValue: normalizedRequestAuth.apiKeyValue || mergedAuthDefaults.apiKeyValue,
      apiKeyPlacement: normalizedRequestAuth.apiKeyPlacement || mergedAuthDefaults.apiKeyPlacement,
    };
  }

  function mergeScriptDefaults(collectionRecord, requestGroupRecord) {
    const workspaceDefaults = normalizeScriptDefaults(workspaceGlobalConfig.scriptDefaults);
    const collectionDefaults = normalizeScriptDefaults(collectionRecord?.scriptDefaults);
    const requestGroupDefaults = normalizeScriptDefaults(requestGroupRecord?.scriptDefaults);

    return {
      preRequest: normalizeText(requestGroupDefaults.preRequest)
        || normalizeText(collectionDefaults.preRequest)
        || normalizeText(workspaceDefaults.preRequest),
      postResponse: normalizeText(requestGroupDefaults.postResponse)
        || normalizeText(collectionDefaults.postResponse)
        || normalizeText(workspaceDefaults.postResponse),
      tests: normalizeText(requestGroupDefaults.tests)
        || normalizeText(collectionDefaults.tests)
        || normalizeText(workspaceDefaults.tests),
    };
  }

  function applyMergedScriptDefaults(requestScripts, mergedScriptDefaults) {
    const normalizedScripts = normalizeRequestScriptsState(requestScripts);
    const stageFieldById = {
      'pre-request': 'preRequest',
      'post-response': 'postResponse',
      tests: 'tests',
    };

    const nextScripts = {
      ...normalizedScripts,
    };

    for (const [stageId, field] of Object.entries(stageFieldById)) {
      const binding = normalizedScripts[field];

      if (!binding || binding.mode !== 'inline') {
        continue;
      }

      const inheritedSourceCode = mergedScriptDefaults[field];

      if (!inheritedSourceCode || normalizeText(binding.sourceCode).length > 0) {
        continue;
      }

      nextScripts[field] = {
        ...binding,
        sourceCode: inheritedSourceCode,
      };
    }

    return nextScripts;
  }

  function toVariableEntries(rows, sourceLabel) {
    return normalizeScopeVariables(rows)
      .filter((row) => row.isEnabled !== false)
      .map((row) => ({
        id: row.id,
        key: normalizeText(row.key),
        value: typeof row.value === 'string' ? row.value : '',
        isEnabled: row.isEnabled !== false,
        isSecret: row.isSecret === true,
        sourceLabel,
      }))
      .filter((row) => row.key.length > 0);
  }

  function mergeVariableRows(selectedEnvironmentRecord, collectionRecord, requestGroupRecord) {
    const mergedByKey = new Map();

    const sourcesInPrecedenceOrder = [
      ...toVariableEntries(workspaceGlobalConfig.variables, 'workspace-global'),
      ...toVariableEntries(selectedEnvironmentRecord?.variables, 'environment'),
      ...toVariableEntries(collectionRecord?.variables, 'collection'),
      ...toVariableEntries(requestGroupRecord?.variables, 'request-group'),
    ];

    for (const row of sourcesInPrecedenceOrder) {
      mergedByKey.set(row.key.toLowerCase(), row);
    }

    return [...mergedByKey.values()].map((row) => ({
      id: row.id || `effective-${row.key.toLowerCase()}`,
      key: row.key,
      value: row.value,
      isEnabled: true,
      ...(row.isSecret ? { isSecret: true } : {}),
    }));
  }

  function applyExecutionDefaults(request, options = {}) {
    const collectionRecord = options.collectionRecord ?? null;
    const requestGroupRecord = options.requestGroupRecord ?? null;
    const mergedAuthDefaults = mergeAuthDefaults(collectionRecord, requestGroupRecord);
    const mergedScriptDefaults = mergeScriptDefaults(collectionRecord, requestGroupRecord);

    return {
      ...request,
      auth: applyMergedAuthDefaults(request.auth, mergedAuthDefaults),
      scripts: applyMergedScriptDefaults(request.scripts, mergedScriptDefaults),
      runConfig: mergeRunConfig(request.runConfig, collectionRecord, requestGroupRecord),
    };
  }

  function createEffectiveEnvironmentContext(options = {}) {
    const workspaceId = normalizeText(options.workspaceId) || 'local-workspace';
    const selectedEnvironmentRecord = options.selectedEnvironmentRecord ?? null;
    const collectionRecord = options.collectionRecord ?? null;
    const requestGroupRecord = options.requestGroupRecord ?? null;
    const mergedVariables = mergeVariableRows(selectedEnvironmentRecord, collectionRecord, requestGroupRecord);

    if (!selectedEnvironmentRecord && mergedVariables.length === 0) {
      return {
        environmentRecord: null,
        selectedEnvironmentId: null,
        selectedEnvironmentLabel: 'No environment selected',
      };
    }

    if (selectedEnvironmentRecord) {
      return {
        environmentRecord: {
          ...selectedEnvironmentRecord,
          variables: mergedVariables,
        },
        selectedEnvironmentId: selectedEnvironmentRecord.id,
        selectedEnvironmentLabel: selectedEnvironmentRecord.name || 'Selected environment',
      };
    }

    return {
      environmentRecord: {
        id: 'inherited-defaults',
        workspaceId,
        name: 'Inherited defaults',
        variables: mergedVariables,
      },
      selectedEnvironmentId: 'inherited-defaults',
      selectedEnvironmentLabel: 'Inherited defaults',
    };
  }

  return {
    applyExecutionDefaults,
    createEffectiveEnvironmentContext,
  };
}

module.exports = {
  createExecutionConfigResolver,
};

