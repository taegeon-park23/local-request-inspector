const express = require('express');
const path = require('path');
const vm = require('vm');
const fs = require('fs');
const { randomUUID } = require('node:crypto');
const { bootstrapPersistence } = require('./storage');

const app = express();
const PORT = 5671;
const persistence = bootstrapPersistence();
const resourceStorage = persistence.resourceStorage;
const runtimeStorage = persistence.runtimeStorage;

const clientDistPath = path.join(__dirname, 'client', 'dist');
const hasClientDist = fs.existsSync(clientDistPath);

app.use(express.static(path.join(__dirname, 'public')));

if (hasClientDist) {
  app.use('/app', express.static(clientDistPath));

  app.get(['/app', '/app/*'], (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get(['/app', '/app/*'], (req, res) => {
    res.status(503).send(
      'The React client shell is available through the Vite dev server during S1. Build the client to enable the /app coexistence entrypoint.',
    );
  });
}

function sendData(res, data, status = 200) {
  res.status(status).json({
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

function sendError(res, status, code, message, details = {}, retryable = false) {
  res.status(status).json({
    error: {
      code,
      message,
      details,
      retryable,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

function cloneRows(rows = []) {
  return rows.map((row) => ({
    id: row.id || randomUUID(),
    key: typeof row.key === 'string' ? row.key : '',
    value: typeof row.value === 'string' ? row.value : '',
    enabled: row.enabled !== false,
  }));
}

function cloneAuth(auth = {}) {
  return {
    type: auth.type || 'none',
    bearerToken: auth.bearerToken || '',
    basicUsername: auth.basicUsername || '',
    basicPassword: auth.basicPassword || '',
    apiKeyName: auth.apiKeyName || '',
    apiKeyValue: auth.apiKeyValue || '',
    apiKeyPlacement: auth.apiKeyPlacement || 'header',
  };
}

function cloneScripts(scripts = {}) {
  return {
    activeStage: scripts.activeStage || 'pre-request',
    preRequest: scripts.preRequest || '',
    postResponse: scripts.postResponse || '',
    tests: scripts.tests || '',
  };
}

function createRequestSummary(method, url) {
  return typeof url === 'string' && url.trim().length > 0 ? `${method} ${url}` : `${method} request definition`;
}

function validateRequestDefinition(input) {
  if (!input || typeof input !== 'object') {
    return 'Request payload is required.';
  }

  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    return 'Request name is required.';
  }

  if (typeof input.method !== 'string' || input.method.trim().length === 0) {
    return 'Request method is required.';
  }

  if (typeof input.url !== 'string' || input.url.trim().length === 0) {
    return 'Request URL is required.';
  }

  return null;
}

function normalizeSavedRequest(input, existingRecord, workspaceId) {
  const now = new Date().toISOString();
  const recordId = input.id || existingRecord?.id || randomUUID();
  const collectionName = input.collectionName || existingRecord?.collectionName || 'Saved Requests';

  return {
    id: recordId,
    workspaceId,
    name: input.name.trim(),
    method: input.method,
    url: input.url,
    params: cloneRows(input.params),
    headers: cloneRows(input.headers),
    bodyMode: input.bodyMode || 'none',
    bodyText: input.bodyText || '',
    formBody: cloneRows(input.formBody),
    multipartBody: cloneRows(input.multipartBody),
    auth: cloneAuth(input.auth),
    scripts: cloneScripts(input.scripts),
    collectionName,
    ...(input.folderName ? { folderName: input.folderName } : {}),
    summary: createRequestSummary(input.method, input.url),
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
  };
}

function createExecutionObservation({
  executionId,
  executionOutcome,
  responseStatus,
  responseHeaders,
  responseBodyPreview,
  startedAt,
  completedAt,
  durationMs,
  errorSummary,
}) {
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
        ? `${responseBodyPreview.length} characters captured from the latest run.`
        : 'No response body preview was captured.',
    startedAt,
    completedAt,
    durationMs,
    consoleSummary: 'No console entries were captured. Script execution is not wired yet.',
    consoleEntries: [],
    testsSummary: 'No tests ran. Script execution is not wired yet.',
    testEntries: [],
    ...(errorSummary ? { errorSummary } : {}),
  };
}

function createExecutionRequestTarget(url, params, auth) {
  const target = new URL(url);

  for (const row of params || []) {
    if (row && row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0) {
      target.searchParams.append(row.key, typeof row.value === 'string' ? row.value : '');
    }
  }

  if (auth?.type === 'api-key' && auth.apiKeyPlacement === 'query' && auth.apiKeyName && auth.apiKeyValue) {
    target.searchParams.append(auth.apiKeyName, auth.apiKeyValue);
  }

  return target;
}

function createExecutionHeaders(headers, auth) {
  const nextHeaders = new Headers();

  for (const row of headers || []) {
    if (row && row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0) {
      nextHeaders.set(row.key, typeof row.value === 'string' ? row.value : '');
    }
  }

  if (auth?.type === 'bearer' && auth.bearerToken) {
    nextHeaders.set('Authorization', `Bearer ${auth.bearerToken}`);
  }

  if (auth?.type === 'basic' && auth.basicUsername) {
    const encoded = Buffer.from(`${auth.basicUsername}:${auth.basicPassword || ''}`).toString('base64');
    nextHeaders.set('Authorization', `Basic ${encoded}`);
  }

  if (auth?.type === 'api-key' && auth.apiKeyPlacement === 'header' && auth.apiKeyName && auth.apiKeyValue) {
    nextHeaders.set(auth.apiKeyName, auth.apiKeyValue);
  }

  return nextHeaders;
}

function createExecutionBody(request, headers) {
  if (request.method === 'GET' || request.method === 'DELETE') {
    return undefined;
  }

  if (request.bodyMode === 'none') {
    return undefined;
  }

  if (request.bodyMode === 'json') {
    const bodyText = typeof request.bodyText === 'string' ? request.bodyText : '';

    if (bodyText.trim().length === 0) {
      return undefined;
    }

    JSON.parse(bodyText);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return bodyText;
  }

  if (request.bodyMode === 'text') {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'text/plain');
    }
    return request.bodyText || '';
  }

  if (request.bodyMode === 'form-urlencoded') {
    const params = new URLSearchParams();
    for (const row of request.formBody || []) {
      if (row && row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0) {
        params.append(row.key, typeof row.value === 'string' ? row.value : '');
      }
    }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded');
    }
    return params;
  }

  if (request.bodyMode === 'multipart-form-data') {
    const formData = new FormData();
    for (const row of request.multipartBody || []) {
      if (row && row.enabled !== false && typeof row.key === 'string' && row.key.trim().length > 0) {
        formData.append(row.key, typeof row.value === 'string' ? row.value : '');
      }
    }
    headers.delete('Content-Type');
    return formData;
  }

  return undefined;
}

let clients = [];
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  clients.push(res);
  req.on('close', () => {
    clients = clients.filter((c) => c !== res);
  });
});

const captureRawBody = (req, res, buf) => {
  req.rawBody = buf.toString();
};
app.use(express.json({ verify: captureRawBody }));
app.use(express.urlencoded({ extended: true, verify: captureRawBody }));
app.use(express.text({ type: '*/*' }));

app.get('/api/workspaces/:workspaceId/requests', (req, res) => {
  try {
    const items = resourceStorage
      .list('request')
      .filter((record) => record.workspaceId === req.params.workspaceId)
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));

    return sendData(res, { items });
  } catch (error) {
    return sendError(res, 500, 'request_list_failed', error.message);
  }
});

app.post('/api/workspaces/:workspaceId/requests', (req, res) => {
  const input = req.body?.request;
  const validationError = validateRequestDefinition(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_request_definition', validationError);
  }

  try {
    const existingRecord = input.id ? resourceStorage.read('request', input.id) : null;
    const record = normalizeSavedRequest(input, existingRecord, req.params.workspaceId);
    resourceStorage.save('request', record);
    return sendData(res, { request: record });
  } catch (error) {
    return sendError(res, 500, 'request_save_failed', error.message);
  }
});

app.post('/api/executions/run', async (req, res) => {
  const input = req.body?.request;
  const validationError = validateRequestDefinition(input);

  if (validationError) {
    return sendError(res, 400, 'invalid_request_execution', validationError);
  }

  const executionId = randomUUID();
  const startedAt = new Date().toISOString();
  const startedAtMs = Date.now();

  try {
    const target = createExecutionRequestTarget(input.url, input.params, input.auth);
    const headers = createExecutionHeaders(input.headers, input.auth);
    const body = createExecutionBody(input, headers);
    const response = await fetch(target.toString(), {
      method: input.method,
      headers,
      ...(body !== undefined ? { body } : {}),
    });

    const responseBodyText = await response.text();
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAtMs;
    const responseHeaders = Array.from(response.headers.entries()).map(([name, value]) => ({ name, value }));
    const execution = createExecutionObservation({
      executionId,
      executionOutcome: 'Succeeded',
      responseStatus: response.status,
      responseHeaders,
      responseBodyPreview: responseBodyText.slice(0, 4000),
      startedAt,
      completedAt,
      durationMs,
    });

    runtimeStorage.insertExecutionHistory({
      id: executionId,
      workspaceId: input.workspaceId || null,
      requestId: input.id || null,
      environmentId: null,
      status: 'succeeded',
      cancellationOutcome: null,
      startedAt,
      completedAt,
      durationMs,
      errorCode: null,
      errorMessage: null,
    });
    runtimeStorage.insertExecutionResult({
      executionId,
      responseStatus: response.status,
      responseHeadersJson: JSON.stringify(responseHeaders),
      responseBodyPreview: execution.responseBodyPreview,
      responseBodyRedacted: true,
      stageStatusJson: JSON.stringify({ scripts: 'deferred', tests: 'deferred' }),
      logSummaryJson: JSON.stringify({ consoleEntries: 0, tests: 0 }),
      redactionApplied: true,
    });

    return sendData(res, { execution });
  } catch (error) {
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAtMs;
    const execution = createExecutionObservation({
      executionId,
      executionOutcome: 'Failed',
      responseStatus: null,
      responseHeaders: [],
      responseBodyPreview: '',
      startedAt,
      completedAt,
      durationMs,
      errorSummary: error.message,
    });

    try {
      runtimeStorage.insertExecutionHistory({
        id: executionId,
        workspaceId: input.workspaceId || null,
        requestId: input.id || null,
        environmentId: null,
        status: 'failed',
        cancellationOutcome: null,
        startedAt,
        completedAt,
        durationMs,
        errorCode: 'execution_failed',
        errorMessage: error.message,
      });
      runtimeStorage.insertExecutionResult({
        executionId,
        responseStatus: null,
        responseHeadersJson: '[]',
        responseBodyPreview: '',
        responseBodyRedacted: true,
        stageStatusJson: JSON.stringify({ scripts: 'deferred', tests: 'deferred' }),
        logSummaryJson: JSON.stringify({ consoleEntries: 0, tests: 0 }),
        redactionApplied: true,
      });
    } catch (storageError) {
      console.error('Execution persistence error:', storageError);
    }

    return sendError(res, 500, 'execution_failed', error.message, {
      executionId: execution.executionId,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      durationMs: execution.durationMs,
    });
  }
});

let mockConfig = {
  statusCode: 200,
  contentType: 'application/json',
  body: '{\n  "message": "Request captured by Local Request Inspector"\n}',
};

app.post('/__inspector/mock', (req, res) => {
  mockConfig = { ...mockConfig, ...req.body };
  res.json({
    success: true,
    message: 'Mock config updated',
    currentConfig: mockConfig,
  });
});

const getContentType = (ext) => {
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
};

app.get('/__inspector/assets', async (req, res) => {
  const assetsPath = path.join(__dirname, 'assets');
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
    const onlyFiles = fileDetails.filter((f) => !f.isDirectory);
    res.json({ success: true, files: onlyFiles });
  } catch (err) {
    console.error('Assets read error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/__inspector/execute', async (req, res) => {
  const { requestConfig, callbackCode } = req.body;
  const logs = [];

  try {
    logs.push(`[System] 1차 API 요청 시작: ${requestConfig.method} ${requestConfig.url}`);

    const fetchOptions = {
      method: requestConfig.method,
      headers: requestConfig.headers || { 'Content-Type': 'application/json' },
    };

    if (requestConfig.method !== 'GET' && requestConfig.body) {
      if (requestConfig.bodyType === 'application/x-www-form-urlencoded') {
        const formParams = new URLSearchParams();
        if (typeof requestConfig.body === 'object') {
          for (const key in requestConfig.body) {
            formParams.append(key, requestConfig.body[key]);
          }
        } else {
          formParams.append('data', requestConfig.body);
        }
        fetchOptions.body = formParams;
      } else if (requestConfig.bodyType === 'application/json') {
        fetchOptions.body =
          typeof requestConfig.body === 'string'
            ? requestConfig.body
            : JSON.stringify(requestConfig.body);
      } else {
        fetchOptions.body = String(requestConfig.body);
      }
    }

    if (typeof global.fetch === 'undefined') {
      throw new Error(
        '시스템에 fetch API가 내장되어 있지 않습니다. Node.js 18 이상 버전이 필요합니다.',
      );
    }
    const initialRes = await global.fetch(requestConfig.url, fetchOptions);

    let responseData;
    const resText = await initialRes.text();
    try {
      responseData = JSON.parse(resText);
    } catch (e) {
      responseData = resText;
    }
    logs.push(`[System] 1차 응답 수신 완료 (Status: ${initialRes.status})`);

    const sandbox = {
      fetch: global.fetch,
      URLSearchParams: global.URLSearchParams,
      FormData: global.FormData,
      Blob: global.Blob,
      fs: fs.promises,
      path: path,
      __dirname: __dirname,
      response: responseData,
      console: {
        log: (...args) => logs.push(`[Log] ${args.join(' ')}`),
        error: (...args) => logs.push(`[Error] ${args.join(' ')}`),
        warn: (...args) => logs.push(`[Warn] ${args.join(' ')}`),
        info: (...args) => logs.push(`[Info] ${args.join(' ')}`),
      },
    };
    vm.createContext(sandbox);

    const wrappedCode = `(async () => { \n${callbackCode}\n })()`;
    logs.push('[System] 콜백 코드 실행 시작...');

    const executionResult = await vm.runInContext(wrappedCode, sandbox);

    logs.push('[System] 실행 완료');
    res.json({ success: true, logs, result: executionResult });
  } catch (err) {
    logs.push(`[Error] 시스템/문법 오류: ${err.message}`);
    res.status(500).json({ success: false, error: err.message, logs });
  }
});

app.all(/.*/, (req, res) => {
  if (req.path === '/events' || req.path.startsWith('/__inspector') || req.path.startsWith('/api/')) return;
  const rawHeadersStr = req.rawHeaders.reduce(
    (acc, current, index) =>
      index % 2 === 0 ? acc + current + ': ' : acc + current + '\n',
    '',
  );
  const requestData = {
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    method: req.method,
    url: req.originalUrl,
    parsedHeaders: req.headers,
    rawHeaders: rawHeadersStr,
    parsedBody: req.body,
    rawBody:
      req.rawBody ||
      (typeof req.body === 'string' ? req.body : 'No Body or Binary'),
  };
  clients.forEach((client) =>
    client.write(`data: ${JSON.stringify(requestData)}\n\n`),
  );
  res
    .status(Number(mockConfig.statusCode))
    .set('Content-Type', mockConfig.contentType)
    .send(mockConfig.body);
});

app.listen(PORT, () => console.log(`[Ready] http://localhost:${PORT}`));
