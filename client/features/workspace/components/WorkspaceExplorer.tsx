import type { SavedWorkspaceRequestSeed } from '@client/features/request-builder/request-tab.types';
import type { WorkspaceExplorerNode } from '@client/features/workspace/data/workspace-explorer-fixtures';

interface WorkspaceExplorerProps {
  tree: WorkspaceExplorerNode[];
  selectedRequestId: string | null;
  onCreateRequest: () => void;
  onOpenSavedRequest: (request: SavedWorkspaceRequestSeed) => void;
}

interface WorkspaceExplorerNodeListProps {
  nodes: WorkspaceExplorerNode[];
  depth: number;
  selectedRequestId: string | null;
  onOpenSavedRequest: (request: SavedWorkspaceRequestSeed) => void;
}

export function WorkspaceExplorer({
  tree,
  selectedRequestId,
  onCreateRequest,
  onOpenSavedRequest,
}: WorkspaceExplorerProps) {
  return (
    <div className="workspace-explorer">
      <header className="workspace-explorer__header">
        <p className="section-placeholder__eyebrow">Workspace explorer</p>
        <h2>Collections</h2>
        <p>
          Static in-memory tree for S2. Collection, folder, and saved request nodes stay local
          until persistence and request builder flows land later.
        </p>
        <button type="button" className="workspace-button" onClick={onCreateRequest}>
          New Request
        </button>
      </header>
      <WorkspaceExplorerNodeList
        nodes={tree}
        depth={0}
        selectedRequestId={selectedRequestId}
        onOpenSavedRequest={onOpenSavedRequest}
      />
    </div>
  );
}

function WorkspaceExplorerNodeList({
  nodes,
  depth,
  selectedRequestId,
  onOpenSavedRequest,
}: WorkspaceExplorerNodeListProps) {
  return (
    <ul className="workspace-explorer__tree" data-depth={depth}>
      {nodes.map((node) => {
        if (node.kind === 'request') {
          const isSelected = selectedRequestId === node.request.id;

          return (
            <li key={node.id}>
              <button
                type="button"
                className={isSelected ? 'workspace-request workspace-request--selected' : 'workspace-request'}
                aria-label={`Open ${node.request.name}`}
                aria-pressed={isSelected}
                data-kind={node.kind}
                onClick={() => onOpenSavedRequest(node.request)}
              >
                <span className="workspace-request__title">{node.request.name}</span>
                <span className="workspace-request__meta">
                  {node.request.methodLabel} | {node.request.summary}
                </span>
              </button>
            </li>
          );
        }

        return (
          <li key={node.id}>
            <div className="workspace-tree-node" data-kind={node.kind}>
              <span className="workspace-tree-node__kind">{node.kind}</span>
              <span className="workspace-tree-node__label">{node.name}</span>
            </div>
            <WorkspaceExplorerNodeList
              nodes={node.children}
              depth={depth + 1}
              selectedRequestId={selectedRequestId}
              onOpenSavedRequest={onOpenSavedRequest}
            />
          </li>
        );
      })}
    </ul>
  );
}
