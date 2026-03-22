import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useReducer, useState } from 'react';
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
import { defaultNewMockRuleInput } from '@client/features/mocks/data/mock-rule-fixtures';
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
  mockRuleStateFilterOptions,
  useMocksStore,
} from '@client/features/mocks/state/mocks-store';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { PanelTabs } from '@client/shared/ui/PanelTabs';
import { StatusBadge } from '@client/shared/ui/StatusBadge';
import { downloadAuthoredResourceBundle } from '@client/features/workspace/resource-bundle.api';

const mockDetailTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'matchers', label: 'Matchers' },
  { id: 'response', label: 'Response' },
  { id: 'diagnostics', label: 'Diagnostics' },
] as const;

const methodModeOptions = [
  { value: 'any', label: 'Any method' },
  { value: 'exact', label: 'Exact method' },
] as const;

const pathModeOptions = [
  { value: 'exact', label: 'Exact path' },
  { value: 'prefix', label: 'Path prefix' },
] as const;

const bodyMatcherModeOptions: Array<{ value: MockRuleBodyMatcherMode; label: string }> = [
  { value: 'none', label: 'No body matcher' },
  { value: 'exact', label: 'Exact body text' },
  { value: 'contains', label: 'Contains text' },
];

const matcherOperatorOptions = [
  { value: 'exists', label: 'Exists' },
  { value: 'equals', label: 'Exact match' },
  { value: 'contains', label: 'Contains' },
] as const;

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

function createRuleState(enabled: boolean): MockRuleStateLabel {
  return enabled ? 'Enabled' : 'Disabled';
}

function sortRules(records: MockRuleRecord[]) {
  return sortMockRuleRecords(records);
}

function summarizeMatcherRows(rows: MockRuleMatcherRow[], emptyLabel: string) {
  const activeRows = rows.filter((row) => row.enabled !== false && row.key.trim().length > 0);
  if (activeRows.length === 0) {
    return emptyLabel;
  }

  return activeRows.map((row) => {
    if (row.operator === 'exists') {
      return `${row.key} exists`;
    }
    if (row.operator === 'contains') {
      return `${row.key} contains ${row.value}`;
    }
    return `${row.key} equals ${row.value}`;
  }).join(' · ');
}

function summarizeResponseHeaders(rows: MockRuleResponseHeaderRow[]) {
  const activeRows = rows.filter((row) => row.enabled !== false && row.key.trim().length > 0);
  return activeRows.length === 0 ? 'No static response headers' : `${activeRows.length} static response header${activeRows.length === 1 ? '' : 's'}`;
}

function presentDraft(draft: MockRuleInput, sourceLabel: string) {
  const methodSummary = draft.methodMode === 'any' ? 'Method: any' : `Method exact: ${draft.method}`;
  const pathSummary = draft.pathMode === 'prefix'
    ? `Path prefix: ${draft.pathValue || '(missing path)'}`
    : `Path exact: ${draft.pathValue || '(missing path)'}`;
  const querySummary = summarizeMatcherRows(draft.queryMatchers, 'No query matcher');
  const headerSummary = summarizeMatcherRows(draft.headerMatchers, 'No header matcher');
  const bodySummary = draft.bodyMatcherMode === 'none'
    ? 'No body matcher'
    : draft.bodyMatcherMode === 'contains'
      ? `Body contains: ${draft.bodyMatcherValue || '(missing text)'}`
      : `Body exact: ${draft.bodyMatcherValue || '(missing text)'}`;
  const fixedDelayLabel = draft.fixedDelayMs > 0 ? `Fixed delay: ${draft.fixedDelayMs} ms` : 'No fixed delay';

  return {
    ruleState: createRuleState(draft.enabled),
    methodSummary,
    pathSummary,
    querySummary,
    headerSummary,
    bodySummary,
    matcherSummary: [methodSummary, pathSummary, querySummary, headerSummary, bodySummary].join(' with '),
    responseSummary: `Static ${draft.responseStatusCode} response${draft.fixedDelayMs > 0 ? ` with ${draft.fixedDelayMs} ms fixed delay` : ''}.`,
    responseHeadersSummary: summarizeResponseHeaders(draft.responseHeaders),
    responseBodyPreview: draft.responseBody.trim().length > 0 ? draft.responseBody : '{\n  "mocked": true\n}',
    fixedDelayLabel,
    sourceLabel,
  };
}

function getSaveDisabledReason(draft: MockRuleInput, isSaving: boolean) {
  if (isSaving) {
    return 'Persisting the current rule changes.';
  }
  if (draft.name.trim().length === 0) {
    return 'Rule name is required before saving.';
  }
  if (draft.pathValue.trim().length === 0) {
    return 'Path value is required before saving.';
  }
  if (draft.bodyMatcherMode !== 'none' && draft.bodyMatcherValue.trim().length === 0) {
    return 'Body matcher value is required when a body matcher is enabled.';
  }
  if (!Number.isFinite(draft.responseStatusCode) || draft.responseStatusCode < 100 || draft.responseStatusCode > 599) {
    return 'Response status code must stay between 100 and 599.';
  }
  if (!Number.isFinite(draft.fixedDelayMs) || draft.fixedDelayMs < 0 || draft.fixedDelayMs > 2000) {
    return 'Fixed delay must stay between 0 and 2000 ms.';
  }
  return null;
}

function mutationMessage(errors: Array<Error | null>) {
  return errors.find(Boolean)?.message ?? null;
}

function upsertRule(records: MockRuleRecord[] | undefined, nextRule: MockRuleRecord) {
  return sortRules([nextRule, ...(records ?? []).filter((record) => record.id !== nextRule.id)]);
}

type MockRuleDraftAction =
  | { type: 'replace'; draft: MockRuleInput }
  | { type: 'update'; updater: (current: MockRuleInput) => MockRuleInput };

function mockRuleDraftReducer(state: MockRuleInput, action: MockRuleDraftAction) {
  if (action.type === 'replace') {
    return action.draft;
  }

  return action.updater(state);
}

interface MockResourceTransferStatus {
  tone: 'success' | 'error' | 'info';
  message: string;
}

interface MatcherEditorProps {
  title: string;
  description: string;
  addLabel: string;
  rowPrefix: string;
  rows: MockRuleMatcherRow[];
  onChange: (rows: MockRuleMatcherRow[]) => void;
}

function MatcherEditor({ title, description, addLabel, rowPrefix, rows, onChange }: MatcherEditorProps) {
  return (
    <DetailViewerSection
      title={title}
      description={description}
      actions={(
        <button
          type="button"
          className="workspace-button workspace-button--secondary"
          onClick={() => onChange([...rows, createMatcherRow(rowPrefix === 'Query matcher' ? 'query' : 'header')])}
        >
          {addLabel}
        </button>
      )}
    >
      {rows.length === 0 ? (
        <EmptyStateCallout
          title={`No ${title.toLowerCase()}`}
          description="Add lightweight exists, exact, or contains rows only. Script-assisted matching remains deferred."
        />
      ) : (
        <div className="request-row-editor-list">
          {rows.map((row, index) => (
            <div key={row.id} className="request-row-editor">
              <label className="request-field">
                <span>{rowPrefix} key</span>
                <input
                  aria-label={`${rowPrefix} key ${index + 1}`}
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
                <span>Operator</span>
                <select
                  aria-label={`${rowPrefix} operator ${index + 1}`}
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
                  {matcherOperatorOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="request-field">
                <span>Value</span>
                <input
                  aria-label={`${rowPrefix} value ${index + 1}`}
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
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </DetailViewerSection>
  );
}

export function MocksPlaceholder() {
  const queryClient = useQueryClient();
  const [activeDetailTab, setActiveDetailTab] = useState<MockRuleDetailTabId>('overview');
  const [resourceTransferStatus, setResourceTransferStatus] = useState<MockResourceTransferStatus | null>(null);
  const [draft, draftDispatch] = useReducer(mockRuleDraftReducer, defaultNewMockRuleInput, createDraft);
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
      draftDispatch({ type: 'replace', draft: createDraft(defaultNewMockRuleInput) });
      return;
    }

    if (selectedRule) {
      draftDispatch({ type: 'replace', draft: createDraft(selectedRule) });
    }
  }, [isCreatingRule, selectedRule]);

  const setDraft = (nextDraft: MockRuleInput | ((current: MockRuleInput) => MockRuleInput)) => {
    if (typeof nextDraft === 'function') {
      draftDispatch({
        type: 'update',
        updater: nextDraft,
      });
      return;
    }

    draftDispatch({
      type: 'replace',
      draft: nextDraft,
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
      const exportedRuleName = bundle.mockRules[0]?.name || 'mock rule';
      setResourceTransferStatus({
        tone: 'success',
        message: `Exported ${exportedRuleName} from the authored resource lane. Runtime mock outcomes remain excluded.`,
      });
    },
    onError: (error) => {
      setResourceTransferStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Mock rule export failed before a bundle could be downloaded.',
      });
    },
  });

  const isListLoading = listQuery.isPending && !listQuery.data;
  const isDetailLoading = effectiveSelectedRuleId !== null && !isCreatingRule && detailQuery.isPending && !detailQuery.data;
  const isEmpty = !isListLoading && listItems.length === 0;
  const hasNoFilteredResults = !isListLoading && listItems.length > 0 && filteredRules.length === 0;
  const degradedReason = listQuery.error instanceof Error
    ? listQuery.error.message
    : detailQuery.error instanceof Error
      ? detailQuery.error.message
      : 'Persisted mock rules could not be loaded cleanly.';
  const isSaving = createRuleMutation.isPending || updateRuleMutation.isPending;
  const saveDisabledReason = getSaveDisabledReason(draft, isSaving);
  const quickToggleDisabledReason = isCreatingRule
    ? 'Create the rule first before using the quick enable or disable action.'
    : toggleRuleMutation.isPending
      ? 'Updating persisted rule state.'
      : null;
  const deleteDisabledReason = isCreatingRule
    ? 'Discard the draft instead of deleting it. Only persisted rules can be deleted.'
    : deleteRuleMutation.isPending
      ? 'Deleting the persisted rule.'
      : null;
  const currentPresentation = presentDraft(draft, isCreatingRule ? 'Unsaved workspace rule' : selectedRule?.sourceLabel ?? 'Persisted workspace rule');
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

  const handleCancelDraft = () => {
    if (listItems[0]) {
      selectRule(listItems[0].id);
      return;
    }

    clearSelection();
  };

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <div className="mocks-explorer">
          <header className="mocks-explorer__header">
            <div>
              <p className="section-placeholder__eyebrow">Rule management</p>
              <h2>Mock rules</h2>
              <p>Persisted authored rules live here. Captures still owns runtime mock outcomes after evaluation.</p>
              <div className="workspace-explorer__role-strip" aria-label="Mocks surface role">
                <span className="workspace-chip">Management</span>
                <span className="workspace-chip workspace-chip--secondary">Resource lane</span>
              </div>
            </div>
            <button type="button" className="workspace-button" onClick={() => startCreatingRule()}>
              New Rule
            </button>
          </header>

          <div className="mocks-filter-grid">
            <label className="request-field">
              <span>Search rules</span>
              <input aria-label="Search rules" type="text" value={searchText} onChange={(event) => setSearchText(event.currentTarget.value)} />
            </label>
            <label className="request-field request-field--compact">
              <span>Rule state filter</span>
              <select
                aria-label="Rule state filter"
                value={stateFilter}
                onChange={(event) => setStateFilter(event.currentTarget.value as MockRuleStateFilter)}
              >
                {mockRuleStateFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {isListLoading ? <EmptyStateCallout title="Loading persisted rules" description="Waiting for the resource lane to return saved mock rules for this workspace." className="mocks-empty-state" /> : null}
          {listQuery.isError ? <EmptyStateCallout title="Mock rules are degraded" description={`Persisted rule data could not be refreshed cleanly. ${degradedReason}`} /> : null}
          {isEmpty ? <EmptyStateCallout title="No mock rules yet" description="Create a rule to persist matcher and static response scaffolding for inbound capture evaluation." className="mocks-empty-state" /> : null}
          {hasNoFilteredResults ? <EmptyStateCallout title="No rules match these filters" description="Adjust the search text or state filter to bring persisted rules back into view." className="mocks-empty-state" /> : null}

          {filteredRules.length > 0 ? (
            <ul className="mocks-list" aria-label="Mock rules list">
              {filteredRules.map((rule) => {
                const isSelected = !isCreatingRule && rule.id === effectiveSelectedRuleId;

                return (
                  <li key={rule.id}>
                    <button
                      type="button"
                      className={isSelected ? 'mocks-row mocks-row--selected' : 'mocks-row'}
                      aria-label={`Open mock rule ${rule.name}`}
                      aria-pressed={isSelected}
                      data-rule-state={rule.ruleState === 'Enabled' ? 'enabled' : 'disabled'}
                      onClick={() => selectRule(rule.id)}
                    >
                      <span className="mocks-row__top">
                        <StatusBadge kind="neutral" value={rule.ruleState} />
                        <span className="workspace-chip">Priority {rule.priority}</span>
                        <span className="workspace-chip workspace-chip--secondary">{rule.fixedDelayLabel}</span>
                      </span>
                      <span className="mocks-row__title">{rule.name}</span>
                      <span className="mocks-row__summary">{rule.matcherSummary}</span>
                      <span className="mocks-row__meta">{rule.responseSummary}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <header className="section-placeholder__header">
          <p className="section-placeholder__eyebrow">Top-level section</p>
          <h1>Mocks</h1>
          <p>Mocks is the authored rule management route. It persists matcher and response definitions while captures shows runtime outcomes after evaluation.</p>
          <div className="workspace-explorer__role-strip" aria-label="Mocks route role">
            <span className="workspace-chip">Management</span>
            <span className="workspace-chip workspace-chip--secondary">Authored rules</span>
          </div>
        </header>

        {isListLoading && !isCreatingRule ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout title="Loading mock rule detail" description="The persisted rule list is loading before a detail row can be selected." />
          </div>
        ) : !isCreatingRule && !selectedRule ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout title="No mock rule selected" description="Choose a persisted rule or start a new rule draft to edit matcher and static response fields." />
          </div>
        ) : isDetailLoading ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout title="Loading persisted rule detail" description="Fetching the selected rule from the resource lane before editable details are shown." />
          </div>
        ) : detailQuery.isError && !isCreatingRule ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout title="Mock rule detail is degraded" description={`The selected rule could not be loaded cleanly. ${degradedReason}`} />
          </div>
        ) : (
          <div className="mocks-detail">
            <header className="mocks-detail__header">
              <div>
                <p className="section-placeholder__eyebrow">{isCreatingRule ? 'New rule draft' : 'Persisted rule detail'}</p>
                <h2>{isCreatingRule ? 'Create mock rule' : 'Edit mock rule'}</h2>
                <p>{currentPresentation.matcherSummary}</p>
                <div className="workspace-explorer__role-strip" aria-label="Mock rule detail role">
                  <span className="workspace-chip">Management</span>
                  <span className="workspace-chip workspace-chip--secondary">Authored rule</span>
                </div>
              </div>
              <div className="request-work-surface__badges">
                <StatusBadge kind="neutral" value={currentPresentation.ruleState} />
                <span className="workspace-chip">Priority {draft.priority}</span>
                <span className="workspace-chip">{currentPresentation.fixedDelayLabel}</span>
              </div>
            </header>

            <DetailViewerSection
              title="Persistence boundary"
              description="Create and Save update authored rule definitions only. Runtime mock outcomes remain in Captures."
              className="mocks-summary-card mocks-summary-card--boundary"
              actions={(
                <div className="request-work-surface__future-actions">
                  <button type="button" className="workspace-button workspace-button--secondary" onClick={handleSaveRule} disabled={saveDisabledReason !== null}>
                    {isCreatingRule ? 'Create rule' : 'Save rule'}
                  </button>
                  <button type="button" className="workspace-button workspace-button--secondary" onClick={handleToggleRuleEnabled} disabled={quickToggleDisabledReason !== null}>
                    {selectedRule?.enabled ? 'Disable rule' : 'Enable rule'}
                  </button>
                  {!isCreatingRule && selectedRule ? (
                    <button
                      type="button"
                      className="workspace-button workspace-button--secondary"
                      onClick={() => exportRuleMutation.mutate(selectedRule.id)}
                      disabled={exportRuleMutation.isPending}
                    >
                      {exportRuleMutation.isPending ? 'Exporting rule' : 'Export rule'}
                    </button>
                  ) : null}
                  {isCreatingRule ? (
                    <button type="button" className="workspace-button workspace-button--ghost" onClick={handleCancelDraft}>
                      Cancel draft
                    </button>
                  ) : (
                    <button type="button" className="workspace-button workspace-button--ghost" onClick={handleDeleteRule} disabled={deleteDisabledReason !== null}>
                      Delete rule
                    </button>
                  )}
                </div>
              )}
            >
              <p className="shared-readiness-note">
                {saveDisabledReason ?? quickToggleDisabledReason ?? deleteDisabledReason ?? 'Quick enable or disable updates persisted rule state only. Other field edits still require Create or Save.'}
              </p>
              {resourceTransferStatus ? (
                <p className={`workspace-explorer__status workspace-explorer__status--${resourceTransferStatus.tone}`}>
                  {resourceTransferStatus.message}
                </p>
              ) : null}
              {currentError ? <EmptyStateCallout title="Rule mutation failed" description={currentError} /> : null}
            </DetailViewerSection>

            <div className="mocks-summary-grid">
              <DetailViewerSection title="Rule summary" description="Enabled or Disabled here describes authored rule state, not runtime mock outcome." className="mocks-summary-card mocks-summary-card--rule">
                <KeyValueMetaList
                  items={[
                    { label: 'Rule name', value: draft.name || 'Untitled Mock Rule' },
                    { label: 'Rule state', value: currentPresentation.ruleState },
                    { label: 'Priority', value: draft.priority },
                    { label: 'Source', value: currentPresentation.sourceLabel },
                  ]}
                />
              </DetailViewerSection>

              <DetailViewerSection title="Evaluation summary" description="Enabled rules are evaluated by priority, matcher specificity, and a stable tie-breaker." className="mocks-summary-card mocks-summary-card--evaluation">
                <KeyValueMetaList
                  items={[
                    { label: 'Matcher summary', value: currentPresentation.matcherSummary },
                    { label: 'Response summary', value: currentPresentation.responseSummary },
                    { label: 'Delay hint', value: currentPresentation.fixedDelayLabel },
                  ]}
                />
              </DetailViewerSection>
            </div>

            <PanelTabs ariaLabel="Mock rule detail tabs" tabs={mockDetailTabs} activeTab={activeDetailTab} onChange={setActiveDetailTab} />

            {activeDetailTab === 'overview' ? (
              <DetailViewerSection title="Overview" description="This editor stays inside the T013 MVP matcher and static response surface." className="mocks-summary-card mocks-summary-card--overview">
                <div className="request-editor-card__grid">
                  <label className="request-field">
                    <span>Rule name</span>
                    <input aria-label="Rule name" type="text" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.currentTarget.value }))} />
                  </label>
                  <label className="request-field request-field--toggle">
                    <span>Rule enabled</span>
                    <input aria-label="Rule enabled" type="checkbox" checked={draft.enabled} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.currentTarget.checked }))} />
                  </label>
                  <label className="request-field">
                    <span>Priority</span>
                    <input aria-label="Rule priority" type="number" value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: Number(event.currentTarget.value) || 0 }))} />
                  </label>
                  <label className="request-field">
                    <span>Method match</span>
                    <select aria-label="Method match" value={draft.methodMode} onChange={(event) => setDraft((current) => ({ ...current, methodMode: event.currentTarget.value as MockRuleInput['methodMode'] }))}>
                      {methodModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="request-field">
                    <span>HTTP method</span>
                    <select aria-label="HTTP method" value={draft.method} disabled={draft.methodMode === 'any'} onChange={(event) => setDraft((current) => ({ ...current, method: event.currentTarget.value as MockRuleInput['method'] }))}>
                      {httpMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                    </select>
                  </label>
                  <label className="request-field">
                    <span>Path match</span>
                    <select aria-label="Path match" value={draft.pathMode} onChange={(event) => setDraft((current) => ({ ...current, pathMode: event.currentTarget.value as MockRuleInput['pathMode'] }))}>
                      {pathModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="request-field request-field--wide">
                    <span>Path value</span>
                    <input aria-label="Path value" type="text" placeholder="/webhooks/stripe" value={draft.pathValue} onChange={(event) => setDraft((current) => ({ ...current, pathValue: event.currentTarget.value }))} />
                  </label>
                </div>
              </DetailViewerSection>
            ) : null}

            {activeDetailTab === 'matchers' ? (
              <div className="mocks-summary-grid">
                <MatcherEditor
                  title="Query matchers"
                  description="Use lightweight exists, exact, and contains operators only."
                  addLabel="Add query matcher"
                  rowPrefix="Query matcher"
                  rows={draft.queryMatchers}
                  onChange={(queryMatchers) => setDraft((current) => ({ ...current, queryMatchers }))}
                />
                <MatcherEditor
                  title="Header matchers"
                  description="Header matching remains bounded to exists, exact, and contains operators."
                  addLabel="Add header matcher"
                  rowPrefix="Header matcher"
                  rows={draft.headerMatchers}
                  onChange={(headerMatchers) => setDraft((current) => ({ ...current, headerMatchers }))}
                />
                <DetailViewerSection title="Body matcher" description="Regex, JSONPath, and script matchers remain deferred." className="mocks-summary-card mocks-summary-card--matchers">
                  <div className="request-editor-card__grid">
                    <label className="request-field">
                      <span>Body matcher</span>
                      <select
                        aria-label="Body matcher"
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
                      <span>Body match value</span>
                      <input aria-label="Body match value" type="text" value={draft.bodyMatcherValue} disabled={draft.bodyMatcherMode === 'none'} onChange={(event) => setDraft((current) => ({ ...current, bodyMatcherValue: event.currentTarget.value }))} />
                    </label>
                  </div>
                </DetailViewerSection>
              </div>
            ) : null}

            {activeDetailTab === 'response' ? (
              <div className="mocks-summary-grid">
                <DetailViewerSection title="Static response" description="Static status, headers, body, and fixed delay form the bounded MVP response surface." className="mocks-summary-card mocks-summary-card--response">
                  <div className="request-editor-card__grid">
                    <label className="request-field">
                      <span>Response status</span>
                      <input aria-label="Response status" type="number" value={draft.responseStatusCode} onChange={(event) => setDraft((current) => ({ ...current, responseStatusCode: Number(event.currentTarget.value) || 0 }))} />
                    </label>
                    <label className="request-field">
                      <span>Fixed delay (ms)</span>
                      <input aria-label="Fixed delay" type="number" min="0" max="2000" value={draft.fixedDelayMs} onChange={(event) => setDraft((current) => ({ ...current, fixedDelayMs: Number(event.currentTarget.value) || 0 }))} />
                    </label>
                    <label className="request-field request-field--wide">
                      <span>Response body</span>
                      <textarea aria-label="Response body" value={draft.responseBody} onChange={(event) => setDraft((current) => ({ ...current, responseBody: event.currentTarget.value }))} />
                    </label>
                  </div>
                  <pre className="mocks-preview-block">{currentPresentation.responseBodyPreview}</pre>
                </DetailViewerSection>

                <DetailViewerSection
                  title="Response headers"
                  description="Static response headers stay bounded and predictable in this MVP surface."
                  className="mocks-summary-card mocks-summary-card--headers"
                  actions={(
                    <button type="button" className="workspace-button workspace-button--secondary" onClick={() => setDraft((current) => ({ ...current, responseHeaders: [...current.responseHeaders, createResponseHeaderRow()] }))}>
                      Add response header
                    </button>
                  )}
                >
                  {draft.responseHeaders.length === 0 ? (
                    <EmptyStateCallout title="No static response headers" description="Add static response headers only when the mock response needs them." />
                  ) : (
                    <div className="request-row-editor-list">
                      {draft.responseHeaders.map((row, index) => (
                        <div key={row.id} className="request-row-editor">
                          <label className="request-field">
                            <span>Header name</span>
                            <input aria-label={`Response header name ${index + 1}`} type="text" value={row.key} onChange={(event) => setDraft((current) => ({ ...current, responseHeaders: current.responseHeaders.map((currentRow) => currentRow.id === row.id ? { ...currentRow, key: event.currentTarget.value } : currentRow) }))} />
                          </label>
                          <label className="request-field request-field--wide">
                            <span>Header value</span>
                            <input aria-label={`Response header value ${index + 1}`} type="text" value={row.value} onChange={(event) => setDraft((current) => ({ ...current, responseHeaders: current.responseHeaders.map((currentRow) => currentRow.id === row.id ? { ...currentRow, value: event.currentTarget.value } : currentRow) }))} />
                          </label>
                          <button type="button" className="workspace-button workspace-button--ghost" onClick={() => setDraft((current) => ({ ...current, responseHeaders: current.responseHeaders.filter((currentRow) => currentRow.id !== row.id) }))}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </DetailViewerSection>
              </div>
            ) : null}

            {activeDetailTab === 'diagnostics' ? (
              <DetailViewerSection title="Diagnostics and deferred work" description={selectedRule?.diagnosticsSummary ?? 'Rules are evaluated by enabled state, explicit priority, matcher specificity, and a stable tie-breaker.'} className="mocks-summary-card mocks-summary-card--diagnostics">
                <KeyValueMetaList
                  items={[
                    { label: 'Deferred note', value: selectedRule?.deferredSummary ?? 'Script-assisted matcher/response and advanced scenario state remain deferred.' },
                    { label: 'Source', value: currentPresentation.sourceLabel },
                    { label: 'Current state', value: currentPresentation.ruleState },
                  ]}
                />
                <EmptyStateCallout title="Runtime outcomes stay in Captures" description="This route persists authored rule definitions only. Captures shows Mocked, Bypassed, No rule matched, and Blocked outcomes after evaluation." />
              </DetailViewerSection>
            ) : null}
          </div>
        )}
      </section>

      <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
        {!isCreatingRule && !selectedRule ? (
          <div className="workspace-detail-panel workspace-detail-panel--empty">
            <EmptyStateCallout title="Management notes placeholder" description="Persisted rule diagnostics, authored rule reminders, and evaluation guardrails appear after a rule is selected or a new draft is opened." />
          </div>
        ) : (
          <div className="workspace-detail-panel">
            <header className="workspace-detail-panel__header">
              <div>
                <p className="section-placeholder__eyebrow">Contextual panel</p>
                <h2>Management notes</h2>
                <p>Authored mock rules stay separate from runtime capture outcomes. This panel stays focused on rule constraints and evaluation order.</p>
                <div className="workspace-explorer__role-strip" aria-label="Mock notes role">
                  <span className="workspace-chip">Management</span>
                  <span className="workspace-chip workspace-chip--secondary">Guardrails</span>
                </div>
              </div>
            </header>

            <DetailViewerSection title="Evaluation guardrails" description="Only enabled rules are evaluated. Priority wins first, then matcher specificity, then a stable created-at tie-breaker." className="mocks-summary-card mocks-summary-card--guardrails">
              <KeyValueMetaList
                items={[
                  { label: 'Method summary', value: currentPresentation.methodSummary },
                  { label: 'Path summary', value: currentPresentation.pathSummary },
                  { label: 'Response summary', value: currentPresentation.responseSummary },
                ]}
              />
            </DetailViewerSection>

            <DetailViewerSection title="Deferred capabilities" description="Script-assisted matcher/response authoring, scenario state, diff, and deeper runtime traces remain later-slice work." className="mocks-summary-card mocks-summary-card--deferred" tone="muted">
              <KeyValueMetaList
                items={[
                  { label: 'Persistence', value: 'Persisted JSON resource lane' },
                  { label: 'Runtime evaluation', value: 'Enabled for MVP static matching and response only' },
                  { label: 'Capture diagnostics', value: 'Outcome and matched rule summary only' },
                ]}
              />
            </DetailViewerSection>
          </div>
        )}
      </aside>
    </>
  );
}



