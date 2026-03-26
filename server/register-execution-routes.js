const { randomUUID } = require('node:crypto');
const { Readable } = require('node:stream');

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
    listWorkspaceSavedRequestRecords = () => [],
    listWorkspaceCollectionRecords = () => [],
    listWorkspaceRequestGroupRecords = () => [],
    buildWorkspaceRequestTree,
    applyExecutionDefaults = (request) => request,
    createEffectiveEnvironmentContext = ({ selectedEnvironmentRecord } = {}) => ({
      environmentRecord: selectedEnvironmentRecord ?? null,
      selectedEnvironmentId: selectedEnvironmentRecord?.id ?? null,
      selectedEnvironmentLabel: selectedEnvironmentRecord?.name || 'No environment selected',
    }),
  } = dependencies;
  const runtimeQueries = repositories.runtime.queries;
  const scriptRepository = repositories.resources.scripts;
  const DEFAULT_TRANSPORT_TIMEOUT_MS = 5000;
  const MIN_TRANSPORT_TIMEOUT_MS = 100;
  const MAX_TRANSPORT_TIMEOUT_MS = 120000;
  const BATCH_EXECUTION_ORDER_DEPTH_FIRST = 'depth-first-sequential';
  const MAX_BATCH_ITERATION_COUNT = 25;
  const MULTIPART_MAX_FILE_COUNT = 5;
  const MULTIPART_MAX_FILE_BYTES = 20 * 1024 * 1024;
  const MULTIPART_MAX_TOTAL_BYTES = 50 * 1024 * 1024;

  function createInvalidBatchRunInputError(message) {
    const error = new Error(message);
    error.code = 'invalid_batch_run_input';
    return error;
  }

  function normalizeBatchEnvironmentId(value, fieldName) {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw createInvalidBatchRunInputError(`${fieldName} must be a string or null.`);
    }

    const normalized = value.trim();
    if (normalized.length === 0) {
      throw createInvalidBatchRunInputError(`${fieldName} cannot be an empty string.`);
    }

    return normalized;
  }

  function parseBatchRunInput(runInput) {
    if (runInput === undefined || runInput === null) {
      return {
        executionOrder: BATCH_EXECUTION_ORDER_DEPTH_FIRST,
        continueOnError: true,
        requestIds: null,
        iterationCount: 1,
        dataFilePath: null,
        environmentOverrideApplied: false,
        selectedEnvironmentId: null,
      };
    }

    if (typeof runInput !== 'object' || Array.isArray(runInput)) {
      throw createInvalidBatchRunInputError('Batch run input must be an object.');
    }

    const run = runInput;
    const executionOrderCandidate = run.executionOrder;
    if (
      executionOrderCandidate !== undefined
      && executionOrderCandidate !== BATCH_EXECUTION_ORDER_DEPTH_FIRST
    ) {
      throw createInvalidBatchRunInputError(
        `executionOrder must be "${BATCH_EXECUTION_ORDER_DEPTH_FIRST}".`,
      );
    }

    let continueOnError = true;
    if (run.continueOnError !== undefined) {
      if (typeof run.continueOnError !== 'boolean') {
        throw createInvalidBatchRunInputError('continueOnError must be a boolean.');
      }

      continueOnError = run.continueOnError;
    }

    let requestIds = null;
    if (run.requestIds !== undefined) {
      if (!Array.isArray(run.requestIds)) {
        throw createInvalidBatchRunInputError('requestIds must be an array of request ids.');
      }

      const dedupedRequestIds = [];
      const requestIdSet = new Set();

      for (const requestIdCandidate of run.requestIds) {
        if (typeof requestIdCandidate !== 'string' || requestIdCandidate.trim().length === 0) {
          throw createInvalidBatchRunInputError('requestIds must only include non-empty string ids.');
        }

        const normalizedRequestId = requestIdCandidate.trim();

        if (!requestIdSet.has(normalizedRequestId)) {
          requestIdSet.add(normalizedRequestId);
          dedupedRequestIds.push(normalizedRequestId);
        }
      }

      requestIds = dedupedRequestIds;
    }

    let iterationCount = 1;
    if (run.iterationCount !== undefined) {
      if (!Number.isFinite(run.iterationCount)) {
        throw createInvalidBatchRunInputError('iterationCount must be a finite number.');
      }

      iterationCount = Math.floor(Number(run.iterationCount));
      if (iterationCount < 1 || iterationCount > MAX_BATCH_ITERATION_COUNT) {
        throw createInvalidBatchRunInputError(`iterationCount must be between 1 and ${MAX_BATCH_ITERATION_COUNT}.`);
      }
    }

    let dataFilePath = null;
    if (run.dataFilePath !== undefined && run.dataFilePath !== null) {
      if (typeof run.dataFilePath !== 'string') {
        throw createInvalidBatchRunInputError('dataFilePath must be a string when provided.');
      }

      const normalizedDataFilePath = run.dataFilePath.trim();
      dataFilePath = normalizedDataFilePath.length > 0 ? normalizedDataFilePath : null;
    }

    const hasEnvironmentId = Object.prototype.hasOwnProperty.call(run, 'environmentId');
    const hasSelectedEnvironmentId = Object.prototype.hasOwnProperty.call(run, 'selectedEnvironmentId');
    let selectedEnvironmentId = null;
    let environmentOverrideApplied = false;

    if (hasEnvironmentId || hasSelectedEnvironmentId) {
      const normalizedEnvironmentId = normalizeBatchEnvironmentId(run.environmentId, 'environmentId');
      const normalizedSelectedEnvironmentId = normalizeBatchEnvironmentId(
        run.selectedEnvironmentId,
        'selectedEnvironmentId',
      );

      if (
        hasEnvironmentId
        && hasSelectedEnvironmentId
        && normalizedEnvironmentId !== normalizedSelectedEnvironmentId
      ) {
        throw createInvalidBatchRunInputError(
          'environmentId and selectedEnvironmentId must match when both are provided.',
        );
      }

      selectedEnvironmentId = hasEnvironmentId
        ? normalizedEnvironmentId
        : normalizedSelectedEnvironmentId;
      environmentOverrideApplied = true;
    }

    return {
      executionOrder: BATCH_EXECUTION_ORDER_DEPTH_FIRST,
      continueOnError,
      requestIds,
      iterationCount,
      dataFilePath,
      environmentOverrideApplied,
      selectedEnvironmentId,
    };
  }

  function createSecretProviderResolutionSummary(error) {
    const action = typeof error?.details?.action === 'string' && error.details.action.trim().length > 0
      ? error.details.action.trim()
      : 'resolve';

    return `Secret provider ${action} failed while preparing environment placeholders.`;
  }

  function normalizeMultipartRowValueType(valueType) {
    return valueType === 'file' ? 'file' : 'text';
  }

  function isMultipartFileMethodSupported(method) {
    return method === 'POST' || method === 'PUT';
  }

  function createMultipartExecutionError(code, message, details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
  }

  function listEnabledMultipartFileRows(request) {
    if (request?.bodyMode !== 'multipart-form-data' || !Array.isArray(request?.multipartBody)) {
      return [];
    }

    return request.multipartBody
      .filter((row) => (
        row
        && row.enabled !== false
        && typeof row.id === 'string'
        && row.id.trim().length > 0
        && typeof row.key === 'string'
        && row.key.trim().length > 0
        && normalizeMultipartRowValueType(row.valueType) === 'file'
      ))
      .map((row) => ({
        id: row.id.trim(),
        key: row.key.trim(),
      }));
  }

  function validateMultipartExecutionMethod(requestInput) {
    const method = typeof requestInput?.method === 'string' ? requestInput.method.trim().toUpperCase() : '';

    if (!isMultipartFileMethodSupported(method)) {
      throw createMultipartExecutionError(
        'multipart_file_method_not_allowed',
        'Multipart file fields can run only with POST or PUT methods.',
        { method: method || requestInput?.method || null },
      );
    }
  }

  function validateMultipartUploadLimits(multipartFilesByRowId) {
    const fileEntries = Object.entries(multipartFilesByRowId)
      .flatMap(([rowId, files]) => files.map((file) => ({ rowId, file })));

    if (fileEntries.length > MULTIPART_MAX_FILE_COUNT) {
      throw createMultipartExecutionError(
        'multipart_file_limit_exceeded',
        `Multipart upload supports up to ${MULTIPART_MAX_FILE_COUNT} files per run.`,
        {
          fileCount: fileEntries.length,
          maxFileCount: MULTIPART_MAX_FILE_COUNT,
        },
      );
    }

    let totalBytes = 0;

    for (const { rowId, file } of fileEntries) {
      const fileBytes = Buffer.isBuffer(file.buffer) ? file.buffer.byteLength : 0;

      if (fileBytes > MULTIPART_MAX_FILE_BYTES) {
        throw createMultipartExecutionError(
          'multipart_file_limit_exceeded',
          `Each multipart upload file must be ${Math.floor(MULTIPART_MAX_FILE_BYTES / (1024 * 1024))} MB or smaller.`,
          {
            rowId,
            fileName: file.name,
            fileBytes,
            maxFileBytes: MULTIPART_MAX_FILE_BYTES,
          },
        );
      }

      totalBytes += fileBytes;
      if (totalBytes > MULTIPART_MAX_TOTAL_BYTES) {
        throw createMultipartExecutionError(
          'multipart_file_limit_exceeded',
          `Total multipart upload size must stay within ${Math.floor(MULTIPART_MAX_TOTAL_BYTES / (1024 * 1024))} MB.`,
          {
            totalBytes,
            maxTotalBytes: MULTIPART_MAX_TOTAL_BYTES,
          },
        );
      }
    }
  }

  async function parseExecutionUploadPayload(req) {
    const contentType = String(req.headers['content-type'] || '');

    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      throw createMultipartExecutionError(
        'invalid_request_execution',
        'Multipart form-data payload is required.',
      );
    }

    let formData;

    try {
      const formRequest = new Request('http://localhost/api/executions/run-upload', {
        method: 'POST',
        headers: { 'content-type': contentType },
        body: Readable.toWeb(req),
        duplex: 'half',
      });
      formData = await formRequest.formData();
    } catch (error) {
      throw createMultipartExecutionError(
        'invalid_request_execution',
        'Failed to parse multipart upload payload.',
        { cause: error?.message || String(error) },
      );
    }

    const requestPart = formData.get('request');

    if (typeof requestPart !== 'string' || requestPart.trim().length === 0) {
      throw createMultipartExecutionError(
        'invalid_request_execution',
        'Multipart payload must include a non-empty request JSON field.',
      );
    }

    let requestInput;

    try {
      requestInput = JSON.parse(requestPart);
    } catch {
      throw createMultipartExecutionError(
        'invalid_request_execution',
        'Multipart request field must contain valid JSON.',
      );
    }

    const multipartFilesByRowId = {};

    for (const [fieldName, fieldValue] of formData.entries()) {
      if (!fieldName.startsWith('file:')) {
        continue;
      }

      const rowId = fieldName.slice('file:'.length).trim();
      if (rowId.length === 0) {
        throw createMultipartExecutionError(
          'invalid_request_execution',
          'Multipart file field names must follow the file:<rowId> format.',
        );
      }

      if (typeof fieldValue === 'string') {
        throw createMultipartExecutionError(
          'invalid_request_execution',
          'Multipart file fields must include binary file parts.',
          { rowId },
        );
      }

      const arrayBuffer = await fieldValue.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      const fileRecord = {
        name: typeof fieldValue.name === 'string' && fieldValue.name.trim().length > 0
          ? fieldValue.name.trim()
          : 'upload.bin',
        type: typeof fieldValue.type === 'string' && fieldValue.type.trim().length > 0
          ? fieldValue.type.trim()
          : 'application/octet-stream',
        buffer: fileBuffer,
      };

      if (!Array.isArray(multipartFilesByRowId[rowId])) {
        multipartFilesByRowId[rowId] = [];
      }

      multipartFilesByRowId[rowId].push(fileRecord);
    }

    validateMultipartUploadLimits(multipartFilesByRowId);

    return { requestInput, multipartFilesByRowId };
  }

  function validateMultipartExecutionRequest(requestInput, multipartFilesByRowId) {
    const enabledFileRows = listEnabledMultipartFileRows(requestInput);

    if (enabledFileRows.length === 0) {
      if (Object.keys(multipartFilesByRowId).length > 0) {
        throw createMultipartExecutionError(
          'invalid_request_execution',
          'Uploaded files were provided but no enabled multipart file fields were found in the request definition.',
        );
      }

      return;
    }

    validateMultipartExecutionMethod(requestInput);

    const enabledRowIdSet = new Set(enabledFileRows.map((row) => row.id));

    for (const rowId of Object.keys(multipartFilesByRowId)) {
      if (!enabledRowIdSet.has(rowId)) {
        throw createMultipartExecutionError(
          'invalid_request_execution',
          'Multipart upload payload includes file rows that are not enabled in the request definition.',
          { rowId },
        );
      }
    }

    const missingRows = enabledFileRows.filter((row) => {
      const files = multipartFilesByRowId[row.id] || [];
      return files.length === 0;
    });

    if (missingRows.length > 0) {
      throw createMultipartExecutionError(
        'multipart_file_missing',
        'Select at least one file for each enabled multipart file field before running.',
        {
          missingRowIds: missingRows.map((row) => row.id),
          missingFieldKeys: missingRows.map((row) => row.key),
        },
      );
    }
  }

  function createObservationAssertionResults(stageResults) {
    if (!Array.isArray(stageResults?.tests?.testResults)) {
      return [];
    }

    return stageResults.tests.testResults.map((result) => ({
      id: result.id,
      name: result.name,
      status: result.status,
      message: result.message,
    }));
  }

  function createObservationAssertionSummary(assertionResults) {
    const total = assertionResults.length;
    const failed = assertionResults.filter((result) => result.status === 'failed').length;
    const passed = total - failed;

    return {
      total,
      passed,
      failed,
    };
  }

  function clampTransportTimeoutMs(value) {
    if (!Number.isFinite(value)) {
      return DEFAULT_TRANSPORT_TIMEOUT_MS;
    }

    const roundedValue = Math.floor(Number(value));

    if (roundedValue <= 0) {
      return DEFAULT_TRANSPORT_TIMEOUT_MS;
    }

    return Math.min(MAX_TRANSPORT_TIMEOUT_MS, Math.max(MIN_TRANSPORT_TIMEOUT_MS, roundedValue));
  }

  function readTransportTimeoutMs(runConfig) {
    return clampTransportTimeoutMs(runConfig?.timeoutMs);
  }

  function createTransportTimedOutStageResult(timeoutMs) {
    return {
      stageId: 'transport',
      status: 'timed_out',
      summary: `Transport timed out after ${timeoutMs} ms before a response snapshot was available.`,
      errorCode: 'execution_timeout',
      errorSummary: `Transport exceeded the bounded ${timeoutMs} ms timeout before a response snapshot was available.`,
    };
  }

  function createUnhandledScriptStageFailureResult(stageId, error) {
    const stageLabel = stageId === 'tests' ? 'Tests' : 'Post-response';
    const fallbackSummary = `${stageLabel} failed before a bounded stage result was returned.`;
    const summary = typeof error?.message === 'string' && error.message.trim().length > 0
      ? error.message
      : fallbackSummary;

    return {
      stageId,
      status: 'failed',
      summary,
      errorCode: error?.code || error?.cause?.code || 'script_stage_failed',
      errorSummary: summary,
      consoleEntries: [],
      consoleLogCount: 0,
      consoleWarningCount: 0,
      testResults: [],
    };
  }

  async function executeSingleRun(input) {
    const executionId = randomUUID();
    const startedAt = new Date().toISOString();
    const startedAtMs = Date.now();
    const executionSignal = registerActiveExecution(executionId).signal;

    try {
      let executionRequest = createExecutionRequestSeed(input);
      const workspaceId = executionRequest.workspaceId || defaultWorkspaceId;
      const collectionRecord = listWorkspaceCollectionRecords(workspaceId)
        .find((record) => record.id === executionRequest.collectionId) ?? null;
      const requestGroupRecord = listWorkspaceRequestGroupRecords(workspaceId)
        .find((record) => record.id === executionRequest.requestGroupId) ?? null;
      executionRequest = applyExecutionDefaults(executionRequest, {
        collectionRecord,
        requestGroupRecord,
      });
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
            const effectiveEnvironmentContext = createEffectiveEnvironmentContext({
              workspaceId,
              selectedEnvironmentRecord: resolvedEnvironmentRecord,
              collectionRecord,
              requestGroupRecord,
            });
            const resolution = resolveExecutionRequestWithEnvironment(
              executionRequest,
              effectiveEnvironmentContext.environmentRecord,
              {
                secretValuesByKey,
              },
            );
            const environmentResolutionSummary = createEnvironmentResolutionSummary({
              selectedEnvironmentId: effectiveEnvironmentContext.selectedEnvironmentId,
              resolvedPlaceholderCount: resolution.resolvedPlaceholderCount,
              unresolved: resolution.unresolved,
              affectedInputAreas: resolution.affectedInputAreas,
            });

            resolvedExecutionRequest = {
              ...resolution.request,
              selectedEnvironmentId: effectiveEnvironmentContext.selectedEnvironmentId,
              selectedEnvironmentLabel: effectiveEnvironmentContext.selectedEnvironmentLabel
                || createResolvedEnvironmentLabel(resolvedEnvironmentRecord),
              environmentResolutionSummary,
              runConfig: executionRequest.runConfig || {},
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
                    selectedEnvironmentId: effectiveEnvironmentContext.selectedEnvironmentId,
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
          const transportTimeoutMs = readTransportTimeoutMs(resolvedExecutionRequest.runConfig);
          const transportController = typeof AbortController === 'function'
            ? new AbortController()
            : null;
          let transportAbortListener = null;
          let transportTimeoutHandle = null;
          let transportTimedOut = false;

          if (transportController) {
            transportAbortListener = () => {
              transportController.abort(executionSignal.reason || 'Execution was cancelled.');
            };

            if (executionSignal.aborted) {
              transportAbortListener();
            } else {
              executionSignal.addEventListener('abort', transportAbortListener, { once: true });
            }

            transportTimeoutHandle = setTimeout(() => {
              transportTimedOut = true;
              transportController.abort(`Transport timed out after ${transportTimeoutMs} ms.`);
            }, transportTimeoutMs);
          }

          const transportSignal = transportController?.signal ?? executionSignal;

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
              signal: transportSignal,
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
          } catch (error) {
            stageResults.transport = executionSignal.aborted
              ? createTransportCancelledStageResult('Transport was cancelled before a response snapshot was available.')
              : transportTimedOut
                ? createTransportTimedOutStageResult(transportTimeoutMs)
                : createTransportFailureStageResult(error);
            stageResults['post-response'] = createSkippedScriptStageAfterTransport(
              'post-response',
              'Post-response did not run because transport failed before a response snapshot was available.',
            );
            stageResults.tests = createSkippedScriptStageAfterTransport(
              'tests',
              'Tests did not run because transport failed before a response snapshot was available.',
            );
          } finally {
            if (transportTimeoutHandle) {
              clearTimeout(transportTimeoutHandle);
            }

            if (transportAbortListener) {
              executionSignal.removeEventListener('abort', transportAbortListener);
            }
          }
          if (stageResults.transport?.status === 'succeeded') {
            try {
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
              if (!stageResults['post-response']) {
                stageResults['post-response'] = createUnhandledScriptStageFailureResult('post-response', error);
                stageResults.tests = createSkippedScriptStageAfterTransport(
                  'tests',
                  'Tests did not run because Post-response failed before completion.',
                );
              } else {
                stageResults.tests = createUnhandledScriptStageFailureResult('tests', error);
              }
            }
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
      const assertionResults = createObservationAssertionResults(stageResults);
      const assertionSummary = createObservationAssertionSummary(assertionResults);
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
        assertionResults,
        assertionSummary,
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

  function createBatchExecution(containerType, container, requestLeaves, stepResults, startedAt, completedAt, durationMs, runPlan) {
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
      executionOrder: runPlan.executionOrder,
      continuedAfterFailure: runPlan.continueOnError,
      startedAt,
      completedAt,
      durationMs,
      aggregateOutcome,
      requestCount: requestLeaves.length,
      selectedRequestIds: runPlan.requestIds,
      iterationCount: runPlan.iterationCount,
      environmentOverrideApplied: runPlan.environmentOverrideApplied,
      selectedEnvironmentId: runPlan.environmentOverrideApplied
        ? runPlan.selectedEnvironmentId
        : null,
      dataFilePath: runPlan.dataFilePath,
      ...aggregate,
      steps: stepResults,
    };
  }

  async function runBatch(containerType, containerId, workspaceId, runInput) {
    const runPlan = parseBatchRunInput(runInput);
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

    if (Array.isArray(runPlan.requestIds)) {
      const requestedIdSet = new Set(runPlan.requestIds);
      requestLeaves = requestLeaves.filter((requestLeaf) => requestedIdSet.has(requestLeaf.id));
    }

    if (requestLeaves.length === 0) {
      const timestamp = new Date().toISOString();
      return createBatchExecution(containerType, container, [], [], timestamp, timestamp, 0, runPlan);
    }

    const startedAt = new Date().toISOString();
    const startedAtMs = Date.now();
    const stepResults = [];

    for (let iterationIndex = 0; iterationIndex < runPlan.iterationCount; iterationIndex += 1) {
      for (const requestLeaf of requestLeaves) {
        const savedRequest = savedRequestsById.get(requestLeaf.id);
        if (!savedRequest) {
          continue;
        }

        const executionInput = runPlan.environmentOverrideApplied
          ? {
              ...savedRequest,
              selectedEnvironmentId: runPlan.selectedEnvironmentId,
            }
          : savedRequest;

        const execution = await executeSingleRun(executionInput);
        stepResults.push({
          stepIndex: stepResults.length,
          iteration: iterationIndex + 1,
          requestId: requestLeaf.id,
          requestName: requestLeaf.name,
          collectionId: requestLeaf.collectionId,
          collectionName: requestLeaf.collectionName,
          requestGroupId: requestLeaf.requestGroupId,
          requestGroupName: requestLeaf.requestGroupName,
          execution,
        });

        if (!runPlan.continueOnError && execution.executionOutcome !== 'Succeeded') {
          const completedAt = new Date().toISOString();
          const durationMs = Date.now() - startedAtMs;
          return createBatchExecution(
            containerType,
            container,
            requestLeaves,
            stepResults,
            startedAt,
            completedAt,
            durationMs,
            runPlan,
          );
        }
      }
    }

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAtMs;
    return createBatchExecution(containerType, container, requestLeaves, stepResults, startedAt, completedAt, durationMs, runPlan);
  }

  app.post('/api/executions/run', async (req, res) => {
    const input = req.body?.request;
    const validationError = validateRequestDefinition(input);

    if (validationError) {
      return sendError(res, 400, 'invalid_request_execution', validationError);
    }

    const enabledMultipartFileRows = listEnabledMultipartFileRows(input);

    if (enabledMultipartFileRows.length > 0) {
      try {
        validateMultipartExecutionMethod(input);
      } catch (error) {
        return sendError(
          res,
          400,
          error.code || 'multipart_file_method_not_allowed',
          error.message || 'Multipart file fields can run only with POST or PUT methods.',
          error.details || {},
        );
      }

      return sendError(
        res,
        400,
        'multipart_file_missing',
        'Multipart file fields require the /api/executions/run-upload endpoint with selected files.',
        {
          missingRowIds: enabledMultipartFileRows.map((row) => row.id),
          missingFieldKeys: enabledMultipartFileRows.map((row) => row.key),
        },
      );
    }

    try {
      const execution = await executeSingleRun(input);
      return sendData(res, { execution });
    } catch (error) {
      return sendError(res, 500, 'execution_run_failed', error.message);
    }
  });

  app.post('/api/executions/run-upload', async (req, res) => {
    let uploadPayload;

    try {
      uploadPayload = await parseExecutionUploadPayload(req);
    } catch (error) {
      return sendError(
        res,
        400,
        error.code || 'invalid_request_execution',
        error.message || 'Failed to parse multipart upload payload.',
        error.details || {},
      );
    }

    const { requestInput, multipartFilesByRowId } = uploadPayload;
    const validationError = validateRequestDefinition(requestInput);

    if (validationError) {
      return sendError(res, 400, 'invalid_request_execution', validationError);
    }

    try {
      validateMultipartExecutionRequest(requestInput, multipartFilesByRowId);
    } catch (error) {
      return sendError(
        res,
        400,
        error.code || 'invalid_request_execution',
        error.message || 'Multipart execution request is invalid.',
        error.details || {},
      );
    }

    try {
      const execution = await executeSingleRun({
        ...requestInput,
        multipartFilesByRowId,
      });
      return sendData(res, { execution });
    } catch (error) {
      return sendError(res, 500, 'execution_run_failed', error.message);
    }
  });
  app.post('/api/collections/:collectionId/run', async (req, res) => {
    try {
      const batchExecution = await runBatch('collection', req.params.collectionId, defaultWorkspaceId, req.body?.run);
      return sendData(res, { batchExecution });
    } catch (error) {
      if (error.code === 'invalid_batch_run_input') {
        return sendError(res, 400, error.code, error.message, {
          collectionId: req.params.collectionId,
        });
      }

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
      const batchExecution = await runBatch('request-group', req.params.requestGroupId, defaultWorkspaceId, req.body?.run);
      return sendData(res, { batchExecution });
    } catch (error) {
      if (error.code === 'invalid_batch_run_input') {
        return sendError(res, 400, error.code, error.message, {
          requestGroupId: req.params.requestGroupId,
        });
      }

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

















