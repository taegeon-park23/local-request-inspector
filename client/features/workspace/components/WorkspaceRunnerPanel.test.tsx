import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  WorkspaceRunnerPanel,
  type WorkspaceRunnerPanelContainer,
} from '@client/features/workspace/components/WorkspaceRunnerPanel';
import { renderApp } from '@client/shared/test/render-app';

function createContainer(): WorkspaceRunnerPanelContainer {
  return {
    containerType: 'request-group',
    containerId: 'request-group-auth',
    containerName: 'Auth',
    requests: [
      {
        id: 'request-login',
        name: 'Login',
        methodLabel: 'POST',
        summary: 'POST /sessions',
        collectionId: 'collection-saved-requests',
        collectionName: 'Saved Requests',
        requestGroupId: 'request-group-auth',
        requestGroupName: 'Auth',
      },
      {
        id: 'request-refresh',
        name: 'Refresh token',
        methodLabel: 'POST',
        summary: 'POST /sessions/refresh',
        collectionId: 'collection-saved-requests',
        collectionName: 'Saved Requests',
        requestGroupId: 'request-group-auth',
        requestGroupName: 'Auth',
      },
    ],
  };
}

function renderRunnerPanel(overrides: Partial<Parameters<typeof WorkspaceRunnerPanel>[0]> = {}) {
  const props: Parameters<typeof WorkspaceRunnerPanel>[0] = {
    container: createContainer(),
    selectedRequestIds: ['request-login'],
    executionOrder: 'depth-first-sequential',
    environmentSelection: '__inherit__',
    iterationInput: '1',
    dataFilePath: '',
    continueOnError: true,
    environmentOptions: [
      { id: 'environment-local', name: 'Local API', isDefault: true },
    ],
    inheritEnvironmentValue: '__inherit__',
    noEnvironmentValue: '__none__',
    maxIterationCount: 25,
    onSelectAll: vi.fn(),
    onClearSelection: vi.fn(),
    onRunSelected: vi.fn(),
    onToggleRequest: vi.fn(),
    onExecutionOrderChange: vi.fn(),
    onEnvironmentSelectionChange: vi.fn(),
    onIterationInputChange: vi.fn(),
    onDataFilePathChange: vi.fn(),
    onContinueOnErrorChange: vi.fn(),
    ...overrides,
  };

  renderApp(<WorkspaceRunnerPanel {...props} />);
  return props;
}

describe('WorkspaceRunnerPanel', () => {
  it('renders a contextual run surface with dedicated configuration and selection subsections', () => {
    renderRunnerPanel();

    expect(screen.getByRole('heading', { name: 'Runner' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Run configuration' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Requests in scope' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Selected' })).toBeEnabled();
    expect(screen.getByText('Request selection: 1 / 2')).toBeInTheDocument();
  });

  it('routes selection and run actions through the contextual runner controls', async () => {
    const user = userEvent.setup();
    const onSelectAll = vi.fn();
    const onClearSelection = vi.fn();
    const onRunSelected = vi.fn();
    const onToggleRequest = vi.fn();

    renderRunnerPanel({
      onSelectAll,
      onClearSelection,
      onRunSelected,
      onToggleRequest,
    });

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    await user.click(screen.getByRole('button', { name: 'Run Selected' }));
    await user.click(screen.getByRole('checkbox', { name: /Refresh token/i }));

    expect(onSelectAll).toHaveBeenCalledTimes(1);
    expect(onClearSelection).toHaveBeenCalledTimes(1);
    expect(onRunSelected).toHaveBeenCalledTimes(1);
    expect(onToggleRequest).toHaveBeenCalledWith('request-refresh');
  });
});
