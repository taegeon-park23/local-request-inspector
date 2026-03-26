import type {
  RequestDraftAuthState,
  RequestDraftSeed,
  RequestDraftScriptsState,
  RequestDraftState,
  RequestKeyValueRow,
  RequestRowValueType,
} from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord, SavedWorkspaceRequestSeed } from '@client/features/request-builder/request-tab.types';
import type { EnvironmentResolutionSummary } from '@client/shared/environment-resolution-summary';
import {
  createRequestPlacementFields,
  readRequestGroupName,
  resolveRequestPlacement,
} from '@client/features/request-builder/request-placement';
import { normalizeRequestScriptsState } from '@client/features/request-builder/request-script-binding';

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
  ifMatchUpdatedAt?: string | null;
  workspaceId?: string;
  name: string;
  method: RequestDraftState['method'];
  url: string;
  selectedEnvironmentId?: string | null;
  params: RequestKeyValueRow[];
  headers: RequestKeyValueRow[];
  bodyMode: RequestDraftState['bodyMode'];
  bodyText: string;
  formBody: RequestKeyValueRow[];
  multipartBody: RequestKeyValueRow[];
  auth: RequestDraftAuthState;
  scripts: RequestDraftScriptsState;
  collectionId?: string;
  collectionName?: string;
  requestGroupId?: string;
  requestGroupName?: string;

}

export interface SavedRequestResourceRecord extends RequestDefinitionInput {
  id: string;
  workspaceId: string;
  summary: string;
  collectionName: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceSavedRequestResourceSeed extends SavedWorkspaceRequestSeed {
  resourceKind: 'persisted' | 'starter';
  draftSeed?: RequestDraftSeed;
}

export type RequestExecutionOutcome = 'Succeeded' | 'Failed' | 'Blocked' | 'Timed out';
export type RequestScriptStageOutcome = 'Succeeded' | 'Failed' | 'Blocked' | 'Timed out' | 'Skipped';
export type RequestExecutionStageId = 'pre-request' | 'transport' | 'post-response' | 'tests';
export interface RequestAssertionResult {
  id: string;
  name: string;
  status: 'passed' | 'failed';
  message: string;
}

export interface RequestAssertionSummary {
  total: number;
  passed: number;
  failed: number;
}

export interface RequestExecutionStageSummary {
  stageId: RequestExecutionStageId;
  label: string;
  status: RequestScriptStageOutcome;
  summary: string;
  errorCode?: string;
  errorSummary?: string;
}

export interface RequestRunObservation {
  executionId: string;
  executionOutcome: RequestExecutionOutcome;
  responseStatus: number | null;
  responseStatusLabel: string;
  responseHeaders: Array<{ name: string; value: string }>;
  responseHeadersSummary: string;
  responseBodyPreview: string;
  responseBodyHint: string;
  responsePreviewSizeLabel?: string;
  responsePreviewPolicy?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  consoleSummary: string;
  consoleEntries: string[];
  consoleLogCount?: number;
  consoleWarningCount?: number;
  testsSummary: string;
  testEntries: string[];
  assertionResults?: RequestAssertionResult[];
  assertionSummary?: RequestAssertionSummary;
  requestSnapshotSummary?: string;
  requestInputSummary?: string;
  requestHeaderCount?: number;
  requestParamCount?: number;
  requestBodyMode?: RequestDraftState['bodyMode'];
  authSummary?: string;
  requestResourceId?: string | null;
  environmentId?: string | null;
  environmentLabel?: string;
  environmentResolutionSummary?: EnvironmentResolutionSummary;
  requestCollectionName?: string;
  requestGroupName?: string;

  requestSourceLabel?: string;
  errorCode?: string;
  errorSummary?: string;
  stageSummaries?: RequestExecutionStageSummary[];
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

const BACKEND_UNAVAILABLE_ERROR_PATTERN = /(ECONNREFUSED|EHOSTUNREACH|ENOTFOUND|proxy error|socket hang up|fetch failed|Failed to fetch)/i;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseJsonPayload(responseText: string) {
  if (responseText.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return null;
  }
}

function readErrorEnvelope(payload: unknown): ApiErrorEnvelope | null {
  if (!isObjectRecord(payload) || !isObjectRecord(payload.error)) {
    return null;
  }

  const errorPayload = payload.error;
  if (typeof errorPayload.message !== 'string') {
    return null;
  }

  return {
    error: {
      code: typeof errorPayload.code === 'string' ? errorPayload.code : 'request_builder_api_error',
      message: errorPayload.message,
      ...(isObjectRecord(errorPayload.details) ? { details: errorPayload.details } : {}),
      ...(typeof errorPayload.retryable === 'boolean' ? { retryable: errorPayload.retryable } : {}),
    },
  };
}

function hasDataEnvelope<TData>(payload: unknown): payload is ApiEnvelope<TData> {
  return isObjectRecord(payload) && Object.prototype.hasOwnProperty.call(payload, 'data');
}

function createFallbackApiError(response: Response, responseText: string) {
  const transportHintSource = `${response.statusText} ${responseText}`;
  if (response.status >= 500 && BACKEND_UNAVAILABLE_ERROR_PATTERN.test(transportHintSource)) {
    return new RequestBuilderApiError({
      message: 'Backend API is unavailable. Start the local server (npm.cmd run dev:app or npm.cmd run dev:server) and retry.',
      code: 'backend_unavailable',
      details: {
        statusText: response.statusText,
      },
      retryable: true,
      status: response.status,
    });
  }

  return new RequestBuilderApiError({
    message: `Request failed with status ${response.status}`,
    status: response.status,
  });
}
function normalizeRowValueType(
  valueType: RequestKeyValueRow['valueType'],
  allowFileValues: boolean,
): RequestRowValueType {
  return allowFileValues && valueType === 'file' ? 'file' : 'text';
}

function cloneRows(
  rows: RequestKeyValueRow[] | undefined,
  options: {
    allowFileValues?: boolean;
    sanitizeFileValues?: boolean;
  } = {},
) {
  const allowFileValues = options.allowFileValues === true;
  const sanitizeFileValues = options.sanitizeFileValues === true;

  return (rows ?? []).map((row) => {
    const valueType = normalizeRowValueType(row.valueType, allowFileValues);
    const normalizedValue = typeof row.value === 'string' ? row.value : '';

    return {
      ...row,
      valueType,
      value: valueType === 'file' && sanitizeFileValues ? '' : normalizedValue,
    };
  });
}

function cloneAuth(auth: RequestDraftAuthState): RequestDraftAuthState {
  return {
    ...auth,
  };
}

function cloneScripts(scripts: RequestDraftScriptsState): RequestDraftScriptsState {
  return normalizeRequestScriptsState(scripts);
}

function normalizeSavedRequestResourceRecord(record: SavedRequestResourceRecord): SavedRequestResourceRecord {
  return {
    ...record,
    params: cloneRows(record.params),
    headers: cloneRows(record.headers),
    formBody: cloneRows(record.formBody),
    multipartBody: cloneRows(record.multipartBody, { allowFileValues: true, sanitizeFileValues: true }),
    scripts: normalizeRequestScriptsState(record.scripts),
  };
}

function compareIsoDescending(left: string | undefined, right: string | undefined) {
  return String(right ?? '').localeCompare(String(left ?? ''));
}

export function compareSavedRequestResources(left: SavedRequestResourceRecord, right: SavedRequestResourceRecord) {
  const updatedAtDiff = compareIsoDescending(left.updatedAt, right.updatedAt);
  if (updatedAtDiff !== 0) {
    return updatedAtDiff;
  }

  const createdAtDiff = compareIsoDescending(left.createdAt, right.createdAt);
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  const collectionDiff = String(left.collectionName || DEFAULT_REQUEST_COLLECTION_NAME).localeCompare(
    String(right.collectionName || DEFAULT_REQUEST_COLLECTION_NAME),
  );
  if (collectionDiff !== 0) {
    return collectionDiff;
  }

  const requestGroupDiff = String(readRequestGroupName(left) || '').localeCompare(
    String(readRequestGroupName(right) || ''),
  );
  if (requestGroupDiff !== 0) {
    return requestGroupDiff;
  }

  const nameDiff = left.name.localeCompare(right.name);
  if (nameDiff !== 0) {
    return nameDiff;
  }

  return left.id.localeCompare(right.id);
}

export function sortSavedRequestResources(records: SavedRequestResourceRecord[]) {
  return [...records].sort(compareSavedRequestResources);
}

export async function parseApiJsonResponse<TData>(response: Response): Promise<TData> {
  const responseText = await response.text();
  const payload = parseJsonPayload(responseText);

  if (!response.ok) {
    const errorPayload = readErrorEnvelope(payload);
    if (!errorPayload) {
      throw createFallbackApiError(response, responseText);
    }

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

  if (!hasDataEnvelope<TData>(payload)) {
    throw new RequestBuilderApiError({
      message: 'Server returned a non-JSON API payload.',
      code: 'invalid_api_response',
      details: {
        statusText: response.statusText,
      },
      retryable: true,
      status: response.status,
    });
  }

  return payload.data;
}

export function createRequestDefinitionInput(
  activeTab: RequestTabRecord,
  draft: RequestDraftState,
  options?: { fallbackTitle?: string },
): RequestDefinitionInput {
  const placement = resolveRequestPlacement(draft, activeTab);
  const resolvedName = draft.name.trim() || options?.fallbackTitle?.trim() || activeTab.title;

  return {
    ...(activeTab.requestId ? { id: activeTab.requestId } : {}),
    workspaceId: DEFAULT_WORKSPACE_ID,
    name: resolvedName,
    method: draft.method,
    url: draft.url,
    selectedEnvironmentId: draft.selectedEnvironmentId ?? null,
    params: cloneRows(draft.params),
    headers: cloneRows(draft.headers),
    bodyMode: draft.bodyMode,
    bodyText: draft.bodyText,
    formBody: cloneRows(draft.formBody),
    multipartBody: cloneRows(draft.multipartBody, { allowFileValues: true, sanitizeFileValues: true }),
    auth: cloneAuth(draft.auth),
    scripts: cloneScripts(draft.scripts),
    ...createRequestPlacementFields({
      ...placement,
      collectionName: placement.collectionName ?? DEFAULT_REQUEST_COLLECTION_NAME,
    }),
  };
}

export function mapSavedRequestResourceToWorkspaceSeed(
  record: SavedRequestResourceRecord,
): WorkspaceSavedRequestResourceSeed {
  const placement = createRequestPlacementFields(record);

  return {
    id: record.id,
    name: record.name,
    methodLabel: record.method,
    summary: record.summary,
    updatedAt: record.updatedAt,
    collectionName: record.collectionName,
    ...placement,
    resourceKind: 'persisted',
    draftSeed: {
      name: record.name,
      method: record.method,
      url: record.url,
      selectedEnvironmentId: record.selectedEnvironmentId ?? null,
      params: cloneRows(record.params),
      headers: cloneRows(record.headers),
      bodyMode: record.bodyMode,
      bodyText: record.bodyText,
      formBody: cloneRows(record.formBody),
      multipartBody: cloneRows(record.multipartBody, { allowFileValues: true, sanitizeFileValues: true }),
      auth: cloneAuth(record.auth),
      scripts: cloneScripts(record.scripts),
      ...placement,
    },
  };
}

export function upsertSavedRequestResource(
  records: SavedRequestResourceRecord[],
  nextRecord: SavedRequestResourceRecord,
) {
  const nextRecords = records.filter((record) => record.id !== nextRecord.id);
  return sortSavedRequestResources([nextRecord, ...nextRecords]);
}

export async function listWorkspaceSavedRequests() {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/requests`);
  return parseApiJsonResponse<{ items: SavedRequestResourceRecord[] }>(response)
    .then((payload) => sortSavedRequestResources(payload.items.map(normalizeSavedRequestResourceRecord)));
}

export async function saveRequestDefinition(input: RequestDefinitionInput) {
  const isUpdate = typeof input.id === 'string' && input.id.trim().length > 0;
  const response = await fetch(
    isUpdate ? `/api/requests/${input.id}` : `/api/workspaces/${DEFAULT_WORKSPACE_ID}/requests`,
    {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request: {
          ...input,
          ifMatchUpdatedAt: isUpdate
            ? (typeof input.ifMatchUpdatedAt === 'string' && input.ifMatchUpdatedAt.trim().length > 0
              ? input.ifMatchUpdatedAt.trim()
              : null)
            : undefined,
        },
      }),
    },
  );

  return parseApiJsonResponse<{ request: SavedRequestResourceRecord }>(response)
    .then((payload) => normalizeSavedRequestResourceRecord(payload.request));
}

export async function runRequestDefinition(input: RequestDefinitionInput) {
  const response = await fetch('/api/executions/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ request: input }),
  });

  return parseApiJsonResponse<{ execution: RequestRunObservation }>(response).then((payload) => payload.execution);
}

export async function runRequestDefinitionWithUpload(
  input: RequestDefinitionInput,
  multipartFilesByRowId: Record<string, File[]>,
) {
  const formData = new FormData();
  formData.append('request', JSON.stringify(input));

  for (const [rowId, files] of Object.entries(multipartFilesByRowId)) {
    for (const file of files) {
      formData.append(`file:${rowId}`, file);
    }
  }

  const response = await fetch('/api/executions/run-upload', {
    method: 'POST',
    body: formData,
  });

  return parseApiJsonResponse<{ execution: RequestRunObservation }>(response).then((payload) => payload.execution);
}
















