import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  listWorkspaceSavedRequests,
  workspaceSavedRequestsQueryKey,
} from '@client/features/request-builder/request-builder.api';
import { RequestResultPanelPlaceholder } from '@client/features/request-builder/components/RequestResultPanelPlaceholder';
import { RequestTabShell } from '@client/features/request-builder/components/RequestTabShell';
import { RequestWorkSurfacePlaceholder } from '@client/features/request-builder/components/RequestWorkSurfacePlaceholder';
import { useRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import type { RequestDraftSeed } from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { workspaceMockRulesQueryKey } from '@client/features/mocks/mock-rules.api';
import { WorkspaceExplorer } from '@client/features/workspace/components/WorkspaceExplorer';
import { buildWorkspaceExplorerTree } from '@client/features/workspace/data/workspace-explorer-data';
import { exportWorkspaceResources, importWorkspaceResources, type AuthoredResourceBundleExport, type AuthoredResourceBundleImportResult } from '@client/features/workspace/resource-bundle.api';
import type { WorkspaceSavedRequestSeed } from '@client/features/workspace/data/workspace-explorer-fixtures';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';

interface ResourceTransferStatus {
  tone: 'success' | 'error' | 'info';
  message: string;
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

function downloadAuthoredResourceBundle(bundle: AuthoredResourceBundleExport) {
  if (typeof URL.createObjectURL !== 'function') {
    throw new Error('Browser download APIs are unavailable for resource export.');
  }

  const objectUrl = URL.createObjectURL(
    new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
  );

  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `local-request-inspector-${bundle.workspaceId}-resources-${bundle.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function createImportStatusMessage(result: AuthoredResourceBundleImportResult) {
  const acceptedCount = result.acceptedRequests.length + result.acceptedMockRules.length;
  const rejectedCount = result.rejected.length;
  const acceptedSummary = `${acceptedCount} authored resource${acceptedCount === 1 ? '' : 's'} imported`;

  if (rejectedCount === 0) {
    return {
      tone: 'success' as const,
      message: `${acceptedSummary}. Imported resources received new identities so existing saved resources were not overwritten.`,
    };
  }

  return {
    tone: 'info' as const,
    message: `${acceptedSummary}. ${rejectedCount} resource${rejectedCount === 1 ? '' : 's'} were rejected during validation and left unchanged.`,
  };
}

export function WorkspacePlaceholder() {
  const queryClient = useQueryClient();
  const [resourceTransferStatus, setResourceTransferStatus] = useState<ResourceTransferStatus | null>(null);
  const tabs = useWorkspaceShellStore((state) => state.tabs);
  const activeTabId = useWorkspaceShellStore((state) => state.activeTabId);
  const selectedExplorerItemId = useWorkspaceShellStore((state) => state.selectedExplorerItemId);
  const openNewRequest = useWorkspaceShellStore((state) => state.openNewRequest);
  const openSavedRequest = useWorkspaceShellStore((state) => state.openSavedRequest);
  const setActiveTab = useWorkspaceShellStore((state) => state.setActiveTab);
  const closeTab = useWorkspaceShellStore((state) => state.closeTab);
  const draftsByTabId = useRequestDraftStore((state) => state.draftsByTabId);
  const ensureDraftForTab = useRequestDraftStore((state) => state.ensureDraftForTab);
  const removeDraft = useRequestDraftStore((state) => state.removeDraft);
  const removeCommandState = useRequestCommandStore((state) => state.removeTab);

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

  const exportResourcesMutation = useMutation({
    mutationFn: async () => {
      const bundle = await exportWorkspaceResources();
      downloadAuthoredResourceBundle(bundle);
      return bundle;
    },
    onSuccess: (bundle) => {
      setResourceTransferStatus({
        tone: 'success',
        message: `Exported ${bundle.requests.length} saved request definition${bundle.requests.length === 1 ? '' : 's'} and ${bundle.mockRules.length} mock rule${bundle.mockRules.length === 1 ? '' : 's'} from the resource lane.`,
      });
    },
    onError: (error) => {
      setResourceTransferStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Resource export failed before a bundle could be downloaded.',
      });
    },
  });

  const importResourcesMutation = useMutation({
    mutationFn: importWorkspaceResources,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceSavedRequestsQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceMockRulesQueryKey }),
      ]);
      setResourceTransferStatus(createImportStatusMessage(result));
    },
    onError: (error) => {
      setResourceTransferStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Resource import failed before any authored resources were stored.',
      });
    },
  });

  const explorerTree = buildWorkspaceExplorerTree(savedRequestsQuery.data ?? []);
  const resolvedTabs = tabs.map((tab) => resolvePresentationTab(tab, draftsByTabId[tab.id]));
  const activeTab = resolvedTabs.find((tab) => tab.id === activeTabId) ?? null;
  const activeTabKey = activeTab?.id ?? 'empty';

  const openDraftFromSeed = (draftSeed?: RequestDraftSeed) => {
    const previousTabIds = new Set(useWorkspaceShellStore.getState().tabs.map((tab) => tab.id));
    openNewRequest();
    const nextTab = useWorkspaceShellStore
      .getState()
      .tabs.find((tab) => !previousTabIds.has(tab.id));

    if (nextTab) {
      ensureDraftForTab(nextTab, draftSeed);
    }
  };

  const handleCreateRequest = () => {
    openDraftFromSeed();
  };

  const handleOpenSavedRequest = (request: WorkspaceSavedRequestSeed) => {
    if (request.resourceKind === 'starter') {
      openDraftFromSeed({
        name: request.name,
        method: request.methodLabel,
        ...(request.draftSeed ?? {}),
        collectionName: request.collectionName,
        ...(request.folderName ? { folderName: request.folderName } : {}),
      });
      return;
    }

    const existingTab = useWorkspaceShellStore
      .getState()
      .tabs.find((tab) => tab.sourceKey === `saved-${request.id}`);

    openSavedRequest(request);

    if (existingTab) {
      ensureDraftForTab(existingTab, request.draftSeed);
      return;
    }

    const nextTab = useWorkspaceShellStore
      .getState()
      .tabs.find((tab) => tab.sourceKey === `saved-${request.id}`);

    if (nextTab) {
      ensureDraftForTab(nextTab, request.draftSeed);
    }
  };

  const handleCloseTab = (tabId: string) => {
    removeDraft(tabId);
    removeCommandState(tabId);
    closeTab(tabId);
  };

  const handleImportResources = async (file: File) => {
    try {
      setResourceTransferStatus({
        tone: 'info',
        message: `Importing authored resources from ${file.name}. Existing saved resources will keep their identities.`,
      });
      const bundleText = await file.text();
      importResourcesMutation.mutate(bundleText);
    } catch (error) {
      setResourceTransferStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Selected file could not be read for import.',
      });
    }
  };

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <WorkspaceExplorer
          tree={explorerTree}
          selectedRequestId={selectedExplorerItemId}
          onCreateRequest={handleCreateRequest}
          onOpenSavedRequest={handleOpenSavedRequest}
          onExportResources={() => exportResourcesMutation.mutate()}
          onImportResources={handleImportResources}
          transferStatusMessage={resourceTransferStatus?.message ?? null}
          transferStatusTone={resourceTransferStatus?.tone}
          isExporting={exportResourcesMutation.isPending}
          isImporting={importResourcesMutation.isPending}
        />
      </section>

      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <header className="section-placeholder__header">
          <p className="section-placeholder__eyebrow">Top-level section</p>
          <h1>Workspace</h1>
          <p>
            Workspace remains the authoring surface for saved requests, starter request drafts, replay drafts, and the lazy-loaded Scripts path. Save updates request definitions, while Run writes observation only into the right-hand result surface.
          </p>
        </header>

        <RequestTabShell
          tabs={resolvedTabs}
          activeTabId={activeTabId}
          onCreateRequest={handleCreateRequest}
          onSelectTab={setActiveTab}
          onCloseTab={handleCloseTab}
        />

        <RequestWorkSurfacePlaceholder
          key={`work-${activeTabKey}`}
          activeTab={activeTab}
          onCreateRequest={handleCreateRequest}
        />
      </section>

      <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
        <RequestResultPanelPlaceholder key={`detail-${activeTabKey}`} activeTab={activeTab} />
      </aside>
    </>
  );
}
