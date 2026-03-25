import {
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import type {
  WorkspaceCollectionNode,
  WorkspaceRequestGroupNode,
  WorkspaceTreeRequestLeaf,
} from '@client/features/workspace/workspace-request-tree.api';
import { useWorkspaceExplorerStore } from '@client/features/workspace/state/workspace-explorer-store';
import type { WorkspaceExplorerItemKind } from '@client/features/workspace/state/workspace-shell-store';

interface WorkspaceExplorerProps {
  tree: WorkspaceCollectionNode[];
  selectedItemId: string | null;
  selectedItemKind: WorkspaceExplorerItemKind | null;
  onSelectCollection: (collection: WorkspaceCollectionNode) => void;
  onSelectRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void;
  onPreviewSavedRequest: (request: WorkspaceTreeRequestLeaf) => void | Promise<void>;
  onPinSavedRequest: (request: WorkspaceTreeRequestLeaf) => void | Promise<void>;
  onDeleteCollection: (collection: WorkspaceCollectionNode) => void | Promise<void>;
  onDeleteRequestGroup: (requestGroup: WorkspaceRequestGroupNode) => void | Promise<void>;
  onDeleteRequest: (request: WorkspaceTreeRequestLeaf) => void | Promise<void>;
}

interface TreeItemKeyboardMeta {
  treeItemIndex: number;
  nodeId: string;
  level: number;
  expandable: boolean;
  expanded: boolean;
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

function createCollectionNodeId(collectionId: string) {
  return `collection:${collectionId}`;
}

function createRequestGroupNodeId(requestGroupId: string) {
  return `request-group:${requestGroupId}`;
}

function createRequestNodeId(requestId: string) {
  return `request:${requestId}`;
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function includesSearchText(value: string | undefined | null, searchText: string) {
  if (searchText.length === 0) {
    return true;
  }

  return String(value || '').toLowerCase().includes(searchText);
}

function filterRequestGroups(
  requestGroups: WorkspaceRequestGroupNode[],
  searchText: string,
): WorkspaceRequestGroupNode[] {
  if (searchText.length === 0) {
    return requestGroups;
  }

  return requestGroups.flatMap((requestGroup) => {
    const filteredChildGroups = filterRequestGroups(requestGroup.childGroups, searchText);
    const filteredRequests = requestGroup.requests.filter((requestNode) => (
      includesSearchText(requestNode.request.name, searchText)
      || includesSearchText(requestNode.request.summary, searchText)
      || includesSearchText(requestNode.request.methodLabel, searchText)
      || includesSearchText(requestNode.request.requestGroupName, searchText)
      || includesSearchText(requestNode.request.collectionName, searchText)
    ));
    const requestGroupMatches = includesSearchText(requestGroup.name, searchText)
      || includesSearchText(requestGroup.description, searchText);

    if (!requestGroupMatches && filteredChildGroups.length === 0 && filteredRequests.length === 0) {
      return [];
    }

    return [{
      ...requestGroup,
      childGroups: filteredChildGroups,
      requests: filteredRequests,
    }];
  });
}

function filterCollections(
  tree: WorkspaceCollectionNode[],
  searchText: string,
): WorkspaceCollectionNode[] {
  if (searchText.length === 0) {
    return tree;
  }

  return tree.flatMap((collection) => {
    const filteredChildGroups = filterRequestGroups(collection.childGroups, searchText);
    const collectionMatches = includesSearchText(collection.name, searchText)
      || includesSearchText(collection.description, searchText);

    if (!collectionMatches && filteredChildGroups.length === 0) {
      return [];
    }

    return [{
      ...collection,
      childGroups: filteredChildGroups,
    }];
  });
}

function readTreeItemElements(treeRoot: HTMLUListElement | null) {
  return Array.from(treeRoot?.querySelectorAll<HTMLButtonElement>('[role="treeitem"]') ?? []);
}

function readTreeLevel(treeItem: HTMLButtonElement | undefined) {
  const parsedLevel = Number(treeItem?.dataset.level ?? '1');

  return Number.isFinite(parsedLevel) ? parsedLevel : 1;
}

function ExplorerDeleteButton({
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
      className="workspace-tree-node__delete"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <svg
        className="workspace-tree-node__delete-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Zm-1 10h12l1-13H5l1 13Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}

function ExplorerToggleButton({
  isExpanded,
  label,
  onClick,
}: {
  isExpanded: boolean;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className="workspace-tree-node__toggle"
      aria-label={label}
      aria-pressed={isExpanded}
      onClick={onClick}
    >
      <span aria-hidden="true">{isExpanded ? '▾' : '▸'}</span>
    </button>
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
  onDeleteCollection,
  onDeleteRequestGroup,
  onDeleteRequest,
}: WorkspaceExplorerProps) {
  const { t } = useI18n();
  const searchQuery = useWorkspaceExplorerStore((state) => state.searchQuery);
  const focusedItemIndex = useWorkspaceExplorerStore((state) => state.focusedItemIndex);
  const collapsedNodeIds = useWorkspaceExplorerStore((state) => state.collapsedNodeIds);
  const setSearchQuery = useWorkspaceExplorerStore((state) => state.setSearchQuery);
  const setFocusedItemIndex = useWorkspaceExplorerStore((state) => state.setFocusedItemIndex);
  const setNodeCollapsed = useWorkspaceExplorerStore((state) => state.setNodeCollapsed);
  const treeRootRef = useRef<HTMLUListElement | null>(null);

  const selectionPathLabel = findSelectionPath(tree, selectedItemKind, selectedItemId);
  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const filteredTree = useMemo(
    () => filterCollections(tree, normalizedSearchQuery),
    [tree, normalizedSearchQuery],
  );
  const isSearchActive = normalizedSearchQuery.length > 0;
  const collapsedNodeIdSet = useMemo(() => new Set(collapsedNodeIds), [collapsedNodeIds]);
  const collapsedNodeIdsKey = collapsedNodeIds.join('|');

  useEffect(() => {
    const treeItems = readTreeItemElements(treeRootRef.current);

    if (treeItems.length === 0) {
      return;
    }

    const boundedFocusedItemIndex = Math.min(focusedItemIndex, treeItems.length - 1);

    if (boundedFocusedItemIndex !== focusedItemIndex) {
      setFocusedItemIndex(boundedFocusedItemIndex);
    }
  }, [collapsedNodeIdsKey, filteredTree, focusedItemIndex, setFocusedItemIndex]);

  const focusTreeItemAtIndex = (nextIndex: number) => {
    const treeItems = readTreeItemElements(treeRootRef.current);

    if (treeItems.length === 0) {
      return;
    }

    const boundedIndex = Math.max(0, Math.min(nextIndex, treeItems.length - 1));
    setFocusedItemIndex(boundedIndex);
    treeItems[boundedIndex]?.focus();
  };

  const findParentTreeItemIndex = (treeItemIndex: number) => {
    const treeItems = readTreeItemElements(treeRootRef.current);

    if (treeItemIndex <= 0 || treeItemIndex >= treeItems.length) {
      return null;
    }

    const currentLevel = readTreeLevel(treeItems[treeItemIndex]);

    for (let index = treeItemIndex - 1; index >= 0; index -= 1) {
      const candidateLevel = readTreeLevel(treeItems[index]);

      if (candidateLevel < currentLevel) {
        return index;
      }
    }

    return null;
  };

  const findFirstChildTreeItemIndex = (treeItemIndex: number) => {
    const treeItems = readTreeItemElements(treeRootRef.current);

    if (treeItemIndex < 0 || treeItemIndex >= treeItems.length - 1) {
      return null;
    }

    const currentLevel = readTreeLevel(treeItems[treeItemIndex]);

    for (let index = treeItemIndex + 1; index < treeItems.length; index += 1) {
      const candidateLevel = readTreeLevel(treeItems[index]);

      if (candidateLevel === currentLevel + 1) {
        return index;
      }

      if (candidateLevel <= currentLevel) {
        break;
      }
    }

    return null;
  };

  const handleTreeItemKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    meta: TreeItemKeyboardMeta,
  ) => {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        focusTreeItemAtIndex(meta.treeItemIndex + 1);
        return;
      }
      case 'ArrowUp': {
        event.preventDefault();
        focusTreeItemAtIndex(meta.treeItemIndex - 1);
        return;
      }
      case 'Home': {
        event.preventDefault();
        focusTreeItemAtIndex(0);
        return;
      }
      case 'End': {
        event.preventDefault();
        focusTreeItemAtIndex(Number.MAX_SAFE_INTEGER);
        return;
      }
      case 'ArrowRight': {
        event.preventDefault();

        if (meta.expandable && !meta.expanded) {
          setNodeCollapsed(meta.nodeId, false);
          return;
        }

        const childIndex = findFirstChildTreeItemIndex(meta.treeItemIndex);

        if (childIndex !== null) {
          focusTreeItemAtIndex(childIndex);
        }
        return;
      }
      case 'ArrowLeft': {
        event.preventDefault();

        if (meta.expandable && meta.expanded) {
          setNodeCollapsed(meta.nodeId, true);
          return;
        }

        const parentIndex = findParentTreeItemIndex(meta.treeItemIndex);

        if (parentIndex !== null) {
          focusTreeItemAtIndex(parentIndex);
        }
        return;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        event.currentTarget.click();
        return;
      }
      default:
        return;
    }
  };

  let visibleTreeItemSequence = 0;

  const renderRequestGroupBranch = (requestGroup: WorkspaceRequestGroupNode, depth: number) => {
    const nodeId = createRequestGroupNodeId(requestGroup.requestGroupId);
    const hasChildren = requestGroup.childGroups.length > 0 || requestGroup.requests.length > 0;
    const isExpanded = isSearchActive ? true : !collapsedNodeIdSet.has(nodeId);
    const isSelected = selectedItemKind === 'request-group' && selectedItemId === requestGroup.requestGroupId;
    const requestGroupSummary = summarizeSingleRequestGroup(requestGroup);
    const treeItemIndex = visibleTreeItemSequence++;
    const treeLevel = depth + 1;

    return (
      <li key={requestGroup.id} role="none">
        <div className="workspace-tree-node workspace-tree-node--managed" data-kind="request-group" data-depth={depth}>
          {hasChildren ? (
            <ExplorerToggleButton
              isExpanded={isExpanded}
              label={isExpanded
                ? t('workspaceRoute.explorer.actions.collapseNode', { name: requestGroup.name })
                : t('workspaceRoute.explorer.actions.expandNode', { name: requestGroup.name })}
              onClick={(event) => {
                stopEvent(event);
                setNodeCollapsed(nodeId, isExpanded);
              }}
            />
          ) : (
            <span className="workspace-tree-node__toggle-placeholder" aria-hidden="true" />
          )}
          <div className="workspace-tree-node__item-shell">
            <button
              type="button"
              role="treeitem"
              className={isSelected
                ? 'workspace-request workspace-request--compact workspace-request--selected'
                : 'workspace-request workspace-request--compact'}
              aria-level={treeLevel}
              aria-selected={isSelected}
              aria-expanded={hasChildren ? isExpanded : undefined}
              tabIndex={treeItemIndex === focusedItemIndex ? 0 : -1}
              data-level={treeLevel}
              data-node-id={nodeId}
              onFocus={() => setFocusedItemIndex(treeItemIndex)}
              onKeyDown={(event) => handleTreeItemKeyDown(event, {
                treeItemIndex,
                nodeId,
                level: treeLevel,
                expandable: hasChildren,
                expanded: isExpanded,
              })}
              onClick={() => onSelectRequestGroup(requestGroup)}
            >
              <span className="workspace-request__title">{requestGroup.name}</span>
              <span className="workspace-request__meta workspace-request__meta--support">
                {t('workspaceRoute.explorer.tree.requestCount', { count: requestGroupSummary.requestCount })}
              </span>
            </button>
            <ExplorerDeleteButton
              label={t('workspaceRoute.explorer.actions.deleteRequestGroupShort')}
              disabled={requestGroup.childGroups.length > 0 || requestGroup.requests.length > 0}
              onClick={(event) => { stopEvent(event); void onDeleteRequestGroup(requestGroup); }}
            />
          </div>
        </div>
        {isExpanded ? (
          <ul className="workspace-explorer__tree" data-depth={depth + 1} role="group">
            {requestGroup.childGroups.map((childGroup) => renderRequestGroupBranch(childGroup, depth + 1))}
            {requestGroup.requests.map((requestNode) => {
              const requestNodeId = createRequestNodeId(requestNode.request.id);
              const isSelectedRequest = selectedItemKind === 'request' && selectedItemId === requestNode.request.id;
              const requestTreeItemIndex = visibleTreeItemSequence++;
              const requestTreeLevel = depth + 2;

              return (
                <li key={requestNode.id} role="none">
                  <div className="workspace-tree-node" data-kind="request" data-depth={depth + 1}>
                    <span className="workspace-tree-node__toggle-placeholder" aria-hidden="true" />
                    <div className="workspace-tree-node__item-shell">
                      <button
                        type="button"
                        role="treeitem"
                        className={isSelectedRequest
                          ? 'workspace-request workspace-request--compact workspace-request--selected'
                          : 'workspace-request workspace-request--compact'}
                        aria-label={t('workspaceRoute.explorer.actions.openRequest', { name: requestNode.request.name })}
                        aria-level={requestTreeLevel}
                        aria-selected={isSelectedRequest}
                        tabIndex={requestTreeItemIndex === focusedItemIndex ? 0 : -1}
                        data-level={requestTreeLevel}
                        data-node-id={requestNodeId}
                        data-kind={requestNode.kind}
                        onFocus={() => setFocusedItemIndex(requestTreeItemIndex)}
                        onKeyDown={(event) => handleTreeItemKeyDown(event, {
                          treeItemIndex: requestTreeItemIndex,
                          nodeId: requestNodeId,
                          level: requestTreeLevel,
                          expandable: false,
                          expanded: false,
                        })}
                        onClick={() => onPreviewSavedRequest(requestNode.request)}
                        onDoubleClick={() => onPinSavedRequest(requestNode.request)}
                      >
                        <span className="workspace-request__title">
                          <span className="workspace-request__method">{requestNode.request.methodLabel}</span>
                          <span className="workspace-request__name">{requestNode.request.name}</span>
                        </span>
                      </button>
                      <ExplorerDeleteButton
                        label={t('workspaceRoute.explorer.actions.deleteRequestShort')}
                        onClick={(event) => { stopEvent(event); void onDeleteRequest(requestNode.request); }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <div className="workspace-explorer">
      <header className="workspace-explorer__header workspace-explorer__header--stacked">
        <div className="workspace-explorer__header-copy">
          <p className="section-placeholder__eyebrow">{t('workspaceRoute.explorer.header.eyebrow')}</p>
          <h2>{t('workspaceRoute.explorer.header.title')}</h2>
          <p className="workspace-explorer__status-line">{t('workspaceRoute.explorer.header.summary')}</p>
        </div>
        <label className="request-field workspace-explorer__search-field">
          <span>{t('workspaceRoute.explorer.search.label')}</span>
          <input
            type="search"
            aria-label={t('workspaceRoute.explorer.search.label')}
            value={searchQuery}
            placeholder={t('workspaceRoute.explorer.search.placeholder')}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </label>
        <p className="workspace-explorer__selection-line">
          {selectionPathLabel
            ? t('workspaceRoute.explorer.selection.current', { path: selectionPathLabel })
            : t('workspaceRoute.explorer.selection.none')}
        </p>
      </header>
      <ul
        ref={treeRootRef}
        className="workspace-explorer__tree"
        data-depth={0}
        role="tree"
        aria-label={t('workspaceRoute.explorer.a11y.treeLabel')}
      >
        {filteredTree.length === 0 ? (
          <li role="none">
            <p className="workspace-tree-empty-note">{t('workspaceRoute.explorer.search.empty')}</p>
          </li>
        ) : null}
        {filteredTree.map((collection) => {
          const nodeId = createCollectionNodeId(collection.collectionId);
          const hasChildren = collection.childGroups.length > 0;
          const isExpanded = isSearchActive ? true : !collapsedNodeIdSet.has(nodeId);
          const isSelected = selectedItemKind === 'collection' && selectedItemId === collection.collectionId;
          const collectionSummary = summarizeRequestGroupTree(collection.childGroups);
          const treeItemIndex = visibleTreeItemSequence++;

          return (
            <li key={collection.id} role="none">
              <div className="workspace-tree-node workspace-tree-node--managed" data-kind="collection">
                {hasChildren ? (
                  <ExplorerToggleButton
                    isExpanded={isExpanded}
                    label={isExpanded
                      ? t('workspaceRoute.explorer.actions.collapseNode', { name: collection.name })
                      : t('workspaceRoute.explorer.actions.expandNode', { name: collection.name })}
                    onClick={(event) => {
                      stopEvent(event);
                      setNodeCollapsed(nodeId, isExpanded);
                    }}
                  />
                ) : (
                  <span className="workspace-tree-node__toggle-placeholder" aria-hidden="true" />
                )}
                <div className="workspace-tree-node__item-shell">
                  <button
                    type="button"
                    role="treeitem"
                    className={isSelected
                      ? 'workspace-request workspace-request--compact workspace-request--selected'
                      : 'workspace-request workspace-request--compact'}
                    aria-level={1}
                    aria-selected={isSelected}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    tabIndex={treeItemIndex === focusedItemIndex ? 0 : -1}
                    data-level={1}
                    data-node-id={nodeId}
                    onFocus={() => setFocusedItemIndex(treeItemIndex)}
                    onKeyDown={(event) => handleTreeItemKeyDown(event, {
                      treeItemIndex,
                      nodeId,
                      level: 1,
                      expandable: hasChildren,
                      expanded: isExpanded,
                    })}
                    onClick={() => onSelectCollection(collection)}
                  >
                    <span className="workspace-request__title">{collection.name}</span>
                    <span className="workspace-request__meta workspace-request__meta--support">
                      {t('workspaceRoute.explorer.tree.requestGroupCount', { count: collectionSummary.requestGroupCount })} · {t('workspaceRoute.explorer.tree.requestCount', { count: collectionSummary.requestCount })}
                    </span>
                  </button>
                  <ExplorerDeleteButton
                    label={t('workspaceRoute.explorer.actions.deleteCollectionShort')}
                    disabled={collection.childGroups.length > 0}
                    onClick={(event) => { stopEvent(event); void onDeleteCollection(collection); }}
                  />
                </div>
              </div>
              {isExpanded ? (
                <ul className="workspace-explorer__tree" data-depth={1} role="group">
                  {collection.childGroups.length === 0 ? (
                    <li role="none">
                      <p className="workspace-tree-empty-note">{t('workspaceRoute.explorer.tree.noRequestGroups')}</p>
                    </li>
                  ) : null}
                  {collection.childGroups.map((requestGroup) => renderRequestGroupBranch(requestGroup, 1))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

