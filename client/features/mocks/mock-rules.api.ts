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
  return parseJsonResponse<{ items: MockRuleRecord[] }>(response).then((payload) => payload.items);
}

export async function readMockRule(mockRuleId: string) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}`);
  return parseJsonResponse<{ rule: MockRuleRecord }>(response).then((payload) => payload.rule);
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
