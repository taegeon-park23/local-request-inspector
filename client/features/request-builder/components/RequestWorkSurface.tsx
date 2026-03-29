import { useQuery } from '@tanstack/react-query';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import {
  listWorkspaceEnvironments,
  workspaceEnvironmentsQueryKey,
} from '@client/features/environments/environment.api';
import { useRequestBuilderCommands } from '@client/features/request-builder/hooks/useRequestBuilderCommands';
import type { RequestDraftState, RequestScriptStageId } from '@client/features/request-builder/request-draft.types';
import type { SavedScriptRecord } from '@client/features/scripts/scripts.types';
import type { RequestReplaySourceCue, RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { isDetachedRequestTab, isPreviewRequestTab } from '@client/features/request-builder/request-tab-state';
import { RequestKeyValueEditor } from '@client/features/request-builder/components/RequestKeyValueEditor';
import {
  createRequestPlacementFromSelection,
  DEFAULT_REQUEST_GROUP_NAME,
  findSelectedPlacementCollection,
  findSelectedPlacementGroup,
  formatRequestPlacementPath,
  getCollectionPlacementValue,
  getRequestGroupPlacementValue,
  isPendingRequestPlacementGroup,
  type RequestPlacementCollectionOption,
} from '@client/features/request-builder/request-placement';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';
import { useWorkspaceBatchRunStore } from '@client/features/workspace/state/workspace-batch-run-store';
import { useReplayRunStore } from '@client/shared/replay-run-store';
import type { WorkspaceCollectionNode, WorkspaceRequestGroupNode } from '@client/features/workspace/workspace-request-tree.api';
import type { AppIconName } from '@client/shared/ui/AppIcon';
import { IconLabel } from '@client/shared/ui/IconLabel';

const LazyRequestScriptsEditorSurface = lazy(async () => {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return import('@client/features/request-builder/components/RequestScriptsEditorSurface');
});

const requestEditorTabs: Array<{ id: RequestDraftState['activeEditorTab']; icon: AppIconName }> = [
  { id: 'params', icon: 'params' },
  { id: 'headers', icon: 'headers' },
  { id: 'body', icon: 'body' },
  { id: 'auth', icon: 'auth' },
  { id: 'scripts', icon: 'scripts' },
];

function getLocalizedRequestEditorTabLabel(
  tabId: RequestDraftState['activeEditorTab'],
  t: ReturnType<typeof useI18n>['t'],
) {
  switch (tabId) {
    case 'params':
      return t('workspaceRoute.requestBuilder.tabs.params');
    case 'headers':
      return t('workspaceRoute.requestBuilder.tabs.headers');
    case 'body':
      return t('workspaceRoute.requestBuilder.tabs.body');
    case 'auth':
      return t('workspaceRoute.requestBuilder.tabs.auth');
    case 'scripts':
      return t('workspaceRoute.requestBuilder.tabs.scripts');
    default:
      return tabId;
  }
}

const httpMethodOptions: RequestDraftState['method'][] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const EMPTY_MULTIPART_FILES_BY_ROW_ID: Record<string, File[]> = {};
const bodyModeOptions: RequestDraftState['bodyMode'][] = ['none', 'json', 'text', 'form-urlencoded', 'multipart-form-data'];
const authTypeOptions: RequestDraftState['auth']['type'][] = ['none', 'bearer', 'basic', 'api-key'];
const HOT_INPUT_SYNC_DELAY_MS = 180;

interface DebouncedDraftTextFieldOptions {
  scopeKey: string;
  value: string;
  delayMs?: number;
  onCommit: (nextValue: string) => void;
}

interface DebouncedDraftTextFieldController {
  value: string;
  setValue: (nextValue: string) => void;
  flush: () => void;
}

function useDebouncedDraftTextField({
  scopeKey,
  value,
  delayMs = HOT_INPUT_SYNC_DELAY_MS,
  onCommit,
}: DebouncedDraftTextFieldOptions): DebouncedDraftTextFieldController {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<string | null>(null);
  const scopeRef = useRef(scopeKey);
  const latestExternalValueRef = useRef(value);
  const latestCommitRef = useRef(onCommit);

  useEffect(() => {
    latestCommitRef.current = onCommit;
  }, [onCommit]);

  const clearPendingTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    if (pendingValueRef.current === null) {
      return;
    }

    const nextValue = pendingValueRef.current;
    pendingValueRef.current = null;
    clearPendingTimer();

    if (nextValue === latestExternalValueRef.current) {
      return;
    }

    latestCommitRef.current(nextValue);
  }, [clearPendingTimer]);

  useEffect(() => {
    if (scopeRef.current !== scopeKey) {
      scopeRef.current = scopeKey;
      clearPendingTimer();
      pendingValueRef.current = null;
      latestExternalValueRef.current = value;
      queueMicrotask(() => {
        setLocalValue(value);
      });
      return;
    }

    latestExternalValueRef.current = value;

    if (pendingValueRef.current === null) {
      queueMicrotask(() => {
        setLocalValue(value);
      });
    }
  }, [clearPendingTimer, scopeKey, value]);

  useEffect(() => () => {
    flush();
  }, [flush]);

  const setValue = useCallback((nextValue: string) => {
    setLocalValue(nextValue);
    pendingValueRef.current = nextValue;
    clearPendingTimer();
    timeoutRef.current = setTimeout(() => {
      flush();
    }, delayMs);
  }, [clearPendingTimer, delayMs, flush]);

  return {
    value: localValue,
    setValue,
    flush,
  };
}

interface RequestWorkSurfaceProps {
  activeTab: RequestTabRecord | null;
  onCreateRequest: () => void;
  onDuplicateRequest: () => void;
  placementOptions: RequestPlacementCollectionOption[];
  workspaceTree?: WorkspaceCollectionNode[];
}

function formatSavedAt(
  savedAt: string | null,
  savedAtMessage: (time: string) => string,
  upToDateMessage: string,
  formatDateTime: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string,
) {
  if (!savedAt) {
    return upToDateMessage;
  }

  return savedAtMessage(formatDateTime(savedAt, { timeStyle: 'short' }));
}

function getReplaySourceLabel(
  replaySource: RequestReplaySourceCue,
  t: ReturnType<typeof useI18n>['t'],
) {
  return replaySource.kind === 'capture'
    ? t('workspaceRoute.requestBuilder.replaySource.captureLabel')
    : t('workspaceRoute.requestBuilder.replaySource.historyLabel');
}

function getReplaySourceDescription(
  replaySource: RequestReplaySourceCue,
  t: ReturnType<typeof useI18n>['t'],
) {
  if (replaySource.methodLabel && replaySource.targetLabel && replaySource.timestampLabel) {
    return replaySource.kind === 'capture'
      ? t('workspaceRoute.requestBuilder.replaySource.captureDescription', {
        time: replaySource.timestampLabel,
        method: replaySource.methodLabel,
        target: replaySource.targetLabel,
      })
      : t('workspaceRoute.requestBuilder.replaySource.historyDescription', {
        time: replaySource.timestampLabel,
        method: replaySource.methodLabel,
        target: replaySource.targetLabel,
      });
  }

  return replaySource.description;
}

function getRunStatusCopy(
  runStatus: ReturnType<typeof useRequestBuilderCommands>['runStatus'],
  fallbackMessage: string | null,
  t: ReturnType<typeof useI18n>['t'],
) {
  if (runStatus.status === 'pending') {
    return t('workspaceRoute.requestBuilder.status.runInProgress');
  }

  if (runStatus.status === 'success') {
    switch (runStatus.latestExecution?.executionOutcome) {
      case 'Blocked':
        return t('workspaceRoute.requestBuilder.status.runBlocked');
      case 'Timed out':
        return t('workspaceRoute.requestBuilder.status.runTimedOut');
      default:
        return t('workspaceRoute.requestBuilder.status.runCompleted');
    }
  }

  return runStatus.message ?? fallbackMessage;
}

function summarizeRequestGroupTree(
  requestGroups: WorkspaceRequestGroupNode[],
): { requestGroupCount: number; requestCount: number } {
  return requestGroups.reduce(
    (summary, requestGroup) => {
      const nestedSummary = summarizeRequestGroupTree(requestGroup.childGroups);

      return {
        requestGroupCount: summary.requestGroupCount + 1 + nestedSummary.requestGroupCount,
        requestCount: summary.requestCount + requestGroup.requests.length + nestedSummary.requestCount,
      };
    },
    { requestGroupCount: 0, requestCount: 0 },
  );
}

function findCollectionById(tree: WorkspaceCollectionNode[], collectionId: string | null | undefined) {
  if (!collectionId) {
    return null;
  }

  return tree.find((collection) => collection.collectionId === collectionId) ?? null;
}

function findRequestGroupById(
  tree: WorkspaceCollectionNode[],
  requestGroupId: string | null | undefined,
): { collection: WorkspaceCollectionNode; requestGroup: WorkspaceRequestGroupNode } | null {
  if (!requestGroupId) {
    return null;
  }

  function walk(
    collection: WorkspaceCollectionNode,
    groups: WorkspaceRequestGroupNode[],
  ): { collection: WorkspaceCollectionNode; requestGroup: WorkspaceRequestGroupNode } | null {
    for (const requestGroup of groups) {
      if (requestGroup.requestGroupId === requestGroupId) {
        return { collection, requestGroup };
      }

      const childMatch = walk(collection, requestGroup.childGroups);
      if (childMatch) {
        return childMatch;
      }
    }

    return null;
  }

  for (const collection of tree) {
    const match = walk(collection, collection.childGroups);
    if (match) {
      return match;
    }
  }

  return null;
}
export function RequestWorkSurface({
  activeTab,
  onCreateRequest,
  onDuplicateRequest,
  placementOptions,
  workspaceTree = [],
}: RequestWorkSurfaceProps) {
  const { t, formatDateTime } = useI18n();
  const [copiedScriptNamesByTabId, setCopiedScriptNamesByTabId] = useState<
    Record<string, Partial<Record<RequestScriptStageId, string>>>
  >({});
  const draft = useRequestDraftStore((state) =>
    activeTab ? state.draftsByTabId[activeTab.id]?.draft ?? null : null,
  );
  const updateDraftName = useRequestDraftStore((state) => state.updateDraftName);
  const updateDraftMethod = useRequestDraftStore((state) => state.updateDraftMethod);
  const updateDraftUrl = useRequestDraftStore((state) => state.updateDraftUrl);
  const setActiveEditorTab = useRequestDraftStore((state) => state.setActiveEditorTab);
  const addRow = useRequestDraftStore((state) => state.addRow);
  const updateRow = useRequestDraftStore((state) => state.updateRow);
  const removeRow = useRequestDraftStore((state) => state.removeRow);
  const updateBodyMode = useRequestDraftStore((state) => state.updateBodyMode);
  const updateBodyText = useRequestDraftStore((state) => state.updateBodyText);
  const updateAuthType = useRequestDraftStore((state) => state.updateAuthType);
  const updateAuthField = useRequestDraftStore((state) => state.updateAuthField);
  const setActiveScriptStage = useRequestDraftStore((state) => state.setActiveScriptStage);
  const updateScriptContent = useRequestDraftStore((state) => state.updateScriptContent);
  const linkScriptStageToSavedScript = useRequestDraftStore((state) => state.linkScriptStageToSavedScript);
  const updateSelectedEnvironmentId = useRequestDraftStore((state) => state.updateSelectedEnvironmentId);
  const updateDraftPlacement = useRequestDraftStore((state) => state.updateDraftPlacement);
  const multipartFilesByRowId = useRequestDraftStore((state) => (
    activeTab ? (state.multipartFilesByTabId[activeTab.id] ?? EMPTY_MULTIPART_FILES_BY_ROW_ID) : EMPTY_MULTIPART_FILES_BY_ROW_ID
  ));
  const setMultipartRowFiles = useRequestDraftStore((state) => state.setMultipartRowFiles);
  const clearMultipartRowFiles = useRequestDraftStore((state) => state.clearMultipartRowFiles);
  const pendingReplayRunTabId = useReplayRunStore((state) => state.pendingReplayRunTabId);
  const consumeReplayRun = useReplayRunStore((state) => state.consumeReplayRun);
  const pinTab = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.pinTab);
  const batchRunStatus = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.status);
  const batchRunMessage = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.message);
  const batchExecution = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.latestExecution);
  const environmentsQuery = useQuery({
    queryKey: workspaceEnvironmentsQueryKey,
    queryFn: listWorkspaceEnvironments,
  });
  const {
    saveStatus,
    runStatus,
    saveDisabledReason,
    runDisabledReason,
    hasSaveConflict,
    conflictUpdatedAt,
    handleSave,
    handleOverwriteSave,
    handleSaveAsNew,
    handleRun,
  } = useRequestBuilderCommands(
    activeTab,
    draft,
  );
  const activeDraftTabId = draft?.tabId ?? activeTab?.id ?? 'none';
  const editableDraftTabId = draft?.tabId ?? null;
  const scriptInlineFlushRef = useRef<(() => void) | null>(null);

  const commitDraftName = useCallback((nextValue: string) => {
    if (!editableDraftTabId) {
      return;
    }

    updateDraftName(editableDraftTabId, nextValue);
  }, [editableDraftTabId, updateDraftName]);
  const commitDraftUrl = useCallback((nextValue: string) => {
    if (!editableDraftTabId) {
      return;
    }

    updateDraftUrl(editableDraftTabId, nextValue);
  }, [editableDraftTabId, updateDraftUrl]);
  const commitDraftBodyText = useCallback((nextValue: string) => {
    if (!editableDraftTabId) {
      return;
    }

    updateBodyText(editableDraftTabId, nextValue);
  }, [editableDraftTabId, updateBodyText]);
  const commitDraftBearerToken = useCallback((nextValue: string) => {
    if (!editableDraftTabId) {
      return;
    }

    updateAuthField(editableDraftTabId, 'bearerToken', nextValue);
  }, [editableDraftTabId, updateAuthField]);
  const commitDraftBasicUsername = useCallback((nextValue: string) => {
    if (!editableDraftTabId) {
      return;
    }

    updateAuthField(editableDraftTabId, 'basicUsername', nextValue);
  }, [editableDraftTabId, updateAuthField]);
  const commitDraftBasicPassword = useCallback((nextValue: string) => {
    if (!editableDraftTabId) {
      return;
    }

    updateAuthField(editableDraftTabId, 'basicPassword', nextValue);
  }, [editableDraftTabId, updateAuthField]);
  const commitDraftApiKeyName = useCallback((nextValue: string) => {
    if (!editableDraftTabId) {
      return;
    }

    updateAuthField(editableDraftTabId, 'apiKeyName', nextValue);
  }, [editableDraftTabId, updateAuthField]);
  const commitDraftApiKeyValue = useCallback((nextValue: string) => {
    if (!editableDraftTabId) {
      return;
    }

    updateAuthField(editableDraftTabId, 'apiKeyValue', nextValue);
  }, [editableDraftTabId, updateAuthField]);

  const requestNameField = useDebouncedDraftTextField({
    scopeKey: `${activeDraftTabId}:request-name`,
    value: draft?.name ?? '',
    onCommit: commitDraftName,
  });
  const requestUrlField = useDebouncedDraftTextField({
    scopeKey: `${activeDraftTabId}:request-url`,
    value: draft?.url ?? '',
    onCommit: commitDraftUrl,
  });
  const requestBodyTextField = useDebouncedDraftTextField({
    scopeKey: `${activeDraftTabId}:request-body-text`,
    value: draft?.bodyText ?? '',
    onCommit: commitDraftBodyText,
  });
  const bearerTokenField = useDebouncedDraftTextField({
    scopeKey: `${activeDraftTabId}:auth-bearer-token`,
    value: draft?.auth.bearerToken ?? '',
    onCommit: commitDraftBearerToken,
  });
  const basicUsernameField = useDebouncedDraftTextField({
    scopeKey: `${activeDraftTabId}:auth-basic-username`,
    value: draft?.auth.basicUsername ?? '',
    onCommit: commitDraftBasicUsername,
  });
  const basicPasswordField = useDebouncedDraftTextField({
    scopeKey: `${activeDraftTabId}:auth-basic-password`,
    value: draft?.auth.basicPassword ?? '',
    onCommit: commitDraftBasicPassword,
  });
  const apiKeyNameField = useDebouncedDraftTextField({
    scopeKey: `${activeDraftTabId}:auth-api-key-name`,
    value: draft?.auth.apiKeyName ?? '',
    onCommit: commitDraftApiKeyName,
  });
  const apiKeyValueField = useDebouncedDraftTextField({
    scopeKey: `${activeDraftTabId}:auth-api-key-value`,
    value: draft?.auth.apiKeyValue ?? '',
    onCommit: commitDraftApiKeyValue,
  });

  const registerScriptInlineFlush = useCallback((flush: (() => void) | null) => {
    scriptInlineFlushRef.current = flush;
  }, []);

  const flushHotInputFields = useCallback(() => {
    scriptInlineFlushRef.current?.();
    requestNameField.flush();
    requestUrlField.flush();
    requestBodyTextField.flush();
    bearerTokenField.flush();
    basicUsernameField.flush();
    basicPasswordField.flush();
    apiKeyNameField.flush();
    apiKeyValueField.flush();
  }, [
    apiKeyNameField,
    apiKeyValueField,
    basicPasswordField,
    basicUsernameField,
    bearerTokenField,
    requestBodyTextField,
    requestNameField,
    requestUrlField,
  ]);

  const handleSaveWithFlush = useCallback(() => {
    flushHotInputFields();
    handleSave();
  }, [flushHotInputFields, handleSave]);
  const handleOverwriteSaveWithFlush = useCallback(() => {
    flushHotInputFields();
    handleOverwriteSave();
  }, [flushHotInputFields, handleOverwriteSave]);
  const handleSaveAsNewWithFlush = useCallback(() => {
    flushHotInputFields();
    handleSaveAsNew();
  }, [flushHotInputFields, handleSaveAsNew]);
  const handleRunWithFlush = useCallback(() => {
    flushHotInputFields();
    handleRun();
  }, [flushHotInputFields, handleRun]);

  const handleSetActiveEditorTab = useCallback((editorTab: RequestDraftState['activeEditorTab']) => {
    if (!editableDraftTabId) {
      return;
    }

    setActiveEditorTab(editableDraftTabId, editorTab);
  }, [editableDraftTabId, setActiveEditorTab]);

  const handleAddParamsRow = useCallback(() => {
    if (!editableDraftTabId) {
      return;
    }

    addRow(editableDraftTabId, 'params');
  }, [addRow, editableDraftTabId]);
  const handleUpdateParamsRow = useCallback((rowId: string, field: 'key' | 'value' | 'enabled' | 'valueType', value: string | boolean) => {
    if (!editableDraftTabId) {
      return;
    }

    updateRow(editableDraftTabId, 'params', rowId, field, value);
  }, [editableDraftTabId, updateRow]);
  const handleRemoveParamsRow = useCallback((rowId: string) => {
    if (!editableDraftTabId) {
      return;
    }

    removeRow(editableDraftTabId, 'params', rowId);
  }, [editableDraftTabId, removeRow]);

  const handleAddHeadersRow = useCallback(() => {
    if (!editableDraftTabId) {
      return;
    }

    addRow(editableDraftTabId, 'headers');
  }, [addRow, editableDraftTabId]);
  const handleUpdateHeadersRow = useCallback((rowId: string, field: 'key' | 'value' | 'enabled' | 'valueType', value: string | boolean) => {
    if (!editableDraftTabId) {
      return;
    }

    updateRow(editableDraftTabId, 'headers', rowId, field, value);
  }, [editableDraftTabId, updateRow]);
  const handleRemoveHeadersRow = useCallback((rowId: string) => {
    if (!editableDraftTabId) {
      return;
    }

    removeRow(editableDraftTabId, 'headers', rowId);
  }, [editableDraftTabId, removeRow]);

  const handleAddFormBodyRow = useCallback(() => {
    if (!editableDraftTabId) {
      return;
    }

    addRow(editableDraftTabId, 'formBody');
  }, [addRow, editableDraftTabId]);
  const handleUpdateFormBodyRow = useCallback((rowId: string, field: 'key' | 'value' | 'enabled' | 'valueType', value: string | boolean) => {
    if (!editableDraftTabId) {
      return;
    }

    updateRow(editableDraftTabId, 'formBody', rowId, field, value);
  }, [editableDraftTabId, updateRow]);
  const handleRemoveFormBodyRow = useCallback((rowId: string) => {
    if (!editableDraftTabId) {
      return;
    }

    removeRow(editableDraftTabId, 'formBody', rowId);
  }, [editableDraftTabId, removeRow]);

  const handleAddMultipartRow = useCallback(() => {
    if (!editableDraftTabId) {
      return;
    }

    addRow(editableDraftTabId, 'multipartBody');
  }, [addRow, editableDraftTabId]);
  const handleUpdateMultipartRow = useCallback((rowId: string, field: 'key' | 'value' | 'enabled' | 'valueType', value: string | boolean) => {
    if (!editableDraftTabId) {
      return;
    }

    updateRow(editableDraftTabId, 'multipartBody', rowId, field, value);
  }, [editableDraftTabId, updateRow]);
  const handleRemoveMultipartRow = useCallback((rowId: string) => {
    if (!editableDraftTabId) {
      return;
    }

    removeRow(editableDraftTabId, 'multipartBody', rowId);
  }, [editableDraftTabId, removeRow]);
  const handleSelectMultipartFiles = useCallback((rowId: string, files: File[]) => {
    if (!editableDraftTabId) {
      return;
    }

    setMultipartRowFiles(editableDraftTabId, rowId, files);
  }, [editableDraftTabId, setMultipartRowFiles]);
  const handleClearMultipartFiles = useCallback((rowId: string) => {
    if (!editableDraftTabId) {
      return;
    }

    clearMultipartRowFiles(editableDraftTabId, rowId);
  }, [clearMultipartRowFiles, editableDraftTabId]);
  const multipartFileSelectionEnabled = draft ? (draft.method === 'POST' || draft.method === 'PUT') : false;
  const multipartFileSelectionDisabledReason = multipartFileSelectionEnabled
    ? null
    : t('workspaceRoute.requestBuilder.bodyEditor.multipartFileSelectionDisabledByMethod');

  useEffect(() => {
    if (!activeTab || !draft?.dirty || !isPreviewRequestTab(activeTab)) {
      return;
    }

    pinTab(activeTab.id);
  }, [activeTab, draft?.dirty, pinTab]);

  useEffect(() => {
    if (!activeTab || !draft || pendingReplayRunTabId !== activeTab.id) {
      return;
    }

    if (runDisabledReason || runStatus.status === 'pending') {
      return;
    }

    if (!consumeReplayRun(activeTab.id)) {
      return;
    }

    handleRunWithFlush();
  }, [
    activeTab,
    consumeReplayRun,
    draft,
    handleRunWithFlush,
    pendingReplayRunTabId,
    runDisabledReason,
    runStatus.status,
  ]);

  if (!activeTab) {
    return (
      <div className="request-work-surface request-work-surface--empty" data-testid="request-tab-empty-state">
        <h2>{t('workspaceRoute.requestBuilder.empty.noSelectionTitle')}</h2>
        <p>
          {t('workspaceRoute.requestBuilder.empty.noSelectionDescription')}
        </p>
        <button type="button" className="workspace-button" onClick={onCreateRequest}>
          <IconLabel icon="new">{t('workspaceRoute.requestBuilder.empty.createDraftAction')}</IconLabel>
        </button>
      </div>
    );
  }
  if (activeTab.source === 'collection-overview') {
    const collection = findCollectionById(workspaceTree, activeTab.collectionId);
    const collectionSummary = collection
      ? summarizeRequestGroupTree(collection.childGroups)
      : { requestGroupCount: 0, requestCount: 0 };

    return (
      <div className="request-work-surface request-work-surface--empty" data-testid="workbench-collection-overview">
        <section className="workspace-surface-card request-editor-card">
          <header className="request-editor-card__header">
            <div>
              <p className="section-placeholder__eyebrow">{t('workspaceRoute.tabShell.sourceCollectionOverview')}</p>
              <h3>{collection?.name ?? activeTab.title}</h3>
              <p>{t('workspaceRoute.explorer.header.summary')}</p>
            </div>
          </header>
          <div className="request-work-surface__badges">
            <span className="workspace-chip">{t('workspaceRoute.explorer.tree.requestGroupCount', { count: collectionSummary.requestGroupCount })}</span>
            <span className="workspace-chip workspace-chip--secondary">{t('workspaceRoute.explorer.tree.requestCount', { count: collectionSummary.requestCount })}</span>
          </div>
        </section>
      </div>
    );
  }

  if (activeTab.source === 'request-group-overview') {
    const requestGroupLocation = findRequestGroupById(workspaceTree, activeTab.requestGroupId);
    const requestGroupSummary = requestGroupLocation
      ? summarizeRequestGroupTree(requestGroupLocation.requestGroup.childGroups)
      : { requestGroupCount: 0, requestCount: 0 };
    const requestCount = (requestGroupLocation?.requestGroup.requests.length ?? 0) + requestGroupSummary.requestCount;

    return (
      <div className="request-work-surface request-work-surface--empty" data-testid="workbench-request-group-overview">
        <section className="workspace-surface-card request-editor-card">
          <header className="request-editor-card__header">
            <div>
              <p className="section-placeholder__eyebrow">{t('workspaceRoute.tabShell.sourceRequestGroupOverview')}</p>
              <h3>{requestGroupLocation?.requestGroup.name ?? activeTab.title}</h3>
              <p>
                {requestGroupLocation
                  ? `${requestGroupLocation.collection.name} / ${requestGroupLocation.requestGroup.name}`
                  : activeTab.summary}
              </p>
            </div>
          </header>
          <div className="request-work-surface__badges">
            <span className="workspace-chip">{t('workspaceRoute.explorer.tree.requestCount', { count: requestCount })}</span>
            <span className="workspace-chip workspace-chip--secondary">{t('workspaceRoute.explorer.tree.requestGroupCount', { count: requestGroupSummary.requestGroupCount })}</span>
          </div>
        </section>
      </div>
    );
  }

  if (activeTab.source === 'batch-result') {
    const runStatusLabel = batchRunStatus === 'pending'
      ? t('workspaceRoute.resultPanel.batch.status.running')
      : batchRunStatus === 'error'
        ? (batchRunMessage ?? t('workspaceRoute.resultPanel.batch.status.noExecutionSelected'))
        : batchExecution
          ? batchExecution.aggregateOutcome
          : t('workspaceRoute.resultPanel.batch.status.noRunYet');

    return (
      <div className="request-work-surface request-work-surface--empty" data-testid="workbench-batch-result">
        <section className="workspace-surface-card request-editor-card">
          <header className="request-editor-card__header">
            <div>
              <p className="section-placeholder__eyebrow">{t('workspaceRoute.tabShell.sourceBatchResult')}</p>
              <h3>{batchExecution?.containerName ?? activeTab.title}</h3>
              <p>{t('workspaceRoute.resultPanel.batch.header.description')}</p>
            </div>
          </header>
          <div className="request-work-surface__badges">
            <span className="workspace-chip">{runStatusLabel}</span>
            <span className="workspace-chip workspace-chip--secondary">
              {batchExecution
                ? t('workspaceRoute.resultPanel.batch.badges.steps', { count: batchExecution.totalRuns })
                : t('workspaceRoute.resultPanel.batch.status.noRunYet')}
            </span>
          </div>
          {batchRunMessage ? <p className="shared-readiness-note">{batchRunMessage}</p> : null}
        </section>
      </div>
    );
  }
  if (!draft) {
    return (
      <div className="request-work-surface request-work-surface--empty">
        <h2>{t('workspaceRoute.requestBuilder.empty.preparingTitle')}</h2>
        <p>{t('workspaceRoute.requestBuilder.empty.preparingDescription')}</p>
      </div>
    );
  }

  const displayTitle = draft.name.trim() || t('workspaceRoute.requestBuilder.defaultTitle');
  const replaySource = activeTab.source === 'replay' ? activeTab.replaySource ?? null : null;
  const isDetachedDraft = isDetachedRequestTab(activeTab);
  const requestPlacementPath = formatRequestPlacementPath(draft);
  const locationSummary = replaySource
    ? getReplaySourceDescription(replaySource, t)
    : activeTab.source === 'saved'
      ? requestPlacementPath ?? t('workspaceRoute.requestBuilder.location.unsavedDraft')
      : requestPlacementPath
        ? t('workspaceRoute.requestBuilder.location.defaultSavePlacement', { path: requestPlacementPath })
        : t('workspaceRoute.requestBuilder.location.unsavedDraft');
  const saveStatusCopy = saveStatus.status === 'success'
    ? formatSavedAt(
      saveStatus.savedAt,
      (time) => t('workspaceRoute.requestBuilder.status.saveAtTime', { time }),
      t('workspaceRoute.requestBuilder.status.saveUpToDate'),
      formatDateTime,
    )
    : saveStatus.status === 'pending'
      ? t('workspaceRoute.requestBuilder.status.savingInProgress')
      : hasSaveConflict
        ? conflictUpdatedAt
          ? t('workspaceRoute.requestBuilder.status.saveConflictAtTime', {
              time: formatDateTime(conflictUpdatedAt, { dateStyle: 'medium', timeStyle: 'short' }),
            })
          : t('workspaceRoute.requestBuilder.status.saveConflict')
        : saveStatus.message ?? (saveDisabledReason ?? t('workspaceRoute.requestBuilder.status.saveFallback'));
  const runStatusCopy = getRunStatusCopy(
    runStatus,
    runDisabledReason ?? t('workspaceRoute.requestBuilder.status.runFallback'),
    t,
  );
  const environmentSelectValue = draft.selectedEnvironmentId ?? '';
  const selectedEnvironment = (environmentsQuery.data ?? []).find((environment) => environment.id === draft.selectedEnvironmentId) ?? null;
  const hasMissingEnvironmentReference = environmentSelectValue.length > 0 && environmentsQuery.isSuccess && !selectedEnvironment;
  const environmentSupportCopy = environmentsQuery.isPending
    ? t('workspaceRoute.requestBuilder.environment.loading')
    : environmentsQuery.isError
      ? t('workspaceRoute.requestBuilder.environment.degraded')
      : hasMissingEnvironmentReference
        ? t('workspaceRoute.requestBuilder.environment.missing')
        : selectedEnvironment
          ? t('workspaceRoute.requestBuilder.environment.selected', { name: selectedEnvironment.name, count: selectedEnvironment.enabledVariableCount })
          : t('workspaceRoute.requestBuilder.environment.noneSelected');
  const selectedCollection = findSelectedPlacementCollection(placementOptions, draft);
  const selectedRequestGroup = findSelectedPlacementGroup(selectedCollection, draft);
  const collectionSelectValue = selectedCollection ? getCollectionPlacementValue(selectedCollection) : '';
  const requestGroupSelectValue = selectedRequestGroup ? getRequestGroupPlacementValue(selectedRequestGroup) : '';
  const selectedPlacementPath = selectedCollection && selectedRequestGroup
    ? formatRequestPlacementPath(createRequestPlacementFromSelection(selectedCollection, selectedRequestGroup))
    : null;
  const selectedRequestGroupPendingCreate = isPendingRequestPlacementGroup(selectedRequestGroup);
  const copiedScriptNames = copiedScriptNamesByTabId[draft.tabId] ?? {};
  const placementSupportCopy = selectedPlacementPath
    ? selectedRequestGroupPendingCreate
      ? t('workspaceRoute.requestBuilder.placement.pendingCreate', {
          path: selectedPlacementPath,
          groupName: selectedRequestGroup?.requestGroupName ?? DEFAULT_REQUEST_GROUP_NAME,
        })
      : t('workspaceRoute.requestBuilder.placement.selected', { path: selectedPlacementPath })
    : t('workspaceRoute.requestBuilder.placement.unavailable');

  return (
    <div className="request-work-surface request-builder-core" data-testid="request-work-surface">
      <header className="request-work-surface__header request-builder-core__header">
        <div className="request-work-surface__header-copy">
          <p className="section-placeholder__eyebrow">{t('workspaceRoute.requestBuilder.header.eyebrow')}</p>
          <h2>{displayTitle}</h2>
          <p>{t('workspaceRoute.requestBuilder.header.description')}</p>
        </div>
        <div className="request-work-surface__badges">
          <span className="workspace-chip">{draft.method}</span>
          {replaySource ? (
            <span className="workspace-chip workspace-chip--replay">{getReplaySourceLabel(replaySource, t)}</span>
          ) : (
            <span className="workspace-chip">{isDetachedDraft ? t('workspaceRoute.requestBuilder.badges.detachedDraft') : activeTab.source === 'saved' ? t('workspaceRoute.requestBuilder.badges.savedRequest') : t('workspaceRoute.requestBuilder.badges.newDraft')}</span>
          )}
          {draft.dirty ? <span className="workspace-chip workspace-chip--accent">{t('workspaceRoute.requestBuilder.badges.dirty')}</span> : null}
        </div>
      </header>

      <div className="request-work-surface__header-strip request-builder-core__header-strip">
        <div className="request-builder-core__identity">
          <label className="request-field request-field--wide">
            <span>{t('workspaceRoute.requestBuilder.fields.requestName')}</span>
            <input
              aria-label={t('workspaceRoute.requestBuilder.fields.requestName')}
              type="text"
              value={requestNameField.value}
              onChange={(event) => requestNameField.setValue(event.currentTarget.value)}
              onBlur={requestNameField.flush}
            />
          </label>
          <p className="request-builder-core__source-copy">{locationSummary}</p>
          <div className="request-editor-card__row request-editor-card__row--compact-fluid request-builder-core__placement-row">
            <label className="request-field request-field--compact">
              <span>{t('workspaceRoute.requestBuilder.fields.saveCollection')}</span>
              <select
                aria-label={t('workspaceRoute.requestBuilder.fields.saveCollection')}
                value={collectionSelectValue}
                onChange={(event) => {
                  const nextCollection = placementOptions.find((collection) => (
                    getCollectionPlacementValue(collection) === event.currentTarget.value
                  ));

                  if (!nextCollection) {
                    return;
                  }

                  const nextRequestGroup = nextCollection.requestGroups[0] ?? { requestGroupName: DEFAULT_REQUEST_GROUP_NAME };
                  updateDraftPlacement(
                    draft.tabId,
                    createRequestPlacementFromSelection(nextCollection, nextRequestGroup),
                  );
                }}
              >
                {placementOptions.map((collection) => (
                  <option key={getCollectionPlacementValue(collection)} value={getCollectionPlacementValue(collection)}>
                    {collection.collectionName}
                  </option>
                ))}
              </select>
            </label>
            <label className="request-field request-field--wide">
              <span>{t('workspaceRoute.requestBuilder.fields.saveRequestGroup')}</span>
              <select
                aria-label={t('workspaceRoute.requestBuilder.fields.saveRequestGroup')}
                value={requestGroupSelectValue}
                onChange={(event) => {
                  const nextRequestGroup = selectedCollection?.requestGroups.find((requestGroup) => (
                    getRequestGroupPlacementValue(requestGroup) === event.currentTarget.value
                  ));

                  if (!selectedCollection || !nextRequestGroup) {
                    return;
                  }

                  updateDraftPlacement(
                    draft.tabId,
                    createRequestPlacementFromSelection(selectedCollection, nextRequestGroup),
                  );
                }}
                disabled={!selectedCollection || selectedRequestGroupPendingCreate || selectedCollection.requestGroups.length === 0}
              >
                {(selectedCollection?.requestGroups.length ?? 0) > 0
                  ? selectedCollection?.requestGroups.map((requestGroup) => (
                      <option key={getRequestGroupPlacementValue(requestGroup)} value={getRequestGroupPlacementValue(requestGroup)}>
                        {isPendingRequestPlacementGroup(requestGroup)
                          ? t('workspaceRoute.requestBuilder.placement.pendingOption', { name: requestGroup.requestGroupName })
                          : requestGroup.requestGroupPathLabel ?? requestGroup.requestGroupName}
                      </option>
                    ))
                  : <option value="">{t('workspaceRoute.requestBuilder.placement.noRequestGroups')}</option>}
              </select>
            </label>
          </div>
          <p className="shared-readiness-note request-builder-core__support-copy">{placementSupportCopy}</p>
          <div className="request-editor-card__row request-editor-card__row--compact-fluid request-builder-core__environment-row">
            <label className="request-field request-field--compact">
              <span>{t('workspaceRoute.requestBuilder.fields.requestEnvironment')}</span>
              <select
                aria-label={t('workspaceRoute.requestBuilder.fields.requestEnvironment')}
                value={environmentSelectValue}
                onChange={(event) => updateSelectedEnvironmentId(draft.tabId, event.currentTarget.value || null)}
              >
                <option value="">{t('workspaceRoute.requestBuilder.environment.noEnvironment')}</option>
                {(environmentsQuery.data ?? []).map((environment) => (
                  <option key={environment.id} value={environment.id}>
                    {environment.name}
                  </option>
                ))}
                {hasMissingEnvironmentReference ? (
                  <option value={environmentSelectValue}>{t('workspaceRoute.requestBuilder.environment.missingReferenceOption')}</option>
                ) : null}
              </select>
            </label>
            <div className="request-work-surface__badges request-builder-core__environment-badges">
              {selectedEnvironment?.isDefault ? <span className="workspace-chip workspace-chip--secondary">{t('workspaceRoute.requestBuilder.environment.defaultBadge')}</span> : null}
              {hasMissingEnvironmentReference ? <span className="workspace-chip workspace-chip--replay">{t('workspaceRoute.requestBuilder.environment.missingBadge')}</span> : null}
            </div>
          </div>
          <p className="shared-readiness-note request-builder-core__support-copy">{environmentSupportCopy}</p>
        </div>
        <div className="request-builder-core__command-area">
          <div className="shared-action-bar request-builder-core__command-actions" aria-label={t('workspaceRoute.requestBuilder.a11y.headerActions')}>
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={handleSaveWithFlush}
              disabled={Boolean(saveDisabledReason)}
            >
              <IconLabel icon="save">{saveStatus.status === 'pending' ? t('workspaceRoute.requestBuilder.commands.saving') : t('workspaceRoute.requestBuilder.commands.save')}</IconLabel>
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={() => {
                flushHotInputFields();
                onDuplicateRequest();
              }}
            >
              <IconLabel icon="duplicate">{t('workspaceRoute.requestBuilder.commands.duplicate')}</IconLabel>
            </button>
            <button
              type="button"
              className="workspace-button"
              onClick={handleRunWithFlush}
              disabled={Boolean(runDisabledReason)}
            >
              <IconLabel icon="run">{runStatus.status === 'pending' ? t('workspaceRoute.requestBuilder.commands.running') : t('workspaceRoute.requestBuilder.commands.run')}</IconLabel>
            </button>
          </div>
          <div className="request-builder-core__command-copy-group">
            <p className="request-builder-core__command-copy">
              {replaySource
                ? t('workspaceRoute.requestBuilder.commands.replayIntro')
                : t('workspaceRoute.requestBuilder.commands.defaultIntro')}
            </p>
            <p className="shared-readiness-note" data-testid="save-command-status">{saveStatusCopy}</p>
            <p className="shared-readiness-note" data-testid="run-command-status">{runStatusCopy}</p>
            {hasSaveConflict ? (
              <>
                <div className="shared-action-bar request-builder-core__conflict-actions">
                  <button
                    type="button"
                    className="workspace-button workspace-button--secondary"
                    onClick={handleOverwriteSaveWithFlush}
                    disabled={saveStatus.status === 'pending'}
                  >
                    {t('workspaceRoute.requestBuilder.commands.overwrite')}
                  </button>
                  <button
                    type="button"
                    className="workspace-button workspace-button--secondary"
                    onClick={handleSaveAsNewWithFlush}
                    disabled={saveStatus.status === 'pending'}
                  >
                    {t('workspaceRoute.requestBuilder.commands.saveAsNew')}
                  </button>
                </div>
                <p className="shared-readiness-note">{t('workspaceRoute.requestBuilder.status.saveConflictResolutionHint')}</p>
              </>
            ) : (
              <p className="shared-readiness-note">{t('workspaceRoute.requestBuilder.commands.duplicateDeferred')}</p>
            )}
          </div>
        </div>
      </div>
      {isDetachedDraft ? (
        <section className="request-builder-core__detached-banner" role="status">
          <div>
            <h3>{t('workspaceRoute.requestBuilder.detached.title')}</h3>
            <p>{t('workspaceRoute.requestBuilder.detached.description')}</p>
          </div>
          <p className="shared-readiness-note">
            {requestPlacementPath
              ? t('workspaceRoute.requestBuilder.detached.saveTarget', { path: requestPlacementPath })
              : t('workspaceRoute.requestBuilder.detached.noSaveTarget')}
          </p>
        </section>
      ) : null}

      <section className="workspace-surface-card request-editor-card request-editor-card--primary">
        <div className="request-editor-card__row request-editor-card__row--compact-fluid request-editor-card__row--method-url">
          <label className="request-field request-field--compact">
            <span>{t('workspaceRoute.requestBuilder.fields.requestMethod')}</span>
            <select
              aria-label={t('workspaceRoute.requestBuilder.fields.requestMethod')}
              value={draft.method}
              onChange={(event) => updateDraftMethod(draft.tabId, event.currentTarget.value as RequestDraftState['method'])}
            >
              {httpMethodOptions.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label className="request-field request-field--wide">
            <span>{t('workspaceRoute.requestBuilder.fields.requestUrl')}</span>
            <input
              aria-label={t('workspaceRoute.requestBuilder.fields.requestUrl')}
              placeholder={t('workspaceRoute.requestBuilder.fields.requestUrlPlaceholder')}
              type="text"
              value={requestUrlField.value}
              onChange={(event) => requestUrlField.setValue(event.currentTarget.value)}
              onBlur={requestUrlField.flush}
            />
          </label>
        </div>
      </section>
      <div className="request-work-surface__editor-tabs" aria-label={t('workspaceRoute.requestBuilder.a11y.editorTabs')}>
        {requestEditorTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={draft.activeEditorTab === tab.id ? 'workspace-subtab workspace-subtab--active' : 'workspace-subtab'}
            aria-pressed={draft.activeEditorTab === tab.id}
            onClick={() => handleSetActiveEditorTab(tab.id)}
          >
            <span className="workspace-subtab__content">
              <IconLabel icon={tab.icon}>{getLocalizedRequestEditorTabLabel(tab.id, t)}</IconLabel>
            </span>
          </button>
        ))}
      </div>

      <div className="request-work-surface__body request-work-surface__body--single">
        {draft.activeEditorTab === 'params' ? (
          <RequestKeyValueEditor
            addButtonLabel={t('workspaceRoute.requestBuilder.paramsEditor.addAction')}
            description={t('workspaceRoute.requestBuilder.paramsEditor.description')}
            emptyCopy={t('workspaceRoute.requestBuilder.paramsEditor.empty')}
            rowLabel={t('workspaceRoute.requestBuilder.paramsEditor.rowLabel')}
            rows={draft.params}
            title={t('workspaceRoute.requestBuilder.paramsEditor.title')}
            onAddRow={handleAddParamsRow}
            onRemoveRow={handleRemoveParamsRow}
            onUpdateRow={handleUpdateParamsRow}
          />
        ) : null}

        {draft.activeEditorTab === 'headers' ? (
          <RequestKeyValueEditor
            addButtonLabel={t('workspaceRoute.requestBuilder.headersEditor.addAction')}
            description={t('workspaceRoute.requestBuilder.headersEditor.description')}
            emptyCopy={t('workspaceRoute.requestBuilder.headersEditor.empty')}
            rowLabel={t('workspaceRoute.requestBuilder.headersEditor.rowLabel')}
            rows={draft.headers}
            title={t('workspaceRoute.requestBuilder.headersEditor.title')}
            onAddRow={handleAddHeadersRow}
            onRemoveRow={handleRemoveHeadersRow}
            onUpdateRow={handleUpdateHeadersRow}
          />
        ) : null}

        {draft.activeEditorTab === 'body' ? (
          <section className="workspace-surface-card request-editor-card">
            <header className="request-editor-card__header">
              <div>
                <h3>{t('workspaceRoute.requestBuilder.bodyEditor.title')}</h3>
                <p>{t('workspaceRoute.requestBuilder.bodyEditor.description')}</p>
              </div>
            </header>

            <label className="request-field request-field--compact">
              <span>{t('workspaceRoute.requestBuilder.bodyEditor.modeLabel')}</span>
              <select
                value={draft.bodyMode}
                onChange={(event) => updateBodyMode(draft.tabId, event.currentTarget.value as RequestDraftState['bodyMode'])}
              >
                {bodyModeOptions.map((bodyMode) => (
                  <option key={bodyMode} value={bodyMode}>
                    {bodyMode === 'none' ? t('workspaceRoute.requestBuilder.bodyModeOptions.none') : bodyMode === 'json' ? t('workspaceRoute.requestBuilder.bodyModeOptions.json') : bodyMode === 'text' ? t('workspaceRoute.requestBuilder.bodyModeOptions.text') : bodyMode === 'form-urlencoded' ? t('workspaceRoute.requestBuilder.bodyModeOptions.formUrlencoded') : t('workspaceRoute.requestBuilder.bodyModeOptions.multipartFormData')}
                  </option>
                ))}
              </select>
            </label>

            {draft.bodyMode === 'none' ? (
              <p className="request-editor-card__empty">{t('workspaceRoute.requestBuilder.bodyEditor.empty')}</p>
            ) : null}

            {draft.bodyMode === 'json' || draft.bodyMode === 'text' ? (
              <label className="request-field">
                <span>
                  {draft.bodyMode === 'json'
                    ? t('workspaceRoute.requestBuilder.bodyEditor.contentJsonLabel')
                    : t('workspaceRoute.requestBuilder.bodyEditor.contentTextLabel')}
                </span>
                <textarea
                  rows={10}
                  value={requestBodyTextField.value}
                  onChange={(event) => requestBodyTextField.setValue(event.currentTarget.value)}
                  onBlur={requestBodyTextField.flush}
                />
              </label>
            ) : null}

            {draft.bodyMode === 'form-urlencoded' ? (
              <RequestKeyValueEditor
                addButtonLabel={t('workspaceRoute.requestBuilder.bodyEditor.formAddAction')}
                description={t('workspaceRoute.requestBuilder.bodyEditor.formDescription')}
                emptyCopy={t('workspaceRoute.requestBuilder.bodyEditor.formEmpty')}
                rowLabel={t('workspaceRoute.requestBuilder.bodyEditor.formRowLabel')}
                rows={draft.formBody}
                title={t('workspaceRoute.requestBuilder.bodyEditor.formTitle')}
                onAddRow={handleAddFormBodyRow}
                onRemoveRow={handleRemoveFormBodyRow}
                onUpdateRow={handleUpdateFormBodyRow}
              />
            ) : null}

            {draft.bodyMode === 'multipart-form-data' ? (
              <RequestKeyValueEditor
                addButtonLabel={t('workspaceRoute.requestBuilder.bodyEditor.multipartAddAction')}
                description={t('workspaceRoute.requestBuilder.bodyEditor.multipartDescription')}
                emptyCopy={t('workspaceRoute.requestBuilder.bodyEditor.multipartEmpty')}
                rowLabel={t('workspaceRoute.requestBuilder.bodyEditor.multipartRowLabel')}
                rows={draft.multipartBody}
                title={t('workspaceRoute.requestBuilder.bodyEditor.multipartTitle')}
                allowRowValueTypeSelection
                selectedFilesByRowId={multipartFilesByRowId}
                fileSelectionEnabled={multipartFileSelectionEnabled}
                fileSelectionDisabledReason={multipartFileSelectionDisabledReason}
                onAddRow={handleAddMultipartRow}
                onRemoveRow={handleRemoveMultipartRow}
                onUpdateRow={handleUpdateMultipartRow}
                onSelectFiles={handleSelectMultipartFiles}
                onClearFiles={handleClearMultipartFiles}
              />
            ) : null}
          </section>
        ) : null}

        {draft.activeEditorTab === 'auth' ? (
          <section className="workspace-surface-card request-editor-card">
            <header className="request-editor-card__header">
              <div>
                <h3>{t('workspaceRoute.requestBuilder.authEditor.title')}</h3>
                <p>{t('workspaceRoute.requestBuilder.authEditor.description')}</p>
              </div>
            </header>

            <label className="request-field request-field--compact">
              <span>{t('workspaceRoute.requestBuilder.authEditor.typeLabel')}</span>
              <select
                value={draft.auth.type}
                onChange={(event) => updateAuthType(draft.tabId, event.currentTarget.value as RequestDraftState['auth']['type'])}
              >
                {authTypeOptions.map((authType) => (
                  <option key={authType} value={authType}>
                    {authType === 'none' ? t('workspaceRoute.requestBuilder.authTypeOptions.none') : authType === 'bearer' ? t('workspaceRoute.requestBuilder.authTypeOptions.bearer') : authType === 'basic' ? t('workspaceRoute.requestBuilder.authTypeOptions.basic') : t('workspaceRoute.requestBuilder.authTypeOptions.apiKey')}
                  </option>
                ))}
              </select>
            </label>

            {draft.auth.type === 'none' ? (
              <p className="request-editor-card__empty">{t('workspaceRoute.requestBuilder.authEditor.empty')}</p>
            ) : null}

            {draft.auth.type === 'bearer' ? (
              <label className="request-field">
                <span>{t('workspaceRoute.requestBuilder.authEditor.bearerToken')}</span>
                <input
                  aria-label={t('workspaceRoute.requestBuilder.authEditor.bearerToken')}
                  type="text"
                  value={bearerTokenField.value}
                  onChange={(event) => bearerTokenField.setValue(event.currentTarget.value)}
                  onBlur={bearerTokenField.flush}
                />
              </label>
            ) : null}

            {draft.auth.type === 'basic' ? (
              <div className="request-editor-card__grid">
                <label className="request-field">
                  <span>{t('workspaceRoute.requestBuilder.authEditor.username')}</span>
                  <input
                    aria-label={t('workspaceRoute.requestBuilder.authEditor.username')}
                    type="text"
                    value={basicUsernameField.value}
                    onChange={(event) => basicUsernameField.setValue(event.currentTarget.value)}
                    onBlur={basicUsernameField.flush}
                  />
                </label>
                <label className="request-field">
                  <span>{t('workspaceRoute.requestBuilder.authEditor.password')}</span>
                  <input
                    aria-label={t('workspaceRoute.requestBuilder.authEditor.password')}
                    type="password"
                    value={basicPasswordField.value}
                    onChange={(event) => basicPasswordField.setValue(event.currentTarget.value)}
                    onBlur={basicPasswordField.flush}
                  />
                </label>
              </div>
            ) : null}

            {draft.auth.type === 'api-key' ? (
              <div className="request-editor-card__grid">
                <label className="request-field">
                  <span>{t('workspaceRoute.requestBuilder.authEditor.apiKeyName')}</span>
                  <input
                    aria-label={t('workspaceRoute.requestBuilder.authEditor.apiKeyName')}
                    type="text"
                    value={apiKeyNameField.value}
                    onChange={(event) => apiKeyNameField.setValue(event.currentTarget.value)}
                    onBlur={apiKeyNameField.flush}
                  />
                </label>
                <label className="request-field">
                  <span>{t('workspaceRoute.requestBuilder.authEditor.apiKeyValue')}</span>
                  <input
                    aria-label={t('workspaceRoute.requestBuilder.authEditor.apiKeyValue')}
                    type="text"
                    value={apiKeyValueField.value}
                    onChange={(event) => apiKeyValueField.setValue(event.currentTarget.value)}
                    onBlur={apiKeyValueField.flush}
                  />
                </label>
                <label className="request-field request-field--compact">
                  <span>{t('workspaceRoute.requestBuilder.authEditor.apiKeyPlacement')}</span>
                  <select
                    aria-label={t('workspaceRoute.requestBuilder.authEditor.apiKeyPlacement')}
                    value={draft.auth.apiKeyPlacement}
                    onChange={(event) => updateAuthField(draft.tabId, 'apiKeyPlacement', event.currentTarget.value)}
                  >
                    <option value="header">{t('workspaceRoute.requestBuilder.apiKeyPlacementOptions.header')}</option>
                    <option value="query">{t('workspaceRoute.requestBuilder.apiKeyPlacementOptions.query')}</option>
                  </select>
                </label>
              </div>
            ) : null}
          </section>
        ) : null}

        {draft.activeEditorTab === 'scripts' ? (
          <Suspense
            fallback={
              <section className="workspace-surface-card request-editor-card request-editor-card--scripts request-script-loading" data-testid="script-editor-loading">
                <header className="request-editor-card__header">
                  <div>
                    <h3>{t('workspaceRoute.requestBuilder.loadingScripts.title')}</h3>
                    <p>
                      {t('workspaceRoute.requestBuilder.loadingScripts.description')}
                    </p>
                  </div>
                </header>
                <div className="request-script-loading__body">
                  <article className="workspace-surface-card workspace-surface-card--muted">
                    <h4>{t('workspaceRoute.requestBuilder.loadingScripts.lazyPathTitle')}</h4>
                    <p>
                      {t('workspaceRoute.requestBuilder.loadingScripts.lazyPathDescription')}
                    </p>
                  </article>
                </div>
              </section>
            }
          >
            <LazyRequestScriptsEditorSurface
              draft={draft}
              onStageChange={(stage) => setActiveScriptStage(draft.tabId, stage)}
              onContentChange={(stage, content) => updateScriptContent(draft.tabId, stage, content)}
              onRegisterInlineFlush={registerScriptInlineFlush}
              copiedFromScriptNames={copiedScriptNames}
              onAttachSavedScript={(stage, scriptName, content) => {
                updateScriptContent(draft.tabId, stage, content);
                setCopiedScriptNamesByTabId((current) => ({
                  ...current,
                  [draft.tabId]: {
                    ...(current[draft.tabId] ?? {}),
                    [stage]: scriptName,
                  },
                }));
              }}
              onLinkSavedScript={(stage, script: SavedScriptRecord) => {
                linkScriptStageToSavedScript(draft.tabId, stage, {
                  savedScriptId: script.id,
                  savedScriptNameSnapshot: script.name,
                });
                setCopiedScriptNamesByTabId((current) => ({
                  ...current,
                  [draft.tabId]: {
                    ...(current[draft.tabId] ?? {}),
                    [stage]: '',
                  },
                }));
              }}
              onDetachSavedScript={(stage, scriptName, content) => {
                updateScriptContent(draft.tabId, stage, content);
                setCopiedScriptNamesByTabId((current) => ({
                  ...current,
                  [draft.tabId]: {
                    ...(current[draft.tabId] ?? {}),
                    [stage]: content.length > 0 ? scriptName : '',
                  },
                }));
              }}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}


