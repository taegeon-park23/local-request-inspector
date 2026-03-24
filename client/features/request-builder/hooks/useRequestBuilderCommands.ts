import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listWorkspaceEnvironments, workspaceEnvironmentsQueryKey } from '@client/features/environments/environment.api';
import { executionHistoryListQueryKey } from '@client/features/history/history.api';
import {
  createRequestDefinitionInput,
  DEFAULT_REQUEST_COLLECTION_NAME,
  RequestBuilderApiError,
  runRequestDefinition,
  saveRequestDefinition,
  type RequestDefinitionInput,
  type RequestRunObservation,
  type SavedRequestResourceRecord,
  upsertSavedRequestResource,
  workspaceSavedRequestsQueryKey,
} from '@client/features/request-builder/request-builder.api';
import type { RequestDraftState } from '@client/features/request-builder/request-draft.types';
import {
  getRequestScriptStageBinding,
  REQUEST_SCRIPT_STAGE_IDS,
} from '@client/features/request-builder/request-script-binding';
import type { RequestTabRecord, SavedWorkspaceRequestSeed } from '@client/features/request-builder/request-tab.types';
import { listWorkspaceScripts, workspaceScriptsQueryKey } from '@client/features/scripts/scripts.api';
import { useRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import {
  createRequestPlacementFields,
  readRequestGroupName,
} from '@client/features/request-builder/request-placement';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';
import { useWorkspaceUiStore } from '@client/features/workspace/state/workspace-ui-store';

function isJsonBodyMalformed(draft: RequestDraftState) {
  if (draft.bodyMode !== 'json') {
    return false;
  }

  const bodyText = draft.bodyText.trim();

  if (bodyText.length === 0) {
    return false;
  }

  try {
    JSON.parse(bodyText);
    return false;
  } catch {
    return true;
  }
}

function countEnabledRows(rows: RequestDraftState['params']) {
  return rows.filter((row) => row.enabled !== false && row.key.trim().length > 0).length;
}

function createBodyModeSummary(bodyMode: RequestDraftState['bodyMode']) {
  switch (bodyMode) {
    case 'json':
      return 'JSON body';
    case 'text':
      return 'Text body';
    case 'form-urlencoded':
      return 'Form body';
    case 'multipart-form-data':
      return 'Multipart body';
    default:
      return 'No body';
  }
}

function createAuthSummary(draft: RequestDraftState) {
  switch (draft.auth.type) {
    case 'bearer':
      return 'Bearer auth';
    case 'basic':
      return 'Basic auth';
    case 'api-key':
      return draft.auth.apiKeyPlacement === 'query' ? 'API key in query' : 'API key in header';
    default:
      return 'No auth';
  }
}

function createDraftRequestInputSummary(draft: RequestDraftState) {
  return `${countEnabledRows(draft.params)} params · ${countEnabledRows(draft.headers)} headers · ${createBodyModeSummary(draft.bodyMode)} · ${createAuthSummary(draft)}`;
}

function formatScriptStageLabel(stageId: 'pre-request' | 'post-response' | 'tests') {
  switch (stageId) {
    case 'pre-request':
      return 'Pre-request';
    case 'post-response':
      return 'Post-response';
    default:
      return 'Tests';
  }
}

function readBrokenLinkedScriptRunBlock(
  draft: RequestDraftState,
  savedScripts: Awaited<ReturnType<typeof listWorkspaceScripts>>,
) {
  for (const stageId of REQUEST_SCRIPT_STAGE_IDS) {
    const binding = getRequestScriptStageBinding(draft.scripts, stageId);

    if (binding.mode !== 'linked') {
      continue;
    }

    const savedScript = savedScripts.find((script) => script.id === binding.savedScriptId) ?? null;
    const stageLabel = formatScriptStageLabel(stageId);

    if (!savedScript) {
      return `Repair or detach the missing linked saved script in the ${stageLabel} stage before running.`;
    }

    if (savedScript.scriptType !== stageId) {
      return `Repair or detach the mismatched linked saved script in the ${stageLabel} stage before running.`;
    }
  }

  return null;
}
function createDraftRequestSnapshotSummary(draft: RequestDraftState) {
  const targetUrl = draft.url.trim().length > 0 ? draft.url.trim() : 'request snapshot unavailable';
  return `${draft.method} ${targetUrl} executed from the active workspace draft with ${createDraftRequestInputSummary(draft)}.`;
}

function createFailedExecutionObservation(
  draft: RequestDraftState,
  error: RequestBuilderApiError | Error,
): RequestRunObservation {
  const now = new Date().toISOString();
  const details = error instanceof RequestBuilderApiError ? error.details : {};
  const requestGroupName = readRequestGroupName(draft);

  return {
    executionId: typeof details.executionId === 'string' ? details.executionId : `failed-${draft.tabId}-${Date.now()}`,
    executionOutcome: 'Failed',
    responseStatus: null,
    responseStatusLabel: 'No response',
    responseHeaders: [],
    responseHeadersSummary: 'No response headers were captured.',
    responseBodyPreview: '',
    responseBodyHint: 'No response payload is available for this failed run.',
    responsePreviewSizeLabel: 'No preview stored',
    responsePreviewPolicy: 'No response preview is available because the run lane failed before transport completed.',
    startedAt: typeof details.startedAt === 'string' ? details.startedAt : now,
    completedAt: typeof details.completedAt === 'string' ? details.completedAt : now,
    durationMs: typeof details.durationMs === 'number' ? details.durationMs : 0,
    consoleSummary: 'No console entries were captured because the run lane failed before bounded script diagnostics could be summarized.',
    consoleEntries: [],
    consoleLogCount: 0,
    consoleWarningCount: 0,
    testsSummary: 'No tests were recorded because the run lane failed before the tests stage could complete.',
    testEntries: [],
    requestSnapshotSummary: createDraftRequestSnapshotSummary(draft),
    requestInputSummary: createDraftRequestInputSummary(draft),
    requestHeaderCount: countEnabledRows(draft.headers),
    requestParamCount: countEnabledRows(draft.params),
    requestBodyMode: draft.bodyMode,
    authSummary: createAuthSummary(draft),
    environmentId: draft.selectedEnvironmentId ?? null,
    ...(draft.collectionName ? { requestCollectionName: draft.collectionName } : {}),
    ...(requestGroupName
      ? {
          requestGroupName,

        }
      : {}),
    errorCode: error instanceof RequestBuilderApiError ? error.code : 'execution_failed',
    errorSummary: error.message,
    stageSummaries: [
      {
        stageId: 'transport',
        label: 'Transport',
        status: 'Failed',
        summary: 'Transport failed before the run endpoint could return bounded diagnostics.',
        errorCode: error instanceof RequestBuilderApiError ? error.code : 'execution_failed',
        errorSummary: error.message,
      },
    ],
  };
}

function mapSavedRecordToTabSeed(record: SavedRequestResourceRecord): SavedWorkspaceRequestSeed {
  return {
    id: record.id,
    name: record.name,
    methodLabel: record.method,
    summary: record.summary,
    collectionName: record.collectionName,
    ...createRequestPlacementFields(record),
  };
}

interface UseRequestBuilderCommandsResult {
  saveStatus: ReturnType<typeof useRequestCommandStore.getState>['byTabId'][string]['save'];
  runStatus: ReturnType<typeof useRequestCommandStore.getState>['byTabId'][string]['run'];
  saveDisabledReason: string | null;
  runDisabledReason: string | null;
  handleSave: () => void;
  handleRun: () => void;
}

export function useRequestBuilderCommands(
  activeTab: RequestTabRecord | null,
  draft: RequestDraftState | null,
): UseRequestBuilderCommandsResult {
  const queryClient = useQueryClient();
  const environmentsQuery = useQuery({
    queryKey: workspaceEnvironmentsQueryKey,
    queryFn: listWorkspaceEnvironments,
  });
  const savedScriptsQuery = useQuery({
    queryKey: workspaceScriptsQueryKey,
    queryFn: listWorkspaceScripts,
  });
  const commandEntry = useRequestCommandStore((state) =>
    activeTab ? state.byTabId[activeTab.id] : undefined,
  );
  const startSave = useRequestCommandStore((state) => state.startSave);
  const finishSaveSuccess = useRequestCommandStore((state) => state.finishSaveSuccess);
  const finishSaveError = useRequestCommandStore((state) => state.finishSaveError);
  const startRun = useRequestCommandStore((state) => state.startRun);
  const finishRunSuccess = useRequestCommandStore((state) => state.finishRunSuccess);
  const finishRunError = useRequestCommandStore((state) => state.finishRunError);
  const commitSavedDraft = useRequestDraftStore((state) => state.commitSavedDraft);
  const markTabSaved = useWorkspaceShellStore((state) => state.markTabSaved);
  const focusWorkspaceResultPanel = useWorkspaceUiStore((state) => state.focusWorkspaceResultPanel);

  const saveStatus = commandEntry?.save ?? {
    status: 'idle',
    message: null,
    savedAt: null,
  };
  const runStatus = commandEntry?.run ?? {
    status: 'idle',
    message: null,
    latestExecution: null,
    activeResultTab: 'response' as const,
  };

  const selectedEnvironmentId = typeof draft?.selectedEnvironmentId === 'string' && draft.selectedEnvironmentId.trim().length > 0
    ? draft.selectedEnvironmentId.trim()
    : null;
  const availableEnvironments = environmentsQuery.data ?? [];
  const selectedEnvironmentExists = selectedEnvironmentId === null
    ? true
    : availableEnvironments.some((environment) => environment.id === selectedEnvironmentId);
  const missingSelectedEnvironment = selectedEnvironmentId !== null
    && environmentsQuery.isSuccess
    && !selectedEnvironmentExists;
  const environmentLoadingBlock = selectedEnvironmentId !== null && environmentsQuery.isPending;
  const environmentDegradedBlock = selectedEnvironmentId !== null && environmentsQuery.isError;
  const brokenLinkedScriptRunBlock = draft && savedScriptsQuery.isSuccess
    ? readBrokenLinkedScriptRunBlock(draft, savedScriptsQuery.data)
    : null;

  const saveDisabledReason = !draft
    ? 'Open a request tab before saving.'
    : draft.name.trim().length === 0
      ? 'Enter a request name before saving.'
      : draft.url.trim().length === 0
        ? 'Enter a request URL before saving.'
        : missingSelectedEnvironment
          ? 'Choose an available environment or No environment before saving.'
          : environmentLoadingBlock
            ? 'Request environment details are still loading.'
            : environmentDegradedBlock
              ? 'Environment list is unavailable while this request references a saved environment.'
              : saveStatus.status === 'pending'
                ? 'Save is already in progress.'
                : null;

  const runDisabledReason = !draft
    ? 'Open a request tab before running.'
    : draft.url.trim().length === 0
      ? 'Enter a request URL before running.'
      : missingSelectedEnvironment
        ? 'Choose an available environment or No environment before running.'
        : environmentLoadingBlock
          ? 'Request environment details are still loading.'
          : environmentDegradedBlock
            ? 'Environment list is unavailable while this request references a saved environment.'
            : brokenLinkedScriptRunBlock
              ? brokenLinkedScriptRunBlock
              : isJsonBodyMalformed(draft)
                ? 'Fix malformed JSON body before running.'
                : runStatus.status === 'pending'
                  ? 'Run is already in progress.'
                  : null;

  const buildDefinitionInput = () => {
    if (!activeTab || !draft) {
      throw new Error('No active request draft is available.');
    }

    const input = createRequestDefinitionInput(activeTab, draft);

    return {
      ...input,
      collectionName: input.collectionName ?? DEFAULT_REQUEST_COLLECTION_NAME,
    } satisfies RequestDefinitionInput;
  };

  const saveMutation = useMutation({
    mutationFn: async () => saveRequestDefinition(buildDefinitionInput()),
    onMutate: () => {
      if (!activeTab) {
        return;
      }

      startSave(activeTab.id);
    },
    onSuccess: (savedRecord) => {
      if (!activeTab) {
        return;
      }

      markTabSaved(activeTab.id, mapSavedRecordToTabSeed(savedRecord));
      commitSavedDraft(activeTab.id, {
        collectionName: savedRecord.collectionName,
        ...createRequestPlacementFields(savedRecord),
      });
      finishSaveSuccess(activeTab.id, savedRecord.updatedAt);
      queryClient.setQueryData<SavedRequestResourceRecord[]>(workspaceSavedRequestsQueryKey, (current) =>
        upsertSavedRequestResource(current ?? [], savedRecord),
      );
    },
    onError: (error) => {
      if (!activeTab) {
        return;
      }

      finishSaveError(activeTab.id, error instanceof Error ? error.message : 'Failed to save request definition.');
    },
  });

  const runMutation = useMutation({
    mutationFn: async () => runRequestDefinition(buildDefinitionInput()),
    onMutate: () => {
      if (!activeTab) {
        return;
      }

      startRun(activeTab.id);
    },
    onSuccess: (execution) => {
      if (!activeTab) {
        return;
      }

      finishRunSuccess(activeTab.id, execution);
      focusWorkspaceResultPanel('response');
      queryClient.invalidateQueries({ queryKey: executionHistoryListQueryKey });
    },
    onError: (error) => {
      if (!activeTab || !draft) {
        return;
      }

      const failedExecution = createFailedExecutionObservation(
        draft,
        error instanceof Error ? error : new Error('Failed to run request.'),
      );

      finishRunError(activeTab.id, failedExecution, failedExecution.errorSummary ?? 'Failed to run request.');
      focusWorkspaceResultPanel('response');
    },
  });

  return {
    saveStatus,
    runStatus,
    saveDisabledReason,
    runDisabledReason,
    handleSave: () => {
      if (saveDisabledReason) {
        return;
      }

      saveMutation.mutate();
    },
    handleRun: () => {
      if (runDisabledReason) {
        return;
      }

      runMutation.mutate();
    },
  };
}



