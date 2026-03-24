const express = require('express');

function sendData(res, data, status = 200) {
  return res.status(status).json({ data });
}

function sendError(res, status, code, message, details = {}, retryable = false) {
  return res.status(status).json({
    error: {
      code,
      message,
      details,
      retryable,
    },
  });
}

function createInMemoryRepo(initialRecords = []) {
  const records = new Map(initialRecords.map((record) => [record.id, record]));

  return {
    listAll() {
      return [...records.values()];
    },
    listByWorkspace(workspaceId) {
      return [...records.values()].filter((record) => record.workspaceId === workspaceId);
    },
    read(id) {
      return records.get(id) ?? null;
    },
    save(record) {
      records.set(record.id, record);
      return record;
    },
    delete(id) {
      const existed = records.has(id);
      records.delete(id);
      return existed;
    },
  };
}

function createRepositories(overrides = {}) {
  const resources = {
    collections: createInMemoryRepo(),
    requestGroups: createInMemoryRepo(),
    requests: createInMemoryRepo(),
    environments: createInMemoryRepo(),
    scripts: createInMemoryRepo(),
    mockRules: createInMemoryRepo(),
    ...(overrides.resources || {}),
  };
  const runtimeQueries = {
    insertCapturedRequest() {},
    listCapturedRequests() { return []; },
    readCapturedRequest() { return null; },
    listExecutionHistories() { return []; },
    readExecutionHistory() { return null; },
    readExecutionResult() { return null; },
    listExecutionTestResults() { return []; },
    insertExecutionHistory() {},
    insertExecutionResult() {},
    insertTestResults() {},
    ...((overrides.runtime && overrides.runtime.queries) || {}),
  };

  return {
    resources,
    runtime: {
      queries: runtimeQueries,
      ...(overrides.runtime || {}),
      queries: runtimeQueries,
    },
  };
}

async function withServer(registerRoutes, run) {
  const app = express();
  app.use(express.json());
  app.use(express.text({ type: 'text/*' }));
  registerRoutes(app);

  const server = await new Promise((resolve) => {
    const nextServer = app.listen(0, () => resolve(nextServer));
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    return await run({ app, server, baseUrl });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function requestJson(baseUrl, pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const responseText = await response.text();
  const payload = responseText.length > 0 ? JSON.parse(responseText) : null;
  return {
    status: response.status,
    payload,
  };
}

module.exports = {
  createInMemoryRepo,
  createRepositories,
  requestJson,
  sendData,
  sendError,
  withServer,
};
