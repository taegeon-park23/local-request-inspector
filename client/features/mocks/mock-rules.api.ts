import { DEFAULT_WORKSPACE_ID, RequestBuilderApiError } from '@client/features/request-builder/request-builder.api';
import type {
  MockRuleInput,
  MockRuleRecord,
} from '@client/features/mocks/mock-rule.types';

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

export const workspaceMockRulesQueryKey = ['workspace-mock-rules', DEFAULT_WORKSPACE_ID] as const;
export const mockRuleDetailQueryKey = (mockRuleId: string | null) =>
  ['mock-rule', mockRuleId] as const;

function compareIsoDescending(left: string | undefined, right: string | undefined) {
  return String(right ?? '').localeCompare(String(left ?? ''));
}

export function compareMockRuleRecords(left: MockRuleRecord, right: MockRuleRecord) {
  if (left.enabled !== right.enabled) {
    return left.enabled ? -1 : 1;
  }

  if (left.priority !== right.priority) {
    return right.priority - left.priority;
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

export function sortMockRuleRecords(records: MockRuleRecord[]) {
  return [...records].sort(compareMockRuleRecords);
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

export async function listWorkspaceMockRules() {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/mock-rules`);
  return parseJsonResponse<{ items: MockRuleRecord[] }>(response).then((payload) => sortMockRuleRecords(payload.items));
}

export async function readMockRule(mockRuleId: string) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}`);
  return parseJsonResponse<{ rule: MockRuleRecord }>(response).then((payload) => payload.rule);
}

export async function exportMockRuleResource(mockRuleId: string) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}/resource-bundle`);
  return parseJsonResponse<{
    bundle: {
      schemaVersion: number;
      resourceKind: string;
      exportedAt: string;
      workspaceId: string;
      collections: [];
      requestGroups: [];
      requests: [];
      mockRules: MockRuleRecord[];
      scripts: [];
    };
  }>(response).then((payload) => ({
    ...payload.bundle,
    mockRules: sortMockRuleRecords(payload.bundle.mockRules),
  }));
}

export async function createMockRule(rule: MockRuleInput) {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/mock-rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rule }),
  });

  return parseJsonResponse<{ rule: MockRuleRecord }>(response).then((payload) => payload.rule);
}

export async function updateMockRule(mockRuleId: string, rule: MockRuleInput) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rule }),
  });

  return parseJsonResponse<{ rule: MockRuleRecord }>(response).then((payload) => payload.rule);
}

export async function deleteMockRule(mockRuleId: string) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}`, {
    method: 'DELETE',
  });

  return parseJsonResponse<{ deletedRuleId: string }>(response).then((payload) => payload.deletedRuleId);
}

export async function setMockRuleEnabled(mockRuleId: string, enabled: boolean) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}/${enabled ? 'enable' : 'disable'}`, {
    method: 'POST',
  });

  return parseJsonResponse<{ rule: MockRuleRecord }>(response).then((payload) => payload.rule);
}
