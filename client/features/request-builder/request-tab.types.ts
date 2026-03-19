export type HttpMethodLabel = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SavedWorkspaceRequestSeed {
  id: string;
  name: string;
  methodLabel: HttpMethodLabel;
  summary: string;
  collectionName: string;
  folderName?: string;
}

export interface RequestTabRecord {
  id: string;
  sourceKey: string;
  title: string;
  methodLabel: HttpMethodLabel;
  source: 'saved' | 'draft';
  summary: string;
  requestId?: string;
  collectionName?: string;
  folderName?: string;
  hasUnsavedChanges: boolean;
}
