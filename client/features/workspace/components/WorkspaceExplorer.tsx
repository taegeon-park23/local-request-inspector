import type { WorkspaceCollectionNode, WorkspaceTreeRequestLeaf } from '@client/features/workspace/workspace-request-tree.api';
import { useI18n } from '@client/app/providers/useI18n';

interface WorkspaceExplorerProps {
  tree: WorkspaceCollectionNode[];
  selectedRequestId: string | null;
  onOpenSavedRequest: (request: WorkspaceTreeRequestLeaf) => void | Promise<void>;
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

function WorkspaceCollectionSummary({ collection }: { collection: WorkspaceCollectionNode }) {
  const { t } = useI18n();

  return (
    <div className="workspace-tree-node workspace-tree-node--managed" data-kind="collection">
      <div className="workspace-tree-node__copy">
        <div className="workspace-tree-node__title-row">
          <span className="workspace-tree-node__kind">{t('workspaceRoute.explorer.tree.kindCollection')}</span>
          <span className="workspace-tree-node__label">{collection.name}</span>
        </div>
        <p className="workspace-tree-node__meta">
          {t('workspaceRoute.explorer.tree.requestGroupCount', { count: collection.children.length })}
        </p>
      </div>
    </div>
  );
}

function WorkspaceRequestGroupSummary({ requestGroup }: { requestGroup: WorkspaceCollectionNode['children'][number] }) {
  const { t } = useI18n();

  return (
    <div className="workspace-tree-node workspace-tree-node--managed" data-kind="request-group">
      <div className="workspace-tree-node__copy">
        <div className="workspace-tree-node__title-row">
          <span className="workspace-tree-node__kind">{t('workspaceRoute.explorer.tree.kindRequestGroup')}</span>
          <span className="workspace-tree-node__label">{requestGroup.name}</span>
        </div>
        <p className="workspace-tree-node__meta">
          {t('workspaceRoute.explorer.tree.requestCount', { count: requestGroup.children.length })}
        </p>
      </div>
    </div>
  );
}

export function WorkspaceExplorer({
  tree,
  selectedRequestId,
  onOpenSavedRequest,
}: WorkspaceExplorerProps) {
  const { t } = useI18n();
  const selectionPathLabel = getSelectionPathLabel(tree, selectedRequestId);

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
      <p className="shared-readiness-note workspace-explorer__boundary-note">
        {t('workspaceRoute.explorer.notes.navigationOnly')}
      </p>
      <ul className="workspace-explorer__tree" data-depth={0}>
        {tree.map((collection) => (
          <li key={collection.id}>
            <WorkspaceCollectionSummary collection={collection} />
            <ul className="workspace-explorer__tree" data-depth={1}>
              {collection.children.length === 0 ? (
                <li>
                  <p className="workspace-tree-empty-note">{t('workspaceRoute.explorer.tree.noRequestGroups')}</p>
                </li>
              ) : null}
              {collection.children.map((requestGroup) => (
                <li key={requestGroup.id}>
                  <WorkspaceRequestGroupSummary requestGroup={requestGroup} />
                  <ul className="workspace-explorer__tree" data-depth={2}>
                    {requestGroup.children.map((requestNode) => {
                      const isSelected = selectedRequestId === requestNode.request.id;

                      return (
                        <li key={requestNode.id}>
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
    </div>
  );
}
