import { DEFAULT_WORKSPACE_ID, RequestBuilderApiError } from '@client/features/request-builder/request-builder.api';
import type {
  EnvironmentDetailRecord,
  EnvironmentInput,
  EnvironmentSummaryRecord,
} from '@client/features/environments/environment.types';

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

export const workspaceEnvironmentsQueryKey = ['workspace-environments', DEFAULT_WORKSPACE_ID] as const;
export const environmentDetailQueryKey = (environmentId: string | null) =>
  ['environment', environmentId] as const;

function compareIsoDescending(left: string | undefined, right: string | undefined) {
  return String(right ?? '').localeCompare(String(left ?? ''));
}

export function compareEnvironmentSummaries(left: EnvironmentSummaryRecord, right: EnvironmentSummaryRecord) {
  if (left.isDefault !== right.isDefault) {
    return left.isDefault ? -1 : 1;
  }

  const updatedAtDiff = compareIsoDescending(left.updatedAt, right.updatedAt);
  if (updatedAtDiff !== 0) {
    return updatedAtDiff;
  }

  const createdAtDiff = compareIsoDescending(left.createdAt, right.createdAt);
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  const nameDiff = left.name.localeCompare(right.name);
  if (nameDiff !== 0) {
    return nameDiff;
  }

  return left.id.localeCompare(right.id);
}

export function sortEnvironmentSummaries(records: EnvironmentSummaryRecord[]) {
  return [...records].sort(compareEnvironmentSummaries);
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

export async function listWorkspaceEnvironments() {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/environments`);
  return parseJsonResponse<{ items: EnvironmentSummaryRecord[] }>(response)
    .then((payload) => sortEnvironmentSummaries(payload.items));
}

export async function readEnvironment(environmentId: string) {
  const response = await fetch(`/api/environments/${environmentId}`);
  return parseJsonResponse<{ environment: EnvironmentDetailRecord }>(response).then((payload) => payload.environment);
}

export async function createEnvironment(environment: EnvironmentInput) {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/environments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ environment }),
  });

  return parseJsonResponse<{ environment: EnvironmentDetailRecord }>(response).then((payload) => payload.environment);
}

export async function updateEnvironment(environmentId: string, environment: EnvironmentInput) {
  const response = await fetch(`/api/environments/${environmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ environment }),
  });

  return parseJsonResponse<{ environment: EnvironmentDetailRecord }>(response).then((payload) => payload.environment);
}

export async function deleteEnvironment(environmentId: string) {
  const response = await fetch(`/api/environments/${environmentId}`, {
    method: 'DELETE',
  });

  return parseJsonResponse<{ deletedEnvironmentId: string }>(response).then((payload) => payload.deletedEnvironmentId);
}
