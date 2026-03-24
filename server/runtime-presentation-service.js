function createRuntimePresentationService(dependencies) {
  const {
    sanitizeEnvironmentResolutionSummary,
    createRequestSummary,
    runtimeRequestSnapshotSchemaVersion,
  } = dependencies;

  const SENSITIVE_FIELD_PATTERN = /authorization|cookie|token|secret|password|api[-_]?key|session|credential|bearer/i;

  function readPersistedEnvironmentResolutionSummary(summary) {
    return sanitizeEnvironmentResolutionSummary(summary) || undefined;
  }

  function truncatePreview(value, maxLength = 400) {
    if (typeof value !== 'string') {
      return '';
    }

    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }

  function isSensitiveFieldName(name = '') {
    return SENSITIVE_FIELD_PATTERN.test(name);
  }

  function sanitizeFieldValue(name, value) {
    if (typeof value !== 'string') {
      return '';
    }

    return isSensitiveFieldName(name) ? '[redacted]' : truncatePreview(value, 240);
  }

  function createSanitizedRows(rows = []) {
    return (rows || [])
      .filter((row) => row && row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0)
      .map((row) => ({
        key: row.key,
        value: sanitizeFieldValue(row.key, typeof row.value === 'string' ? row.value : ''),
      }));
  }

  function redactStructuredJson(value, keyHint = '') {
    if (Array.isArray(value)) {
      return value.map((item) => redactStructuredJson(item, keyHint));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [
          key,
          redactStructuredJson(nestedValue, key),
        ]),
      );
    }

    if (typeof value === 'string') {
      return sanitizeFieldValue(keyHint, value);
    }

    return value;
  }

  function createPersistedBodyPreview(request) {
    switch (request.bodyMode) {
      case 'json': {
        const bodyText = typeof request.bodyText === 'string' ? request.bodyText.trim() : '';

        if (bodyText.length === 0) {
          return '';
        }

        try {
          const parsedJson = JSON.parse(bodyText);
          return truncatePreview(JSON.stringify(redactStructuredJson(parsedJson), null, 2), 2000);
        } catch {
          return 'JSON body preview is unavailable because the persisted runtime snapshot keeps only bounded redacted summaries.';
        }
      }
      case 'text':
        return typeof request.bodyText === 'string' && request.bodyText.trim().length > 0
          ? 'Text body preview is omitted by redacted-only runtime persistence.'
          : '';
      case 'form-urlencoded':
        return createSanitizedRows(request.formBody)
          .map((row) => `${row.key}=${row.value}`)
          .join('\n');
      case 'multipart-form-data':
        return createSanitizedRows(request.multipartBody)
          .map((row) => `${row.key}=${row.value}`)
          .join('\n');
      default:
        return '';
    }
  }

  function createPersistedAuthSnapshot(auth = {}) {
    const type = auth.type || 'none';

    if (type === 'bearer') {
      return {
        type,
        bearerToken: auth.bearerToken ? '[redacted]' : '',
        basicUsername: '',
        basicPassword: '',
        apiKeyName: '',
        apiKeyValue: '',
        apiKeyPlacement: 'header',
      };
    }

    if (type === 'basic') {
      return {
        type,
        bearerToken: '',
        basicUsername: auth.basicUsername ? truncatePreview(auth.basicUsername, 120) : '',
        basicPassword: auth.basicPassword ? '[redacted]' : '',
        apiKeyName: '',
        apiKeyValue: '',
        apiKeyPlacement: 'header',
      };
    }

    if (type === 'api-key') {
      return {
        type,
        bearerToken: '',
        basicUsername: '',
        basicPassword: '',
        apiKeyName: auth.apiKeyName || '',
        apiKeyValue: auth.apiKeyValue ? '[redacted]' : '',
        apiKeyPlacement: auth.apiKeyPlacement || 'header',
      };
    }

    return {
      type: 'none',
      bearerToken: '',
      basicUsername: '',
      basicPassword: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyPlacement: 'header',
    };
  }

  function createPersistedRequestSnapshot(request, targetUrl) {
    const persistedUrl = new URL(targetUrl.toString());
    const persistedParams = Array.from(persistedUrl.searchParams.entries()).map(([key, value]) => ({
      key,
      value: sanitizeFieldValue(key, value),
    }));
    const environmentResolutionSummary = readPersistedEnvironmentResolutionSummary(
      request?.environmentResolutionSummary,
    );
    const persistedSearch = new URLSearchParams();

    for (const row of persistedParams) {
      persistedSearch.append(row.key, row.value);
    }

    persistedUrl.search = persistedSearch.toString();
    persistedUrl.hash = '';

    return {
      snapshotKind: 'execution-request',
      snapshotSchemaVersion: runtimeRequestSnapshotSchemaVersion,
      name: typeof request.name === 'string' && request.name.trim().length > 0
        ? request.name.trim()
        : createRequestSummary(request.method, request.url),
      method: request.method,
      url: persistedUrl.toString(),
      params: persistedParams,
      headers: createSanitizedRows(request.headers),
      bodyMode: request.bodyMode || 'none',
      bodyText: createPersistedBodyPreview(request),
      auth: createPersistedAuthSnapshot(request.auth),
      requestId: request.id || null,
      environmentId: typeof request.selectedEnvironmentId === 'string' && request.selectedEnvironmentId.length > 0
        ? request.selectedEnvironmentId
        : null,
      environmentLabel: typeof request.selectedEnvironmentLabel === 'string' && request.selectedEnvironmentLabel.length > 0
        ? request.selectedEnvironmentLabel
        : 'No environment selected',
      collectionId: typeof request.collectionId === 'string' ? request.collectionId : '',
      collectionName: typeof request.collectionName === 'string' ? request.collectionName : '',
      requestGroupId: typeof request.requestGroupId === 'string' ? request.requestGroupId : '',
      requestGroupName: typeof request.requestGroupName === 'string'
        ? request.requestGroupName
        : (typeof request.folderName === 'string' ? request.folderName : ''),
      sourceLabel: request.id ? 'Saved request snapshot' : 'Ad hoc request snapshot',
      ...(environmentResolutionSummary ? { environmentResolutionSummary } : {}),
    };
  }

  function createPreviewSizeLabel(preview, emptyLabel = 'No preview stored') {
    if (typeof preview !== 'string' || preview.length === 0) {
      return emptyLabel;
    }

    return `${Buffer.byteLength(preview, 'utf8')} B preview`;
  }

  function createBodyModeSummary(bodyMode) {
    switch (bodyMode) {
      case 'json':
        return 'JSON body';
      case 'text':
        return 'Text body';
      case 'form-urlencoded':
        return 'Form body';
      case 'multipart-form-data':
        return 'Multipart body';
      default:
        return 'No body';
    }
  }

  function createAuthSummary(auth = createPersistedAuthSnapshot()) {
    switch (auth?.type) {
      case 'bearer':
        return 'Bearer auth';
      case 'basic':
        return 'Basic auth';
      case 'api-key':
        return auth.apiKeyPlacement === 'query' ? 'API key in query' : 'API key in header';
      default:
        return 'No auth';
    }
  }

  function createRequestInputSummary(requestSnapshot = {}) {
    const paramsCount = Array.isArray(requestSnapshot?.params) ? requestSnapshot.params.length : 0;
    const headerCount = Array.isArray(requestSnapshot?.headers) ? requestSnapshot.headers.length : 0;
    return `${paramsCount} params · ${headerCount} headers · ${createBodyModeSummary(requestSnapshot?.bodyMode)} · ${createAuthSummary(requestSnapshot?.auth)}`;
  }

  function createRequestSnapshotSummary(requestSnapshot = {}) {
    const method = typeof requestSnapshot?.method === 'string' && requestSnapshot.method.length > 0
      ? requestSnapshot.method
      : 'GET';
    const url = typeof requestSnapshot?.url === 'string' && requestSnapshot.url.length > 0
      ? requestSnapshot.url
      : 'request snapshot unavailable';
    const sourceLabel = typeof requestSnapshot?.sourceLabel === 'string' && requestSnapshot.sourceLabel.length > 0
      ? requestSnapshot.sourceLabel.toLowerCase()
      : 'request snapshot';

    return `${method} ${url} executed from ${sourceLabel} with ${createRequestInputSummary(requestSnapshot)}.`;
  }

  function createResponsePreviewPolicy({
    preview,
    redactionApplied,
    previewTruncated,
    absentSummary,
  }) {
    if (typeof preview !== 'string' || preview.length === 0) {
      return absentSummary || 'No response preview is available.';
    }

    if (previewTruncated) {
      return 'Preview is truncated at the bounded diagnostics limit before richer inspection is added.';
    }

    if (redactionApplied) {
      return 'Preview is redacted and bounded before persistence and downstream diagnostics surfaces.';
    }

    return 'Preview is bounded before richer diagnostics and raw payload inspection are added.';
  }

  function createPersistedRequestSnapshotSafely(request, targetUrl) {
    try {
      return createPersistedRequestSnapshot(request, targetUrl);
    } catch {
      const environmentResolutionSummary = readPersistedEnvironmentResolutionSummary(
        request?.environmentResolutionSummary,
      );

      return {
        snapshotKind: 'execution-request',
        snapshotSchemaVersion: runtimeRequestSnapshotSchemaVersion,
        name: typeof request?.name === 'string' && request.name.trim().length > 0
          ? request.name.trim()
          : createRequestSummary(request?.method || 'GET', request?.url || ''),
        method: request?.method || 'GET',
        url: typeof request?.url === 'string' && request.url.trim().length > 0
          ? truncatePreview(request.url.trim(), 2000)
          : 'request snapshot unavailable',
        params: createSanitizedRows(request?.params),
        headers: createSanitizedRows(request?.headers),
        bodyMode: request?.bodyMode || 'none',
        bodyText: createPersistedBodyPreview(request || {}),
        auth: createPersistedAuthSnapshot(request?.auth),
        requestId: request?.id || null,
        environmentId: typeof request?.selectedEnvironmentId === 'string' && request.selectedEnvironmentId.length > 0
          ? request.selectedEnvironmentId
          : null,
        environmentLabel: typeof request?.selectedEnvironmentLabel === 'string' && request.selectedEnvironmentLabel.length > 0
          ? request.selectedEnvironmentLabel
          : 'No environment selected',
        collectionId: typeof request?.collectionId === 'string' ? request.collectionId : '',
        collectionName: typeof request?.collectionName === 'string' ? request.collectionName : '',
        requestGroupId: typeof request?.requestGroupId === 'string' ? request.requestGroupId : '',
        requestGroupName: typeof request?.requestGroupName === 'string'
          ? request.requestGroupName
          : (typeof request?.folderName === 'string' ? request.folderName : ''),
        sourceLabel: request?.id ? 'Saved request snapshot' : 'Ad hoc request snapshot',
        ...(environmentResolutionSummary ? { environmentResolutionSummary } : {}),
      };
    }
  }

  function createExecutionObservation({
    executionId,
    executionOutcome,
    responseStatus,
    responseHeaders,
    responseBodyPreview,
    responsePreviewLength,
    responsePreviewTruncated,
    startedAt,
    completedAt,
    durationMs,
    requestSnapshot,
    consoleSummary,
    consoleEntries,
    consoleLogCount,
    consoleWarningCount,
    testsSummary,
    testEntries,
    stageSummaries,
    errorCode,
    errorSummary,
  }) {
    const requestParamCount = Array.isArray(requestSnapshot?.params) ? requestSnapshot.params.length : 0;
    const requestHeaderCount = Array.isArray(requestSnapshot?.headers) ? requestSnapshot.headers.length : 0;
    const environmentResolutionSummary = readPersistedEnvironmentResolutionSummary(
      requestSnapshot?.environmentResolutionSummary,
    );

    return {
      executionId,
      executionOutcome,
      responseStatus,
      responseStatusLabel: responseStatus === null ? 'No response' : `HTTP ${responseStatus}`,
      responseHeaders,
      responseHeadersSummary:
        responseHeaders.length > 0
          ? `${responseHeaders.length} response headers captured from the latest run.`
          : 'No response headers were captured.',
      responseBodyPreview,
      responseBodyHint:
        responseBodyPreview.length > 0
          ? `${responseBodyPreview.length} characters captured from the latest run preview.`
          : 'No response body preview was captured.',
      responsePreviewSizeLabel:
        typeof responsePreviewLength === 'number' && responsePreviewLength > 0
          ? `${responsePreviewLength} B response body`
          : createPreviewSizeLabel(
            responseBodyPreview,
            responseStatus === null ? 'No preview stored' : 'Empty preview',
          ),
      responsePreviewPolicy: createResponsePreviewPolicy({
        preview: responseBodyPreview,
        redactionApplied: false,
        previewTruncated: responsePreviewTruncated,
        absentSummary: executionOutcome === 'Succeeded'
          ? 'No response preview is available for this execution.'
          : `No response preview is available because the run ended as ${executionOutcome.toLowerCase()} before transport completed cleanly.`,
      }),
      startedAt,
      completedAt,
      durationMs,
      consoleSummary: consoleSummary || 'No console entries were captured for this run.',
      consoleEntries: consoleEntries || [],
      consoleLogCount: typeof consoleLogCount === 'number' ? consoleLogCount : (consoleEntries || []).length,
      consoleWarningCount: typeof consoleWarningCount === 'number' ? consoleWarningCount : 0,
      testsSummary: testsSummary || 'No tests were recorded for this run.',
      testEntries: testEntries || [],
      requestSnapshotSummary: createRequestSnapshotSummary(requestSnapshot),
      requestInputSummary: createRequestInputSummary(requestSnapshot),
      requestHeaderCount,
      requestParamCount,
      requestBodyMode: requestSnapshot?.bodyMode || 'none',
      authSummary: createAuthSummary(requestSnapshot?.auth),
      requestResourceId: typeof requestSnapshot?.requestId === 'string' && requestSnapshot.requestId.length > 0
        ? requestSnapshot.requestId
        : null,
      environmentId: typeof requestSnapshot?.environmentId === 'string' && requestSnapshot.environmentId.length > 0
        ? requestSnapshot.environmentId
        : null,
      environmentLabel: typeof requestSnapshot?.environmentLabel === 'string' && requestSnapshot.environmentLabel.length > 0
        ? requestSnapshot.environmentLabel
        : 'No environment selected',
      ...(environmentResolutionSummary ? { environmentResolutionSummary } : {}),
      requestCollectionName: requestSnapshot?.collectionName || undefined,
      requestGroupName: requestSnapshot?.requestGroupName || requestSnapshot?.folderName || undefined,
      requestSourceLabel: requestSnapshot?.sourceLabel || 'Runtime request snapshot',
      stageSummaries: stageSummaries || [],
      ...(errorCode ? { errorCode } : {}),
      ...(errorSummary ? { errorSummary } : {}),
    };
  }

  return {
    readPersistedEnvironmentResolutionSummary,
    truncatePreview,
    sanitizeFieldValue,
    redactStructuredJson,
    createPersistedAuthSnapshot,
    createPreviewSizeLabel,
    createRequestInputSummary,
    createRequestSnapshotSummary,
    createResponsePreviewPolicy,
    createPersistedRequestSnapshotSafely,
    createExecutionObservation,
  };
}

module.exports = {
  createRuntimePresentationService,
};
