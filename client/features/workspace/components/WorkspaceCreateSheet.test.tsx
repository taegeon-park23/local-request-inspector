import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  WorkspaceCollectionNode,
  WorkspaceRequestGroupNode,
} from '@client/features/workspace/workspace-request-tree.api';
import { WorkspaceCreateSheet } from '@client/features/workspace/components/WorkspaceCreateSheet';
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

function createTree() {
  const nestedGroup = createRequestGroupNode({
    id: 'request-group-node-login',
    collectionId: 'collection-saved-requests',
    requestGroupId: 'request-group-login',
    parentRequestGroupId: 'request-group-auth',
    name: 'Login',
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

describe('WorkspaceCreateSheet', () => {
  it('auto-suggests parent scope from the selected target request group', () => {
    const tree = createTree();

    renderApp(
      <WorkspaceCreateSheet
        isOpen
        tree={tree}
        defaultType="request-group"
        defaultTarget={tree[0]!.childGroups[0]!}
        onCancel={vi.fn()}
        onCreateCollection={vi.fn()}
        onCreateRequestGroup={vi.fn()}
      />,
    );

    const sheet = screen.getByLabelText('Create workspace item');
    expect(within(sheet).getByLabelText('Parent')).toHaveValue('request-group:request-group-auth');
  });

  it('submits request-group creation with collection and parent ids from the selected scope', async () => {
    const user = userEvent.setup();
    const tree = createTree();
    const onCreateRequestGroup = vi.fn();

    renderApp(
      <WorkspaceCreateSheet
        isOpen
        tree={tree}
        defaultType="request-group"
        defaultTarget={tree[0]!}
        onCancel={vi.fn()}
        onCreateCollection={vi.fn()}
        onCreateRequestGroup={onCreateRequestGroup}
      />,
    );

    const sheet = screen.getByLabelText('Create workspace item');
    await user.selectOptions(within(sheet).getByLabelText('Parent'), 'request-group:request-group-login');
    await user.type(within(sheet).getByLabelText('Name'), 'Auth flows');
    await user.click(within(sheet).getByRole('button', { name: 'Create' }));

    expect(onCreateRequestGroup).toHaveBeenCalledWith({
      name: 'Auth flows',
      collectionId: 'collection-saved-requests',
      parentRequestGroupId: 'request-group-login',
    });
  });

  it('creates a collection when collection type is selected', async () => {
    const user = userEvent.setup();
    const onCreateCollection = vi.fn();

    renderApp(
      <WorkspaceCreateSheet
        isOpen
        tree={createTree()}
        defaultType="collection"
        defaultTarget={null}
        onCancel={vi.fn()}
        onCreateCollection={onCreateCollection}
        onCreateRequestGroup={vi.fn()}
      />,
    );

    const sheet = screen.getByLabelText('Create workspace item');
    await user.type(within(sheet).getByLabelText('Name'), 'Team API');
    await user.click(within(sheet).getByRole('button', { name: 'Create' }));

    expect(onCreateCollection).toHaveBeenCalledWith('Team API');
  });
});
