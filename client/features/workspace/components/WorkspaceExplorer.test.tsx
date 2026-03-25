import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceExplorer } from '@client/features/workspace/components/WorkspaceExplorer';
import {
  resetWorkspaceExplorerStore,
  useWorkspaceExplorerStore,
} from '@client/features/workspace/state/workspace-explorer-store';
import type {
  WorkspaceCollectionNode,
  WorkspaceRequestGroupNode,
  WorkspaceTreeRequestLeaf,
} from '@client/features/workspace/workspace-request-tree.api';
import { renderApp } from '@client/shared/test/render-app';

function createRequestLeaf(
  overrides: Partial<WorkspaceTreeRequestLeaf> & Pick<WorkspaceTreeRequestLeaf, 'id' | 'name'>,
) {
  const collectionId = overrides.collectionId ?? 'collection-saved-requests';
  const collectionName = overrides.collectionName ?? 'Saved Requests';
  const requestGroupId = overrides.requestGroupId ?? 'request-group-login';
  const requestGroupName = overrides.requestGroupName ?? 'Login';

  return {
    id: overrides.id,
    name: overrides.name,
    methodLabel: overrides.methodLabel ?? 'POST',
    summary: overrides.summary ?? `${overrides.name} summary`,
    collectionId,
    collectionName,
    requestGroupId,
    requestGroupName,
    ...(overrides.updatedAt ? { updatedAt: overrides.updatedAt } : {}),
  } satisfies WorkspaceTreeRequestLeaf;
}

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

function createTree() {
  const nestedRequest = createRequestLeaf({
    id: 'request-create-session',
    name: 'Create session',
  });
  const nestedGroup = createRequestGroupNode({
    id: 'request-group-node-login',
    collectionId: 'collection-saved-requests',
    requestGroupId: 'request-group-login',
    parentRequestGroupId: 'request-group-auth',
    name: 'Login',
    requests: [{
      id: 'request-node-create-session',
      kind: 'request',
      name: nestedRequest.name,
      request: nestedRequest,
    }],
  });
  const rootGroup = createRequestGroupNode({
    id: 'request-group-node-auth',
    collectionId: 'collection-saved-requests',
    requestGroupId: 'request-group-auth',
    name: 'Auth',
    childGroups: [nestedGroup],
  });

  return [{
    id: 'collection-node-saved-requests',
    kind: 'collection',
    collectionId: 'collection-saved-requests',
    name: 'Saved Requests',
    description: '',
    childGroups: [rootGroup],
  } satisfies WorkspaceCollectionNode];
}

function createExplorer(overrides: Partial<ComponentProps<typeof WorkspaceExplorer>> = {}) {
  return (
    <WorkspaceExplorer
      tree={createTree()}
      selectedItemId="request-create-session"
      selectedItemKind="request"
      onSelectCollection={vi.fn()}
      onSelectRequestGroup={vi.fn()}
      onPreviewSavedRequest={vi.fn()}
      onPinSavedRequest={vi.fn()}
      onDeleteCollection={vi.fn()}
      onDeleteRequestGroup={vi.fn()}
      onDeleteRequest={vi.fn()}
      {...overrides}
    />
  );
}

afterEach(() => {
  resetWorkspaceExplorerStore();
  window.localStorage.clear();
});

describe('WorkspaceExplorer', () => {
  it('renders recursive groups and shows a nested selection breadcrumb', () => {
    renderApp(createExplorer());

    expect(screen.getByRole('tree', { name: 'Workspace explorer tree' })).toBeInTheDocument();
    expect(screen.getByText('Saved Requests')).toBeInTheDocument();
    expect(screen.getByText('Auth')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Create session')).toBeInTheDocument();
    expect(screen.getByText('Current selection: Saved Requests / Auth / Login / Create session')).toBeInTheDocument();
    expect(screen.getAllByText('1 request(s)').length).toBeGreaterThan(0);
    expect(screen.getByRole('searchbox', { name: 'Explorer search' })).toBeInTheDocument();
  });

  it('uses preview on single click and pin on double click for request rows', async () => {
    const user = userEvent.setup();
    const tree = createTree();
    const previewRequest = vi.fn();
    const pinRequest = vi.fn();

    renderApp(
      <WorkspaceExplorer
        tree={tree}
        selectedItemId={null}
        selectedItemKind={null}
        onSelectCollection={vi.fn()}
        onSelectRequestGroup={vi.fn()}
        onPreviewSavedRequest={previewRequest}
        onPinSavedRequest={pinRequest}
        onDeleteCollection={vi.fn()}
        onDeleteRequestGroup={vi.fn()}
        onDeleteRequest={vi.fn()}
      />,
    );

    const requestButton = screen.getByRole('treeitem', { name: 'Open Create session' });
    await user.click(requestButton);
    expect(previewRequest).toHaveBeenCalledWith(tree[0]!.childGroups[0]!.childGroups[0]!.requests[0]!.request);

    previewRequest.mockClear();
    await user.dblClick(requestButton);
    expect(pinRequest).toHaveBeenCalledWith(tree[0]!.childGroups[0]!.childGroups[0]!.requests[0]!.request);
    expect(screen.queryByRole('button', { name: 'New Request' })).not.toBeInTheDocument();
  });

  it('filters tree nodes by search query and shows empty-state copy when there are no matches', async () => {
    const user = userEvent.setup();
    renderApp(createExplorer({ selectedItemId: null, selectedItemKind: null }));

    await user.type(screen.getByRole('searchbox', { name: 'Explorer search' }), 'session');
    expect(screen.getByText('Create session')).toBeInTheDocument();
    expect(screen.queryByText('No request groups exist in this collection yet.')).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'Explorer search' }));
    await user.type(screen.getByRole('searchbox', { name: 'Explorer search' }), 'no-match-keyword');
    expect(screen.getByText('No explorer items match the current search.')).toBeInTheDocument();
  });

  it('supports collapse persistence and keyboard traversal for treeitems', async () => {
    const user = userEvent.setup();
    const onSelectRequestGroup = vi.fn();

    renderApp(createExplorer({
      selectedItemId: null,
      selectedItemKind: null,
      onSelectRequestGroup,
    }));

    await user.click(screen.getByRole('button', { name: 'Collapse Auth' }));
    expect(screen.queryByText('Create session')).not.toBeInTheDocument();

    expect(useWorkspaceExplorerStore.getState().collapsedNodeIds).toContain('request-group:request-group-auth');

    const firstTreeItem = screen.getAllByRole('treeitem')[0]!;
    firstTreeItem.focus();
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowDown}{Enter}');

    expect(onSelectRequestGroup).toHaveBeenCalledWith(expect.objectContaining({
      requestGroupId: 'request-group-login',
    }));
  });

  it('always reveals the selected opened item by expanding ancestor nodes', async () => {
    useWorkspaceExplorerStore.getState().setNodeCollapsed('collection:collection-saved-requests', true);
    useWorkspaceExplorerStore.getState().setNodeCollapsed('request-group:request-group-auth', true);
    useWorkspaceExplorerStore.getState().setNodeCollapsed('request-group:request-group-login', true);

    renderApp(createExplorer());

    await waitFor(() => {
      expect(screen.getByText('Create session')).toBeInTheDocument();
    });
    expect(useWorkspaceExplorerStore.getState().collapsedNodeIds).not.toContain('collection:collection-saved-requests');
    expect(useWorkspaceExplorerStore.getState().collapsedNodeIds).not.toContain('request-group:request-group-auth');
    expect(useWorkspaceExplorerStore.getState().collapsedNodeIds).not.toContain('request-group:request-group-login');
  });

  it('moves focus with type-ahead when a treeitem is focused', async () => {
    const user = userEvent.setup();
    renderApp(createExplorer({ selectedItemId: null, selectedItemKind: null }));

    const rootTreeItem = screen.getByRole('treeitem', { name: /Saved Requests/i });
    rootTreeItem.focus();
    await user.keyboard('l');

    expect(screen.getByRole('treeitem', { name: /Login/i })).toHaveFocus();
  });
});


