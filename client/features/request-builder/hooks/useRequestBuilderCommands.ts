import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { useRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';

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

function createFailedExecutionObservation(
  draft: RequestDraftState,
  error: RequestBuilderApiError | Error,
): RequestRunObservation {
  const now = new Date().toISOString();
  const details = error instanceof RequestBuilderApiError ? error.details : {};

  return {
    executionId: typeof details.executionId === 'string' ? details.executionId : `failed-${draft.tabId}-${Date.now()}`,
    executionOutcome: 'Failed',
    responseStatus: null,
    responseStatusLabel: 'No response',
    responseHeaders: [],
    responseHeadersSummary: 'No response headers were captured.',
    responseBodyPreview: '',
    responseBodyHint: 'No response payload is available for this failed run.',
    startedAt: typeof details.startedAt === 'string' ? details.startedAt : now,
    completedAt: typeof details.completedAt === 'string' ? details.completedAt : now,
    durationMs: typeof details.durationMs === 'number' ? details.durationMs : 0,
    consoleSummary: 'No console entries were captured. Script execution is not wired yet.',
    consoleEntries: [],
    testsSummary: 'No tests ran. Script execution is not wired yet.',
    testEntries: [],
    errorSummary: error.message,
  };
}

function mapSavedRecordToTabSeed(record: SavedRequestResourceRecord) {
  return {
    id: record.id,
    name: record.name,
    methodLabel: record.method,
    summary: record.summary,
    collectionName: record.collectionName,
    ...(record.folderName ? { folderName: record.folderName } : {}),
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

  const saveStatus = commandEntry?.save ?? {
    status: 'idle',
    message: null,
    savedAt: null,
  };
  const runStatus = commandEntry?.run ?? {
    status: 'idle',
    message: null,
    latestExecution: null,
  };

  const saveDisabledReason = !draft
    ? 'Open a request tab before saving.'
    : draft.name.trim().length === 0
      ? 'Enter a request name before saving.'
      : draft.url.trim().length === 0
        ? 'Enter a request URL before saving.'
        : saveStatus.status === 'pending'
          ? 'Save is already in progress.'
          : null;

  const runDisabledReason = !draft
    ? 'Open a request tab before running.'
    : draft.url.trim().length === 0
      ? 'Enter a request URL before running.'
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
        ...(savedRecord.folderName ? { folderName: savedRecord.folderName } : {}),
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

