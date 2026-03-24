function createDefaultMockConfig() {
  return {
    statusCode: 200,
    contentType: 'application/json',
    body: '{\n  "message": "Request captured by Local Request Inspector"\n}',
  };
}

function waitForDelay(delayMs) {
  if (!delayMs || delayMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function getContentType(ext) {
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

function registerLegacyInspectorRoutes(app, dependencies) {
  const {
    fs,
    path,
    rootDir,
    defaultWorkspaceId,
    repositories,
    evaluateMockRules,
    runLegacyCallbackInChildProcess,
    createPersistedCapturedRequestRecord,
    createCapturedRequestRecord,
    createCaptureEventPayload,
    getEventClients,
  } = dependencies;
  let mockConfig = createDefaultMockConfig();

  app.post('/__inspector/mock', (req, res) => {
    mockConfig = { ...mockConfig, ...req.body };
    res.json({
      success: true,
      message: 'Mock config updated',
      currentConfig: mockConfig,
    });
  });

  app.get('/__inspector/assets', async (req, res) => {
    const assetsPath = path.join(rootDir, 'assets');

    try {
      if (!fs.existsSync(assetsPath)) {
        return res.json({ success: true, files: [] });
      }

      const files = await fs.promises.readdir(assetsPath);
      const fileDetails = await Promise.all(
        files.map(async (fileName) => {
          const filePath = path.join(assetsPath, fileName);
          const stat = await fs.promises.stat(filePath);
          const ext = path.extname(fileName).toLowerCase();

          return {
            filename: fileName,
            sizeBytes: stat.size,
            extension: ext,
            contentType: getContentType(ext),
            isDirectory: stat.isDirectory(),
          };
        }),
      );
      const onlyFiles = fileDetails.filter((fileDetail) => !fileDetail.isDirectory);

      return res.json({ success: true, files: onlyFiles });
    } catch (error) {
      console.error('Assets read error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/__inspector/execute', async (req, res) => {
    const legacyResult = await runLegacyCallbackInChildProcess({
      requestConfig: req.body?.requestConfig,
      callbackCode: req.body?.callbackCode,
    });

    if (legacyResult.outcome === 'succeeded') {
      return res.json({
        success: true,
        logs: Array.isArray(legacyResult.logs) ? legacyResult.logs : [],
        result: legacyResult.result,
      });
    }

    const status = legacyResult.outcome === 'blocked'
      ? 400
      : legacyResult.outcome === 'timed_out'
        ? 408
        : 500;

    return res.status(status).json({
      success: false,
      error: legacyResult.errorSummary || 'Legacy callback execution failed.',
      logs: Array.isArray(legacyResult.logs) ? legacyResult.logs : [],
    });
  });

  app.all(/.*/, async (req, res) => {
    if (req.path === '/events' || req.path.startsWith('/__inspector') || req.path.startsWith('/api/')) {
      return;
    }

    const host = req.get('host') || 'localhost';
    const inboundUrl = new URL(req.originalUrl, `${req.protocol}://${host}`);
    const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : '');

    let evaluationResult;

    try {
      const persistedRules = repositories.resources.mockRules.listByWorkspace(defaultWorkspaceId);

      evaluationResult = evaluateMockRules(
        persistedRules,
        {
          method: req.method.toUpperCase(),
          pathname: inboundUrl.pathname,
          searchParams: inboundUrl.searchParams,
          headers: req.headers,
          rawBody,
        },
        mockConfig,
      );
    } catch (error) {
      evaluationResult = {
        outcome: 'Blocked',
        matchedRuleId: null,
        matchedRuleName: null,
        appliedDelayMs: null,
        mockEvaluationSummary: `Mock evaluation was blocked before response generation. ${error.message}`,
        response: {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              blocked: true,
              reason: 'Mock evaluation failed before a response could be generated.',
            },
            null,
            2,
          ),
        },
      };
    }

    if (typeof evaluationResult.appliedDelayMs === 'number' && evaluationResult.appliedDelayMs > 0) {
      await waitForDelay(evaluationResult.appliedDelayMs);
    }

    const persistedCapture = createPersistedCapturedRequestRecord(req, evaluationResult);
    const captureRecord = createCapturedRequestRecord({
      id: persistedCapture.id,
      workspaceId: persistedCapture.workspaceId,
      method: persistedCapture.method,
      url: persistedCapture.url,
      path: persistedCapture.path,
      statusCode: persistedCapture.statusCode,
      matchedMockRuleId: persistedCapture.matchedMockRuleId,
      matchedMockRuleName: persistedCapture.matchedMockRuleName,
      requestHeaders: JSON.parse(persistedCapture.requestHeadersJson),
      requestBodyPreview: persistedCapture.requestBodyPreview,
      requestBodyRedacted: persistedCapture.requestBodyRedacted,
      receivedAt: persistedCapture.receivedAt,
      mockOutcome: persistedCapture.mockOutcome,
      mockEvaluationSummary: persistedCapture.mockEvaluationSummary,
      appliedDelayMs: persistedCapture.appliedDelayMs,
      scopeLabel: persistedCapture.scopeLabel,
      requestBodyMode: persistedCapture.requestBodyMode,
    });

    try {
      repositories.runtime.queries.insertCapturedRequest(persistedCapture);
    } catch (error) {
      console.error('Captured request persistence error:', error);
    }

    const requestEvent = createCaptureEventPayload(captureRecord);
    getEventClients().forEach((client) => {
      client.write(`data: ${JSON.stringify(requestEvent)}\n\n`);
    });

    res.status(Number(evaluationResult.response.statusCode));

    for (const [headerName, headerValue] of Object.entries(evaluationResult.response.headers || {})) {
      res.set(headerName, headerValue);
    }

    return res.send(evaluationResult.response.body);
  });
}

module.exports = {
  registerLegacyInspectorRoutes,
};

