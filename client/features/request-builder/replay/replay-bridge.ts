import type { CaptureRecord, CaptureRequestInputItem } from '@client/features/captures/capture.types';
import type {
  HistoryRecord,
  HistoryRequestAuthSnapshot,
} from '@client/features/history/history.types';
import type {
  HttpMethodLabel,
  ReplayRequestTabSeed,
  RequestTabRecord,
} from '@client/features/request-builder/request-tab.types';
import type { RequestDraftSeed, RequestKeyValueRow } from '@client/features/request-builder/request-draft.types';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';

interface ReplayDraftBridgePayload {
  tabSeed: ReplayRequestTabSeed;
  draftSeed: RequestDraftSeed;
}

function normalizeMethodLabel(method: string): HttpMethodLabel {
  switch (method.toUpperCase()) {
    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
      return method.toUpperCase() as HttpMethodLabel;
    default:
      return 'GET';
  }
}

function createDraftRows(
  items: Array<{ key: string; value: string }>,
  prefix: string,
): RequestKeyValueRow[] {
  return items.map((item, index) => ({
    id: `${prefix}-${index + 1}`,
    key: item.key,
    value: item.value,
    enabled: true,
  }));
}

function splitUrlAndParams(url: string, prefix: string) {
  const normalizedUrl = new URL(url, 'http://localhost');
  const params = Array.from(normalizedUrl.searchParams.entries()).map(([key, value], index) => ({
    id: `${prefix}-${index + 1}`,
    key,
    value,
    enabled: true,
  }));

  normalizedUrl.search = '';
  normalizedUrl.hash = '';

  return {
    url: normalizedUrl.toString(),
    params,
  };
}

function splitCaptureAuth(headers: CaptureRequestInputItem[]) {
  const nextHeaders: CaptureRequestInputItem[] = [];
  let auth: RequestDraftSeed['auth'] | undefined;

  for (const header of headers) {
    if (header.key.toLowerCase() === 'authorization' && header.value.startsWith('Bearer ')) {
      auth = {
        type: 'bearer',
        bearerToken: header.value.slice('Bearer '.length).trim(),
      };
      continue;
    }

    nextHeaders.push(header);
  }

  return {
    auth,
    headers: nextHeaders,
  };
}

function createDraftAuthSeed(auth: HistoryRequestAuthSnapshot): RequestDraftSeed['auth'] | undefined {
  if (auth.type === 'none') {
    return undefined;
  }

  return {
    type: auth.type,
    bearerToken: auth.bearerToken,
    basicUsername: auth.basicUsername,
    basicPassword: auth.basicPassword,
    apiKeyName: auth.apiKeyName,
    apiKeyValue: auth.apiKeyValue,
    apiKeyPlacement: auth.apiKeyPlacement,
  };
}

function buildCaptureReplayPayload(capture: CaptureRecord): ReplayDraftBridgePayload {
  const methodLabel = normalizeMethodLabel(capture.method);
  const replayTitle = `Replay of ${methodLabel} ${capture.path.split('?')[0] || capture.path}`;
  const parsedUrl = splitUrlAndParams(capture.url, `capture-param-${capture.id}`);
  const splitAuth = splitCaptureAuth(capture.requestHeaders);

  return {
    tabSeed: {
      title: replayTitle,
      methodLabel,
      summary: `Replay draft created from capture ${capture.host}${capture.path}.`,
      replaySource: {
        kind: 'capture',
        label: 'Opened from capture',
        description: `${methodLabel} ${capture.host}${capture.path} captured at ${capture.receivedAtLabel}.`,
        methodLabel,
        targetLabel: `${capture.host}${capture.path}`,
        timestampLabel: capture.receivedAtLabel,
      },
    },
    draftSeed: {
      name: replayTitle,
      method: methodLabel,
      url: parsedUrl.url,
      params: parsedUrl.params,
      headers: createDraftRows(splitAuth.headers, `capture-header-${capture.id}`),
      bodyMode: capture.bodyModeHint,
      bodyText: capture.bodyModeHint === 'none' ? '' : capture.bodyPreview,
      ...(splitAuth.auth ? { auth: splitAuth.auth } : {}),
    },
  };
}

function buildHistoryReplayPayload(history: HistoryRecord): ReplayDraftBridgePayload {
  const methodLabel = normalizeMethodLabel(history.method);
  const replayTitle = `Replay of ${history.requestLabel}`;
  const parsedUrl = splitUrlAndParams(history.url, `history-query-${history.id}`);
  const explicitParams = history.requestParams.length > 0
    ? createDraftRows(history.requestParams, `history-param-${history.id}`)
    : parsedUrl.params;
  const authSeed = createDraftAuthSeed(history.requestAuth);

  return {
    tabSeed: {
      title: replayTitle,
      methodLabel,
      summary: `Replay draft created from history ${history.requestLabel}.`,
      replaySource: {
        kind: 'history',
        label: 'Opened from history',
        description: `${methodLabel} ${history.hostPathHint} executed at ${history.executedAtLabel}.`,
        methodLabel,
        targetLabel: history.hostPathHint,
        timestampLabel: history.executedAtLabel,
      },
    },
    draftSeed: {
      name: replayTitle,
      method: methodLabel,
      url: parsedUrl.url,
      selectedEnvironmentId: history.environmentId ?? null,
      params: explicitParams,
      headers: createDraftRows(history.requestHeaders, `history-header-${history.id}`),
      bodyMode: history.requestBodyMode,
      bodyText: history.requestBodyMode === 'none' ? '' : history.requestBodyText,
      ...(authSeed ? { auth: authSeed } : {}),
    },
  };
}

function openReplayDraft(payload: ReplayDraftBridgePayload): RequestTabRecord {
  const replayTab = useWorkspaceShellStore.getState().openReplayRequest(payload.tabSeed);
  useRequestDraftStore.getState().ensureDraftForTab(replayTab, payload.draftSeed);
  return replayTab;
}

export function openCaptureReplayDraft(capture: CaptureRecord) {
  return openReplayDraft(buildCaptureReplayPayload(capture));
}

export function openHistoryReplayDraft(history: HistoryRecord) {
  return openReplayDraft(buildHistoryReplayPayload(history));
}

export function buildReplayDraftSeedFromCapture(capture: CaptureRecord) {
  return buildCaptureReplayPayload(capture);
}

export function buildReplayDraftSeedFromHistory(history: HistoryRecord) {
  return buildHistoryReplayPayload(history);
}
