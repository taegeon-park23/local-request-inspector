import { create } from 'zustand';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import type {
  RequestDraftAuthState,
  RequestDraftSeed,
  RequestDraftState,
  RequestEditorTabId,
} from '@client/features/request-builder/request-draft.types';
import { getSavedWorkspaceRequestSeedById } from '@client/features/workspace/data/workspace-explorer-fixtures';

interface RequestDraftEntry {
  baseline: string;
  draft: RequestDraftState;
}

type DraftRowTarget = 'params' | 'headers' | 'formBody' | 'multipartBody';
type DraftRowField = 'key' | 'value' | 'enabled';

interface RequestDraftStoreState {
  draftsByTabId: Record<string, RequestDraftEntry>;
  nextRowSequence: number;
  ensureDraftForTab: (tab: RequestTabRecord) => void;
  removeDraft: (tabId: string) => void;
  updateDraftName: (tabId: string, name: string) => void;
  updateDraftMethod: (tabId: string, method: RequestDraftState['method']) => void;
  updateDraftUrl: (tabId: string, url: string) => void;
  setActiveEditorTab: (tabId: string, editorTab: RequestEditorTabId) => void;
  addRow: (tabId: string, target: DraftRowTarget) => void;
  updateRow: (tabId: string, target: DraftRowTarget, rowId: string, field: DraftRowField, value: string | boolean) => void;
  removeRow: (tabId: string, target: DraftRowTarget, rowId: string) => void;
  updateBodyMode: (tabId: string, bodyMode: RequestDraftState['bodyMode']) => void;
  updateBodyText: (tabId: string, bodyText: string) => void;
  updateAuthType: (tabId: string, authType: RequestDraftAuthState['type']) => void;
  updateAuthField: (tabId: string, field: keyof Omit<RequestDraftAuthState, 'type'>, value: string) => void;
}

const initialRequestDraftStoreState: Pick<RequestDraftStoreState, 'draftsByTabId' | 'nextRowSequence'> = {
  draftsByTabId: {},
  nextRowSequence: 1,
};

function createDefaultAuthState(seed?: RequestDraftSeed['auth']): RequestDraftAuthState {
  return {
    type: seed?.type ?? 'none',
    bearerToken: seed?.bearerToken ?? '',
    basicUsername: seed?.basicUsername ?? '',
    basicPassword: seed?.basicPassword ?? '',
    apiKeyName: seed?.apiKeyName ?? '',
    apiKeyValue: seed?.apiKeyValue ?? '',
    apiKeyPlacement: seed?.apiKeyPlacement ?? 'header',
  };
}

function createDraftSnapshotString(draft: RequestDraftState) {
  return JSON.stringify({
    name: draft.name,
    method: draft.method,
    url: draft.url,
    params: draft.params,
    headers: draft.headers,
    bodyMode: draft.bodyMode,
    bodyText: draft.bodyText,
    formBody: draft.formBody,
    multipartBody: draft.multipartBody,
    auth: draft.auth,
  });
}

function withDirtyState(entry: RequestDraftEntry, draft: RequestDraftState): RequestDraftEntry {
  const baseline = entry.baseline;
  const nextDraft = {
    ...draft,
    dirty: createDraftSnapshotString(draft) !== baseline,
  };

  return {
    ...entry,
    draft: nextDraft,
  };
}

function createDraftFromTab(tab: RequestTabRecord): RequestDraftState {
  const savedSeed = tab.requestId ? getSavedWorkspaceRequestSeedById(tab.requestId) : null;
  const draftSeed = savedSeed?.draftSeed;

  return {
    tabId: tab.id,
    name: draftSeed?.name ?? tab.title,
    method: draftSeed?.method ?? tab.methodLabel,
    url: draftSeed?.url ?? '',
    params: draftSeed?.params ?? [],
    headers: draftSeed?.headers ?? [],
    bodyMode: draftSeed?.bodyMode ?? 'none',
    bodyText: draftSeed?.bodyText ?? '',
    formBody: draftSeed?.formBody ?? [],
    multipartBody: draftSeed?.multipartBody ?? [],
    auth: createDefaultAuthState(draftSeed?.auth),
    activeEditorTab: 'params',
    dirty: false,
    ...(tab.collectionName ? { collectionName: tab.collectionName } : {}),
    ...(tab.folderName ? { folderName: tab.folderName } : {}),
  };
}

function updateDraftEntry(
  state: RequestDraftStoreState,
  tabId: string,
  updater: (entry: RequestDraftEntry) => RequestDraftEntry,
) {
  const entry = state.draftsByTabId[tabId];

  if (!entry) {
    return {};
  }

  return {
    draftsByTabId: {
      ...state.draftsByTabId,
      [tabId]: updater(entry),
    },
  };
}

export const useRequestDraftStore = create<RequestDraftStoreState>((set) => ({
  ...initialRequestDraftStoreState,
  ensureDraftForTab: (tab) =>
    set((state) => {
      if (state.draftsByTabId[tab.id]) {
        return {};
      }

      const draft = createDraftFromTab(tab);

      return {
        draftsByTabId: {
          ...state.draftsByTabId,
          [tab.id]: {
            baseline: createDraftSnapshotString(draft),
            draft,
          },
        },
      };
    }),
  removeDraft: (tabId) =>
    set((state) => {
      if (!state.draftsByTabId[tabId]) {
        return {};
      }

      const nextDraftsByTabId = { ...state.draftsByTabId };
      delete nextDraftsByTabId[tabId];

      return {
        draftsByTabId: nextDraftsByTabId,
      };
    }),
  updateDraftName: (tabId, name) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) => withDirtyState(entry, { ...entry.draft, name })),
    ),
  updateDraftMethod: (tabId, method) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) => withDirtyState(entry, { ...entry.draft, method })),
    ),
  updateDraftUrl: (tabId, url) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) => withDirtyState(entry, { ...entry.draft, url })),
    ),
  setActiveEditorTab: (tabId, editorTab) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) => ({
        ...entry,
        draft: {
          ...entry.draft,
          activeEditorTab: editorTab,
        },
      })),
    ),
  addRow: (tabId, target) =>
    set((state) => {
      const entry = state.draftsByTabId[tabId];

      if (!entry) {
        return {};
      }

      const nextRowId = `row-${state.nextRowSequence}`;
      const nextRows = [
        ...entry.draft[target],
        {
          id: nextRowId,
          key: '',
          value: '',
          enabled: true,
        },
      ];

      return {
        nextRowSequence: state.nextRowSequence + 1,
        draftsByTabId: {
          ...state.draftsByTabId,
          [tabId]: withDirtyState(entry, {
            ...entry.draft,
            [target]: nextRows,
          }),
        },
      };
    }),
  updateRow: (tabId, target, rowId, field, value) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) =>
        withDirtyState(entry, {
          ...entry.draft,
          [target]: entry.draft[target].map((row) =>
            row.id === rowId ? { ...row, [field]: value } : row,
          ),
        }),
      ),
    ),
  removeRow: (tabId, target, rowId) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) =>
        withDirtyState(entry, {
          ...entry.draft,
          [target]: entry.draft[target].filter((row) => row.id !== rowId),
        }),
      ),
    ),
  updateBodyMode: (tabId, bodyMode) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) =>
        withDirtyState(entry, {
          ...entry.draft,
          bodyMode,
        }),
      ),
    ),
  updateBodyText: (tabId, bodyText) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) => withDirtyState(entry, { ...entry.draft, bodyText })),
    ),
  updateAuthType: (tabId, authType) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) =>
        withDirtyState(entry, {
          ...entry.draft,
          auth: {
            ...entry.draft.auth,
            type: authType,
          },
        }),
      ),
    ),
  updateAuthField: (tabId, field, value) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) =>
        withDirtyState(entry, {
          ...entry.draft,
          auth: {
            ...entry.draft.auth,
            [field]: value,
          },
        }),
      ),
    ),
}));

export function resetRequestDraftStore() {
  useRequestDraftStore.setState(initialRequestDraftStoreState);
}




