import { useId, useMemo, useState } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import type { RequestDraftState } from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { isDetachedRequestTab } from '@client/features/request-builder/request-tab-state';
import {
  formatRequestPlacementPath,
} from '@client/features/request-builder/request-placement';
import type {
  WorkspaceCollectionNode,
  WorkspaceRequestGroupNode,
  WorkspaceTreeRequestLeaf,
} from '@client/features/workspace/workspace-request-tree.api';
import type { AuthoredResourceBundleImportPreviewResult } from '@client/features/workspace/resource-bundle.api';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { IconLabel } from '@client/shared/ui/IconLabel';

export type WorkspaceResourceManagerStatusTone = 'success' | 'error' | 'info';
export type WorkspaceResourceManagerStatusScope = 'transfer' | 'collections' | 'request-groups' | 'saved-request';

export interface WorkspaceResourceManagerStatus {
  tone: WorkspaceResourceManagerStatusTone;
  message: string;
  details?: string[];
}

interface WorkspaceImportPreview {
  fileName: string;
  result: AuthoredResourceBundleImportPreviewResult;
}

interface WorkspaceRequestGroupOption {
  requestGroup: WorkspaceRequestGroupNode;
  pathLabel: string;
}

interface WorkspaceResourceManagerPanelProps {
  tree: WorkspaceCollectionNode[];
  activeTab: RequestTabRecord | null;
  activeDraft: RequestDraftState | null;
  activeSavedRequest: WorkspaceTreeRequestLeaf | null;
  onRenameCollection: (collection: WorkspaceCollectionNode, name: string) => Promise<{ id: string; name: string } | void> | void;
  onDeleteCollection: (collection: WorkspaceCollectionNode) => Promise<void> | void;
  onRenameRequestGroup: (requestGroup: WorkspaceRequestGroupNode, name: string) => Promise<{ id: string; name: string } | void> | void;
  onDeleteRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => Promise<void> | void;
  onExportRequest: (request: WorkspaceTreeRequestLeaf) => void;
  onDeleteRequest: (request: WorkspaceTreeRequestLeaf) => void;
  onExportResources: () => void;
  onImportResources: (file: File) => void;
  importPreview: WorkspaceImportPreview | null;
  onConfirmImportPreview: () => void;
  onCancelImportPreview: () => void;
  statuses?: Partial<Record<WorkspaceResourceManagerStatusScope, WorkspaceResourceManagerStatus>>;
  isExporting: boolean;
  isPreviewingImport: boolean;
  isImporting: boolean;
  isDeletingRequest: boolean;
  isCreatingCollection: boolean;
  isRenamingCollection: boolean;
  isDeletingCollection: boolean;
  isCreatingRequestGroup: boolean;
  isRenamingRequestGroup: boolean;
  isDeletingRequestGroup: boolean;
  initiallyExpanded?: boolean;
}

function findCollectionById(tree: WorkspaceCollectionNode[], collectionId: string | null) {
  if (!collectionId) {
    return null;
  }

  return tree.find((collection) => collection.collectionId === collectionId) ?? null;
}

function findRequestGroupById(
  collection: WorkspaceCollectionNode | null,
  requestGroupId: string | null,
): WorkspaceRequestGroupNode | null {
  if (!collection || !requestGroupId) {
    return null;
  }

  const groupsToVisit = [...collection.childGroups];

  while (groupsToVisit.length > 0) {
    const nextGroup = groupsToVisit.shift();

    if (!nextGroup) {
      continue;
    }

    if (nextGroup.requestGroupId === requestGroupId) {
      return nextGroup;
    }

    groupsToVisit.unshift(...nextGroup.childGroups);
  }

  return null;
}

function collectRequestGroupOptions(
  requestGroups: WorkspaceRequestGroupNode[],
  path: string[] = [],
): WorkspaceRequestGroupOption[] {
  return requestGroups.flatMap((requestGroup) => {
    const nextPath = [...path, requestGroup.name];

    return [
      {
        requestGroup,
        pathLabel: nextPath.join(' / '),
      },
      ...collectRequestGroupOptions(requestGroup.childGroups, nextPath),
    ];
  });
}

export function WorkspaceResourceManagerPanel({
  tree,
  activeTab,
  activeDraft,
  activeSavedRequest,
  onRenameCollection,
  onDeleteCollection,
  onRenameRequestGroup,
  onDeleteRequestGroup,
  onExportRequest,
  onDeleteRequest,
  onExportResources,
  onImportResources,
  importPreview,
  onConfirmImportPreview,
  onCancelImportPreview,
  statuses = {},
  isExporting,
  isPreviewingImport,
  isImporting,
  isDeletingRequest,
  isCreatingCollection,
  isRenamingCollection,
  isDeletingCollection,
  isCreatingRequestGroup,
  isRenamingRequestGroup,
  isDeletingRequestGroup,
  initiallyExpanded = false,
}: WorkspaceResourceManagerPanelProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedRequestGroupId, setSelectedRequestGroupId] = useState<string>('');
  const [collectionEditorState, setCollectionEditorState] = useState<{ targetId: string; value: string }>({
    targetId: '',
    value: '',
  });
  const [requestGroupEditorState, setRequestGroupEditorState] = useState<{ targetId: string; value: string }>({
    targetId: '',
    value: '',
  });

  const activePlacementPath = formatRequestPlacementPath(activeDraft ?? activeTab);
  const isDetachedDraft = isDetachedRequestTab(activeTab);
  const defaultCollectionId = activeDraft?.collectionId
    ?? activeTab?.collectionId
    ?? tree[0]?.collectionId
    ?? '';

  const selectedCollectionIdValue = useMemo(() => {
    if (tree.length === 0) {
      return '';
    }

    return tree.some((collection) => collection.collectionId === selectedCollectionId)
      ? selectedCollectionId
      : (defaultCollectionId || tree[0]!.collectionId);
  }, [defaultCollectionId, selectedCollectionId, tree]);

  const selectedCollection = useMemo(
    () => findCollectionById(tree, selectedCollectionIdValue) ?? tree[0] ?? null,
    [selectedCollectionIdValue, tree],
  );

  const selectedCollectionRequestGroupOptions = useMemo(
    () => selectedCollection ? collectRequestGroupOptions(selectedCollection.childGroups) : [],
    [selectedCollection],
  );

  const selectedRequestGroupIdValue = useMemo(() => {
    if (!selectedCollection) {
      return '';
    }

    const preferredRequestGroupId = activeDraft?.collectionId === selectedCollection.collectionId
      ? (activeDraft?.requestGroupId ?? '')
      : activeTab?.collectionId === selectedCollection.collectionId
        ? (activeTab?.requestGroupId ?? '')
        : '';

    return selectedCollectionRequestGroupOptions.some((option) => option.requestGroup.requestGroupId === selectedRequestGroupId)
      ? selectedRequestGroupId
      : (preferredRequestGroupId || selectedCollectionRequestGroupOptions[0]?.requestGroup.requestGroupId || '');
  }, [
    activeDraft?.collectionId,
    activeDraft?.requestGroupId,
    activeTab?.collectionId,
    activeTab?.requestGroupId,
    selectedCollection,
    selectedCollectionRequestGroupOptions,
    selectedRequestGroupId,
  ]);

  const selectedRequestGroup = useMemo(
    () => findRequestGroupById(selectedCollection, selectedRequestGroupIdValue) ?? selectedCollectionRequestGroupOptions[0]?.requestGroup ?? null,
    [selectedCollection, selectedCollectionRequestGroupOptions, selectedRequestGroupIdValue],
  );

  const collectionEditorTargetId = selectedCollection?.collectionId ?? 'new-collection';
  const requestGroupEditorTargetId = selectedRequestGroup?.requestGroupId ?? `new-request-group-${selectedCollection?.collectionId ?? 'none'}`;
  const collectionNameDraft = collectionEditorState.targetId === collectionEditorTargetId
    ? collectionEditorState.value
    : (selectedCollection?.name ?? '');
  const requestGroupNameDraft = requestGroupEditorState.targetId === requestGroupEditorTargetId
    ? requestGroupEditorState.value
    : (selectedRequestGroup?.name ?? '');

  const isMutatingCollections = isCreatingCollection || isRenamingCollection || isDeletingCollection;
  const isMutatingRequestGroups = isCreatingRequestGroup || isRenamingRequestGroup || isDeletingRequestGroup;
  const canDeleteCollection = Boolean(selectedCollection && selectedCollection.childGroups.length === 0);
  const canDeleteRequestGroup = Boolean(selectedRequestGroup && selectedRequestGroup.childGroups.length === 0 && selectedRequestGroup.requests.length === 0);
  const requestGroupCount = selectedCollectionRequestGroupOptions.length;
  const requestCount = selectedRequestGroup?.requests.length ?? 0;
  const transferStatus = statuses.transfer ?? null;
  const collectionStatus = statuses.collections ?? null;
  const requestGroupStatus = statuses['request-groups'] ?? null;
  const savedRequestStatus = statuses['saved-request'] ?? null;
  const baseActiveTabState = activeSavedRequest
    ? t('workspaceRoute.management.context.values.savedRequest')
    : isDetachedDraft
      ? t('workspaceRoute.management.context.values.detachedDraft')
      : activeTab?.source === 'replay'
        ? t('workspaceRoute.management.context.values.replayDraft')
        : activeTab
          ? t('workspaceRoute.management.context.values.workingDraft')
          : t('workspaceRoute.management.context.values.noActiveTab');
  const activeTabStateTag = !activeTab
    ? null
    : activeTab.statusMeta?.saveState === 'conflict'
      ? t('workspaceRoute.tabShell.states.conflict')
      : activeTab.statusMeta?.saveState === 'pending'
        ? t('workspaceRoute.tabShell.states.saving')
        : activeTab.statusMeta?.runState === 'pending'
          ? t('workspaceRoute.tabShell.states.running')
          : activeTab.hasUnsavedChanges
            ? t('workspaceRoute.tabShell.states.dirty')
            : activeTab.statusMeta?.saveState === 'saved'
              ? t('workspaceRoute.tabShell.states.saved')
              : null;
  const activeTabState = activeTabStateTag
    ? `${baseActiveTabState} · ${activeTabStateTag}`
    : baseActiveTabState;
  const panelBodyId = useId();
  const toggleLabel = isExpanded
    ? t('workspaceRoute.management.actions.collapsePanel')
    : t('workspaceRoute.management.actions.expandPanel');

  return (
    <section
      className="workspace-resource-manager workspace-surface-card"
      aria-label={t('workspaceRoute.management.ariaLabel')}
      data-expanded={isExpanded ? 'true' : 'false'}
    >
      <header className="workspace-resource-manager__header management-detail__header">
        <div className="workspace-resource-manager__header-copy">
          <p className="section-placeholder__eyebrow">{t('workspaceRoute.management.header.eyebrow')}</p>
          <h2>{t('workspaceRoute.management.header.title')}</h2>
        </div>
        <div className="workspace-resource-manager__header-actions">
          <button
            type="button"
            className="workspace-button workspace-button--secondary workspace-resource-manager__header-toggle"
            aria-expanded={isExpanded}
            aria-controls={panelBodyId}
            onClick={() => setIsExpanded((current) => !current)}
          >
            <IconLabel icon="overview">{toggleLabel}</IconLabel>
          </button>
        </div>
      </header>

      <div
        id={panelBodyId}
        className={
          isExpanded
            ? 'workspace-resource-manager__content workspace-resource-manager__content--expanded'
            : 'workspace-resource-manager__content workspace-resource-manager__content--collapsed'
        }
      >
        <p className="management-detail__header-meta">{t('workspaceRoute.management.header.summary')}</p>
        <p className="shared-readiness-note workspace-resource-manager__placement-note">
          {activePlacementPath
            ? t('workspaceRoute.management.state.activePlacement', { path: activePlacementPath })
            : t('workspaceRoute.management.state.noActivePlacement')}
        </p>
        <div className="workspace-resource-manager__badge-rail management-detail__badge-rail request-work-surface__badges">
          <span className="workspace-chip">{t('workspaceRoute.management.badges.savedTree')}</span>
          <span className="workspace-chip workspace-chip--secondary">{t('workspaceRoute.management.badges.mainSurface')}</span>
        </div>

        <div className="workspace-resource-manager__grid">
        <section className="workspace-resource-manager__section workspace-resource-manager__section--transfer">
          <div className="workspace-resource-manager__section-copy">
            <h3>{t('workspaceRoute.management.sections.transferTitle')}</h3>
            <p>{t('workspaceRoute.management.sections.transferDescription')}</p>
          </div>
          <div className="request-work-surface__future-actions workspace-resource-manager__actions">
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={onExportResources}
              disabled={isExporting || isPreviewingImport || isImporting || isMutatingCollections || isMutatingRequestGroups || isDeletingRequest}
            >
              <IconLabel icon="export">
                {isExporting ? t('workspaceRoute.explorer.actions.exportingResources') : t('workspaceRoute.explorer.actions.exportResources')}
              </IconLabel>
            </button>
            <label className="workspace-button workspace-button--secondary workspace-resource-manager__import-label">
              <IconLabel icon="import">
                {isPreviewingImport
                  ? t('workspaceRoute.explorer.actions.previewingImport')
                  : isImporting
                    ? t('workspaceRoute.explorer.actions.importingResources')
                    : t('workspaceRoute.explorer.actions.importResources')}
              </IconLabel>
              <input
                aria-label={t('workspaceRoute.explorer.actions.importResourcesInput')}
                className="workspace-resource-manager__file-input"
                type="file"
                accept="application/json,.json"
                disabled={isPreviewingImport || isImporting || isMutatingCollections || isMutatingRequestGroups || isDeletingRequest}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];

                  if (!file) {
                    return;
                  }

                  onImportResources(file);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
          <p className="shared-readiness-note">{t('workspaceRoute.management.state.transferBoundary')}</p>
          {transferStatus ? (
            <div
              className={`workspace-explorer__status workspace-explorer__status--${transferStatus.tone} workspace-resource-manager__status`}
              role={transferStatus.tone === 'error' ? 'alert' : 'status'}
            >
              <p>{transferStatus.message}</p>
              {(transferStatus.details ?? []).length > 0 ? (
                <ul className="workspace-explorer__status-details">
                  {(transferStatus.details ?? []).map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
              {importPreview ? (
                <>
                  <p className="workspace-explorer__preview-note">
                    {t('workspaceRoute.explorer.notes.previewAdvisory', { fileName: importPreview.fileName })}
                  </p>
                  <div className="workspace-explorer__preview-actions">
                    <button
                      type="button"
                      className="workspace-button"
                      onClick={onConfirmImportPreview}
                      disabled={isImporting || importPreview.result.summary.acceptedCount === 0}
                    >
                      <IconLabel icon="import">
                        {isImporting ? t('workspaceRoute.explorer.actions.importingResources') : t('workspaceRoute.explorer.actions.confirmImport')}
                      </IconLabel>
                    </button>
                    <button
                      type="button"
                      className="workspace-button workspace-button--secondary"
                      onClick={onCancelImportPreview}
                      disabled={isImporting}
                    >
                      <IconLabel icon="delete">{t('workspaceRoute.explorer.actions.cancelPreview')}</IconLabel>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="workspace-resource-manager__section">
          <div className="workspace-resource-manager__section-copy">
            <h3>{t('workspaceRoute.management.sections.collectionTitle')}</h3>
            <p>{t('workspaceRoute.management.sections.collectionDescription')}</p>
          </div>
          <KeyValueMetaList
            items={[
              {
                label: t('workspaceRoute.management.context.labels.selectedCollection'),
                value: selectedCollection?.name ?? t('workspaceRoute.management.context.values.noneSelected'),
              },
              {
                label: t('workspaceRoute.management.context.labels.requestGroupCount'),
                value: selectedCollection
                  ? t('workspaceRoute.management.state.collectionCount', { count: requestGroupCount })
                  : t('workspaceRoute.management.state.collectionUnavailable'),
              },
            ]}
          />
          <label className="request-field request-field--compact">
            <span>{t('workspaceRoute.management.fields.manageCollection')}</span>
            <select
              aria-label={t('workspaceRoute.management.fields.manageCollection')}
              value={selectedCollection?.collectionId ?? ''}
              onChange={(event) => setSelectedCollectionId(event.currentTarget.value)}
              disabled={tree.length === 0 || isMutatingCollections}
            >
              {tree.map((collection) => (
                <option key={collection.collectionId} value={collection.collectionId}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>
          <label className="request-field request-field--compact">
            <span>{t('workspaceRoute.explorer.fields.collectionName')}</span>
            <input
              aria-label={t('workspaceRoute.explorer.fields.collectionName')}
              type="text"
              value={collectionNameDraft}
              disabled={!selectedCollection || isMutatingCollections}
              onChange={(event) => setCollectionEditorState({
                targetId: collectionEditorTargetId,
                value: event.currentTarget.value,
              })}
            />
          </label>
          <div className="request-work-surface__future-actions workspace-resource-manager__actions">
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={async () => {
                if (!selectedCollection) {
                  return;
                }

                await onRenameCollection(selectedCollection, collectionNameDraft.trim());
                setCollectionEditorState({ targetId: selectedCollection.collectionId, value: collectionNameDraft.trim() });
              }}
              disabled={isMutatingCollections || !selectedCollection || collectionNameDraft.trim().length === 0 || collectionNameDraft.trim() === selectedCollection.name}
            >
              <IconLabel icon="summary">{t('workspaceRoute.explorer.actions.renameCollectionShort')}</IconLabel>
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--ghost"
              onClick={async () => {
                if (!selectedCollection) {
                  return;
                }

                await onDeleteCollection(selectedCollection);
                setSelectedCollectionId('');
              }}
              disabled={isMutatingCollections || !canDeleteCollection}
              title={!canDeleteCollection ? t('workspaceRoute.explorer.tree.deleteCollectionRequiresEmpty') : undefined}
            >
              <IconLabel icon="delete">{t('workspaceRoute.explorer.actions.deleteCollectionShort')}</IconLabel>
            </button>
          </div>
          {collectionStatus ? (
            <div
              className={`workspace-explorer__status workspace-explorer__status--${collectionStatus.tone} workspace-resource-manager__status`}
              role={collectionStatus.tone === 'error' ? 'alert' : 'status'}
            >
              <p>{collectionStatus.message}</p>
              {(collectionStatus.details ?? []).length > 0 ? (
                <ul className="workspace-explorer__status-details">
                  {(collectionStatus.details ?? []).map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="workspace-resource-manager__section">
          <div className="workspace-resource-manager__section-copy">
            <h3>{t('workspaceRoute.management.sections.requestGroupTitle')}</h3>
            <p>{t('workspaceRoute.management.sections.requestGroupDescription')}</p>
          </div>
          <KeyValueMetaList
            items={[
              {
                label: t('workspaceRoute.management.context.labels.selectedCollection'),
                value: selectedCollection?.name ?? t('workspaceRoute.management.context.values.noneSelected'),
              },
              {
                label: t('workspaceRoute.management.context.labels.selectedRequestGroup'),
                value: selectedRequestGroup?.name ?? t('workspaceRoute.management.context.values.noneSelected'),
              },
              {
                label: t('workspaceRoute.management.context.labels.requestCount'),
                value: selectedRequestGroup
                  ? t('workspaceRoute.management.state.requestCount', { count: requestCount })
                  : selectedCollection
                    ? t('workspaceRoute.explorer.tree.noRequestGroups')
                    : t('workspaceRoute.management.state.requestGroupUnavailable'),
              },
            ]}
          />
          <label className="request-field request-field--compact">
            <span>{t('workspaceRoute.management.fields.manageRequestGroup')}</span>
            <select
              aria-label={t('workspaceRoute.management.fields.manageRequestGroup')}
              value={selectedRequestGroup?.requestGroupId ?? ''}
              onChange={(event) => setSelectedRequestGroupId(event.currentTarget.value)}
              disabled={!selectedCollection || selectedCollectionRequestGroupOptions.length === 0 || isMutatingRequestGroups}
            >
              {selectedCollectionRequestGroupOptions.length > 0
                ? selectedCollectionRequestGroupOptions.map((option) => (
                    <option key={option.requestGroup.requestGroupId} value={option.requestGroup.requestGroupId}>
                      {option.pathLabel}
                    </option>
                  ))
                : <option value="">{t('workspaceRoute.requestBuilder.placement.noRequestGroups')}</option>}
            </select>
          </label>
          <label className="request-field request-field--compact">
            <span>{t('workspaceRoute.explorer.fields.requestGroupName')}</span>
            <input
              aria-label={t('workspaceRoute.explorer.fields.requestGroupName')}
              type="text"
              value={requestGroupNameDraft}
              disabled={!selectedRequestGroup || isMutatingRequestGroups}
              onChange={(event) => setRequestGroupEditorState({
                targetId: requestGroupEditorTargetId,
                value: event.currentTarget.value,
              })}
            />
          </label>
          <div className="request-work-surface__future-actions workspace-resource-manager__actions">
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={async () => {
                if (!selectedRequestGroup) {
                  return;
                }

                await onRenameRequestGroup(selectedRequestGroup, requestGroupNameDraft.trim());
                setRequestGroupEditorState({ targetId: selectedRequestGroup.requestGroupId, value: requestGroupNameDraft.trim() });
              }}
              disabled={isMutatingRequestGroups || !selectedRequestGroup || requestGroupNameDraft.trim().length === 0 || requestGroupNameDraft.trim() === selectedRequestGroup.name}
            >
              <IconLabel icon="summary">{t('workspaceRoute.explorer.actions.renameRequestGroupShort')}</IconLabel>
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--ghost"
              onClick={async () => {
                if (!selectedRequestGroup) {
                  return;
                }

                await onDeleteRequestGroup(selectedRequestGroup);
                setSelectedRequestGroupId('');
              }}
              disabled={isMutatingRequestGroups || !canDeleteRequestGroup}
              title={!canDeleteRequestGroup ? t('workspaceRoute.explorer.tree.deleteRequiresEmpty') : undefined}
            >
              <IconLabel icon="delete">{t('workspaceRoute.explorer.actions.deleteRequestGroupShort')}</IconLabel>
            </button>
          </div>
          {requestGroupStatus ? (
            <div
              className={`workspace-explorer__status workspace-explorer__status--${requestGroupStatus.tone} workspace-resource-manager__status`}
              role={requestGroupStatus.tone === 'error' ? 'alert' : 'status'}
            >
              <p>{requestGroupStatus.message}</p>
              {(requestGroupStatus.details ?? []).length > 0 ? (
                <ul className="workspace-explorer__status-details">
                  {(requestGroupStatus.details ?? []).map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="workspace-resource-manager__section">
          <div className="workspace-resource-manager__section-copy">
            <h3>{t('workspaceRoute.management.sections.requestTitle')}</h3>
            <p>{t('workspaceRoute.management.sections.requestDescription')}</p>
          </div>
          <KeyValueMetaList
            items={[
              {
                label: t('workspaceRoute.management.context.labels.activeTab'),
                value: activeTab?.title ?? t('workspaceRoute.management.context.values.noActiveTab'),
              },
              {
                label: t('workspaceRoute.management.context.labels.tabState'),
                value: activeTabState,
              },
              {
                label: t('workspaceRoute.management.context.labels.savePlacement'),
                value: activePlacementPath ?? t('workspaceRoute.management.state.noActivePlacement'),
              },
            ]}
          />
          {activeSavedRequest ? (
            <div className="request-work-surface__future-actions workspace-resource-manager__actions">
              <button
                type="button"
                className="workspace-button workspace-button--secondary"
                onClick={() => onExportRequest(activeSavedRequest)}
                disabled={isDeletingRequest || isExporting}
              >
                <IconLabel icon="export">{t('workspaceRoute.management.actions.exportSavedRequest')}</IconLabel>
              </button>
              <button
                type="button"
                className="workspace-button workspace-button--ghost"
                onClick={() => onDeleteRequest(activeSavedRequest)}
                disabled={isDeletingRequest}
              >
                <IconLabel icon="delete">{t('workspaceRoute.management.actions.deleteSavedRequest')}</IconLabel>
              </button>
            </div>
          ) : null}
          <p className="shared-readiness-note">
            {activeSavedRequest
              ? t('workspaceRoute.management.state.requestSelected', { name: activeSavedRequest.name })
              : isDetachedDraft
                ? t('workspaceRoute.management.state.requestDetached')
                : activeTab
                  ? t('workspaceRoute.management.state.requestDraft')
                  : t('workspaceRoute.management.state.requestUnavailable')}
          </p>
          {savedRequestStatus ? (
            <div
              className={`workspace-explorer__status workspace-explorer__status--${savedRequestStatus.tone} workspace-resource-manager__status`}
              role={savedRequestStatus.tone === 'error' ? 'alert' : 'status'}
            >
              <p>{savedRequestStatus.message}</p>
              {(savedRequestStatus.details ?? []).length > 0 ? (
                <ul className="workspace-explorer__status-details">
                  {(savedRequestStatus.details ?? []).map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
      </div>
    </section>
  );
}


