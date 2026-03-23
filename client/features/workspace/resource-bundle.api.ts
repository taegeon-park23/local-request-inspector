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
export const AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION = 2;

export interface AuthoredResourceCollectionRecord {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
}

export interface AuthoredResourceRequestGroupRecord {
  id: string;
  workspaceId: string;
  collectionId: string;
  name: string;
  description?: string;
}

export interface AuthoredResourceBundleExport {
  schemaVersion: number;
  resourceKind: string;
  exportedAt: string;
  workspaceId: string;
  collections: AuthoredResourceCollectionRecord[];
  requestGroups: AuthoredResourceRequestGroupRecord[];
  requests: SavedRequestResourceRecord[];
  mockRules: MockRuleRecord[];
}

export interface AuthoredResourceBundleImportRejection {
  kind: 'bundle' | 'request' | 'mock-rule';
  name?: string;
  reason: string;
}

export interface AuthoredResourceBundleImportRejectedReasonSummary {
  reason: string;
  count: number;
}

export interface AuthoredResourceBundleImportSummary {
  acceptedCount: number;
  rejectedCount: number;
  createdCollectionCount: number;
  createdRequestGroupCount: number;
  createdRequestCount: number;
  createdMockRuleCount: number;
  renamedCount: number;
  importedNamesPreview: string[];
  rejectedReasonSummary: AuthoredResourceBundleImportRejectedReasonSummary[];
  duplicateIdentityPolicy: 'new_identity';
}

export interface AuthoredResourceBundleImportResult {
  acceptedCollections: AuthoredResourceCollectionRecord[];
  acceptedRequestGroups: AuthoredResourceRequestGroupRecord[];
  acceptedRequests: SavedRequestResourceRecord[];
  acceptedMockRules: MockRuleRecord[];
  rejected: AuthoredResourceBundleImportRejection[];
  summary: AuthoredResourceBundleImportSummary;
}

export interface AuthoredResourceBundleImportPreviewResult {
  rejected: AuthoredResourceBundleImportRejection[];
  summary: AuthoredResourceBundleImportSummary;
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

export function downloadAuthoredResourceBundle(
  bundle: AuthoredResourceBundleExport,
  fileNameBase = `local-request-inspector-${bundle.workspaceId}-resources`,
) {
  if (typeof URL.createObjectURL !== 'function') {
    throw new Error('Browser download APIs are unavailable for resource export.');
  }

  const objectUrl = URL.createObjectURL(
    new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
  );

  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${fileNameBase}-${bundle.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function exportWorkspaceResources() {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/resource-bundle`);
  return parseJsonResponse<{ bundle: AuthoredResourceBundleExport }>(response).then((payload) => ({
    ...payload.bundle,
    collections: [...(payload.bundle.collections ?? [])],
    requestGroups: [...(payload.bundle.requestGroups ?? [])],
    requests: [...payload.bundle.requests],
    mockRules: sortMockRuleRecords(payload.bundle.mockRules),
  }));
}

export async function exportSavedRequestResource(requestId: string) {
  const response = await fetch(`/api/requests/${requestId}/resource-bundle`);
  return parseJsonResponse<{ bundle: AuthoredResourceBundleExport }>(response).then((payload) => ({
    ...payload.bundle,
    collections: [...(payload.bundle.collections ?? [])],
    requestGroups: [...(payload.bundle.requestGroups ?? [])],
    requests: [...payload.bundle.requests],
    mockRules: sortMockRuleRecords(payload.bundle.mockRules),
  }));
}

export async function exportMockRuleResource(mockRuleId: string) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}/resource-bundle`);
  return parseJsonResponse<{ bundle: AuthoredResourceBundleExport }>(response).then((payload) => ({
    ...payload.bundle,
    collections: [...(payload.bundle.collections ?? [])],
    requestGroups: [...(payload.bundle.requestGroups ?? [])],
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
    acceptedCollections: [...(payload.result.acceptedCollections ?? [])],
    acceptedRequestGroups: [...(payload.result.acceptedRequestGroups ?? [])],
    acceptedRequests: [...payload.result.acceptedRequests],
    acceptedMockRules: sortMockRuleRecords(payload.result.acceptedMockRules),
    rejected: [...payload.result.rejected],
    summary: {
      ...payload.result.summary,
      importedNamesPreview: [...payload.result.summary.importedNamesPreview],
      rejectedReasonSummary: [...payload.result.summary.rejectedReasonSummary],
    },
  }));
}

export async function previewWorkspaceResources(bundleText: string) {
  const response = await fetch(`/api/workspaces/${DEFAULT_WORKSPACE_ID}/resource-bundle/import-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bundleText }),
  });

  return parseJsonResponse<{ preview: AuthoredResourceBundleImportPreviewResult }>(response).then((payload) => ({
    rejected: [...payload.preview.rejected],
    summary: {
      ...payload.preview.summary,
      importedNamesPreview: [...payload.preview.summary.importedNamesPreview],
      rejectedReasonSummary: [...payload.preview.summary.rejectedReasonSummary],
    },
  }));
}
