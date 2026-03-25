import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceExplorer } from '@client/features/workspace/components/WorkspaceExplorer';
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

  const requestLeaf = {
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

  return requestLeaf;
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

describe('WorkspaceExplorer', () => {
  it('renders recursive groups and shows a nested selection breadcrumb', () => {
    renderApp(
      <WorkspaceExplorer
        tree={createTree()}
        selectedItemId="request-create-session"
        selectedItemKind="request"
        onSelectCollection={vi.fn()}
        onSelectRequestGroup={vi.fn()}
        onPreviewSavedRequest={vi.fn()}
        onPinSavedRequest={vi.fn()}
        onCreateRequest={vi.fn()}
        onCreateRequestGroup={vi.fn()}
        onRunCollection={vi.fn()}
        onRunRequestGroup={vi.fn()}
        onRenameCollection={vi.fn()}
        onDeleteCollection={vi.fn()}
        onRenameRequestGroup={vi.fn()}
        onDeleteRequestGroup={vi.fn()}
        onExportRequest={vi.fn()}
        onDeleteRequest={vi.fn()}
      />,
    );

    expect(screen.getByText('Saved Requests')).toBeInTheDocument();
    expect(screen.getByText('Auth')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Create session')).toBeInTheDocument();
    expect(screen.getByText('Persisted collections, nested request groups, and saved requests stay visible here. Explorer actions handle preview, pin, create, run, rename, and delete without leaving the tree.')).toBeInTheDocument();
    expect(screen.getByText('Current selection: Saved Requests / Auth / Login / Create session')).toBeInTheDocument();
    expect(screen.getByText('1 request group(s) · 1 request(s)')).toBeInTheDocument();
  });

  it('uses preview on single click, pin on double click, and seeds nested group placement for new requests', async () => {
    const user = userEvent.setup();
    const tree = createTree();
    const previewRequest = vi.fn();
    const pinRequest = vi.fn();
    const createRequest = vi.fn();

    renderApp(
      <WorkspaceExplorer
        tree={tree}
        selectedItemId={null}
        selectedItemKind={null}
        onSelectCollection={vi.fn()}
        onSelectRequestGroup={vi.fn()}
        onPreviewSavedRequest={previewRequest}
        onPinSavedRequest={pinRequest}
        onCreateRequest={createRequest}
        onCreateRequestGroup={vi.fn()}
        onRunCollection={vi.fn()}
        onRunRequestGroup={vi.fn()}
        onRenameCollection={vi.fn()}
        onDeleteCollection={vi.fn()}
        onRenameRequestGroup={vi.fn()}
        onDeleteRequestGroup={vi.fn()}
        onExportRequest={vi.fn()}
        onDeleteRequest={vi.fn()}
      />,
    );

    const requestButton = screen.getByRole('button', { name: 'Open Create session' });
    await user.click(requestButton);
    expect(previewRequest).toHaveBeenCalledWith(tree[0]!.childGroups[0]!.childGroups[0]!.requests[0]!.request);

    previewRequest.mockClear();
    await user.dblClick(requestButton);
    expect(pinRequest).toHaveBeenCalledWith(tree[0]!.childGroups[0]!.childGroups[0]!.requests[0]!.request);

    const newRequestButtons = screen.getAllByRole('button', { name: 'New Request' });
    await user.click(newRequestButtons[2]!);
    expect(createRequest).toHaveBeenCalledWith({
      collectionId: 'collection-saved-requests',
      requestGroupId: 'request-group-login',
      requestGroupName: 'Login',
    });
  });
});
