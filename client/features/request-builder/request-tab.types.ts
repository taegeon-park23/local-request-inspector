export type HttpMethodLabel = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestReplaySourceKind = 'capture' | 'history';

export interface RequestReplaySourceCue {
  kind: RequestReplaySourceKind;
  label: string;
  description: string;
}

export interface ReplayRequestTabSeed {
  title: string;
  methodLabel: HttpMethodLabel;
  summary: string;
  replaySource: RequestReplaySourceCue;
}

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
  source: 'saved' | 'draft' | 'replay';
  summary: string;
  requestId?: string;
  collectionName?: string;
  folderName?: string;
  replaySource?: RequestReplaySourceCue;
  hasUnsavedChanges: boolean;
}
