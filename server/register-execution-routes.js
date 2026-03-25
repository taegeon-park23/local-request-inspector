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
    resolveEnvironmentSecretValues = async () => ({ secretValuesByKey: {} }),
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
    listWorkspaceSavedRequestRecords,
    buildWorkspaceRequestTree,
  } = dependencies;
  const runtimeQueries = repositories.runtime.queries;
  const scriptRepository = repositories.resources.scripts;

  function createSecretProviderResolutionSummary(error) {
    const action = typeof error?.details?.action === 'string' && error.details.action.trim().length > 0
      ? error.details.action.trim()
      : 'resolve';

    return `Secret provider ${action} failed while preparing environment placeholders.`;
  }

  async function executeSingleRun(input) {
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
          let secretValuesByKey = {};

          if (resolvedEnvironmentRecord) {
            try {
              const secretResolution = await resolveEnvironmentSecretValues(resolvedEnvironmentRecord, {
                workspaceId: executionRequest.workspaceId || defaultWorkspaceId,
                environmentId: resolvedEnvironmentRecord.id,
              });
              secretValuesByKey = secretResolution?.secretValuesByKey
                && typeof secretResolution.secretValuesByKey === 'object'
                ? secretResolution.secretValuesByKey
                : {};
            } catch (error) {
              stageResults.transport = createTransportBlockedStageResult(
                'Transport did not run because secret provider resolution failed.',
                'secret_provider_error',
                createSecretProviderResolutionSummary(error),
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
              {
                secretValuesByKey,
              },
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

      return execution;
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

      return execution;
    } finally {
      clearActiveExecution(executionId);
    }
  }

  function findCollectionNode(tree, collectionId) {
    return tree.find((collection) => collection.collectionId === collectionId) ?? null;
  }

  function findRequestGroupNode(tree, requestGroupId) {
    function walk(groups) {
      for (const group of groups ?? []) {
        if (group.requestGroupId === requestGroupId) {
          return group;
        }
        const match = walk(group.childGroups);
        if (match) {
          return match;
        }
      }
      return null;
    }

    for (const collection of tree) {
      const match = walk(collection.childGroups);
      if (match) {
        return {
          collection,
          requestGroup: match,
        };
      }
    }

    return null;
  }

  function collectRequestsDepthFirst(groupNode, collected = []) {
    for (const childGroup of groupNode.childGroups ?? []) {
      collectRequestsDepthFirst(childGroup, collected);
    }

    for (const requestNode of groupNode.requests ?? []) {
      collected.push(requestNode.request);
    }

    return collected;
  }

  function createBatchExecution(containerType, container, requestLeaves, stepResults, startedAt, completedAt, durationMs) {
    const aggregate = {
      totalRuns: stepResults.length,
      succeededCount: stepResults.filter((step) => step.execution.executionOutcome === 'Succeeded').length,
      failedCount: stepResults.filter((step) => step.execution.executionOutcome === 'Failed').length,
      blockedCount: stepResults.filter((step) => step.execution.executionOutcome === 'Blocked').length,
      timedOutCount: stepResults.filter((step) => step.execution.executionOutcome === 'Timed out').length,
    };

    let aggregateOutcome = 'Succeeded';
    if (aggregate.totalRuns === 0) {
      aggregateOutcome = 'Empty';
    } else if (aggregate.failedCount > 0) {
      aggregateOutcome = 'Failed';
    } else if (aggregate.blockedCount > 0) {
      aggregateOutcome = 'Blocked';
    } else if (aggregate.timedOutCount > 0) {
      aggregateOutcome = 'Timed out';
    }

    return {
      batchExecutionId: randomUUID(),
      containerType,
      containerId: container.id,
      containerName: container.name,
      executionOrder: 'depth-first-sequential',
      continuedAfterFailure: true,
      startedAt,
      completedAt,
      durationMs,
      aggregateOutcome,
      requestCount: requestLeaves.length,
      ...aggregate,
      steps: stepResults,
    };
  }

  async function runBatch(containerType, containerId, workspaceId) {
    const requestTree = buildWorkspaceRequestTree(workspaceId);
    const savedRequestsById = new Map(
      listWorkspaceSavedRequestRecords(workspaceId).map((record) => [record.id, record]),
    );

    let container = null;
    let requestLeaves = [];

    if (containerType === 'collection') {
      const collection = findCollectionNode(requestTree.tree, containerId);
      if (!collection) {
        const error = new Error('Collection was not found.');
        error.code = 'collection_not_found';
        throw error;
      }
      container = { id: collection.collectionId, name: collection.name };
      for (const childGroup of collection.childGroups ?? []) {
        collectRequestsDepthFirst(childGroup, requestLeaves);
      }
    } else {
      const locatedRequestGroup = findRequestGroupNode(requestTree.tree, containerId);
      if (!locatedRequestGroup) {
        const error = new Error('Request group was not found.');
        error.code = 'request_group_not_found';
        throw error;
      }
      container = { id: locatedRequestGroup.requestGroup.requestGroupId, name: locatedRequestGroup.requestGroup.name };
      requestLeaves = collectRequestsDepthFirst(locatedRequestGroup.requestGroup, []);
    }

    const startedAt = new Date().toISOString();
    const startedAtMs = Date.now();
    const stepResults = [];

    for (const requestLeaf of requestLeaves) {
      const savedRequest = savedRequestsById.get(requestLeaf.id);
      if (!savedRequest) {
        continue;
      }

      const execution = await executeSingleRun(savedRequest);
      stepResults.push({
        stepIndex: stepResults.length + 1,
        requestId: requestLeaf.id,
        requestName: requestLeaf.name,
        collectionId: requestLeaf.collectionId,
        collectionName: requestLeaf.collectionName,
        requestGroupId: requestLeaf.requestGroupId,
        requestGroupName: requestLeaf.requestGroupName,
        execution,
      });
    }

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAtMs;
    return createBatchExecution(containerType, container, requestLeaves, stepResults, startedAt, completedAt, durationMs);
  }

  app.post('/api/executions/run', async (req, res) => {
    const input = req.body?.request;
    const validationError = validateRequestDefinition(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_request_execution', validationError);
    }

    try {
      const execution = await executeSingleRun(input);
      return sendData(res, { execution });
    } catch (error) {
      return sendError(res, 500, 'execution_run_failed', error.message);
    }
  });

  app.post('/api/collections/:collectionId/run', async (req, res) => {
    try {
      const batchExecution = await runBatch('collection', req.params.collectionId, defaultWorkspaceId);
      return sendData(res, { batchExecution });
    } catch (error) {
      if (error.code === 'collection_not_found') {
        return sendError(res, 404, error.code, error.message, {
          collectionId: req.params.collectionId,
        });
      }

      return sendError(res, 500, 'collection_batch_run_failed', error.message, {
        collectionId: req.params.collectionId,
      });
    }
  });

  app.post('/api/request-groups/:requestGroupId/run', async (req, res) => {
    try {
      const batchExecution = await runBatch('request-group', req.params.requestGroupId, defaultWorkspaceId);
      return sendData(res, { batchExecution });
    } catch (error) {
      if (error.code === 'request_group_not_found') {
        return sendError(res, 404, error.code, error.message, {
          requestGroupId: req.params.requestGroupId,
        });
      }

      return sendError(res, 500, 'request_group_batch_run_failed', error.message, {
        requestGroupId: req.params.requestGroupId,
      });
    }
  });
}

module.exports = {
  registerExecutionRoutes,
};
