function registerRuntimeRoutes(app, dependencies) {
  const {
    repositories,
    sendData,
    sendError,
    cancelActiveExecution,
    createHistoryRecord,
    createCapturedRequestRecord,
    createCaptureReplayRequestSeed,
  } = dependencies;

  app.post('/api/executions/:executionId/cancel', (req, res) => {
    const cancelled = cancelActiveExecution(req.params.executionId);

    if (!cancelled) {
      return sendError(res, 404, 'execution_not_active', 'Execution is not active or was already completed.', {
        executionId: req.params.executionId,
      });
    }

    return sendData(res, {
      executionId: req.params.executionId,
      status: 'cancel_requested',
    });
  });

  app.get('/api/execution-histories/:executionId/result', (req, res) => {
    try {
      const result = repositories.runtime.queries.readExecutionResult(req.params.executionId);

      if (!result) {
        return sendError(res, 404, 'execution_result_not_found', 'Execution result was not found.', {
          executionId: req.params.executionId,
        });
      }

      return sendData(res, { result });
    } catch (error) {
      return sendError(res, 500, 'execution_result_detail_failed', error.message, {
        executionId: req.params.executionId,
      });
    }
  });

  app.get('/api/execution-histories/:executionId/test-results', (req, res) => {
    try {
      const history = repositories.runtime.queries.readExecutionHistory(req.params.executionId);

      if (!history) {
        return sendError(res, 404, 'execution_history_not_found', 'Execution history was not found.', {
          executionId: req.params.executionId,
        });
      }

      return sendData(res, {
        items: repositories.runtime.queries.listExecutionTestResults(req.params.executionId),
      });
    } catch (error) {
      return sendError(res, 500, 'execution_test_results_failed', error.message, {
        executionId: req.params.executionId,
      });
    }
  });

  app.get('/api/execution-histories', (req, res) => {
    try {
      const items = repositories.runtime.queries.listExecutionHistories().map(createHistoryRecord);
      return sendData(res, { items });
    } catch (error) {
      return sendError(res, 500, 'execution_history_list_failed', error.message);
    }
  });

  app.get('/api/execution-histories/:executionId', (req, res) => {
    try {
      const history = repositories.runtime.queries.readExecutionHistory(req.params.executionId);

      if (!history) {
        return sendError(res, 404, 'execution_history_not_found', 'Execution history was not found.', {
          executionId: req.params.executionId,
        });
      }

      return sendData(res, { history: createHistoryRecord(history) });
    } catch (error) {
      return sendError(res, 500, 'execution_history_detail_failed', error.message, {
        executionId: req.params.executionId,
      });
    }
  });

  app.get('/api/captured-requests', (req, res) => {
    try {
      const items = repositories.runtime.queries.listCapturedRequests().map(createCapturedRequestRecord);
      return sendData(res, { items });
    } catch (error) {
      return sendError(res, 500, 'captured_request_list_failed', error.message);
    }
  });

  app.post('/api/captured-requests/:capturedRequestId/replay', (req, res) => {
    try {
      const capture = repositories.runtime.queries.readCapturedRequest(req.params.capturedRequestId);

      if (!capture) {
        return sendError(res, 404, 'captured_request_not_found', 'Captured request was not found.', {
          capturedRequestId: req.params.capturedRequestId,
        });
      }

      return sendData(res, {
        request: createCaptureReplayRequestSeed(capture),
      });
    } catch (error) {
      return sendError(res, 500, 'captured_request_replay_failed', error.message, {
        capturedRequestId: req.params.capturedRequestId,
      });
    }
  });

  app.get('/api/captured-requests/:capturedRequestId', (req, res) => {
    try {
      const capture = repositories.runtime.queries.readCapturedRequest(req.params.capturedRequestId);

      if (!capture) {
        return sendError(res, 404, 'captured_request_not_found', 'Captured request was not found.', {
          capturedRequestId: req.params.capturedRequestId,
        });
      }

      return sendData(res, { capture: createCapturedRequestRecord(capture) });
    } catch (error) {
      return sendError(res, 500, 'captured_request_detail_failed', error.message, {
        capturedRequestId: req.params.capturedRequestId,
      });
    }
  });
}

module.exports = {
  registerRuntimeRoutes,
};
