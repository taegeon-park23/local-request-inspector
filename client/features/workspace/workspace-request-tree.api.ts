import {
  DEFAULT_WORKSPACE_ID,
  RequestBuilderApiError,
  type SavedRequestResourceRecord,
} from '@client/features/request-builder/request-builder.api';

interface ApiEnvelope<TData> {
  data: TData;
}

interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable?: boolean;
  };
}

export interface WorkspaceCollectionRecord {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceRequestGroupRecord {
  id: string;
  workspaceId: string;
  collectionId: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceTreeRequestLeaf {
  id: string;
  name: string;
  methodLabel: SavedRequestResourceRecord['method'];
  summary: string;
  collectionId: string;
  collectionName: string;
  requestGroupId: string;
  requestGroupName: string;
  folderName?: string;
  updatedAt?: string;
}

export interface WorkspaceRequestLeafNode {
  id: string;
  kind: 'request';
  name: string;
  request: WorkspaceTreeRequestLeaf;
}

export interface WorkspaceRequestGroupNode {
  id: string;
  kind: 'request-group';
  collectionId: string;
  requestGroupId: string;
  name: string;
  description?: string;
  children: WorkspaceRequestLeafNode[];
}

export interface WorkspaceCollectionNode {
  id: string;
  kind: 'collection';
  collectionId: string;
  name: string;
  description?: string;
  children: WorkspaceRequestGroupNode[];
}

export interface WorkspaceRequestTreeResponse {
  defaults: {
    collectionId: string;
    requestGroupId: string;
    collectionName: string;
    requestGroupName: string;
  };
  collections: WorkspaceCollectionRecord[];
  requestGroups: WorkspaceRequestGroupRecord[];
  tree: WorkspaceCollectionNode[];
}

export const workspaceRequestTreeQueryKey = ['workspace-request-tree', DEFAULT_WORKSPACE_ID] as const;

async function parseJsonResponse<TData>(response: Response): Promise<TData> {
  const responseText = await response.text();
  const payload = responseText.length > 0
    ? JSON.parse(responseText) as ApiEnvelope<TData> | ApiErrorEnvelope
    : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorEnvelope | null;

    throw new RequestBuilderApiError({
      message: errorPayload?.error?.message ?? `Request failed with status ${response.status}`,
      status: response.status,
      ...(errorPayload?.error?.code ? { code: errorPayload.error.code } : {}),
      ...(errorPayload?.error?.details ? { details: errorPayload.error.details } : {}),
      ...(typeof errorPayload?.error?.retryable === 'boolean'
        ? { retryable: errorPayload.error.retryable }
        : {}),
    });
  }

  return (payload as ApiEnvelope<TData>).data;
}

export async function listWorkspaceRequestTree() {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/request-tree`);
  return parseJsonResponse<WorkspaceRequestTreeResponse>(response);
}

export async function readWorkspaceSavedRequestDetail(requestId: string) {
  const response = await fetch(`/api/requests/${requestId}`);
  return parseJsonResponse<{ request: SavedRequestResourceRecord }>(response).then((payload) => payload.request);
}

export async function deleteWorkspaceSavedRequest(requestId: string) {
  const response = await fetch(`/api/requests/${requestId}`, {
    method: 'DELETE',
  });
  return parseJsonResponse<{ deletedRequestId: string }>(response).then((payload) => payload.deletedRequestId);
}

function compareSavedRequests(left: SavedRequestResourceRecord, right: SavedRequestResourceRecord) {
  return String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
}

function readRequestGroupName(record: SavedRequestResourceRecord) {
  const recordWithPlacement = record as SavedRequestResourceRecord & {
    collectionId?: string;
    requestGroupId?: string;
    requestGroupName?: string;
    folderName?: string;
  };

  return recordWithPlacement.requestGroupName || recordWithPlacement.folderName || 'General';
}

function readCollectionId(record: SavedRequestResourceRecord) {
  const recordWithPlacement = record as SavedRequestResourceRecord & {
    collectionId?: string;
  };

  return recordWithPlacement.collectionId ?? `fallback-${record.collectionName || 'saved-requests'}`;
}

function readRequestGroupId(record: SavedRequestResourceRecord) {
  const recordWithPlacement = record as SavedRequestResourceRecord & {
    requestGroupId?: string;
  };

  return recordWithPlacement.requestGroupId ?? `fallback-${readRequestGroupName(record)}`;
}

export function buildFallbackWorkspaceRequestTree(
  requests: SavedRequestResourceRecord[],
): WorkspaceCollectionNode[] {
  const collectionMap = new Map<
    string,
    Map<string, SavedRequestResourceRecord[]>
  >();

  for (const request of [...requests].sort(compareSavedRequests)) {
    const collectionName = String(request.collectionName || 'Saved Requests');
    const requestGroupName = String(readRequestGroupName(request));
    const collectionGroups = collectionMap.get(collectionName) ?? new Map<string, SavedRequestResourceRecord[]>();

    if (!collectionMap.has(collectionName)) {
      collectionMap.set(collectionName, collectionGroups);
    }

    const groupRequests = collectionGroups.get(requestGroupName) ?? [];
    groupRequests.push(request);
    collectionGroups.set(requestGroupName, groupRequests);
  }

  return [...collectionMap.entries()].map(([collectionName, requestGroups]) => {
    const firstGroupRequests = [...requestGroups.values()][0];
    const firstCollectionRequest = firstGroupRequests?.[0];

    return {
      id: `fallback-collection-${collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      kind: 'collection' as const,
      collectionId: firstCollectionRequest ? readCollectionId(firstCollectionRequest) : `fallback-${collectionName}`,
      name: collectionName,
      children: [...requestGroups.entries()].map(([requestGroupName, groupRequests]) => ({
      id: `fallback-request-group-${collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${requestGroupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      kind: 'request-group',
      collectionId: groupRequests[0] ? readCollectionId(groupRequests[0]) : `fallback-${collectionName}`,
      requestGroupId: groupRequests[0] ? readRequestGroupId(groupRequests[0]) : `fallback-${requestGroupName}`,
      name: requestGroupName,
      children: groupRequests.map((request) => ({
        id: `fallback-request-${request.id}`,
        kind: 'request',
        name: request.name,
        request: {
          id: request.id,
          name: request.name,
          methodLabel: request.method,
          summary: request.summary,
          collectionId: readCollectionId(request),
          collectionName: request.collectionName,
          requestGroupId: readRequestGroupId(request),
          requestGroupName: readRequestGroupName(request),
          folderName: readRequestGroupName(request),
          updatedAt: request.updatedAt,
        },
      })),
    })),
    };
  });
}
