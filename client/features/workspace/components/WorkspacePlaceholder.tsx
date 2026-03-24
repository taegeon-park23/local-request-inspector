import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  listWorkspaceEnvironments,
  workspaceEnvironmentsQueryKey,
} from '@client/features/environments/environment.api';
import { workspaceScriptsQueryKey } from '@client/features/scripts/scripts.api';
import {
  listWorkspaceSavedRequests,
  type SavedRequestResourceRecord,
  workspaceSavedRequestsQueryKey,
} from '@client/features/request-builder/request-builder.api';
import { useRequestBuilderCommands } from '@client/features/request-builder/hooks/useRequestBuilderCommands';
import { RequestResultPanelPlaceholder } from '@client/features/request-builder/components/RequestResultPanelPlaceholder';
import { useI18n } from '@client/app/providers/useI18n';
import { RequestTabShell } from '@client/features/request-builder/components/RequestTabShell';
import { RequestWorkSurfacePlaceholder } from '@client/features/request-builder/components/RequestWorkSurfacePlaceholder';
import {
  createRequestPlacementFields,
  DEFAULT_REQUEST_GROUP_NAME,
  readRequestGroupName,
  resolveRequestPlacement,
  type RequestPlacementCollectionOption,
} from '@client/features/request-builder/request-placement';
import { useRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import type { RequestDraftSeed } from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { workspaceMockRulesQueryKey } from '@client/features/mocks/mock-rules.api';
import { WorkspaceExplorer } from '@client/features/workspace/components/WorkspaceExplorer';
import {
  WorkspaceResourceManagerPanel,
  type WorkspaceResourceManagerStatus,
  type WorkspaceResourceManagerStatusScope,
} from '@client/features/workspace/components/WorkspaceResourceManagerPanel';
import { SectionHeading } from '@client/shared/ui/SectionHeading';
import {
  downloadAuthoredResourceBundle,
  exportSavedRequestResource,
  exportWorkspaceResources,
  importWorkspaceResources,
  type AuthoredResourceBundleExport,
  type AuthoredResourceBundleImportPreviewResult,
  type AuthoredResourceBundleImportResult,
  previewWorkspaceResources,
} from '@client/features/workspace/resource-bundle.api';
import {
  buildFallbackWorkspaceRequestTree,
  createWorkspaceCollection,
  createWorkspaceRequestGroup,
  deleteWorkspaceCollection,
  deleteWorkspaceRequestGroup,
  deleteWorkspaceSavedRequest,
  listWorkspaceRequestTree,
  readWorkspaceSavedRequestDetail,
  updateWorkspaceCollection,
  updateWorkspaceRequestGroup,
  workspaceRequestTreeQueryKey,
  type WorkspaceCollectionNode,
  type WorkspaceRequestGroupNode,
  type WorkspaceTreeRequestLeaf,
} from '@client/features/workspace/workspace-request-tree.api';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';
import { useWorkspaceUiStore } from '@client/features/workspace/state/workspace-ui-store';
import { RoutePanelTabsLayout } from '@client/features/shared-section-placeholder';
import { useShellStore } from '@client/app/providers/shell-store';
import { useReplayRunStore } from '@client/shared/replay-run-store';

type WorkspaceResourceManagerStatuses = Partial<Record<WorkspaceResourceManagerStatusScope, WorkspaceResourceManagerStatus>>;

interface PendingImportPreview {
  bundleText: string;
  fileName: string;
  result: AuthoredResourceBundleImportPreviewResult;
}

function resolvePresentationTab(
  tab: RequestTabRecord,
  draft: ReturnType<typeof useRequestDraftStore.getState>['draftsByTabId'][string] | undefined,
): RequestTabRecord {
  if (!draft) {
    return tab;
  }

  return {
    ...tab,
    title: draft.draft.name.trim() || 'Untitled Request',
    methodLabel: draft.draft.method,
    hasUnsavedChanges: draft.draft.dirty,
  };
}

function createImportStatusMessage(
  result: AuthoredResourceBundleImportResult,
  t: ReturnType<typeof useI18n>['t'],
) {
  const details = createImportSummaryDetails(result.summary, t);
  const {
    acceptedCount,
    rejectedCount,
  } = result.summary;
  const acceptedSummary = t('workspaceRoute.explorer.status.acceptedSummary', { count: acceptedCount });

  if (rejectedCount === 0) {
    return {
      tone: 'success' as const,
      message: t('workspaceRoute.explorer.status.importSuccess', { acceptedSummary }),
      details,
    };
  }

  return {
    tone: acceptedCount === 0 ? 'error' as const : 'info' as const,
    message: t('workspaceRoute.explorer.status.importRejected', { acceptedSummary, rejectedCount }),
    details,
  };
}

function createImportSummaryDetails(
  summary: AuthoredResourceBundleImportResult['summary'],
  t: ReturnType<typeof useI18n>['t'],
) {
  const {
    createdCollectionCount,
    createdRequestGroupCount,
    createdRequestCount,
    createdMockRuleCount,
    createdScriptCount,
    renamedCount,
    importedNamesPreview,
    rejectedReasonSummary,
    rejectedCount,
  } = summary;
  const details = [
    t('workspaceRoute.explorer.status.createdCollections', { count: createdCollectionCount ?? 0 }),
    t('workspaceRoute.explorer.status.createdRequestGroups', { count: createdRequestGroupCount ?? 0 }),
    t('workspaceRoute.explorer.status.createdRequests', { count: createdRequestCount }),
    t('workspaceRoute.explorer.status.createdMockRules', { count: createdMockRuleCount }),
    t('workspaceRoute.explorer.status.createdScripts', { count: createdScriptCount ?? 0 }),
    t('workspaceRoute.explorer.status.renamedOnImport', { count: renamedCount }),
    t('workspaceRoute.explorer.status.rejectedDuringValidation', { count: rejectedCount }),
  ];

  if (importedNamesPreview.length > 0) {
    details.push(t('workspaceRoute.explorer.status.importedPreview', { names: importedNamesPreview.join(', ') }));
  }

  if (rejectedReasonSummary.length > 0) {
    details.push(
      t('workspaceRoute.explorer.status.rejectedReasons', {
        reasons: rejectedReasonSummary.map((entry) => `${entry.reason} (${entry.count})`).join(' · '),
      }),
    );
  }

  return details;
}

function createPreviewStatusMessage(
  fileName: string,
  result: AuthoredResourceBundleImportPreviewResult,
  t: ReturnType<typeof useI18n>['t'],
) {
  const details = createImportSummaryDetails(result.summary, t);
  const {
    acceptedCount,
    rejectedCount,
  } = result.summary;

  if (acceptedCount === 0) {
    if (rejectedCount === 0) {
      return {
        tone: 'error' as const,
        message: t('workspaceRoute.explorer.status.previewNoResources', { fileName }),
        details,
      };
    }

    return {
      tone: 'error' as const,
      message: t('workspaceRoute.explorer.status.previewNoImportable', { fileName, rejectedCount }),
      details,
    };
  }

  const acceptedSummary = t('workspaceRoute.explorer.status.acceptedSummary', { count: acceptedCount });

  if (rejectedCount === 0) {
    return {
      tone: 'info' as const,
      message: t('workspaceRoute.explorer.status.previewReady', { fileName, acceptedSummary }),
      details,
    };
  }

  return {
    tone: 'info' as const,
    message: t('workspaceRoute.explorer.status.previewReadyRejected', {
      fileName,
      acceptedSummary,
      rejectedCount,
    }),
    details,
  };
}

function createExportStatusMessage(
  bundle: AuthoredResourceBundleExport,
  label: string,
  t: ReturnType<typeof useI18n>['t'],
) {
  return {
    tone: 'success' as const,
    message: t('workspaceRoute.explorer.status.exportCompleted', { label }),
    details: [
      t('workspaceRoute.explorer.status.bundleCollectionCount', { count: bundle.collections?.length ?? 0 }),
      t('workspaceRoute.explorer.status.bundleRequestGroupCount', { count: bundle.requestGroups?.length ?? 0 }),
      t('workspaceRoute.explorer.status.bundleRequestCount', { count: bundle.requests.length }),
      t('workspaceRoute.explorer.status.bundleMockRuleCount', { count: bundle.mockRules.length }),
      t('workspaceRoute.explorer.status.bundleScriptCount', { count: bundle.scripts.length }),
      t('workspaceRoute.explorer.status.runtimeExcluded'),
    ],
  };
}

function resolveSeededEnvironmentId(draftSeed: RequestDraftSeed | undefined, defaultEnvironmentId: string | null) {
  if (draftSeed && 'selectedEnvironmentId' in draftSeed) {
    return draftSeed.selectedEnvironmentId ?? null;
  }

  return defaultEnvironmentId;
}

function buildRequestPlacementOptions(
  tree: WorkspaceCollectionNode[],
  defaults: {
    collectionId: string;
    requestGroupId: string;
    collectionName: string;
    requestGroupName: string;
  } | undefined,
): RequestPlacementCollectionOption[] {
  if (tree.length > 0) {
    return tree.map((collection) => ({
      collectionId: collection.collectionId,
      collectionName: collection.name,
      requestGroups: collection.children.length > 0
        ? collection.children.map((requestGroup) => ({
            requestGroupId: requestGroup.requestGroupId,
            requestGroupName: requestGroup.name,
          }))
        : [{
            requestGroupName: defaults?.requestGroupName ?? DEFAULT_REQUEST_GROUP_NAME,
            pendingCreation: true,
          }],
    }));
  }

  if (!defaults) {
    return [];
  }

  return [{
    collectionId: defaults.collectionId,
    collectionName: defaults.collectionName,
    requestGroups: [{
      requestGroupId: defaults.requestGroupId,
      requestGroupName: defaults.requestGroupName,
    }],
  }];
}

function findWorkspaceRequestById(
  tree: WorkspaceCollectionNode[],
  requestId: string | null | undefined,
) {
  if (!requestId) {
    return null;
  }

  for (const collection of tree) {
    for (const requestGroup of collection.children) {
      const requestNode = requestGroup.children.find((child) => child.request.id === requestId);

      if (requestNode) {
        return requestNode.request;
      }
    }
  }

  return null;
}

export function WorkspacePlaceholder() {
  const queryClient = useQueryClient();
  const { locale, t } = useI18n();
  const [managerStatuses, setManagerStatuses] = useState<WorkspaceResourceManagerStatuses>({});
  const [pendingImportPreview, setPendingImportPreview] = useState<PendingImportPreview | null>(null);
  const tabs = useWorkspaceShellStore((state) => state.tabs);
  const activeTabId = useWorkspaceShellStore((state) => state.activeTabId);
  const selectedExplorerItemId = useWorkspaceShellStore((state) => state.selectedExplorerItemId);
  const openNewRequest = useWorkspaceShellStore((state) => state.openNewRequest);
  const openSavedRequest = useWorkspaceShellStore((state) => state.openSavedRequest);
  const setActiveTab = useWorkspaceShellStore((state) => state.setActiveTab);
  const workspaceActivePanel = useWorkspaceUiStore((state) => state.routePanels.workspace.activePanel);
  const setWorkspaceActivePanel = useWorkspaceUiStore((state) => state.setRouteActivePanel);
  const focusWorkspaceWorkSurface = useWorkspaceUiStore((state) => state.focusWorkspaceWorkSurface);
  const closeTab = useWorkspaceShellStore((state) => state.closeTab);
  const setFloatingExplorerOpen = useShellStore((state) => state.setFloatingExplorerOpen);
  const draftsByTabId = useRequestDraftStore((state) => state.draftsByTabId);
  const ensureDraftForTab = useRequestDraftStore((state) => state.ensureDraftForTab);
  const removeDraft = useRequestDraftStore((state) => state.removeDraft);
  const syncDraftCollectionPlacement = useRequestDraftStore((state) => state.syncCollectionPlacement);
  const syncDraftRequestGroupPlacement = useRequestDraftStore((state) => state.syncRequestGroupPlacement);
  const removeCommandState = useRequestCommandStore((state) => state.removeTab);
  const syncTabCollectionPlacement = useWorkspaceShellStore((state) => state.syncCollectionPlacement);
  const syncTabRequestGroupPlacement = useWorkspaceShellStore((state) => state.syncRequestGroupPlacement);

  const savedRequestsQuery = useQuery({
    queryKey: workspaceSavedRequestsQueryKey,
    queryFn: async () => {
      try {
        return await listWorkspaceSavedRequests();
      } catch {
        return [];
      }
    },
  });
  const requestTreeQuery = useQuery({
    queryKey: workspaceRequestTreeQueryKey,
    queryFn: async () => {
      try {
        return await listWorkspaceRequestTree();
      } catch {
        return {
          defaults: {
            collectionId: 'saved-requests',
            requestGroupId: 'general',
            collectionName: 'Saved Requests',
            requestGroupName: 'General',
          },
          collections: [],
          requestGroups: [],
          tree: [],
        };
      }
    },
  });

  useEffect(() => {
    if (savedRequestsQuery.dataUpdatedAt > 0) {
      void queryClient.invalidateQueries({ queryKey: workspaceRequestTreeQueryKey });
    }
  }, [queryClient, savedRequestsQuery.dataUpdatedAt]);

  const defaultRequestPlacement = requestTreeQuery.data?.defaults
    ? createRequestPlacementFields({
        collectionId: requestTreeQuery.data.defaults.collectionId,
        collectionName: requestTreeQuery.data.defaults.collectionName,
        requestGroupId: requestTreeQuery.data.defaults.requestGroupId,
        requestGroupName: requestTreeQuery.data.defaults.requestGroupName,
      })
    : null;

  const setManagerStatus = (
    scope: WorkspaceResourceManagerStatusScope,
    status: WorkspaceResourceManagerStatus | null,
  ) => {
    setManagerStatuses((current) => {
      if (!status) {
        const next = { ...current };
        delete next[scope];
        return next;
      }

      return {
        ...current,
        [scope]: status,
      };
    });
  };

  const exportResourcesMutation = useMutation({
    mutationFn: async () => {
      const bundle = await exportWorkspaceResources();
      downloadAuthoredResourceBundle(bundle);
      return bundle;
    },
    onSuccess: (bundle) => {
      setManagerStatus('transfer', 
        createExportStatusMessage(
          bundle,
          (
            locale === 'ko'
              ? t('workspaceRoute.explorer.status.exportBundleLabel', {
                  requestCount: bundle.requests.length,
                  mockRuleCount: bundle.mockRules.length,
                  scriptCount: bundle.scripts.length,
                })
              : bundle.scripts.length > 0
                ? `${bundle.requests.length} saved request definition${bundle.requests.length === 1 ? '' : 's'}, ${bundle.mockRules.length} mock rule${bundle.mockRules.length === 1 ? '' : 's'}, and ${bundle.scripts.length} saved script${bundle.scripts.length === 1 ? '' : 's'}`
                : `${bundle.requests.length} saved request definition${bundle.requests.length === 1 ? '' : 's'} and ${bundle.mockRules.length} mock rule${bundle.mockRules.length === 1 ? '' : 's'}`
          ),
          t,
        ),
      );
    },
    onError: (error) => {
      setManagerStatus('transfer', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.exportFailed'),
      });
    },
  });

  const exportRequestMutation = useMutation({
    mutationFn: async (request: WorkspaceTreeRequestLeaf) => {
      const bundle = await exportSavedRequestResource(request.id);
      downloadAuthoredResourceBundle(
        bundle,
        `local-request-inspector-${bundle.workspaceId}-${request.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'request'}`,
      );
      return {
        request,
        bundle,
      };
    },
    onSuccess: ({ request, bundle }) => {
      setManagerStatus('saved-request', 
        createExportStatusMessage(
          bundle,
          locale === 'ko'
            ? t('workspaceRoute.explorer.status.exportSavedRequestLabel', { name: request.name })
            : `saved request ${request.name}`,
          t,
        ),
      );
    },
    onError: (error) => {
      setManagerStatus('saved-request', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.exportSingleFailed'),
      });
    },
  });

  const previewResourcesMutation = useMutation({
    mutationFn: async ({ bundleText }: { bundleText: string; fileName: string }) => (
      previewWorkspaceResources(bundleText)
    ),
    onSuccess: (result, variables) => {
      setPendingImportPreview({
        bundleText: variables.bundleText,
        fileName: variables.fileName,
        result,
      });
      setManagerStatus('transfer', createPreviewStatusMessage(variables.fileName, result, t));
    },
    onError: (error) => {
      setPendingImportPreview(null);
      setManagerStatus('transfer', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.fileReadFailed'),
      });
    },
  });

  const importResourcesMutation = useMutation({
    mutationFn: importWorkspaceResources,
    onSuccess: async (result) => {
      setPendingImportPreview(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceRequestTreeQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceSavedRequestsQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceMockRulesQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceScriptsQueryKey }),
      ]);
      setManagerStatus('transfer', createImportStatusMessage(result, t));
    },
    onError: (error) => {
      setManagerStatus('transfer', {
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('workspaceRoute.explorer.status.importFailed'),
      });
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: ({ name }: { name: string }) => createWorkspaceCollection({ name }),
    onSuccess: async (collection) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceRequestTreeQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceSavedRequestsQueryKey }),
      ]);
      setManagerStatus('collections', {
        tone: 'success',
        message: t('workspaceRoute.explorer.status.collectionCreated', { name: collection.name }),
      });
    },
    onError: (error) => {
      setManagerStatus('collections', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.collectionCreateFailed'),
      });
    },
  });

  const renameCollectionMutation = useMutation({
    mutationFn: ({ collectionId, name }: { collectionId: string; name: string }) => (
      updateWorkspaceCollection(collectionId, { name })
    ),
    onSuccess: async (collection) => {
      syncDraftCollectionPlacement(collection.id, {
        collectionId: collection.id,
        collectionName: collection.name,
      });
      syncTabCollectionPlacement(collection.id, {
        collectionId: collection.id,
        collectionName: collection.name,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceRequestTreeQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceSavedRequestsQueryKey }),
      ]);
      setManagerStatus('collections', {
        tone: 'success',
        message: t('workspaceRoute.explorer.status.collectionRenamed', { name: collection.name }),
      });
    },
    onError: (error) => {
      setManagerStatus('collections', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.collectionRenameFailed'),
      });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (collection: WorkspaceCollectionNode) => deleteWorkspaceCollection(collection.collectionId),
    onSuccess: async (_deletedCollectionId, collection) => {
      if (defaultRequestPlacement) {
        syncDraftCollectionPlacement(collection.collectionId, defaultRequestPlacement);
        syncTabCollectionPlacement(collection.collectionId, defaultRequestPlacement);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceRequestTreeQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceSavedRequestsQueryKey }),
      ]);
      setManagerStatus('collections', {
        tone: 'info',
        message: t('workspaceRoute.explorer.status.collectionDeleted', { name: collection.name }),
      });
    },
    onError: (error) => {
      setManagerStatus('collections', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.collectionDeleteFailed'),
      });
    },
  });
  const createRequestGroupMutation = useMutation({
    mutationFn: ({ collectionId, name }: { collectionId: string; name: string }) => (
      createWorkspaceRequestGroup(collectionId, { name })
    ),
    onSuccess: async (requestGroup) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceRequestTreeQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceSavedRequestsQueryKey }),
      ]);
      setManagerStatus('request-groups', {
        tone: 'success',
        message: t('workspaceRoute.explorer.status.requestGroupCreated', { name: requestGroup.name }),
      });
    },
    onError: (error) => {
      setManagerStatus('request-groups', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.requestGroupCreateFailed'),
      });
    },
  });

  const renameRequestGroupMutation = useMutation({
    mutationFn: ({ requestGroupId, name }: { requestGroupId: string; name: string }) => (
      updateWorkspaceRequestGroup(requestGroupId, { name })
    ),
    onSuccess: async (requestGroup) => {
      syncDraftRequestGroupPlacement(requestGroup.id, {
        requestGroupId: requestGroup.id,
        requestGroupName: requestGroup.name,
      });
      syncTabRequestGroupPlacement(requestGroup.id, {
        requestGroupId: requestGroup.id,
        requestGroupName: requestGroup.name,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceRequestTreeQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceSavedRequestsQueryKey }),
      ]);
      setManagerStatus('request-groups', {
        tone: 'success',
        message: t('workspaceRoute.explorer.status.requestGroupRenamed', { name: requestGroup.name }),
      });
    },
    onError: (error) => {
      setManagerStatus('request-groups', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.requestGroupRenameFailed'),
      });
    },
  });

  const deleteRequestGroupMutation = useMutation({
    mutationFn: (requestGroup: WorkspaceRequestGroupNode) => deleteWorkspaceRequestGroup(requestGroup.requestGroupId),
    onSuccess: async (_deletedRequestGroupId, requestGroup) => {
      if (defaultRequestPlacement) {
        syncDraftRequestGroupPlacement(requestGroup.requestGroupId, defaultRequestPlacement);
        syncTabRequestGroupPlacement(requestGroup.requestGroupId, defaultRequestPlacement);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceRequestTreeQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceSavedRequestsQueryKey }),
      ]);
      setManagerStatus('request-groups', {
        tone: 'info',
        message: t('workspaceRoute.explorer.status.requestGroupDeleted', { name: requestGroup.name }),
      });
    },
    onError: (error) => {
      setManagerStatus('request-groups', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.requestGroupDeleteFailed'),
      });
    },
  });
  const deleteSavedRequestMutation = useMutation({
    mutationFn: deleteWorkspaceSavedRequest,
    onSuccess: async (deletedRequestId) => {
      useWorkspaceShellStore.setState((state) => {
        const nextTabs = state.tabs.map((tab) => {
          if (tab.requestId !== deletedRequestId) {
            return tab;
          }

          const nextTab: RequestTabRecord = {
            ...tab,
            source: 'draft',
            sourceKey: `detached-${deletedRequestId}-${tab.id}`,
            hasUnsavedChanges: true,
          };

          delete nextTab.requestId;
          delete nextTab.replaySource;

          return nextTab;
        });
        const activeTab = nextTabs.find((tab) => tab.id === state.activeTabId) ?? null;

        return {
          tabs: nextTabs,
          selectedExplorerItemId: activeTab?.requestId ?? null,
        };
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceRequestTreeQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceSavedRequestsQueryKey }),
      ]);
      queryClient.setQueryData<SavedRequestResourceRecord[]>(
        workspaceSavedRequestsQueryKey,
        (current) => (current ?? []).filter((record) => record.id !== deletedRequestId),
      );
      setManagerStatus('saved-request', {
        tone: 'info',
        message: t('workspaceRoute.explorer.status.requestDeleted'),
      });
    },
    onError: (error) => {
      setManagerStatus('saved-request', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.requestDeleteFailed'),
      });
    },
  });

  const explorerTree = requestTreeQuery.data?.tree?.length
    ? requestTreeQuery.data.tree
    : buildFallbackWorkspaceRequestTree(savedRequestsQuery.data ?? []);
  const requestPlacementOptions = buildRequestPlacementOptions(explorerTree, requestTreeQuery.data?.defaults);
  const resolvedTabs = tabs.map((tab) => resolvePresentationTab(tab, draftsByTabId[tab.id]));
  const activeTab = resolvedTabs.find((tab) => tab.id === activeTabId) ?? null;
  const activeDraft = activeTab ? draftsByTabId[activeTab.id]?.draft ?? null : null;
  const activeSavedRequest = findWorkspaceRequestById(explorerTree, activeTab?.requestId);
  const activeTabKey = activeTab?.id ?? 'empty';
  const pendingReplayRunTabId = useReplayRunStore((state) => state.pendingReplayRunTabId);
  const consumeReplayRun = useReplayRunStore((state) => state.consumeReplayRun);
  const {
    handleRun: handleReplayAutoRun,
    runDisabledReason: replayRunDisabledReason,
    runStatus: replayRunStatus,
  } = useRequestBuilderCommands(activeTab, activeDraft);

  useEffect(() => {
    if (!activeTab || !activeDraft || pendingReplayRunTabId !== activeTab.id) {
      return;
    }

    if (replayRunDisabledReason || replayRunStatus.status === 'pending') {
      return;
    }

    if (!consumeReplayRun(activeTab.id)) {
      return;
    }

    handleReplayAutoRun();
  }, [
    activeDraft,
    activeTab,
    consumeReplayRun,
    handleReplayAutoRun,
    pendingReplayRunTabId,
    replayRunDisabledReason,
    replayRunStatus.status,
  ]);

  const openDraftFromSeed = async (draftSeed?: RequestDraftSeed) => {
    focusWorkspaceWorkSurface();
    setFloatingExplorerOpen('workspace', false);
    const previousTabIds = new Set(useWorkspaceShellStore.getState().tabs.map((tab) => tab.id));
    openNewRequest();
    const nextTab = useWorkspaceShellStore
      .getState()
      .tabs.find((tab) => !previousTabIds.has(tab.id));

    if (nextTab) {
      let defaultEnvironmentId: string | null = null;

      try {
        const environments = await queryClient.ensureQueryData({
          queryKey: workspaceEnvironmentsQueryKey,
          queryFn: listWorkspaceEnvironments,
        });
        defaultEnvironmentId = environments.find((environment) => environment.isDefault)?.id ?? null;
      } catch {
        defaultEnvironmentId = null;
      }

      const defaultPlacement = requestTreeQuery.data?.defaults;
      const seededPlacement = createRequestPlacementFields({
        ...resolveRequestPlacement(draftSeed, defaultPlacement),
        collectionName: draftSeed?.collectionName ?? defaultPlacement?.collectionName ?? 'Saved Requests',
        requestGroupName: readRequestGroupName(draftSeed) ?? defaultPlacement?.requestGroupName ?? DEFAULT_REQUEST_GROUP_NAME,
      });
      ensureDraftForTab(nextTab, {
        ...(draftSeed ?? {}),
        ...seededPlacement,
        selectedEnvironmentId: resolveSeededEnvironmentId(draftSeed, defaultEnvironmentId),
      });
    }
  };

  const handleCreateRequest = () => {
    void openDraftFromSeed();
  };

  const handleCreateCollection = async (name: string) => {
    const nextName = name.trim();

    if (nextName.length === 0) {
      return;
    }

    return createCollectionMutation.mutateAsync({ name: nextName });
  };

  const handleRenameCollection = async (collection: WorkspaceCollectionNode, name: string) => {
    const nextName = name.trim();

    if (nextName.length === 0 || nextName === collection.name) {
      return;
    }

    return renameCollectionMutation.mutateAsync({
      collectionId: collection.collectionId,
      name: nextName,
    });
  };

  const handleDeleteCollection = async (collection: WorkspaceCollectionNode) => {
    await deleteCollectionMutation.mutateAsync(collection);
  };
  const handleCreateRequestGroup = async (collection: WorkspaceCollectionNode, name: string) => {
    const nextName = name.trim();

    if (nextName.length === 0) {
      return;
    }

    return createRequestGroupMutation.mutateAsync({
      collectionId: collection.collectionId,
      name: nextName,
    });
  };

  const handleRenameRequestGroup = async (requestGroup: WorkspaceRequestGroupNode, name: string) => {
    const nextName = name.trim();

    if (nextName.length === 0 || nextName === requestGroup.name) {
      return;
    }

    return renameRequestGroupMutation.mutateAsync({
      requestGroupId: requestGroup.requestGroupId,
      name: nextName,
    });
  };

  const handleDeleteRequestGroup = async (requestGroup: WorkspaceRequestGroupNode) => {
    await deleteRequestGroupMutation.mutateAsync(requestGroup);
  };

  const handleOpenSavedRequest = async (request: WorkspaceTreeRequestLeaf) => {
    focusWorkspaceWorkSurface();
    setFloatingExplorerOpen('workspace', false);
    const existingTab = useWorkspaceShellStore
      .getState()
      .tabs.find((tab) => tab.sourceKey === `saved-${request.id}`);

    openSavedRequest({
      id: request.id,
      name: request.name,
      methodLabel: request.methodLabel,
      summary: request.summary,
      collectionName: request.collectionName,
      ...createRequestPlacementFields(request),
    });

    if (existingTab) {
      return;
    }

    const nextTab = useWorkspaceShellStore
      .getState()
      .tabs.find((tab) => tab.sourceKey === `saved-${request.id}`);

    if (nextTab) {
      const savedRecord = await readWorkspaceSavedRequestDetail(request.id);
      ensureDraftForTab(nextTab, {
        name: savedRecord.name,
        method: savedRecord.method,
        url: savedRecord.url,
        selectedEnvironmentId: savedRecord.selectedEnvironmentId ?? null,
        params: savedRecord.params,
        headers: savedRecord.headers,
        bodyMode: savedRecord.bodyMode,
        bodyText: savedRecord.bodyText,
        formBody: savedRecord.formBody,
        multipartBody: savedRecord.multipartBody,
        auth: savedRecord.auth,
        scripts: savedRecord.scripts,
        ...createRequestPlacementFields(savedRecord),
      });
    }
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    focusWorkspaceWorkSurface();
  };

  const handleCloseTab = (tabId: string) => {
    removeDraft(tabId);
    removeCommandState(tabId);
    closeTab(tabId);
  };

  const handleImportResources = async (file: File) => {
    try {
      setPendingImportPreview(null);
      setManagerStatus('transfer', {
        tone: 'info',
        message: t('workspaceRoute.explorer.status.previewingFile', { fileName: file.name }),
      });
      const bundleText = await file.text();
      previewResourcesMutation.mutate({
        bundleText,
        fileName: file.name,
      });
    } catch (error) {
      setPendingImportPreview(null);
      setManagerStatus('transfer', {
        tone: 'error',
        message: error instanceof Error ? error.message : t('workspaceRoute.explorer.status.fileReadFailed'),
      });
    }
  };

  const handleConfirmImportPreview = () => {
    if (!pendingImportPreview) {
      return;
    }

    setManagerStatus('transfer', {
      tone: 'info',
      message: t('workspaceRoute.explorer.status.importStarting', { fileName: pendingImportPreview.fileName }),
      details: createImportSummaryDetails(pendingImportPreview.result.summary, t),
    });
    importResourcesMutation.mutate(pendingImportPreview.bundleText);
  };

  const handleCancelImportPreview = () => {
    setPendingImportPreview(null);
    setManagerStatus('transfer', {
      tone: 'info',
      message: t('workspaceRoute.explorer.status.importCleared'),
    });
  };

  return (
    <RoutePanelTabsLayout
      layoutMode="floating-explorer"
      floatingExplorerRouteKey="workspace"
      floatingExplorerVariant="focused-overlay"
      defaultActiveTab="main"
      activeTab={workspaceActivePanel}
      onActiveTabChange={(panel) => setWorkspaceActivePanel('workspace', panel)}
      explorer={(
        <section className="shell-panel shell-panel--sidebar" aria-label={t('shell.routePanels.explorerRegion')}>
        <WorkspaceExplorer
          tree={explorerTree}
          selectedRequestId={selectedExplorerItemId}
          onOpenSavedRequest={handleOpenSavedRequest}
        />
        </section>
      )}
      main={(
        <section className="shell-panel shell-panel--main" aria-label={t('shell.routePanels.mainRegion')}>
        <SectionHeading
            icon="workspace"
            title={t('routes.workspace.title')}
            summary={t('routes.workspace.summary')}
          >
            <div className="workspace-explorer__role-strip" aria-label="Workspace surface role">
              <span className="workspace-chip">{t('roles.authoring')}</span>
              <span className="workspace-chip workspace-chip--secondary">{t('routes.workspace.contextChip')}</span>
            </div>
          </SectionHeading>

        <RequestTabShell
          tabs={resolvedTabs}
          activeTabId={activeTabId}
          onCreateRequest={handleCreateRequest}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />

        <WorkspaceResourceManagerPanel
          tree={explorerTree}
          activeTab={activeTab}
          activeDraft={activeDraft}
          activeSavedRequest={activeSavedRequest}
          onCreateCollection={handleCreateCollection}
          onRenameCollection={handleRenameCollection}
          onDeleteCollection={handleDeleteCollection}
          onCreateRequestGroup={handleCreateRequestGroup}
          onRenameRequestGroup={handleRenameRequestGroup}
          onDeleteRequestGroup={handleDeleteRequestGroup}
          onExportRequest={(request) => exportRequestMutation.mutate(request)}
          onDeleteRequest={(request) => deleteSavedRequestMutation.mutate(request.id)}
          onExportResources={() => exportResourcesMutation.mutate()}
          onImportResources={handleImportResources}
          importPreview={pendingImportPreview}
          onConfirmImportPreview={handleConfirmImportPreview}
          onCancelImportPreview={handleCancelImportPreview}
          statuses={managerStatuses}
          isExporting={exportResourcesMutation.isPending || exportRequestMutation.isPending}
          isPreviewingImport={previewResourcesMutation.isPending}
          isImporting={importResourcesMutation.isPending}
          isDeletingRequest={deleteSavedRequestMutation.isPending}
          isCreatingCollection={createCollectionMutation.isPending}
          isRenamingCollection={renameCollectionMutation.isPending}
          isDeletingCollection={deleteCollectionMutation.isPending}
          isCreatingRequestGroup={createRequestGroupMutation.isPending}
          isRenamingRequestGroup={renameRequestGroupMutation.isPending}
          isDeletingRequestGroup={deleteRequestGroupMutation.isPending}
        />

        <RequestWorkSurfacePlaceholder
          key={`work-${activeTabKey}`}
          activeTab={activeTab}
          onCreateRequest={handleCreateRequest}
          placementOptions={requestPlacementOptions}
        />
        </section>
      )}
      detail={(
        <aside className="shell-panel shell-panel--detail" aria-label={t('shell.routePanels.detailRegion')}>
        <RequestResultPanelPlaceholder key={`detail-${activeTabKey}`} activeTab={activeTab} />
        </aside>
      )}
    />
  );
}














