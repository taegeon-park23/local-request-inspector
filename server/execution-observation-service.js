function createExecutionObservationService(dependencies) {
  const {
    randomUUID,
    countConsoleEntries,
    countConsoleWarnings,
    createCombinedConsoleEntries,
    createStageStatusRecord,
    createEmptyScriptStageResult,
    createObservationStageSummaries,
    readPersistedEnvironmentResolutionSummary,
    createRequestSnapshotSummary,
    createRequestInputSummary,
    createPersistedAuthSnapshot,
    createPreviewSizeLabel,
    createResponsePreviewPolicy,
  } = dependencies;

  function createPersistedLogSummary(stageResults) {
    return {
      consoleEntries: countConsoleEntries(stageResults),
      consoleWarnings: countConsoleWarnings(stageResults),
      consolePreview: createCombinedConsoleEntries(stageResults),
    };
  }

  function createPersistedTestResultRecords(executionId, testsStageResult) {
    if (!Array.isArray(testsStageResult?.testResults) || testsStageResult.testResults.length === 0) {
      return [];
    }

    const recordedAt = new Date().toISOString();

    return testsStageResult.testResults.map((result) => ({
      id: result.id || randomUUID(),
      executionId,
      testName: result.name,
      status: result.status,
      message: result.message,
      detailsJson: JSON.stringify({ stage: 'tests' }),
      recordedAt,
    }));
  }

  function createExecutionErrorMetadata(stageResults, fallbackError) {
    const failureStage = ['pre-request', 'transport', 'post-response', 'tests']
      .map((stageId) => stageResults[stageId])
      .find((stageResult) => stageResult && stageResult.status !== 'succeeded' && stageResult.status !== 'skipped');

    if (!failureStage) {
      return {
        errorCode: fallbackError?.code || fallbackError?.cause?.code || null,
        errorSummary: fallbackError?.message || null,
      };
    }

    return {
      errorCode: failureStage.errorCode || fallbackError?.code || fallbackError?.cause?.code || null,
      errorSummary: failureStage.errorSummary || failureStage.summary || fallbackError?.message || null,
    };
  }

  function createPersistedExecutionStatus(executionOutcome) {
    switch (executionOutcome) {
      case 'Succeeded':
        return 'succeeded';
      case 'Cancelled':
        return 'cancelled';
      case 'Blocked':
        return 'blocked';
      case 'Timed out':
        return 'timed_out';
      default:
        return 'failed';
    }
  }

  function createExecutionOutcomeLabel(status, cancellationOutcome) {
    switch (status) {
      case 'succeeded':
        return 'Succeeded';
      case 'timed_out':
        return 'Timed out';
      case 'cancelled':
        return 'Cancelled';
      case 'blocked':
        return 'Blocked';
      default:
        return cancellationOutcome === 'blocked' ? 'Blocked' : 'Failed';
    }
  }

  function createTransportOutcomeLabel(responseStatus, executionOutcome) {
    if (responseStatus === 200) {
      return '200 OK';
    }

    if (responseStatus === 404) {
      return '404 Not Found';
    }

    if (responseStatus === 503) {
      return '503 Service Unavailable';
    }

    if (typeof responseStatus === 'number') {
      return `HTTP ${responseStatus}`;
    }

    if (executionOutcome === 'Cancelled') {
      return 'Cancelled before transport completion';
    }

    return executionOutcome === 'Blocked' ? 'Blocked before transport' : 'No response';
  }

  function createPersistedTransportStageResult(runtimeRecord, executionOutcome, transportOutcome) {
    if (runtimeRecord.responseStatus === null) {
      if (executionOutcome === 'Blocked') {
        return createStageStatusRecord(
          'transport',
          'blocked',
          'Transport was blocked before any upstream request was sent.',
          {
            errorCode: runtimeRecord.errorCode || 'transport_blocked',
            errorSummary: runtimeRecord.errorMessage || 'Transport was blocked before any upstream request was sent.',
          },
        );
      }

      if (executionOutcome === 'Timed out') {
        return createStageStatusRecord(
          'transport',
          'timed_out',
          'Transport timed out before a persisted response summary was available.',
          {
            errorCode: runtimeRecord.errorCode || 'transport_timed_out',
            errorSummary: runtimeRecord.errorMessage || 'Transport timed out before a persisted response summary was available.',
          },
        );
      }

      return createStageStatusRecord(
        'transport',
        'failed',
        'Transport failed before a persisted response summary was available.',
        {
          errorCode: runtimeRecord.errorCode || 'transport_failed',
          errorSummary: runtimeRecord.errorMessage || 'Transport failed before a persisted response summary was available.',
        },
      );
    }

    return createStageStatusRecord(
      'transport',
      'succeeded',
      `Transport completed with ${transportOutcome}.`,
    );
  }

  function createPersistedStageResults(runtimeRecord, executionOutcome, transportOutcome) {
    const rawStageStatus = runtimeRecord.stageStatus || {};

    if (rawStageStatus.preRequest || rawStageStatus.transport || rawStageStatus.postResponse || rawStageStatus.tests) {
      return {
        preRequest: rawStageStatus.preRequest || createEmptyScriptStageResult(
          'pre-request',
          'No persisted Pre-request stage summary is available for this execution.',
        ),
        transport: rawStageStatus.transport || createPersistedTransportStageResult(runtimeRecord, executionOutcome, transportOutcome),
        postResponse: rawStageStatus.postResponse || createEmptyScriptStageResult(
          'post-response',
          'No persisted Post-response stage summary is available for this execution.',
        ),
        tests: rawStageStatus.tests || createEmptyScriptStageResult(
          'tests',
          'No persisted Tests stage summary is available for this execution.',
        ),
      };
    }

    return {
      preRequest: createEmptyScriptStageResult(
        'pre-request',
        rawStageStatus.scripts === 'deferred'
          ? 'Persisted history predates Pre-request diagnostics wiring.'
          : 'No Pre-request script was saved for this request.',
      ),
      transport: createPersistedTransportStageResult(runtimeRecord, executionOutcome, transportOutcome),
      postResponse: createEmptyScriptStageResult(
        'post-response',
        rawStageStatus.scripts === 'deferred'
          ? 'Persisted history predates Post-response diagnostics wiring.'
          : 'No Post-response script was saved for this request.',
      ),
      tests: createEmptyScriptStageResult(
        'tests',
        rawStageStatus.tests === 'deferred'
          ? 'Persisted history predates Tests diagnostics wiring.'
          : 'No Tests script was saved for this request.',
      ),
    };
  }

  function createTestSummary(assertionCount, failedAssertions, skippedAssertions, testsStageResult, testResults = []) {
    if (Array.isArray(testResults) && testResults.length > 0) {
      if (failedAssertions > 0) {
        return {
          outcome: 'Some tests failed',
          label: `${failedAssertions} / ${assertionCount} tests failed`,
          summary: testsStageResult?.summary || 'Persisted assertion summary shows at least one failed test.',
          preview: testResults.map((result) => `${result.status === 'passed' ? 'Passed' : 'Failed'}: ${result.testName} - ${result.message}`),
        };
      }

      return {
        outcome: 'All tests passed',
        label: `${assertionCount} / ${assertionCount} tests passed`,
        summary: testsStageResult?.summary || 'All persisted assertions passed.',
        preview: testResults.map((result) => `Passed: ${result.testName} - ${result.message}`),
      };
    }

    if (testsStageResult?.status === 'failed' || testsStageResult?.status === 'blocked' || testsStageResult?.status === 'timed_out') {
      return {
        outcome: 'Some tests failed',
        label: 'Tests stage failed',
        summary: testsStageResult.summary,
        preview: [testsStageResult.summary],
      };
    }

    if (testsStageResult?.status === 'skipped') {
      const shouldTreatAsSkipped = /transport|response|blocked|timed out/i.test(testsStageResult.summary);

      return {
        outcome: shouldTreatAsSkipped ? 'Tests skipped' : 'No tests',
        label: shouldTreatAsSkipped ? 'Tests skipped' : 'No tests persisted',
        summary: testsStageResult.summary,
        preview: [testsStageResult.summary],
      };
    }

    if (assertionCount === 0 && skippedAssertions > 0) {
      return {
        outcome: 'Tests skipped',
        label: 'Tests skipped',
        summary: 'Tests were skipped before a persisted assertion summary was recorded.',
        preview: ['Tests were skipped before persisted assertions were available.'],
      };
    }

    if (assertionCount === 0) {
      return {
        outcome: 'No tests',
        label: 'No tests persisted',
        summary: 'No persisted test assertions are available for this execution.',
        preview: ['No persisted test assertions are available for this execution.'],
      };
    }

    if (failedAssertions > 0) {
      return {
        outcome: 'Some tests failed',
        label: `${failedAssertions} / ${assertionCount} tests failed`,
        summary: 'Persisted assertion summary shows at least one failed test.',
        preview: [`${assertionCount - failedAssertions} assertions passed.`, `${failedAssertions} assertions failed.`],
      };
    }

    return {
      outcome: 'All tests passed',
      label: `${assertionCount} / ${assertionCount} tests passed`,
      summary: 'All persisted assertions passed.',
      preview: ['All persisted assertions passed.'],
    };
  }

  function createHostPathHint(url) {
    try {
      const parsedUrl = new URL(url);
      return `${parsedUrl.host}${parsedUrl.pathname}`;
    } catch {
      return url;
    }
  }

  function createHistoryTimelineEntries(historyRecord) {
    const entries = [
      {
        id: `${historyRecord.executionId}-prepared`,
        title: 'Request prepared',
        summary: historyRecord.stageSummaries?.find((entry) => entry.stageId === 'pre-request')?.summary
          || `Prepared ${historyRecord.method} ${historyRecord.hostPathHint} from a redacted request snapshot.`,
      },
      {
        id: `${historyRecord.executionId}-transport`,
        title: historyRecord.transportStatusCode === null ? 'Transport summary' : 'Transport completed',
        summary: historyRecord.stageSummaries?.find((entry) => entry.stageId === 'transport')?.summary
          || (historyRecord.transportStatusCode === null
            ? 'No persisted transport response was recorded for this execution.'
            : `Persisted transport summary recorded ${historyRecord.transportOutcome}.`),
      },
    ];

    const postResponseStage = historyRecord.stageSummaries?.find((entry) => entry.stageId === 'post-response');
    if (postResponseStage && postResponseStage.status !== 'Skipped') {
      entries.push({
        id: `${historyRecord.executionId}-post-response`,
        title: 'Post-response summary',
        summary: postResponseStage.summary,
      });
    }

    const testsStage = historyRecord.stageSummaries?.find((entry) => entry.stageId === 'tests');
    if (historyRecord.assertionCount > 0 || (testsStage && testsStage.status !== 'Skipped')) {
      entries.push({
        id: `${historyRecord.executionId}-tests`,
        title: 'Tests completed',
        summary: testsStage?.summary || historyRecord.testsSummary,
      });
    }

    entries.push({
      id: `${historyRecord.executionId}-finalized`,
      title: 'Result finalized',
      summary: 'Persisted history keeps redacted response, console, tests, and execution metadata summaries.',
    });

    return entries;
  }

  function createHistoryRecord(runtimeRecord) {
    const requestSnapshot = runtimeRecord.requestSnapshot || {};
    const method = typeof requestSnapshot.method === 'string' && requestSnapshot.method.length > 0
      ? requestSnapshot.method
      : 'GET';
    const url = typeof requestSnapshot.url === 'string' && requestSnapshot.url.length > 0
      ? requestSnapshot.url
      : 'http://localhost/request-snapshot-unavailable';
    const requestLabel = typeof requestSnapshot.name === 'string' && requestSnapshot.name.length > 0
      ? requestSnapshot.name
      : `${method} request`;
    const executionOutcome = createExecutionOutcomeLabel(runtimeRecord.status, runtimeRecord.cancellationOutcome);
    const transportOutcome = createTransportOutcomeLabel(runtimeRecord.responseStatus, executionOutcome);
    const responseHeaders = Array.isArray(runtimeRecord.responseHeaders) ? runtimeRecord.responseHeaders : [];
    const requestParams = Array.isArray(requestSnapshot.params) ? requestSnapshot.params : [];
    const requestHeaders = Array.isArray(requestSnapshot.headers) ? requestSnapshot.headers : [];
    const responseBodyPreview = typeof runtimeRecord.responseBodyPreview === 'string' ? runtimeRecord.responseBodyPreview : '';
    const environmentId = typeof requestSnapshot.environmentId === 'string' && requestSnapshot.environmentId.length > 0
      ? requestSnapshot.environmentId
      : runtimeRecord.environmentId || null;
    const environmentLabel = typeof requestSnapshot.environmentLabel === 'string' && requestSnapshot.environmentLabel.length > 0
      ? requestSnapshot.environmentLabel
      : environmentId
        ? 'Selected environment'
        : 'No environment selected';
    const environmentResolutionSummary = readPersistedEnvironmentResolutionSummary(
      requestSnapshot.environmentResolutionSummary,
    );
    const persistedStageResults = createPersistedStageResults(runtimeRecord, executionOutcome, transportOutcome);
    const stageSummaries = createObservationStageSummaries(persistedStageResults);
    const consoleLogCount = Number(runtimeRecord.logSummary?.consoleEntries || 0);
    const consoleWarningCount = Number(runtimeRecord.logSummary?.consoleWarnings || runtimeRecord.logSummary?.warnings || 0);
    const consolePreview = Array.isArray(runtimeRecord.logSummary?.consolePreview)
      ? runtimeRecord.logSummary.consolePreview
      : [];
    const tests = createTestSummary(
      runtimeRecord.assertionCount,
      runtimeRecord.failedAssertions,
      runtimeRecord.skippedAssertions,
      persistedStageResults.tests,
      runtimeRecord.testResults,
    );

    const historyRecord = {
      id: runtimeRecord.executionId,
      executionId: runtimeRecord.executionId,
      requestLabel,
      method,
      url,
      hostPathHint: createHostPathHint(url),
      executedAtLabel: runtimeRecord.completedAt || runtimeRecord.startedAt,
      durationLabel:
        typeof runtimeRecord.durationMs === 'number'
          ? `${runtimeRecord.durationMs} ms`
          : 'No persisted duration',
      durationMs: typeof runtimeRecord.durationMs === 'number' ? runtimeRecord.durationMs : 0,
      executionOutcome,
      transportOutcome,
      transportStatusCode: runtimeRecord.responseStatus ?? null,
      testOutcome: tests.outcome,
      testSummaryLabel: tests.label,
      requestSnapshotSummary: createRequestSnapshotSummary(requestSnapshot),
      requestInputSummary: createRequestInputSummary(requestSnapshot),
      requestParamCount: requestParams.length,
      requestHeaderCount: requestHeaders.length,
      requestParams,
      requestHeaders,
      requestBodyMode: requestSnapshot.bodyMode || 'none',
      requestBodyText: requestSnapshot.bodyText || '',
      requestAuth: requestSnapshot.auth || createPersistedAuthSnapshot(),
      requestResourceId: runtimeRecord.requestId || requestSnapshot.requestId || null,
      environmentId,
      requestCollectionName: requestSnapshot.collectionName || undefined,
      requestGroupName: requestSnapshot.requestGroupName || requestSnapshot.folderName || undefined,
      responseSummary:
        runtimeRecord.responseStatus === null
          ? 'Persisted history does not include a transport response body for this execution.'
          : `Persisted history captured ${transportOutcome} and a bounded response preview.`,
      headersSummary:
        responseHeaders.length > 0
          ? `${responseHeaders.length} response headers persisted in redacted summary form.`
          : 'No response headers were persisted for this execution.',
      bodyHint:
        responseBodyPreview.length > 0
          ? `${responseBodyPreview.length} characters captured from the persisted response preview.`
          : 'No response body preview was persisted for this execution.',
      bodyPreview:
        responseBodyPreview.length > 0
          ? responseBodyPreview
          : 'No persisted response body preview is available for this execution.',
      responsePreviewSizeLabel: createPreviewSizeLabel(
        responseBodyPreview,
        runtimeRecord.responseStatus === null ? 'No persisted preview' : 'Empty preview',
      ),
      responsePreviewPolicy: createResponsePreviewPolicy({
        preview: responseBodyPreview,
        redactionApplied: runtimeRecord.redactionApplied || runtimeRecord.responseBodyRedacted,
        previewTruncated: responseBodyPreview.length >= 4000,
        absentSummary: 'No response preview was persisted for this execution.',
      }),
      consoleSummary:
        consoleLogCount > 0
          ? `${consoleLogCount} persisted console entr${consoleLogCount === 1 ? 'y is' : 'ies are'} available${consoleWarningCount > 0 ? `, including ${consoleWarningCount} warning(s).` : '.'}`
          : persistedStageResults['post-response']?.summary || persistedStageResults['pre-request']?.summary || 'No console entries were persisted for this execution.',
      consolePreview,
      consoleLogCount,
      consoleWarningCount,
      testsSummary: tests.summary,
      assertionCount: runtimeRecord.assertionCount,
      passedAssertions: runtimeRecord.passedAssertions,
      failedAssertions: runtimeRecord.failedAssertions,
      testsPreview: tests.preview,
      startedAtLabel: runtimeRecord.startedAt,
      completedAtLabel: runtimeRecord.completedAt || runtimeRecord.startedAt,
      environmentLabel,
      ...(environmentResolutionSummary ? { environmentResolutionSummary } : {}),
      sourceLabel: requestSnapshot.sourceLabel || 'Runtime request snapshot',
      errorCode: runtimeRecord.errorCode || null,
      errorSummary: runtimeRecord.errorMessage || 'No execution error was reported.',
      stageSummaries,
      timelineEntries: [],
    };

    historyRecord.timelineEntries = createHistoryTimelineEntries(historyRecord);
    return historyRecord;
  }

  return {
    createPersistedLogSummary,
    createPersistedTestResultRecords,
    createExecutionErrorMetadata,
    createPersistedExecutionStatus,
    createHostPathHint,
    createHistoryRecord,
  };
}

module.exports = {
  createExecutionObservationService,
};
