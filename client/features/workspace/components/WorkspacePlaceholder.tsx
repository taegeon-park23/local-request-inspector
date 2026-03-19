import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { RequestResultPanelPlaceholder } from '@client/features/request-builder/components/RequestResultPanelPlaceholder';
import { RequestTabShell } from '@client/features/request-builder/components/RequestTabShell';
import type { SavedWorkspaceRequestSeed, RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { workspaceExplorerTree } from '@client/features/workspace/data/workspace-explorer-fixtures';
import { WorkspaceExplorer } from '@client/features/workspace/components/WorkspaceExplorer';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';
import { RequestWorkSurfacePlaceholder } from '@client/features/request-builder/components/RequestWorkSurfacePlaceholder';

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

export function WorkspacePlaceholder() {
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

  const resolvedTabs = tabs.map((tab) => resolvePresentationTab(tab, draftsByTabId[tab.id]));
  const activeTab = resolvedTabs.find((tab) => tab.id === activeTabId) ?? null;
  const activeTabKey = activeTab?.id ?? 'empty';

  const handleCreateRequest = () => {
    const previousTabIds = new Set(useWorkspaceShellStore.getState().tabs.map((tab) => tab.id));
    openNewRequest();
    const nextTab = useWorkspaceShellStore
      .getState()
      .tabs.find((tab) => !previousTabIds.has(tab.id));

    if (nextTab) {
      ensureDraftForTab(nextTab);
    }
  };

  const handleOpenSavedRequest = (request: SavedWorkspaceRequestSeed) => {
    const existingTab = useWorkspaceShellStore
      .getState()
      .tabs.find((tab) => tab.sourceKey === `saved-${request.id}`);

    openSavedRequest(request);

    if (existingTab) {
      ensureDraftForTab(existingTab);
      return;
    }

    const nextTab = useWorkspaceShellStore
      .getState()
      .tabs.find((tab) => tab.sourceKey === `saved-${request.id}`);

    if (nextTab) {
      ensureDraftForTab(nextTab);
    }
  };

  const handleCloseTab = (tabId: string) => {
    removeDraft(tabId);
    closeTab(tabId);
  };

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <WorkspaceExplorer
          tree={workspaceExplorerTree}
          selectedRequestId={selectedExplorerItemId}
          onCreateRequest={handleCreateRequest}
          onOpenSavedRequest={handleOpenSavedRequest}
        />
      </section>

      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <header className="section-placeholder__header">
          <p className="section-placeholder__eyebrow">Top-level section</p>
          <h1>Workspace</h1>
          <p>
            S3 replaces the request builder placeholder with core authoring UI while keeping the route model light and observation panel separate.
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
