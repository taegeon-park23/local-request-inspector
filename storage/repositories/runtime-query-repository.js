function createRuntimeQueryRepository({ runtimeStorage }) {
  function readExecutionResult(executionId) {
    const historyRecord = runtimeStorage.readExecutionHistory(executionId);

    if (!historyRecord) {
      return null;
    }

    return {
      executionId: historyRecord.executionId,
      responseStatus: historyRecord.responseStatus,
      responseHeaders: historyRecord.responseHeaders,
      responseBodyPreview: historyRecord.responseBodyPreview,
      responseBodyRedacted: historyRecord.responseBodyRedacted,
      stageStatus: historyRecord.stageStatus,
      logSummary: historyRecord.logSummary,
      requestSnapshot: historyRecord.requestSnapshot,
      redactionApplied: historyRecord.redactionApplied,
    };
  }

  return {
    listCapturedRequests: () => runtimeStorage.listCapturedRequests(),
    readCapturedRequest: (capturedRequestId) => runtimeStorage.readCapturedRequest(capturedRequestId),
    insertCapturedRequest: (record) => runtimeStorage.insertCapturedRequest(record),
    listExecutionHistories: () => runtimeStorage.listExecutionHistories(),
    readExecutionHistory: (executionId) => runtimeStorage.readExecutionHistory(executionId),
    readExecutionResult,
    listExecutionTestResults: (executionId, limit) => runtimeStorage.listExecutionTestResults(executionId, limit),
    insertExecutionHistory: (record) => runtimeStorage.insertExecutionHistory(record),
    insertExecutionResult: (record) => runtimeStorage.insertExecutionResult(record),
    insertTestResults: (records) => runtimeStorage.insertTestResults(records),
  };
}

module.exports = {
  createRuntimeQueryRepository,
};
