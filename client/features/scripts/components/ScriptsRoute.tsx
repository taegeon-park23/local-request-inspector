import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@client/app/providers/useI18n';
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
import { ScriptCodeEditor } from '@client/shared/code-editor/ScriptCodeEditor';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { IconLabel } from '@client/shared/ui/IconLabel';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { SectionHeading } from '@client/shared/ui/SectionHeading';
import { RoutePanelTabsLayout } from '@client/features/route-panel-tabs-layout';
import { useWorkspaceUiStore } from '@client/features/workspace/state/workspace-ui-store';
import { useShellStore } from '@client/app/providers/shell-store';
import { resolveApiErrorMessage } from '@client/shared/api-error-message';

type ScriptStageFilter = 'all' | ScriptType;

function parseScriptStageFilter(value: string | null): ScriptStageFilter {
  return value === 'pre-request' || value === 'post-response' || value === 'tests' ? value : 'all';
}

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

function createDraftFromTemplate(template: ScriptTemplateRecord, copySuffix: string): SavedScriptInput {
  return {
    name: `${template.name} ${copySuffix}`,
    description: template.description,
    scriptType: template.templateType,
    sourceCode: template.sourceCode,
    templateId: template.id,
  };
}

function getScriptTypeLabel(scriptType: ScriptType, t: ReturnType<typeof useI18n>['t']) {
  switch (scriptType) {
    case 'pre-request':
      return t('scriptsRoute.stageFilterOptions.preRequest');
    case 'post-response':
      return t('scriptsRoute.stageFilterOptions.postResponse');
    case 'tests':
      return t('scriptsRoute.stageFilterOptions.tests');
    default:
      return scriptType;
  }
}

export function ScriptsRoute() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const requestedStageFilter = parseScriptStageFilter(searchParams.get('stage'));
  const requestedScriptId = searchParams.get('scriptId');
  const openedFromRequestStage = searchParams.get('from') === 'request-stage';
  const [searchText, setSearchText] = useState('');
  const [stageFilter, setStageFilter] = useState<ScriptStageFilter>(requestedStageFilter);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(requestedScriptId);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const activePanel = useWorkspaceUiStore((state) => state.routePanels.scripts.activePanel);
  const setRouteActivePanel = useWorkspaceUiStore((state) => state.setRouteActivePanel);
  const setFloatingExplorerOpen = useShellStore((state) => state.setFloatingExplorerOpen);

  const [draft, setDraft] = useState<SavedScriptInput>(createScriptDraft);

  const stageFilterOptions: Array<{ value: ScriptStageFilter; label: string }> = [
    { value: 'all', label: t('scriptsRoute.stageFilterOptions.all') },
    { value: 'pre-request', label: t('scriptsRoute.stageFilterOptions.preRequest') },
    { value: 'post-response', label: t('scriptsRoute.stageFilterOptions.postResponse') },
    { value: 'tests', label: t('scriptsRoute.stageFilterOptions.tests') },
  ];
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
  const requestedStageLabel = requestedStageFilter === 'all' ? null : getScriptTypeLabel(requestedStageFilter, t);
  const requestedListScript = (listQuery.data ?? []).find((item) => item.id === requestedScriptId) ?? null;
  const detailDegradedReason = resolveApiErrorMessage(
    detailQuery.error,
    t('scriptsRoute.empty.degraded.fallbackDescription'),
    t,
  );

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
    ? t('scriptsRoute.detail.management.pendingSave')
    : activeDraft.name.trim().length === 0
      ? t('scriptsRoute.detail.management.nameRequired')
      : null;
  const deleteDisabledReason = isCreatingDraft
    ? t('scriptsRoute.detail.management.draftDeleteGuard')
    : deleteMutation.isPending
      ? t('scriptsRoute.detail.management.pendingDelete')
      : null;

  return (
    <RoutePanelTabsLayout
      layoutMode="floating-explorer"
      floatingExplorerRouteKey="scripts"
      floatingExplorerVariant="focused-overlay"
      defaultActiveTab="explorer"
      activeTab={activePanel}
      onActiveTabChange={(panel) => setRouteActivePanel('scripts', panel)}
      explorer={(
        <section className="shell-panel shell-panel--sidebar" aria-label={t('shell.routePanels.explorerRegion')}>
          <div className="scripts-explorer">
            <header className="scripts-explorer__header">
              <div>
                <p className="section-placeholder__eyebrow">{t('scriptsRoute.sidebar.eyebrow')}</p>
                <h2>{t('scriptsRoute.sidebar.title')}</h2>
                <p className="workspace-explorer__status-line">{t('scriptsRoute.sidebar.summary')}</p>
              </div>
              <button
                type="button"
                className="workspace-button"
                onClick={() => {
                  setDraft(createScriptDraft());
                  setIsCreatingDraft(true);
                  setSelectedScriptId(null);
                  setFloatingExplorerOpen('scripts', false);
                }}
              >
                <IconLabel icon="new">{t('scriptsRoute.sidebar.newButton')}</IconLabel>
              </button>
            </header>
            <div className="scripts-filter-grid">
              <label className="request-field">
                <span>{t('scriptsRoute.sidebar.searchLabel')}</span>
                <input
                  aria-label={t('scriptsRoute.sidebar.searchLabel')}
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.currentTarget.value)}
                />
              </label>
              <label className="request-field request-field--compact">
                <span>{t('scriptsRoute.sidebar.stageFilterLabel')}</span>
                <select
                  aria-label={t('scriptsRoute.sidebar.stageFilterLabel')}
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.currentTarget.value as ScriptStageFilter)}
                >
                  {stageFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {listQuery.isPending && !listQuery.data ? <EmptyStateCallout title={t('scriptsRoute.empty.loadingList.title')} description={t('scriptsRoute.empty.loadingList.description')} /> : null}
            {listQuery.isError ? <EmptyStateCallout title={t('scriptsRoute.empty.degraded.title')} description={resolveApiErrorMessage(listQuery.error, t('scriptsRoute.empty.degraded.fallbackDescription'), t)} /> : null}
            {!listQuery.isPending && (listQuery.data ?? []).length === 0 ? <EmptyStateCallout title={t('scriptsRoute.empty.noItems.title')} description={t('scriptsRoute.empty.noItems.description')} /> : null}
            {!listQuery.isPending && (listQuery.data ?? []).length > 0 && sortedItems.length === 0 ? <EmptyStateCallout title={t('scriptsRoute.empty.noFilteredItems.title')} description={t('scriptsRoute.empty.noFilteredItems.description')} /> : null}
            {sortedItems.length > 0 ? (
              <ul className="scripts-list" aria-label={t('scriptsRoute.sidebar.listAriaLabel')}>
                {sortedItems.map((script) => {
                  const description = script.description || t('scriptsRoute.list.noDescription');
                  const sourcePreview = script.sourcePreview || t('scriptsRoute.list.emptySource');
                  return (
                    <li key={script.id}>
                      <button
                        type="button"
                        className={script.id === effectiveSelectedId && !isCreatingDraft ? 'workspace-request workspace-request--selected' : 'workspace-request'}
                        aria-label={t('scriptsRoute.sidebar.openScriptAction', { name: script.name })}
                        onClick={() => {
                          setIsCreatingDraft(false);
                          setSelectedScriptId(script.id);
                          setFloatingExplorerOpen('scripts', false);
                        }}
                      >
                        <span className="workspace-request__header">
                          <span className="workspace-request__title">{script.name}</span>
                          <span className="workspace-request__badges">
                            <span className="workspace-chip">{getScriptTypeLabel(script.scriptType, t)}</span>
                          </span>
                        </span>
                        <span className="workspace-request__meta workspace-request__meta--clamped" title={description}>{description}</span>
                        <span className="workspace-request__meta workspace-request__meta--support workspace-request__meta--clamped" title={sourcePreview}>{sourcePreview}</span>
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
          <SectionHeading icon="scripts" title={t('routes.scripts.title')} summary={t('routes.scripts.summary')} />
          {openedFromRequestStage ? (
            <DetailViewerSection
              icon="scripts"
              title={t('scriptsRoute.libraryAssist.title')}
              description={t('scriptsRoute.libraryAssist.description')}
              className="workspace-surface-card scripts-route-bridge-card"
              tone="supporting"
              actions={(
                <button
                  type="button"
                  className="workspace-button workspace-button--secondary"
                  onClick={() => navigate('/workspace')}
                >
                  <IconLabel icon="replay">{t('scriptsRoute.libraryAssist.backAction')}</IconLabel>
                </button>
              )}
            >
              <div className="shared-support-block shared-support-block--notes">
                <p className="shared-readiness-note">
                  {requestedStageLabel
                    ? t('scriptsRoute.libraryAssist.stageContext', { stage: requestedStageLabel })
                    : t('scriptsRoute.libraryAssist.genericContext')}
                </p>
                {requestedListScript ? (
                  <p className="shared-readiness-note">
                    {t('scriptsRoute.libraryAssist.scriptContext', { name: requestedListScript.name })}
                  </p>
                ) : null}
              </div>
            </DetailViewerSection>
          ) : null}
          {listQuery.isPending && !listQuery.data ? (
            <div className="request-work-surface request-work-surface--empty">
              <EmptyStateCallout title={t('scriptsRoute.empty.loadingDetail.title')} description={t('scriptsRoute.empty.loadingDetail.description')} />
            </div>
          ) : detailQuery.isPending && !detailQuery.data && !isCreatingDraft ? (
            <div className="request-work-surface request-work-surface--empty">
              <EmptyStateCallout title={t('scriptsRoute.empty.loadingPersistedDetail.title')} description={t('scriptsRoute.empty.loadingPersistedDetail.description')} />
            </div>
          ) : detailQuery.isError && !isCreatingDraft ? (
            <div className="request-work-surface request-work-surface--empty">
              <EmptyStateCallout title={t('scriptsRoute.empty.degraded.title')} description={`${t('scriptsRoute.empty.degraded.fallbackDescription')} ${detailDegradedReason}`} />
            </div>
          ) : !isCreatingDraft && !detailQuery.data ? (
            <div className="request-work-surface request-work-surface--empty">
              <EmptyStateCallout title={t('scriptsRoute.empty.noSelection.title')} description={t('scriptsRoute.empty.noSelection.description')} />
            </div>
          ) : (
            <div className="scripts-detail">
              <header className="scripts-detail__header management-detail__header">
                <div>
                  <p className="section-placeholder__eyebrow">{isCreatingDraft ? t('scriptsRoute.detail.draftEyebrow') : t('scriptsRoute.detail.persistedEyebrow')}</p>
                  <h2>{isCreatingDraft ? t('scriptsRoute.detail.createTitle') : t('scriptsRoute.detail.editTitle')}</h2>
                  <p className="management-detail__header-meta">{detailQuery.data?.capabilitySummary ?? selectedTemplate?.capabilitySummary ?? t('scriptsRoute.detail.fallbackSummary')}</p>
                </div>
                <div className="request-work-surface__badges management-detail__badge-rail">
                  <span className="workspace-chip">{getScriptTypeLabel(activeDraft.scriptType, t)}</span>
                  {selectedTemplate ? <span className="workspace-chip workspace-chip--secondary">{t('scriptsRoute.detail.templateSeededChip')}</span> : null}
                </div>
              </header>
              <DetailViewerSection
                icon="summary"
                title={t('scriptsRoute.detail.management.title')}
                description={t('scriptsRoute.detail.management.description')}
                className="workspace-surface-card"
                actions={(
                  <div className="shared-action-bar">
                    <button
                      type="button"
                      className="workspace-button workspace-button--secondary"
                      onClick={() => {
                        if (!saveDisabledReason) {
                          if (isCreatingDraft || !activeDraft.id) {
                            createMutation.mutate(activeDraft);
                          } else {
                            updateMutation.mutate({ scriptId: activeDraft.id, script: activeDraft });
                          }
                        }
                      }}
                      disabled={saveDisabledReason !== null}
                    >
                      <IconLabel icon="save">{isCreatingDraft ? t('scriptsRoute.detail.management.createAction') : t('scriptsRoute.detail.management.saveAction')}</IconLabel>
                    </button>
                    {isCreatingDraft ? (
                      <button
                        type="button"
                        className="workspace-button workspace-button--ghost"
                        onClick={() => {
                          setIsCreatingDraft(false);
                          setSelectedScriptId(sortedItems[0]?.id ?? null);
                        }}
                      >
                        {t('scriptsRoute.detail.management.cancelDraft')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="workspace-button workspace-button--ghost"
                        onClick={() => {
                          if (detailQuery.data && !deleteDisabledReason) {
                            deleteMutation.mutate(detailQuery.data.id);
                          }
                        }}
                        disabled={deleteDisabledReason !== null}
                      >
                        <IconLabel icon="delete">{t('scriptsRoute.detail.management.deleteAction')}</IconLabel>
                      </button>
                    )}
                  </div>
                )}
              >
                <div className="shared-support-block shared-support-block--notes">
                  <p className="shared-readiness-note">{saveDisabledReason ?? deleteDisabledReason ?? t('scriptsRoute.detail.management.readinessNote')}</p>
                </div>
                {(createMutation.error || updateMutation.error || deleteMutation.error) ? (
                  <div className="shared-support-block shared-support-block--notes">
                    <EmptyStateCallout
                      title={t('scriptsRoute.detail.management.mutationFailedTitle')}
                      description={([createMutation.error, updateMutation.error, deleteMutation.error].find(Boolean) as Error | undefined)?.message ?? t('scriptsRoute.detail.management.mutationFailedFallbackDescription')}
                    />
                  </div>
                ) : null}
              </DetailViewerSection>
              <div className="scripts-summary-grid">
                <DetailViewerSection
                  icon="scripts"
                  title={t('scriptsRoute.detail.summaryCard.title')}
                  description={t('scriptsRoute.detail.summaryCard.description')}
                  className="workspace-surface-card"
                  tone="supporting"
                >
                  <KeyValueMetaList
                    items={[
                      { label: t('scriptsRoute.detail.summaryCard.labels.name'), value: activeDraft.name || t('scriptsRoute.detail.summaryCard.values.untitled') },
                      { label: t('scriptsRoute.detail.summaryCard.labels.type'), value: getScriptTypeLabel(activeDraft.scriptType, t) },
                      { label: t('scriptsRoute.detail.summaryCard.labels.templateSource'), value: selectedTemplate?.name ?? t('scriptsRoute.detail.summaryCard.values.directAuthoring') },
                      { label: t('scriptsRoute.detail.summaryCard.labels.sourceLength'), value: t('scriptsRoute.detail.summaryCard.values.sourceLength', { count: activeDraft.sourceCode.length }) },
                      { label: t('scriptsRoute.selectedSummary.labels.updatedAt'), value: detailQuery.data?.updatedAt ?? t('scriptsRoute.detail.fallbackSummary') },
                    ]}
                  />
                </DetailViewerSection>
                <DetailViewerSection
                  icon="info"
                  title={t('scriptsRoute.detail.capabilityCard.title')}
                  description={t('scriptsRoute.detail.capabilityCard.description')}
                  className="workspace-surface-card workspace-surface-card--muted"
                  tone="supporting"
                >
                  <KeyValueMetaList
                    items={[
                      { label: t('scriptsRoute.detail.capabilityCard.labels.currentStage'), value: getScriptTypeLabel(activeDraft.scriptType, t) },
                      { label: t('scriptsRoute.detail.capabilityCard.labels.capabilitySummary'), value: detailQuery.data?.capabilitySummary ?? selectedTemplate?.capabilitySummary ?? t('scriptsRoute.detail.capabilityCard.values.capabilitySummaryFallback') },
                      { label: t('scriptsRoute.detail.capabilityCard.labels.deferredNote'), value: detailQuery.data?.deferredSummary ?? t('scriptsRoute.detail.capabilityCard.values.deferredNoteFallback') },
                      { label: t('scriptsRoute.selectedSummary.labels.templateSource'), value: detailQuery.data?.sourceLabel ?? t('scriptsRoute.detail.summaryCard.values.directAuthoring') },
                    ]}
                  />
                </DetailViewerSection>
              </div>
              <DetailViewerSection
                icon="code"
                title={t('scriptsRoute.detail.editorCard.title')}
                description={t('scriptsRoute.detail.editorCard.description')}
                className="workspace-surface-card"
              >
                <div className="request-editor-card__grid">
                  <label className="request-field">
                    <span>{t('scriptsRoute.detail.editorCard.labels.name')}</span>
                    <input
                      aria-label={t('scriptsRoute.detail.editorCard.ariaLabels.name')}
                      type="text"
                      value={activeDraft.name}
                      onChange={(event) => {
                        const nextName = event.currentTarget.value;
                        setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), name: nextName }));
                      }}
                    />
                  </label>
                  <label className="request-field">
                    <span>{t('scriptsRoute.detail.editorCard.labels.stage')}</span>
                    <select
                      aria-label={t('scriptsRoute.detail.editorCard.ariaLabels.stage')}
                      value={activeDraft.scriptType}
                      onChange={(event) => {
                        const nextScriptType = event.currentTarget.value as ScriptType;
                        setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), scriptType: nextScriptType }));
                      }}
                    >
                      {stageFilterOptions.filter((option) => option.value !== 'all').map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="request-field request-field--wide">
                    <span>{t('scriptsRoute.detail.editorCard.labels.description')}</span>
                    <textarea
                      aria-label={t('scriptsRoute.detail.editorCard.ariaLabels.description')}
                      value={activeDraft.description}
                      onChange={(event) => {
                        const nextDescription = event.currentTarget.value;
                        setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), description: nextDescription }));
                      }}
                    />
                  </label>
                  <label className="request-field request-field--wide">
                    <span>{t('scriptsRoute.detail.editorCard.labels.source')}</span>
                    <ScriptCodeEditor
                      ariaLabel={t('scriptsRoute.detail.editorCard.ariaLabels.source')}
                      value={activeDraft.sourceCode}
                      onChange={(nextSourceCode) => {
                        setDraft((current) => ({ ...(current.id === activeDraft.id ? current : activeDraft), sourceCode: nextSourceCode }));
                      }}
                      stageId={activeDraft.scriptType}
                    />
                  </label>
                </div>
              </DetailViewerSection>
            </div>
          )}
        </section>
      )}
      detail={(
        <aside className="shell-panel shell-panel--detail" aria-label={t('shell.routePanels.detailRegion')}>
          <div className="workspace-detail-panel">
            {templatesQuery.isPending ? (
              <EmptyStateCallout title={t('scriptsRoute.empty.loadingTemplates.title')} description={t('scriptsRoute.empty.loadingTemplates.description')} />
            ) : templatesQuery.isError ? (
              <EmptyStateCallout title={t('scriptsRoute.empty.templatesDegraded.title')} description={resolveApiErrorMessage(templatesQuery.error, t('scriptsRoute.empty.templatesDegraded.fallbackDescription'), t)} />
            ) : (
              <DetailViewerSection
                icon="template"
                title={t('scriptsRoute.detail.templatesCard.title')}
                description={t('scriptsRoute.detail.templatesCard.description')}
                className="workspace-surface-card workspace-surface-card--muted"
                tone="supporting"
              >
                <ul className="scripts-template-list" aria-label={t('scriptsRoute.list.templatesListAriaLabel')}>
                  {(templatesQuery.data ?? []).map((template) => (
                    <li key={template.id} className="scripts-template-card">
                      <div className="scripts-template-card__header">
                        <div className="scripts-template-card__copy">
                          <h3>{template.name}</h3>
                          <p title={template.description}>{template.description}</p>
                        </div>
                        <div className="workspace-explorer__role-strip">
                          <span className="workspace-chip">{getScriptTypeLabel(template.templateType, t)}</span>
                          <span className="workspace-chip workspace-chip--secondary">{template.tags.join(', ')}</span>
                        </div>
                      </div>
                      <div className="shared-support-block shared-support-block--preview scripts-template-card__preview-block">
                        <pre className="scripts-template-card__preview">{template.sourceCode}</pre>
                      </div>
                      <button
                        type="button"
                        className="workspace-button workspace-button--secondary"
                        onClick={() => {
                          setDraft(createDraftFromTemplate(template, t('scriptsRoute.list.templateCopySuffix')));
                          setIsCreatingDraft(true);
                          setSelectedScriptId(null);
                          setFloatingExplorerOpen('scripts', false);
                        }}
                      >
                        <IconLabel icon="template">{t('scriptsRoute.list.useTemplateAction', { name: template.name })}</IconLabel>
                      </button>
                    </li>
                  ))}
                </ul>
              </DetailViewerSection>
            )}
          </div>
        </aside>
      )}
    />
  );
}

