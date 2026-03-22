import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  listWorkspaceEnvironments,
  workspaceEnvironmentsQueryKey,
} from '@client/features/environments/environment.api';
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
import { SectionHeading } from '@client/shared/ui/SectionHeading';
import { buildWorkspaceExplorerTree } from '@client/features/workspace/data/workspace-explorer-data';
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
import type { WorkspaceSavedRequestSeed } from '@client/features/workspace/data/workspace-explorer-fixtures';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';

interface ResourceTransferStatus {
  tone: 'success' | 'error' | 'info';
  message: string;
  details?: string[];
}

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

function createImportStatusMessage(result: AuthoredResourceBundleImportResult) {
  const details = createImportSummaryDetails(result.summary);
  const {
    acceptedCount,
    rejectedCount,
  } = result.summary;
  const acceptedSummary = `${acceptedCount} authored resource${acceptedCount === 1 ? '' : 's'} imported`;

  if (rejectedCount === 0) {
    return {
      tone: 'success' as const,
      message: `${acceptedSummary}. Imported resources received new identities so existing saved resources were not overwritten.`,
      details,
    };
  }

  return {
    tone: acceptedCount === 0 ? 'error' as const : 'info' as const,
    message: `${acceptedSummary}. ${rejectedCount} resource${rejectedCount === 1 ? '' : 's'} were rejected during validation and left unchanged.`,
    details,
  };
}

function createImportSummaryDetails(summary: AuthoredResourceBundleImportResult['summary']) {
  const {
    createdRequestCount,
    createdMockRuleCount,
    renamedCount,
    importedNamesPreview,
    rejectedReasonSummary,
    rejectedCount,
  } = summary;
  const details = [
    `Created requests: ${createdRequestCount}`,
    `Created mock rules: ${createdMockRuleCount}`,
    `Renamed on import: ${renamedCount}`,
    `Rejected during validation: ${rejectedCount}`,
  ];

  if (importedNamesPreview.length > 0) {
    details.push(`Imported preview: ${importedNamesPreview.join(', ')}`);
  }

  if (rejectedReasonSummary.length > 0) {
    details.push(`Rejected reasons: ${rejectedReasonSummary.map((entry) => `${entry.reason} (${entry.count})`).join(' · ')}`);
  }

  return details;
}

function createPreviewStatusMessage(fileName: string, result: AuthoredResourceBundleImportPreviewResult) {
  const details = createImportSummaryDetails(result.summary);
  const {
    acceptedCount,
    rejectedCount,
  } = result.summary;

  if (acceptedCount === 0) {
    if (rejectedCount === 0) {
      return {
        tone: 'error' as const,
        message: `Preview found no saved-request or mock-rule resources in ${fileName}. Nothing will be written until you choose a bundle with authored resources.`,
        details,
      };
    }

    return {
      tone: 'error' as const,
      message: `Preview found no importable authored resources in ${fileName}. ${rejectedCount} resource${rejectedCount === 1 ? '' : 's'} would be rejected and nothing will be written until you choose a different bundle.`,
      details,
    };
  }

  const acceptedSummary = `${acceptedCount} authored resource${acceptedCount === 1 ? '' : 's'}`;

  if (rejectedCount === 0) {
    return {
      tone: 'info' as const,
      message: `Preview ready for ${fileName}. Confirm import to write ${acceptedSummary} with new identities.`,
      details,
    };
  }

  return {
    tone: 'info' as const,
    message: `Preview ready for ${fileName}. Confirm import to write ${acceptedSummary}; ${rejectedCount} resource${rejectedCount === 1 ? '' : 's'} would still be rejected and left unchanged.`,
    details,
  };
}

function createExportStatusMessage(bundle: AuthoredResourceBundleExport, label: string) {
  return {
    tone: 'success' as const,
    message: `Exported ${label} from the authored resource lane.`,
    details: [
      `Saved requests in bundle: ${bundle.requests.length}`,
      `Mock rules in bundle: ${bundle.mockRules.length}`,
      'Runtime history, captures, and execution artifacts remain excluded.',
    ],
  };
}

function resolveSeededEnvironmentId(draftSeed: RequestDraftSeed | undefined, defaultEnvironmentId: string | null) {
  if (draftSeed && 'selectedEnvironmentId' in draftSeed) {
    return draftSeed.selectedEnvironmentId ?? null;
  }

  return defaultEnvironmentId;
}

export function WorkspacePlaceholder() {
  const queryClient = useQueryClient();
  const [resourceTransferStatus, setResourceTransferStatus] = useState<ResourceTransferStatus | null>(null);
  const [pendingImportPreview, setPendingImportPreview] = useState<PendingImportPreview | null>(null);
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
      setResourceTransferStatus(createExportStatusMessage(
        bundle,
        `${bundle.requests.length} saved request definition${bundle.requests.length === 1 ? '' : 's'} and ${bundle.mockRules.length} mock rule${bundle.mockRules.length === 1 ? '' : 's'}`,
      ));
    },
    onError: (error) => {
      setResourceTransferStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Resource export failed before a bundle could be downloaded.',
      });
    },
  });

  const exportRequestMutation = useMutation({
    mutationFn: async (request: WorkspaceSavedRequestSeed) => {
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
      setResourceTransferStatus(createExportStatusMessage(bundle, `saved request ${request.name}`));
    },
    onError: (error) => {
      setResourceTransferStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Saved request export failed before a bundle could be downloaded.',
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
      setResourceTransferStatus(createPreviewStatusMessage(variables.fileName, result));
    },
    onError: (error) => {
      setPendingImportPreview(null);
      setResourceTransferStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Import preview failed before any authored resources were written.',
      });
    },
  });

  const importResourcesMutation = useMutation({
    mutationFn: importWorkspaceResources,
    onSuccess: async (result) => {
      setPendingImportPreview(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceSavedRequestsQueryKey }),
        queryClient.invalidateQueries({ queryKey: workspaceMockRulesQueryKey }),
      ]);
      setResourceTransferStatus(createImportStatusMessage(result));
    },
    onError: (error) => {
      setResourceTransferStatus({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : 'Resource import failed before the authored-resource transfer completed. Already-written resources, if any, were not rolled back automatically.',
      });
    },
  });

  const explorerTree = buildWorkspaceExplorerTree(savedRequestsQuery.data ?? []);
  const resolvedTabs = tabs.map((tab) => resolvePresentationTab(tab, draftsByTabId[tab.id]));
  const activeTab = resolvedTabs.find((tab) => tab.id === activeTabId) ?? null;
  const activeTabKey = activeTab?.id ?? 'empty';

  const openDraftFromSeed = async (draftSeed?: RequestDraftSeed) => {
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

      ensureDraftForTab(nextTab, {
        ...(draftSeed ?? {}),
        selectedEnvironmentId: resolveSeededEnvironmentId(draftSeed, defaultEnvironmentId),
      });
    }
  };

  const handleCreateRequest = () => {
    void openDraftFromSeed();
  };

  const handleOpenSavedRequest = (request: WorkspaceSavedRequestSeed) => {
    if (request.resourceKind === 'starter') {
      void openDraftFromSeed({
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
      setPendingImportPreview(null);
      setResourceTransferStatus({
        tone: 'info',
        message: `Previewing authored resources from ${file.name}. No changes will be written until you confirm import.`,
      });
      const bundleText = await file.text();
      previewResourcesMutation.mutate({
        bundleText,
        fileName: file.name,
      });
    } catch (error) {
      setPendingImportPreview(null);
      setResourceTransferStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Selected file could not be read for import.',
      });
    }
  };

  const handleConfirmImportPreview = () => {
    if (!pendingImportPreview) {
      return;
    }

    setResourceTransferStatus({
      tone: 'info',
      message: `Importing authored resources from ${pendingImportPreview.fileName}. Preview remains advisory until the write completes.`,
      details: createImportSummaryDetails(pendingImportPreview.result.summary),
    });
    importResourcesMutation.mutate(pendingImportPreview.bundleText);
  };

  const handleCancelImportPreview = () => {
    setPendingImportPreview(null);
    setResourceTransferStatus({
      tone: 'info',
      message: 'Import preview cleared. No authored resources were written.',
    });
  };

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <WorkspaceExplorer
          tree={explorerTree}
          selectedRequestId={selectedExplorerItemId}
          onCreateRequest={handleCreateRequest}
          onOpenSavedRequest={handleOpenSavedRequest}
          onExportRequest={(request) => exportRequestMutation.mutate(request)}
          onExportResources={() => exportResourcesMutation.mutate()}
          onImportResources={handleImportResources}
          importPreview={pendingImportPreview}
          onConfirmImportPreview={handleConfirmImportPreview}
          onCancelImportPreview={handleCancelImportPreview}
          transferStatusMessage={resourceTransferStatus?.message ?? null}
          transferStatusDetails={resourceTransferStatus?.details}
          transferStatusTone={resourceTransferStatus?.tone}
          isExporting={exportResourcesMutation.isPending || exportRequestMutation.isPending}
          isPreviewingImport={previewResourcesMutation.isPending}
          isImporting={importResourcesMutation.isPending}
        />
      </section>

      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <SectionHeading
          icon="workspace"
          title="Workspace"
          summary="Workspace remains the authoring surface for saved requests, starter request drafts, replay drafts, and the lazy-loaded Scripts path. Save updates request definitions, while Run writes observation only into the right-hand result surface."
        >
          <div className="workspace-explorer__role-strip" aria-label="Workspace surface role">
            <span className="workspace-chip">Authoring</span>
            <span className="workspace-chip workspace-chip--secondary">Resource lane</span>
          </div>
        </SectionHeading>

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
