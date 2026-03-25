import type { ComponentProps } from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceResourceManagerPanel } from '@client/features/workspace/components/WorkspaceResourceManagerPanel';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import type {
  WorkspaceCollectionNode,
  WorkspaceRequestGroupNode,
} from '@client/features/workspace/workspace-request-tree.api';
import { renderApp } from '@client/shared/test/render-app';

function createRequestGroupNode(
  overrides: Partial<WorkspaceRequestGroupNode> & Pick<WorkspaceRequestGroupNode, 'id' | 'requestGroupId' | 'name' | 'collectionId'>,
): WorkspaceRequestGroupNode {
  return {
    kind: 'request-group',
    parentRequestGroupId: overrides.parentRequestGroupId ?? null,
    childGroups: overrides.childGroups ?? [],
    requests: overrides.requests ?? [],
    ...overrides,
    ...(overrides.description ? { description: overrides.description } : {}),
  };
}

function createTree(): WorkspaceCollectionNode[] {
  const loginGroup = createRequestGroupNode({
    id: 'request-group-node-login',
    collectionId: 'collection-saved-requests',
    requestGroupId: 'request-group-login',
    parentRequestGroupId: 'request-group-auth',
    name: 'Login',
  });
  const authGroup = createRequestGroupNode({
    id: 'request-group-node-auth',
    collectionId: 'collection-saved-requests',
    requestGroupId: 'request-group-auth',
    name: 'Auth',
    childGroups: [loginGroup],
  });

  return [{
    id: 'collection-node-saved-requests',
    kind: 'collection',
    collectionId: 'collection-saved-requests',
    name: 'Saved Requests',
    description: '',
    childGroups: [authGroup],
  }];
}

function createActiveTab(): RequestTabRecord {
  return {
    id: 'tab-login',
    sourceKey: 'saved-request-create-session',
    title: 'Create session',
    methodLabel: 'POST',
    source: 'saved',
    tabMode: 'pinned',
    summary: 'POST /sessions',
    requestId: 'request-create-session',
    collectionId: 'collection-saved-requests',
    collectionName: 'Saved Requests',
    requestGroupId: 'request-group-login',
    requestGroupName: 'Login',
    hasUnsavedChanges: false,
  };
}

function createProps(
  overrides: Partial<ComponentProps<typeof WorkspaceResourceManagerPanel>> = {},
): ComponentProps<typeof WorkspaceResourceManagerPanel> {
  return {
    tree: createTree(),
    activeTab: null,
    activeDraft: null,
    activeSavedRequest: null,
    onCreateCollection: vi.fn(),
    onRenameCollection: vi.fn(),
    onDeleteCollection: vi.fn(),
    onCreateRequestGroup: vi.fn(),
    onRenameRequestGroup: vi.fn(),
    onDeleteRequestGroup: vi.fn(),
    onExportRequest: vi.fn(),
    onDeleteRequest: vi.fn(),
    onExportResources: vi.fn(),
    onImportResources: vi.fn(),
    importPreview: null,
    onConfirmImportPreview: vi.fn(),
    onCancelImportPreview: vi.fn(),
    statuses: {},
    isExporting: false,
    isPreviewingImport: false,
    isImporting: false,
    isDeletingRequest: false,
    isCreatingCollection: false,
    isRenamingCollection: false,
    isDeletingCollection: false,
    isCreatingRequestGroup: false,
    isRenamingRequestGroup: false,
    isDeletingRequestGroup: false,
    ...overrides,
  };
}

function getRequestGroupSection() {
  return screen.getByRole('heading', { name: 'Request groups' }).closest('section') as HTMLElement;
}

describe('WorkspaceResourceManagerPanel', () => {
  it('shows nested request groups with full path labels and recursive counts', () => {
    renderApp(
      <WorkspaceResourceManagerPanel
        {...createProps({
          activeTab: createActiveTab(),
        })}
      />,
    );

    const requestGroupSelect = screen.getByLabelText('Manage request group');

    expect(within(requestGroupSelect).getByRole('option', { name: 'Auth' })).toBeInTheDocument();
    expect(within(requestGroupSelect).getByRole('option', { name: 'Auth / Login' })).toBeInTheDocument();
    expect(requestGroupSelect).toHaveValue('request-group-login');
    expect(screen.getByLabelText('Request group name')).toHaveValue('Login');
    expect(screen.getByText('2 request group(s) exist in the selected collection tree.')).toBeInTheDocument();
  });

  it('renames a nested request group selected from the flattened manager selector', async () => {
    const user = userEvent.setup();
    const onRenameRequestGroup = vi.fn();

    renderApp(
      <WorkspaceResourceManagerPanel
        {...createProps({
          onRenameRequestGroup,
        })}
      />,
    );

    const requestGroupSection = getRequestGroupSection();
    const requestGroupSelect = screen.getByLabelText('Manage request group');

    await user.selectOptions(requestGroupSelect, 'request-group-login');
    expect(screen.getByLabelText('Request group name')).toHaveValue('Login');

    await user.clear(screen.getByLabelText('Request group name'));
    await user.type(screen.getByLabelText('Request group name'), 'Sign in');
    await user.click(within(requestGroupSection).getByRole('button', { name: 'Rename' }));

    expect(onRenameRequestGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        requestGroupId: 'request-group-login',
        name: 'Login',
      }),
      'Sign in',
    );
  });
});
