const assert = require('node:assert/strict');
const { createRuntimePresentationService } = require('./runtime-presentation-service');

function createService() {
  return createRuntimePresentationService({
    sanitizeEnvironmentResolutionSummary: (summary) => summary || null,
    createRequestSummary: (method, url) => `${method} ${url}`,
    runtimeRequestSnapshotSchemaVersion: 1,
  });
}

function testPersistedRequestSnapshotRedactsSensitiveFields() {
  const service = createService();
  const snapshot = service.createPersistedRequestSnapshotSafely(
    {
      id: 'request-1',
      name: 'Health check',
      method: 'POST',
      url: 'https://example.test/token',
      selectedEnvironmentId: 'env-1',
      selectedEnvironmentLabel: 'Local',
      headers: [
        { key: 'Authorization', value: 'Bearer secret-token', enabled: true },
        { key: 'X-Trace-Id', value: 'trace-123', enabled: true },
      ],
      params: [
        { key: 'api_key', value: 'hidden-value', enabled: true },
        { key: 'debug', value: '1', enabled: true },
      ],
      bodyMode: 'json',
      bodyText: JSON.stringify({ api_key: 'hidden-value', nested: { trace: 'trace-123' } }),
      auth: { type: 'bearer', bearerToken: 'secret-token' },
      collectionName: 'Saved Requests',
      requestGroupName: 'Health',
      environmentResolutionSummary: { selectedEnvironmentId: 'env-1' },
    },
    new URL('https://example.test/token?api_key=hidden-value&debug=1'),
  );

  assert.equal(snapshot.url, 'https://example.test/token?api_key=%5Bredacted%5D&debug=1');
  assert.equal(snapshot.headers[0].value, '[redacted]');
  assert.match(snapshot.bodyText, /\[redacted\]/);
  assert.equal(snapshot.auth.bearerToken, '[redacted]');
  assert.deepEqual(snapshot.environmentResolutionSummary, { selectedEnvironmentId: 'env-1' });
}

function testCreateExecutionObservationUsesFallbackPreviewSummary() {
  const service = createService();
  const execution = service.createExecutionObservation({
    executionId: 'execution-1',
    executionOutcome: 'Blocked',
    responseStatus: null,
    responseHeaders: [],
    responseBodyPreview: '',
    responsePreviewLength: 0,
    responsePreviewTruncated: false,
    startedAt: '2026-03-25T00:00:00.000Z',
    completedAt: '2026-03-25T00:00:01.000Z',
    durationMs: 1000,
    requestSnapshot: {
      method: 'GET',
      url: 'https://example.test/health',
      params: [],
      headers: [],
      bodyMode: 'none',
      auth: { type: 'none' },
      sourceLabel: 'Saved request snapshot',
    },
    consoleSummary: '',
    consoleEntries: [],
    consoleLogCount: 0,
    consoleWarningCount: 0,
    testsSummary: '',
    testEntries: [],
    stageSummaries: [],
    errorCode: 'environment_resolution_unresolved',
    errorSummary: 'Unresolved placeholders remain.',
  });

  assert.equal(execution.responseStatusLabel, 'No response');
  assert.match(execution.responsePreviewPolicy, /run ended as blocked/i);
  assert.equal(execution.requestSnapshotSummary, 'GET https://example.test/health executed from saved request snapshot with 0 params · 0 headers · No body · No auth.');
  assert.equal(execution.errorCode, 'environment_resolution_unresolved');
}

(function run() {
  testPersistedRequestSnapshotRedactsSensitiveFields();
  testCreateExecutionObservationUsesFallbackPreviewSummary();
})();
