import type { SavedWorkspaceRequestSeed } from '@client/features/request-builder/request-tab.types';
import type { RequestDraftSeed } from '@client/features/request-builder/request-draft.types';

interface WorkspaceExplorerNodeBase {
  id: string;
  name: string;
}

export interface WorkspaceSavedRequestSeed extends SavedWorkspaceRequestSeed {
  draftSeed?: RequestDraftSeed;
}

export interface WorkspaceCollectionNode extends WorkspaceExplorerNodeBase {
  kind: 'collection';
  children: WorkspaceExplorerNode[];
}

export interface WorkspaceFolderNode extends WorkspaceExplorerNodeBase {
  kind: 'folder';
  children: WorkspaceExplorerNode[];
}

export interface WorkspaceRequestNode extends WorkspaceExplorerNodeBase {
  kind: 'request';
  request: WorkspaceSavedRequestSeed;
}

export type WorkspaceExplorerNode =
  | WorkspaceCollectionNode
  | WorkspaceFolderNode
  | WorkspaceRequestNode;

export const workspaceExplorerTree: WorkspaceExplorerNode[] = [
  {
    id: 'collection-core-apis',
    kind: 'collection',
    name: 'Core APIs',
    children: [
      {
        id: 'request-health-check',
        kind: 'request',
        name: 'Health check',
        request: {
          id: 'request-health-check',
          name: 'Health check',
          methodLabel: 'GET',
          summary: 'Baseline service probe for the local runtime.',
          collectionName: 'Core APIs',
          draftSeed: {
            url: 'http://localhost:5671/health',
            headers: [{ id: 'health-accept', key: 'Accept', value: 'application/json', enabled: true }],
          },
        },
      },
      {
        id: 'folder-user-flows',
        kind: 'folder',
        name: 'User flows',
        children: [
          {
            id: 'request-list-users',
            kind: 'request',
            name: 'List users',
            request: {
              id: 'request-list-users',
              name: 'List users',
              methodLabel: 'GET',
              summary: 'Saved request placeholder for list retrieval.',
              collectionName: 'Core APIs',
              folderName: 'User flows',
              draftSeed: {
                url: 'http://localhost:5671/api/users',
                params: [
                  { id: 'users-page', key: 'page', value: '1', enabled: true },
                  { id: 'users-limit', key: 'limit', value: '20', enabled: true },
                ],
                headers: [{ id: 'users-accept', key: 'Accept', value: 'application/json', enabled: true }],
              },
            },
          },
          {
            id: 'request-create-session',
            kind: 'request',
            name: 'Create session',
            request: {
              id: 'request-create-session',
              name: 'Create session',
              methodLabel: 'POST',
              summary: 'Saved request placeholder for authentication flow scaffolding.',
              collectionName: 'Core APIs',
              folderName: 'User flows',
              draftSeed: {
                url: 'http://localhost:5671/api/sessions',
                headers: [
                  { id: 'session-content-type', key: 'Content-Type', value: 'application/json', enabled: true },
                ],
                bodyMode: 'json',
                bodyText: '{\n  "email": "demo@example.com",\n  "password": "secret"\n}',
              },
            },
          },
        ],
      },
    ],
  },
  {
    id: 'collection-diagnostics',
    kind: 'collection',
    name: 'Diagnostics',
    children: [
      {
        id: 'request-runtime-echo',
        kind: 'request',
        name: 'Runtime echo',
        request: {
          id: 'request-runtime-echo',
          name: 'Runtime echo',
          methodLabel: 'POST',
          summary: 'Placeholder request for request and response panel layout work.',
          collectionName: 'Diagnostics',
          draftSeed: {
            url: 'http://localhost:5671/echo',
            bodyMode: 'text',
            bodyText: 'echo-payload',
            auth: {
              type: 'api-key',
              apiKeyName: 'x-api-key',
              apiKeyValue: 'demo-key',
              apiKeyPlacement: 'header',
            },
          },
        },
      },
    ],
  },
];

export function getSavedWorkspaceRequestSeedById(requestId: string): WorkspaceSavedRequestSeed | null {
  const nodesToVisit: WorkspaceExplorerNode[] = [...workspaceExplorerTree];

  while (nodesToVisit.length > 0) {
    const node = nodesToVisit.shift();

    if (!node) {
      continue;
    }

    if (node.kind === 'request' && node.request.id === requestId) {
      return node.request;
    }

    if (node.kind !== 'request') {
      nodesToVisit.push(...node.children);
    }
  }

  return null;
}
