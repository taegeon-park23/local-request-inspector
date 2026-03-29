import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  listWorkspaceEnvironments,
  workspaceEnvironmentsQueryKey,
} from '@client/features/environments/environment.api';
import { workspaceScriptsQueryKey } from '@client/features/scripts/scripts.api';
import { executionHistoryListQueryKey } from '@client/features/history/history.api';
import {
  DEFAULT_REQUEST_COLLECTION_NAME,
  listWorkspaceSavedRequests,
  type SavedRequestResourceRecord,
  workspaceSavedRequestsQueryKey,
} from '@client/features/request-builder/request-builder.api';
import { WorkspaceContextPanel } from '@client/features/workspace/components/WorkspaceContextPanel';
import { useI18n } from '@client/app/providers/useI18n';
import { RequestTabShell } from '@client/features/request-builder/components/RequestTabShell';
import { RequestWorkSurface } from '@client/features/request-builder/components/RequestWorkSurface';
import {
  createRequestPlacementFields,
  DEFAULT_REQUEST_GROUP_NAME,
  readRequestGroupName,
  resolveRequestPlacement,
  type RequestPlacementCollectionOption,
  type RequestPlacementValue,
} from '@client/features/request-builder/request-placement';
import { useRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import type { RequestDraftSeed } from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { workspaceMockRulesQueryKey } from '@client/features/mocks/mock-rules.api';
import { WorkspaceExplorer } from '@client/features/workspace/components/WorkspaceExplorer';
import {
  WorkspaceCreateSheet,
  type CreateSheetTarget,
  type CreateType,
} from '@client/features/workspace/components/WorkspaceCreateSheet';
import { WorkspaceHeaderActions } from '@client/features/workspace/components/WorkspaceHeaderActions';
import { WorkspaceRunnerPanel } from '@client/features/workspace/components/WorkspaceRunnerPanel';
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
  createWorkspaceCollection,
  createWorkspaceRequestGroup,
  deleteWorkspaceCollection,
  deleteWorkspaceRequestGroup,
  deleteWorkspaceSavedRequest,
  listWorkspaceRequestTree,
  readWorkspaceSavedRequestDetail,
  runWorkspaceCollection,
  runWorkspaceRequestGroup,
  updateWorkspaceCollection,
  updateWorkspaceRequestGroup,
  workspaceRequestTreeQueryKey,
  type WorkspaceBatchRunInput,
  type WorkspaceCollectionNode,
  type WorkspaceRequestGroupNode,
  type WorkspaceTreeRequestLeaf,
} from '@client/features/workspace/workspace-request-tree.api';
import {
  CurlImportParseError,
  parseCurlCommandToDraftSeed,
} from '@client/features/workspace/curl-import';
import { useWorkspaceBatchRunStore } from '@client/features/workspace/state/workspace-batch-run-store';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';
import { useWorkspaceUiStore } from '@client/features/workspace/state/workspace-ui-store';
import { RoutePanelTabsLayout } from '@client/features/route-panel-tabs-layout';
import { useShellStore } from '@client/app/providers/shell-store';
import {
  isBackendUnavailableApiError,
  resolveApiErrorMessage,
} from '@client/shared/api-error-message';

type WorkspaceResourceManagerStatuses = Partial<Record<WorkspaceResourceManagerStatusScope, WorkspaceResourceManagerStatus>>;

interface PendingImportPreview {
  bundleText: string;
  fileName: string;
  result: AuthoredResourceBundleImportPreviewResult;
}

interface CreateSheetState {
  defaultType: CreateType;
  target: CreateSheetTarget;
}


const RUNNER_ENVIRONMENT_INHERIT = '__inherit__';
const RUNNER_ENVIRONMENT_NONE = '__none__';
const RUNNER_DEFAULT_EXECUTION_ORDER: NonNullable<WorkspaceBatchRunInput['executionOrder']> = 'depth-first-sequential';
const RUNNER_MAX_ITERATION_COUNT = 25;

function resolveWorkspaceErrorMessage(
  error: unknown,
  fallbackMessage: string,
  t: ReturnType<typeof useI18n>['t'],
) {
  return resolveApiErrorMessage(error, fallbackMessage, t);
}

interface WorkspaceRunnerContainerSelection {
  containerType: 'collection' | 'request-group';
  containerId: string;
  containerName: string;
  requests: WorkspaceTreeRequestLeaf[];
}

interface WorkspaceRunnerConfigState {
  containerKey: string;
  executionOrder: NonNullable<WorkspaceBatchRunInput['executionOrder']>;
  continueOnError: boolean;
  iterationInput: string;
  dataFilePath: string;
  environmentSelection: string;
  selectedRequestIds: string[];
}

function collectRequestLeavesDepthFirst(
  requestGroups: WorkspaceRequestGroupNode[],
  collected: WorkspaceTreeRequestLeaf[] = [],
): WorkspaceTreeRequestLeaf[] {
  for (const requestGroup of requestGroups) {
    collectRequestLeavesDepthFirst(requestGroup.childGroups, collected);

    for (const requestNode of requestGroup.requests) {
      collected.push(requestNode.request);
    }
  }

  return collected;
}

function createRunnerContainerSelection(
  selectedCollection: WorkspaceCollectionNode | null,
  selectedRequestGroupLocation: { collection: WorkspaceCollectionNode; requestGroup: WorkspaceRequestGroupNode } | null,
): WorkspaceRunnerContainerSelection | null {
  if (selectedRequestGroupLocation) {
    return {
      containerType: 'request-group',
      containerId: selectedRequestGroupLocation.requestGroup.requestGroupId,
      containerName: selectedRequestGroupLocation.requestGroup.name,
      requests: collectRequestLeavesDepthFirst([selectedRequestGroupLocation.requestGroup], []),
    };
  }

  if (selectedCollection) {
    return {
      containerType: 'collection',
      containerId: selectedCollection.collectionId,
      containerName: selectedCollection.name,
      requests: collectRequestLeavesDepthFirst(selectedCollection.childGroups, []),
    };
  }

  return null;
}

function normalizeRunnerIterationCount(rawValue: string) {
  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, RUNNER_MAX_ITERATION_COUNT);
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

function createExportCountLabel(
  count: number,
  singularKey: Parameters<ReturnType<typeof useI18n>['t']>[0],
  pluralKey: Parameters<ReturnType<typeof useI18n>['t']>[0],
  t: ReturnType<typeof useI18n>['t'],
) {
  return t(count === 1 ? singularKey : pluralKey, { count });
}

function createBundleExportLabel(
  bundle: AuthoredResourceBundleExport,
  t: ReturnType<typeof useI18n>['t'],
) {
  const requestLabel = createExportCountLabel(
    bundle.requests.length,
    'workspaceRoute.explorer.status.exportBundleRequestLabelSingular',
    'workspaceRoute.explorer.status.exportBundleRequestLabelPlural',
    t,
  );
  const mockRuleLabel = createExportCountLabel(
    bundle.mockRules.length,
    'workspaceRoute.explorer.status.exportBundleMockRuleLabelSingular',
    'workspaceRoute.explorer.status.exportBundleMockRuleLabelPlural',
    t,
  );

  if (bundle.scripts.length === 0) {
    return t('workspaceRoute.explorer.status.exportBundleLabelWithoutScripts', {
      requestLabel,
      mockRuleLabel,
    });
  }

  const scriptLabel = createExportCountLabel(
    bundle.scripts.length,
    'workspaceRoute.explorer.status.exportBundleScriptLabelSingular',
    'workspaceRoute.explorer.status.exportBundleScriptLabelPlural',
    t,
  );

  return t('workspaceRoute.explorer.status.exportBundleLabelWithScripts', {
    requestLabel,
    mockRuleLabel,
    scriptLabel,
  });
}

function resolveSeededEnvironmentId(draftSeed: RequestDraftSeed | undefined, defaultEnvironmentId: string | null) {
  if (draftSeed && 'selectedEnvironmentId' in draftSeed) {
    return draftSeed.selectedEnvironmentId ?? null;
  }

  return defaultEnvironmentId;
}

function findCollectionById(
  tree: WorkspaceCollectionNode[],
  collectionId: string | null | undefined,
) {
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

      const match = walk(collection, requestGroup.childGroups);
      if (match) {
        return match;
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

function isEditableEventTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable
    || tagName === 'input'
    || tagName === 'textarea'
    || tagName === 'select';
}

function flattenRequestGroups(
  groups: WorkspaceRequestGroupNode[],
  path: string[] = [],
): RequestPlacementCollectionOption['requestGroups'] {
  return groups.flatMap((requestGroup) => {
    const nextPath = [...path, requestGroup.name];

    return [
      {
        requestGroupId: requestGroup.requestGroupId,
        requestGroupName: requestGroup.name,
        requestGroupPathLabel: nextPath.join(' / '),
      },
      ...flattenRequestGroups(requestGroup.childGroups, nextPath),
    ];
  });
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
    return tree.map((collection) => {
      const requestGroups = flattenRequestGroups(collection.childGroups);

      return {
        collectionId: collection.collectionId,
        collectionName: collection.name,
        requestGroups: requestGroups.length > 0
          ? requestGroups
          : [{
              requestGroupName: defaults?.requestGroupName ?? DEFAULT_REQUEST_GROUP_NAME,
              pendingCreation: true,
            }],
      };
    });
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
      requestGroupPathLabel: defaults.requestGroupName,
    }],
  }];
}

function findWorkspaceRequestById(
  tree: WorkspaceCollectionNode[],
  requestId: string | null | undefined,
): WorkspaceTreeRequestLeaf | null {
  if (!requestId) {
    return null;
  }

  function walk(groups: WorkspaceRequestGroupNode[]): WorkspaceTreeRequestLeaf | null {
    for (const requestGroup of groups) {
      const requestNode = requestGroup.requests.find((child) => child.request.id === requestId);

      if (requestNode) {
        return requestNode.request;
      }

      const childMatch = walk(requestGroup.childGroups);
      if (childMatch) {
        return childMatch;
      }
    }

    return null;
  }

  for (const collection of tree) {
    const match = walk(collection.childGroups);
    if (match) {
      return match;
    }
  }

  return null;
}

export function WorkspaceRoute() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [managerStatuses, setManagerStatuses] = useState<WorkspaceResourceManagerStatuses>({});
  const [pendingImportPreview, setPendingImportPreview] = useState<PendingImportPreview | null>(null);
  const [createSheetState, setCreateSheetState] = useState<CreateSheetState | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const openApiImportInputRef = useRef<HTMLInputElement | null>(null);
  const postmanImportInputRef = useRef<HTMLInputElement | null>(null);
  const [runnerConfigState, setRunnerConfigState] = useState<WorkspaceRunnerConfigState>({
    containerKey: 'none',
    executionOrder: RUNNER_DEFAULT_EXECUTION_ORDER,
    continueOnError: true,
    iterationInput: '1',
    dataFilePath: '',
    environmentSelection: RUNNER_ENVIRONMENT_INHERIT,
    selectedRequestIds: [],
  });
  const tabs = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.tabs);
  const activeTabId = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.activeTabId);
  const selectedExplorerItemId = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.selectedExplorerItemId);
  const selectedExplorerItemKind = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.selectedExplorerItemKind);
  const openNewRequest = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.openNewRequest);
  const openQuickRequest = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.openQuickRequest);
  const openSavedRequest = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.openSavedRequest);
  const openCollectionOverview = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.openCollectionOverview);
  const openRequestGroupOverview = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.openRequestGroupOverview);
  const openBatchResult = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.openBatchResult);
  const setActiveTab = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.setActiveTab);
  const setSelectedExplorerItem = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.setSelectedExplorerItem);
  const detachSavedRequest = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.detachSavedRequest);
  const pinTab = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.pinTab);
  const workspaceActivePanel = useWorkspaceUiStore((state) => state.routePanels.workspace.activePanel);
  const setWorkspaceActivePanel = useWorkspaceUiStore((state) => state.setRouteActivePanel);
  const focusWorkspaceWorkSurface = useWorkspaceUiStore((state) => state.focusWorkspaceWorkSurface);
  const closeTab = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.closeTab);
  const reopenLastClosedTab = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.reopenLastClosedTab);
  const recentlyClosedTabs = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.recentlyClosedTabs);
  const setFloatingExplorerOpen = useShellStore((state) => state.setFloatingExplorerOpen);
  const ensureDraftForTab = useRequestDraftStore((state) => state.ensureDraftForTab);
  const removeDraft = useRequestDraftStore((state) => state.removeDraft);
  const syncDraftCollectionPlacement = useRequestDraftStore((state) => state.syncCollectionPlacement);
  const syncDraftRequestGroupPlacement = useRequestDraftStore((state) => state.syncRequestGroupPlacement);
  const removeCommandState = useRequestCommandStore((state) => state.removeTab);
  const deactivateBatchRun = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.deactivate);
  const startBatchRun = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.startBatchRun);
  const finishBatchRunSuccess = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.finishBatchRunSuccess);
  const finishBatchRunError = useWorkspaceBatchRunStore((state: ReturnType<typeof useWorkspaceBatchRunStore.getState>) => state.finishBatchRunError);
  const syncTabCollectionPlacement = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.syncCollectionPlacement);
  const syncTabRequestGroupPlacement = useWorkspaceShellStore((state: ReturnType<typeof useWorkspaceShellStore.getState>) => state.syncRequestGroupPlacement);

  const savedRequestsQuery = useQuery({
    queryKey: workspaceSavedRequestsQueryKey,
    queryFn: listWorkspaceSavedRequests,
  });
  const requestTreeQuery = useQuery({
    queryKey: workspaceRequestTreeQueryKey,
    queryFn: listWorkspaceRequestTree,
  });
  const environmentsQuery = useQuery({
    queryKey: workspaceEnvironmentsQueryKey,
    queryFn: listWorkspaceEnvironments,
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

  const closeHeaderMenus = () => {
    setIsHeaderMenuOpen(false);
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
          createBundleExportLabel(bundle, t),
          t,
        ),
      );
    },
    onError: (error) => {
      setManagerStatus('transfer', {
        tone: 'error',
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.exportFailed'), t),
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
          t('workspaceRoute.explorer.status.exportSavedRequestLabel', { name: request.name }),
          t,
        ),
      );
    },
    onError: (error) => {
      setManagerStatus('saved-request', {
        tone: 'error',
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.exportSingleFailed'), t),
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
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.fileReadFailed'), t),
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
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.importFailed'), t),
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
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.collectionCreateFailed'), t),
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
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.collectionRenameFailed'), t),
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
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.collectionDeleteFailed'), t),
      });
    },
  });
  const createRequestGroupMutation = useMutation({
    mutationFn: ({
      collectionId,
      name,
      parentRequestGroupId,
    }: {
      collectionId: string;
      name: string;
      parentRequestGroupId?: string | null;
    }) => (
      createWorkspaceRequestGroup(
        collectionId,
        parentRequestGroupId === undefined
          ? { name }
          : { name, parentRequestGroupId },
      )
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
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.requestGroupCreateFailed'), t),
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
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.requestGroupRenameFailed'), t),
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
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.requestGroupDeleteFailed'), t),
      });
    },
  });
  const deleteSavedRequestMutation = useMutation({
    mutationFn: deleteWorkspaceSavedRequest,
    onSuccess: async (deletedRequestId) => {
      detachSavedRequest(deletedRequestId);
      setSelectedExplorerItem(null);

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
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.requestDeleteFailed'), t),
      });
    },
  });

  const workspaceLoadStatus = requestTreeQuery.error || savedRequestsQuery.error
    ? {
        tone: 'error' as const,
        message: t('workspaceRoute.explorer.status.workspaceResourcesDegraded'),
        details: Array.from(new Set([
          ...(requestTreeQuery.error instanceof Error
            ? [
                t('workspaceRoute.explorer.status.requestTreeDegraded'),
                isBackendUnavailableApiError(requestTreeQuery.error)
                  ? t('common.errors.backendUnavailable')
                  : resolveWorkspaceErrorMessage(
                      requestTreeQuery.error,
                      t('workspaceRoute.explorer.status.requestTreeDegraded'),
                      t,
                    ),
              ]
            : []),
          ...(savedRequestsQuery.error instanceof Error
            ? [
                t('workspaceRoute.explorer.status.savedRequestsDegraded'),
                isBackendUnavailableApiError(savedRequestsQuery.error)
                  ? t('common.errors.backendUnavailable')
                  : resolveWorkspaceErrorMessage(
                      savedRequestsQuery.error,
                      t('workspaceRoute.explorer.status.savedRequestsDegraded'),
                      t,
                    ),
              ]
            : []),
        ])),
      }
    : null;
  const mergedManagerStatuses = workspaceLoadStatus
    ? {
        ...managerStatuses,
        collections: managerStatuses.collections ?? workspaceLoadStatus,
        'request-groups': managerStatuses['request-groups'] ?? workspaceLoadStatus,
        'saved-request': managerStatuses['saved-request'] ?? workspaceLoadStatus,
      }
    : managerStatuses;
  const explorerTree = requestTreeQuery.data?.tree ?? [];
  const requestPlacementOptions = buildRequestPlacementOptions(explorerTree, requestTreeQuery.data?.defaults);
  const activeTab = tabs.find((tab: RequestTabRecord) => tab.id === activeTabId) ?? null;
  const readActiveDraft = () => (
    activeTab
      ? useRequestDraftStore.getState().draftsByTabId[activeTab.id]?.draft ?? null
      : null
  );
  const activeSavedRequest = findWorkspaceRequestById(explorerTree, activeTab?.requestId);
  const selectedCollection = selectedExplorerItemKind === 'collection'
    ? findCollectionById(explorerTree, selectedExplorerItemId)
    : null;
  const selectedRequestGroupLocation = selectedExplorerItemKind === 'request-group'
    ? findRequestGroupById(explorerTree, selectedExplorerItemId)
    : null;
  const selectedRunnerContainer = useMemo(
    () => createRunnerContainerSelection(selectedCollection, selectedRequestGroupLocation),
    [selectedCollection, selectedRequestGroupLocation],
  );
  const runnerEnvironmentOptions = environmentsQuery.data ?? [];
  const runnerContainerRequestIds = useMemo(
    () => selectedRunnerContainer?.requests.map((request) => request.id) ?? [],
    [selectedRunnerContainer],
  );
  const runnerContainerRequestIdSet = useMemo(
    () => new Set(runnerContainerRequestIds),
    [runnerContainerRequestIds],
  );
  const runnerContainerKey = selectedRunnerContainer
    ? `${selectedRunnerContainer.containerType}:${selectedRunnerContainer.containerId}`
    : 'none';

  const resolveRunnerConfigState = (
    state: WorkspaceRunnerConfigState,
  ): WorkspaceRunnerConfigState => (
    state.containerKey === runnerContainerKey
      ? state
      : {
          containerKey: runnerContainerKey,
          executionOrder: RUNNER_DEFAULT_EXECUTION_ORDER,
          continueOnError: true,
          iterationInput: '1',
          dataFilePath: '',
          environmentSelection: RUNNER_ENVIRONMENT_INHERIT,
          selectedRequestIds: runnerContainerRequestIds,
        }
  );

  const runnerConfig = resolveRunnerConfigState(runnerConfigState);
  const runnerExecutionOrder = runnerConfig.executionOrder;
  const runnerContinueOnError = runnerConfig.continueOnError;
  const runnerIterationInput = runnerConfig.iterationInput;
  const runnerDataFilePath = runnerConfig.dataFilePath;
  const runnerEnvironmentSelection = runnerConfig.environmentSelection;
  const runnerSelectedRequestIds = runnerConfig.selectedRequestIds;

  const setRunnerConfig = (updater: (current: WorkspaceRunnerConfigState) => WorkspaceRunnerConfigState) => {
    setRunnerConfigState((current) => {
      const base = resolveRunnerConfigState(current);
      const next = updater(base);

      return {
        ...next,
        containerKey: runnerContainerKey,
      };
    });
  };

  const runnerOrderedSelectedRequestIds = useMemo(
    () => runnerContainerRequestIds.filter((requestId) => runnerSelectedRequestIds.includes(requestId)),
    [runnerContainerRequestIds, runnerSelectedRequestIds],
  );
  const runnerHasRequestSelection = runnerContainerRequestIds.length === 0 || runnerOrderedSelectedRequestIds.length > 0;
  const runnerCanRunSelectedContainer = Boolean(selectedRunnerContainer) && runnerHasRequestSelection;
  const activeTabKey = activeTab?.id ?? 'empty';

  const openDraftFromSeed = async (
    draftSeed?: RequestDraftSeed,
    options: { source?: 'detached' | 'quick' } = {},
  ) => {
    focusWorkspaceWorkSurface();
    deactivateBatchRun();
    setFloatingExplorerOpen('workspace', false);
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
      collectionName: draftSeed?.collectionName ?? defaultPlacement?.collectionName ?? DEFAULT_REQUEST_COLLECTION_NAME,
      requestGroupName: readRequestGroupName(draftSeed) ?? defaultPlacement?.requestGroupName ?? DEFAULT_REQUEST_GROUP_NAME,
    });
    const nextTab = options.source === 'quick'
      ? openQuickRequest({ placement: seededPlacement })
      : openNewRequest({ source: 'detached', placement: seededPlacement });

    ensureDraftForTab(nextTab, {
      ...(draftSeed ?? {}),
      ...seededPlacement,
      selectedEnvironmentId: resolveSeededEnvironmentId(draftSeed, defaultEnvironmentId),
    }, { replace: true });
  };

  const handleCreateRequest = () => {
    closeHeaderMenus();
    const activeDraft = readActiveDraft();
    const createTarget = selectedRequestGroupLocation?.requestGroup
      ?? selectedCollection
      ?? (activeDraft?.requestGroupId
        ? findRequestGroupById(explorerTree, activeDraft.requestGroupId)?.requestGroup ?? null
        : null)
      ?? (activeDraft?.collectionId
        ? findCollectionById(explorerTree, activeDraft.collectionId)
        : null);
    openCreateSheet('request', createTarget);
  };

  const handleCreateQuickRequest = () => {
    closeHeaderMenus();
    void openDraftFromSeed(undefined, { source: 'quick' });
  };

  const handleDuplicateRequest = () => {
    const activeDraft = readActiveDraft();

    if (!activeDraft) {
      return;
    }

    void openDraftFromSeed(activeDraft);
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

  const handleSelectCollection = (collection: WorkspaceCollectionNode) => {
    deactivateBatchRun();
    setSelectedExplorerItem({ kind: 'collection', id: collection.collectionId });
    openCollectionOverview({
      collectionId: collection.collectionId,
      collectionName: collection.name,
    });
    focusWorkspaceWorkSurface();
  };

  const handleSelectRequestGroup = (requestGroup: WorkspaceRequestGroupNode) => {
    deactivateBatchRun();
    setSelectedExplorerItem({ kind: 'request-group', id: requestGroup.requestGroupId });
    openRequestGroupOverview({
      collectionId: requestGroup.collectionId,
      collectionName: findCollectionById(explorerTree, requestGroup.collectionId)?.name ?? requestGroup.name,
      requestGroupId: requestGroup.requestGroupId,
      requestGroupName: requestGroup.name,
    });
    focusWorkspaceWorkSurface();
  };

  const openCreateSheet = (defaultType: CreateType, target: CreateSheetTarget = null) => {
    setCreateSheetState({
      defaultType,
      target,
    });
  };

  const closeCreateSheet = () => {
    setCreateSheetState(null);
  };

  const handleCreateCollectionFromSheet = async (name: string) => {
    await handleCreateCollection(name);
  };

  const handleCreateRequestGroupFromSheet = async (input: {
    name: string;
    collectionId: string;
    parentRequestGroupId: string | null;
  }) => {
    await createRequestGroupMutation.mutateAsync({
      collectionId: input.collectionId,
      name: input.name,
      parentRequestGroupId: input.parentRequestGroupId,
    });
  };

  const handleCreateRequestFromSheet = async (input: {
    name: string;
    collectionId?: string;
    collectionName?: string;
    requestGroupId?: string;
    requestGroupName?: string;
  }) => {
    const placement: RequestPlacementValue = {};
    if (input.collectionId) {
      placement.collectionId = input.collectionId;
    }
    if (input.collectionName) {
      placement.collectionName = input.collectionName;
    }
    if (input.requestGroupId) {
      placement.requestGroupId = input.requestGroupId;
    }
    if (input.requestGroupName) {
      placement.requestGroupName = input.requestGroupName;
    }

    await openDraftFromSeed({
      name: input.name,
      ...createRequestPlacementFields(placement),
    });
  };

  const handleOpenCreateCollectionSheet = () => {
    closeHeaderMenus();
    openCreateSheet('collection');
  };

  const handleOpenCreateRequestGroupSheet = (target: WorkspaceCollectionNode | WorkspaceRequestGroupNode) => {
    closeHeaderMenus();
    openCreateSheet('request-group', target);
  };

  const handleToggleRunnerRequestSelection = (requestId: string) => {
    if (!runnerContainerRequestIdSet.has(requestId)) {
      return;
    }

    setRunnerConfig((current) => ({
      ...current,
      selectedRequestIds: current.selectedRequestIds.includes(requestId)
        ? current.selectedRequestIds.filter((candidate) => candidate !== requestId)
        : [...current.selectedRequestIds, requestId],
    }));
  };

  const handleSelectAllRunnerRequests = () => {
    setRunnerConfig((current) => ({
      ...current,
      selectedRequestIds: runnerContainerRequestIds,
    }));
  };

  const handleClearRunnerRequestSelection = () => {
    setRunnerConfig((current) => ({
      ...current,
      selectedRequestIds: [],
    }));
  };

  const createRunnerBatchRunInput = (): WorkspaceBatchRunInput | null => {
    if (!selectedRunnerContainer) {
      return null;
    }

    const runInput: WorkspaceBatchRunInput = {
      executionOrder: runnerExecutionOrder,
      continueOnError: runnerContinueOnError,
      requestIds: runnerOrderedSelectedRequestIds,
      iterationCount: normalizeRunnerIterationCount(runnerIterationInput),
    };

    if (runnerEnvironmentSelection === RUNNER_ENVIRONMENT_NONE) {
      runInput.environmentId = null;
    } else if (runnerEnvironmentSelection !== RUNNER_ENVIRONMENT_INHERIT) {
      runInput.environmentId = runnerEnvironmentSelection;
    }

    const normalizedDataFilePath = runnerDataFilePath.trim();
    if (normalizedDataFilePath.length > 0) {
      runInput.dataFilePath = normalizedDataFilePath;
    }

    return runInput;
  };

  const handleRunSelectedContainer = () => {
    closeHeaderMenus();

    if (!runnerCanRunSelectedContainer) {
      return;
    }

    const runInput = createRunnerBatchRunInput();
    if (!runInput) {
      return;
    }

    if (selectedRequestGroupLocation) {
      void handleRunRequestGroup(selectedRequestGroupLocation.requestGroup, runInput);
      return;
    }

    if (selectedCollection) {
      void handleRunCollection(selectedCollection, runInput);
    }
  };

  const handlePromptDeleteCollection = async (collection: WorkspaceCollectionNode) => {
    if (!window.confirm(t('workspaceRoute.explorer.prompts.deleteCollection', { name: collection.name }))) {
      return;
    }

    await handleDeleteCollection(collection);
  };

  const handlePromptDeleteRequestGroup = async (requestGroup: WorkspaceRequestGroupNode) => {
    if (!window.confirm(t('workspaceRoute.explorer.prompts.deleteRequestGroup', { name: requestGroup.name }))) {
      return;
    }

    await handleDeleteRequestGroup(requestGroup);
  };

  const handlePromptDeleteSavedRequest = async (request: WorkspaceTreeRequestLeaf) => {
    if (!window.confirm(t('workspaceRoute.explorer.prompts.deleteSavedRequest', { name: request.name }))) {
      return;
    }

    await deleteSavedRequestMutation.mutateAsync(request.id);
  };

  const handleRunCollection = async (collection: WorkspaceCollectionNode, runInput?: WorkspaceBatchRunInput) => {
    setSelectedExplorerItem({ kind: 'collection', id: collection.collectionId });
    const runningMessage = t('workspaceRoute.resultPanel.batch.status.runningContainer', { name: collection.name });
    startBatchRun(runningMessage);
    openBatchResult({
      containerType: 'collection',
      containerId: collection.collectionId,
      containerName: collection.name,
      status: 'pending',
    });
    focusWorkspaceWorkSurface();

    try {
      const batchExecution = await runWorkspaceCollection(collection.collectionId, runInput);
      finishBatchRunSuccess(batchExecution);
      openBatchResult({
        containerType: 'collection',
        containerId: collection.collectionId,
        containerName: collection.name,
        status: 'success',
        batchExecutionId: batchExecution.batchExecutionId,
      });
      await queryClient.invalidateQueries({ queryKey: executionHistoryListQueryKey });
    } catch (error) {
      const message = resolveWorkspaceErrorMessage(error, t('workspaceRoute.resultPanel.batch.status.collectionFailed'), t);
      finishBatchRunError(message);
      openBatchResult({
        containerType: 'collection',
        containerId: collection.collectionId,
        containerName: collection.name,
        status: 'error',
      });
    }
  };

  const handleRunRequestGroup = async (requestGroup: WorkspaceRequestGroupNode, runInput?: WorkspaceBatchRunInput) => {
    setSelectedExplorerItem({ kind: 'request-group', id: requestGroup.requestGroupId });
    const runningMessage = t('workspaceRoute.resultPanel.batch.status.runningContainer', { name: requestGroup.name });
    startBatchRun(runningMessage);
    openBatchResult({
      containerType: 'request-group',
      containerId: requestGroup.requestGroupId,
      containerName: requestGroup.name,
      status: 'pending',
    });
    focusWorkspaceWorkSurface();

    try {
      const batchExecution = await runWorkspaceRequestGroup(requestGroup.requestGroupId, runInput);
      finishBatchRunSuccess(batchExecution);
      openBatchResult({
        containerType: 'request-group',
        containerId: requestGroup.requestGroupId,
        containerName: requestGroup.name,
        status: 'success',
        batchExecutionId: batchExecution.batchExecutionId,
      });
      await queryClient.invalidateQueries({ queryKey: executionHistoryListQueryKey });
    } catch (error) {
      const message = resolveWorkspaceErrorMessage(error, t('workspaceRoute.resultPanel.batch.status.requestGroupFailed'), t);
      finishBatchRunError(message);
      openBatchResult({
        containerType: 'request-group',
        containerId: requestGroup.requestGroupId,
        containerName: requestGroup.name,
        status: 'error',
      });
    }
  };

  const openSavedRequestInWorkbench = async (
    request: WorkspaceTreeRequestLeaf,
    tabMode: 'preview' | 'pinned',
  ) => {
    focusWorkspaceWorkSurface();
    deactivateBatchRun();
    setFloatingExplorerOpen('workspace', false);
    const existingTab = useWorkspaceShellStore
      .getState()
      .tabs.find((tab) => tab.sourceKey === `saved-${request.id}`);
    const nextTab = openSavedRequest({
      id: request.id,
      name: request.name,
      methodLabel: request.methodLabel,
      summary: request.summary,
      collectionName: request.collectionName,
      ...createRequestPlacementFields(request),
    }, { tabMode });

    if (existingTab) {
      return;
    }

    removeCommandState(nextTab.id);
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
    }, { replace: true });
  };

  const handlePreviewSavedRequest = async (request: WorkspaceTreeRequestLeaf) => {
    await openSavedRequestInWorkbench(request, 'preview');
  };

  const handlePinSavedRequest = async (request: WorkspaceTreeRequestLeaf) => {
    await openSavedRequestInWorkbench(request, 'pinned');
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    focusWorkspaceWorkSurface();
  };

  const handleCloseTab = (tabId: string) => {
    const evictedClosedTabIds = closeTab(tabId);

    evictedClosedTabIds.forEach((evictedTabId) => {
      removeDraft(evictedTabId);
      removeCommandState(evictedTabId);
    });
  };
  const handleCloseCurrentTab = () => {
    if (!activeTabId) {
      return;
    }

    handleCloseTab(activeTabId);
  };

  const handleCloseOtherTabs = () => {
    if (!activeTabId) {
      return;
    }

    tabs
      .filter((tab) => tab.id !== activeTabId)
      .forEach((tab) => handleCloseTab(tab.id));
  };

  const handleCloseAllTabs = () => {
    tabs.forEach((tab) => handleCloseTab(tab.id));
  };

  const handleReopenClosedTab = () => {
    const reopenedTab = reopenLastClosedTab();

    if (!reopenedTab) {
      return;
    }

    deactivateBatchRun();
    focusWorkspaceWorkSurface();
    setFloatingExplorerOpen('workspace', false);
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
        message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.explorer.status.fileReadFailed'), t),
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

  const readSelectedPlacementSeed = (): RequestDraftSeed => {
    if (selectedRequestGroupLocation) {
      return createRequestPlacementFields({
        collectionId: selectedRequestGroupLocation.collection.collectionId,
        collectionName: selectedRequestGroupLocation.collection.name,
        requestGroupId: selectedRequestGroupLocation.requestGroup.requestGroupId,
        requestGroupName: selectedRequestGroupLocation.requestGroup.name,
      });
    }

    if (selectedCollection) {
      return createRequestPlacementFields({
        collectionId: selectedCollection.collectionId,
        collectionName: selectedCollection.name,
      });
    }

    return {};
  };

  const handleImportCurl = () => {
    const command = window.prompt(t('workspaceRoute.newImport.prompt.curl'));
    if (!command || command.trim().length === 0) {
      return;
    }

    try {
      const curlSeed = parseCurlCommandToDraftSeed(command);
      const placementSeed = readSelectedPlacementSeed();
      const mergedSeed: RequestDraftSeed = {
        ...curlSeed,
        ...placementSeed,
      };
      closeHeaderMenus();

      void openDraftFromSeed(mergedSeed)
        .then(() => {
          setManagerStatus('transfer', {
            tone: 'info',
            message: t('workspaceRoute.newImport.status.curlOpened', {
              method: mergedSeed.method ?? 'GET',
              url: mergedSeed.url ?? '',
            }),
          });
        })
        .catch((error) => {
          setManagerStatus('transfer', {
            tone: 'error',
            message: resolveWorkspaceErrorMessage(error, t('workspaceRoute.newImport.status.curlOpenFailed'), t),
          });
        });
    } catch (error) {
      setManagerStatus('transfer', {
        tone: 'error',
        message: error instanceof CurlImportParseError
          ? t('workspaceRoute.newImport.status.curlInvalid', { reason: error.message })
          : t('workspaceRoute.newImport.status.curlInvalidUnknown'),
      });
    }
  };

  const bridgeImportFromFile = (source: 'openapi' | 'postman', file: File | null) => {
    if (!file) {
      return;
    }

    closeHeaderMenus();
    setManagerStatus('transfer', {
      tone: 'info',
      message: source === 'openapi'
        ? t('workspaceRoute.newImport.status.openApiBridge', { fileName: file.name })
        : t('workspaceRoute.newImport.status.postmanBridge', { fileName: file.name }),
    });
    void handleImportResources(file);
  };

  const handleOpenApiFileSelection = (event: { currentTarget: HTMLInputElement }) => {
    bridgeImportFromFile('openapi', event.currentTarget.files?.[0] ?? null);
    event.currentTarget.value = '';
  };

  const handlePostmanFileSelection = (event: { currentTarget: HTMLInputElement }) => {
    bridgeImportFromFile('postman', event.currentTarget.files?.[0] ?? null);
    event.currentTarget.value = '';
  };

  const toggleHeaderMenu = () => {
    setIsHeaderMenuOpen((open) => !open);
  };
  const shortcutContextRef = useRef({
    toggleCommandMenu: toggleHeaderMenu,
    handleCreateRequest,
    handleCreateQuickRequest,
    handleOpenCreateCollectionSheet,
    handleOpenCreateRequestGroupSheet,
    handleRunSelectedContainer,
    selectedCollection,
    selectedRequestGroupLocation,
  });

  useEffect(() => {
    shortcutContextRef.current = {
      toggleCommandMenu: toggleHeaderMenu,
      handleCreateRequest,
      handleCreateQuickRequest,
      handleOpenCreateCollectionSheet,
      handleOpenCreateRequestGroupSheet,
      handleRunSelectedContainer,
      selectedCollection,
      selectedRequestGroupLocation,
    };
  });

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      const context = shortcutContextRef.current;
      const key = event.key.toLowerCase();
      const openCommandPalette = (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && key === 'k';

      if (openCommandPalette) {
        event.preventDefault();
        context.toggleCommandMenu();
        return;
      }

      if (isEditableEventTarget(event.target)) {
        return;
      }

      const isWorkspaceShortcut = event.altKey && event.shiftKey && !event.metaKey && !event.ctrlKey;
      if (!isWorkspaceShortcut) {
        return;
      }

      switch (key) {
        case 'n':
          event.preventDefault();
          context.handleCreateRequest();
          return;
        case 'q':
          event.preventDefault();
          context.handleCreateQuickRequest();
          return;
        case 'c':
          event.preventDefault();
          context.handleOpenCreateCollectionSheet();
          return;
        case 'g':
          if (!context.selectedCollection && !context.selectedRequestGroupLocation) {
            return;
          }
          event.preventDefault();
          if (context.selectedRequestGroupLocation) {
            context.handleOpenCreateRequestGroupSheet(context.selectedRequestGroupLocation.requestGroup);
          } else if (context.selectedCollection) {
            context.handleOpenCreateRequestGroupSheet(context.selectedCollection);
          }
          return;
        case 'r':
          if (!context.selectedCollection && !context.selectedRequestGroupLocation) {
            return;
          }
          event.preventDefault();
          context.handleRunSelectedContainer();
          return;
        default:
          return;
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, []);

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
        {workspaceLoadStatus ? (
          <div className={`workspace-explorer__status workspace-explorer__status--${workspaceLoadStatus.tone}`} role="alert">
            <p>{workspaceLoadStatus.message}</p>
            {workspaceLoadStatus.details.length > 0 ? (
              <ul className="workspace-explorer__status-details">
                {workspaceLoadStatus.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <WorkspaceExplorer
          tree={explorerTree}
          selectedItemId={selectedExplorerItemId}
          selectedItemKind={selectedExplorerItemKind}
          onSelectCollection={handleSelectCollection}
          onSelectRequestGroup={handleSelectRequestGroup}
          onPreviewSavedRequest={handlePreviewSavedRequest}
          onPinSavedRequest={handlePinSavedRequest}
          onDeleteCollection={handlePromptDeleteCollection}
          onDeleteRequestGroup={handlePromptDeleteRequestGroup}
          onDeleteRequest={handlePromptDeleteSavedRequest}
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
            <div className="workspace-explorer__role-strip" aria-label={t('workspaceRoute.a11y.surfaceRoleStrip')}>
              <span className="workspace-chip">{t('roles.authoring')}</span>
              <span className="workspace-chip workspace-chip--secondary">{t('routes.workspace.contextChip')}</span>
            </div>
          </SectionHeading>

        {workspaceLoadStatus ? (
          <div className={`workspace-explorer__status workspace-explorer__status--${workspaceLoadStatus.tone}`} role="alert">
            <p>{workspaceLoadStatus.message}</p>
            {workspaceLoadStatus.details.length > 0 ? (
              <ul className="workspace-explorer__status-details">
                {workspaceLoadStatus.details.map((detail) => (
                  <li key={`main-${detail}`}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <WorkspaceHeaderActions
          isMenuOpen={isHeaderMenuOpen}
          canCreateRequestGroup={Boolean(selectedCollection || selectedRequestGroupLocation)}
          canRunSelectedContainer={Boolean(selectedCollection || selectedRequestGroupLocation)}
          onMenuOpenChange={setIsHeaderMenuOpen}
          onCreateRequest={handleCreateRequest}
          onCreateQuickRequest={handleCreateQuickRequest}
          onOpenCreateCollectionSheet={handleOpenCreateCollectionSheet}
          onOpenCreateRequestGroupSheet={() => {
            const createTarget = selectedRequestGroupLocation?.requestGroup ?? selectedCollection;

            if (createTarget) {
              handleOpenCreateRequestGroupSheet(createTarget);
            }
          }}
          onRunSelectedContainer={handleRunSelectedContainer}
          onImportCurl={handleImportCurl}
          onImportOpenApi={() => openApiImportInputRef.current?.click()}
          onImportPostman={() => postmanImportInputRef.current?.click()}
        />

        <input
          ref={openApiImportInputRef}
          aria-label={t('workspaceRoute.newImport.actions.importOpenApiInput')}
          type="file"
          accept=".json,.yaml,.yml,application/json,text/yaml,application/x-yaml"
          style={{ display: 'none' }}
          onChange={handleOpenApiFileSelection}
        />
        <input
          ref={postmanImportInputRef}
          aria-label={t('workspaceRoute.newImport.actions.importPostmanInput')}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handlePostmanFileSelection}
        />

        {selectedRunnerContainer ? (
          <WorkspaceRunnerPanel
            container={selectedRunnerContainer}
            selectedRequestIds={runnerOrderedSelectedRequestIds}
            executionOrder={runnerExecutionOrder}
            environmentSelection={runnerEnvironmentSelection}
            iterationInput={runnerIterationInput}
            dataFilePath={runnerDataFilePath}
            continueOnError={runnerContinueOnError}
            environmentOptions={runnerEnvironmentOptions}
            inheritEnvironmentValue={RUNNER_ENVIRONMENT_INHERIT}
            noEnvironmentValue={RUNNER_ENVIRONMENT_NONE}
            maxIterationCount={RUNNER_MAX_ITERATION_COUNT}
            onSelectAll={handleSelectAllRunnerRequests}
            onClearSelection={handleClearRunnerRequestSelection}
            onRunSelected={handleRunSelectedContainer}
            onToggleRequest={handleToggleRunnerRequestSelection}
            onExecutionOrderChange={(nextOrder) => setRunnerConfig((current) => ({
              ...current,
              executionOrder: nextOrder,
            }))}
            onEnvironmentSelectionChange={(nextSelection) => setRunnerConfig((current) => ({
              ...current,
              environmentSelection: nextSelection,
            }))}
            onIterationInputChange={(nextValue) => setRunnerConfig((current) => ({
              ...current,
              iterationInput: nextValue,
            }))}
            onDataFilePathChange={(nextValue) => setRunnerConfig((current) => ({
              ...current,
              dataFilePath: nextValue,
            }))}
            onContinueOnErrorChange={(nextValue) => setRunnerConfig((current) => ({
              ...current,
              continueOnError: nextValue,
            }))}
          />
        ) : null}

        <WorkspaceCreateSheet
          isOpen={Boolean(createSheetState)}
          tree={explorerTree}
          defaultType={createSheetState?.defaultType ?? 'collection'}
          defaultTarget={createSheetState?.target ?? null}
          onCancel={closeCreateSheet}
          onCreateCollection={handleCreateCollectionFromSheet}
          onCreateRequestGroup={handleCreateRequestGroupFromSheet}
          onCreateRequest={handleCreateRequestFromSheet}
        />

        <RequestTabShell
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onPinTab={pinTab}
          onReopenClosedTab={handleReopenClosedTab}
          onCloseCurrentTab={handleCloseCurrentTab}
          onCloseOtherTabs={handleCloseOtherTabs}
          onCloseAllTabs={handleCloseAllTabs}
          canReopenClosedTab={recentlyClosedTabs.length > 0}
          canCloseCurrentTab={Boolean(activeTabId)}
          canCloseOtherTabs={Boolean(activeTabId) && tabs.length > 1}
          canCloseAllTabs={tabs.length > 0}
        />

        <RequestWorkSurface
          key={`work-${activeTabKey}`}
          activeTab={activeTab}
          onCreateRequest={handleCreateRequest}
          onDuplicateRequest={handleDuplicateRequest}
          placementOptions={requestPlacementOptions}
          workspaceTree={explorerTree}
        />

        <WorkspaceResourceManagerPanel
          tree={explorerTree}
          activeTab={activeTab}
          activeSavedRequest={activeSavedRequest}
          onRenameCollection={handleRenameCollection}
          onDeleteCollection={handleDeleteCollection}
          onRenameRequestGroup={handleRenameRequestGroup}
          onDeleteRequestGroup={handleDeleteRequestGroup}
          onExportRequest={(request) => exportRequestMutation.mutate(request)}
          onDeleteRequest={(request) => deleteSavedRequestMutation.mutate(request.id)}
          onExportResources={() => exportResourcesMutation.mutate()}
          onImportResources={handleImportResources}
          importPreview={pendingImportPreview}
          onConfirmImportPreview={handleConfirmImportPreview}
          onCancelImportPreview={handleCancelImportPreview}
          statuses={mergedManagerStatuses}
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
        </section>
      )}
      detail={(
        <aside className="shell-panel shell-panel--detail" aria-label={t('shell.routePanels.detailRegion')}>
          <WorkspaceContextPanel
            key={`detail-${activeTabKey}`}
            activeTab={activeTab}
            workspaceContext={requestTreeQuery.data ?? null}
          />
        </aside>
      )}
    />
  );
}






