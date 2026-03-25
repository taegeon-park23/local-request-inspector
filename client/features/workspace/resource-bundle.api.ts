import {
  DEFAULT_WORKSPACE_ID,
  parseApiJsonResponse,
  type SavedRequestResourceRecord,
} from '@client/features/request-builder/request-builder.api';
import {
  sortMockRuleRecords,
} from '@client/features/mocks/mock-rules.api';
import type { MockRuleRecord } from '@client/features/mocks/mock-rule.types';
import { sortSavedScripts } from '@client/features/scripts/scripts.api';
import type { SavedScriptRecord } from '@client/features/scripts/scripts.types';

export const AUTHORED_RESOURCE_BUNDLE_KIND = 'local-request-inspector-authored-resource-bundle';
export const AUTHORED_RESOURCE_BUNDLE_SCHEMA_VERSION = 3;

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
  scripts: SavedScriptRecord[];
}

export interface AuthoredResourceBundleImportRejection {
  kind: 'bundle' | 'collection' | 'request-group' | 'request' | 'mock-rule' | 'script';
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
  createdScriptCount: number;
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
  acceptedScripts: SavedScriptRecord[];
  rejected: AuthoredResourceBundleImportRejection[];
  summary: AuthoredResourceBundleImportSummary;
}

export interface AuthoredResourceBundleImportPreviewResult {
  rejected: AuthoredResourceBundleImportRejection[];
  summary: AuthoredResourceBundleImportSummary;
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
  return parseApiJsonResponse<{ bundle: AuthoredResourceBundleExport }>(response).then((payload) => ({
    ...payload.bundle,
    collections: [...(payload.bundle.collections ?? [])],
    requestGroups: [...(payload.bundle.requestGroups ?? [])],
    requests: [...payload.bundle.requests],
    mockRules: sortMockRuleRecords(payload.bundle.mockRules),
    scripts: sortSavedScripts(payload.bundle.scripts ?? []),
  }));
}

export async function exportSavedRequestResource(requestId: string) {
  const response = await fetch(`/api/requests/${requestId}/resource-bundle`);
  return parseApiJsonResponse<{ bundle: AuthoredResourceBundleExport }>(response).then((payload) => ({
    ...payload.bundle,
    collections: [...(payload.bundle.collections ?? [])],
    requestGroups: [...(payload.bundle.requestGroups ?? [])],
    requests: [...payload.bundle.requests],
    mockRules: sortMockRuleRecords(payload.bundle.mockRules),
    scripts: sortSavedScripts(payload.bundle.scripts ?? []),
  }));
}

export async function exportMockRuleResource(mockRuleId: string) {
  const response = await fetch(`/api/mock-rules/${mockRuleId}/resource-bundle`);
  return parseApiJsonResponse<{ bundle: AuthoredResourceBundleExport }>(response).then((payload) => ({
    ...payload.bundle,
    collections: [...(payload.bundle.collections ?? [])],
    requestGroups: [...(payload.bundle.requestGroups ?? [])],
    requests: [...payload.bundle.requests],
    mockRules: sortMockRuleRecords(payload.bundle.mockRules),
    scripts: sortSavedScripts(payload.bundle.scripts ?? []),
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

  return parseApiJsonResponse<{ result: AuthoredResourceBundleImportResult }>(response).then((payload) => ({
    ...payload.result,
    acceptedCollections: [...(payload.result.acceptedCollections ?? [])],
    acceptedRequestGroups: [...(payload.result.acceptedRequestGroups ?? [])],
    acceptedRequests: [...payload.result.acceptedRequests],
    acceptedMockRules: sortMockRuleRecords(payload.result.acceptedMockRules),
    acceptedScripts: sortSavedScripts(payload.result.acceptedScripts ?? []),
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

  return parseApiJsonResponse<{ preview: AuthoredResourceBundleImportPreviewResult }>(response).then((payload) => ({
    rejected: [...payload.preview.rejected],
    summary: {
      ...payload.preview.summary,
      importedNamesPreview: [...payload.preview.summary.importedNamesPreview],
      rejectedReasonSummary: [...payload.preview.summary.rejectedReasonSummary],
    },
  }));
}

