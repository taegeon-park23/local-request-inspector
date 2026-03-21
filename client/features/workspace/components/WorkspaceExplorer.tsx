import type { WorkspaceSavedRequestSeed, WorkspaceExplorerNode } from '@client/features/workspace/data/workspace-explorer-fixtures';

type ResourceTransferTone = 'success' | 'error' | 'info';

interface WorkspaceExplorerProps {
  tree: WorkspaceExplorerNode[];
  selectedRequestId: string | null;
  onCreateRequest: () => void;
  onOpenSavedRequest: (request: WorkspaceSavedRequestSeed) => void;
  onExportResources: () => void;
  onImportResources: (file: File) => void;
  transferStatusMessage: string | null;
  transferStatusTone?: ResourceTransferTone | undefined;
  isExporting: boolean;
  isImporting: boolean;
}

interface WorkspaceExplorerNodeListProps {
  nodes: WorkspaceExplorerNode[];
  depth: number;
  selectedRequestId: string | null;
  onOpenSavedRequest: (request: WorkspaceSavedRequestSeed) => void;
}

export function WorkspaceExplorer({
  tree,
  selectedRequestId,
  onCreateRequest,
  onOpenSavedRequest,
  onExportResources,
  onImportResources,
  transferStatusMessage,
  transferStatusTone = 'info',
  isExporting,
  isImporting,
}: WorkspaceExplorerProps) {
  return (
    <div className="workspace-explorer">
      <header className="workspace-explorer__header">
        <p className="section-placeholder__eyebrow">Workspace explorer</p>
        <h2>Collections</h2>
        <p>
          Persisted saved requests are the canonical explorer source. Starter fixtures only appear until the first real request definitions are stored in the resource lane.
        </p>
        <div className="workspace-explorer__header-actions">
          <button type="button" className="workspace-button" onClick={onCreateRequest}>
            New Request
          </button>
          <button
            type="button"
            className="workspace-button workspace-button--secondary"
            onClick={onExportResources}
            disabled={isExporting || isImporting}
          >
            {isExporting ? 'Exporting resources' : 'Export Resources'}
          </button>
          <label className="workspace-button workspace-button--secondary workspace-explorer__import-label">
            <span>{isImporting ? 'Importing resources' : 'Import Resources'}</span>
            <input
              aria-label="Import authored resources"
              className="workspace-explorer__file-input"
              type="file"
              accept="application/json,.json"
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
        <p className="shared-readiness-note">
          Export and import stay limited to authored request definitions and mock rules. Runtime history, captures, and execution artifacts remain outside this bundle.
        </p>
        {transferStatusMessage ? (
          <p
            className={`workspace-explorer__status workspace-explorer__status--${transferStatusTone}`}
            role={transferStatusTone === 'error' ? 'alert' : 'status'}
          >
            {transferStatusMessage}
          </p>
        ) : null}
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

