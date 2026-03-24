const { randomUUID } = require('node:crypto');

function registerExecutionRoutes(app, dependencies) {
  const {
    sendData,
    sendError,
    repositories,
    defaultWorkspaceId,
    registerActiveExecution,
    clearActiveExecution,
    validateRequestDefinition,
    createExecutionRequestSeed,
    resolveRequestScriptsForExecution,
    normalizePersistedSavedScriptRecord,
    createLinkedScriptRunStageResult,
    createEnvironmentResolutionSummary,
    executeScriptStage,
    readWorkspaceEnvironmentReference,
    createTransportSkippedStageResult,
    createSkippedScriptStageAfterTransport,
    createTransportBlockedStageResult,
    resolveExecutionRequestWithEnvironment,
    createResolvedEnvironmentLabel,
    summarizeUnresolvedEnvironmentPlaceholders,
    createExecutionRequestTarget,
    createExecutionHeaders,
    createExecutionBody,
    createTransportStageResult,
    createHostPathHint,
    createTransportCancelledStageResult,
    createTransportFailureStageResult,
    createPersistedRequestSnapshotSafely,
    deriveExecutionOutcome,
    createCombinedConsoleEntries,
    countConsoleWarnings,
    createObservationTestsSummary,
    createObservationTestEntries,
    createExecutionErrorMetadata,
    createExecutionObservation,
    createObservationConsoleSummary,
    countConsoleEntries,
    createObservationStageSummaries,
    createPersistedExecutionStatus,
    createPersistedLogSummary,
    createPersistedTestResultRecords,
    createFriendlyStageSummary,
  } = dependencies;
  const runtimeQueries = repositories.runtime.queries;
  const scriptRepository = repositories.resources.scripts;

  app.post('/api/executions/run', async (req, res) => {
    const input = req.body?.request;
    const validationError = validateRequestDefinition(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_request_execution', validationError);
    }

    const executionId = randomUUID();
    const startedAt = new Date().toISOString();
    const startedAtMs = Date.now();
    const executionSignal = registerActiveExecution(executionId).signal;

    try {
      let executionRequest = createExecutionRequestSeed(input);
      const stageResults = {};
      let target = null;
      let responseStatus = null;
      let responseHeaders = [];
      let responseBodyText = '';

      try {
        const linkedScriptResolution = resolveRequestScriptsForExecution(
          executionRequest.scripts,
          (scriptId) => normalizePersistedSavedScriptRecord(scriptRepository.read(scriptId)),
        );
        executionRequest = {
          ...executionRequest,
          scripts: linkedScriptResolution.resolvedScripts,
        };
      } catch (error) {
        Object.assign(stageResults, createLinkedScriptRunStageResult(error));
      }

      let resolvedExecutionRequest = {
        ...executionRequest,
        selectedEnvironmentLabel: 'No environment selected',
        environmentResolutionSummary: createEnvironmentResolutionSummary({
          selectedEnvironmentId: executionRequest.selectedEnvironmentId || null,
        }),
      };
      let resolvedEnvironmentRecord = null;

      if (!stageResults['pre-request']) {
        const preRequestStage = await executeScriptStage('pre-request', executionRequest.scripts.preRequest, {
          executionRequest,
          signal: executionSignal,
        });
        stageResults['pre-request'] = preRequestStage.stageResult;
        if (preRequestStage.executionRequest) {
          executionRequest = preRequestStage.executionRequest;
        }
      }

      if (stageResults.transport?.status === 'blocked') {
        // Linked saved-script validation already produced a blocked run summary.
      } else if (
        stageResults['pre-request'].status === 'blocked'
        || stageResults['pre-request'].status === 'failed'
        || stageResults['pre-request'].status === 'timed_out'
      ) {
        stageResults.transport = createTransportSkippedStageResult(
          'Transport did not start because the Pre-request stage did not complete successfully.',
        );
        stageResults['post-response'] = createSkippedScriptStageAfterTransport(
          'post-response',
          'Post-response did not run because transport never started.',
        );
        stageResults.tests = createSkippedScriptStageAfterTransport(
          'tests',
          'Tests did not run because transport never started.',
        );
      } else {
        if (executionRequest.selectedEnvironmentId) {
          resolvedEnvironmentRecord = readWorkspaceEnvironmentReference(
            executionRequest.workspaceId || defaultWorkspaceId,
            executionRequest.selectedEnvironmentId,
          );

          if (!resolvedEnvironmentRecord) {
            resolvedExecutionRequest = {
              ...executionRequest,
              selectedEnvironmentLabel: 'Missing environment reference',
              environmentResolutionSummary: createEnvironmentResolutionSummary({
                selectedEnvironmentId: executionRequest.selectedEnvironmentId || null,
                missingEnvironmentReference: true,
              }),
            };
            stageResults.transport = createTransportBlockedStageResult(
              'Transport did not run because the selected environment reference is missing.',
              'request_environment_not_found',
              'Selected environment was not found in this workspace.',
            );
            stageResults['post-response'] = createSkippedScriptStageAfterTransport(
              'post-response',
              'Post-response did not run because transport never started.',
            );
            stageResults.tests = createSkippedScriptStageAfterTransport(
              'tests',
              'Tests did not run because transport never started.',
            );
          }
        }

        if (!stageResults.transport) {
          const resolution = resolveExecutionRequestWithEnvironment(
            executionRequest,
            resolvedEnvironmentRecord,
          );
          const environmentResolutionSummary = createEnvironmentResolutionSummary({
            selectedEnvironmentId: executionRequest.selectedEnvironmentId || null,
            resolvedPlaceholderCount: resolution.resolvedPlaceholderCount,
            unresolved: resolution.unresolved,
            affectedInputAreas: resolution.affectedInputAreas,
          });

          resolvedExecutionRequest = {
            ...resolution.request,
            selectedEnvironmentLabel: createResolvedEnvironmentLabel(resolvedEnvironmentRecord),
            environmentResolutionSummary,
          };

          if (resolution.unresolved.length > 0) {
            const unresolvedSummary = summarizeUnresolvedEnvironmentPlaceholders(resolution.unresolved);

            stageResults.transport = createTransportBlockedStageResult(
              'Transport did not run because environment resolution left placeholders unresolved.',
              'environment_resolution_unresolved',
              unresolvedSummary,
            );
            stageResults['post-response'] = createSkippedScriptStageAfterTransport(
              'post-response',
              'Post-response did not run because transport never started.',
            );
            stageResults.tests = createSkippedScriptStageAfterTransport(
              'tests',
              'Tests did not run because transport never started.',
            );
          } else if (
            resolvedExecutionRequest.bodyMode === 'json'
            && resolvedExecutionRequest.bodyText.trim().length > 0
          ) {
            try {
              JSON.parse(resolvedExecutionRequest.bodyText);
            } catch {
              resolvedExecutionRequest = {
                ...resolvedExecutionRequest,
                environmentResolutionSummary: createEnvironmentResolutionSummary({
                  selectedEnvironmentId: executionRequest.selectedEnvironmentId || null,
                  resolvedPlaceholderCount: resolution.resolvedPlaceholderCount,
                  unresolved: resolution.unresolved,
                  affectedInputAreas: resolution.affectedInputAreas,
                  invalidResolvedJson: true,
                }),
              };
              stageResults.transport = createTransportBlockedStageResult(
                'Transport did not run because environment resolution produced invalid JSON body content.',
                'environment_resolution_invalid_json',
                'Resolved JSON body is invalid after environment substitution.',
              );
              stageResults['post-response'] = createSkippedScriptStageAfterTransport(
                'post-response',
                'Post-response did not run because transport never started.',
              );
              stageResults.tests = createSkippedScriptStageAfterTransport(
                'tests',
                'Tests did not run because transport never started.',
              );
            }
          }
        }

        if (!stageResults.transport) {
          try {
            target = createExecutionRequestTarget(
              resolvedExecutionRequest.url,
              resolvedExecutionRequest.params,
              resolvedExecutionRequest.auth,
            );
            const headers = createExecutionHeaders(
              resolvedExecutionRequest.headers,
              resolvedExecutionRequest.auth,
            );
            const body = createExecutionBody(resolvedExecutionRequest, headers);
            const response = await fetch(target.toString(), {
              method: resolvedExecutionRequest.method,
              headers,
              signal: executionSignal,
              ...(body !== undefined ? { body } : {}),
            });

            responseStatus = response.status;
            responseBodyText = await response.text();
            responseHeaders = Array.from(response.headers.entries()).map(([name, value]) => ({
              name,
              value,
            }));
            stageResults.transport = createTransportStageResult(
              response.status,
              createHostPathHint(target.toString()),
            );
            const postResponseStage = await executeScriptStage(
              'post-response',
              resolvedExecutionRequest.scripts.postResponse,
              {
                executionRequest: resolvedExecutionRequest,
                target,
                responseStatus,
                responseHeaders,
                responseBodyText,
                signal: executionSignal,
              },
            );
            stageResults['post-response'] = postResponseStage.stageResult;
            const testsStage = await executeScriptStage('tests', resolvedExecutionRequest.scripts.tests, {
              executionRequest: resolvedExecutionRequest,
              target,
              responseStatus,
              responseHeaders,
              responseBodyText,
              signal: executionSignal,
            });
            stageResults.tests = testsStage.stageResult;
          } catch (error) {
            stageResults.transport = executionSignal.aborted || error?.name === 'AbortError'
              ? createTransportCancelledStageResult('Transport was cancelled before a response snapshot was available.')
              : createTransportFailureStageResult(error);
            stageResults['post-response'] = createSkippedScriptStageAfterTransport(
              'post-response',
              'Post-response did not run because transport failed before a response snapshot was available.',
            );
            stageResults.tests = createSkippedScriptStageAfterTransport(
              'tests',
              'Tests did not run because transport failed before a response snapshot was available.',
            );
          }
        }
      }

      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startedAtMs;
      const requestSnapshot = createPersistedRequestSnapshotSafely(resolvedExecutionRequest, target);
      const responseBodyPreview = responseBodyText.slice(0, 4000);
      const executionOutcome = deriveExecutionOutcome(stageResults);
      const consoleEntries = createCombinedConsoleEntries(stageResults);
      const consoleWarningCount = countConsoleWarnings(stageResults);
      const testsSummary = createObservationTestsSummary(stageResults);
      const testEntries = createObservationTestEntries(stageResults);
      const { errorCode, errorSummary } = createExecutionErrorMetadata(stageResults);

      const execution = createExecutionObservation({
        executionId,
        executionOutcome,
        responseStatus,
        responseHeaders,
        responseBodyPreview,
        responsePreviewLength: responseBodyText.length > 0 ? Buffer.byteLength(responseBodyText, 'utf8') : 0,
        responsePreviewTruncated: responseBodyText.length > 4000,
        startedAt,
        completedAt,
        durationMs,
        requestSnapshot,
        consoleSummary: createObservationConsoleSummary(stageResults, consoleEntries, consoleWarningCount),
        consoleEntries,
        consoleLogCount: countConsoleEntries(stageResults),
        consoleWarningCount,
        testsSummary,
        testEntries,
        stageSummaries: createObservationStageSummaries(stageResults),
        ...(errorCode ? { errorCode } : {}),
        ...(errorSummary ? { errorSummary } : {}),
      });

      runtimeQueries.insertExecutionHistory({
        id: executionId,
        workspaceId: input.workspaceId || null,
        requestId: input.id || null,
        environmentId: resolvedExecutionRequest.selectedEnvironmentId || null,
        status: createPersistedExecutionStatus(executionOutcome),
        cancellationOutcome: null,
        startedAt,
        completedAt,
        durationMs,
        errorCode: errorCode || null,
        errorMessage: errorSummary || null,
      });
      runtimeQueries.insertExecutionResult({
        executionId,
        responseStatus,
        responseHeadersJson: JSON.stringify(responseHeaders),
        responseBodyPreview,
        responseBodyRedacted: true,
        stageStatusJson: JSON.stringify({
          preRequest: stageResults['pre-request'],
          transport: stageResults.transport,
          postResponse: stageResults['post-response'],
          tests: stageResults.tests,
        }),
        logSummaryJson: JSON.stringify(createPersistedLogSummary(stageResults)),
        requestSnapshotJson: JSON.stringify(requestSnapshot),
        redactionApplied: true,
      });
      runtimeQueries.insertTestResults(createPersistedTestResultRecords(executionId, stageResults.tests));

      return sendData(res, { execution });
    } catch (error) {
      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startedAtMs;
      const requestSnapshot = createPersistedRequestSnapshotSafely({
        ...input,
        selectedEnvironmentLabel: input?.selectedEnvironmentId ? 'Selected environment' : 'No environment selected',
        ...(input?.selectedEnvironmentId
          ? {}
          : {
            environmentResolutionSummary: createEnvironmentResolutionSummary({
              selectedEnvironmentId: null,
            }),
          }),
      }, null);

      const executionOutcome = executionSignal.aborted ? 'Cancelled' : 'Failed';
      const transportStageResult = executionSignal.aborted
        ? createTransportCancelledStageResult('Run lane was cancelled before execution could complete.')
        : createTransportFailureStageResult(error);
      const execution = createExecutionObservation({
        executionId,
        executionOutcome,
        responseStatus: null,
        responseHeaders: [],
        responseBodyPreview: '',
        responsePreviewLength: 0,
        responsePreviewTruncated: false,
        startedAt,
        completedAt,
        durationMs,
        requestSnapshot,
        consoleSummary: 'No console entries were captured because the run lane itself failed before script diagnostics could be summarized.',
        consoleEntries: [],
        consoleLogCount: 0,
        consoleWarningCount: 0,
        testsSummary: 'No tests were recorded because the run lane failed before execution could complete.',
        testEntries: [],
        stageSummaries: [
          createFriendlyStageSummary('transport', transportStageResult),
        ],
        errorCode: transportStageResult.errorCode || error?.code || error?.cause?.code || 'execution_failed',
        errorSummary: transportStageResult.errorSummary || error.message,
      });

      try {
        runtimeQueries.insertExecutionHistory({
          id: executionId,
          workspaceId: input.workspaceId || null,
          requestId: input.id || null,
          environmentId: typeof input?.selectedEnvironmentId === 'string' && input.selectedEnvironmentId.trim().length > 0
            ? input.selectedEnvironmentId.trim()
            : null,
          status: executionOutcome === 'Cancelled' ? 'cancelled' : 'failed',
          cancellationOutcome: executionOutcome === 'Cancelled' ? 'api_request' : null,
          startedAt,
          completedAt,
          durationMs,
          errorCode: transportStageResult.errorCode || error?.code || error?.cause?.code || 'execution_failed',
          errorMessage: transportStageResult.errorSummary || error.message,
        });
        runtimeQueries.insertExecutionResult({
          executionId,
          responseStatus: null,
          responseHeadersJson: '[]',
          responseBodyPreview: '',
          responseBodyRedacted: true,
          stageStatusJson: JSON.stringify({
            transport: transportStageResult,
          }),
          logSummaryJson: JSON.stringify({ consoleEntries: 0, consoleWarnings: 0, consolePreview: [] }),
          requestSnapshotJson: JSON.stringify(requestSnapshot),
          redactionApplied: true,
        });
      } catch (storageError) {
        console.error('Execution persistence error:', storageError);
      }

      return sendData(res, { execution });
    } finally {
      clearActiveExecution(executionId);
    }
  });
}

module.exports = {
  registerExecutionRoutes,
};

