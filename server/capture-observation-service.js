function createCaptureObservationService(dependencies) {
  const {
    randomUUID,
    defaultWorkspaceId,
    sanitizeFieldValue,
    truncatePreview,
    redactStructuredJson,
    cloneAuth,
    createExecutionRequestSeed,
  } = dependencies;

  function formatCaptureReceivedAtLabel(receivedAtIso) {
    return new Date(receivedAtIso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function createSanitizedCaptureHeaders(headers = {}) {
    return Object.fromEntries(
      Object.entries(headers).map(([key, value]) => {
        const normalizedValue = Array.isArray(value) ? value.join(', ') : String(value ?? '');
        return [key, sanitizeFieldValue(key, normalizedValue)];
      }),
    );
  }

  function createCapturedRequestBodyMode(contentType, parsedBody, rawBody) {
    const normalizedContentType = String(contentType || '').toLowerCase();
    const normalizedRawBody = typeof rawBody === 'string' ? rawBody.trim() : '';

    if (normalizedRawBody.length === 0 || normalizedRawBody === 'No Body or Binary') {
      return 'none';
    }

    if (normalizedContentType.includes('application/x-www-form-urlencoded')) {
      return 'text';
    }

    if (parsedBody && typeof parsedBody === 'object') {
      return 'json';
    }

    return normalizedContentType.includes('json') ? 'json' : 'text';
  }

  function createCapturedRequestBodyPreview(parsedBody, rawBody, contentType) {
    const normalizedContentType = String(contentType || '').toLowerCase();
    const normalizedRawBody = typeof rawBody === 'string' ? rawBody.trim() : '';

    if (normalizedRawBody.length === 0 || normalizedRawBody === 'No Body or Binary') {
      return '';
    }

    if (normalizedContentType.includes('application/x-www-form-urlencoded')) {
      const bodyEntries = parsedBody && typeof parsedBody === 'object'
        ? Object.entries(parsedBody)
        : Array.from(new URLSearchParams(normalizedRawBody).entries());

      return bodyEntries
        .map(([key, value]) => `${key}=${sanitizeFieldValue(key, String(value ?? ''))}`)
        .join('\n');
    }

    if (parsedBody && typeof parsedBody === 'object') {
      return truncatePreview(JSON.stringify(redactStructuredJson(parsedBody), null, 2), 2000);
    }

    if (normalizedContentType.includes('application/json')) {
      try {
        const parsedJson = JSON.parse(normalizedRawBody);
        return truncatePreview(JSON.stringify(redactStructuredJson(parsedJson), null, 2), 2000);
      } catch {
        return 'JSON body preview is unavailable because runtime persistence keeps only bounded redacted summaries.';
      }
    }

    return 'Text body preview is omitted by redacted-only runtime persistence.';
  }

  function createPersistedCapturedRequestRecord(req, evaluationResult) {
    const receivedAt = new Date().toISOString();
    const host = req.get('host') || 'localhost';
    const fullUrl = new URL(req.originalUrl, `${req.protocol}://${host}`).toString();
    const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : '');
    const contentType = req.headers['content-type'] || '';
    const sanitizedHeaders = createSanitizedCaptureHeaders(req.headers);
    const requestBodyMode = createCapturedRequestBodyMode(contentType, req.body, rawBody);

    return {
      id: randomUUID(),
      workspaceId: defaultWorkspaceId,
      method: req.method.toUpperCase(),
      url: fullUrl,
      path: req.originalUrl,
      statusCode: Number(evaluationResult.response.statusCode),
      matchedMockRuleId: evaluationResult.matchedRuleId || null,
      matchedMockRuleName: evaluationResult.matchedRuleName || null,
      requestHeadersJson: JSON.stringify(sanitizedHeaders),
      requestBodyPreview: createCapturedRequestBodyPreview(req.body, rawBody, contentType),
      requestBodyRedacted: true,
      receivedAt,
      mockOutcome: evaluationResult.outcome,
      mockEvaluationSummary: evaluationResult.mockEvaluationSummary || '',
      appliedDelayMs: typeof evaluationResult.appliedDelayMs === 'number' ? evaluationResult.appliedDelayMs : null,
      scopeLabel: 'All runtime captures',
      requestBodyMode,
    };
  }

  function createCaptureBodyPreviewPolicy(preview, wasRedacted) {
    if (typeof preview !== 'string' || preview.length === 0) {
      return 'No request body preview was stored for this inbound capture.';
    }

    return wasRedacted
      ? 'Request body preview is redacted and bounded before capture persistence.'
      : 'Request body preview is bounded before capture persistence.';
  }

  function createCaptureStorageSummary(headerCount, bodyPreview) {
    if (typeof bodyPreview === 'string' && bodyPreview.length > 0) {
      return `Persisted capture keeps ${headerCount} header(s) and one bounded request-body preview for observation and replay.`;
    }

    return `Persisted capture keeps ${headerCount} header(s) and no request-body preview for this inbound capture.`;
  }

  function createCaptureBodyHint(bodyModeHint, bodyPreview) {
    if (bodyModeHint === 'json' && bodyPreview.length > 0) {
      return `JSON body · ${bodyPreview.length} characters persisted in bounded summary form.`;
    }

    if (bodyModeHint === 'text' && bodyPreview.length > 0) {
      return 'Text body · bounded redacted preview';
    }

    return 'No request body preview was stored for this inbound capture.';
  }

  function createCaptureHeadersSummary(headers) {
    const headerNames = Object.keys(headers || {});
    const contentType = headers['content-type'] || headers['Content-Type'];

    if (headerNames.length === 0) {
      return 'No headers were persisted for this capture.';
    }

    if (contentType) {
      return `${headerNames.length} header(s) · ${contentType}`;
    }

    return `${headerNames.length} header(s) observed`;
  }

  function createCaptureMockSummary(mockOutcome, statusCode, matchedMockRuleId, matchedMockRuleName, evaluationSummary) {
    if (typeof evaluationSummary === 'string' && evaluationSummary.trim().length > 0) {
      return evaluationSummary;
    }

    if (mockOutcome === 'Mocked' && matchedMockRuleName) {
      return `Matched runtime mock rule "${matchedMockRuleName}" and returned HTTP ${statusCode ?? 200}.`;
    }

    if (mockOutcome === 'Mocked' && matchedMockRuleId) {
      return `Matched runtime mock rule ${matchedMockRuleId} and returned HTTP ${statusCode ?? 200}.`;
    }

    if (mockOutcome === 'Mocked') {
      return `Returned a local mock response with HTTP ${statusCode ?? 200}.`;
    }

    if (mockOutcome === 'Blocked') {
      return 'The runtime blocked response generation before a fallback response completed.';
    }

    if (mockOutcome === 'No rule matched') {
      return 'No enabled rule matched this capture, so the runtime fell back without richer diagnostics.';
    }

    return 'The runtime bypassed mock handling and continued through the fallback path.';
  }

  function createCaptureResponseSummary(mockOutcome, statusCode, appliedDelayMs) {
    if (mockOutcome === 'Mocked') {
      return `Response handling stayed inside the local mock path and returned HTTP ${statusCode ?? 200}.${appliedDelayMs > 0 ? ` Applied ${appliedDelayMs} ms fixed delay.` : ''}`;
    }

    if (mockOutcome === 'Blocked') {
      return 'The runtime blocked response generation before a mock or fallback response could complete.';
    }

    if (mockOutcome === 'No rule matched') {
      return 'No rule matched, so response handling fell back without richer transport detail in this slice.';
    }

    return 'The runtime let this request continue through the fallback handling path.';
  }

  function createCaptureTimelineEntries(captureRecord) {
    return [
      {
        id: `${captureRecord.id}-received`,
        title: 'Request received',
        summary: `${captureRecord.method} ${captureRecord.path} was captured at ${captureRecord.receivedAtLabel}.`,
      },
      {
        id: `${captureRecord.id}-mock`,
        title: 'Mock evaluation summary',
        summary: captureRecord.mockSummary,
      },
      {
        id: `${captureRecord.id}-response`,
        title: 'Response handling summary',
        summary: captureRecord.responseSummary,
      },
    ];
  }

  function createCapturedRequestRecord(runtimeRecord) {
    const normalizedUrl = new URL(runtimeRecord.url);
    const requestHeaders = runtimeRecord.requestHeaders || {};
    const requestHeadersEntries = Object.entries(requestHeaders).map(([key, value]) => ({ key, value }));
    const requestHeaderCount = requestHeadersEntries.length;
    const requestBodyPreview = runtimeRecord.requestBodyPreview || '';
    const bodyModeHint = runtimeRecord.requestBodyMode === 'json' ? 'json' : runtimeRecord.requestBodyMode === 'text' ? 'text' : 'none';
    const mockOutcome = runtimeRecord.mockOutcome || 'Mocked';
    const receivedAtIso = runtimeRecord.receivedAt;
    const receivedAtLabel = formatCaptureReceivedAtLabel(receivedAtIso);
    const host = normalizedUrl.host;
    const path = runtimeRecord.path || `${normalizedUrl.pathname}${normalizedUrl.search}`;
    const mockSummary = createCaptureMockSummary(
      mockOutcome,
      runtimeRecord.statusCode,
      runtimeRecord.matchedMockRuleId,
      runtimeRecord.matchedMockRuleName,
      runtimeRecord.mockEvaluationSummary,
    );
    const responseSummary = createCaptureResponseSummary(
      mockOutcome,
      runtimeRecord.statusCode,
      runtimeRecord.appliedDelayMs,
    );

    const captureRecord = {
      id: runtimeRecord.id,
      method: runtimeRecord.method,
      url: normalizedUrl.toString(),
      host,
      path,
      receivedAtIso,
      receivedAtLabel,
      statusCode: runtimeRecord.statusCode ?? null,
      bodyHint: createCaptureBodyHint(bodyModeHint, requestBodyPreview),
      requestSummary: `${runtimeRecord.method} ${path} was observed at ${host} as an inbound capture.`,
      headersSummary: createCaptureHeadersSummary(requestHeaders),
      bodyPreview: requestBodyPreview.length > 0
        ? requestBodyPreview
        : 'No request body preview was stored for this inbound capture.',
      bodyPreviewPolicy: createCaptureBodyPreviewPolicy(requestBodyPreview, runtimeRecord.requestBodyRedacted),
      storageSummary: createCaptureStorageSummary(requestHeaderCount, requestBodyPreview),
      bodyModeHint,
      requestHeaders: requestHeadersEntries,
      requestHeaderCount,
      mockOutcome,
      mockSummary,
      responseSummary,
      scopeLabel: runtimeRecord.scopeLabel || 'All runtime captures',
      timelineEntries: [],
      ...(runtimeRecord.matchedMockRuleName ? { mockRuleName: runtimeRecord.matchedMockRuleName } : {}),
      ...(typeof runtimeRecord.appliedDelayMs === 'number' && runtimeRecord.appliedDelayMs > 0
        ? { delayLabel: `Applied ${runtimeRecord.appliedDelayMs} ms delay` }
        : {}),
    };

    captureRecord.timelineEntries = createCaptureTimelineEntries(captureRecord);
    return captureRecord;
  }

  function createCaptureEventPayload(captureRecord) {
    const parsedHeaders = Object.fromEntries(
      captureRecord.requestHeaders.map((header) => [header.key, header.value]),
    );

    return {
      id: captureRecord.id,
      method: captureRecord.method,
      url: captureRecord.url,
      receivedAtIso: captureRecord.receivedAtIso,
      statusCode: captureRecord.statusCode,
      parsedHeaders,
      rawBody: captureRecord.bodyPreview,
      mockOutcome: captureRecord.mockOutcome,
      mockRuleName: captureRecord.mockRuleName,
      workspaceLabel: captureRecord.scopeLabel,
    };
  }

  function createCaptureReplayRequestSeed(runtimeRecord) {
    const captureUrl = new URL(runtimeRecord.url);
    const params = Array.from(captureUrl.searchParams.entries()).map(([key, value], index) => ({
      id: `capture-param-${index + 1}`,
      key,
      value,
      enabled: true,
    }));
    const headerRows = [];
    let auth = cloneAuth({ type: 'none' });

    for (const [key, value] of Object.entries(runtimeRecord.requestHeaders || {})) {
      const normalizedKey = String(key);
      const normalizedValue = String(value ?? '');

      if (normalizedKey.toLowerCase() === 'authorization' && normalizedValue.startsWith('Bearer ')) {
        auth = {
          ...cloneAuth({ type: 'none' }),
          type: 'bearer',
          bearerToken: normalizedValue.slice('Bearer '.length).trim(),
        };
        continue;
      }

      headerRows.push({
        id: `capture-header-${headerRows.length + 1}`,
        key: normalizedKey,
        value: normalizedValue,
        enabled: true,
      });
    }

    captureUrl.search = '';
    captureUrl.hash = '';

    return createExecutionRequestSeed({
      workspaceId: runtimeRecord.workspaceId || defaultWorkspaceId,
      name: `Replay of ${runtimeRecord.method} ${runtimeRecord.path || captureUrl.pathname}`,
      method: runtimeRecord.method,
      url: captureUrl.toString(),
      params,
      headers: headerRows,
      bodyMode: runtimeRecord.requestBodyMode === 'json'
        ? 'json'
        : runtimeRecord.requestBodyMode === 'text'
          ? 'text'
          : 'none',
      bodyText: runtimeRecord.requestBodyMode === 'none' ? '' : (runtimeRecord.requestBodyPreview || ''),
      formBody: [],
      multipartBody: [],
      auth,
      scripts: {},
    });
  }

  return {
    createPersistedCapturedRequestRecord,
    createCapturedRequestRecord,
    createCaptureEventPayload,
    createCaptureReplayRequestSeed,
  };
}

module.exports = {
  createCaptureObservationService,
};
