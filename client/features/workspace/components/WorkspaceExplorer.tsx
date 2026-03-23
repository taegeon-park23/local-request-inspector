import { useState } from 'react';
import type {
  WorkspaceCollectionNode,
  WorkspaceRequestGroupNode,
  WorkspaceTreeRequestLeaf,
} from '@client/features/workspace/workspace-request-tree.api';
import type { AuthoredResourceBundleImportPreviewResult } from '@client/features/workspace/resource-bundle.api';
import { useI18n } from '@client/app/providers/useI18n';
import { IconLabel } from '@client/shared/ui/IconLabel';

type ResourceTransferTone = 'success' | 'error' | 'info';

interface WorkspaceImportPreview {
  fileName: string;
  result: AuthoredResourceBundleImportPreviewResult;
}

interface WorkspaceExplorerProps {
  tree: WorkspaceCollectionNode[];
  selectedRequestId: string | null;
  onCreateRequest: () => void;
  onCreateCollection: (name: string) => void | Promise<void>;
  onRenameCollection: (collection: WorkspaceCollectionNode, name: string) => void | Promise<void>;
  onDeleteCollection: (collection: WorkspaceCollectionNode) => void | Promise<void>;
  onOpenSavedRequest: (request: WorkspaceTreeRequestLeaf) => void | Promise<void>;
  onDeleteRequest: (request: WorkspaceTreeRequestLeaf) => void;
  onExportRequest: (request: WorkspaceTreeRequestLeaf) => void;
  onCreateRequestGroup: (collection: WorkspaceCollectionNode, name: string) => void | Promise<void>;
  onRenameRequestGroup: (requestGroup: WorkspaceRequestGroupNode, name: string) => void | Promise<void>;
  onDeleteRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void | Promise<void>;
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

interface WorkspaceExplorerNodeListProps {
  nodes: WorkspaceCollectionNode[];
  selectedRequestId: string | null;
  onCreateCollection: (name: string) => void | Promise<void>;
  onRenameCollection: (collection: WorkspaceCollectionNode, name: string) => void | Promise<void>;
  onDeleteCollection: (collection: WorkspaceCollectionNode) => void | Promise<void>;
  onOpenSavedRequest: (request: WorkspaceTreeRequestLeaf) => void | Promise<void>;
  onDeleteRequest: (request: WorkspaceTreeRequestLeaf) => void;
  onExportRequest: (request: WorkspaceTreeRequestLeaf) => void;
  onCreateRequestGroup: (collection: WorkspaceCollectionNode, name: string) => void | Promise<void>;
  onRenameRequestGroup: (requestGroup: WorkspaceRequestGroupNode, name: string) => void | Promise<void>;
  onDeleteRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void | Promise<void>;
  isCreatingCollection: boolean;
  isRenamingCollection: boolean;
  isDeletingCollection: boolean;
  isCreatingRequestGroup: boolean;
  isRenamingRequestGroup: boolean;
  isDeletingRequestGroup: boolean;
}

function findSelectedRequestPath(nodes: WorkspaceCollectionNode[], selectedRequestId: string | null) {
  if (!selectedRequestId) {
    return null;
  }

  for (const collection of nodes) {
    for (const requestGroup of collection.children) {
      for (const requestNode of requestGroup.children) {
        if (requestNode.request.id === selectedRequestId) {
          return {
            collectionName: collection.name,
            requestGroupName: requestGroup.name,
            request: requestNode.request,
          };
        }
      }
    }
  }

  return null;
}

function getSelectionPathLabel(
  tree: WorkspaceCollectionNode[],
  selectedRequestId: string | null,
) {
  const selectedPath = findSelectedRequestPath(tree, selectedRequestId);

  if (!selectedPath) {
    return null;
  }

  return `${selectedPath.collectionName} / ${selectedPath.requestGroupName} / ${selectedPath.request.name}`;
}

function WorkspaceTreeComposer({
  label,
  value,
  confirmLabel,
  disabled,
  onChange,
  onConfirm,
  onCancel,
}: {
  label: string;
  value: string;
  confirmLabel: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="workspace-tree-composer">
      <label className="request-field request-field--compact workspace-tree-composer__field">
        <span>{label}</span>
        <input
          aria-label={label}
          type="text"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </label>
      <div className="workspace-tree-composer__actions">
        <button
          type="button"
          className="workspace-button workspace-button--secondary"
          onClick={() => void onConfirm()}
          disabled={disabled || value.trim().length === 0}
        >
          <IconLabel icon="save">{confirmLabel}</IconLabel>
        </button>
        <button type="button" className="workspace-button workspace-button--ghost" onClick={onCancel} disabled={disabled}>
          <IconLabel icon="delete">{t('workspaceRoute.explorer.actions.cancelRequestGroup')}</IconLabel>
        </button>
      </div>
    </div>
  );
}

function WorkspaceCollectionNodeSummary({
  collection,
  isBusy,
  onStartCreateRequestGroup,
  onStartRename,
  onDelete,
}: {
  collection: WorkspaceCollectionNode;
  isBusy: boolean;
  onStartCreateRequestGroup: () => void;
  onStartRename: () => void;
  onDelete: () => void | Promise<void>;
}) {
  const { t } = useI18n();
  const canDelete = collection.children.length === 0;

  return (
    <div className="workspace-tree-node workspace-tree-node--managed" data-kind="collection">
      <div className="workspace-tree-node__copy">
        <div className="workspace-tree-node__title-row">
          <span className="workspace-tree-node__kind">{t('workspaceRoute.explorer.tree.kindCollection')}</span>
          <span className="workspace-tree-node__label">{collection.name}</span>
        </div>
        <p className="workspace-tree-node__meta">
          {t('workspaceRoute.explorer.tree.requestGroupCount', { count: collection.children.length })}
          {collection.children.length > 0 ? ` · ${t('workspaceRoute.explorer.tree.deleteCollectionRequiresEmpty')}` : ''}
        </p>
      </div>
      <div className="workspace-tree-node__actions">
        <button
          type="button"
          className="workspace-button workspace-button--ghost"
          aria-label={t('workspaceRoute.explorer.actions.createRequestGroup', { name: collection.name })}
          onClick={onStartCreateRequestGroup}
          disabled={isBusy}
        >
          <IconLabel icon="add">{t('workspaceRoute.explorer.actions.createRequestGroupShort')}</IconLabel>
        </button>
        <button
          type="button"
          className="workspace-button workspace-button--ghost"
          aria-label={t('workspaceRoute.explorer.actions.renameCollection', { name: collection.name })}
          onClick={onStartRename}
          disabled={isBusy}
        >
          <IconLabel icon="summary">{t('workspaceRoute.explorer.actions.renameCollectionShort')}</IconLabel>
        </button>
        <button
          type="button"
          className="workspace-button workspace-button--ghost"
          aria-label={t('workspaceRoute.explorer.actions.deleteCollection', { name: collection.name })}
          onClick={() => void onDelete()}
          disabled={isBusy || !canDelete}
          title={!canDelete ? t('workspaceRoute.explorer.tree.deleteCollectionRequiresEmpty') : undefined}
        >
          <IconLabel icon="delete">{t('workspaceRoute.explorer.actions.deleteCollectionShort')}</IconLabel>
        </button>
      </div>
    </div>
  );
}

function WorkspaceRequestGroupNodeSummary({
  requestGroup,
  isBusy,
  onStartRename,
  onDelete,
}: {
  requestGroup: WorkspaceRequestGroupNode;
  isBusy: boolean;
  onStartRename: () => void;
  onDelete: () => void | Promise<void>;
}) {
  const { t } = useI18n();
  const canDelete = requestGroup.children.length === 0;

  return (
    <div className="workspace-tree-node workspace-tree-node--managed" data-kind="request-group">
      <div className="workspace-tree-node__copy">
        <div className="workspace-tree-node__title-row">
          <span className="workspace-tree-node__kind">{t('workspaceRoute.explorer.tree.kindRequestGroup')}</span>
          <span className="workspace-tree-node__label">{requestGroup.name}</span>
        </div>
        <p className="workspace-tree-node__meta">
          {t('workspaceRoute.explorer.tree.requestCount', { count: requestGroup.children.length })}
          {requestGroup.children.length > 0 ? ` · ${t('workspaceRoute.explorer.tree.deleteRequiresEmpty')}` : ''}
        </p>
      </div>
      <div className="workspace-tree-node__actions">
        <button
          type="button"
          className="workspace-button workspace-button--ghost"
          aria-label={t('workspaceRoute.explorer.actions.renameRequestGroup', { name: requestGroup.name })}
          onClick={onStartRename}
          disabled={isBusy}
        >
          <IconLabel icon="summary">{t('workspaceRoute.explorer.actions.renameRequestGroupShort')}</IconLabel>
        </button>
        <button
          type="button"
          className="workspace-button workspace-button--ghost"
          aria-label={t('workspaceRoute.explorer.actions.deleteRequestGroup', { name: requestGroup.name })}
          onClick={() => void onDelete()}
          disabled={isBusy || !canDelete}
          title={!canDelete ? t('workspaceRoute.explorer.tree.deleteRequiresEmpty') : undefined}
        >
          <IconLabel icon="delete">{t('workspaceRoute.explorer.actions.deleteRequestGroupShort')}</IconLabel>
        </button>
      </div>
    </div>
  );
}

export function WorkspaceExplorer({
  tree,
  selectedRequestId,
  onCreateRequest,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onOpenSavedRequest,
  onDeleteRequest,
  onExportRequest,
  onCreateRequestGroup,
  onRenameRequestGroup,
  onDeleteRequestGroup,
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
}: WorkspaceExplorerProps) {
  const { t } = useI18n();
  const selectionPathLabel = getSelectionPathLabel(tree, selectedRequestId);
  const isMutatingTree = isCreatingCollection
    || isRenamingCollection
    || isDeletingCollection
    || isCreatingRequestGroup
    || isRenamingRequestGroup
    || isDeletingRequestGroup;

  return (
    <div className="workspace-explorer">
      <header className="workspace-explorer__header workspace-explorer__header--stacked">
        <div className="workspace-explorer__header-copy">
          <p className="section-placeholder__eyebrow">{t('workspaceRoute.explorer.header.eyebrow')}</p>
          <h2>{t('workspaceRoute.explorer.header.title')}</h2>
          <p className="workspace-explorer__status-line">{t('workspaceRoute.explorer.header.summary')}</p>
        </div>
        <div className="workspace-explorer__header-actions">
          <button type="button" className="workspace-button" onClick={onCreateRequest}>
            <IconLabel icon="new">{t('workspaceRoute.explorer.actions.newRequest')}</IconLabel>
          </button>
          <button
            type="button"
            className="workspace-button workspace-button--secondary"
            onClick={onExportResources}
            disabled={isExporting || isPreviewingImport || isImporting || isDeletingRequest || isMutatingTree}
          >
            <IconLabel icon="export">
              {isExporting ? t('workspaceRoute.explorer.actions.exportingResources') : t('workspaceRoute.explorer.actions.exportResources')}
            </IconLabel>
          </button>
          <label className="workspace-button workspace-button--secondary workspace-explorer__import-label">
            <IconLabel icon="import">
              {isPreviewingImport
                ? t('workspaceRoute.explorer.actions.previewingImport')
                : isImporting
                  ? t('workspaceRoute.explorer.actions.importingResources')
                  : t('workspaceRoute.explorer.actions.importResources')}
            </IconLabel>
            <input
              aria-label={t('workspaceRoute.explorer.actions.importResourcesInput')}
              className="workspace-explorer__file-input"
              type="file"
              accept="application/json,.json"
              disabled={isPreviewingImport || isImporting || isDeletingRequest || isMutatingTree}
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
        <p className="workspace-explorer__selection-line">
          {selectionPathLabel
            ? t('workspaceRoute.explorer.selection.current', { path: selectionPathLabel })
            : t('workspaceRoute.explorer.selection.none')}
        </p>
      </header>
      <p className="shared-readiness-note workspace-explorer__boundary-note">
        {t('workspaceRoute.explorer.notes.boundary')}
      </p>
      {transferStatusMessage ? (
        <div
          className={`workspace-explorer__status workspace-explorer__status--${transferStatusTone}`}
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
      <WorkspaceExplorerNodeList
        nodes={tree}
        selectedRequestId={selectedRequestId}
        onCreateCollection={onCreateCollection}
        onRenameCollection={onRenameCollection}
        onDeleteCollection={onDeleteCollection}
        onOpenSavedRequest={onOpenSavedRequest}
        onDeleteRequest={onDeleteRequest}
        onExportRequest={onExportRequest}
        onCreateRequestGroup={onCreateRequestGroup}
        onRenameRequestGroup={onRenameRequestGroup}
        onDeleteRequestGroup={onDeleteRequestGroup}
        isCreatingCollection={isCreatingCollection}
        isRenamingCollection={isRenamingCollection}
        isDeletingCollection={isDeletingCollection}
        isCreatingRequestGroup={isCreatingRequestGroup}
        isRenamingRequestGroup={isRenamingRequestGroup}
        isDeletingRequestGroup={isDeletingRequestGroup}
      />
    </div>
  );
}

function WorkspaceExplorerNodeList({
  nodes,
  selectedRequestId,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onOpenSavedRequest,
  onDeleteRequest,
  onExportRequest,
  onCreateRequestGroup,
  onRenameRequestGroup,
  onDeleteRequestGroup,
  isCreatingCollection,
  isRenamingCollection,
  isDeletingCollection,
  isCreatingRequestGroup,
  isRenamingRequestGroup,
  isDeletingRequestGroup,
}: WorkspaceExplorerNodeListProps) {
  const { t } = useI18n();
  const [isCreatingCollectionComposerOpen, setIsCreatingCollectionComposerOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [draftCollectionName, setDraftCollectionName] = useState('');
  const [creatingRequestGroupCollectionId, setCreatingRequestGroupCollectionId] = useState<string | null>(null);
  const [editingRequestGroupId, setEditingRequestGroupId] = useState<string | null>(null);
  const [draftRequestGroupName, setDraftRequestGroupName] = useState('');
  const isMutatingTree = isCreatingCollection
    || isRenamingCollection
    || isDeletingCollection
    || isCreatingRequestGroup
    || isRenamingRequestGroup
    || isDeletingRequestGroup;

  const resetCollectionComposer = () => {
    setIsCreatingCollectionComposerOpen(false);
    setEditingCollectionId(null);
    setDraftCollectionName('');
  };

  const resetRequestGroupComposer = () => {
    setCreatingRequestGroupCollectionId(null);
    setEditingRequestGroupId(null);
    setDraftRequestGroupName('');
  };

  return (
    <>
      <div className="workspace-tree-node workspace-tree-node--managed workspace-tree-node--create-root" data-kind="collection-root-action">
        <div className="workspace-tree-node__copy">
          <div className="workspace-tree-node__title-row">
            <span className="workspace-tree-node__kind">{t('workspaceRoute.explorer.tree.kindCollection')}</span>
            <span className="workspace-tree-node__label">{t('workspaceRoute.explorer.actions.createCollectionShort')}</span>
          </div>
          <p className="workspace-tree-node__meta">{t('workspaceRoute.explorer.tree.createCollectionHint')}</p>
        </div>
        <div className="workspace-tree-node__actions">
          <button
            type="button"
            className="workspace-button workspace-button--ghost"
            aria-label={t('workspaceRoute.explorer.actions.createCollectionShort')}
            onClick={() => {
              resetRequestGroupComposer();
              setEditingCollectionId(null);
              setDraftCollectionName('');
              setIsCreatingCollectionComposerOpen(true);
            }}
            disabled={isMutatingTree}
          >
            <IconLabel icon="add">{t('workspaceRoute.explorer.actions.createCollectionShort')}</IconLabel>
          </button>
        </div>
      </div>
      {isCreatingCollectionComposerOpen ? (
        <WorkspaceTreeComposer
          label={t('workspaceRoute.explorer.fields.collectionName')}
          value={draftCollectionName}
          confirmLabel={t('workspaceRoute.explorer.actions.saveCollection')}
          disabled={isMutatingTree}
          onChange={setDraftCollectionName}
          onConfirm={async () => {
            await onCreateCollection(draftCollectionName.trim());
            resetCollectionComposer();
          }}
          onCancel={resetCollectionComposer}
        />
      ) : null}
      <ul className="workspace-explorer__tree" data-depth={0}>
        {nodes.map((collection) => (
          <li key={collection.id}>
            <WorkspaceCollectionNodeSummary
              collection={collection}
              isBusy={isMutatingTree}
              onStartCreateRequestGroup={() => {
                resetCollectionComposer();
                setEditingRequestGroupId(null);
                setCreatingRequestGroupCollectionId(collection.collectionId);
                setDraftRequestGroupName('');
              }}
              onStartRename={() => {
                resetRequestGroupComposer();
                setIsCreatingCollectionComposerOpen(false);
                setEditingCollectionId(collection.collectionId);
                setDraftCollectionName(collection.name);
              }}
              onDelete={() => onDeleteCollection(collection)}
            />
            {editingCollectionId === collection.collectionId ? (
              <WorkspaceTreeComposer
                label={t('workspaceRoute.explorer.fields.collectionName')}
                value={draftCollectionName}
                confirmLabel={t('workspaceRoute.explorer.actions.saveRenamedCollection')}
                disabled={isMutatingTree}
                onChange={setDraftCollectionName}
                onConfirm={async () => {
                  await onRenameCollection(collection, draftCollectionName.trim());
                  resetCollectionComposer();
                }}
                onCancel={resetCollectionComposer}
              />
            ) : null}
            {creatingRequestGroupCollectionId === collection.collectionId ? (
              <WorkspaceTreeComposer
                label={t('workspaceRoute.explorer.fields.requestGroupName')}
                value={draftRequestGroupName}
                confirmLabel={t('workspaceRoute.explorer.actions.saveRequestGroup')}
                disabled={isMutatingTree}
                onChange={setDraftRequestGroupName}
                onConfirm={async () => {
                  await onCreateRequestGroup(collection, draftRequestGroupName.trim());
                  resetRequestGroupComposer();
                }}
                onCancel={resetRequestGroupComposer}
              />
            ) : null}
            <ul className="workspace-explorer__tree" data-depth={1}>
              {collection.children.length === 0 ? (
                <li>
                  <p className="workspace-tree-empty-note">{t('workspaceRoute.explorer.tree.noRequestGroups')}</p>
                </li>
              ) : null}
              {collection.children.map((requestGroup) => (
                <li key={requestGroup.id}>
                  <WorkspaceRequestGroupNodeSummary
                    requestGroup={requestGroup}
                    isBusy={isMutatingTree}
                    onStartRename={() => {
                      resetCollectionComposer();
                      setCreatingRequestGroupCollectionId(null);
                      setEditingRequestGroupId(requestGroup.requestGroupId);
                      setDraftRequestGroupName(requestGroup.name);
                    }}
                    onDelete={() => onDeleteRequestGroup(requestGroup)}
                  />
                  {editingRequestGroupId === requestGroup.requestGroupId ? (
                    <WorkspaceTreeComposer
                      label={t('workspaceRoute.explorer.fields.requestGroupName')}
                      value={draftRequestGroupName}
                      confirmLabel={t('workspaceRoute.explorer.actions.saveRenamedRequestGroup')}
                      disabled={isMutatingTree}
                      onChange={setDraftRequestGroupName}
                      onConfirm={async () => {
                        await onRenameRequestGroup(requestGroup, draftRequestGroupName.trim());
                        resetRequestGroupComposer();
                      }}
                      onCancel={resetRequestGroupComposer}
                    />
                  ) : null}
                  <ul className="workspace-explorer__tree" data-depth={2}>
                    {requestGroup.children.map((requestNode) => {
                      const isSelected = selectedRequestId === requestNode.request.id;

                      return (
                        <li key={requestNode.id}>
                          <div className="workspace-request-row">
                            <button
                              type="button"
                              className={isSelected ? 'workspace-request workspace-request--selected' : 'workspace-request'}
                              aria-label={t('workspaceRoute.explorer.actions.openRequest', { name: requestNode.request.name })}
                              aria-pressed={isSelected}
                              data-kind={requestNode.kind}
                              onClick={() => onOpenSavedRequest(requestNode.request)}
                            >
                              <span className="workspace-request__header">
                                <span className="workspace-request__title">{requestNode.request.name}</span>
                                <span className="workspace-request__badges">
                                  <span className="workspace-chip">{requestNode.request.methodLabel}</span>
                                </span>
                              </span>
                              <span className="workspace-request__path">
                                {collection.name} / {requestGroup.name}
                              </span>
                              <span className="workspace-request__meta workspace-request__meta--support">{requestNode.request.summary}</span>
                            </button>
                            <div className="workspace-request-row__actions">
                              <button
                                type="button"
                                className="workspace-button workspace-button--ghost workspace-request-row__export"
                                aria-label={t('workspaceRoute.explorer.actions.exportRequest', { name: requestNode.request.name })}
                                onClick={() => onExportRequest(requestNode.request)}
                              >
                                <IconLabel icon="export">{t('workspaceRoute.explorer.actions.exportSingle')}</IconLabel>
                              </button>
                              <button
                                type="button"
                                className="workspace-button workspace-button--ghost workspace-request-row__delete"
                                aria-label={t('workspaceRoute.explorer.actions.deleteRequest', { name: requestNode.request.name })}
                                onClick={() => onDeleteRequest(requestNode.request)}
                              >
                                <IconLabel icon="delete">{t('workspaceRoute.explorer.actions.deleteRequestShort')}</IconLabel>
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

