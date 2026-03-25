import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@client/app/providers/useI18n';
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
import { useWorkspaceBatchRunStore } from '@client/features/workspace/state/workspace-batch-run-store';
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

function createBodyModeSummary(
  bodyMode: RequestDraftState['bodyMode'],
  t: ReturnType<typeof useI18n>['t'],
) {
  switch (bodyMode) {
    case 'json':
      return t('workspaceRoute.requestBuilder.failedRun.bodySummary.json');
    case 'text':
      return t('workspaceRoute.requestBuilder.failedRun.bodySummary.text');
    case 'form-urlencoded':
      return t('workspaceRoute.requestBuilder.failedRun.bodySummary.formUrlencoded');
    case 'multipart-form-data':
      return t('workspaceRoute.requestBuilder.failedRun.bodySummary.multipartFormData');
    default:
      return t('workspaceRoute.requestBuilder.failedRun.bodySummary.none');
  }
}

function createAuthSummary(
  draft: RequestDraftState,
  t: ReturnType<typeof useI18n>['t'],
) {
  switch (draft.auth.type) {
    case 'bearer':
      return t('workspaceRoute.requestBuilder.failedRun.authSummary.bearer');
    case 'basic':
      return t('workspaceRoute.requestBuilder.failedRun.authSummary.basic');
    case 'api-key':
      return draft.auth.apiKeyPlacement === 'query'
        ? t('workspaceRoute.requestBuilder.failedRun.authSummary.apiKeyQuery')
        : t('workspaceRoute.requestBuilder.failedRun.authSummary.apiKeyHeader');
    default:
      return t('workspaceRoute.requestBuilder.failedRun.authSummary.none');
  }
}

function createDraftRequestInputSummary(
  draft: RequestDraftState,
  t: ReturnType<typeof useI18n>['t'],
) {
  return t('workspaceRoute.requestBuilder.failedRun.inputSummary', {
    paramCount: countEnabledRows(draft.params),
    headerCount: countEnabledRows(draft.headers),
    bodySummary: createBodyModeSummary(draft.bodyMode, t),
    authSummary: createAuthSummary(draft, t),
  });
}

function formatScriptStageLabel(
  stageId: 'pre-request' | 'post-response' | 'tests',
  t: ReturnType<typeof useI18n>['t'],
) {
  switch (stageId) {
    case 'pre-request':
      return t('workspaceRoute.scriptsEditor.stages.preRequest.label');
    case 'post-response':
      return t('workspaceRoute.scriptsEditor.stages.postResponse.label');
    default:
      return t('workspaceRoute.scriptsEditor.stages.tests.label');
  }
}

function readBrokenLinkedScriptRunBlock(
  draft: RequestDraftState,
  savedScripts: Awaited<ReturnType<typeof listWorkspaceScripts>>,
  t: ReturnType<typeof useI18n>['t'],
) {
  for (const stageId of REQUEST_SCRIPT_STAGE_IDS) {
    const binding = getRequestScriptStageBinding(draft.scripts, stageId);

    if (binding.mode !== 'linked') {
      continue;
    }

    const savedScript = savedScripts.find((script) => script.id === binding.savedScriptId) ?? null;
    const stageLabel = formatScriptStageLabel(stageId, t);

    if (!savedScript) {
      return t('workspaceRoute.requestBuilder.disabledReasons.linkedScriptMissing', { stageLabel });
    }

    if (savedScript.scriptType !== stageId) {
      return t('workspaceRoute.requestBuilder.disabledReasons.linkedScriptMismatch', { stageLabel });
    }
  }

  return null;
}

function createDraftRequestSnapshotSummary(
  draft: RequestDraftState,
  t: ReturnType<typeof useI18n>['t'],
) {
  const targetUrl = draft.url.trim().length > 0
    ? draft.url.trim()
    : t('workspaceRoute.requestBuilder.failedRun.requestSnapshotUnavailableTarget');

  return t('workspaceRoute.requestBuilder.failedRun.requestSnapshotSummary', {
    method: draft.method,
    targetUrl,
    inputSummary: createDraftRequestInputSummary(draft, t),
  });
}

function createFailedExecutionObservation(
  draft: RequestDraftState,
  error: RequestBuilderApiError | Error,
  t: ReturnType<typeof useI18n>['t'],
): RequestRunObservation {
  const now = new Date().toISOString();
  const details = error instanceof RequestBuilderApiError ? error.details : {};
  const requestGroupName = readRequestGroupName(draft);

  return {
    executionId: typeof details.executionId === 'string' ? details.executionId : `failed-${draft.tabId}-${Date.now()}`,
    executionOutcome: 'Failed',
    responseStatus: null,
    responseStatusLabel: t('workspaceRoute.resultPanel.common.transportNoResponse'),
    responseHeaders: [],
    responseHeadersSummary: t('workspaceRoute.requestBuilder.failedRun.responseHeadersSummary'),
    responseBodyPreview: '',
    responseBodyHint: t('workspaceRoute.requestBuilder.failedRun.responseBodyHint'),
    responsePreviewSizeLabel: t('workspaceRoute.resultPanel.response.values.noPreviewStored'),
    responsePreviewPolicy: t('workspaceRoute.requestBuilder.failedRun.responsePreviewPolicy'),
    startedAt: typeof details.startedAt === 'string' ? details.startedAt : now,
    completedAt: typeof details.completedAt === 'string' ? details.completedAt : now,
    durationMs: typeof details.durationMs === 'number' ? details.durationMs : 0,
    consoleSummary: t('workspaceRoute.requestBuilder.failedRun.consoleSummary'),
    consoleEntries: [],
    consoleLogCount: 0,
    consoleWarningCount: 0,
    testsSummary: t('workspaceRoute.requestBuilder.failedRun.testsSummary'),
    testEntries: [],
    requestSnapshotSummary: createDraftRequestSnapshotSummary(draft, t),
    requestInputSummary: createDraftRequestInputSummary(draft, t),
    requestHeaderCount: countEnabledRows(draft.headers),
    requestParamCount: countEnabledRows(draft.params),
    requestBodyMode: draft.bodyMode,
    authSummary: createAuthSummary(draft, t),
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
        label: t('workspaceRoute.requestBuilder.failedRun.transportStageLabel'),
        status: 'Failed',
        summary: t('workspaceRoute.requestBuilder.failedRun.transportStageSummary'),
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
  const { t } = useI18n();
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
  const deactivateBatchRun = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.deactivate);
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
    ? readBrokenLinkedScriptRunBlock(draft, savedScriptsQuery.data, t)
    : null;

  const saveDisabledReason = !draft
    ? t('workspaceRoute.requestBuilder.disabledReasons.noDraftSave')
    : draft.name.trim().length === 0
      ? t('workspaceRoute.requestBuilder.disabledReasons.nameRequiredSave')
      : draft.url.trim().length === 0
        ? t('workspaceRoute.requestBuilder.disabledReasons.urlRequiredSave')
        : missingSelectedEnvironment
          ? t('workspaceRoute.requestBuilder.environment.missing')
          : environmentLoadingBlock
            ? t('workspaceRoute.requestBuilder.environment.loading')
            : environmentDegradedBlock
              ? t('workspaceRoute.requestBuilder.environment.degraded')
              : saveStatus.status === 'pending'
                ? t('workspaceRoute.requestBuilder.disabledReasons.savePending')
                : null;

  const runDisabledReason = !draft
    ? t('workspaceRoute.requestBuilder.disabledReasons.noDraftRun')
    : draft.url.trim().length === 0
      ? t('workspaceRoute.requestBuilder.disabledReasons.urlRequiredRun')
      : missingSelectedEnvironment
        ? t('workspaceRoute.requestBuilder.environment.missing')
        : environmentLoadingBlock
          ? t('workspaceRoute.requestBuilder.environment.loading')
          : environmentDegradedBlock
            ? t('workspaceRoute.requestBuilder.environment.degraded')
            : brokenLinkedScriptRunBlock
              ? brokenLinkedScriptRunBlock
              : isJsonBodyMalformed(draft)
                ? t('workspaceRoute.requestBuilder.disabledReasons.malformedJsonRun')
                : runStatus.status === 'pending'
                  ? t('workspaceRoute.requestBuilder.disabledReasons.runPending')
                  : null;

  const buildDefinitionInput = () => {
    if (!activeTab || !draft) {
      throw new Error('No active request draft is available.');
    }

    const input = createRequestDefinitionInput(activeTab, draft, {
      fallbackTitle: t('workspaceRoute.requestBuilder.defaultTitle'),
    });

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

      finishSaveError(activeTab.id, error instanceof Error ? error.message : t('workspaceRoute.requestBuilder.status.saveError'));
    },
  });

  const runMutation = useMutation({
    mutationFn: async () => runRequestDefinition(buildDefinitionInput()),
    onMutate: () => {
      if (!activeTab) {
        return;
      }

      deactivateBatchRun();
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
        error instanceof Error ? error : new Error(t('workspaceRoute.requestBuilder.status.runError')),
        t,
      );

      finishRunError(activeTab.id, failedExecution, failedExecution.errorSummary ?? t('workspaceRoute.requestBuilder.status.runError'));
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



