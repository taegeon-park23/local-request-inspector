import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import {
  createEnvironment,
  deleteEnvironment,
  environmentDetailQueryKey,
  listWorkspaceEnvironments,
  readEnvironment,
  sortEnvironmentSummaries,
  updateEnvironment,
  workspaceEnvironmentsQueryKey,
} from '@client/features/environments/environment.api';
import type {
  EnvironmentInput,
  EnvironmentValueType,
  EnvironmentVariableInput,
} from '@client/features/environments/environment.types';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { IconLabel } from '@client/shared/ui/IconLabel';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { SectionHeading } from '@client/shared/ui/SectionHeading';
import {
  FloatingExplorerHeader,
  RoutePanelTabsLayout,
} from '@client/features/shared-section-placeholder';
import { useWorkspaceUiStore } from '@client/features/workspace/state/workspace-ui-store';

type EnvironmentSortOrder = 'default' | 'name' | 'updated';

let draftVariableSequence = 1;

function createVariableDraft(): EnvironmentVariableInput {
  draftVariableSequence += 1;
  return {
    id: `environment-draft-variable-${draftVariableSequence}`,
    key: '',
    description: '',
    isEnabled: true,
    isSecret: false,
    valueType: 'plain',
    value: '',
    replacementValue: '',
    clearStoredValue: false,
    hasStoredValue: false,
  };
}

function createEnvironmentDraft(): EnvironmentInput {
  return { name: '', description: '', isDefault: false, variables: [createVariableDraft()] };
}

function createDraftFromEnvironment(environment: Awaited<ReturnType<typeof readEnvironment>>): EnvironmentInput {
  return {
    id: environment.id,
    name: environment.name,
    description: environment.description,
    isDefault: environment.isDefault,
    variables: environment.variables.map((row) => ({
      id: row.id,
      key: row.key,
      description: row.description,
      isEnabled: row.isEnabled,
      isSecret: row.isSecret,
      valueType: row.valueType,
      value: row.value,
      replacementValue: '',
      clearStoredValue: false,
      hasStoredValue: row.hasStoredValue,
    })),
  };
}

function validateDraft(draft: EnvironmentInput, t: ReturnType<typeof useI18n>['t']) {
  const messages: string[] = [];
  if (draft.name.trim().length === 0) {
    messages.push(t('environmentsRoute.validation.nameRequired'));
  }
  const seenKeys = new Set<string>();
  for (const row of draft.variables) {
    const key = row.key.trim();
    if (key.length === 0) {
      messages.push(t('environmentsRoute.validation.keyRequired'));
      continue;
    }
    const normalizedKey = key.toLowerCase();
    if (seenKeys.has(normalizedKey)) {
      messages.push(t('environmentsRoute.validation.duplicatedKey', { key }));
    }
    seenKeys.add(normalizedKey);
  }
  return messages;
}

export function EnvironmentsRoute() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState<EnvironmentSortOrder>('default');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const activePanel = useWorkspaceUiStore((state) => state.routePanels.environments.activePanel);
  const setRouteActivePanel = useWorkspaceUiStore((state) => state.setRouteActivePanel);

  const [draft, setDraft] = useState<EnvironmentInput>(createEnvironmentDraft);

  const sortOptions: Array<{ value: EnvironmentSortOrder; label: string }> = [
    { value: 'default', label: t('environmentsRoute.sortOptions.default') },
    { value: 'name', label: t('environmentsRoute.sortOptions.name') },
    { value: 'updated', label: t('environmentsRoute.sortOptions.updated') },
  ];

  const valueTypeOptions: Array<{ value: EnvironmentValueType; label: string }> = [
    { value: 'plain', label: t('environmentsRoute.valueTypeOptions.plain') },
    { value: 'number', label: t('environmentsRoute.valueTypeOptions.number') },
    { value: 'boolean', label: t('environmentsRoute.valueTypeOptions.boolean') },
    { value: 'json', label: t('environmentsRoute.valueTypeOptions.json') },
  ];
  const listQuery = useQuery({ queryKey: workspaceEnvironmentsQueryKey, queryFn: listWorkspaceEnvironments });
  const filteredItems = (listQuery.data ?? []).filter((item) => [item.name, item.description, item.resolutionSummary]
    .some((value) => value.toLowerCase().includes(searchText.trim().toLowerCase())));
  const sortedItems = sortOrder === 'name'
    ? [...filteredItems].sort((left, right) => left.name.localeCompare(right.name))
    : sortOrder === 'updated'
      ? [...filteredItems].sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
      : sortEnvironmentSummaries(filteredItems);
  const effectiveSelectedId = !isCreatingDraft
    ? (sortedItems.some((item) => item.id === selectedEnvironmentId) ? selectedEnvironmentId : (sortedItems[0]?.id ?? null))
    : null;

  const detailQuery = useQuery({
    queryKey: environmentDetailQueryKey(effectiveSelectedId),
    queryFn: () => readEnvironment(effectiveSelectedId!),
    enabled: effectiveSelectedId !== null && !isCreatingDraft,
  });

  const activeDraft = isCreatingDraft
    ? draft
    : detailQuery.data
      ? (draft.id === detailQuery.data.id ? draft : createDraftFromEnvironment(detailQuery.data))
      : draft;

  const createMutation = useMutation({
    mutationFn: createEnvironment,
    onSuccess: async (environment) => {
      queryClient.setQueryData(environmentDetailQueryKey(environment.id), environment);
      await queryClient.invalidateQueries({ queryKey: workspaceEnvironmentsQueryKey });
      setIsCreatingDraft(false);
      setSelectedEnvironmentId(environment.id);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ environmentId, environment }: { environmentId: string; environment: EnvironmentInput }) => updateEnvironment(environmentId, environment),
    onSuccess: async (environment) => {
      queryClient.setQueryData(environmentDetailQueryKey(environment.id), environment);
      await queryClient.invalidateQueries({ queryKey: workspaceEnvironmentsQueryKey });
      setSelectedEnvironmentId(environment.id);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteEnvironment,
    onSuccess: async (environmentId) => {
      queryClient.removeQueries({ queryKey: environmentDetailQueryKey(environmentId) });
      await queryClient.invalidateQueries({ queryKey: workspaceEnvironmentsQueryKey });
      setSelectedEnvironmentId(null);
      setIsCreatingDraft(false);
    },
  });

  const validationMessages = validateDraft(activeDraft, t);
  const saveDisabledReason = createMutation.isPending || updateMutation.isPending
    ? t('environmentsRoute.detail.management.pendingSave')
    : validationMessages[0] ?? null;
  const deleteDisabledReason = isCreatingDraft
    ? t('environmentsRoute.detail.management.draftDeleteGuard')
    : deleteMutation.isPending
      ? t('environmentsRoute.detail.management.pendingDelete')
      : null;

  return (
    <RoutePanelTabsLayout
      layoutMode="floating-explorer"
      floatingExplorerRouteKey="environments"
      defaultActiveTab="explorer"
      activeTab={activePanel}
      onActiveTabChange={(panel) => setRouteActivePanel('environments', panel)}
      explorer={(
        <section className="shell-panel shell-panel--sidebar" aria-label={t('shell.routePanels.explorerRegion')}>
        <div className="environments-explorer">
          <FloatingExplorerHeader
            eyebrow={t('environmentsRoute.sidebar.eyebrow')}
            title={t('environmentsRoute.sidebar.title')}
            summary={t('environmentsRoute.sidebar.summary')}
            actions={(
              <button type="button" className="workspace-button" onClick={() => { setDraft(createEnvironmentDraft()); setIsCreatingDraft(true); setSelectedEnvironmentId(null); }}>
                <IconLabel icon="new">{t('environmentsRoute.sidebar.newButton')}</IconLabel>
              </button>
            )}
          />
          <div className="environments-filter-grid">
            <label className="request-field">
              <span>{t('environmentsRoute.sidebar.searchLabel')}</span>
              <input aria-label={t('environmentsRoute.sidebar.searchLabel')} type="text" value={searchText} onChange={(event) => setSearchText(event.currentTarget.value)} />
            </label>
            <label className="request-field request-field--compact">
              <span>{t('environmentsRoute.sidebar.sortLabel')}</span>
              <select aria-label={t('environmentsRoute.sidebar.sortLabel')} value={sortOrder} onChange={(event) => setSortOrder(event.currentTarget.value as EnvironmentSortOrder)}>
                {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          {listQuery.isPending && !listQuery.data ? <EmptyStateCallout title={t('environmentsRoute.empty.loadingList.title')} description={t('environmentsRoute.empty.loadingList.description')} /> : null}
          {listQuery.isError ? <EmptyStateCallout title={t('environmentsRoute.empty.degraded.title')} description={listQuery.error instanceof Error ? listQuery.error.message : t('environmentsRoute.empty.degraded.fallbackDescription')} /> : null}
          {!listQuery.isPending && (listQuery.data ?? []).length === 0 ? <EmptyStateCallout title={t('environmentsRoute.empty.noItems.title')} description={t('environmentsRoute.empty.noItems.description')} /> : null}
          {!listQuery.isPending && (listQuery.data ?? []).length > 0 && sortedItems.length === 0 ? <EmptyStateCallout title={t('environmentsRoute.empty.noFilteredItems.title')} description={t('environmentsRoute.empty.noFilteredItems.description')} /> : null}
          {sortedItems.length > 0 ? <ul className="environments-list" aria-label={t('environmentsRoute.sidebar.listAriaLabel')}>{sortedItems.map((environment) => <li key={environment.id}><button type="button" className={environment.id === effectiveSelectedId && !isCreatingDraft ? 'workspace-request workspace-request--selected' : 'workspace-request'} aria-label={t('environmentsRoute.sidebar.openEnvironmentAction', { name: environment.name })} onClick={() => { setIsCreatingDraft(false); setSelectedEnvironmentId(environment.id); }}><span className="workspace-request__header"><span className="workspace-request__title" title={environment.name}>{environment.name}</span><span className="workspace-request__badges">{environment.isDefault ? <span className="workspace-chip">{t('environmentsRoute.list.defaultChip')}</span> : null}<span className="workspace-chip workspace-chip--secondary">{t('environmentsRoute.list.varsChip', { count: environment.variableCount })}</span></span></span><span className="workspace-request__meta" title={environment.description || t('environmentsRoute.list.noDescription')}>{environment.description || t('environmentsRoute.list.noDescription')}</span><span className="workspace-request__meta" title={environment.resolutionSummary}>{environment.resolutionSummary}</span></button></li>)}</ul> : null}
        </div>
        </section>
      )}
      main={(
        <section className="shell-panel shell-panel--main" aria-label={t('shell.routePanels.mainRegion')}>
        <SectionHeading icon="environments" title={t('routes.environments.title')} summary={t('routes.environments.summary')} />
        {listQuery.isPending && !listQuery.data ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title={t('environmentsRoute.empty.loadingDetail.title')} description={t('environmentsRoute.empty.loadingDetail.description')} /></div> : !isCreatingDraft && !detailQuery.data ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title={t('environmentsRoute.empty.noSelection.title')} description={t('environmentsRoute.empty.noSelection.description')} /></div> : detailQuery.isPending && !detailQuery.data && !isCreatingDraft ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title={t('environmentsRoute.empty.loadingPersistedDetail.title')} description={t('environmentsRoute.empty.loadingPersistedDetail.description')} /></div> : (
          <div className="environments-detail">
            <header className="environments-detail__header">
              <div>
                <p className="section-placeholder__eyebrow">{isCreatingDraft ? t('environmentsRoute.detail.draftEyebrow') : t('environmentsRoute.detail.persistedEyebrow')}</p>
                <h2>{isCreatingDraft ? t('environmentsRoute.detail.createTitle') : t('environmentsRoute.detail.editTitle')}</h2>
                <p>{detailQuery.data?.resolutionSummary ?? t('environmentsRoute.detail.fallbackSummary')}</p>
              </div>
              <div className="request-work-surface__badges"><span className="workspace-chip">{t('environmentsRoute.detail.enabledChip', { count: activeDraft.variables.filter((row) => row.isEnabled !== false).length })}</span><span className="workspace-chip workspace-chip--secondary">{t('environmentsRoute.detail.secretChip', { count: activeDraft.variables.filter((row) => row.isSecret === true).length })}</span>{activeDraft.isDefault ? <span className="workspace-chip">{t('environmentsRoute.detail.defaultChip')}</span> : null}</div>
            </header>
            <DetailViewerSection icon="summary" title={t('environmentsRoute.detail.management.title')} description={t('environmentsRoute.detail.management.description')} className="workspace-surface-card" actions={<div className="request-work-surface__future-actions"><button type="button" className="workspace-button workspace-button--secondary" onClick={() => { if (!saveDisabledReason) { if (isCreatingDraft || !activeDraft.id) { createMutation.mutate(activeDraft); } else { updateMutation.mutate({ environmentId: activeDraft.id, environment: activeDraft }); } } }} disabled={saveDisabledReason !== null}><IconLabel icon="save">{isCreatingDraft ? t('environmentsRoute.detail.management.createAction') : t('environmentsRoute.detail.management.saveAction')}</IconLabel></button>{isCreatingDraft ? <button type="button" className="workspace-button workspace-button--ghost" onClick={() => { setIsCreatingDraft(false); setSelectedEnvironmentId(sortedItems[0]?.id ?? null); }}>{t('environmentsRoute.detail.management.cancelDraft')}</button> : <button type="button" className="workspace-button workspace-button--ghost" onClick={() => { if (detailQuery.data && !deleteDisabledReason) { deleteMutation.mutate(detailQuery.data.id); } }} disabled={deleteDisabledReason !== null}><IconLabel icon="delete">{t('environmentsRoute.detail.management.deleteAction')}</IconLabel></button>}</div>}>
              <p className="shared-readiness-note">{saveDisabledReason ?? deleteDisabledReason ?? t('environmentsRoute.detail.management.readinessNote')}</p>
              {validationMessages.length > 0 ? <ul className="environment-validation-list" aria-label={t('environmentsRoute.detail.management.validationListAriaLabel')}>{validationMessages.map((message) => <li key={message}>{message}</li>)}</ul> : null}
              {(createMutation.error || updateMutation.error || deleteMutation.error) ? <EmptyStateCallout title={t('environmentsRoute.detail.management.mutationFailedTitle')} description={([createMutation.error, updateMutation.error, deleteMutation.error].find(Boolean) as Error | undefined)?.message ?? t('environmentsRoute.detail.management.mutationFailedFallbackDescription')} /> : null}
            </DetailViewerSection>
            <div className="environments-summary-grid">
              <DetailViewerSection icon="environments" title={t('environmentsRoute.detail.summaryCard.title')} description={t('environmentsRoute.detail.summaryCard.description')} className="workspace-surface-card"><KeyValueMetaList items={[{ label: t('environmentsRoute.detail.summaryCard.labels.name'), value: activeDraft.name || t('environmentsRoute.detail.summaryCard.values.untitled') }, { label: t('environmentsRoute.detail.summaryCard.labels.default'), value: activeDraft.isDefault ? t('common.values.yes') : t('common.values.no') }, { label: t('environmentsRoute.detail.summaryCard.labels.variableCount'), value: activeDraft.variables.length }, { label: t('environmentsRoute.detail.summaryCard.labels.enabledVariables'), value: activeDraft.variables.filter((row) => row.isEnabled !== false).length }, { label: t('environmentsRoute.detail.summaryCard.labels.secretBackedVariables'), value: activeDraft.variables.filter((row) => row.isSecret === true).length }]} /></DetailViewerSection>
              <DetailViewerSection icon="shield" title={t('environmentsRoute.detail.secretPolicyCard.title')} description={t('environmentsRoute.detail.secretPolicyCard.description')} className="workspace-surface-card workspace-surface-card--muted"><KeyValueMetaList items={[{ label: t('environmentsRoute.detail.secretPolicyCard.labels.readModel'), value: t('environmentsRoute.detail.secretPolicyCard.values.readModel') }, { label: t('environmentsRoute.detail.secretPolicyCard.labels.storedIndicator'), value: t('environmentsRoute.detail.secretPolicyCard.values.storedIndicator') }, { label: t('environmentsRoute.detail.secretPolicyCard.labels.updatePolicy'), value: t('environmentsRoute.detail.secretPolicyCard.values.updatePolicy') }, { label: t('environmentsRoute.detail.secretPolicyCard.labels.runtimeLinkage'), value: t('environmentsRoute.detail.secretPolicyCard.values.runtimeLinkage') }]} /></DetailViewerSection>
            </div>
            <DetailViewerSection icon="summary" title={t('environmentsRoute.detail.metadataCard.title')} description={t('environmentsRoute.detail.metadataCard.description')} className="workspace-surface-card"><div className="request-editor-card__grid"><label className="request-field"><span>{t('environmentsRoute.detail.metadataCard.labels.name')}</span><input aria-label={t('environmentsRoute.detail.metadataCard.labels.name')} type="text" value={activeDraft.name} onChange={(event) => { const nextName = event.currentTarget.value; setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), name: nextName })); }} /></label><label className="request-field request-field--toggle"><span>{t('environmentsRoute.detail.metadataCard.labels.defaultEnvironment')}</span><input aria-label={t('environmentsRoute.detail.metadataCard.labels.defaultEnvironment')} type="checkbox" checked={activeDraft.isDefault} onChange={(event) => { const nextIsDefault = event.currentTarget.checked; setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), isDefault: nextIsDefault })); }} /></label><label className="request-field request-field--wide"><span>{t('environmentsRoute.detail.metadataCard.labels.description')}</span><textarea aria-label={t('environmentsRoute.detail.metadataCard.labels.description')} value={activeDraft.description} onChange={(event) => { const nextDescription = event.currentTarget.value; setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), description: nextDescription })); }} /></label></div></DetailViewerSection>
            <DetailViewerSection icon="code" title={t('environmentsRoute.detail.examplesCard.title')} description={t('environmentsRoute.detail.examplesCard.description')} className="workspace-surface-card workspace-surface-card--muted">
              <div className="request-script-helper-list">
                <p>{t('environmentsRoute.detail.examplesCard.replacementSyntaxNote')}</p>
                <p>{t('environmentsRoute.detail.examplesCard.scriptSyntaxNote')}</p>
                <p>{t('environmentsRoute.detail.examplesCard.secretPolicyNote')}</p>
                <p>{t('environmentsRoute.detail.examplesCard.replacementValueNote')}</p>
              </div>
              <div className="request-script-editor__meta">
                <div className="request-script-example">
                  <span>{t('environmentsRoute.detail.examplesCard.labels.url')}</span>
                  <pre>{t('environmentsRoute.detail.examplesCard.examples.url')}</pre>
                </div>
                <div className="request-script-example">
                  <span>{t('environmentsRoute.detail.examplesCard.labels.header')}</span>
                  <pre>{t('environmentsRoute.detail.examplesCard.examples.header')}</pre>
                </div>
                <div className="request-script-example">
                  <span>{t('environmentsRoute.detail.examplesCard.labels.jsonBody')}</span>
                  <pre>{t('environmentsRoute.detail.examplesCard.examples.jsonBody')}</pre>
                </div>
                <div className="request-script-example">
                  <span>{t('environmentsRoute.detail.examplesCard.labels.script')}</span>
                  <pre>{t('environmentsRoute.detail.examplesCard.examples.script')}</pre>
                </div>
              </div>
            </DetailViewerSection>
            <DetailViewerSection icon="params" title={t('environmentsRoute.detail.variablesCard.title')} description={t('environmentsRoute.detail.variablesCard.description')} className="workspace-surface-card" actions={<button type="button" className="workspace-button workspace-button--secondary" onClick={() => setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), variables: [...activeDraft.variables, createVariableDraft()] }))}><IconLabel icon="add">{t('environmentsRoute.detail.variablesCard.addAction')}</IconLabel></button>}>
              <div className="request-row-editor-list">{activeDraft.variables.map((row, index) => <div key={row.id ?? `environment-row-${index}`} className="environment-row-editor"><label className="request-field"><span>{t('environmentsRoute.detail.variablesCard.labels.key')}</span><input aria-label={t('environmentsRoute.detail.variablesCard.ariaLabels.key', { index: index + 1 })} type="text" value={row.key} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.currentTarget.value } : item) })} /></label><label className="request-field"><span>{t('environmentsRoute.detail.variablesCard.labels.valueType')}</span><select aria-label={t('environmentsRoute.detail.variablesCard.ariaLabels.valueType', { index: index + 1 })} value={row.valueType} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, valueType: event.currentTarget.value as EnvironmentValueType } : item) })}>{valueTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="request-field"><span>{t('environmentsRoute.detail.variablesCard.labels.description')}</span><input aria-label={t('environmentsRoute.detail.variablesCard.ariaLabels.description', { index: index + 1 })} type="text" value={row.description} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.currentTarget.value } : item) })} /></label><label className="request-field request-field--toggle"><span>{t('environmentsRoute.detail.variablesCard.labels.enabled')}</span><input aria-label={t('environmentsRoute.detail.variablesCard.ariaLabels.enabled', { index: index + 1 })} type="checkbox" checked={row.isEnabled} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, isEnabled: event.currentTarget.checked } : item) })} /></label><label className="request-field request-field--toggle"><span>{t('environmentsRoute.detail.variablesCard.labels.secret')}</span><input aria-label={t('environmentsRoute.detail.variablesCard.ariaLabels.secret', { index: index + 1 })} type="checkbox" checked={row.isSecret} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, isSecret: event.currentTarget.checked, value: '', replacementValue: '', clearStoredValue: false } : item) })} /></label>{row.isSecret ? <div className="environment-secret-editor"><p className="environment-secret-editor__status">{t('environmentsRoute.detail.variablesCard.secretStatus', { status: row.hasStoredValue && row.clearStoredValue !== true ? t('environmentsRoute.detail.variablesCard.secretStatusAvailable') : t('environmentsRoute.detail.variablesCard.secretStatusEmpty') })}</p><label className="request-field"><span>{t('environmentsRoute.detail.variablesCard.labels.secretReplacementValue')}</span><input aria-label={t('environmentsRoute.detail.variablesCard.ariaLabels.secretReplacementValue', { index: index + 1 })} type="password" value={row.replacementValue ?? ''} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, replacementValue: event.currentTarget.value, clearStoredValue: false } : item) })} /></label><button type="button" className="workspace-button workspace-button--ghost" aria-label={t('environmentsRoute.detail.variablesCard.ariaLabels.clearStoredSecret', { index: index + 1 })} onClick={() => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, replacementValue: '', clearStoredValue: true, hasStoredValue: false } : item) })}>{t('environmentsRoute.detail.variablesCard.clearStoredSecret')}</button></div> : <label className="request-field request-field--wide"><span>{t('environmentsRoute.detail.variablesCard.labels.variableValue')}</span><input aria-label={t('environmentsRoute.detail.variablesCard.ariaLabels.variableValue', { index: index + 1 })} type="text" value={row.value ?? ''} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.currentTarget.value } : item) })} /></label>}<button type="button" className="workspace-button workspace-button--ghost" aria-label={t('environmentsRoute.detail.variablesCard.ariaLabels.removeVariable', { index: index + 1 })} onClick={() => setDraft({ ...activeDraft, variables: activeDraft.variables.filter((_, itemIndex) => itemIndex !== index) })}>{t('environmentsRoute.detail.variablesCard.removeVariable')}</button></div>)}</div>
            </DetailViewerSection>
          </div>
        )}
        </section>
      )}
      detail={(
        <aside className="shell-panel shell-panel--detail" aria-label={t('shell.routePanels.detailRegion')}>
        <div className="workspace-detail-panel">
          <DetailViewerSection icon="info" title={t('environmentsRoute.detail.defaultGuidanceCard.title')} description={t('environmentsRoute.detail.defaultGuidanceCard.description')} className="workspace-surface-card"><KeyValueMetaList items={[{ label: t('environmentsRoute.detail.defaultGuidanceCard.labels.currentDefaultIntent'), value: activeDraft.isDefault ? t('environmentsRoute.detail.defaultGuidanceCard.values.currentDefaultIsThisDraft') : t('environmentsRoute.detail.defaultGuidanceCard.values.currentDefaultIsAnother') }, { label: t('environmentsRoute.detail.defaultGuidanceCard.labels.workspaceDefaultCount'), value: detailQuery.data?.isDefault ? t('environmentsRoute.detail.defaultGuidanceCard.values.workspaceDefaultCountActive') : t('environmentsRoute.detail.defaultGuidanceCard.values.workspaceDefaultCountServer') }, { label: t('environmentsRoute.detail.defaultGuidanceCard.labels.firstCreateBehavior'), value: t('environmentsRoute.detail.defaultGuidanceCard.values.firstCreateBehavior') }]} /></DetailViewerSection>
          <DetailViewerSection icon="shield" title={t('environmentsRoute.detail.secretHandlingCard.title')} description={t('environmentsRoute.detail.secretHandlingCard.description')} className="workspace-surface-card workspace-surface-card--muted"><EmptyStateCallout title={t('environmentsRoute.detail.secretHandlingCard.empty.title')} description={t('environmentsRoute.detail.secretHandlingCard.empty.description')} /></DetailViewerSection>
        </div>
        </aside>
      )}
    />
  );
}
