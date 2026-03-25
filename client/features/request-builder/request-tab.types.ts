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
  updatedAt?: string | null;
}

export type RequestTabSaveState = 'idle' | 'pending' | 'saved' | 'error' | 'conflict';
export type RequestTabRunState = 'idle' | 'pending' | 'success' | 'error';
export type WorkbenchTabSource =
  | 'saved'
  | 'quick'
  | 'replay'
  | 'detached'
  | 'collection-overview'
  | 'request-group-overview'
  | 'batch-result';

export interface RequestTabStatusMeta {
  saveState: RequestTabSaveState;
  runState: RequestTabRunState;
  savedAt: string | null;
  conflictUpdatedAt: string | null;
}

export function createDefaultRequestTabStatusMeta(): RequestTabStatusMeta {
  return {
    saveState: 'idle',
    runState: 'idle',
    savedAt: null,
    conflictUpdatedAt: null,
  };
}

export interface RequestTabRecord {
  id: string;
  sourceKey: string;
  title: string;
  methodLabel: HttpMethodLabel;
  source: WorkbenchTabSource;
  tabMode: 'preview' | 'pinned';
  summary: string;
  requestId?: string;
  collectionId?: string;
  collectionName?: string;
  requestGroupId?: string;
  requestGroupName?: string;
  batchExecutionId?: string | null;
  replaySource?: RequestReplaySourceCue;
  hasUnsavedChanges: boolean;
  persistedUpdatedAt?: string | null;
  statusMeta?: RequestTabStatusMeta;
}
