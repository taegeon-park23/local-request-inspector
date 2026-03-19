import {
  mapSavedRequestResourceToWorkspaceSeed,
  type SavedRequestResourceRecord,
} from '@client/features/request-builder/request-builder.api';
import {
  type WorkspaceCollectionNode,
  type WorkspaceExplorerNode,
  type WorkspaceFolderNode,
  type WorkspaceRequestNode,
  workspaceExplorerTree,
} from '@client/features/workspace/data/workspace-explorer-fixtures';

function cloneRequestNode(node: WorkspaceRequestNode, record?: SavedRequestResourceRecord): WorkspaceRequestNode {
  if (!record) {
    return {
      ...node,
      request: {
        ...node.request,
        ...(node.request.draftSeed
          ? {
              draftSeed: {
                ...node.request.draftSeed,
              },
            }
          : {}),
      },
    };
  }

  return {
    ...node,
    name: record.name,
    request: mapSavedRequestResourceToWorkspaceSeed(record),
  };
}

function cloneFolderNode(node: WorkspaceFolderNode, recordsById: Map<string, SavedRequestResourceRecord>): WorkspaceFolderNode {
  return {
    ...node,
    children: node.children.map((child) => cloneExplorerNode(child, recordsById)),
  };
}

function cloneCollectionNode(
  node: WorkspaceCollectionNode,
  recordsById: Map<string, SavedRequestResourceRecord>,
): WorkspaceCollectionNode {
  return {
    ...node,
    children: node.children.map((child) => cloneExplorerNode(child, recordsById)),
  };
}

function cloneExplorerNode(node: WorkspaceExplorerNode, recordsById: Map<string, SavedRequestResourceRecord>): WorkspaceExplorerNode {
  if (node.kind === 'request') {
    const persistedRecord = recordsById.get(node.request.id);

    if (persistedRecord) {
      recordsById.delete(node.request.id);
    }

    return cloneRequestNode(node, persistedRecord);
  }

  if (node.kind === 'folder') {
    return cloneFolderNode(node, recordsById);
  }

  return cloneCollectionNode(node, recordsById);
}

function createWorkspaceRequestNode(record: SavedRequestResourceRecord): WorkspaceRequestNode {
  return {
    id: `saved-node-${record.id}`,
    kind: 'request',
    name: record.name,
    request: mapSavedRequestResourceToWorkspaceSeed(record),
  };
}

export function buildWorkspaceExplorerTree(savedRequests: SavedRequestResourceRecord[]) {
  const recordsById = new Map(savedRequests.map((record) => [record.id, record]));
  const mergedFixtureTree = workspaceExplorerTree.map((node) => cloneExplorerNode(node, recordsById));

  if (recordsById.size === 0) {
    return mergedFixtureTree;
  }

  const extraRecords = [...recordsById.values()].sort((left, right) => left.name.localeCompare(right.name));
  const collectionsByName = new Map<string, WorkspaceCollectionNode>();

  for (const record of extraRecords) {
    const collectionName = record.collectionName || 'Saved Requests';
    const collectionNode = collectionsByName.get(collectionName) ?? {
      id: `collection-live-${collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      kind: 'collection',
      name: collectionName,
      children: [],
    };

    if (!collectionsByName.has(collectionName)) {
      collectionsByName.set(collectionName, collectionNode);
    }

    if (record.folderName) {
      const existingFolder = collectionNode.children.find(
        (node): node is WorkspaceFolderNode => node.kind === 'folder' && node.name === record.folderName,
      );

      const targetFolder = existingFolder ?? {
        id: `folder-live-${collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${record.folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        kind: 'folder',
        name: record.folderName,
        children: [],
      };

      if (!existingFolder) {
        collectionNode.children.push(targetFolder);
      }

      targetFolder.children.push(createWorkspaceRequestNode(record));
      continue;
    }

    collectionNode.children.push(createWorkspaceRequestNode(record));
  }

  return [...mergedFixtureTree, ...collectionsByName.values()];
}


