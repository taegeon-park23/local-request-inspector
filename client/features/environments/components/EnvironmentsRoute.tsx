import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { SectionHeading } from '@client/shared/ui/SectionHeading';
import { IconLabel } from '@client/shared/ui/IconLabel';

type EnvironmentSortOrder = 'default' | 'name' | 'updated';

const sortOptions: Array<{ value: EnvironmentSortOrder; label: string }> = [
  { value: 'default', label: 'Default first' },
  { value: 'name', label: 'Name' },
  { value: 'updated', label: 'Recently updated' },
];

const valueTypeOptions: Array<{ value: EnvironmentValueType; label: string }> = [
  { value: 'plain', label: 'Plain text' },
  { value: 'number', label: 'Number string' },
  { value: 'boolean', label: 'Boolean string' },
  { value: 'json', label: 'JSON string' },
];

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

function validateDraft(draft: EnvironmentInput) {
  const messages: string[] = [];
  if (draft.name.trim().length === 0) {
    messages.push('Environment name is required before saving.');
  }
  const seenKeys = new Set<string>();
  for (const row of draft.variables) {
    const key = row.key.trim();
    if (key.length === 0) {
      messages.push('Every variable row requires a key before saving.');
      continue;
    }
    const normalizedKey = key.toLowerCase();
    if (seenKeys.has(normalizedKey)) {
      messages.push(`Variable key "${key}" is duplicated.`);
    }
    seenKeys.add(normalizedKey);
  }
  return messages;
}

export function EnvironmentsRoute() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState<EnvironmentSortOrder>('default');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draft, setDraft] = useState<EnvironmentInput>(createEnvironmentDraft);

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

  const validationMessages = validateDraft(activeDraft);
  const saveDisabledReason = createMutation.isPending || updateMutation.isPending
    ? 'Persisting the environment resource.'
    : validationMessages[0] ?? null;
  const deleteDisabledReason = isCreatingDraft
    ? 'Discard the draft instead of deleting it. Only persisted environments can be deleted.'
    : deleteMutation.isPending ? 'Deleting the persisted environment.' : null;

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <div className="environments-explorer">
          <header className="environments-explorer__header">
            <div>
              <p className="section-placeholder__eyebrow">Environment management</p>
              <h2>Environment list</h2>
              <p>Persisted variables are managed here only. Request execution and environment selection wiring remain deferred.</p>
            </div>
            <button type="button" className="workspace-button" onClick={() => { setDraft(createEnvironmentDraft()); setIsCreatingDraft(true); setSelectedEnvironmentId(null); }}><IconLabel icon="new">New environment</IconLabel></button>
          </header>
          <div className="environments-filter-grid">
            <label className="request-field"><span>Search environments</span><input aria-label="Search environments" type="text" value={searchText} onChange={(event) => setSearchText(event.currentTarget.value)} /></label>
            <label className="request-field request-field--compact"><span>Sort environments</span><select aria-label="Sort environments" value={sortOrder} onChange={(event) => setSortOrder(event.currentTarget.value as EnvironmentSortOrder)}>{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>
          {listQuery.isPending && !listQuery.data ? <EmptyStateCallout title="Loading environments" description="Waiting for persisted environment summaries from the resource lane." /> : null}
          {listQuery.isError ? <EmptyStateCallout title="Environment management is degraded" description={listQuery.error instanceof Error ? listQuery.error.message : 'Environment resources could not be loaded cleanly.'} /> : null}
          {!listQuery.isPending && (listQuery.data ?? []).length === 0 ? <EmptyStateCallout title="No environments yet" description="Create the first environment to store workspace-scoped variables and establish the default environment badge." /> : null}
          {!listQuery.isPending && (listQuery.data ?? []).length > 0 && sortedItems.length === 0 ? <EmptyStateCallout title="No environments match these filters" description="Adjust the search text or sort order to bring persisted environment rows back into view." /> : null}
          {sortedItems.length > 0 ? <ul className="environments-list" aria-label="Environments list">{sortedItems.map((environment) => <li key={environment.id}><button type="button" className={environment.id === effectiveSelectedId && !isCreatingDraft ? 'workspace-request workspace-request--selected' : 'workspace-request'} aria-label={`Open environment ${environment.name}`} onClick={() => { setIsCreatingDraft(false); setSelectedEnvironmentId(environment.id); }}><span className="workspace-request__header"><span className="workspace-request__title">{environment.name}</span><span className="workspace-request__badges">{environment.isDefault ? <span className="workspace-chip">Default</span> : null}<span className="workspace-chip workspace-chip--secondary">{environment.variableCount} vars</span></span></span><span className="workspace-request__meta">{environment.description || 'No description yet'}</span><span className="workspace-request__meta">{environment.resolutionSummary}</span></button></li>)}</ul> : null}
        </div>
      </section>
      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <SectionHeading
          icon="environments"
          title="Environments"
          summary="Environments persist workspace-scoped variables and secret placeholders only. Runtime resolution and request binding remain deferred."
        />
        {listQuery.isPending && !listQuery.data ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title="Loading environment detail" description="Environment detail appears after the persisted list is available." /></div> : !isCreatingDraft && !detailQuery.data ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title="No environment selected" description="Choose a persisted environment or start a new environment draft to edit metadata and variable rows." /></div> : detailQuery.isPending && !detailQuery.data && !isCreatingDraft ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title="Loading persisted environment detail" description="Fetching the selected environment before editable variable rows are shown." /></div> : (
          <div className="environments-detail">
            <header className="environments-detail__header">
              <div>
                <p className="section-placeholder__eyebrow">{isCreatingDraft ? 'New environment draft' : 'Persisted environment detail'}</p>
                <h2>{isCreatingDraft ? 'Create environment' : 'Edit environment'}</h2>
                <p>{detailQuery.data?.resolutionSummary ?? 'Create an environment before runtime resolution is connected elsewhere.'}</p>
              </div>
              <div className="request-work-surface__badges"><span className="workspace-chip">{activeDraft.variables.filter((row) => row.isEnabled !== false).length} enabled</span><span className="workspace-chip workspace-chip--secondary">{activeDraft.variables.filter((row) => row.isSecret === true).length} secret</span>{activeDraft.isDefault ? <span className="workspace-chip">Default environment</span> : null}</div>
            </header>
            <DetailViewerSection icon="summary" title="Management boundary" description="Save persists environment metadata and variable rows only." className="workspace-surface-card" actions={<div className="request-work-surface__future-actions"><button type="button" className="workspace-button workspace-button--secondary" onClick={() => { if (!saveDisabledReason) { if (isCreatingDraft || !activeDraft.id) { createMutation.mutate(activeDraft); } else { updateMutation.mutate({ environmentId: activeDraft.id, environment: activeDraft }); } } }} disabled={saveDisabledReason !== null}><IconLabel icon="save">{isCreatingDraft ? 'Create environment' : 'Save environment'}</IconLabel></button>{isCreatingDraft ? <button type="button" className="workspace-button workspace-button--ghost" onClick={() => { setIsCreatingDraft(false); setSelectedEnvironmentId(sortedItems[0]?.id ?? null); }}>Cancel draft</button> : <button type="button" className="workspace-button workspace-button--ghost" onClick={() => { if (detailQuery.data && !deleteDisabledReason) { deleteMutation.mutate(detailQuery.data.id); } }} disabled={deleteDisabledReason !== null}><IconLabel icon="delete">Delete environment</IconLabel></button>}</div>}>
              <p className="shared-readiness-note">{saveDisabledReason ?? deleteDisabledReason ?? 'Secret rows stay write-only. Save applies replacement or clear operations without echoing secret raw values back into the UI.'}</p>
              {validationMessages.length > 0 ? <ul className="environment-validation-list" aria-label="Environment validation messages">{validationMessages.map((message) => <li key={message}>{message}</li>)}</ul> : null}
              {(createMutation.error || updateMutation.error || deleteMutation.error) ? <EmptyStateCallout title="Environment mutation failed" description={([createMutation.error, updateMutation.error, deleteMutation.error].find(Boolean) as Error | undefined)?.message ?? 'Environment mutation failed.'} /> : null}
            </DetailViewerSection>
            <div className="environments-summary-grid">
              <DetailViewerSection icon="environments" title="Environment summary" description="Default status stays unique within the workspace resource lane." className="workspace-surface-card"><KeyValueMetaList items={[{ label: 'Environment name', value: activeDraft.name || 'Untitled environment' }, { label: 'Default', value: activeDraft.isDefault ? 'Yes' : 'No' }, { label: 'Variable count', value: activeDraft.variables.length }, { label: 'Enabled variables', value: activeDraft.variables.filter((row) => row.isEnabled !== false).length }, { label: 'Secret-backed variables', value: activeDraft.variables.filter((row) => row.isSecret === true).length }]} /></DetailViewerSection>
              <DetailViewerSection icon="shield" title="Secret policy" description="Secret raw values never echo back out of the read model." className="workspace-surface-card workspace-surface-card--muted"><KeyValueMetaList items={[{ label: 'Read model', value: 'Masked write-only secret rows' }, { label: 'Stored indicator', value: 'hasStoredValue only' }, { label: 'Update policy', value: 'Replacement value or explicit clear only' }, { label: 'Runtime linkage', value: 'Deferred beyond this route' }]} /></DetailViewerSection>
            </div>
            <DetailViewerSection icon="summary" title="Environment metadata" description="Descriptions help operators separate local, staging, and shared defaults before selector wiring arrives." className="workspace-surface-card"><div className="request-editor-card__grid"><label className="request-field"><span>Environment name</span><input aria-label="Environment name" type="text" value={activeDraft.name} onChange={(event) => setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), name: event.currentTarget.value }))} /></label><label className="request-field request-field--toggle"><span>Default environment</span><input aria-label="Default environment" type="checkbox" checked={activeDraft.isDefault} onChange={(event) => setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), isDefault: event.currentTarget.checked }))} /></label><label className="request-field request-field--wide"><span>Environment description</span><textarea aria-label="Environment description" value={activeDraft.description} onChange={(event) => setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), description: event.currentTarget.value }))} /></label></div></DetailViewerSection>
            <DetailViewerSection icon="params" title="Variable rows" description="Secret rows remain masked, and valueType only documents intended interpretation in this slice." className="workspace-surface-card" actions={<button type="button" className="workspace-button workspace-button--secondary" onClick={() => setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), variables: [...activeDraft.variables, createVariableDraft()] }))}><IconLabel icon="add">Add variable</IconLabel></button>}>
              <div className="request-row-editor-list">{activeDraft.variables.map((row, index) => <div key={row.id ?? `environment-row-${index}`} className="environment-row-editor"><label className="request-field"><span>Variable key</span><input aria-label={`Variable key ${index + 1}`} type="text" value={row.key} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.currentTarget.value } : item) })} /></label><label className="request-field"><span>Value type</span><select aria-label={`Variable value type ${index + 1}`} value={row.valueType} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, valueType: event.currentTarget.value as EnvironmentValueType } : item) })}>{valueTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="request-field"><span>Description</span><input aria-label={`Variable description ${index + 1}`} type="text" value={row.description} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.currentTarget.value } : item) })} /></label><label className="request-field request-field--toggle"><span>Variable enabled</span><input aria-label={`Variable enabled ${index + 1}`} type="checkbox" checked={row.isEnabled} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, isEnabled: event.currentTarget.checked } : item) })} /></label><label className="request-field request-field--toggle"><span>Secret variable</span><input aria-label={`Secret variable ${index + 1}`} type="checkbox" checked={row.isSecret} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, isSecret: event.currentTarget.checked, value: '', replacementValue: '', clearStoredValue: false } : item) })} /></label>{row.isSecret ? <div className="environment-secret-editor"><p className="environment-secret-editor__status">Stored secret: {row.hasStoredValue && row.clearStoredValue !== true ? 'available' : 'empty'}</p><label className="request-field"><span>Secret replacement value</span><input aria-label={`Secret replacement value ${index + 1}`} type="password" value={row.replacementValue ?? ''} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, replacementValue: event.currentTarget.value, clearStoredValue: false } : item) })} /></label><button type="button" className="workspace-button workspace-button--ghost" onClick={() => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, replacementValue: '', clearStoredValue: true, hasStoredValue: false } : item) })}>Clear stored secret</button></div> : <label className="request-field request-field--wide"><span>Variable value</span><input aria-label={`Variable value ${index + 1}`} type="text" value={row.value ?? ''} onChange={(event) => setDraft({ ...activeDraft, variables: activeDraft.variables.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.currentTarget.value } : item) })} /></label>}<button type="button" className="workspace-button workspace-button--ghost" onClick={() => setDraft({ ...activeDraft, variables: activeDraft.variables.filter((_, itemIndex) => itemIndex !== index) })}>Remove variable</button></div>)}</div>
            </DetailViewerSection>
          </div>
        )}
      </section>
      <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
        <div className="workspace-detail-panel">
          <DetailViewerSection icon="info" title="Default environment guidance" description="One workspace environment remains default whenever at least one environment exists." className="workspace-surface-card"><KeyValueMetaList items={[{ label: 'Current default intent', value: activeDraft.isDefault ? 'This draft is marked as default.' : 'Another environment remains or will remain default.' }, { label: 'Workspace default count', value: detailQuery.data?.isDefault ? '1 active default in list view' : 'Default is enforced server-side on save' }, { label: 'First-create behavior', value: 'The first persisted environment becomes default automatically.' }]} /></DetailViewerSection>
          <DetailViewerSection icon="shield" title="Secret handling" description="Secret values stay write-only and are never re-hydrated into visible text inputs." className="workspace-surface-card workspace-surface-card--muted"><EmptyStateCallout title="Secret rows remain masked" description="Read responses expose only hasStoredValue. Save accepts replacementValue or clearStoredValue, and later runtime resolution still stays outside this route." /></DetailViewerSection>
        </div>
      </aside>
    </>
  );
}
