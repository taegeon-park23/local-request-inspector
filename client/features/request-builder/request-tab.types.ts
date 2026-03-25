export type HttpMethodLabel = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestReplaySourceKind = 'capture' | 'history';

export interface RequestReplaySourceCue {
  kind: RequestReplaySourceKind;
  label: string;
  description: string;
  methodLabel?: HttpMethodLabel;
  targetLabel?: string;
  timestampLabel?: string;
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
  collectionId?: string;
  collectionName: string;
  requestGroupId?: string;
  requestGroupName?: string;
}

export interface RequestTabRecord {
  id: string;
  sourceKey: string;
  title: string;
  methodLabel: HttpMethodLabel;
  source: 'saved' | 'quick' | 'replay' | 'detached';
  tabMode: 'preview' | 'pinned';
  summary: string;
  requestId?: string;
  collectionId?: string;
  collectionName?: string;
  requestGroupId?: string;
  requestGroupName?: string;
  replaySource?: RequestReplaySourceCue;
  hasUnsavedChanges: boolean;
}



