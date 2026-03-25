import {
  DEFAULT_REQUEST_COLLECTION_NAME,
  DEFAULT_WORKSPACE_ID,
  RequestBuilderApiError,
  type SavedRequestResourceRecord,
} from '@client/features/request-builder/request-builder.api';
import {
  DEFAULT_REQUEST_GROUP_NAME,
  readRequestGroupName as readRequestPlacementGroupName,
} from '@client/features/request-builder/request-placement';

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
  parentRequestGroupId?: string | null;
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
  parentRequestGroupId?: string | null;
  name: string;
  description?: string;
  childGroups: WorkspaceRequestGroupNode[];
  requests: WorkspaceRequestLeafNode[];
}

export interface WorkspaceCollectionNode {
  id: string;
  kind: 'collection';
  collectionId: string;
  name: string;
  description?: string;
  childGroups: WorkspaceRequestGroupNode[];
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

export interface WorkspaceCollectionInput {
  name: string;
  description?: string;
}

export interface WorkspaceRequestGroupInput {
  name: string;
  description?: string;
  parentRequestGroupId?: string | null;
}

export interface WorkspaceBatchExecutionStep {
  stepIndex: number;
  requestId: string;
  requestName: string;
  collectionId?: string;
  collectionName?: string;
  requestGroupId?: string;
  requestGroupName?: string;
  execution: import('@client/features/request-builder/request-builder.api').RequestRunObservation;
}

export interface WorkspaceBatchExecution {
  batchExecutionId: string;
  containerType: 'collection' | 'request-group';
  containerId: string;
  containerName: string;
  executionOrder: string;
  continuedAfterFailure: boolean;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  aggregateOutcome: 'Succeeded' | 'Failed' | 'Blocked' | 'Timed out' | 'Empty';
  requestCount: number;
  totalRuns: number;
  succeededCount: number;
  failedCount: number;
  blockedCount: number;
  timedOutCount: number;
  steps: WorkspaceBatchExecutionStep[];
}

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

function normalizeWorkspaceRequestLeafNode(node: WorkspaceRequestLeafNode): WorkspaceRequestLeafNode {
  return {
    ...node,
    request: {
      ...node.request,
    },
  };
}

function normalizeWorkspaceRequestGroupNode(node: WorkspaceRequestGroupNode): WorkspaceRequestGroupNode {
  return {
    ...node,
    childGroups: Array.isArray(node.childGroups)
      ? node.childGroups.map((childGroup) => normalizeWorkspaceRequestGroupNode(childGroup))
      : [],
    requests: Array.isArray(node.requests)
      ? node.requests.map((requestNode) => normalizeWorkspaceRequestLeafNode(requestNode))
      : [],
  };
}

function normalizeWorkspaceCollectionNode(node: WorkspaceCollectionNode): WorkspaceCollectionNode {
  return {
    ...node,
    childGroups: Array.isArray(node.childGroups)
      ? node.childGroups.map((childGroup) => normalizeWorkspaceRequestGroupNode(childGroup))
      : [],
  };
}

function normalizeWorkspaceRequestTreeResponse(response: WorkspaceRequestTreeResponse): WorkspaceRequestTreeResponse {
  return {
    ...response,
    collections: Array.isArray(response.collections) ? response.collections : [],
    requestGroups: Array.isArray(response.requestGroups) ? response.requestGroups : [],
    tree: Array.isArray(response.tree)
      ? response.tree.map((collection) => normalizeWorkspaceCollectionNode(collection))
      : [],
  };
}

export async function listWorkspaceRequestTree() {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/request-tree`);
  return parseJsonResponse<WorkspaceRequestTreeResponse>(response)
    .then((payload) => normalizeWorkspaceRequestTreeResponse(payload));
}

export async function createWorkspaceCollection(
  collection: WorkspaceCollectionInput,
) {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collection }),
  });

  return parseJsonResponse<{ collection: WorkspaceCollectionRecord }>(response).then((payload) => payload.collection);
}

export async function updateWorkspaceCollection(
  collectionId: string,
  collection: WorkspaceCollectionInput,
) {
  const response = await fetch(`/api/collections/${collectionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collection }),
  });

  return parseJsonResponse<{ collection: WorkspaceCollectionRecord }>(response).then((payload) => payload.collection);
}

export async function deleteWorkspaceCollection(collectionId: string) {
  const response = await fetch(`/api/collections/${collectionId}`, {
    method: 'DELETE',
  });

  return parseJsonResponse<{ deletedCollectionId: string }>(response).then((payload) => payload.deletedCollectionId);
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

export async function createWorkspaceRequestGroup(
  collectionId: string,
  requestGroup: WorkspaceRequestGroupInput,
) {
  const response = await fetch(`/api/collections/${collectionId}/request-groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requestGroup }),
  });

  return parseJsonResponse<{ requestGroup: WorkspaceRequestGroupRecord }>(response).then((payload) => payload.requestGroup);
}

export async function updateWorkspaceRequestGroup(
  requestGroupId: string,
  requestGroup: WorkspaceRequestGroupInput,
) {
  const response = await fetch(`/api/request-groups/${requestGroupId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requestGroup }),
  });

  return parseJsonResponse<{ requestGroup: WorkspaceRequestGroupRecord }>(response).then((payload) => payload.requestGroup);
}

export async function deleteWorkspaceRequestGroup(requestGroupId: string) {
  const response = await fetch(`/api/request-groups/${requestGroupId}`, {
    method: 'DELETE',
  });

  return parseJsonResponse<{ deletedRequestGroupId: string }>(response).then((payload) => payload.deletedRequestGroupId);
}

export async function runWorkspaceCollection(collectionId: string) {
  const response = await fetch(`/api/collections/${collectionId}/run`, {
    method: 'POST',
  });

  return parseJsonResponse<{ batchExecution: WorkspaceBatchExecution }>(response).then((payload) => payload.batchExecution);
}

export async function runWorkspaceRequestGroup(requestGroupId: string) {
  const response = await fetch(`/api/request-groups/${requestGroupId}/run`, {
    method: 'POST',
  });

  return parseJsonResponse<{ batchExecution: WorkspaceBatchExecution }>(response).then((payload) => payload.batchExecution);
}

function compareSavedRequests(left: SavedRequestResourceRecord, right: SavedRequestResourceRecord) {
  return String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''));
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

  return recordWithPlacement.requestGroupId ?? `fallback-${readRequestPlacementGroupName(record) ?? DEFAULT_REQUEST_GROUP_NAME}`;
}

export function buildFallbackWorkspaceRequestTree(
  requests: SavedRequestResourceRecord[],
): WorkspaceCollectionNode[] {
  const collectionMap = new Map<
    string,
    Map<string, SavedRequestResourceRecord[]>
  >();

  for (const request of [...requests].sort(compareSavedRequests)) {
    const collectionName = String(request.collectionName || DEFAULT_REQUEST_COLLECTION_NAME);
    const requestGroupName = String(readRequestPlacementGroupName(request) ?? DEFAULT_REQUEST_GROUP_NAME);
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
      childGroups: [...requestGroups.entries()].map(([requestGroupName, groupRequests]) => ({
        id: `fallback-request-group-${collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${requestGroupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        kind: 'request-group',
        collectionId: groupRequests[0] ? readCollectionId(groupRequests[0]) : `fallback-${collectionName}`,
        requestGroupId: groupRequests[0] ? readRequestGroupId(groupRequests[0]) : `fallback-${requestGroupName}`,
        parentRequestGroupId: null,
        name: requestGroupName,
        childGroups: [],
        requests: groupRequests.map((request) => ({
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
            requestGroupName: readRequestPlacementGroupName(request) ?? DEFAULT_REQUEST_GROUP_NAME,
            updatedAt: request.updatedAt,
          },
        })),
      })),
    };
  });
}





