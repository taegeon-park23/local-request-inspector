import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useReducer, useState } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import { useShellStore } from '@client/app/providers/shell-store';
import {
  createMockRule,
  deleteMockRule,
  exportMockRuleResource,
  listWorkspaceMockRules,
  mockRuleDetailQueryKey,
  readMockRule,
  setMockRuleEnabled,
  sortMockRuleRecords,
  updateMockRule,
  workspaceMockRulesQueryKey,
} from '@client/features/mocks/mock-rules.api';
import type {
  MockRuleBodyMatcherMode,
  MockRuleDetailTabId,
  MockRuleInput,
  MockRuleMatcherRow,
  MockRuleRecord,
  MockRuleResponseHeaderRow,
  MockRuleStateFilter,
  MockRuleStateLabel,
} from '@client/features/mocks/mock-rule.types';
import {
  mockRuleMatchesSearch,
  mockRuleMatchesStateFilter,
  useMocksStore,
} from '@client/features/mocks/state/mocks-store';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { PanelTabs } from '@client/shared/ui/PanelTabs';
import { SectionHeading } from '@client/shared/ui/SectionHeading';
import { IconLabel } from '@client/shared/ui/IconLabel';
import { StatusBadge } from '@client/shared/ui/StatusBadge';
import { downloadAuthoredResourceBundle } from '@client/features/workspace/resource-bundle.api';
import { RoutePanelTabsLayout } from '@client/features/route-panel-tabs-layout';
import { resolveApiErrorMessage } from '@client/shared/api-error-message';

type Translate = ReturnType<typeof useI18n>['t'];

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

let localRowSequence = 1;

function createLocalRowId(prefix: string) {
  const rowId = `${prefix}-${localRowSequence}`;
  localRowSequence += 1;
  return rowId;
}

function cloneMatcherRows(rows: MockRuleMatcherRow[] = []) {
  return rows.map((row) => ({ ...row }));
}

function cloneResponseHeaders(rows: MockRuleResponseHeaderRow[] = []) {
  return rows.map((row) => ({ ...row }));
}

function createDraft(rule: MockRuleInput | MockRuleRecord): MockRuleInput {
  return {
    name: rule.name,
    enabled: rule.enabled,
    priority: rule.priority,
    methodMode: rule.methodMode,
    method: rule.method,
    pathMode: rule.pathMode,
    pathValue: rule.pathValue,
    queryMatchers: cloneMatcherRows(rule.queryMatchers),
    headerMatchers: cloneMatcherRows(rule.headerMatchers),
    bodyMatcherMode: rule.bodyMatcherMode,
    bodyMatcherValue: rule.bodyMatcherValue,
    responseStatusCode: rule.responseStatusCode,
    responseHeaders: cloneResponseHeaders(rule.responseHeaders),
    responseBody: rule.responseBody,
    fixedDelayMs: rule.fixedDelayMs,
  };
}

function createMatcherRow(prefix: 'query' | 'header'): MockRuleMatcherRow {
  return { id: createLocalRowId(prefix), key: '', operator: 'equals', value: '', enabled: true };
}

function createResponseHeaderRow(): MockRuleResponseHeaderRow {
  return { id: createLocalRowId('response-header'), key: '', value: '', enabled: true };
}

function createDefaultNewMockRuleInput(): MockRuleInput {
  return {
    name: 'Untitled Mock Rule',
    enabled: false,
    priority: 100,
    methodMode: 'any',
    method: 'GET',
    pathMode: 'exact',
    pathValue: '',
    queryMatchers: [],
    headerMatchers: [],
    bodyMatcherMode: 'none',
    bodyMatcherValue: '',
    responseStatusCode: 200,
    responseHeaders: [{ id: createLocalRowId('response-header'), key: 'Content-Type', value: 'application/json', enabled: true }],
    responseBody: '{\n  "mocked": true\n}',
    fixedDelayMs: 0,
  };
}

function createRuleState(enabled: boolean): MockRuleStateLabel {
  return enabled ? 'Enabled' : 'Disabled';
}

function sortRules(records: MockRuleRecord[]) {
  return sortMockRuleRecords(records);
}

function createMockDetailTabs(t: Translate) {
  return [
    { id: 'overview', label: t('mocksRoute.detail.tabs.overview'), icon: 'overview' },
    { id: 'matchers', label: t('mocksRoute.detail.tabs.matchers'), icon: 'matchers' },
    { id: 'response', label: t('mocksRoute.detail.tabs.response'), icon: 'response' },
    { id: 'diagnostics', label: t('mocksRoute.detail.tabs.diagnostics'), icon: 'diagnostics' },
  ] as const;
}

function createMethodModeOptions(t: Translate) {
  return [
    { value: 'any', label: t('mocksRoute.detail.overview.methodModeOptions.any') },
    { value: 'exact', label: t('mocksRoute.detail.overview.methodModeOptions.exact') },
  ] as const;
}

function createPathModeOptions(t: Translate) {
  return [
    { value: 'exact', label: t('mocksRoute.detail.overview.pathModeOptions.exact') },
    { value: 'prefix', label: t('mocksRoute.detail.overview.pathModeOptions.prefix') },
  ] as const;
}

function createBodyMatcherModeOptions(t: Translate): Array<{ value: MockRuleBodyMatcherMode; label: string }> {
  return [
    { value: 'none', label: t('mocksRoute.detail.matchers.body.modeOptions.none') },
    { value: 'exact', label: t('mocksRoute.detail.matchers.body.modeOptions.exact') },
    { value: 'contains', label: t('mocksRoute.detail.matchers.body.modeOptions.contains') },
  ];
}

function createMatcherOperatorOptions(t: Translate) {
  return [
    { value: 'exists', label: t('mocksRoute.detail.matchers.operatorOptions.exists') },
    { value: 'equals', label: t('mocksRoute.detail.matchers.operatorOptions.equals') },
    { value: 'contains', label: t('mocksRoute.detail.matchers.operatorOptions.contains') },
  ] as const;
}

function createStateFilterOptions(t: Translate): Array<{ value: MockRuleStateFilter; label: string }> {
  return [
    { value: 'all', label: t('mocksRoute.filters.stateOptions.all') },
    { value: 'Enabled', label: t('mocksRoute.filters.stateOptions.enabled') },
    { value: 'Disabled', label: t('mocksRoute.filters.stateOptions.disabled') },
  ];
}

function summarizeMatcherRows(rows: MockRuleMatcherRow[], emptyLabel: string, t: Translate) {
  const activeRows = rows.filter((row) => row.enabled !== false && row.key.trim().length > 0);
  if (activeRows.length === 0) {
    return emptyLabel;
  }

  return activeRows.map((row) => {
    if (row.operator === 'exists') {
      return t('mocksRoute.helpers.matcherRowExists', { key: row.key });
    }
    if (row.operator === 'contains') {
      return t('mocksRoute.helpers.matcherRowContains', { key: row.key, value: row.value });
    }
    return t('mocksRoute.helpers.matcherRowEquals', { key: row.key, value: row.value });
  }).join(' · ');
}

function summarizeResponseHeaders(rows: MockRuleResponseHeaderRow[], t: Translate) {
  const activeRows = rows.filter((row) => row.enabled !== false && row.key.trim().length > 0);
  return activeRows.length === 0
    ? t('mocksRoute.helpers.responseHeadersNone')
    : t('mocksRoute.helpers.responseHeadersCount', { count: activeRows.length });
}

function presentDraft(draft: MockRuleInput, sourceLabel: string, t: Translate) {
  const methodSummary = draft.methodMode === 'any'
    ? t('mocksRoute.helpers.methodAny')
    : t('mocksRoute.helpers.methodExact', { method: draft.method });
  const pathSummary = draft.pathMode === 'prefix'
    ? t('mocksRoute.helpers.pathPrefix', { path: draft.pathValue || t('mocksRoute.helpers.missingPath') })
    : t('mocksRoute.helpers.pathExact', { path: draft.pathValue || t('mocksRoute.helpers.missingPath') });
  const querySummary = summarizeMatcherRows(draft.queryMatchers, t('mocksRoute.helpers.noQueryMatcher'), t);
  const headerSummary = summarizeMatcherRows(draft.headerMatchers, t('mocksRoute.helpers.noHeaderMatcher'), t);
  const bodySummary = draft.bodyMatcherMode === 'none'
    ? t('mocksRoute.helpers.noBodyMatcher')
    : draft.bodyMatcherMode === 'contains'
      ? t('mocksRoute.helpers.bodyContains', { value: draft.bodyMatcherValue || t('mocksRoute.helpers.missingText') })
      : t('mocksRoute.helpers.bodyExact', { value: draft.bodyMatcherValue || t('mocksRoute.helpers.missingText') });
  const fixedDelayLabel = draft.fixedDelayMs > 0
    ? t('mocksRoute.helpers.fixedDelayValue', { delayMs: draft.fixedDelayMs })
    : t('mocksRoute.helpers.fixedDelayNone');

  return {
    ruleState: createRuleState(draft.enabled),
    methodSummary,
    pathSummary,
    querySummary,
    headerSummary,
    bodySummary,
    matcherSummary: [methodSummary, pathSummary, querySummary, headerSummary, bodySummary].join(' · '),
    responseSummary: draft.fixedDelayMs > 0
      ? t('mocksRoute.helpers.responseSummaryWithDelay', { statusCode: draft.responseStatusCode, delayMs: draft.fixedDelayMs })
      : t('mocksRoute.helpers.responseSummary', { statusCode: draft.responseStatusCode }),
    responseHeadersSummary: summarizeResponseHeaders(draft.responseHeaders, t),
    responseBodyPreview: draft.responseBody.trim().length > 0 ? draft.responseBody : '{\n  "mocked": true\n}',
    fixedDelayLabel,
    sourceLabel,
  };
}

function getSaveDisabledReason(draft: MockRuleInput, isSaving: boolean, t: Translate) {
  if (isSaving) {
    return t('mocksRoute.helpers.saveDisabled.saving');
  }
  if (draft.name.trim().length === 0) {
    return t('mocksRoute.helpers.saveDisabled.nameRequired');
  }
  if (draft.pathValue.trim().length === 0) {
    return t('mocksRoute.helpers.saveDisabled.pathRequired');
  }
  if (draft.bodyMatcherMode !== 'none' && draft.bodyMatcherValue.trim().length === 0) {
    return t('mocksRoute.helpers.saveDisabled.bodyRequired');
  }
  if (!Number.isFinite(draft.responseStatusCode) || draft.responseStatusCode < 100 || draft.responseStatusCode > 599) {
    return t('mocksRoute.helpers.saveDisabled.statusCodeRange');
  }
  if (!Number.isFinite(draft.fixedDelayMs) || draft.fixedDelayMs < 0 || draft.fixedDelayMs > 2000) {
    return t('mocksRoute.helpers.saveDisabled.fixedDelayRange');
  }
  return null;
}

function mutationMessage(errors: Array<Error | null>) {
  return errors.find(Boolean)?.message ?? null;
}

function upsertRule(records: MockRuleRecord[] | undefined, nextRule: MockRuleRecord) {
  return sortRules([nextRule, ...(records ?? []).filter((record) => record.id !== nextRule.id)]);
}

type MockRuleDraftAction = { type: 'replace'; draft: MockRuleInput };

function mockRuleDraftReducer(_state: MockRuleInput, action: MockRuleDraftAction) {
  return action.draft;
}

interface MockResourceTransferStatus {
  tone: 'success' | 'error' | 'info';
  message: string;
}

interface MatcherEditorProps {
  title: string;
  description: string;
  addLabel: string;
  rowType: 'query' | 'header';
  keyLabel: string;
  operatorLabel: string;
  valueLabel: string;
  removeLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  operatorOptions: ReadonlyArray<{ value: MockRuleMatcherRow['operator']; label: string }>;
  rows: MockRuleMatcherRow[];
  onChange: (rows: MockRuleMatcherRow[]) => void;
}

function MatcherEditor({
  title,
  description,
  addLabel,
  rowType,
  keyLabel,
  operatorLabel,
  valueLabel,
  removeLabel,
  emptyTitle,
  emptyDescription,
  operatorOptions,
  rows,
  onChange,
}: MatcherEditorProps) {
  return (
    <DetailViewerSection
      title={title}
      description={description}
      actions={(
        <button
          type="button"
          className="workspace-button workspace-button--secondary"
          onClick={() => onChange([...rows, createMatcherRow(rowType)])}
        >
          {addLabel}
        </button>
      )}
    >
      {rows.length === 0 ? (
        <EmptyStateCallout
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="request-row-editor-list">
          {rows.map((row, index) => (
            <div key={row.id} className="request-row-editor">
              <label className="request-field">
                <span>{keyLabel}</span>
                <input
                  aria-label={`${keyLabel} ${index + 1}`}
                  type="text"
                  value={row.key}
                  onChange={(event) =>
                    onChange(rows.map((currentRow) => (
                      currentRow.id === row.id ? { ...currentRow, key: event.currentTarget.value } : currentRow
                    )))
                  }
                />
              </label>
              <label className="request-field">
                <span>{operatorLabel}</span>
                <select
                  aria-label={`${operatorLabel} ${index + 1}`}
                  value={row.operator}
                  onChange={(event) =>
                    onChange(rows.map((currentRow) => (
                      currentRow.id === row.id
                        ? {
                            ...currentRow,
                            operator: event.currentTarget.value as MockRuleMatcherRow['operator'],
                            ...(event.currentTarget.value === 'exists' ? { value: '' } : {}),
                          }
                        : currentRow
                    )))
                  }
                >
                  {operatorOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="request-field">
                <span>{valueLabel}</span>
                <input
                  aria-label={`${valueLabel} ${index + 1}`}
                  type="text"
                  value={row.value}
                  disabled={row.operator === 'exists'}
                  onChange={(event) =>
                    onChange(rows.map((currentRow) => (
                      currentRow.id === row.id ? { ...currentRow, value: event.currentTarget.value } : currentRow
                    )))
                  }
                />
              </label>
              <button
                type="button"
                className="workspace-button workspace-button--ghost"
                onClick={() => onChange(rows.filter((currentRow) => currentRow.id !== row.id))}
              >
                {removeLabel}
              </button>
            </div>
          ))}
        </div>
      )}
    </DetailViewerSection>
  );
}

export function MocksRoute() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const setFloatingExplorerOpen = useShellStore((state) => state.setFloatingExplorerOpen);
  const mockDetailTabs = createMockDetailTabs(t);
  const methodModeOptions = createMethodModeOptions(t);
  const pathModeOptions = createPathModeOptions(t);
  const bodyMatcherModeOptions = createBodyMatcherModeOptions(t);
  const matcherOperatorOptions = createMatcherOperatorOptions(t);
  const stateFilterOptions = createStateFilterOptions(t);
  const [activeDetailTab, setActiveDetailTab] = useState<MockRuleDetailTabId>('overview');
  const [resourceTransferStatus, setResourceTransferStatus] = useState<MockResourceTransferStatus | null>(null);
  const [draft, draftDispatch] = useReducer(mockRuleDraftReducer, createDefaultNewMockRuleInput(), createDraft);
  const selectedRuleId = useMocksStore((state) => state.selectedRuleId);
  const searchText = useMocksStore((state) => state.searchText);
  const stateFilter = useMocksStore((state) => state.stateFilter);
  const isCreatingRule = useMocksStore((state) => state.isCreatingRule);
  const selectRule = useMocksStore((state) => state.selectRule);
  const clearSelection = useMocksStore((state) => state.clearSelection);
  const setSearchText = useMocksStore((state) => state.setSearchText);
  const setStateFilter = useMocksStore((state) => state.setStateFilter);
  const startCreatingRule = useMocksStore((state) => state.startCreatingRule);
  const finishCreatingRule = useMocksStore((state) => state.finishCreatingRule);

  const listQuery = useQuery({
    queryKey: workspaceMockRulesQueryKey,
    queryFn: listWorkspaceMockRules,
  });

  const listItems = sortRules(listQuery.data ?? []);
  const filteredRules = listItems.filter(
    (rule) => mockRuleMatchesSearch(rule, searchText) && mockRuleMatchesStateFilter(rule, stateFilter),
  );
  const effectiveSelectedRuleId = !isCreatingRule
    ? (filteredRules.some((rule) => rule.id === selectedRuleId) ? selectedRuleId : (filteredRules[0]?.id ?? null))
    : null;

  const detailQuery = useQuery({
    queryKey: mockRuleDetailQueryKey(effectiveSelectedRuleId),
    queryFn: () => readMockRule(effectiveSelectedRuleId!),
    enabled: effectiveSelectedRuleId !== null && !isCreatingRule,
  });

  const selectedRule = !isCreatingRule
    ? (detailQuery.data ?? filteredRules.find((rule) => rule.id === effectiveSelectedRuleId) ?? null)
    : null;

  useEffect(() => {
    if (isCreatingRule) {
      draftDispatch({ type: 'replace', draft: createDraft(createDefaultNewMockRuleInput()) });
      return;
    }

    if (selectedRule) {
      draftDispatch({ type: 'replace', draft: createDraft(selectedRule) });
    }
  }, [isCreatingRule, selectedRule]);

  const setDraft = (nextDraft: MockRuleInput | ((current: MockRuleInput) => MockRuleInput)) => {
    draftDispatch({
      type: 'replace',
      draft: typeof nextDraft === 'function' ? nextDraft(draft) : nextDraft,
    });
  };

  const syncRuleCache = (rule: MockRuleRecord) => {
    queryClient.setQueryData<MockRuleRecord[]>(workspaceMockRulesQueryKey, (current) => upsertRule(current, rule));
    queryClient.setQueryData(mockRuleDetailQueryKey(rule.id), rule);
  };

  const createRuleMutation = useMutation({
    mutationFn: createMockRule,
    onSuccess: (rule) => {
      syncRuleCache(rule);
      finishCreatingRule(rule.id);
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ mockRuleId, rule }: { mockRuleId: string; rule: MockRuleInput }) => updateMockRule(mockRuleId, rule),
    onSuccess: (rule) => {
      syncRuleCache(rule);
      selectRule(rule.id);
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ mockRuleId, enabled }: { mockRuleId: string; enabled: boolean }) => setMockRuleEnabled(mockRuleId, enabled),
    onSuccess: (rule) => {
      syncRuleCache(rule);
      selectRule(rule.id);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteMockRule,
    onSuccess: (deletedRuleId) => {
      queryClient.setQueryData<MockRuleRecord[]>(workspaceMockRulesQueryKey, (current) => (current ?? []).filter((rule) => rule.id !== deletedRuleId));
      queryClient.removeQueries({ queryKey: mockRuleDetailQueryKey(deletedRuleId) });
      clearSelection();
    },
  });

  const exportRuleMutation = useMutation({
    mutationFn: async (mockRuleId: string) => {
      const bundle = await exportMockRuleResource(mockRuleId);
      const exportedRuleName = bundle.mockRules[0]?.name || 'mock-rule';
      const fileNameBase = `local-request-inspector-${bundle.workspaceId}-${exportedRuleName.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'mock-rule'}`;
      downloadAuthoredResourceBundle(bundle, fileNameBase);
      return bundle;
    },
    onSuccess: (bundle) => {
      const exportedRuleName = bundle.mockRules[0]?.name || t('mocksRoute.helpers.untitledRule');
      setResourceTransferStatus({
        tone: 'success',
        message: t('mocksRoute.helpers.exportSuccess', { name: exportedRuleName }),
      });
    },
    onError: (error) => {
      setResourceTransferStatus({
        tone: 'error',
        message: resolveApiErrorMessage(error, t('mocksRoute.helpers.exportFailure'), t),
      });
    },
  });

  const isListLoading = listQuery.isPending && !listQuery.data;
  const isDetailLoading = effectiveSelectedRuleId !== null && !isCreatingRule && detailQuery.isPending && !detailQuery.data;
  const isEmpty = !isListLoading && listItems.length === 0;
  const hasNoFilteredResults = !isListLoading && listItems.length > 0 && filteredRules.length === 0;
  const degradedReason = listQuery.error
    ? resolveApiErrorMessage(listQuery.error, t('mocksRoute.helpers.degradedReasonFallback'), t)
    : detailQuery.error
      ? resolveApiErrorMessage(detailQuery.error, t('mocksRoute.helpers.degradedReasonFallback'), t)
      : t('mocksRoute.helpers.degradedReasonFallback');
  const isSaving = createRuleMutation.isPending || updateRuleMutation.isPending;
  const saveDisabledReason = getSaveDisabledReason(draft, isSaving, t);
  const quickToggleDisabledReason = isCreatingRule
    ? t('mocksRoute.helpers.quickToggleDisabled.createFirst')
    : toggleRuleMutation.isPending
      ? t('mocksRoute.helpers.quickToggleDisabled.updating')
      : null;
  const deleteDisabledReason = isCreatingRule
    ? t('mocksRoute.helpers.deleteDisabled.discardDraft')
    : deleteRuleMutation.isPending
      ? t('mocksRoute.helpers.deleteDisabled.deleting')
      : null;
  const currentPresentation = presentDraft(
    draft,
    isCreatingRule ? t('mocksRoute.helpers.sourceLabels.unsaved') : t('mocksRoute.helpers.sourceLabels.persisted'),
    t,
  );
  const currentError = mutationMessage([
    createRuleMutation.error as Error | null,
    updateRuleMutation.error as Error | null,
    toggleRuleMutation.error as Error | null,
    deleteRuleMutation.error as Error | null,
  ]);

  const handleSaveRule = () => {
    if (saveDisabledReason) {
      return;
    }

    if (isCreatingRule) {
      createRuleMutation.mutate(draft);
      return;
    }

    if (selectedRule) {
      updateRuleMutation.mutate({ mockRuleId: selectedRule.id, rule: draft });
    }
  };

  const handleToggleRuleEnabled = () => {
    if (!selectedRule || quickToggleDisabledReason) {
      return;
    }

    toggleRuleMutation.mutate({ mockRuleId: selectedRule.id, enabled: !selectedRule.enabled });
  };

  const handleDeleteRule = () => {
    if (!selectedRule || deleteDisabledReason) {
      return;
    }

    deleteRuleMutation.mutate(selectedRule.id);
  };

  const handleSelectRule = (ruleId: string) => {
    selectRule(ruleId);
    setFloatingExplorerOpen('mocks', false);
  };

  const handleStartCreatingRule = () => {
    startCreatingRule();
    setFloatingExplorerOpen('mocks', false);
  };

  const handleCancelDraft = () => {
    if (listItems[0]) {
      selectRule(listItems[0].id);
      return;
    }

    clearSelection();
  };

  return (
    <RoutePanelTabsLayout
      layoutMode="floating-explorer"
      floatingExplorerRouteKey="mocks"
      floatingExplorerVariant="focused-overlay"
      floatingBalancedMinWidth={1200}
      collapseFloatingExplorerOnStacked
      defaultActiveTab="explorer"
      explorer={(
        <section className="shell-panel shell-panel--sidebar" aria-label={t('shell.routePanels.explorerRegion')}>
        <div className="mocks-explorer">
          <header className="mocks-explorer__header">
            <div>
              <p className="section-placeholder__eyebrow">{t('mocksRoute.sidebar.eyebrow')}</p>
              <h2>{t('mocksRoute.sidebar.title')}</h2>
              <p className="observation-explorer__status-line">{t('mocksRoute.sidebar.description')}</p>
            </div>
            <button type="button" className="workspace-button workspace-button--secondary" onClick={handleStartCreatingRule}>
              <IconLabel icon="new">{t('mocksRoute.sidebar.newRule')}</IconLabel>
            </button>
          </header>

          <div className="mocks-filter-grid">
            <label className="request-field">
              <span>{t('mocksRoute.filters.searchLabel')}</span>
              <input aria-label={t('mocksRoute.filters.searchLabel')} type="text" value={searchText} onChange={(event) => setSearchText(event.currentTarget.value)} />
            </label>
            <label className="request-field request-field--compact">
              <span>{t('mocksRoute.filters.stateFilterLabel')}</span>
              <select
                aria-label={t('mocksRoute.filters.stateFilterLabel')}
                value={stateFilter}
                onChange={(event) => setStateFilter(event.currentTarget.value as MockRuleStateFilter)}
              >
                {stateFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {isListLoading ? <EmptyStateCallout title={t('mocksRoute.empty.loadingList.title')} description={t('mocksRoute.empty.loadingList.description')} className="mocks-empty-state" /> : null}
          {listQuery.isError ? <EmptyStateCallout title={t('mocksRoute.empty.degraded.title')} description={t('mocksRoute.empty.degraded.description', { reason: degradedReason })} /> : null}
          {isEmpty ? <EmptyStateCallout title={t('mocksRoute.empty.noItems.title')} description={t('mocksRoute.empty.noItems.description')} className="mocks-empty-state" /> : null}
          {hasNoFilteredResults ? <EmptyStateCallout title={t('mocksRoute.empty.noFilteredItems.title')} description={t('mocksRoute.empty.noFilteredItems.description')} className="mocks-empty-state" /> : null}

          {filteredRules.length > 0 ? (
            <ul className="mocks-list" aria-label={t('mocksRoute.filters.listAriaLabel')}>
              {filteredRules.map((rule) => {
                const isSelected = !isCreatingRule && rule.id === effectiveSelectedRuleId;
                const listPresentation = presentDraft(createDraft(rule), t('mocksRoute.helpers.sourceLabels.persisted'), t);

                return (
                  <li key={rule.id}>
                    <button
                      type="button"
                      className={isSelected ? 'mocks-row mocks-row--selected' : 'mocks-row'}
                      aria-label={t('mocksRoute.helpers.openRuleAction', { name: rule.name })}
                      aria-pressed={isSelected}
                      data-rule-state={rule.ruleState === 'Enabled' ? 'enabled' : 'disabled'}
                      onClick={() => handleSelectRule(rule.id)}
                    >
                      <span className="mocks-row__top">
                        <StatusBadge kind="neutral" value={rule.ruleState} />
                        <span className="workspace-chip">{t('mocksRoute.helpers.priorityChip', { priority: rule.priority })}</span>
                      </span>
                      <span className="mocks-row__title">{rule.name}</span>
                      <span className="mocks-row__summary">{listPresentation.pathSummary}</span>
                      <span className="mocks-row__meta">{listPresentation.responseSummary} · {listPresentation.fixedDelayLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        </section>
      )}
      main={(
        <section className="shell-panel shell-panel--main" aria-label={t('shell.routePanels.mainRegion')}>
        <SectionHeading
            icon="mocks"
            title={t('routes.mocks.title')}
            summary={t('routes.mocks.summary')}
          >
            <div className="workspace-explorer__role-strip" aria-label="Mocks route role">
              <span className="workspace-chip">{t('roles.management')}</span>
              <span className="workspace-chip workspace-chip--secondary">{t('routes.mocks.contextChip')}</span>
            </div>
          </SectionHeading>

        {isListLoading && !isCreatingRule ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout title={t('mocksRoute.empty.loadingDetail.title')} description={t('mocksRoute.empty.loadingDetail.description')} />
          </div>
        ) : !isCreatingRule && !selectedRule ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout title={t('mocksRoute.empty.noSelection.title')} description={t('mocksRoute.empty.noSelection.description')} />
          </div>
        ) : isDetailLoading ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout title={t('mocksRoute.empty.loadingPersistedDetail.title')} description={t('mocksRoute.empty.loadingPersistedDetail.description')} />
          </div>
        ) : detailQuery.isError && !isCreatingRule ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout title={t('mocksRoute.empty.detailDegraded.title')} description={t('mocksRoute.empty.detailDegraded.description', { reason: degradedReason })} />
          </div>
        ) : (
          <div className="mocks-detail">
            <header className="mocks-detail__header observation-detail__header">
              <div>
                <p className="section-placeholder__eyebrow">{isCreatingRule ? t('mocksRoute.detail.header.draftEyebrow') : t('mocksRoute.detail.header.persistedEyebrow')}</p>
                <h2>{isCreatingRule ? t('mocksRoute.detail.header.createTitle') : t('mocksRoute.detail.header.editTitle')}</h2>
                <p>{currentPresentation.matcherSummary}</p>
                <p className="observation-detail__header-meta">{currentPresentation.fixedDelayLabel} · {currentPresentation.sourceLabel}</p>
                <div className="workspace-explorer__role-strip" aria-label="Mock rule detail role">
                  <span className="workspace-chip">{t('roles.management')}</span>
                  <span className="workspace-chip workspace-chip--secondary">{t('mocksRoute.detail.header.authoredRuleChip')}</span>
                </div>
              </div>
              <div className="request-work-surface__badges observation-detail__badge-rail" data-badge-contained="true">
                <StatusBadge kind="neutral" value={currentPresentation.ruleState} />
                <span className="workspace-chip">{t('mocksRoute.helpers.priorityChip', { priority: draft.priority })}</span>
              </div>
            </header>

            <DetailViewerSection
              title={t('mocksRoute.detail.boundary.title')}
              description={t('mocksRoute.detail.boundary.description')}
              className="mocks-summary-card mocks-summary-card--boundary"
              actions={(
                <div className="request-work-surface__future-actions">
                  <button type="button" className="workspace-button workspace-button--secondary" onClick={handleSaveRule} disabled={saveDisabledReason !== null}>
                    <IconLabel icon="save">{isCreatingRule ? t('mocksRoute.detail.boundary.actions.createRule') : t('mocksRoute.detail.boundary.actions.saveRule')}</IconLabel>
                  </button>
                  <button type="button" className="workspace-button workspace-button--secondary" onClick={handleToggleRuleEnabled} disabled={quickToggleDisabledReason !== null}>
                    <IconLabel icon={selectedRule?.enabled ? 'disable' : 'enable'}>{selectedRule?.enabled ? t('mocksRoute.detail.boundary.actions.disableRule') : t('mocksRoute.detail.boundary.actions.enableRule')}</IconLabel>
                  </button>
                  {!isCreatingRule && selectedRule ? (
                    <button
                      type="button"
                      className="workspace-button workspace-button--secondary"
                      onClick={() => exportRuleMutation.mutate(selectedRule.id)}
                      disabled={exportRuleMutation.isPending}
                    >
                      <IconLabel icon="export">{exportRuleMutation.isPending ? t('mocksRoute.detail.boundary.actions.exportingRule') : t('mocksRoute.detail.boundary.actions.exportRule')}</IconLabel>
                    </button>
                  ) : null}
                  {isCreatingRule ? (
                    <button type="button" className="workspace-button workspace-button--ghost" onClick={handleCancelDraft}>
                      <IconLabel icon="pending">{t('mocksRoute.detail.boundary.actions.cancelDraft')}</IconLabel>
                    </button>
                  ) : (
                    <button type="button" className="workspace-button workspace-button--ghost" onClick={handleDeleteRule} disabled={deleteDisabledReason !== null}>
                      <IconLabel icon="delete">{t('mocksRoute.detail.boundary.actions.deleteRule')}</IconLabel>
                    </button>
                  )}
                </div>
              )}
            >
              <p className="shared-readiness-note">
                {saveDisabledReason ?? quickToggleDisabledReason ?? deleteDisabledReason ?? t('mocksRoute.detail.boundary.fallbackReadiness')}
              </p>
              {resourceTransferStatus ? (
                <p className={`workspace-explorer__status workspace-explorer__status--${resourceTransferStatus.tone}`}>
                  {resourceTransferStatus.message}
                </p>
              ) : null}
              {currentError ? <EmptyStateCallout title={t('mocksRoute.detail.boundary.mutationFailedTitle')} description={currentError} /> : null}
            </DetailViewerSection>

            <div className="mocks-summary-grid">
              <DetailViewerSection title={t('mocksRoute.detail.summaryCards.rule.title')} description={t('mocksRoute.detail.summaryCards.rule.description')} className="mocks-summary-card mocks-summary-card--rule">
                <KeyValueMetaList
                  items={[
                    { label: t('mocksRoute.detail.summaryCards.rule.labels.name'), value: draft.name || t('mocksRoute.helpers.untitledRule') },
                    { label: t('mocksRoute.detail.summaryCards.rule.labels.state'), value: currentPresentation.ruleState },
                    { label: t('mocksRoute.detail.summaryCards.rule.labels.priority'), value: draft.priority },
                    { label: t('mocksRoute.detail.summaryCards.rule.labels.source'), value: currentPresentation.sourceLabel },
                  ]}
                />
              </DetailViewerSection>

              <DetailViewerSection title={t('mocksRoute.detail.summaryCards.evaluation.title')} description={t('mocksRoute.detail.summaryCards.evaluation.description')} className="mocks-summary-card mocks-summary-card--evaluation" tone="supporting">
                <KeyValueMetaList
                  items={[
                    { label: t('mocksRoute.detail.summaryCards.evaluation.labels.matcherSummary'), value: currentPresentation.matcherSummary },
                    { label: t('mocksRoute.detail.summaryCards.evaluation.labels.responseSummary'), value: currentPresentation.responseSummary },
                    { label: t('mocksRoute.detail.summaryCards.evaluation.labels.delayHint'), value: currentPresentation.fixedDelayLabel },
                  ]}
                />
              </DetailViewerSection>
            </div>

            <PanelTabs ariaLabel={t('mocksRoute.detail.tabs.ariaLabel')} tabs={mockDetailTabs} activeTab={activeDetailTab} onChange={setActiveDetailTab} />

            {activeDetailTab === 'overview' ? (
              <DetailViewerSection title={t('mocksRoute.detail.overview.title')} description={t('mocksRoute.detail.overview.description')} className="mocks-summary-card mocks-summary-card--overview">
                <div className="request-editor-card__grid">
                  <label className="request-field">
                    <span>{t('mocksRoute.detail.overview.labels.ruleName')}</span>
                    <input aria-label={t('mocksRoute.detail.overview.labels.ruleName')} type="text" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.currentTarget.value }))} />
                  </label>
                  <label className="request-field request-field--toggle">
                    <span>{t('mocksRoute.detail.overview.labels.ruleEnabled')}</span>
                    <input aria-label={t('mocksRoute.detail.overview.labels.ruleEnabled')} type="checkbox" checked={draft.enabled} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.currentTarget.checked }))} />
                  </label>
                  <label className="request-field">
                    <span>{t('mocksRoute.detail.overview.labels.priority')}</span>
                    <input aria-label={t('mocksRoute.detail.overview.labels.rulePriority')} type="number" value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: Number(event.currentTarget.value) || 0 }))} />
                  </label>
                  <label className="request-field">
                    <span>{t('mocksRoute.detail.overview.labels.methodMatch')}</span>
                    <select aria-label={t('mocksRoute.detail.overview.labels.methodMatch')} value={draft.methodMode} onChange={(event) => setDraft((current) => ({ ...current, methodMode: event.currentTarget.value as MockRuleInput['methodMode'] }))}>
                      {methodModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="request-field">
                    <span>{t('mocksRoute.detail.overview.labels.httpMethod')}</span>
                    <select aria-label={t('mocksRoute.detail.overview.labels.httpMethod')} value={draft.method} disabled={draft.methodMode === 'any'} onChange={(event) => setDraft((current) => ({ ...current, method: event.currentTarget.value as MockRuleInput['method'] }))}>
                      {httpMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                    </select>
                  </label>
                  <label className="request-field">
                    <span>{t('mocksRoute.detail.overview.labels.pathMatch')}</span>
                    <select aria-label={t('mocksRoute.detail.overview.labels.pathMatch')} value={draft.pathMode} onChange={(event) => setDraft((current) => ({ ...current, pathMode: event.currentTarget.value as MockRuleInput['pathMode'] }))}>
                      {pathModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="request-field request-field--wide">
                    <span>{t('mocksRoute.detail.overview.labels.pathValue')}</span>
                    <input aria-label={t('mocksRoute.detail.overview.labels.pathValue')} type="text" placeholder={t('mocksRoute.detail.overview.placeholders.pathValue')} value={draft.pathValue} onChange={(event) => setDraft((current) => ({ ...current, pathValue: event.currentTarget.value }))} />
                  </label>
                </div>
              </DetailViewerSection>
            ) : null}

            {activeDetailTab === 'matchers' ? (
              <div className="mocks-summary-grid">
                <MatcherEditor
                  title={t('mocksRoute.detail.matchers.query.title')}
                  description={t('mocksRoute.detail.matchers.query.description')}
                  addLabel={t('mocksRoute.detail.matchers.query.addLabel')}
                  rowType="query"
                  keyLabel={t('mocksRoute.detail.matchers.query.labels.key')}
                  operatorLabel={t('mocksRoute.detail.matchers.labels.operator')}
                  valueLabel={t('mocksRoute.detail.matchers.labels.value')}
                  removeLabel={t('mocksRoute.detail.matchers.labels.remove')}
                  emptyTitle={t('mocksRoute.detail.matchers.query.emptyTitle')}
                  emptyDescription={t('mocksRoute.detail.matchers.query.emptyDescription')}
                  operatorOptions={matcherOperatorOptions}
                  rows={draft.queryMatchers}
                  onChange={(queryMatchers) => setDraft((current) => ({ ...current, queryMatchers }))}
                />
                <MatcherEditor
                  title={t('mocksRoute.detail.matchers.header.title')}
                  description={t('mocksRoute.detail.matchers.header.description')}
                  addLabel={t('mocksRoute.detail.matchers.header.addLabel')}
                  rowType="header"
                  keyLabel={t('mocksRoute.detail.matchers.header.labels.key')}
                  operatorLabel={t('mocksRoute.detail.matchers.labels.operator')}
                  valueLabel={t('mocksRoute.detail.matchers.labels.value')}
                  removeLabel={t('mocksRoute.detail.matchers.labels.remove')}
                  emptyTitle={t('mocksRoute.detail.matchers.header.emptyTitle')}
                  emptyDescription={t('mocksRoute.detail.matchers.header.emptyDescription')}
                  operatorOptions={matcherOperatorOptions}
                  rows={draft.headerMatchers}
                  onChange={(headerMatchers) => setDraft((current) => ({ ...current, headerMatchers }))}
                />
                <DetailViewerSection title={t('mocksRoute.detail.matchers.body.title')} description={t('mocksRoute.detail.matchers.body.description')} className="mocks-summary-card mocks-summary-card--matchers">
                  <div className="request-editor-card__grid">
                    <label className="request-field">
                      <span>{t('mocksRoute.detail.matchers.body.labels.mode')}</span>
                      <select
                        aria-label={t('mocksRoute.detail.matchers.body.labels.mode')}
                        value={draft.bodyMatcherMode}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            bodyMatcherMode: event.currentTarget.value as MockRuleBodyMatcherMode,
                            ...(event.currentTarget.value === 'none' ? { bodyMatcherValue: '' } : {}),
                          }))}
                      >
                        {bodyMatcherModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="request-field request-field--wide">
                      <span>{t('mocksRoute.detail.matchers.body.labels.value')}</span>
                      <input aria-label={t('mocksRoute.detail.matchers.body.labels.value')} type="text" value={draft.bodyMatcherValue} disabled={draft.bodyMatcherMode === 'none'} onChange={(event) => setDraft((current) => ({ ...current, bodyMatcherValue: event.currentTarget.value }))} />
                    </label>
                  </div>
                </DetailViewerSection>
              </div>
            ) : null}

            {activeDetailTab === 'response' ? (
              <div className="mocks-summary-grid">
                <DetailViewerSection title={t('mocksRoute.detail.response.responseCard.title')} description={t('mocksRoute.detail.response.responseCard.description')} className="mocks-summary-card mocks-summary-card--response">
                  <div className="request-editor-card__grid">
                    <label className="request-field">
                      <span>{t('mocksRoute.detail.response.responseCard.labels.status')}</span>
                      <input aria-label={t('mocksRoute.detail.response.responseCard.labels.status')} type="number" value={draft.responseStatusCode} onChange={(event) => setDraft((current) => ({ ...current, responseStatusCode: Number(event.currentTarget.value) || 0 }))} />
                    </label>
                    <label className="request-field">
                      <span>{t('mocksRoute.detail.response.responseCard.labels.fixedDelay')}</span>
                      <input aria-label={t('mocksRoute.detail.response.responseCard.labels.fixedDelayAria')} type="number" min="0" max="2000" value={draft.fixedDelayMs} onChange={(event) => setDraft((current) => ({ ...current, fixedDelayMs: Number(event.currentTarget.value) || 0 }))} />
                    </label>
                    <label className="request-field request-field--wide">
                      <span>{t('mocksRoute.detail.response.responseCard.labels.body')}</span>
                      <textarea aria-label={t('mocksRoute.detail.response.responseCard.labels.body')} value={draft.responseBody} onChange={(event) => setDraft((current) => ({ ...current, responseBody: event.currentTarget.value }))} />
                    </label>
                  </div>
                  <div className="shared-support-block shared-support-block--preview">
                    <pre className="mocks-preview-block" data-preview-contained="true">{currentPresentation.responseBodyPreview}</pre>
                  </div>
                </DetailViewerSection>

                <DetailViewerSection
                  title={t('mocksRoute.detail.response.headersCard.title')}
                  description={t('mocksRoute.detail.response.headersCard.description')}
                  className="mocks-summary-card mocks-summary-card--headers"
                  actions={(
                    <button type="button" className="workspace-button workspace-button--secondary" onClick={() => setDraft((current) => ({ ...current, responseHeaders: [...current.responseHeaders, createResponseHeaderRow()] }))}>
                      <IconLabel icon="add">{t('mocksRoute.detail.response.headersCard.addLabel')}</IconLabel>
                    </button>
                  )}
                >
                  {draft.responseHeaders.length === 0 ? (
                    <EmptyStateCallout title={t('mocksRoute.detail.response.headersCard.emptyTitle')} description={t('mocksRoute.detail.response.headersCard.emptyDescription')} />
                  ) : (
                    <div className="request-row-editor-list">
                      {draft.responseHeaders.map((row, index) => (
                        <div key={row.id} className="request-row-editor">
                          <label className="request-field">
                            <span>{t('mocksRoute.detail.response.headersCard.labels.name')}</span>
                            <input aria-label={`${t('mocksRoute.detail.response.headersCard.labels.name')} ${index + 1}`} type="text" value={row.key} onChange={(event) => setDraft((current) => ({ ...current, responseHeaders: current.responseHeaders.map((currentRow) => currentRow.id === row.id ? { ...currentRow, key: event.currentTarget.value } : currentRow) }))} />
                          </label>
                          <label className="request-field request-field--wide">
                            <span>{t('mocksRoute.detail.response.headersCard.labels.value')}</span>
                            <input aria-label={`${t('mocksRoute.detail.response.headersCard.labels.value')} ${index + 1}`} type="text" value={row.value} onChange={(event) => setDraft((current) => ({ ...current, responseHeaders: current.responseHeaders.map((currentRow) => currentRow.id === row.id ? { ...currentRow, value: event.currentTarget.value } : currentRow) }))} />
                          </label>
                          <button type="button" className="workspace-button workspace-button--ghost" onClick={() => setDraft((current) => ({ ...current, responseHeaders: current.responseHeaders.filter((currentRow) => currentRow.id !== row.id) }))}>
                            {t('mocksRoute.detail.response.headersCard.labels.remove')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </DetailViewerSection>
              </div>
            ) : null}

            {activeDetailTab === 'diagnostics' ? (
              <DetailViewerSection title={t('mocksRoute.detail.diagnostics.title')} description={t('mocksRoute.detail.diagnostics.description')} className="mocks-summary-card mocks-summary-card--diagnostics" tone="supporting">
                <KeyValueMetaList
                  items={[
                    { label: t('mocksRoute.detail.diagnostics.labels.deferredNote'), value: t('mocksRoute.detail.diagnostics.values.deferredNote') },
                    { label: t('mocksRoute.detail.diagnostics.labels.source'), value: currentPresentation.sourceLabel },
                    { label: t('mocksRoute.detail.diagnostics.labels.currentState'), value: currentPresentation.ruleState },
                  ]}
                />
                <EmptyStateCallout title={t('mocksRoute.detail.diagnostics.runtimeOutcomes.title')} description={t('mocksRoute.detail.diagnostics.runtimeOutcomes.description')} />
              </DetailViewerSection>
            ) : null}
          </div>
        )}
        </section>
      )}
      detail={(
        <aside className="shell-panel shell-panel--detail" aria-label={t('shell.routePanels.detailRegion')}>
        {!isCreatingRule && !selectedRule ? (
          <div className="workspace-detail-panel workspace-detail-panel--empty">
            <EmptyStateCallout title={t('mocksRoute.contextual.empty.title')} description={t('mocksRoute.contextual.empty.description')} />
          </div>
        ) : (
          <div className="workspace-detail-panel">
            <header className="workspace-detail-panel__header">
              <div>
                <p className="section-placeholder__eyebrow">{t('mocksRoute.contextual.header.eyebrow')}</p>
                <h2>{t('mocksRoute.contextual.header.title')}</h2>
                <p>{t('mocksRoute.contextual.header.description')}</p>
                <div className="workspace-explorer__role-strip" aria-label="Mock notes role">
                  <span className="workspace-chip">{t('roles.management')}</span>
                  <span className="workspace-chip workspace-chip--secondary">{t('mocksRoute.contextual.header.guardrailsChip')}</span>
                </div>
              </div>
            </header>

            <DetailViewerSection title={t('mocksRoute.contextual.guardrails.title')} description={t('mocksRoute.contextual.guardrails.description')} className="mocks-summary-card mocks-summary-card--guardrails" tone="supporting">
              <KeyValueMetaList
                items={[
                  { label: t('mocksRoute.contextual.guardrails.labels.methodSummary'), value: currentPresentation.methodSummary },
                  { label: t('mocksRoute.contextual.guardrails.labels.pathSummary'), value: currentPresentation.pathSummary },
                  { label: t('mocksRoute.contextual.guardrails.labels.responseSummary'), value: currentPresentation.responseSummary },
                ]}
              />
            </DetailViewerSection>

            <DetailViewerSection title={t('mocksRoute.contextual.deferred.title')} description={t('mocksRoute.contextual.deferred.description')} className="mocks-summary-card mocks-summary-card--deferred" tone="supporting">
              <KeyValueMetaList
                items={[
                  { label: t('mocksRoute.contextual.deferred.labels.persistence'), value: t('mocksRoute.contextual.deferred.values.persistence') },
                  { label: t('mocksRoute.contextual.deferred.labels.runtimeEvaluation'), value: t('mocksRoute.contextual.deferred.values.runtimeEvaluation') },
                  { label: t('mocksRoute.contextual.deferred.labels.captureDiagnostics'), value: t('mocksRoute.contextual.deferred.values.captureDiagnostics') },
                ]}
              />
            </DetailViewerSection>
          </div>
        )}
        </aside>
      )}
    />
  );
}


