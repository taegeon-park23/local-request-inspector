import { useQuery } from '@tanstack/react-query';
import { Suspense, lazy, useState } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import {
  listWorkspaceEnvironments,
  workspaceEnvironmentsQueryKey,
} from '@client/features/environments/environment.api';
import { useRequestBuilderCommands } from '@client/features/request-builder/hooks/useRequestBuilderCommands';
import type { RequestDraftState, RequestScriptStageId } from '@client/features/request-builder/request-draft.types';
import type { SavedScriptRecord } from '@client/features/scripts/scripts.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { isDetachedRequestTab } from '@client/features/request-builder/request-tab-state';
import { RequestKeyValueEditor } from '@client/features/request-builder/components/RequestKeyValueEditor';
import {
  createRequestPlacementFromSelection,
  DEFAULT_REQUEST_GROUP_NAME,
  findSelectedPlacementCollection,
  findSelectedPlacementGroup,
  formatRequestPlacementPath,
  getCollectionPlacementValue,
  getRequestGroupPlacementValue,
  isPendingRequestPlacementGroup,
  type RequestPlacementCollectionOption,
} from '@client/features/request-builder/request-placement';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import type { AppIconName } from '@client/shared/ui/AppIcon';
import { IconLabel } from '@client/shared/ui/IconLabel';

const LazyRequestScriptsEditorSurface = lazy(async () => {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return import('@client/features/request-builder/components/RequestScriptsEditorSurface');
});

const requestEditorTabs: Array<{ id: RequestDraftState['activeEditorTab']; label: string; icon: AppIconName }> = [
  { id: 'params', label: 'Params', icon: 'params' },
  { id: 'headers', label: 'Headers', icon: 'headers' },
  { id: 'body', label: 'Body', icon: 'body' },
  { id: 'auth', label: 'Auth', icon: 'auth' },
  { id: 'scripts', label: 'Scripts', icon: 'scripts' },
];

function getLocalizedRequestEditorTabLabel(
  tabId: RequestDraftState['activeEditorTab'],
  t: ReturnType<typeof useI18n>['t'],
) {
  switch (tabId) {
    case 'params':
      return t('workspaceRoute.requestBuilder.tabs.params');
    case 'headers':
      return t('workspaceRoute.requestBuilder.tabs.headers');
    case 'body':
      return t('workspaceRoute.requestBuilder.tabs.body');
    case 'auth':
      return t('workspaceRoute.requestBuilder.tabs.auth');
    case 'scripts':
      return t('workspaceRoute.requestBuilder.tabs.scripts');
    default:
      return tabId;
  }
}

const httpMethodOptions: RequestDraftState['method'][] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const bodyModeOptions: Array<{ value: RequestDraftState['bodyMode']; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
  { value: 'form-urlencoded', label: 'x-www-form-urlencoded' },
  { value: 'multipart-form-data', label: 'multipart/form-data' },
];
const authTypeOptions: Array<{ value: RequestDraftState['auth']['type']; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer token' },
  { value: 'basic', label: 'Basic auth' },
  { value: 'api-key', label: 'API key' },
];

interface RequestWorkSurfacePlaceholderProps {
  activeTab: RequestTabRecord | null;
  onCreateRequest: () => void;
  placementOptions: RequestPlacementCollectionOption[];
}

function formatSavedAt(
  savedAt: string | null,
  savedAtMessage: (time: string) => string,
  upToDateMessage: string,
  formatDateTime: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string,
) {
  if (!savedAt) {
    return upToDateMessage;
  }

  return savedAtMessage(formatDateTime(savedAt, { timeStyle: 'short' }));
}

export function RequestWorkSurfacePlaceholder({
  activeTab,
  onCreateRequest,
  placementOptions,
}: RequestWorkSurfacePlaceholderProps) {
  const { t, formatDateTime } = useI18n();
  const [copiedScriptNamesByTabId, setCopiedScriptNamesByTabId] = useState<
    Record<string, Partial<Record<RequestScriptStageId, string>>>
  >({});
  const draft = useRequestDraftStore((state) =>
    activeTab ? state.draftsByTabId[activeTab.id]?.draft ?? null : null,
  );
  const updateDraftName = useRequestDraftStore((state) => state.updateDraftName);
  const updateDraftMethod = useRequestDraftStore((state) => state.updateDraftMethod);
  const updateDraftUrl = useRequestDraftStore((state) => state.updateDraftUrl);
  const setActiveEditorTab = useRequestDraftStore((state) => state.setActiveEditorTab);
  const addRow = useRequestDraftStore((state) => state.addRow);
  const updateRow = useRequestDraftStore((state) => state.updateRow);
  const removeRow = useRequestDraftStore((state) => state.removeRow);
  const updateBodyMode = useRequestDraftStore((state) => state.updateBodyMode);
  const updateBodyText = useRequestDraftStore((state) => state.updateBodyText);
  const updateAuthType = useRequestDraftStore((state) => state.updateAuthType);
  const updateAuthField = useRequestDraftStore((state) => state.updateAuthField);
  const setActiveScriptStage = useRequestDraftStore((state) => state.setActiveScriptStage);
  const updateScriptContent = useRequestDraftStore((state) => state.updateScriptContent);
  const linkScriptStageToSavedScript = useRequestDraftStore((state) => state.linkScriptStageToSavedScript);
  const updateSelectedEnvironmentId = useRequestDraftStore((state) => state.updateSelectedEnvironmentId);
  const updateDraftPlacement = useRequestDraftStore((state) => state.updateDraftPlacement);
  const environmentsQuery = useQuery({
    queryKey: workspaceEnvironmentsQueryKey,
    queryFn: listWorkspaceEnvironments,
  });
  const { saveStatus, runStatus, saveDisabledReason, runDisabledReason, handleSave, handleRun } = useRequestBuilderCommands(
    activeTab,
    draft,
  );

  if (!activeTab) {
    return (
      <div className="request-work-surface request-work-surface--empty" data-testid="request-tab-empty-state">
        <h2>{t('workspaceRoute.requestBuilder.empty.noSelectionTitle')}</h2>
        <p>
          {t('workspaceRoute.requestBuilder.empty.noSelectionDescription')}
        </p>
        <button type="button" className="workspace-button" onClick={onCreateRequest}>
          <IconLabel icon="new">{t('workspaceRoute.requestBuilder.empty.createDraftAction')}</IconLabel>
        </button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="request-work-surface request-work-surface--empty">
        <h2>{t('workspaceRoute.requestBuilder.empty.preparingTitle')}</h2>
        <p>{t('workspaceRoute.requestBuilder.empty.preparingDescription')}</p>
      </div>
    );
  }

  const displayTitle = draft.name.trim() || 'Untitled Request';
  const replaySource = activeTab.source === 'replay' ? activeTab.replaySource ?? null : null;
  const isDetachedDraft = isDetachedRequestTab(activeTab);
  const requestPlacementPath = formatRequestPlacementPath(draft);
  const locationSummary = replaySource
    ? replaySource.description
    : activeTab.source === 'saved'
      ? requestPlacementPath ?? t('workspaceRoute.requestBuilder.location.unsavedDraft')
      : requestPlacementPath
        ? t('workspaceRoute.requestBuilder.location.defaultSavePlacement', { path: requestPlacementPath })
        : t('workspaceRoute.requestBuilder.location.unsavedDraft');
  const saveStatusCopy = saveStatus.status === 'success'
    ? formatSavedAt(
      saveStatus.savedAt,
      (time) => t('workspaceRoute.requestBuilder.status.saveAtTime', { time }),
      t('workspaceRoute.requestBuilder.status.saveUpToDate'),
      formatDateTime,
    )
    : saveStatus.message ?? (saveDisabledReason ?? t('workspaceRoute.requestBuilder.status.saveFallback'));
  const runStatusCopy = runStatus.message ?? (runDisabledReason ?? t('workspaceRoute.requestBuilder.status.runFallback'));
  const environmentSelectValue = draft.selectedEnvironmentId ?? '';
  const selectedEnvironment = (environmentsQuery.data ?? []).find((environment) => environment.id === draft.selectedEnvironmentId) ?? null;
  const hasMissingEnvironmentReference = environmentSelectValue.length > 0 && environmentsQuery.isSuccess && !selectedEnvironment;
  const environmentSupportCopy = environmentsQuery.isPending
    ? t('workspaceRoute.requestBuilder.environment.loading')
    : environmentsQuery.isError
      ? t('workspaceRoute.requestBuilder.environment.degraded')
      : hasMissingEnvironmentReference
        ? t('workspaceRoute.requestBuilder.environment.missing')
        : selectedEnvironment
          ? t('workspaceRoute.requestBuilder.environment.selected', { name: selectedEnvironment.name, count: selectedEnvironment.enabledVariableCount })
          : t('workspaceRoute.requestBuilder.environment.noneSelected');
  const selectedCollection = findSelectedPlacementCollection(placementOptions, draft);
  const selectedRequestGroup = findSelectedPlacementGroup(selectedCollection, draft);
  const collectionSelectValue = selectedCollection ? getCollectionPlacementValue(selectedCollection) : '';
  const requestGroupSelectValue = selectedRequestGroup ? getRequestGroupPlacementValue(selectedRequestGroup) : '';
  const selectedPlacementPath = selectedCollection && selectedRequestGroup
    ? formatRequestPlacementPath(createRequestPlacementFromSelection(selectedCollection, selectedRequestGroup))
    : null;
  const selectedRequestGroupPendingCreate = isPendingRequestPlacementGroup(selectedRequestGroup);
  const copiedScriptNames = copiedScriptNamesByTabId[draft.tabId] ?? {};
  const placementSupportCopy = selectedPlacementPath
    ? selectedRequestGroupPendingCreate
      ? t('workspaceRoute.requestBuilder.placement.pendingCreate', {
          path: selectedPlacementPath,
          groupName: selectedRequestGroup?.requestGroupName ?? DEFAULT_REQUEST_GROUP_NAME,
        })
      : t('workspaceRoute.requestBuilder.placement.selected', { path: selectedPlacementPath })
    : t('workspaceRoute.requestBuilder.placement.unavailable');

  return (
    <div className="request-work-surface request-builder-core" data-testid="request-work-surface">
      <header className="request-work-surface__header request-builder-core__header">
        <div className="request-work-surface__header-copy">
          <p className="section-placeholder__eyebrow">{t('workspaceRoute.requestBuilder.header.eyebrow')}</p>
          <h2>{displayTitle}</h2>
          <p>{t('workspaceRoute.requestBuilder.header.description')}</p>
        </div>
        <div className="request-work-surface__badges">
          <span className="workspace-chip">{draft.method}</span>
          {replaySource ? (
            <span className="workspace-chip workspace-chip--replay">{replaySource.label}</span>
          ) : (
            <span className="workspace-chip">{isDetachedDraft ? t('workspaceRoute.requestBuilder.badges.detachedDraft') : activeTab.source === 'saved' ? t('workspaceRoute.requestBuilder.badges.savedRequest') : t('workspaceRoute.requestBuilder.badges.newDraft')}</span>
          )}
          {draft.dirty ? <span className="workspace-chip workspace-chip--accent">{t('workspaceRoute.requestBuilder.badges.dirty')}</span> : null}
        </div>
      </header>

      <div className="request-work-surface__header-strip request-builder-core__header-strip">
        <div className="request-builder-core__identity">
          <label className="request-field">
            <span>{t('workspaceRoute.requestBuilder.fields.requestName')}</span>
            <input
              aria-label="Request name"
              type="text"
              value={draft.name}
              onChange={(event) => updateDraftName(draft.tabId, event.currentTarget.value)}
            />
          </label>
          <div className="request-builder-core__identity-support">
            <p className="request-builder-core__source-copy">{locationSummary}</p>
            <div className="request-builder-core__placement-grid">
              <label className="request-field request-field--compact">
                <span>{t('workspaceRoute.requestBuilder.fields.saveCollection')}</span>
                <select
                  aria-label="Save collection"
                  value={collectionSelectValue}
                  onChange={(event) => {
                    const nextCollection = placementOptions.find((collection) => (
                      getCollectionPlacementValue(collection) === event.currentTarget.value
                    ));

                    if (!nextCollection) {
                      return;
                    }

                    const nextRequestGroup = nextCollection.requestGroups[0] ?? { requestGroupName: DEFAULT_REQUEST_GROUP_NAME };
                    updateDraftPlacement(
                      draft.tabId,
                      createRequestPlacementFromSelection(nextCollection, nextRequestGroup),
                    );
                  }}
                >
                  {placementOptions.map((collection) => (
                    <option key={getCollectionPlacementValue(collection)} value={getCollectionPlacementValue(collection)}>
                      {collection.collectionName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="request-field request-field--compact">
                <span>{t('workspaceRoute.requestBuilder.fields.saveRequestGroup')}</span>
                <select
                  aria-label="Save request group"
                  value={requestGroupSelectValue}
                  onChange={(event) => {
                    const nextRequestGroup = selectedCollection?.requestGroups.find((requestGroup) => (
                      getRequestGroupPlacementValue(requestGroup) === event.currentTarget.value
                    ));

                    if (!selectedCollection || !nextRequestGroup) {
                      return;
                    }

                    updateDraftPlacement(
                      draft.tabId,
                      createRequestPlacementFromSelection(selectedCollection, nextRequestGroup),
                    );
                  }}
                  disabled={!selectedCollection || selectedRequestGroupPendingCreate || selectedCollection.requestGroups.length === 0}
                >
                  {(selectedCollection?.requestGroups.length ?? 0) > 0
                    ? selectedCollection?.requestGroups.map((requestGroup) => (
                        <option key={getRequestGroupPlacementValue(requestGroup)} value={getRequestGroupPlacementValue(requestGroup)}>
                          {isPendingRequestPlacementGroup(requestGroup)
                            ? t('workspaceRoute.requestBuilder.placement.pendingOption', { name: requestGroup.requestGroupName })
                            : requestGroup.requestGroupName}
                        </option>
                      ))
                    : <option value="">{t('workspaceRoute.requestBuilder.placement.noRequestGroups')}</option>}
                </select>
              </label>
            </div>
            <p className="shared-readiness-note">{placementSupportCopy}</p>
            <label className="request-field request-field--compact">
              <span>{t('workspaceRoute.requestBuilder.fields.requestEnvironment')}</span>
              <select
                aria-label="Request environment"
                value={environmentSelectValue}
                onChange={(event) => updateSelectedEnvironmentId(draft.tabId, event.currentTarget.value || null)}
              >
                <option value="">{t('workspaceRoute.requestBuilder.environment.noEnvironment')}</option>
                {(environmentsQuery.data ?? []).map((environment) => (
                  <option key={environment.id} value={environment.id}>
                    {environment.name}
                  </option>
                ))}
                {hasMissingEnvironmentReference ? (
                  <option value={environmentSelectValue}>{t('workspaceRoute.requestBuilder.environment.missingReferenceOption')}</option>
                ) : null}
              </select>
            </label>
            <div className="request-work-surface__badges">
              {selectedEnvironment?.isDefault ? <span className="workspace-chip workspace-chip--secondary">{t('workspaceRoute.requestBuilder.environment.defaultBadge')}</span> : null}
              {hasMissingEnvironmentReference ? <span className="workspace-chip workspace-chip--replay">{t('workspaceRoute.requestBuilder.environment.missingBadge')}</span> : null}
            </div>
            <p className="shared-readiness-note">{environmentSupportCopy}</p>
          </div>
        </div>
        <div className="request-builder-core__command-area">
          <div className="request-work-surface__future-actions" aria-label="Request header actions">
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={handleSave}
              disabled={Boolean(saveDisabledReason)}
            >
              <IconLabel icon="save">{saveStatus.status === 'pending' ? t('workspaceRoute.requestBuilder.commands.saving') : t('workspaceRoute.requestBuilder.commands.save')}</IconLabel>
            </button>
            <button type="button" className="workspace-button workspace-button--secondary" disabled>
              <IconLabel icon="duplicate">{t('workspaceRoute.requestBuilder.commands.duplicate')}</IconLabel>
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={handleRun}
              disabled={Boolean(runDisabledReason)}
            >
              <IconLabel icon="run">{runStatus.status === 'pending' ? t('workspaceRoute.requestBuilder.commands.running') : t('workspaceRoute.requestBuilder.commands.run')}</IconLabel>
            </button>
          </div>
          <div className="request-builder-core__command-copy-group">
            <div className="request-builder-core__command-intro">
              <p className="request-builder-core__command-copy">
                {replaySource
                  ? t('workspaceRoute.requestBuilder.commands.replayIntro')
                  : t('workspaceRoute.requestBuilder.commands.defaultIntro')}
              </p>
            </div>
            <div className="request-builder-core__command-status-list">
              <p className="shared-readiness-note" data-testid="save-command-status">{saveStatusCopy}</p>
              <p className="shared-readiness-note" data-testid="run-command-status">{runStatusCopy}</p>
            </div>
            <div className="request-builder-core__command-support">
              <p className="shared-readiness-note">{t('workspaceRoute.requestBuilder.commands.duplicateDeferred')}</p>
            </div>
          </div>
        </div>
      </div>

      {isDetachedDraft ? (
        <section className="request-builder-core__detached-banner" role="status">
          <div>
            <h3>{t('workspaceRoute.requestBuilder.detached.title')}</h3>
            <p>{t('workspaceRoute.requestBuilder.detached.description')}</p>
          </div>
          <p className="shared-readiness-note">
            {requestPlacementPath
              ? t('workspaceRoute.requestBuilder.detached.saveTarget', { path: requestPlacementPath })
              : t('workspaceRoute.requestBuilder.detached.noSaveTarget')}
          </p>
        </section>
      ) : null}

      <section className="workspace-surface-card request-editor-card request-editor-card--primary">
        <div className="request-editor-card__grid">
          <label className="request-field request-field--compact">
            <span>{t('workspaceRoute.requestBuilder.fields.requestMethod')}</span>
            <select
              aria-label="Request method"
              value={draft.method}
              onChange={(event) => updateDraftMethod(draft.tabId, event.currentTarget.value as RequestDraftState['method'])}
            >
              {httpMethodOptions.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label className="request-field request-field--wide">
            <span>{t('workspaceRoute.requestBuilder.fields.requestUrl')}</span>
            <input
              aria-label="Request URL"
              placeholder="https://api.example.com/resource"
              type="text"
              value={draft.url}
              onChange={(event) => updateDraftUrl(draft.tabId, event.currentTarget.value)}
            />
          </label>
        </div>
      </section>

      <div className="request-work-surface__editor-tabs" aria-label="Editor surface tabs">
        {requestEditorTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={draft.activeEditorTab === tab.id ? 'workspace-subtab workspace-subtab--active' : 'workspace-subtab'}
            aria-pressed={draft.activeEditorTab === tab.id}
            onClick={() => setActiveEditorTab(draft.tabId, tab.id)}
          >
            <span className="workspace-subtab__content">
              <IconLabel icon={tab.icon}>{getLocalizedRequestEditorTabLabel(tab.id, t)}</IconLabel>
            </span>
          </button>
        ))}
      </div>

      <div className="request-work-surface__body request-work-surface__body--single">
        {draft.activeEditorTab === 'params' ? (
          <RequestKeyValueEditor
            addButtonLabel={t('workspaceRoute.requestBuilder.paramsEditor.addAction')}
            description={t('workspaceRoute.requestBuilder.paramsEditor.description')}
            emptyCopy={t('workspaceRoute.requestBuilder.paramsEditor.empty')}
            rowLabel={t('workspaceRoute.requestBuilder.paramsEditor.rowLabel')}
            rows={draft.params}
            title={t('workspaceRoute.requestBuilder.paramsEditor.title')}
            onAddRow={() => addRow(draft.tabId, 'params')}
            onRemoveRow={(rowId) => removeRow(draft.tabId, 'params', rowId)}
            onUpdateRow={(rowId, field, value) => updateRow(draft.tabId, 'params', rowId, field, value)}
          />
        ) : null}

        {draft.activeEditorTab === 'headers' ? (
          <RequestKeyValueEditor
            addButtonLabel={t('workspaceRoute.requestBuilder.headersEditor.addAction')}
            description={t('workspaceRoute.requestBuilder.headersEditor.description')}
            emptyCopy={t('workspaceRoute.requestBuilder.headersEditor.empty')}
            rowLabel={t('workspaceRoute.requestBuilder.headersEditor.rowLabel')}
            rows={draft.headers}
            title={t('workspaceRoute.requestBuilder.headersEditor.title')}
            onAddRow={() => addRow(draft.tabId, 'headers')}
            onRemoveRow={(rowId) => removeRow(draft.tabId, 'headers', rowId)}
            onUpdateRow={(rowId, field, value) => updateRow(draft.tabId, 'headers', rowId, field, value)}
          />
        ) : null}

        {draft.activeEditorTab === 'body' ? (
          <section className="workspace-surface-card request-editor-card">
            <header className="request-editor-card__header">
              <div>
                <h3>{t('workspaceRoute.requestBuilder.bodyEditor.title')}</h3>
                <p>{t('workspaceRoute.requestBuilder.bodyEditor.description')}</p>
              </div>
            </header>

            <label className="request-field request-field--compact">
              <span>{t('workspaceRoute.requestBuilder.bodyEditor.modeLabel')}</span>
              <select
                value={draft.bodyMode}
                onChange={(event) => updateBodyMode(draft.tabId, event.currentTarget.value as RequestDraftState['bodyMode'])}
              >
                {bodyModeOptions.map((bodyMode) => (
                  <option key={bodyMode.value} value={bodyMode.value}>
                    {bodyMode.value === 'none' ? t('workspaceRoute.requestBuilder.bodyModeOptions.none') : bodyMode.value === 'json' ? t('workspaceRoute.requestBuilder.bodyModeOptions.json') : bodyMode.value === 'text' ? t('workspaceRoute.requestBuilder.bodyModeOptions.text') : bodyMode.value === 'form-urlencoded' ? t('workspaceRoute.requestBuilder.bodyModeOptions.formUrlencoded') : t('workspaceRoute.requestBuilder.bodyModeOptions.multipartFormData')}
                  </option>
                ))}
              </select>
            </label>

            {draft.bodyMode === 'none' ? (
              <p className="request-editor-card__empty">{t('workspaceRoute.requestBuilder.bodyEditor.empty')}</p>
            ) : null}

            {draft.bodyMode === 'json' || draft.bodyMode === 'text' ? (
              <label className="request-field">
                <span>
                  {draft.bodyMode === 'json'
                    ? t('workspaceRoute.requestBuilder.bodyEditor.contentJsonLabel')
                    : t('workspaceRoute.requestBuilder.bodyEditor.contentTextLabel')}
                </span>
                <textarea
                  rows={10}
                  value={draft.bodyText}
                  onChange={(event) => updateBodyText(draft.tabId, event.currentTarget.value)}
                />
              </label>
            ) : null}

            {draft.bodyMode === 'form-urlencoded' ? (
              <RequestKeyValueEditor
                addButtonLabel={t('workspaceRoute.requestBuilder.bodyEditor.formAddAction')}
                description={t('workspaceRoute.requestBuilder.bodyEditor.formDescription')}
                emptyCopy={t('workspaceRoute.requestBuilder.bodyEditor.formEmpty')}
                rowLabel={t('workspaceRoute.requestBuilder.bodyEditor.formRowLabel')}
                rows={draft.formBody}
                title={t('workspaceRoute.requestBuilder.bodyEditor.formTitle')}
                onAddRow={() => addRow(draft.tabId, 'formBody')}
                onRemoveRow={(rowId) => removeRow(draft.tabId, 'formBody', rowId)}
                onUpdateRow={(rowId, field, value) => updateRow(draft.tabId, 'formBody', rowId, field, value)}
              />
            ) : null}

            {draft.bodyMode === 'multipart-form-data' ? (
              <RequestKeyValueEditor
                addButtonLabel={t('workspaceRoute.requestBuilder.bodyEditor.multipartAddAction')}
                description={t('workspaceRoute.requestBuilder.bodyEditor.multipartDescription')}
                emptyCopy={t('workspaceRoute.requestBuilder.bodyEditor.multipartEmpty')}
                rowLabel={t('workspaceRoute.requestBuilder.bodyEditor.multipartRowLabel')}
                rows={draft.multipartBody}
                title={t('workspaceRoute.requestBuilder.bodyEditor.multipartTitle')}
                onAddRow={() => addRow(draft.tabId, 'multipartBody')}
                onRemoveRow={(rowId) => removeRow(draft.tabId, 'multipartBody', rowId)}
                onUpdateRow={(rowId, field, value) => updateRow(draft.tabId, 'multipartBody', rowId, field, value)}
              />
            ) : null}
          </section>
        ) : null}

        {draft.activeEditorTab === 'auth' ? (
          <section className="workspace-surface-card request-editor-card">
            <header className="request-editor-card__header">
              <div>
                <h3>{t('workspaceRoute.requestBuilder.authEditor.title')}</h3>
                <p>{t('workspaceRoute.requestBuilder.authEditor.description')}</p>
              </div>
            </header>

            <label className="request-field request-field--compact">
              <span>{t('workspaceRoute.requestBuilder.authEditor.typeLabel')}</span>
              <select
                value={draft.auth.type}
                onChange={(event) => updateAuthType(draft.tabId, event.currentTarget.value as RequestDraftState['auth']['type'])}
              >
                {authTypeOptions.map((authType) => (
                  <option key={authType.value} value={authType.value}>
                    {authType.value === 'none' ? t('workspaceRoute.requestBuilder.authTypeOptions.none') : authType.value === 'bearer' ? t('workspaceRoute.requestBuilder.authTypeOptions.bearer') : authType.value === 'basic' ? t('workspaceRoute.requestBuilder.authTypeOptions.basic') : t('workspaceRoute.requestBuilder.authTypeOptions.apiKey')}
                  </option>
                ))}
              </select>
            </label>

            {draft.auth.type === 'none' ? (
              <p className="request-editor-card__empty">{t('workspaceRoute.requestBuilder.authEditor.empty')}</p>
            ) : null}

            {draft.auth.type === 'bearer' ? (
              <label className="request-field">
                <span>{t('workspaceRoute.requestBuilder.authEditor.bearerToken')}</span>
                <input
                  aria-label="Bearer token"
                  type="text"
                  value={draft.auth.bearerToken}
                  onChange={(event) => updateAuthField(draft.tabId, 'bearerToken', event.currentTarget.value)}
                />
              </label>
            ) : null}

            {draft.auth.type === 'basic' ? (
              <div className="request-editor-card__grid">
                <label className="request-field">
                  <span>{t('workspaceRoute.requestBuilder.authEditor.username')}</span>
                  <input
                    aria-label="Username"
                    type="text"
                    value={draft.auth.basicUsername}
                    onChange={(event) => updateAuthField(draft.tabId, 'basicUsername', event.currentTarget.value)}
                  />
                </label>
                <label className="request-field">
                  <span>{t('workspaceRoute.requestBuilder.authEditor.password')}</span>
                  <input
                    aria-label="Password"
                    type="password"
                    value={draft.auth.basicPassword}
                    onChange={(event) => updateAuthField(draft.tabId, 'basicPassword', event.currentTarget.value)}
                  />
                </label>
              </div>
            ) : null}

            {draft.auth.type === 'api-key' ? (
              <div className="request-editor-card__grid">
                <label className="request-field">
                  <span>{t('workspaceRoute.requestBuilder.authEditor.apiKeyName')}</span>
                  <input
                    aria-label="API key name"
                    type="text"
                    value={draft.auth.apiKeyName}
                    onChange={(event) => updateAuthField(draft.tabId, 'apiKeyName', event.currentTarget.value)}
                  />
                </label>
                <label className="request-field">
                  <span>{t('workspaceRoute.requestBuilder.authEditor.apiKeyValue')}</span>
                  <input
                    aria-label="API key value"
                    type="text"
                    value={draft.auth.apiKeyValue}
                    onChange={(event) => updateAuthField(draft.tabId, 'apiKeyValue', event.currentTarget.value)}
                  />
                </label>
                <label className="request-field request-field--compact">
                  <span>{t('workspaceRoute.requestBuilder.authEditor.apiKeyPlacement')}</span>
                  <select
                    aria-label="API key placement"
                    value={draft.auth.apiKeyPlacement}
                    onChange={(event) => updateAuthField(draft.tabId, 'apiKeyPlacement', event.currentTarget.value)}
                  >
                    <option value="header">{t('workspaceRoute.requestBuilder.apiKeyPlacementOptions.header')}</option>
                    <option value="query">{t('workspaceRoute.requestBuilder.apiKeyPlacementOptions.query')}</option>
                  </select>
                </label>
              </div>
            ) : null}
          </section>
        ) : null}

        {draft.activeEditorTab === 'scripts' ? (
          <Suspense
            fallback={
              <section className="workspace-surface-card request-editor-card request-editor-card--scripts request-script-loading" data-testid="script-editor-loading">
                <header className="request-editor-card__header">
                  <div>
                    <h3>{t('workspaceRoute.requestBuilder.loadingScripts.title')}</h3>
                    <p>
                      {t('workspaceRoute.requestBuilder.loadingScripts.description')}
                    </p>
                  </div>
                </header>
                <div className="request-script-loading__body">
                  <article className="workspace-surface-card workspace-surface-card--muted">
                    <h4>{t('workspaceRoute.requestBuilder.loadingScripts.lazyPathTitle')}</h4>
                    <p>
                      {t('workspaceRoute.requestBuilder.loadingScripts.lazyPathDescription')}
                    </p>
                  </article>
                </div>
              </section>
            }
          >
            <LazyRequestScriptsEditorSurface
              draft={draft}
              onStageChange={(stage) => setActiveScriptStage(draft.tabId, stage)}
              onContentChange={(stage, content) => updateScriptContent(draft.tabId, stage, content)}
              copiedFromScriptNames={copiedScriptNames}
              onAttachSavedScript={(stage, scriptName, content) => {
                updateScriptContent(draft.tabId, stage, content);
                setCopiedScriptNamesByTabId((current) => ({
                  ...current,
                  [draft.tabId]: {
                    ...(current[draft.tabId] ?? {}),
                    [stage]: scriptName,
                  },
                }));
              }}
              onLinkSavedScript={(stage, script: SavedScriptRecord) => {
                linkScriptStageToSavedScript(draft.tabId, stage, {
                  savedScriptId: script.id,
                  savedScriptNameSnapshot: script.name,
                });
                setCopiedScriptNamesByTabId((current) => ({
                  ...current,
                  [draft.tabId]: {
                    ...(current[draft.tabId] ?? {}),
                    [stage]: '',
                  },
                }));
              }}
              onDetachSavedScript={(stage, scriptName, content) => {
                updateScriptContent(draft.tabId, stage, content);
                setCopiedScriptNamesByTabId((current) => ({
                  ...current,
                  [draft.tabId]: {
                    ...(current[draft.tabId] ?? {}),
                    [stage]: content.length > 0 ? scriptName : '',
                  },
                }));
              }}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}







