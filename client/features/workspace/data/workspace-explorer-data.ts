import {
  DEFAULT_REQUEST_COLLECTION_NAME,
  mapSavedRequestResourceToWorkspaceSeed,
  sortSavedRequestResources,
  type SavedRequestResourceRecord,
} from '@client/features/request-builder/request-builder.api';
import {
  type WorkspaceCollectionNode,
  type WorkspaceExplorerNode,
  type WorkspaceFolderNode,
  type WorkspaceRequestNode,
  workspaceExplorerTree,
} from '@client/features/workspace/data/workspace-explorer-fixtures';

function cloneFixtureNode(node: WorkspaceExplorerNode): WorkspaceExplorerNode {
  if (node.kind === 'request') {
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
    children: node.children.map((child) => cloneFixtureNode(child)),
  };
}

function createWorkspaceRequestNode(record: SavedRequestResourceRecord): WorkspaceRequestNode {
  return {
    id: `saved-node-${record.id}`,
    kind: 'request',
    name: record.name,
    request: mapSavedRequestResourceToWorkspaceSeed(record),
  };
}

function createCollectionNodeId(collectionName: string) {
  return `collection-live-${collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function createFolderNodeId(collectionName: string, folderName: string) {
  return `folder-live-${collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export function buildWorkspaceExplorerTree(savedRequests: SavedRequestResourceRecord[]) {
  const persistedRequests = sortSavedRequestResources(savedRequests);

  if (persistedRequests.length === 0) {
    return workspaceExplorerTree.map((node) => cloneFixtureNode(node));
  }

  const collectionMap = new Map<string, {
    rootRequests: SavedRequestResourceRecord[];
    folders: Map<string, SavedRequestResourceRecord[]>;
  }>();

  for (const record of persistedRequests) {
    const collectionName = record.collectionName || DEFAULT_REQUEST_COLLECTION_NAME;
    const collectionEntry = collectionMap.get(collectionName) ?? {
      rootRequests: [],
      folders: new Map<string, SavedRequestResourceRecord[]>(),
    };

    if (!collectionMap.has(collectionName)) {
      collectionMap.set(collectionName, collectionEntry);
    }

    if (record.folderName) {
      const folderRecords = collectionEntry.folders.get(record.folderName) ?? [];
      folderRecords.push(record);
      collectionEntry.folders.set(record.folderName, folderRecords);
      continue;
    }

    collectionEntry.rootRequests.push(record);
  }

  return [...collectionMap.entries()]
    .sort(([leftCollectionName], [rightCollectionName]) => leftCollectionName.localeCompare(rightCollectionName))
    .map(([collectionName, collectionEntry]) => {
      const folderChildren: WorkspaceFolderNode[] = [...collectionEntry.folders.entries()]
        .sort(([leftFolderName], [rightFolderName]) => leftFolderName.localeCompare(rightFolderName))
        .map(([folderName, folderRecords]) => ({
          id: createFolderNodeId(collectionName, folderName),
          kind: 'folder',
          name: folderName,
          children: sortSavedRequestResources(folderRecords).map((record) => createWorkspaceRequestNode(record)),
        }));

      const collectionNode: WorkspaceCollectionNode = {
        id: createCollectionNodeId(collectionName),
        kind: 'collection',
        name: collectionName,
        children: [
          ...sortSavedRequestResources(collectionEntry.rootRequests).map((record) => createWorkspaceRequestNode(record)),
          ...folderChildren,
        ],
      };

      return collectionNode;
    });
}
