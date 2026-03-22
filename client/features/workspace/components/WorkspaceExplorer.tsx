import type { WorkspaceSavedRequestSeed, WorkspaceExplorerNode } from '@client/features/workspace/data/workspace-explorer-fixtures';
import type { AuthoredResourceBundleImportPreviewResult } from '@client/features/workspace/resource-bundle.api';

type ResourceTransferTone = 'success' | 'error' | 'info';

interface WorkspaceImportPreview {
  fileName: string;
  result: AuthoredResourceBundleImportPreviewResult;
}

interface WorkspaceExplorerProps {
  tree: WorkspaceExplorerNode[];
  selectedRequestId: string | null;
  onCreateRequest: () => void;
  onOpenSavedRequest: (request: WorkspaceSavedRequestSeed) => void;
  onExportRequest: (request: WorkspaceSavedRequestSeed) => void;
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
}

interface WorkspaceExplorerNodeListProps {
  nodes: WorkspaceExplorerNode[];
  depth: number;
  selectedRequestId: string | null;
  onOpenSavedRequest: (request: WorkspaceSavedRequestSeed) => void;
  onExportRequest: (request: WorkspaceSavedRequestSeed) => void;
}

export function WorkspaceExplorer({
  tree,
  selectedRequestId,
  onCreateRequest,
  onOpenSavedRequest,
  onExportRequest,
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
}: WorkspaceExplorerProps) {
  return (
    <div className="workspace-explorer">
      <header className="workspace-explorer__header">
        <p className="section-placeholder__eyebrow">Workspace explorer</p>
        <h2>Collections</h2>
        <p>
          Persisted saved requests are the canonical explorer source. Starter fixtures only appear until the first real request definitions are stored in the resource lane.
        </p>
        <div className="workspace-explorer__role-strip" aria-label="Explorer surface role">
          <span className="workspace-chip">Authoring</span>
          <span className="workspace-chip workspace-chip--secondary">Resource lane</span>
        </div>
        <div className="workspace-explorer__header-actions">
          <button type="button" className="workspace-button" onClick={onCreateRequest}>
            New Request
          </button>
          <button
            type="button"
            className="workspace-button workspace-button--secondary"
            onClick={onExportResources}
            disabled={isExporting || isPreviewingImport || isImporting}
          >
            {isExporting ? 'Exporting resources' : 'Export Resources'}
          </button>
          <label className="workspace-button workspace-button--secondary workspace-explorer__import-label">
            <span>{isPreviewingImport ? 'Previewing import' : isImporting ? 'Importing resources' : 'Import Resources'}</span>
            <input
              aria-label="Import authored resources"
              className="workspace-explorer__file-input"
              type="file"
              accept="application/json,.json"
              disabled={isPreviewingImport || isImporting}
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
                  Preview is advisory only. Workspace changes before confirm can still change imported names or validation outcomes for {importPreview.fileName}.
                </p>
                <div className="workspace-explorer__preview-actions">
                  <button
                    type="button"
                    className="workspace-button"
                    onClick={onConfirmImportPreview}
                    disabled={isImporting || importPreview.result.summary.acceptedCount === 0}
                  >
                    {isImporting ? 'Importing resources' : 'Confirm Import'}
                  </button>
                  <button
                    type="button"
                    className="workspace-button workspace-button--secondary"
                    onClick={onCancelImportPreview}
                    disabled={isImporting}
                  >
                    Cancel Preview
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </header>
      <WorkspaceExplorerNodeList
        nodes={tree}
        depth={0}
        selectedRequestId={selectedRequestId}
        onOpenSavedRequest={onOpenSavedRequest}
        onExportRequest={onExportRequest}
      />
    </div>
  );
}

function WorkspaceExplorerNodeList({
  nodes,
  depth,
  selectedRequestId,
  onOpenSavedRequest,
  onExportRequest,
}: WorkspaceExplorerNodeListProps) {
  return (
    <ul className="workspace-explorer__tree" data-depth={depth}>
      {nodes.map((node) => {
        if (node.kind === 'request') {
          const isSelected = selectedRequestId === node.request.id;

          return (
            <li key={node.id}>
              <div className="workspace-request-row">
                <button
                  type="button"
                  className={isSelected ? 'workspace-request workspace-request--selected' : 'workspace-request'}
                  aria-label={`Open ${node.request.name}`}
                  aria-pressed={isSelected}
                  data-kind={node.kind}
                  data-resource-kind={node.request.resourceKind}
                  onClick={() => onOpenSavedRequest(node.request)}
                >
                  <span className="workspace-request__header">
                    <span className="workspace-request__title">{node.request.name}</span>
                    <span className="workspace-request__badges">
                      <span className="workspace-chip">{node.request.methodLabel}</span>
                      <span
                        className={
                          node.request.resourceKind === 'persisted'
                            ? 'workspace-chip workspace-chip--secondary'
                            : 'workspace-chip workspace-chip--accent'
                        }
                      >
                        {node.request.resourceKind === 'persisted' ? 'Saved' : 'Starter'}
                      </span>
                    </span>
                  </span>
                  <span className="workspace-request__meta">
                    {node.request.summary}
                  </span>
                </button>
                {node.request.resourceKind === 'persisted' ? (
                  <button
                    type="button"
                    className="workspace-button workspace-button--ghost workspace-request-row__export"
                    aria-label={`Export ${node.request.name}`}
                    onClick={() => onExportRequest(node.request)}
                  >
                    Export
                  </button>
                ) : null}
              </div>
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
              onExportRequest={onExportRequest}
            />
          </li>
        );
      })}
    </ul>
  );
}

