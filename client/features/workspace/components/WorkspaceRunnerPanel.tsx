import { useI18n } from '@client/app/providers/useI18n';
import type {
  WorkspaceBatchRunInput,
  WorkspaceTreeRequestLeaf,
} from '@client/features/workspace/workspace-request-tree.api';
import { IconLabel } from '@client/shared/ui/IconLabel';

export interface WorkspaceRunnerPanelContainer {
  containerType: 'collection' | 'request-group';
  containerId: string;
  containerName: string;
  requests: WorkspaceTreeRequestLeaf[];
}

export interface WorkspaceRunnerPanelEnvironmentOption {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface WorkspaceRunnerPanelProps {
  container: WorkspaceRunnerPanelContainer;
  selectedRequestIds: string[];
  executionOrder: NonNullable<WorkspaceBatchRunInput['executionOrder']>;
  environmentSelection: string;
  iterationInput: string;
  dataFilePath: string;
  continueOnError: boolean;
  environmentOptions: WorkspaceRunnerPanelEnvironmentOption[];
  inheritEnvironmentValue: string;
  noEnvironmentValue: string;
  maxIterationCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRunSelected: () => void;
  onToggleRequest: (requestId: string) => void;
  onExecutionOrderChange: (nextOrder: NonNullable<WorkspaceBatchRunInput['executionOrder']>) => void;
  onEnvironmentSelectionChange: (nextSelection: string) => void;
  onIterationInputChange: (nextValue: string) => void;
  onDataFilePathChange: (nextValue: string) => void;
  onContinueOnErrorChange: (nextValue: boolean) => void;
}

export function WorkspaceRunnerPanel({
  container,
  selectedRequestIds,
  executionOrder,
  environmentSelection,
  iterationInput,
  dataFilePath,
  continueOnError,
  environmentOptions,
  inheritEnvironmentValue,
  noEnvironmentValue,
  maxIterationCount,
  onSelectAll,
  onClearSelection,
  onRunSelected,
  onToggleRequest,
  onExecutionOrderChange,
  onEnvironmentSelectionChange,
  onIterationInputChange,
  onDataFilePathChange,
  onContinueOnErrorChange,
}: WorkspaceRunnerPanelProps) {
  const { t } = useI18n();
  const totalRequests = container.requests.length;
  const selectionSummary = t('workspaceRoute.runner.selectionSummary', {
    selected: selectedRequestIds.length,
    total: totalRequests,
  });
  const containerTypeLabel = container.containerType === 'collection'
    ? t('workspaceRoute.resultPanel.context.overview.values.collection')
    : t('workspaceRoute.resultPanel.context.overview.values.requestGroup');

  return (
    <section className="workspace-surface-card workspace-runner-panel" aria-label={t('workspaceRoute.runner.ariaLabel')}>
      <header className="workspace-panel-header workspace-runner-panel__header">
        <div className="workspace-panel-header__copy workspace-runner-panel__header-copy">
          <p className="section-placeholder__eyebrow">{containerTypeLabel}</p>
          <h3>{t('workspaceRoute.runner.title')}</h3>
          <p>
            {t('workspaceRoute.runner.description', {
              name: container.containerName,
            })}
          </p>
        </div>
        <div className="workspace-runner-panel__header-side">
          <div className="workspace-runner-panel__badge-rail request-work-surface__badges">
            <span className="workspace-chip workspace-chip--secondary">{selectionSummary}</span>
          </div>
          <button
            type="button"
            className="workspace-button"
            onClick={onRunSelected}
            disabled={selectedRequestIds.length === 0}
          >
            <IconLabel icon="run">{t('workspaceRoute.explorer.actions.runSelected')}</IconLabel>
          </button>
        </div>
      </header>

      <div className="workspace-runner-panel__body">
        <section className="workspace-surface-card workspace-surface-card--muted workspace-runner-panel__surface">
          <header className="workspace-runner-panel__surface-header">
            <div className="workspace-runner-panel__surface-copy">
              <h4>{t('workspaceRoute.runner.sections.configurationTitle')}</h4>
              <p>{t('workspaceRoute.runner.sections.configurationDescription')}</p>
            </div>
            <div className="shared-action-bar workspace-runner-panel__actions">
              <button
                type="button"
                className="workspace-button workspace-button--secondary"
                onClick={onSelectAll}
                disabled={totalRequests === 0 || selectedRequestIds.length === totalRequests}
              >
                {t('workspaceRoute.runner.actions.selectAll')}
              </button>
              <button
                type="button"
                className="workspace-button workspace-button--secondary"
                onClick={onClearSelection}
                disabled={selectedRequestIds.length === 0}
              >
                {t('workspaceRoute.runner.actions.clearSelection')}
              </button>
            </div>
          </header>

          <div className="workspace-runner-panel__grid">
            <label className="request-field request-field--compact">
              <span>{t('workspaceRoute.runner.fields.executionOrder')}</span>
              <select
                value={executionOrder}
                onChange={(event) => {
                  onExecutionOrderChange(event.currentTarget.value as NonNullable<WorkspaceBatchRunInput['executionOrder']>);
                }}
              >
                <option value="depth-first-sequential">{t('workspaceRoute.runner.options.depthFirstSequential')}</option>
              </select>
            </label>

            <label className="request-field request-field--compact">
              <span>{t('workspaceRoute.runner.fields.environment')}</span>
              <select
                value={environmentSelection}
                onChange={(event) => onEnvironmentSelectionChange(event.currentTarget.value)}
              >
                <option value={inheritEnvironmentValue}>{t('workspaceRoute.runner.options.inheritEnvironment')}</option>
                <option value={noEnvironmentValue}>{t('workspaceRoute.runner.options.noEnvironment')}</option>
                {environmentOptions.map((environment) => (
                  <option key={environment.id} value={environment.id}>
                    {environment.isDefault
                      ? `${environment.name} (${t('workspaceRoute.requestBuilder.environment.defaultBadge')})`
                      : environment.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="request-field request-field--compact">
              <span>{t('workspaceRoute.runner.fields.iterationCount')}</span>
              <input
                type="number"
                min={1}
                max={maxIterationCount}
                step={1}
                value={iterationInput}
                onChange={(event) => onIterationInputChange(event.currentTarget.value)}
              />
            </label>

            <label className="request-field request-field--wide">
              <span>{t('workspaceRoute.runner.fields.dataFilePath')}</span>
              <input
                type="text"
                value={dataFilePath}
                placeholder={t('workspaceRoute.runner.values.dataFilePathPlaceholder')}
                onChange={(event) => onDataFilePathChange(event.currentTarget.value)}
              />
            </label>
          </div>

          <label className="request-field--inline-toggle workspace-runner-panel__toggle">
            <span>{t('workspaceRoute.runner.fields.continueOnError')}</span>
            <input
              type="checkbox"
              checked={continueOnError}
              onChange={(event) => onContinueOnErrorChange(event.currentTarget.checked)}
            />
          </label>

          <p className="workspace-inline-note workspace-runner-panel__summary-note">{selectionSummary}</p>
        </section>

        <section className="workspace-surface-card workspace-surface-card--muted workspace-runner-panel__surface workspace-runner-panel__surface--selection">
          <header className="workspace-runner-panel__surface-header">
            <div className="workspace-runner-panel__surface-copy">
              <h4>{t('workspaceRoute.runner.sections.selectionTitle')}</h4>
              <p>{t('workspaceRoute.runner.sections.selectionDescription', { name: container.containerName })}</p>
            </div>
          </header>

          {container.requests.length > 0 ? (
            <ul className="workspace-runner-panel__request-list" aria-label={t('workspaceRoute.runner.requestListAriaLabel')}>
              {container.requests.map((request) => (
                <li key={`runner-request-${request.id}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedRequestIds.includes(request.id)}
                      onChange={() => onToggleRequest(request.id)}
                    />
                    <span>
                      <span className="workspace-runner-panel__request-method">{request.methodLabel}</span>
                      {request.name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="workspace-runner-panel__empty-copy">{t('workspaceRoute.runner.values.noRequests')}</p>
          )}
        </section>
      </div>
    </section>
  );
}
