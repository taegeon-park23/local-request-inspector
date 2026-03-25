import type { MouseEvent } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import type { RequestPlacementValue } from '@client/features/request-builder/request-placement';
import type {
  WorkspaceCollectionNode,
  WorkspaceRequestGroupNode,
  WorkspaceTreeRequestLeaf,
} from '@client/features/workspace/workspace-request-tree.api';
import type { WorkspaceExplorerItemKind } from '@client/features/workspace/state/workspace-shell-store';

interface WorkspaceExplorerProps {
  tree: WorkspaceCollectionNode[];
  selectedItemId: string | null;
  selectedItemKind: WorkspaceExplorerItemKind | null;
  onSelectCollection: (collection: WorkspaceCollectionNode) => void;
  onSelectRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void;
  onPreviewSavedRequest: (request: WorkspaceTreeRequestLeaf) => void | Promise<void>;
  onPinSavedRequest: (request: WorkspaceTreeRequestLeaf) => void | Promise<void>;
  onCreateRequest: (placement?: RequestPlacementValue) => void | Promise<void>;
  onCreateRequestGroup: (target: WorkspaceCollectionNode | WorkspaceRequestGroupNode) => void | Promise<void>;
  onRunCollection: (collection: WorkspaceCollectionNode) => void | Promise<void>;
  onRunRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void | Promise<void>;
  onRenameCollection: (collection: WorkspaceCollectionNode) => void | Promise<void>;
  onDeleteCollection: (collection: WorkspaceCollectionNode) => void | Promise<void>;
  onRenameRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void | Promise<void>;
  onDeleteRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void | Promise<void>;
  onExportRequest: (request: WorkspaceTreeRequestLeaf) => void;
  onDeleteRequest: (request: WorkspaceTreeRequestLeaf) => void;
}

function stopEvent(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
}

function findSelectionPath(
  tree: WorkspaceCollectionNode[],
  selectedItemKind: WorkspaceExplorerItemKind | null,
  selectedItemId: string | null,
): string | null {
  if (!selectedItemKind || !selectedItemId) {
    return null;
  }

  for (const collection of tree) {
    if (selectedItemKind === 'collection' && collection.collectionId === selectedItemId) {
      return collection.name;
    }

    const groupPath = findRequestGroupSelectionPath(collection, selectedItemKind, selectedItemId, [collection.name]);
    if (groupPath) {
      return groupPath;
    }
  }

  return null;
}

function findRequestGroupSelectionPath(
  collection: WorkspaceCollectionNode,
  selectedItemKind: WorkspaceExplorerItemKind,
  selectedItemId: string,
  path: string[],
): string | null {
  for (const requestGroup of collection.childGroups) {
    const foundPath = walkRequestGroupSelectionPath(requestGroup, selectedItemKind, selectedItemId, path);
    if (foundPath) {
      return foundPath;
    }
  }

  return null;
}

function walkRequestGroupSelectionPath(
  requestGroup: WorkspaceRequestGroupNode,
  selectedItemKind: WorkspaceExplorerItemKind,
  selectedItemId: string,
  path: string[],
): string | null {
  const nextPath = [...path, requestGroup.name];

  if (selectedItemKind === 'request-group' && requestGroup.requestGroupId === selectedItemId) {
    return nextPath.join(' / ');
  }

  if (selectedItemKind === 'request') {
    const selectedRequest = requestGroup.requests.find((requestNode) => requestNode.request.id === selectedItemId) ?? null;
    if (selectedRequest) {
      return [...nextPath, selectedRequest.request.name].join(' / ');
    }
  }

  for (const childGroup of requestGroup.childGroups) {
    const childPath = walkRequestGroupSelectionPath(childGroup, selectedItemKind, selectedItemId, nextPath);
    if (childPath) {
      return childPath;
    }
  }

  return null;
}

function createCollectionPlacement(collection: WorkspaceCollectionNode): RequestPlacementValue {
  return {
    collectionId: collection.collectionId,
    collectionName: collection.name,
  };
}

function createRequestGroupPlacement(requestGroup: WorkspaceRequestGroupNode): RequestPlacementValue {
  return {
    collectionId: requestGroup.collectionId,
    requestGroupId: requestGroup.requestGroupId,
    requestGroupName: requestGroup.name,
  };
}

function summarizeRequestGroupTree(
  requestGroups: WorkspaceRequestGroupNode[],
): { requestGroupCount: number; requestCount: number } {
  return requestGroups.reduce(
    (summary, requestGroup) => {
      const nestedSummary = summarizeRequestGroupTree(requestGroup.childGroups);

      return {
        requestGroupCount: summary.requestGroupCount + 1 + nestedSummary.requestGroupCount,
        requestCount: summary.requestCount + requestGroup.requests.length + nestedSummary.requestCount,
      };
    },
    { requestGroupCount: 0, requestCount: 0 },
  );
}

function summarizeSingleRequestGroup(
  requestGroup: WorkspaceRequestGroupNode,
): { requestGroupCount: number; requestCount: number } {
  const nestedSummary = summarizeRequestGroupTree(requestGroup.childGroups);

  return {
    requestGroupCount: nestedSummary.requestGroupCount,
    requestCount: requestGroup.requests.length + nestedSummary.requestCount,
  };
}

function ExplorerActionButton({
  label,
  disabled = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className="workspace-button workspace-button--ghost"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function WorkspaceRequestGroupBranch({
  requestGroup,
  depth,
  selectedItemId,
  selectedItemKind,
  onSelectRequestGroup,
  onPreviewSavedRequest,
  onPinSavedRequest,
  onCreateRequest,
  onCreateRequestGroup,
  onRunRequestGroup,
  onRenameRequestGroup,
  onDeleteRequestGroup,
  onExportRequest,
  onDeleteRequest,
}: {
  requestGroup: WorkspaceRequestGroupNode;
  depth: number;
  selectedItemId: string | null;
  selectedItemKind: WorkspaceExplorerItemKind | null;
  onSelectRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void;
  onPreviewSavedRequest: (request: WorkspaceTreeRequestLeaf) => void | Promise<void>;
  onPinSavedRequest: (request: WorkspaceTreeRequestLeaf) => void | Promise<void>;
  onCreateRequest: (placement?: RequestPlacementValue) => void | Promise<void>;
  onCreateRequestGroup: (target: WorkspaceCollectionNode | WorkspaceRequestGroupNode) => void | Promise<void>;
  onRunRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void | Promise<void>;
  onRenameRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void | Promise<void>;
  onDeleteRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void | Promise<void>;
  onExportRequest: (request: WorkspaceTreeRequestLeaf) => void;
  onDeleteRequest: (request: WorkspaceTreeRequestLeaf) => void;
}) {
  const { t } = useI18n();
  const isSelected = selectedItemKind === 'request-group' && selectedItemId === requestGroup.requestGroupId;
  const requestGroupSummary = summarizeSingleRequestGroup(requestGroup);

  return (
    <li>
      <div className="workspace-tree-node workspace-tree-node--managed" data-kind="request-group" data-depth={depth}>
        <button
          type="button"
          className={isSelected ? 'workspace-request workspace-request--selected' : 'workspace-request'}
          onClick={() => onSelectRequestGroup(requestGroup)}
        >
          <span className="workspace-request__header">
            <span className="workspace-request__title">{requestGroup.name}</span>
            <span className="workspace-request__badges">
              <span className="workspace-chip">{t('workspaceRoute.explorer.tree.kindRequestGroup')}</span>
            </span>
          </span>
          <span className="workspace-request__meta workspace-request__meta--support">
            {t('workspaceRoute.explorer.tree.requestGroupCount', { count: requestGroupSummary.requestGroupCount })} · {t('workspaceRoute.explorer.tree.requestCount', { count: requestGroupSummary.requestCount })}
          </span>
        </button>
        <div className="request-work-surface__future-actions">
          <ExplorerActionButton label={t('workspaceRoute.explorer.actions.newRequest')} onClick={(event) => { stopEvent(event); void onCreateRequest(createRequestGroupPlacement(requestGroup)); }} />
          <ExplorerActionButton label={t('workspaceRoute.explorer.actions.createRequestGroupShort')} onClick={(event) => { stopEvent(event); void onCreateRequestGroup(requestGroup); }} />
          <ExplorerActionButton label={t('workspaceRoute.explorer.actions.runContainerShort')} onClick={(event) => { stopEvent(event); void onRunRequestGroup(requestGroup); }} />
          <ExplorerActionButton label={t('workspaceRoute.explorer.actions.renameRequestGroupShort')} onClick={(event) => { stopEvent(event); void onRenameRequestGroup(requestGroup); }} />
          <ExplorerActionButton
            label={t('workspaceRoute.explorer.actions.deleteRequestGroupShort')}
            disabled={requestGroup.childGroups.length > 0 || requestGroup.requests.length > 0}
            onClick={(event) => { stopEvent(event); void onDeleteRequestGroup(requestGroup); }}
          />
        </div>
      </div>
      <ul className="workspace-explorer__tree" data-depth={depth + 1}>
        {requestGroup.childGroups.map((childGroup) => (
          <WorkspaceRequestGroupBranch
            key={childGroup.id}
            requestGroup={childGroup}
            depth={depth + 1}
            selectedItemId={selectedItemId}
            selectedItemKind={selectedItemKind}
            onSelectRequestGroup={onSelectRequestGroup}
            onPreviewSavedRequest={onPreviewSavedRequest}
            onPinSavedRequest={onPinSavedRequest}
            onCreateRequest={onCreateRequest}
            onCreateRequestGroup={onCreateRequestGroup}
            onRunRequestGroup={onRunRequestGroup}
            onRenameRequestGroup={onRenameRequestGroup}
            onDeleteRequestGroup={onDeleteRequestGroup}
            onExportRequest={onExportRequest}
            onDeleteRequest={onDeleteRequest}
          />
        ))}
        {requestGroup.requests.map((requestNode) => {
          const isSelectedRequest = selectedItemKind === 'request' && selectedItemId === requestNode.request.id;

          return (
            <li key={requestNode.id}>
              <div className="workspace-tree-node" data-kind="request" data-depth={depth + 1}>
                <button
                  type="button"
                  className={isSelectedRequest ? 'workspace-request workspace-request--selected' : 'workspace-request'}
                  aria-label={t('workspaceRoute.explorer.actions.openRequest', { name: requestNode.request.name })}
                  aria-pressed={isSelectedRequest}
                  data-kind={requestNode.kind}
                  onClick={() => onPreviewSavedRequest(requestNode.request)}
                  onDoubleClick={() => onPinSavedRequest(requestNode.request)}
                >
                  <span className="workspace-request__header">
                    <span className="workspace-request__title">{requestNode.request.name}</span>
                    <span className="workspace-request__badges">
                      <span className="workspace-chip">{requestNode.request.methodLabel}</span>
                    </span>
                  </span>
                  <span className="workspace-request__path">{requestNode.request.collectionName} / {requestNode.request.requestGroupName}</span>
                  <span className="workspace-request__meta workspace-request__meta--support">{requestNode.request.summary}</span>
                </button>
                <div className="request-work-surface__future-actions">
                  <ExplorerActionButton label={t('workspaceRoute.explorer.actions.exportSingle')} onClick={(event) => { stopEvent(event); onExportRequest(requestNode.request); }} />
                  <ExplorerActionButton label={t('workspaceRoute.explorer.actions.deleteRequestShort')} onClick={(event) => { stopEvent(event); onDeleteRequest(requestNode.request); }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

export function WorkspaceExplorer({
  tree,
  selectedItemId,
  selectedItemKind,
  onSelectCollection,
  onSelectRequestGroup,
  onPreviewSavedRequest,
  onPinSavedRequest,
  onCreateRequest,
  onCreateRequestGroup,
  onRunCollection,
  onRunRequestGroup,
  onRenameCollection,
  onDeleteCollection,
  onRenameRequestGroup,
  onDeleteRequestGroup,
  onExportRequest,
  onDeleteRequest,
}: WorkspaceExplorerProps) {
  const { t } = useI18n();
  const selectionPathLabel = findSelectionPath(tree, selectedItemKind, selectedItemId);

  return (
    <div className="workspace-explorer">
      <header className="workspace-explorer__header workspace-explorer__header--stacked">
        <div className="workspace-explorer__header-copy">
          <p className="section-placeholder__eyebrow">{t('workspaceRoute.explorer.header.eyebrow')}</p>
          <h2>{t('workspaceRoute.explorer.header.title')}</h2>
          <p className="workspace-explorer__status-line">{t('workspaceRoute.explorer.header.summary')}</p>
        </div>
        <p className="workspace-explorer__selection-line">
          {selectionPathLabel
            ? t('workspaceRoute.explorer.selection.current', { path: selectionPathLabel })
            : t('workspaceRoute.explorer.selection.none')}
        </p>
      </header>
      <ul className="workspace-explorer__tree" data-depth={0}>
        {tree.map((collection) => {
          const isSelected = selectedItemKind === 'collection' && selectedItemId === collection.collectionId;
          const collectionSummary = summarizeRequestGroupTree(collection.childGroups);

          return (
            <li key={collection.id}>
              <div className="workspace-tree-node workspace-tree-node--managed" data-kind="collection">
                <button
                  type="button"
                  className={isSelected ? 'workspace-request workspace-request--selected' : 'workspace-request'}
                  onClick={() => onSelectCollection(collection)}
                >
                  <span className="workspace-request__header">
                    <span className="workspace-request__title">{collection.name}</span>
                    <span className="workspace-request__badges">
                      <span className="workspace-chip">{t('workspaceRoute.explorer.tree.kindCollection')}</span>
                    </span>
                  </span>
                  <span className="workspace-request__meta workspace-request__meta--support">
                    {t('workspaceRoute.explorer.tree.requestGroupCount', { count: collectionSummary.requestGroupCount })} · {t('workspaceRoute.explorer.tree.requestCount', { count: collectionSummary.requestCount })}
                  </span>
                </button>
                <div className="request-work-surface__future-actions">
                  <ExplorerActionButton label={t('workspaceRoute.explorer.actions.newRequest')} onClick={(event) => { stopEvent(event); void onCreateRequest(createCollectionPlacement(collection)); }} />
                  <ExplorerActionButton label={t('workspaceRoute.explorer.actions.createRequestGroupShort')} onClick={(event) => { stopEvent(event); void onCreateRequestGroup(collection); }} />
                  <ExplorerActionButton label={t('workspaceRoute.explorer.actions.runContainerShort')} onClick={(event) => { stopEvent(event); void onRunCollection(collection); }} />
                  <ExplorerActionButton label={t('workspaceRoute.explorer.actions.renameCollectionShort')} onClick={(event) => { stopEvent(event); void onRenameCollection(collection); }} />
                  <ExplorerActionButton
                    label={t('workspaceRoute.explorer.actions.deleteCollectionShort')}
                    disabled={collection.childGroups.length > 0}
                    onClick={(event) => { stopEvent(event); void onDeleteCollection(collection); }}
                  />
                </div>
              </div>
              <ul className="workspace-explorer__tree" data-depth={1}>
                {collection.childGroups.length === 0 ? (
                  <li>
                    <p className="workspace-tree-empty-note">{t('workspaceRoute.explorer.tree.noRequestGroups')}</p>
                  </li>
                ) : null}
                {collection.childGroups.map((requestGroup) => (
                  <WorkspaceRequestGroupBranch
                    key={requestGroup.id}
                    requestGroup={requestGroup}
                    depth={1}
                    selectedItemId={selectedItemId}
                    selectedItemKind={selectedItemKind}
                    onSelectRequestGroup={onSelectRequestGroup}
                    onPreviewSavedRequest={onPreviewSavedRequest}
                    onPinSavedRequest={onPinSavedRequest}
                    onCreateRequest={onCreateRequest}
                    onCreateRequestGroup={onCreateRequestGroup}
                    onRunRequestGroup={onRunRequestGroup}
                    onRenameRequestGroup={onRenameRequestGroup}
                    onDeleteRequestGroup={onDeleteRequestGroup}
                    onExportRequest={onExportRequest}
                    onDeleteRequest={onDeleteRequest}
                  />
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
