const assert = require('node:assert/strict');
const {
  buildEnvironmentValueLookup,
  createEnvironmentResolutionSummary,
  resolveExecutionRequestWithEnvironment,
  sanitizeEnvironmentResolutionSummary,
  summarizeUnresolvedEnvironmentPlaceholders,
} = require('./environment-resolution');
const { createEnvironmentRecord, presentEnvironmentRecord } = require('./environment-record');

(function run() {
  const environment = createEnvironmentRecord({
    name: 'Local API',
    description: 'Local defaults',
    isDefault: true,
    variables: [
      {
        key: 'API_BASE',
        description: 'Base URL',
        isEnabled: true,
        isSecret: false,
        valueType: 'plain',
        value: 'http://localhost:5671',
      },
      {
        key: 'API_TOKEN',
        description: 'Secret token',
        isEnabled: true,
        isSecret: true,
        valueType: 'plain',
        replacementValue: 'secret-token',
      },
      {
        key: 'DISABLED_FLAG',
        description: 'Disabled value',
        isEnabled: false,
        isSecret: false,
        valueType: 'plain',
        value: 'off',
      },
    ],
  });

  const lookup = buildEnvironmentValueLookup(environment);
  assert.equal(lookup.get('api_base'), 'http://localhost:5671');
  assert.equal(lookup.get('api_token'), 'secret-token');
  assert.equal(lookup.has('disabled_flag'), false);

  const resolved = resolveExecutionRequestWithEnvironment({
    method: 'POST',
    url: '{{API_BASE}}/users',
    params: [{ id: 'param-1', key: 'token', value: '{{api_token}}', enabled: true }],
    headers: [{ id: 'header-1', key: 'Authorization', value: 'Bearer {{API_TOKEN}}', enabled: true }],
    bodyMode: 'json',
    bodyText: '{"base":"{{API_BASE}}"}',
    formBody: [],
    multipartBody: [],
    auth: {
      type: 'api-key',
      bearerToken: '',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: 'x-api-key',
      apiKeyValue: '{{api_token}}',
      apiKeyPlacement: 'header',
    },
    selectedEnvironmentId: environment.id,
  }, environment);

  assert.equal(resolved.request.url, 'http://localhost:5671/users');
  assert.equal(resolved.request.params[0].value, 'secret-token');
  assert.equal(resolved.request.headers[0].value, 'Bearer secret-token');
  assert.equal(resolved.request.bodyText, '{"base":"http://localhost:5671"}');
  assert.equal(resolved.request.auth.apiKeyValue, 'secret-token');
  assert.equal(resolved.unresolved.length, 0);
  assert.equal(resolved.resolvedPlaceholderCount, 5);
  assert.deepEqual(resolved.affectedInputAreas, ['url', 'params', 'headers', 'body', 'auth']);

  const resolvedSummary = createEnvironmentResolutionSummary({
    selectedEnvironmentId: environment.id,
    resolvedPlaceholderCount: resolved.resolvedPlaceholderCount,
    unresolved: resolved.unresolved,
    affectedInputAreas: resolved.affectedInputAreas,
  });

  assert.deepEqual(resolvedSummary, {
    status: 'resolved',
    summary: 'Resolved 5 environment placeholder(s) in url, params, headers, body, and auth.',
    resolvedPlaceholderCount: 5,
    unresolvedPlaceholderCount: 0,
    affectedInputAreas: ['url', 'params', 'headers', 'body', 'auth'],
  });

  const unresolved = resolveExecutionRequestWithEnvironment({
    method: 'POST',
    url: '{{MISSING_BASE}}/users',
    params: [{ id: 'param-1', key: 'mode', value: '{{DISABLED_FLAG}}', enabled: true }],
    headers: [{ id: 'header-1', key: 'X-Skip', value: '{{IGNORED}}', enabled: false }],
    bodyMode: 'json',
    bodyText: '{"base":"{{MISSING_BASE}}"}',
    formBody: [],
    multipartBody: [],
    auth: {
      type: 'bearer',
      bearerToken: '{{API_TOKEN}}',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    },
  }, environment);

  assert.equal(unresolved.unresolved.length, 3);
  assert.equal(unresolved.resolvedPlaceholderCount, 1);
  assert.deepEqual(unresolved.affectedInputAreas, ['url', 'params', 'body', 'auth']);
  assert.equal(
    summarizeUnresolvedEnvironmentPlaceholders(unresolved.unresolved).includes('{{MISSING_BASE}} in url'),
    true,
  );
  assert.equal(unresolved.request.auth.bearerToken, 'secret-token');
  assert.equal(unresolved.request.headers[0].value, '{{IGNORED}}');

  const unresolvedSummary = createEnvironmentResolutionSummary({
    selectedEnvironmentId: null,
    resolvedPlaceholderCount: unresolved.resolvedPlaceholderCount,
    unresolved: unresolved.unresolved,
    affectedInputAreas: unresolved.affectedInputAreas,
  });

  assert.deepEqual(unresolvedSummary, {
    status: 'blocked-unresolved-placeholders',
    summary: 'Environment resolution left 3 unresolved placeholder(s) in url, params, body, and auth.',
    resolvedPlaceholderCount: 1,
    unresolvedPlaceholderCount: 3,
    affectedInputAreas: ['url', 'params', 'body', 'auth'],
  });

  const missingEnvironmentSummary = createEnvironmentResolutionSummary({
    selectedEnvironmentId: 'environment-missing',
    missingEnvironmentReference: true,
  });
  assert.equal(missingEnvironmentSummary.status, 'blocked-missing-environment');
  assert.equal(missingEnvironmentSummary.summary, 'Selected environment was not found at execution time.');
  assert.equal(missingEnvironmentSummary.resolvedPlaceholderCount, 0);
  assert.equal(missingEnvironmentSummary.unresolvedPlaceholderCount, 0);
  assert.deepEqual(missingEnvironmentSummary.affectedInputAreas, []);

  const invalidJsonSummary = createEnvironmentResolutionSummary({
    selectedEnvironmentId: environment.id,
    resolvedPlaceholderCount: 1,
    affectedInputAreas: ['body'],
    invalidResolvedJson: true,
  });
  assert.deepEqual(invalidJsonSummary, {
    status: 'blocked-invalid-resolved-json',
    summary: 'Environment resolution updated the request body but produced invalid JSON content.',
    resolvedPlaceholderCount: 1,
    unresolvedPlaceholderCount: 0,
    affectedInputAreas: ['body'],
  });

  assert.deepEqual(
    sanitizeEnvironmentResolutionSummary({
      status: 'resolved',
      summary: 'Resolved 1 environment placeholder(s) in url.',
      resolvedPlaceholderCount: 1.8,
      unresolvedPlaceholderCount: -4,
      affectedInputAreas: ['url', 'unsupported', 'url'],
    }),
    {
      status: 'resolved',
      summary: 'Resolved 1 environment placeholder(s) in url.',
      resolvedPlaceholderCount: 1,
      unresolvedPlaceholderCount: 0,
      affectedInputAreas: ['url'],
    },
  );
  assert.equal(sanitizeEnvironmentResolutionSummary({ status: 'unknown', summary: 'bad' }), null);

  const presented = presentEnvironmentRecord(environment);
  assert.equal(presented.variables.find((row) => row.key === 'API_TOKEN')?.value, '');
  assert.equal(presented.variables.find((row) => row.key === 'API_TOKEN')?.hasStoredValue, true);
})();
