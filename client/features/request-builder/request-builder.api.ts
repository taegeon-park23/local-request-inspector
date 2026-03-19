import type {
  RequestDraftAuthState,
  RequestDraftScriptsState,
  RequestDraftState,
  RequestKeyValueRow,
} from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import type { WorkspaceSavedRequestSeed } from '@client/features/workspace/data/workspace-explorer-fixtures';

export const DEFAULT_WORKSPACE_ID = 'local-workspace';
export const DEFAULT_REQUEST_COLLECTION_NAME = 'Saved Requests';
export const workspaceSavedRequestsQueryKey = ['workspace-saved-requests', DEFAULT_WORKSPACE_ID] as const;

interface ApiEnvelope<TData> {
  data: TData;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable?: boolean;
  };
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

export interface RequestDefinitionInput {
  id?: string;
  workspaceId?: string;
  name: string;
  method: RequestDraftState['method'];
  url: string;
  params: RequestKeyValueRow[];
  headers: RequestKeyValueRow[];
  bodyMode: RequestDraftState['bodyMode'];
  bodyText: string;
  formBody: RequestKeyValueRow[];
  multipartBody: RequestKeyValueRow[];
  auth: RequestDraftAuthState;
  scripts: RequestDraftScriptsState;
  collectionName?: string;
  folderName?: string;
}

export interface SavedRequestResourceRecord extends RequestDefinitionInput {
  id: string;
  workspaceId: string;
  summary: string;
  collectionName: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestRunObservation {
  executionId: string;
  executionOutcome: 'Succeeded' | 'Failed';
  responseStatus: number | null;
  responseStatusLabel: string;
  responseHeaders: Array<{ name: string; value: string }>;
  responseHeadersSummary: string;
  responseBodyPreview: string;
  responseBodyHint: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  consoleSummary: string;
  consoleEntries: string[];
  testsSummary: string;
  testEntries: string[];
  errorSummary?: string;
}

export class RequestBuilderApiError extends Error {
  code: string;
  details: Record<string, unknown>;
  retryable: boolean;
  status: number;

  constructor(options: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
    retryable?: boolean;
    status: number;
  }) {
    super(options.message);
    this.name = 'RequestBuilderApiError';
    this.code = options.code ?? 'request_builder_api_error';
    this.details = options.details ?? {};
    this.retryable = options.retryable ?? false;
    this.status = options.status;
  }
}

function cloneRows(rows: RequestKeyValueRow[]) {
  return rows.map((row) => ({ ...row }));
}

function cloneAuth(auth: RequestDraftAuthState): RequestDraftAuthState {
  return {
    ...auth,
  };
}

function cloneScripts(scripts: RequestDraftScriptsState): RequestDraftScriptsState {
  return {
    ...scripts,
  };
}


async function parseJsonResponse<TData>(response: Response): Promise<TData> {
  const responseText = await response.text();
  const payload = responseText.length > 0 ? JSON.parse(responseText) as ApiEnvelope<TData> | ApiErrorEnvelope : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorEnvelope | null;
    const errorOptions = {
      message: errorPayload?.error?.message ?? `Request failed with status ${response.status}`,
      status: response.status,
      ...(errorPayload?.error?.code ? { code: errorPayload.error.code } : {}),
      ...(errorPayload?.error?.details ? { details: errorPayload.error.details } : {}),
      ...(typeof errorPayload?.error?.retryable === 'boolean'
        ? { retryable: errorPayload.error.retryable }
        : {}),
    };

    throw new RequestBuilderApiError(errorOptions);
  }

  return (payload as ApiEnvelope<TData>).data;
}

export function createRequestDefinitionInput(
  activeTab: RequestTabRecord,
  draft: RequestDraftState,
): RequestDefinitionInput {
  return {
    ...(activeTab.requestId ? { id: activeTab.requestId } : {}),
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: draft.name.trim() || activeTab.title,
    method: draft.method,
    url: draft.url,
    params: cloneRows(draft.params),
    headers: cloneRows(draft.headers),
    bodyMode: draft.bodyMode,
    bodyText: draft.bodyText,
    formBody: cloneRows(draft.formBody),
    multipartBody: cloneRows(draft.multipartBody),
    auth: cloneAuth(draft.auth),
    scripts: cloneScripts(draft.scripts),
    collectionName: draft.collectionName ?? activeTab.collectionName ?? DEFAULT_REQUEST_COLLECTION_NAME,
    ...(draft.folderName || activeTab.folderName
      ? { folderName: draft.folderName ?? activeTab.folderName }
      : {}),
  };
}

export function mapSavedRequestResourceToWorkspaceSeed(
  record: SavedRequestResourceRecord,
): WorkspaceSavedRequestSeed {
  return {
    id: record.id,
    name: record.name,
    methodLabel: record.method,
    summary: record.summary,
    collectionName: record.collectionName,
    ...(record.folderName ? { folderName: record.folderName } : {}),
    draftSeed: {
      name: record.name,
      method: record.method,
      url: record.url,
      params: cloneRows(record.params),
      headers: cloneRows(record.headers),
      bodyMode: record.bodyMode,
      bodyText: record.bodyText,
      formBody: cloneRows(record.formBody),
      multipartBody: cloneRows(record.multipartBody),
      auth: cloneAuth(record.auth),
      scripts: cloneScripts(record.scripts),
    },
  };
}

export function upsertSavedRequestResource(
  records: SavedRequestResourceRecord[],
  nextRecord: SavedRequestResourceRecord,
) {
  const nextRecords = records.filter((record) => record.id !== nextRecord.id);
  return [nextRecord, ...nextRecords];
}

export async function listWorkspaceSavedRequests() {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/requests`);
  return parseJsonResponse<{ items: SavedRequestResourceRecord[] }>(response).then((payload) => payload.items);
}

export async function saveRequestDefinition(input: RequestDefinitionInput) {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ request: input }),
  });

  return parseJsonResponse<{ request: SavedRequestResourceRecord }>(response).then((payload) => payload.request);
}

export async function runRequestDefinition(input: RequestDefinitionInput) {
  const response = await fetch('/api/executions/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ request: input }),
  });

  return parseJsonResponse<{ execution: RequestRunObservation }>(response).then((payload) => payload.execution);
}


