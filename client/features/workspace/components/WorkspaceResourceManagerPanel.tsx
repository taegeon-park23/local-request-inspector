import { useMemo, useState } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import type { RequestDraftState } from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import {
  formatRequestPlacementPath,
} from '@client/features/request-builder/request-placement';
import type {
  WorkspaceCollectionNode,
  WorkspaceRequestGroupNode,
  WorkspaceTreeRequestLeaf,
} from '@client/features/workspace/workspace-request-tree.api';
import type { AuthoredResourceBundleImportPreviewResult } from '@client/features/workspace/resource-bundle.api';
import { IconLabel } from '@client/shared/ui/IconLabel';

type ResourceTransferTone = 'success' | 'error' | 'info';

interface WorkspaceImportPreview {
  fileName: string;
  result: AuthoredResourceBundleImportPreviewResult;
}

interface WorkspaceResourceManagerPanelProps {
  tree: WorkspaceCollectionNode[];
  activeTab: RequestTabRecord | null;
  activeDraft: RequestDraftState | null;
  activeSavedRequest: WorkspaceTreeRequestLeaf | null;
  onCreateCollection: (name: string) => Promise<{ id: string; name: string } | void> | void;
  onRenameCollection: (collection: WorkspaceCollectionNode, name: string) => Promise<{ id: string; name: string } | void> | void;
  onDeleteCollection: (collection: WorkspaceCollectionNode) => Promise<void> | void;
  onCreateRequestGroup: (collection: WorkspaceCollectionNode, name: string) => Promise<{ id: string; name: string } | void> | void;
  onRenameRequestGroup: (requestGroup: WorkspaceRequestGroupNode, name: string) => Promise<{ id: string; name: string } | void> | void;
  onDeleteRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => Promise<void> | void;
  onExportRequest: (request: WorkspaceTreeRequestLeaf) => void;
  onDeleteRequest: (request: WorkspaceTreeRequestLeaf) => void;
  onExportResources: () => void;
  onImportResources: (file: File) => void;
  importPreview: WorkspaceImportPreview | null;
  onConfirmImportPreview: () => void;
  onCancelImportPreview: () => void;
  transferStatusMessage: string | null;
  transferStatusDetails?: string[] | undefined;
  transferStatusTone?: ResourceTransferTone | undefined;
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
) {
  if (!collection || !requestGroupId) {
    return null;
  }

  return collection.children.find((requestGroup) => requestGroup.requestGroupId === requestGroupId) ?? null;
}

export function WorkspaceResourceManagerPanel({
  tree,
  activeTab,
  activeDraft,
  activeSavedRequest,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onCreateRequestGroup,
  onRenameRequestGroup,
  onDeleteRequestGroup,
  onExportRequest,
  onDeleteRequest,
  onExportResources,
  onImportResources,
  importPreview,
  onConfirmImportPreview,
  onCancelImportPreview,
  transferStatusMessage,
  transferStatusDetails = [],
  transferStatusTone = 'info',
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
}: WorkspaceResourceManagerPanelProps) {
  const { t } = useI18n();
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

  const selectedRequestGroupIdValue = useMemo(() => {
    if (!selectedCollection) {
      return '';
    }

    const preferredRequestGroupId = activeDraft?.collectionId === selectedCollection.collectionId
      ? (activeDraft?.requestGroupId ?? '')
      : activeTab?.collectionId === selectedCollection.collectionId
        ? (activeTab?.requestGroupId ?? '')
        : '';
    return selectedCollection.children.some((requestGroup) => requestGroup.requestGroupId === selectedRequestGroupId)
      ? selectedRequestGroupId
      : (preferredRequestGroupId || selectedCollection.children[0]?.requestGroupId || '');
  }, [
    activeDraft?.collectionId,
    activeDraft?.requestGroupId,
    activeTab?.collectionId,
    activeTab?.requestGroupId,
    selectedCollection,
    selectedRequestGroupId,
  ]);

  const selectedRequestGroup = useMemo(
    () => findRequestGroupById(selectedCollection, selectedRequestGroupIdValue) ?? selectedCollection?.children[0] ?? null,
    [selectedCollection, selectedRequestGroupIdValue],
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
  const canDeleteCollection = Boolean(selectedCollection && selectedCollection.children.length === 0);
  const canDeleteRequestGroup = Boolean(selectedRequestGroup && selectedRequestGroup.children.length === 0);
  const requestGroupCount = selectedCollection?.children.length ?? 0;
  const requestCount = selectedRequestGroup?.children.length ?? 0;

  return (
    <section className="workspace-resource-manager workspace-surface-card" aria-label={t('workspaceRoute.management.ariaLabel')}>
      <header className="workspace-resource-manager__header management-detail__header">
        <div className="workspace-resource-manager__header-copy">
          <p className="section-placeholder__eyebrow">{t('workspaceRoute.management.header.eyebrow')}</p>
          <h2>{t('workspaceRoute.management.header.title')}</h2>
          <p className="management-detail__header-meta">{t('workspaceRoute.management.header.summary')}</p>
          <p className="shared-readiness-note workspace-resource-manager__placement-note">
            {activePlacementPath
              ? t('workspaceRoute.management.state.activePlacement', { path: activePlacementPath })
              : t('workspaceRoute.management.state.noActivePlacement')}
          </p>
        </div>
        <div className="workspace-resource-manager__badge-rail management-detail__badge-rail request-work-surface__badges">
          <span className="workspace-chip">{t('workspaceRoute.management.badges.savedTree')}</span>
          <span className="workspace-chip workspace-chip--secondary">{t('workspaceRoute.management.badges.mainSurface')}</span>
        </div>
      </header>

      <div className="workspace-resource-manager__grid">
        <section className="workspace-resource-manager__section">
          <div className="workspace-resource-manager__section-copy">
            <h3>{t('workspaceRoute.management.sections.transferTitle')}</h3>
            <p>{t('workspaceRoute.management.sections.transferDescription')}</p>
          </div>
          <div className="request-work-surface__future-actions">
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
          {transferStatusMessage ? (
            <div
              className={`workspace-explorer__status workspace-explorer__status--${transferStatusTone} workspace-resource-manager__status`}
              role={transferStatusTone === 'error' ? 'alert' : 'status'}
            >
              <p>{transferStatusMessage}</p>
              {transferStatusDetails.length > 0 ? (
                <ul className="workspace-explorer__status-details">
                  {transferStatusDetails.map((detail) => (
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
              onChange={(event) => setCollectionEditorState({
                targetId: collectionEditorTargetId,
                value: event.currentTarget.value,
              })}
            />
          </label>
          <div className="request-work-surface__future-actions">
            <button
              type="button"
              className="workspace-button"
              onClick={async () => {
                const result = await onCreateCollection(collectionNameDraft.trim());

                if (result && 'id' in result) {
                  setSelectedCollectionId(result.id);
                }
              }}
              disabled={isMutatingCollections || collectionNameDraft.trim().length === 0}
            >
              <IconLabel icon="add">{t('workspaceRoute.explorer.actions.createCollection')}</IconLabel>
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={async () => {
                if (!selectedCollection) {
                  return;
                }

                await onRenameCollection(selectedCollection, collectionNameDraft.trim());
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
              }}
              disabled={isMutatingCollections || !canDeleteCollection}
              title={!canDeleteCollection ? t('workspaceRoute.explorer.tree.deleteCollectionRequiresEmpty') : undefined}
            >
              <IconLabel icon="delete">{t('workspaceRoute.explorer.actions.deleteCollectionShort')}</IconLabel>
            </button>
          </div>
          <p className="shared-readiness-note">
            {selectedCollection
              ? (requestGroupCount > 0
                ? t('workspaceRoute.management.state.collectionCount', { count: requestGroupCount })
                : t('workspaceRoute.explorer.tree.noRequestGroups'))
              : t('workspaceRoute.management.state.collectionUnavailable')}
          </p>
        </section>

        <section className="workspace-resource-manager__section">
          <div className="workspace-resource-manager__section-copy">
            <h3>{t('workspaceRoute.management.sections.requestGroupTitle')}</h3>
            <p>{t('workspaceRoute.management.sections.requestGroupDescription')}</p>
          </div>
          <label className="request-field request-field--compact">
            <span>{t('workspaceRoute.management.fields.manageRequestGroup')}</span>
            <select
              aria-label={t('workspaceRoute.management.fields.manageRequestGroup')}
              value={selectedRequestGroup?.requestGroupId ?? ''}
              onChange={(event) => setSelectedRequestGroupId(event.currentTarget.value)}
              disabled={!selectedCollection || selectedCollection.children.length === 0 || isMutatingRequestGroups}
            >
              {selectedCollection?.children.length
                ? selectedCollection.children.map((requestGroup) => (
                    <option key={requestGroup.requestGroupId} value={requestGroup.requestGroupId}>
                      {requestGroup.name}
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
              onChange={(event) => setRequestGroupEditorState({
                targetId: requestGroupEditorTargetId,
                value: event.currentTarget.value,
              })}
            />
          </label>
          <div className="request-work-surface__future-actions">
            <button
              type="button"
              className="workspace-button"
              onClick={async () => {
                if (!selectedCollection) {
                  return;
                }

                const result = await onCreateRequestGroup(selectedCollection, requestGroupNameDraft.trim());

                if (result && 'id' in result) {
                  setSelectedRequestGroupId(result.id);
                }
              }}
              disabled={isMutatingRequestGroups || !selectedCollection || requestGroupNameDraft.trim().length === 0}
            >
              <IconLabel icon="add">{t('workspaceRoute.explorer.actions.createRequestGroupShort')}</IconLabel>
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={async () => {
                if (!selectedRequestGroup) {
                  return;
                }

                await onRenameRequestGroup(selectedRequestGroup, requestGroupNameDraft.trim());
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
              }}
              disabled={isMutatingRequestGroups || !canDeleteRequestGroup}
              title={!canDeleteRequestGroup ? t('workspaceRoute.explorer.tree.deleteRequiresEmpty') : undefined}
            >
              <IconLabel icon="delete">{t('workspaceRoute.explorer.actions.deleteRequestGroupShort')}</IconLabel>
            </button>
          </div>
          <p className="shared-readiness-note">
            {selectedRequestGroup
              ? t('workspaceRoute.management.state.requestCount', { count: requestCount })
              : selectedCollection
                ? t('workspaceRoute.explorer.tree.noRequestGroups')
                : t('workspaceRoute.management.state.requestGroupUnavailable')}
          </p>
        </section>

        <section className="workspace-resource-manager__section">
          <div className="workspace-resource-manager__section-copy">
            <h3>{t('workspaceRoute.management.sections.requestTitle')}</h3>
            <p>{t('workspaceRoute.management.sections.requestDescription')}</p>
          </div>
          <div className="request-work-surface__future-actions">
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={() => {
                if (activeSavedRequest) {
                  onExportRequest(activeSavedRequest);
                }
              }}
              disabled={!activeSavedRequest || isDeletingRequest || isExporting}
            >
              <IconLabel icon="export">{t('workspaceRoute.management.actions.exportSavedRequest')}</IconLabel>
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--ghost"
              onClick={() => {
                if (activeSavedRequest) {
                  onDeleteRequest(activeSavedRequest);
                }
              }}
              disabled={!activeSavedRequest || isDeletingRequest}
            >
              <IconLabel icon="delete">{t('workspaceRoute.management.actions.deleteSavedRequest')}</IconLabel>
            </button>
          </div>
          <p className="shared-readiness-note">
            {activeSavedRequest
              ? t('workspaceRoute.management.state.requestSelected', { name: activeSavedRequest.name })
              : activeTab
                ? t('workspaceRoute.management.state.requestDetached')
                : t('workspaceRoute.management.state.requestUnavailable')}
          </p>
        </section>
      </div>
    </section>
  );
}
