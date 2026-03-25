const assert = require('node:assert/strict');
const { createExecutionConfigResolver } = require('./execution-config-resolver');
const {
  normalizeAuthDefaults,
  normalizeRunConfig,
  normalizeScopeVariables,
  normalizeScriptDefaults,
} = require('../storage/resource/request-placement-record');
const { normalizeRequestScriptsState } = require('../storage/resource/request-script-binding');

function createResolver(workspaceGlobalConfig = {}) {
  return createExecutionConfigResolver({
    normalizeRequestScriptsState,
    normalizeAuthDefaults,
    normalizeScriptDefaults,
    normalizeRunConfig,
    normalizeScopeVariables,
    workspaceGlobalConfig,
  });
}

function findVariableValue(rows, key) {
  return rows.find((row) => row.key === key)?.value;
}

(function testApplyExecutionDefaultsUsesRequestGroupOverCollectionAndGlobalDefaults() {
  const { applyExecutionDefaults } = createResolver({
    variables: [
      { key: 'GLOBAL_ONLY', value: 'global-only', isEnabled: true },
    ],
    authDefaults: {
      type: 'bearer',
      bearerToken: 'global-token',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    },
    scriptDefaults: {
      preRequest: 'global-pre',
      postResponse: 'global-post',
      tests: 'global-tests',
    },
    runConfig: {
      timeoutMs: 1000,
      retries: 0,
      strictSsl: true,
    },
  });

  const request = {
    auth: {
      type: 'none',
      bearerToken: '',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    },
    scripts: normalizeRequestScriptsState({
      activeStage: 'tests',
      preRequest: '',
      postResponse: '',
      tests: '',
    }),
    runConfig: {
      retries: 3,
    },
  };

  const collectionRecord = {
    scriptDefaults: {
      preRequest: 'collection-pre',
      postResponse: 'collection-post',
      tests: 'collection-tests',
    },
    authDefaults: {
      type: 'bearer',
      bearerToken: 'collection-token',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    },
    runConfig: {
      timeoutMs: 2000,
      retries: 1,
    },
  };
  const requestGroupRecord = {
    scriptDefaults: {
      preRequest: 'group-pre',
      postResponse: '',
      tests: 'group-tests',
    },
    authDefaults: {
      type: 'bearer',
      bearerToken: 'group-token',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    },
    runConfig: {
      retries: 2,
      traceEnabled: true,
    },
  };

  const resolved = applyExecutionDefaults(request, {
    collectionRecord,
    requestGroupRecord,
  });

  assert.equal(resolved.auth.type, 'bearer');
  assert.equal(resolved.auth.bearerToken, 'group-token');
  assert.equal(resolved.scripts.preRequest.mode, 'inline');
  assert.equal(resolved.scripts.preRequest.sourceCode, 'group-pre');
  assert.equal(resolved.scripts.postResponse.sourceCode, 'collection-post');
  assert.equal(resolved.scripts.tests.sourceCode, 'group-tests');
  assert.deepEqual(resolved.runConfig, {
    timeoutMs: 2000,
    retries: 3,
    strictSsl: true,
    traceEnabled: true,
  });
})();

(function testApplyExecutionDefaultsKeepsRequestAuthWhenProvided() {
  const { applyExecutionDefaults } = createResolver({
    authDefaults: {
      type: 'bearer',
      bearerToken: 'global-token',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    },
  });

  const request = {
    auth: {
      type: 'bearer',
      bearerToken: 'request-token',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    },
    scripts: normalizeRequestScriptsState({
      activeStage: 'tests',
      preRequest: '',
      postResponse: '',
      tests: '',
    }),
    runConfig: {},
  };

  const resolved = applyExecutionDefaults(request, {
    collectionRecord: null,
    requestGroupRecord: null,
  });

  assert.equal(resolved.auth.type, 'bearer');
  assert.equal(resolved.auth.bearerToken, 'request-token');
})();

(function testEffectiveEnvironmentContextMergesVariableScopesWithExpectedPrecedence() {
  const { createEffectiveEnvironmentContext } = createResolver({
    variables: [
      { key: 'SHARED_KEY', value: 'global', isEnabled: true },
      { key: 'GLOBAL_ONLY', value: 'global-only', isEnabled: true },
    ],
  });

  const context = createEffectiveEnvironmentContext({
    workspaceId: 'local-workspace',
    selectedEnvironmentRecord: {
      id: 'env-local',
      name: 'Local',
      variables: [
        { key: 'SHARED_KEY', value: 'environment', isEnabled: true },
        { key: 'ENV_ONLY', value: 'env-only', isEnabled: true },
      ],
    },
    collectionRecord: {
      variables: [
        { key: 'SHARED_KEY', value: 'collection', isEnabled: true },
        { key: 'COLLECTION_ONLY', value: 'collection-only', isEnabled: true },
      ],
    },
    requestGroupRecord: {
      variables: [
        { key: 'SHARED_KEY', value: 'group', isEnabled: true },
        { key: 'GROUP_ONLY', value: 'group-only', isEnabled: true },
      ],
    },
  });

  assert.equal(context.selectedEnvironmentId, 'env-local');
  assert.equal(context.selectedEnvironmentLabel, 'Local');
  assert.ok(context.environmentRecord);
  assert.equal(findVariableValue(context.environmentRecord.variables, 'SHARED_KEY'), 'group');
  assert.equal(findVariableValue(context.environmentRecord.variables, 'GROUP_ONLY'), 'group-only');
  assert.equal(findVariableValue(context.environmentRecord.variables, 'COLLECTION_ONLY'), 'collection-only');
  assert.equal(findVariableValue(context.environmentRecord.variables, 'ENV_ONLY'), 'env-only');
  assert.equal(findVariableValue(context.environmentRecord.variables, 'GLOBAL_ONLY'), 'global-only');
})();

(function testEffectiveEnvironmentContextCreatesInheritedDefaultsWhenNoEnvironmentSelected() {
  const { createEffectiveEnvironmentContext } = createResolver({
    variables: [
      { key: 'GLOBAL_ONLY', value: 'global-only', isEnabled: true },
    ],
  });

  const context = createEffectiveEnvironmentContext({
    workspaceId: 'local-workspace',
    selectedEnvironmentRecord: null,
    collectionRecord: {
      variables: [
        { key: 'COLLECTION_ONLY', value: 'collection-only', isEnabled: true },
      ],
    },
    requestGroupRecord: null,
  });

  assert.equal(context.selectedEnvironmentId, 'inherited-defaults');
  assert.equal(context.selectedEnvironmentLabel, 'Inherited defaults');
  assert.ok(context.environmentRecord);
  assert.equal(context.environmentRecord.name, 'Inherited defaults');
  assert.equal(findVariableValue(context.environmentRecord.variables, 'COLLECTION_ONLY'), 'collection-only');
  assert.equal(findVariableValue(context.environmentRecord.variables, 'GLOBAL_ONLY'), 'global-only');
})();
