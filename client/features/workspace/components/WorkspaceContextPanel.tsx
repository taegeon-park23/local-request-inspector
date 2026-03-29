import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useI18n } from '@client/app/providers/useI18n';
import { RequestResultPanel } from '@client/features/request-builder/components/RequestResultPanel';
import type { RequestDraftState } from '@client/features/request-builder/request-draft.types';
import {
  selectRequestDraftByTabId,
  selectRequestDraftPlacementSnapshot,
  selectRequestTabDraftPresentation,
  useRequestDraftStore,
} from '@client/features/request-builder/state/request-draft-store';
import {
  formatRequestPlacementPath,
  readRequestGroupName,
  type RequestPlacementValue,
} from '@client/features/request-builder/request-placement';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { useWorkspaceBatchRunStore } from '@client/features/workspace/state/workspace-batch-run-store';
import type {
  WorkspaceAuthDefaults,
  WorkspaceCollectionNode,
  WorkspaceCollectionRecord,
  WorkspaceRequestGroupNode,
  WorkspaceRequestGroupRecord,
  WorkspaceRequestTreeResponse,
  WorkspaceRunConfig,
  WorkspaceScriptDefaults,
  WorkspaceScopedVariableRow,
} from '@client/features/workspace/workspace-request-tree.api';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { PanelTabs } from '@client/shared/ui/PanelTabs';

type ContextTabId = 'overview' | 'inheritance' | 'runs';

interface WorkspaceContextPanelProps {
  activeTab: RequestTabRecord | null;
  workspaceContext: Pick<WorkspaceRequestTreeResponse, 'collections' | 'requestGroups' | 'tree'> | null;
}

const DEFAULT_AUTH_DEFAULTS: WorkspaceAuthDefaults = {
  type: 'none',
  bearerToken: '',
  basicUsername: '',
  basicPassword: '',
  apiKeyName: '',
  apiKeyValue: '',
  apiKeyPlacement: 'header',
};

const DEFAULT_SCRIPT_DEFAULTS: WorkspaceScriptDefaults = {
  preRequest: '',
  postResponse: '',
  tests: '',
};

function hasText(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeScopeVariables(rows: WorkspaceScopedVariableRow[] | null | undefined): WorkspaceScopedVariableRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter((row) => typeof row?.key === 'string' && row.key.trim().length > 0)
    .map((row) => {
      const nextRow: WorkspaceScopedVariableRow = {
        key: row.key.trim(),
        value: typeof row.value === 'string' ? row.value : '',
        isEnabled: row.isEnabled !== false,
      };

      if (typeof row.id === 'string' && row.id.length > 0) {
        nextRow.id = row.id;
      }

      return nextRow;
    })
    .filter((row) => row.isEnabled !== false);
}

function normalizeAuthDefaults(auth: Partial<WorkspaceAuthDefaults> | null | undefined): WorkspaceAuthDefaults {
  const candidate = auth ?? {};
  const type = candidate.type === 'bearer' || candidate.type === 'basic' || candidate.type === 'api-key'
    ? candidate.type
    : 'none';

  return {
    type,
    bearerToken: typeof candidate.bearerToken === 'string' ? candidate.bearerToken : '',
    basicUsername: typeof candidate.basicUsername === 'string' ? candidate.basicUsername : '',
    basicPassword: typeof candidate.basicPassword === 'string' ? candidate.basicPassword : '',
    apiKeyName: typeof candidate.apiKeyName === 'string' ? candidate.apiKeyName : '',
    apiKeyValue: typeof candidate.apiKeyValue === 'string' ? candidate.apiKeyValue : '',
    apiKeyPlacement: candidate.apiKeyPlacement === 'query' ? 'query' : 'header',
  };
}

function normalizeScriptDefaults(scripts: Partial<WorkspaceScriptDefaults> | null | undefined): WorkspaceScriptDefaults {
  if (!scripts || typeof scripts !== 'object') {
    return {
      ...DEFAULT_SCRIPT_DEFAULTS,
    };
  }

  return {
    preRequest: typeof scripts.preRequest === 'string' ? scripts.preRequest : '',
    postResponse: typeof scripts.postResponse === 'string' ? scripts.postResponse : '',
    tests: typeof scripts.tests === 'string' ? scripts.tests : '',
  };
}

function normalizeRunConfig(runConfig: WorkspaceRunConfig | null | undefined): WorkspaceRunConfig {
  if (!runConfig || typeof runConfig !== 'object' || Array.isArray(runConfig)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(runConfig)
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)),
  );
}

function hasAuthOverrides(auth: WorkspaceAuthDefaults) {
  return auth.type !== 'none'
    || hasText(auth.bearerToken)
    || hasText(auth.basicUsername)
    || hasText(auth.basicPassword)
    || hasText(auth.apiKeyName)
    || hasText(auth.apiKeyValue);
}

function summarizeScriptOverrideValue(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return '';
  }

  if (trimmed.length <= 120) {
    return trimmed;
  }

  return `${trimmed.slice(0, 117)}...`;
}

function hasScriptOverrides(scripts: WorkspaceScriptDefaults) {
  return hasText(scripts.preRequest) || hasText(scripts.postResponse) || hasText(scripts.tests);
}

function toVariableMap(rows: WorkspaceScopedVariableRow[]) {
  const byKey = new Map<string, WorkspaceScopedVariableRow>();

  for (const row of rows) {
    byKey.set(row.key.toLowerCase(), row);
  }

  return byKey;
}

function convertVariableMapToObject(rowsByKey: Map<string, WorkspaceScopedVariableRow>) {
  return Object.fromEntries(
    [...rowsByKey.values()]
      .sort((left, right) => left.key.localeCompare(right.key))
      .map((row) => [row.key, row.value]),
  );
}

function mergeVariableMaps(
  ...scopes: Array<Map<string, WorkspaceScopedVariableRow>>
) {
  const merged = new Map<string, WorkspaceScopedVariableRow>();

  for (const scope of scopes) {
    for (const [key, row] of scope.entries()) {
      merged.set(key, row);
    }
  }

  return merged;
}

function mergeAuthDefaults(collectionAuth: WorkspaceAuthDefaults, requestGroupAuth: WorkspaceAuthDefaults) {
  const merged: WorkspaceAuthDefaults = {
    ...DEFAULT_AUTH_DEFAULTS,
  };

  if (collectionAuth.type !== 'none') {
    Object.assign(merged, collectionAuth);
  }

  if (requestGroupAuth.type !== 'none') {
    Object.assign(merged, requestGroupAuth);
  }

  return merged;
}

function applyRequestAuthOverrides(requestAuth: WorkspaceAuthDefaults, inheritedAuth: WorkspaceAuthDefaults) {
  if (inheritedAuth.type === 'none') {
    return requestAuth;
  }

  if (requestAuth.type === 'none') {
    return {
      ...inheritedAuth,
    };
  }

  if (requestAuth.type !== inheritedAuth.type) {
    return requestAuth;
  }

  return {
    ...requestAuth,
    bearerToken: requestAuth.bearerToken || inheritedAuth.bearerToken,
    basicUsername: requestAuth.basicUsername || inheritedAuth.basicUsername,
    basicPassword: requestAuth.basicPassword || inheritedAuth.basicPassword,
    apiKeyName: requestAuth.apiKeyName || inheritedAuth.apiKeyName,
    apiKeyValue: requestAuth.apiKeyValue || inheritedAuth.apiKeyValue,
    apiKeyPlacement: requestAuth.apiKeyPlacement || inheritedAuth.apiKeyPlacement,
  };
}

function mergeScriptDefaults(collectionScripts: WorkspaceScriptDefaults, requestGroupScripts: WorkspaceScriptDefaults): WorkspaceScriptDefaults {
  return {
    preRequest: requestGroupScripts.preRequest.trim() || collectionScripts.preRequest.trim(),
    postResponse: requestGroupScripts.postResponse.trim() || collectionScripts.postResponse.trim(),
    tests: requestGroupScripts.tests.trim() || collectionScripts.tests.trim(),
  };
}

function readRequestScriptOverrideValue(
  binding: RequestDraftState['scripts']['preRequest'],
) {
  if (binding.mode === 'linked') {
    const linkedName = hasText(binding.savedScriptNameSnapshot) ? binding.savedScriptNameSnapshot.trim() : binding.savedScriptId.trim();
    return linkedName ? `@linked:${linkedName}` : '@linked';
  }

  return summarizeScriptOverrideValue(binding.sourceCode);
}

function readRequestScriptOverrides(requestDraft: Pick<RequestDraftState, 'scripts'> | null | undefined): WorkspaceScriptDefaults {
  if (!requestDraft) {
    return {
      ...DEFAULT_SCRIPT_DEFAULTS,
    };
  }

  return {
    preRequest: readRequestScriptOverrideValue(requestDraft.scripts.preRequest),
    postResponse: readRequestScriptOverrideValue(requestDraft.scripts.postResponse),
    tests: readRequestScriptOverrideValue(requestDraft.scripts.tests),
  };
}

function applyRequestScriptOverrides(
  inheritedScripts: WorkspaceScriptDefaults,
  requestOverrides: WorkspaceScriptDefaults,
) {
  return {
    preRequest: requestOverrides.preRequest.trim() || inheritedScripts.preRequest,
    postResponse: requestOverrides.postResponse.trim() || inheritedScripts.postResponse,
    tests: requestOverrides.tests.trim() || inheritedScripts.tests,
  };
}

function createAuthOverrideObject(auth: WorkspaceAuthDefaults) {
  return hasAuthOverrides(auth) ? auth : {};
}

function createScriptOverrideObject(scripts: WorkspaceScriptDefaults) {
  if (!hasScriptOverrides(scripts)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(scripts)
      .filter(([, value]) => hasText(value)),
  );
}

function formatJsonValue(value: unknown, emptyCopy: string) {
  if (!value || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0)) {
    return emptyCopy;
  }

  return JSON.stringify(value, null, 2);
}

function summarizeRequestGroupSubtree(requestGroups: WorkspaceRequestGroupNode[]): {
  requestGroupCount: number;
  requestCount: number;
} {
  return requestGroups.reduce(
    (summary, requestGroup) => {
      const nestedSummary = summarizeRequestGroupSubtree(requestGroup.childGroups);

      return {
        requestGroupCount: summary.requestGroupCount + 1 + nestedSummary.requestGroupCount,
        requestCount: summary.requestCount + requestGroup.requests.length + nestedSummary.requestCount,
      };
    },
    { requestGroupCount: 0, requestCount: 0 },
  );
}

function findCollectionRecord(
  collections: WorkspaceCollectionRecord[],
  collectionId: string | null | undefined,
) {
  if (!collectionId) {
    return null;
  }

  return collections.find((collection) => collection.id === collectionId) ?? null;
}

function findRequestGroupRecord(
  requestGroups: WorkspaceRequestGroupRecord[],
  requestGroupId: string | null | undefined,
) {
  if (!requestGroupId) {
    return null;
  }

  return requestGroups.find((requestGroup) => requestGroup.id === requestGroupId) ?? null;
}

function findCollectionNode(
  tree: WorkspaceCollectionNode[],
  collectionId: string | null | undefined,
) {
  if (!collectionId) {
    return null;
  }

  return tree.find((collection) => collection.collectionId === collectionId) ?? null;
}

function findRequestGroupNode(
  tree: WorkspaceCollectionNode[],
  requestGroupId: string | null | undefined,
): { collection: WorkspaceCollectionNode; requestGroup: WorkspaceRequestGroupNode } | null {
  if (!requestGroupId) {
    return null;
  }

  function walk(
    collection: WorkspaceCollectionNode,
    requestGroups: WorkspaceRequestGroupNode[],
  ): { collection: WorkspaceCollectionNode; requestGroup: WorkspaceRequestGroupNode } | null {
    for (const requestGroup of requestGroups) {
      if (requestGroup.requestGroupId === requestGroupId) {
        return { collection, requestGroup };
      }

      const nested = walk(collection, requestGroup.childGroups);
      if (nested) {
        return nested;
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

function readDefaultContextTab(activeTab: RequestTabRecord | null): ContextTabId {
  if (!activeTab) {
    return 'runs';
  }

  if (activeTab.source === 'collection-overview' || activeTab.source === 'request-group-overview') {
    return 'overview';
  }

  return 'runs';
}

function createTabPlacementValue(activeTab: RequestTabRecord): RequestPlacementValue {
  const placement: RequestPlacementValue = {};
  const requestGroupName = readRequestGroupName(activeTab);

  if (activeTab.collectionName) {
    placement.collectionName = activeTab.collectionName;
  }

  if (requestGroupName) {
    placement.requestGroupName = requestGroupName;
  }

  return placement;
}

interface ContextComparisonSectionProps {
  icon: 'params' | 'auth' | 'scripts' | 'settings';
  title: string;
  description: string;
  effectiveLabel: string;
  effectiveValue: unknown;
  effectiveFallback: string;
  overrideLabel: string;
  overrideValue: unknown;
  overrideFallback: string;
}

function ContextComparisonSection({
  icon,
  title,
  description,
  effectiveLabel,
  effectiveValue,
  effectiveFallback,
  overrideLabel,
  overrideValue,
  overrideFallback,
}: ContextComparisonSectionProps) {
  return (
    <DetailViewerSection
      icon={icon}
      title={title}
      description={description}
      tone="supporting"
      className="workspace-context-panel__supporting-section"
    >
      <div className="workspace-context-json-grid">
        <section className="workspace-context-json-grid__column">
          <h4>{effectiveLabel}</h4>
          <pre className="history-preview-block">{formatJsonValue(effectiveValue, effectiveFallback)}</pre>
        </section>
        <section className="workspace-context-json-grid__column">
          <h4>{overrideLabel}</h4>
          <pre className="history-preview-block">{formatJsonValue(overrideValue, overrideFallback)}</pre>
        </section>
      </div>
    </DetailViewerSection>
  );
}

export function WorkspaceContextPanel({
  activeTab,
  workspaceContext,
}: WorkspaceContextPanelProps) {
  const { t } = useI18n();
  const [activeContextTab, setActiveContextTab] = useState<ContextTabId>(() => readDefaultContextTab(activeTab));
  const batchStatus = useWorkspaceBatchRunStore((state) => state.status);
  const latestBatchExecution = useWorkspaceBatchRunStore((state) => state.latestExecution);
  const batchExecutionHistory = useWorkspaceBatchRunStore((state) => state.executionHistory);
  const collections = workspaceContext?.collections ?? [];
  const requestGroups = workspaceContext?.requestGroups ?? [];
  const tree = workspaceContext?.tree ?? [];

  const contextTabs = useMemo(
    () => ([
      { id: 'overview' as const, label: t('workspaceRoute.resultPanel.contextTabs.overview'), icon: 'overview' as const },
      { id: 'inheritance' as const, label: t('workspaceRoute.resultPanel.contextTabs.inheritance'), icon: 'paths' as const },
      { id: 'runs' as const, label: t('workspaceRoute.resultPanel.contextTabs.runs'), icon: 'run' as const },
    ]),
    [t],
  );

  const isCollectionOverviewTab = activeTab?.source === 'collection-overview';
  const isRequestGroupOverviewTab = activeTab?.source === 'request-group-overview';
  const isContainerOverviewTab = isCollectionOverviewTab || isRequestGroupOverviewTab;
  const activeDraftPresentation = useRequestDraftStore(useShallow((state): ReturnType<typeof selectRequestTabDraftPresentation> => selectRequestTabDraftPresentation(state, activeTab?.id ?? null)));
  const activeDraftPlacement = useRequestDraftStore(useShallow((state): ReturnType<typeof selectRequestDraftPlacementSnapshot> => selectRequestDraftPlacementSnapshot(state, activeTab?.id ?? null)));
  const activeDraftInheritance = useRequestDraftStore(useShallow((state): { auth: RequestDraftState['auth']; scripts: RequestDraftState['scripts'] } | null => {
      if (activeContextTab !== 'inheritance' || !activeTab || isCollectionOverviewTab || isRequestGroupOverviewTab) {
        return null;
      }

      const draft = selectRequestDraftByTabId(state, activeTab.id);

      if (!draft) {
        return null;
      }

      return {
        auth: draft.auth,
        scripts: draft.scripts,
      };
    }));
  const requestGroupRecord = findRequestGroupRecord(requestGroups, activeTab?.requestGroupId);
  const collectionRecord = findCollectionRecord(collections, activeTab?.collectionId)
    ?? (requestGroupRecord ? findCollectionRecord(collections, requestGroupRecord.collectionId) : null);
  const collectionNode = findCollectionNode(tree, collectionRecord?.id ?? activeTab?.collectionId);
  const requestGroupNodeLocation = findRequestGroupNode(tree, activeTab?.requestGroupId);
  const collectionSummary = collectionNode ? summarizeRequestGroupSubtree(collectionNode.childGroups) : { requestGroupCount: 0, requestCount: 0 };
  const requestGroupSummary = requestGroupNodeLocation ? summarizeRequestGroupSubtree(requestGroupNodeLocation.requestGroup.childGroups) : { requestGroupCount: 0, requestCount: 0 };
  const matchingContainerExecutions = useMemo(() => {
    if (!activeTab || !isContainerOverviewTab) {
      return [];
    }

    const matchesActiveContainer = (execution: {
      containerType: 'collection' | 'request-group';
      containerId: string;
    }) => {
      if (activeTab.source === 'collection-overview' && activeTab.collectionId) {
        return execution.containerType === 'collection' && execution.containerId === activeTab.collectionId;
      }

      if (activeTab.source === 'request-group-overview' && activeTab.requestGroupId) {
        return execution.containerType === 'request-group' && execution.containerId === activeTab.requestGroupId;
      }

      return false;
    };

    const historyMatches = batchExecutionHistory.filter((execution) => matchesActiveContainer(execution));

    if (!latestBatchExecution || !matchesActiveContainer(latestBatchExecution)) {
      return historyMatches;
    }

    const hasLatestInHistory = historyMatches.some(
      (execution) => execution.batchExecutionId === latestBatchExecution.batchExecutionId,
    );

    if (hasLatestInHistory) {
      return historyMatches;
    }

    return [latestBatchExecution, ...historyMatches];
  }, [activeTab, batchExecutionHistory, isContainerOverviewTab, latestBatchExecution]);

  const matchingContainerExecution = matchingContainerExecutions[0] ?? null;

  const inheritanceSnapshot = useMemo(() => {
    if (activeContextTab !== 'inheritance') {
      return null;
    }

    const collectionVariables = toVariableMap(normalizeScopeVariables(collectionRecord?.variables));
    const requestGroupVariables = toVariableMap(normalizeScopeVariables(requestGroupRecord?.variables));
    const collectionAuth = normalizeAuthDefaults(collectionRecord?.authDefaults);
    const requestGroupAuth = normalizeAuthDefaults(requestGroupRecord?.authDefaults);
    const collectionScripts = normalizeScriptDefaults(collectionRecord?.scriptDefaults);
    const requestGroupScripts = normalizeScriptDefaults(requestGroupRecord?.scriptDefaults);
    const collectionRunConfig = normalizeRunConfig(collectionRecord?.runConfig);
    const requestGroupRunConfig = normalizeRunConfig(requestGroupRecord?.runConfig);

    if (isCollectionOverviewTab) {
      return {
        variables: {
          effective: convertVariableMapToObject(collectionVariables),
          override: convertVariableMapToObject(collectionVariables),
        },
        auth: {
          effective: collectionAuth,
          override: createAuthOverrideObject(collectionAuth),
        },
        scripts: {
          effective: collectionScripts,
          override: createScriptOverrideObject(collectionScripts),
        },
        runConfig: {
          effective: collectionRunConfig,
          override: collectionRunConfig,
        },
      };
    }

    if (isRequestGroupOverviewTab) {
      const mergedVariableMap = mergeVariableMaps(collectionVariables, requestGroupVariables);
      const mergedAuth = mergeAuthDefaults(collectionAuth, requestGroupAuth);
      const mergedScripts = mergeScriptDefaults(collectionScripts, requestGroupScripts);

      return {
        variables: {
          effective: convertVariableMapToObject(mergedVariableMap),
          override: convertVariableMapToObject(requestGroupVariables),
        },
        auth: {
          effective: mergedAuth,
          override: createAuthOverrideObject(requestGroupAuth),
        },
        scripts: {
          effective: mergedScripts,
          override: createScriptOverrideObject(requestGroupScripts),
        },
        runConfig: {
          effective: {
            ...collectionRunConfig,
            ...requestGroupRunConfig,
          },
          override: requestGroupRunConfig,
        },
      };
    }

    const mergedVariableMap = mergeVariableMaps(collectionVariables, requestGroupVariables);
    const inheritedAuth = mergeAuthDefaults(collectionAuth, requestGroupAuth);
    const requestAuth = normalizeAuthDefaults(activeDraftInheritance?.auth);
    const requestScriptOverrides = readRequestScriptOverrides(activeDraftInheritance);
    const inheritedScripts = mergeScriptDefaults(collectionScripts, requestGroupScripts);

    return {
      variables: {
        effective: convertVariableMapToObject(mergedVariableMap),
        override: {},
      },
      auth: {
        effective: applyRequestAuthOverrides(requestAuth, inheritedAuth),
        override: createAuthOverrideObject(requestAuth),
      },
      scripts: {
        effective: applyRequestScriptOverrides(inheritedScripts, requestScriptOverrides),
        override: createScriptOverrideObject(requestScriptOverrides),
      },
      runConfig: {
        effective: {
          ...collectionRunConfig,
          ...requestGroupRunConfig,
        },
        override: {},
      },
    };
  }, [
    activeContextTab,
    activeDraftInheritance,
    collectionRecord,
    isCollectionOverviewTab,
    isRequestGroupOverviewTab,
    requestGroupRecord,
  ]);

  const activeDraftPlacementPathValue = useMemo(() => (
    activeDraftPlacement
      ? {
          ...(activeDraftPlacement.collectionName ? { collectionName: activeDraftPlacement.collectionName } : {}),
          ...(activeDraftPlacement.requestGroupName ? { requestGroupName: activeDraftPlacement.requestGroupName } : {}),
        }
      : null
  ), [activeDraftPlacement]);
  const contextOverviewItems = useMemo(() => {
    if (!activeTab) {
      return [];
    }

    if (isCollectionOverviewTab) {
      return [
        { label: t('workspaceRoute.resultPanel.context.overview.labels.scope'), value: t('workspaceRoute.resultPanel.context.overview.values.collection') },
        { label: t('workspaceRoute.resultPanel.context.overview.labels.name'), value: collectionRecord?.name ?? activeTab.title },
        { label: t('workspaceRoute.resultPanel.context.overview.labels.collectionId'), value: activeTab.collectionId ?? t('workspaceRoute.resultPanel.context.overview.values.notAvailable') },
        { label: t('workspaceRoute.resultPanel.context.overview.labels.requestGroups'), value: collectionSummary.requestGroupCount },
        { label: t('workspaceRoute.resultPanel.context.overview.labels.requests'), value: collectionSummary.requestCount },
      ];
    }

    if (isRequestGroupOverviewTab) {
      return [
        { label: t('workspaceRoute.resultPanel.context.overview.labels.scope'), value: t('workspaceRoute.resultPanel.context.overview.values.requestGroup') },
        { label: t('workspaceRoute.resultPanel.context.overview.labels.name'), value: requestGroupRecord?.name ?? activeTab.title },
        { label: t('workspaceRoute.resultPanel.context.overview.labels.requestGroupId'), value: activeTab.requestGroupId ?? t('workspaceRoute.resultPanel.context.overview.values.notAvailable') },
        { label: t('workspaceRoute.resultPanel.context.overview.labels.collection'), value: collectionRecord?.name ?? t('workspaceRoute.resultPanel.context.overview.values.notAvailable') },
        { label: t('workspaceRoute.resultPanel.context.overview.labels.childRequestGroups'), value: requestGroupSummary.requestGroupCount },
        {
          label: t('workspaceRoute.resultPanel.context.overview.labels.requests'),
          value: (requestGroupNodeLocation?.requestGroup.requests.length ?? 0) + requestGroupSummary.requestCount,
        },
      ];
    }

    return [
      { label: t('workspaceRoute.resultPanel.context.overview.labels.scope'), value: t('workspaceRoute.resultPanel.context.overview.values.request') },
      {
        label: t('workspaceRoute.resultPanel.context.overview.labels.name'),
        value: activeDraftPresentation?.title.trim() || activeTab.title,
      },
      {
        label: t('workspaceRoute.resultPanel.context.overview.labels.method'),
        value: activeDraftPresentation?.methodLabel ?? activeTab.methodLabel,
      },
      { label: t('workspaceRoute.resultPanel.context.overview.labels.tabSource'), value: activeTab.source },
      {
        label: t('workspaceRoute.resultPanel.context.overview.labels.placement'),
        value: formatRequestPlacementPath(
          activeDraftPlacementPathValue
            ? activeDraftPlacementPathValue
            : createTabPlacementValue(activeTab),
        ) ?? t('workspaceRoute.resultPanel.context.overview.values.notAvailable'),
      },
    ];
  }, [
    activeDraftPlacementPathValue,
    activeDraftPresentation,
    activeTab,
    collectionRecord,
    collectionSummary.requestCount,
    collectionSummary.requestGroupCount,
    isCollectionOverviewTab,
    isRequestGroupOverviewTab,
    requestGroupNodeLocation?.requestGroup.requests.length,
    requestGroupRecord,
    requestGroupSummary.requestCount,
    requestGroupSummary.requestGroupCount,
    t,
  ]);

  const inheritanceSections = useMemo(() => {
    if (!inheritanceSnapshot) {
      return [];
    }

    return [
      {
        key: 'variables',
        icon: 'params' as const,
        title: t('workspaceRoute.resultPanel.context.inheritance.sections.variables'),
        description: t('workspaceRoute.resultPanel.context.inheritance.sectionDescription'),
        effectiveValue: inheritanceSnapshot.variables.effective,
        overrideValue: inheritanceSnapshot.variables.override,
      },
      {
        key: 'auth',
        icon: 'auth' as const,
        title: t('workspaceRoute.resultPanel.context.inheritance.sections.auth'),
        description: t('workspaceRoute.resultPanel.context.inheritance.sectionDescription'),
        effectiveValue: inheritanceSnapshot.auth.effective,
        overrideValue: inheritanceSnapshot.auth.override,
      },
      {
        key: 'scripts',
        icon: 'scripts' as const,
        title: t('workspaceRoute.resultPanel.context.inheritance.sections.scripts'),
        description: t('workspaceRoute.resultPanel.context.inheritance.sectionDescription'),
        effectiveValue: inheritanceSnapshot.scripts.effective,
        overrideValue: inheritanceSnapshot.scripts.override,
      },
      {
        key: 'run-config',
        icon: 'settings' as const,
        title: t('workspaceRoute.resultPanel.context.inheritance.sections.runConfig'),
        description: t('workspaceRoute.resultPanel.context.inheritance.sectionDescription'),
        effectiveValue: inheritanceSnapshot.runConfig.effective,
        overrideValue: inheritanceSnapshot.runConfig.override,
      },
    ];
  }, [inheritanceSnapshot, t]);

  if (!activeTab) {
    return <RequestResultPanel activeTab={null} />;
  }

  return (
    <div className="workspace-context-panel">
      <PanelTabs
        ariaLabel={t('workspaceRoute.resultPanel.contextTabs.ariaLabel')}
        tabs={contextTabs}
        activeTab={activeContextTab}
        onChange={(tabId) => setActiveContextTab(tabId)}
      />

      {activeContextTab === 'overview' ? (
        <DetailViewerSection
          icon="overview"
          title={t('workspaceRoute.resultPanel.context.overview.title')}
          description={t('workspaceRoute.resultPanel.context.overview.description')}
          tone="muted"
        >
          <KeyValueMetaList items={contextOverviewItems} />
        </DetailViewerSection>
      ) : null}

      {activeContextTab === 'inheritance' && inheritanceSnapshot ? (
        <div className="workspace-context-panel__panel-stack">
          <DetailViewerSection
            icon="paths"
            title={t('workspaceRoute.resultPanel.context.inheritance.title')}
            description={t('workspaceRoute.resultPanel.context.inheritance.description')}
            className="workspace-context-panel__hero-section"
          >
            <p className="shared-readiness-note workspace-context-panel__support-note">{t('workspaceRoute.resultPanel.context.inheritance.note')}</p>
          </DetailViewerSection>

          <div className="workspace-context-panel__comparison-grid">
            {inheritanceSections.map((section) => (
              <ContextComparisonSection
                key={section.key}
                icon={section.icon}
                title={section.title}
                description={section.description}
                effectiveLabel={t('workspaceRoute.resultPanel.context.inheritance.labels.effective')}
                effectiveValue={section.effectiveValue}
                effectiveFallback={t('workspaceRoute.resultPanel.context.inheritance.values.none')}
                overrideLabel={t('workspaceRoute.resultPanel.context.inheritance.labels.override')}
                overrideValue={section.overrideValue}
                overrideFallback={t('workspaceRoute.resultPanel.context.inheritance.values.noOverride')}
              />
            ))}
          </div>
        </div>
      ) : null}

      {activeContextTab === 'runs' ? (
        isContainerOverviewTab ? (
          matchingContainerExecution ? (
            <div className="workspace-context-panel__panel-stack">
              <DetailViewerSection
                icon="run"
                title={t('workspaceRoute.resultPanel.context.runs.title')}
                description={t('workspaceRoute.resultPanel.context.runs.description')}
                className="workspace-context-panel__hero-section"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('workspaceRoute.resultPanel.context.runs.labels.scope'), value: matchingContainerExecution.containerType },
                    { label: t('workspaceRoute.resultPanel.context.runs.labels.outcome'), value: matchingContainerExecution.aggregateOutcome },
                    { label: t('workspaceRoute.resultPanel.context.runs.labels.totalRuns'), value: matchingContainerExecution.totalRuns },
                    { label: t('workspaceRoute.resultPanel.context.runs.labels.requests'), value: matchingContainerExecution.requestCount },
                    {
                      label: t('workspaceRoute.resultPanel.context.runs.labels.issues'),
                      value: matchingContainerExecution.failedCount + matchingContainerExecution.blockedCount + matchingContainerExecution.timedOutCount,
                    },
                    { label: t('workspaceRoute.resultPanel.context.runs.labels.history'), value: matchingContainerExecutions.length },
                    { label: t('workspaceRoute.resultPanel.context.runs.labels.iterationCount'), value: matchingContainerExecution.iterationCount ?? 1 },
                    {
                      label: t('workspaceRoute.resultPanel.context.runs.labels.continueOnError'),
                      value: matchingContainerExecution.continuedAfterFailure
                        ? t('workspaceRoute.resultPanel.context.runs.values.enabled')
                        : t('workspaceRoute.resultPanel.context.runs.values.disabled'),
                    },
                    {
                      label: t('workspaceRoute.resultPanel.context.runs.labels.environment'),
                      value: matchingContainerExecution.environmentOverrideApplied
                        ? matchingContainerExecution.selectedEnvironmentId ?? t('workspaceRoute.resultPanel.context.runs.values.noEnvironment')
                        : t('workspaceRoute.resultPanel.context.runs.values.inheritPerRequest'),
                    },
                    {
                      label: t('workspaceRoute.resultPanel.context.runs.labels.dataFilePath'),
                      value: matchingContainerExecution.dataFilePath ?? t('workspaceRoute.resultPanel.context.runs.values.notProvided'),
                    },
                    {
                      label: t('workspaceRoute.resultPanel.context.runs.labels.selection'),
                      value: Array.isArray(matchingContainerExecution.selectedRequestIds) && matchingContainerExecution.selectedRequestIds.length > 0
                        ? matchingContainerExecution.selectedRequestIds.length
                        : t('workspaceRoute.resultPanel.context.runs.values.allRequests'),
                    },
                    { label: t('workspaceRoute.resultPanel.context.runs.labels.status'), value: batchStatus },
                  ]}
                />
              </DetailViewerSection>

              <div className="workspace-context-panel__support-grid">
                <DetailViewerSection
                  icon="timeline"
                  title={t('workspaceRoute.resultPanel.context.runs.sections.stepsTitle')}
                  description={t('workspaceRoute.resultPanel.context.runs.sections.stepsDescription')}
                  tone="supporting"
                  className="workspace-context-panel__supporting-section"
                >
                  <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.context.runs.stepsAriaLabel')}>
                    {matchingContainerExecution.steps.map((step) => (
                      <li key={`context-run-${step.requestId}-${step.stepIndex}`}>
                        <strong>{step.requestName}</strong>
                        {step.iteration ? ` #${step.iteration}` : ''}: {step.execution.executionOutcome}
                      </li>
                    ))}
                  </ul>
                </DetailViewerSection>

                <DetailViewerSection
                  icon="history"
                  title={t('workspaceRoute.resultPanel.context.runs.sections.historyTitle')}
                  description={t('workspaceRoute.resultPanel.context.runs.sections.historyDescription')}
                  tone="supporting"
                  className="workspace-context-panel__supporting-section"
                >
                  <p className="shared-readiness-note workspace-context-panel__support-note">{t('workspaceRoute.resultPanel.context.runs.historySummary')}</p>
                  <ul className="history-preview-list" aria-label={t('workspaceRoute.resultPanel.context.runs.historyAriaLabel')}>
                    {matchingContainerExecutions.map((execution) => (
                      <li key={`context-run-history-${execution.batchExecutionId}`}>
                        <strong>{execution.aggregateOutcome}</strong> · {execution.startedAt} · {execution.totalRuns}
                      </li>
                    ))}
                  </ul>
                </DetailViewerSection>
              </div>
            </div>
          ) : (
            <DetailViewerSection
              icon="run"
              title={t('workspaceRoute.resultPanel.context.runs.title')}
              description={t('workspaceRoute.resultPanel.context.runs.description')}
              className="workspace-context-panel__hero-section"
            >
              <EmptyStateCallout
                title={t('workspaceRoute.resultPanel.context.runs.empty.title')}
                description={t('workspaceRoute.resultPanel.context.runs.empty.description')}
              />
            </DetailViewerSection>
          )
        ) : (
          <RequestResultPanel activeTab={activeTab} />
        )
      ) : null}
    </div>
  );
}







