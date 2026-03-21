import {
  DEFAULT_WORKSPACE_ID,
  RequestBuilderApiError,
  type SavedRequestResourceRecord,
} from '@client/features/request-builder/request-builder.api';
import {
  sortMockRuleRecords,
} from '@client/features/mocks/mock-rules.api';
import type { MockRuleRecord } from '@client/features/mocks/mock-rule.types';

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

export const AUTHORED_RESOURCE_BUNDLE_KIND = 'local-request-inspector-authored-resource-bundle';
export const AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION = 1;

export interface AuthoredResourceBundleExport {
  schemaVersion: number;
  resourceKind: string;
  exportedAt: string;
  workspaceId: string;
  requests: SavedRequestResourceRecord[];
  mockRules: MockRuleRecord[];
}

export interface AuthoredResourceBundleImportRejection {
  kind: 'bundle' | 'request' | 'mock-rule';
  name?: string;
  reason: string;
}

export interface AuthoredResourceBundleImportResult {
  acceptedRequests: SavedRequestResourceRecord[];
  acceptedMockRules: MockRuleRecord[];
  rejected: AuthoredResourceBundleImportRejection[];
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

export async function exportWorkspaceResources() {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/resource-bundle`);
  return parseJsonResponse<{ bundle: AuthoredResourceBundleExport }>(response).then((payload) => ({
    ...payload.bundle,
    requests: [...payload.bundle.requests],
    mockRules: sortMockRuleRecords(payload.bundle.mockRules),
  }));
}

export async function importWorkspaceResources(bundleText: string) {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/resource-bundle/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bundleText }),
  });

  return parseJsonResponse<{ result: AuthoredResourceBundleImportResult }>(response).then((payload) => ({
    ...payload.result,
    acceptedRequests: [...payload.result.acceptedRequests],
    acceptedMockRules: sortMockRuleRecords(payload.result.acceptedMockRules),
    rejected: [...payload.result.rejected],
  }));
}
