import { DEFAULT_WORKSPACE_ID, parseApiJsonResponse } from '@client/features/request-builder/request-builder.api';
import type {
  MockRuleInput,
  MockRuleRecord,
} from '@client/features/mocks/mock-rule.types';

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

export async function listWorkspaceMockRules() {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/mock-rules`);
  return parseApiJsonResponse<{ items: MockRuleRecord[] }>(response).then((payload) => sortMockRuleRecords(payload.items));
}

export async function readMockRule(mockRuleId: string) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}`);
  return parseApiJsonResponse<{ rule: MockRuleRecord }>(response).then((payload) => payload.rule);
}

export async function exportMockRuleResource(mockRuleId: string) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}/resource-bundle`);
  return parseApiJsonResponse<{
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

  return parseApiJsonResponse<{ rule: MockRuleRecord }>(response).then((payload) => payload.rule);
}

export async function updateMockRule(mockRuleId: string, rule: MockRuleInput) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rule }),
  });

  return parseApiJsonResponse<{ rule: MockRuleRecord }>(response).then((payload) => payload.rule);
}

export async function deleteMockRule(mockRuleId: string) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}`, {
    method: 'DELETE',
  });

  return parseApiJsonResponse<{ deletedRuleId: string }>(response).then((payload) => payload.deletedRuleId);
}

export async function setMockRuleEnabled(mockRuleId: string, enabled: boolean) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}/${enabled ? 'enable' : 'disable'}`, {
    method: 'POST',
  });

  return parseApiJsonResponse<{ rule: MockRuleRecord }>(response).then((payload) => payload.rule);
}
