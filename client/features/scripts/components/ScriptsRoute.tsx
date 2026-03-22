import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  createSavedScript,
  deleteSavedScript,
  listScriptTemplates,
  listWorkspaceScripts,
  readSavedScript,
  savedScriptDetailQueryKey,
  scriptTemplatesQueryKey,
  sortSavedScripts,
  updateSavedScript,
  workspaceScriptsQueryKey,
} from '@client/features/scripts/scripts.api';
import type {
  SavedScriptInput,
  ScriptTemplateRecord,
  ScriptType,
} from '@client/features/scripts/scripts.types';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';

type ScriptStageFilter = 'all' | ScriptType;

const stageFilterOptions: Array<{ value: ScriptStageFilter; label: string }> = [
  { value: 'all', label: 'All stages' },
  { value: 'pre-request', label: 'Pre-request' },
  { value: 'post-response', label: 'Post-response' },
  { value: 'tests', label: 'Tests' },
];

function createScriptDraft(): SavedScriptInput {
  return { name: '', description: '', scriptType: 'pre-request', sourceCode: '' };
}

function createDraftFromSavedScript(script: Awaited<ReturnType<typeof readSavedScript>>): SavedScriptInput {
  return {
    id: script.id,
    name: script.name,
    description: script.description,
    scriptType: script.scriptType,
    sourceCode: script.sourceCode,
    ...(script.templateId ? { templateId: script.templateId } : {}),
  };
}

function createDraftFromTemplate(template: ScriptTemplateRecord): SavedScriptInput {
  return {
    name: `${template.name} copy`,
    description: template.description,
    scriptType: template.templateType,
    sourceCode: template.sourceCode,
    templateId: template.id,
  };
}

export function ScriptsRoute() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [stageFilter, setStageFilter] = useState<ScriptStageFilter>('all');
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draft, setDraft] = useState<SavedScriptInput>(createScriptDraft);

  const listQuery = useQuery({ queryKey: workspaceScriptsQueryKey, queryFn: listWorkspaceScripts });
  const templatesQuery = useQuery({ queryKey: scriptTemplatesQueryKey, queryFn: listScriptTemplates });
  const filteredItems = (listQuery.data ?? []).filter((item) => {
    const normalizedSearchText = searchText.trim().toLowerCase();
    const matchesSearch = normalizedSearchText.length === 0 || [item.name, item.description, item.sourcePreview, item.templateSummary]
      .some((value) => value.toLowerCase().includes(normalizedSearchText));
    const matchesStage = stageFilter === 'all' || item.scriptType === stageFilter;
    return matchesSearch && matchesStage;
  });
  const sortedItems = sortSavedScripts(filteredItems);
  const effectiveSelectedId = !isCreatingDraft
    ? (sortedItems.some((item) => item.id === selectedScriptId) ? selectedScriptId : (sortedItems[0]?.id ?? null))
    : null;

  const detailQuery = useQuery({
    queryKey: savedScriptDetailQueryKey(effectiveSelectedId),
    queryFn: () => readSavedScript(effectiveSelectedId!),
    enabled: effectiveSelectedId !== null && !isCreatingDraft,
  });

  const activeDraft = isCreatingDraft
    ? draft
    : detailQuery.data
      ? (draft.id === detailQuery.data.id ? draft : createDraftFromSavedScript(detailQuery.data))
      : draft;

  const selectedTemplate = typeof activeDraft.templateId === 'string'
    ? (templatesQuery.data ?? []).find((template) => template.id === activeDraft.templateId) ?? null
    : null;

  const createMutation = useMutation({
    mutationFn: createSavedScript,
    onSuccess: async (script) => {
      queryClient.setQueryData(savedScriptDetailQueryKey(script.id), script);
      await queryClient.invalidateQueries({ queryKey: workspaceScriptsQueryKey });
      setIsCreatingDraft(false);
      setSelectedScriptId(script.id);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ scriptId, script }: { scriptId: string; script: SavedScriptInput }) => updateSavedScript(scriptId, script),
    onSuccess: async (script) => {
      queryClient.setQueryData(savedScriptDetailQueryKey(script.id), script);
      await queryClient.invalidateQueries({ queryKey: workspaceScriptsQueryKey });
      setSelectedScriptId(script.id);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteSavedScript,
    onSuccess: async (scriptId) => {
      queryClient.removeQueries({ queryKey: savedScriptDetailQueryKey(scriptId) });
      await queryClient.invalidateQueries({ queryKey: workspaceScriptsQueryKey });
      setSelectedScriptId(null);
      setIsCreatingDraft(false);
    },
  });

  const saveDisabledReason = createMutation.isPending || updateMutation.isPending
    ? 'Persisting the saved script resource.'
    : activeDraft.name.trim().length === 0
      ? 'Script name is required before saving.'
      : null;
  const deleteDisabledReason = isCreatingDraft
    ? 'Discard the draft instead of deleting it. Only persisted scripts can be deleted.'
    : deleteMutation.isPending ? 'Deleting the persisted script.' : null;

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <div className="scripts-explorer">
          <header className="scripts-explorer__header">
            <div>
              <p className="section-placeholder__eyebrow">Saved scripts library</p>
              <h2>Scripts list</h2>
              <p>Top-level Scripts manages standalone saved scripts and read-only starter templates. Request-stage attachment remains deferred.</p>
            </div>
            <button type="button" className="workspace-button" onClick={() => { setDraft(createScriptDraft()); setIsCreatingDraft(true); setSelectedScriptId(null); }}>New script</button>
          </header>
          <div className="scripts-filter-grid">
            <label className="request-field"><span>Search scripts</span><input aria-label="Search scripts" type="text" value={searchText} onChange={(event) => setSearchText(event.currentTarget.value)} /></label>
            <label className="request-field request-field--compact"><span>Stage filter</span><select aria-label="Stage filter" value={stageFilter} onChange={(event) => setStageFilter(event.currentTarget.value as ScriptStageFilter)}>{stageFilterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>
          {listQuery.isPending && !listQuery.data ? <EmptyStateCallout title="Loading saved scripts" description="Waiting for the persisted script library before a detail row can be selected." /> : null}
          {listQuery.isError ? <EmptyStateCallout title="Scripts library is degraded" description={listQuery.error instanceof Error ? listQuery.error.message : 'Saved scripts could not be loaded cleanly.'} /> : null}
          {!listQuery.isPending && (listQuery.data ?? []).length === 0 ? <EmptyStateCallout title="No saved scripts yet" description="Create a blank script or copy a system template into the standalone library." /> : null}
          {!listQuery.isPending && (listQuery.data ?? []).length > 0 && sortedItems.length === 0 ? <EmptyStateCallout title="No saved scripts match these filters" description="Adjust the search text or stage filter to bring persisted script rows back into view." /> : null}
          {sortedItems.length > 0 ? <ul className="scripts-list" aria-label="Scripts list">{sortedItems.map((script) => <li key={script.id}><button type="button" className={script.id === effectiveSelectedId && !isCreatingDraft ? 'workspace-request workspace-request--selected' : 'workspace-request'} aria-label={`Open script ${script.name}`} onClick={() => { setIsCreatingDraft(false); setSelectedScriptId(script.id); }}><span className="workspace-request__header"><span className="workspace-request__title">{script.name}</span><span className="workspace-request__badges"><span className="workspace-chip">{script.scriptType}</span></span></span><span className="workspace-request__meta">{script.description || 'No description yet'}</span><span className="workspace-request__meta">{script.sourcePreview || 'Empty source'}</span></button></li>)}</ul> : null}
        </div>
      </section>
      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <header className="section-placeholder__header">
          <p className="section-placeholder__eyebrow">Top-level section</p>
          <h1>Scripts</h1>
          <p>Scripts stores standalone saved stage snippets and read-only system templates. Request-bound attachment and live shared references remain outside this slice.</p>
        </header>
        {listQuery.isPending && !listQuery.data ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title="Loading script detail" description="Saved script detail appears after the persisted list is available." /></div> : !isCreatingDraft && !detailQuery.data ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title="No script selected" description="Choose a persisted script or start a blank or template draft to edit source code in the standalone library." /></div> : detailQuery.isPending && !detailQuery.data && !isCreatingDraft ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title="Loading persisted script detail" description="Fetching the selected saved script before editable fields are shown." /></div> : (
          <div className="scripts-detail">
            <header className="scripts-detail__header">
              <div>
                <p className="section-placeholder__eyebrow">{isCreatingDraft ? 'New script draft' : 'Persisted script detail'}</p>
                <h2>{isCreatingDraft ? 'Create saved script' : 'Edit saved script'}</h2>
                <p>{detailQuery.data?.capabilitySummary ?? selectedTemplate?.capabilitySummary ?? 'Saved scripts stay standalone in this route.'}</p>
              </div>
              <div className="request-work-surface__badges"><span className="workspace-chip">{activeDraft.scriptType}</span>{selectedTemplate ? <span className="workspace-chip workspace-chip--secondary">Template seeded</span> : null}</div>
            </header>
            <DetailViewerSection title="Management boundary" description="Save persists standalone scripts only. Request-stage attachment, backlinks, and reference semantics remain deferred." className="workspace-surface-card" actions={<div className="request-work-surface__future-actions"><button type="button" className="workspace-button workspace-button--secondary" onClick={() => { if (!saveDisabledReason) { if (isCreatingDraft || !activeDraft.id) { createMutation.mutate(activeDraft); } else { updateMutation.mutate({ scriptId: activeDraft.id, script: activeDraft }); } } }} disabled={saveDisabledReason !== null}>{isCreatingDraft ? 'Create script' : 'Save script'}</button>{isCreatingDraft ? <button type="button" className="workspace-button workspace-button--ghost" onClick={() => { setIsCreatingDraft(false); setSelectedScriptId(sortedItems[0]?.id ?? null); }}>Cancel draft</button> : <button type="button" className="workspace-button workspace-button--ghost" onClick={() => { if (detailQuery.data && !deleteDisabledReason) { deleteMutation.mutate(detailQuery.data.id); } }} disabled={deleteDisabledReason !== null}>Delete script</button>}</div>}>
              <p className="shared-readiness-note">{saveDisabledReason ?? deleteDisabledReason ?? 'Templates can seed a new saved script, but template CRUD, request linking, and Monaco-class editing remain deferred.'}</p>
              {(createMutation.error || updateMutation.error || deleteMutation.error) ? <EmptyStateCallout title="Script mutation failed" description={([createMutation.error, updateMutation.error, deleteMutation.error].find(Boolean) as Error | undefined)?.message ?? 'Script mutation failed.'} /> : null}
            </DetailViewerSection>
            <div className="scripts-summary-grid">
              <DetailViewerSection title="Script summary" description="Saved scripts are workspace-scoped resources rather than runtime history artifacts." className="workspace-surface-card"><KeyValueMetaList items={[{ label: 'Script name', value: activeDraft.name || 'Untitled script' }, { label: 'Script type', value: activeDraft.scriptType }, { label: 'Template source', value: selectedTemplate?.name ?? 'Blank draft or direct authoring' }, { label: 'Source length', value: `${activeDraft.sourceCode.length} characters` }]} /></DetailViewerSection>
              <DetailViewerSection title="Capability guidance" description="Each stage keeps its existing bounded runtime semantics." className="workspace-surface-card workspace-surface-card--muted"><KeyValueMetaList items={[{ label: 'Current stage', value: activeDraft.scriptType }, { label: 'Capability summary', value: detailQuery.data?.capabilitySummary ?? selectedTemplate?.capabilitySummary ?? 'Stage capability guidance appears here.' }, { label: 'Deferred note', value: detailQuery.data?.deferredSummary ?? 'Attachment, backlinks, and live reference behavior remain deferred.' }]} /></DetailViewerSection>
            </div>
            <DetailViewerSection title="Saved script editor" description="Textarea-based editing remains intentionally lightweight in this MVP." className="workspace-surface-card"><div className="request-editor-card__grid"><label className="request-field"><span>Script name</span><input aria-label="Script name" type="text" value={activeDraft.name} onChange={(event) => setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), name: event.currentTarget.value }))} /></label><label className="request-field"><span>Script stage</span><select aria-label="Script stage" value={activeDraft.scriptType} onChange={(event) => setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), scriptType: event.currentTarget.value as ScriptType }))}>{stageFilterOptions.filter((option) => option.value !== 'all').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="request-field request-field--wide"><span>Script description</span><textarea aria-label="Script description" value={activeDraft.description} onChange={(event) => setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), description: event.currentTarget.value }))} /></label><label className="request-field request-field--wide"><span>Script source</span><textarea aria-label="Script source" value={activeDraft.sourceCode} onChange={(event) => setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), sourceCode: event.currentTarget.value }))} /></label></div></DetailViewerSection>
          </div>
        )}
      </section>
      <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
        <div className="workspace-detail-panel">
          {templatesQuery.isPending ? <EmptyStateCallout title="Loading script templates" description="System starter templates are loading for standalone copy-first authoring." /> : templatesQuery.isError ? <EmptyStateCallout title="Script templates are degraded" description={templatesQuery.error instanceof Error ? templatesQuery.error.message : 'System templates could not be loaded cleanly.'} /> : <ul className="scripts-template-list" aria-label="Script templates list">{(templatesQuery.data ?? []).map((template) => <li key={template.id} className="scripts-template-card"><div><h3>{template.name}</h3><p>{template.description}</p><div className="workspace-explorer__role-strip"><span className="workspace-chip">{template.templateType}</span><span className="workspace-chip workspace-chip--secondary">{template.tags.join(', ')}</span></div></div><pre className="scripts-template-card__preview">{template.sourceCode}</pre><button type="button" className="workspace-button workspace-button--secondary" onClick={() => { setDraft(createDraftFromTemplate(template)); setIsCreatingDraft(true); setSelectedScriptId(null); }}>Use {template.name}</button></li>)}</ul>}
        </div>
      </aside>
    </>
  );
}
