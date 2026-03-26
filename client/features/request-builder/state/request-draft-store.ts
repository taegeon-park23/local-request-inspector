import { create } from 'zustand';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import type {
  RequestDraftAuthState,
  RequestDraftScriptsSeed,
  RequestDraftScriptsState,
  RequestDraftSeed,
  RequestDraftState,
  RequestEditorTabId,
  RequestKeyValueRow,
  RequestRowValueType,
  RequestScriptStageId,
} from '@client/features/request-builder/request-draft.types';
import {
  readRequestGroupName,
  replaceRequestPlacement,
  resolveRequestPlacement,
  type RequestPlacementValue,
} from '@client/features/request-builder/request-placement';
import {
  normalizeRequestScriptsState,
  createLinkedRequestScriptBinding,
  setRequestScriptStageBinding,
} from '@client/features/request-builder/request-script-binding';

interface RequestDraftEntry {
  baseline: string;
  draft: RequestDraftState;
}

type DraftRowTarget = 'params' | 'headers' | 'formBody' | 'multipartBody';
type DraftRowField = 'key' | 'value' | 'enabled' | 'valueType';

interface RequestDraftStoreState {
  draftsByTabId: Record<string, RequestDraftEntry>;
  multipartFilesByTabId: Record<string, Record<string, File[]>>;
  nextRowSequence: number;
  ensureDraftForTab: (
    tab: RequestTabRecord,
    draftSeed?: RequestDraftSeed,
    options?: { replace?: boolean },
  ) => void;
  removeDraft: (tabId: string) => void;
  commitSavedDraft: (tabId: string, placement: RequestPlacementValue & { collectionName: string }) => void;
  updateDraftPlacement: (
    tabId: string,
    placement: RequestPlacementValue,
  ) => void;
  syncCollectionPlacement: (collectionId: string, placement: RequestPlacementValue) => void;
  syncRequestGroupPlacement: (requestGroupId: string, placement: RequestPlacementValue) => void;
  updateDraftName: (tabId: string, name: string) => void;
  updateDraftMethod: (tabId: string, method: RequestDraftState['method']) => void;
  updateDraftUrl: (tabId: string, url: string) => void;
  updateSelectedEnvironmentId: (tabId: string, selectedEnvironmentId: string | null) => void;
  setActiveEditorTab: (tabId: string, editorTab: RequestEditorTabId) => void;
  addRow: (tabId: string, target: DraftRowTarget) => void;
  updateRow: (tabId: string, target: DraftRowTarget, rowId: string, field: DraftRowField, value: string | boolean) => void;
  removeRow: (tabId: string, target: DraftRowTarget, rowId: string) => void;
  setMultipartRowFiles: (tabId: string, rowId: string, files: File[]) => void;
  clearMultipartRowFiles: (tabId: string, rowId?: string) => void;
  updateBodyMode: (tabId: string, bodyMode: RequestDraftState['bodyMode']) => void;
  updateBodyText: (tabId: string, bodyText: string) => void;
  updateAuthType: (tabId: string, authType: RequestDraftAuthState['type']) => void;
  updateAuthField: (tabId: string, field: keyof Omit<RequestDraftAuthState, 'type'>, value: string) => void;
  setActiveScriptStage: (tabId: string, stage: RequestScriptStageId) => void;
  updateScriptContent: (tabId: string, stage: RequestScriptStageId, content: string) => void;
  linkScriptStageToSavedScript: (
    tabId: string,
    stage: RequestScriptStageId,
    binding: {
      savedScriptId: string;
      savedScriptNameSnapshot: string;
      linkedAt?: string | undefined;
    },
  ) => void;
}

const initialRequestDraftStoreState: Pick<RequestDraftStoreState, 'draftsByTabId' | 'multipartFilesByTabId' | 'nextRowSequence'> = {
  draftsByTabId: {},
  multipartFilesByTabId: {},
  nextRowSequence: 1,
};

function normalizeRowValueType(valueType: RequestKeyValueRow['valueType']): RequestRowValueType {
  return valueType === 'file' ? 'file' : 'text';
}

function cloneRows(rows?: RequestKeyValueRow[]) {
  return (rows ?? []).map((row) => {
    const valueType = normalizeRowValueType(row.valueType);

    return {
      ...row,
      valueType,
      value: valueType === 'file' ? '' : (typeof row.value === 'string' ? row.value : ''),
    };
  });
}

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

function createDefaultScriptsState(seed?: RequestDraftScriptsSeed): RequestDraftScriptsState {
  return normalizeRequestScriptsState(seed);
}

function createDraftSnapshotString(draft: RequestDraftState) {
  return JSON.stringify({
    name: draft.name,
    method: draft.method,
    url: draft.url,
    selectedEnvironmentId: draft.selectedEnvironmentId ?? null,
    params: draft.params,
    headers: draft.headers,
    bodyMode: draft.bodyMode,
    bodyText: draft.bodyText,
    formBody: draft.formBody,
    multipartBody: draft.multipartBody,
    auth: draft.auth,
    scripts: {
      preRequest: draft.scripts.preRequest,
      postResponse: draft.scripts.postResponse,
      tests: draft.scripts.tests,
    },
    collectionId: draft.collectionId ?? null,
    collectionName: draft.collectionName ?? null,
    requestGroupId: draft.requestGroupId ?? null,
    requestGroupName: readRequestGroupName(draft) ?? null,
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

function syncPlacementBaseline(
  baseline: string,
  placement: RequestPlacementValue,
) {
  const baselineSnapshot = JSON.parse(baseline) as Record<string, unknown> & RequestPlacementValue;
  return JSON.stringify(
    replaceRequestPlacement(
      baselineSnapshot,
      resolveRequestPlacement(placement, baselineSnapshot),
    ),
  );
}

function syncEntryPlacement(entry: RequestDraftEntry, placement: RequestPlacementValue): RequestDraftEntry {
  const nextDraft = replaceRequestPlacement(
    entry.draft,
    resolveRequestPlacement(placement, entry.draft),
  );
  const nextBaseline = syncPlacementBaseline(entry.baseline, placement);

  return {
    baseline: nextBaseline,
    draft: {
      ...nextDraft,
      dirty: createDraftSnapshotString(nextDraft) !== nextBaseline,
    },
  };
}


function resolveInitialDraftName(tab: RequestTabRecord, draftSeed?: RequestDraftSeed) {
  if (typeof draftSeed?.name === 'string') {
    return draftSeed.name;
  }

  return tab.source === 'saved' || tab.source === 'replay' ? tab.title : '';
}

function createDraftFromTab(tab: RequestTabRecord, draftSeed?: RequestDraftSeed): RequestDraftState {

  return {
    tabId: tab.id,
    name: resolveInitialDraftName(tab, draftSeed),
    method: draftSeed?.method ?? tab.methodLabel,
    url: draftSeed?.url ?? '',
    selectedEnvironmentId: draftSeed?.selectedEnvironmentId ?? null,
    params: cloneRows(draftSeed?.params),
    headers: cloneRows(draftSeed?.headers),
    bodyMode: draftSeed?.bodyMode ?? 'none',
    bodyText: draftSeed?.bodyText ?? '',
    formBody: cloneRows(draftSeed?.formBody),
    multipartBody: cloneRows(draftSeed?.multipartBody),
    auth: createDefaultAuthState(draftSeed?.auth),
    scripts: createDefaultScriptsState(draftSeed?.scripts),
    activeEditorTab: 'params',
    dirty: false,
    ...resolveRequestPlacement(draftSeed, tab),
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
  ensureDraftForTab: (tab, draftSeed, options = {}) =>
    set((state) => {
      if (state.draftsByTabId[tab.id] && options.replace !== true) {
        return {};
      }

      const draft = createDraftFromTab(tab, draftSeed);
      const nextMultipartFilesByTabId = { ...state.multipartFilesByTabId };
      delete nextMultipartFilesByTabId[tab.id];

      return {
        draftsByTabId: {
          ...state.draftsByTabId,
          [tab.id]: {
            baseline: createDraftSnapshotString(draft),
            draft,
          },
        },
        multipartFilesByTabId: nextMultipartFilesByTabId,
      };
    }),
  removeDraft: (tabId) =>
    set((state) => {
      if (!state.draftsByTabId[tabId]) {
        return {};
      }

      const nextDraftsByTabId = { ...state.draftsByTabId };
      delete nextDraftsByTabId[tabId];

      const nextMultipartFilesByTabId = { ...state.multipartFilesByTabId };
      delete nextMultipartFilesByTabId[tabId];

      return {
        draftsByTabId: nextDraftsByTabId,
        multipartFilesByTabId: nextMultipartFilesByTabId,
      };
    }),
  commitSavedDraft: (tabId, placement) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) => {
        const nextDraft = replaceRequestPlacement(
          {
            ...entry.draft,
            dirty: false,
          },
          resolveRequestPlacement(placement, entry.draft),
        );

        return {
          baseline: createDraftSnapshotString(nextDraft),
          draft: nextDraft,
        };
      }),
    ),
  updateDraftPlacement: (tabId, placement) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) => {
        const nextDraft = replaceRequestPlacement(
          entry.draft,
          resolveRequestPlacement(placement, entry.draft),
        );

        return withDirtyState(entry, nextDraft);
      }),
    ),
  syncCollectionPlacement: (collectionId, placement) =>
    set((state) => {
      const nextEntries = Object.entries(state.draftsByTabId).map(([tabId, entry]) => {
        if (entry.draft.collectionId !== collectionId) {
          return [tabId, entry];
        }

        return [tabId, syncEntryPlacement(entry, placement)];
      });

      return {
        draftsByTabId: Object.fromEntries(nextEntries),
      };
    }),
  syncRequestGroupPlacement: (requestGroupId, placement) =>
    set((state) => {
      const nextEntries = Object.entries(state.draftsByTabId).map(([tabId, entry]) => {
        if (entry.draft.requestGroupId !== requestGroupId) {
          return [tabId, entry];
        }

        return [tabId, syncEntryPlacement(entry, placement)];
      });

      return {
        draftsByTabId: Object.fromEntries(nextEntries),
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
  updateSelectedEnvironmentId: (tabId, selectedEnvironmentId) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) => withDirtyState(entry, {
        ...entry.draft,
        selectedEnvironmentId,
      })),
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
          valueType: 'text',
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
    set((state) => {
      const entry = state.draftsByTabId[tabId];
      if (!entry) {
        return {};
      }

      const nextRows = entry.draft[target].map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (field === 'valueType') {
          const nextValueType = normalizeRowValueType(value as RequestKeyValueRow['valueType']);
          return {
            ...row,
            valueType: nextValueType,
            value: nextValueType === 'file' ? '' : row.value,
          };
        }

        return {
          ...row,
          [field]: value,
        };
      });

      const nextDraftEntry = withDirtyState(entry, {
        ...entry.draft,
        [target]: nextRows,
      });

      const nextState = {
        draftsByTabId: {
          ...state.draftsByTabId,
          [tabId]: nextDraftEntry,
        },
      } as Partial<RequestDraftStoreState>;

      if (target === 'multipartBody' && field === 'valueType' && value !== 'file') {
        const nextMultipartRowMap = {
          ...(state.multipartFilesByTabId[tabId] ?? {}),
        };
        delete nextMultipartRowMap[rowId];
        const nextMultipartFilesByTabId = {
          ...state.multipartFilesByTabId,
          [tabId]: nextMultipartRowMap,
        };
        nextState.multipartFilesByTabId = nextMultipartFilesByTabId;
      }

      return nextState;
    }),
  removeRow: (tabId, target, rowId) =>
    set((state) => {
      const nextState = updateDraftEntry(state, tabId, (entry) =>
        withDirtyState(entry, {
          ...entry.draft,
          [target]: entry.draft[target].filter((row) => row.id !== rowId),
        }),
      );

      if (target !== 'multipartBody') {
        return nextState;
      }

      const nextMultipartRowMap = {
        ...(state.multipartFilesByTabId[tabId] ?? {}),
      };
      delete nextMultipartRowMap[rowId];
      const nextMultipartFilesByTabId = {
        ...state.multipartFilesByTabId,
        [tabId]: nextMultipartRowMap,
      };

      return {
        ...nextState,
        multipartFilesByTabId: nextMultipartFilesByTabId,
      };
    }),
  setMultipartRowFiles: (tabId, rowId, files) =>
    set((state) => ({
      multipartFilesByTabId: {
        ...state.multipartFilesByTabId,
        [tabId]: {
          ...(state.multipartFilesByTabId[tabId] ?? {}),
          [rowId]: [...files],
        },
      },
    })),
  clearMultipartRowFiles: (tabId, rowId) =>
    set((state) => {
      const nextByTabId = { ...state.multipartFilesByTabId };

      if (!nextByTabId[tabId]) {
        return {};
      }

      if (!rowId) {
        delete nextByTabId[tabId];
        return {
          multipartFilesByTabId: nextByTabId,
        };
      }

      const nextRowMap = { ...nextByTabId[tabId] };
      delete nextRowMap[rowId];
      nextByTabId[tabId] = nextRowMap;

      return {
        multipartFilesByTabId: nextByTabId,
      };
    }),
  updateBodyMode: (tabId, bodyMode) =>
    set((state) => {
      const nextState = updateDraftEntry(state, tabId, (entry) =>
        withDirtyState(entry, {
          ...entry.draft,
          bodyMode,
        }),
      );

      if (bodyMode === 'multipart-form-data') {
        return nextState;
      }

      const nextMultipartFilesByTabId = { ...state.multipartFilesByTabId };
      delete nextMultipartFilesByTabId[tabId];

      return {
        ...nextState,
        multipartFilesByTabId: nextMultipartFilesByTabId,
      };
    }),
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
  setActiveScriptStage: (tabId, stage) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) => ({
        ...entry,
        draft: {
          ...entry.draft,
          scripts: {
            ...entry.draft.scripts,
            activeStage: stage,
          },
        },
      })),
    ),
  updateScriptContent: (tabId, stage, content) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) =>
        withDirtyState(entry, {
          ...entry.draft,
          scripts: setRequestScriptStageBinding(entry.draft.scripts, stage, {
            mode: 'inline',
            sourceCode: content,
          }),
        }),
      ),
    ),
  linkScriptStageToSavedScript: (tabId, stage, binding) =>
    set((state) =>
      updateDraftEntry(state, tabId, (entry) =>
        withDirtyState(entry, {
          ...entry.draft,
          scripts: setRequestScriptStageBinding(entry.draft.scripts, stage, createLinkedRequestScriptBinding({
            savedScriptId: binding.savedScriptId,
            savedScriptNameSnapshot: binding.savedScriptNameSnapshot,
            ...(binding.linkedAt ? { linkedAt: binding.linkedAt } : {}),
          })),
        }),
      ),
    ),
}));

export function resetRequestDraftStore() {
  useRequestDraftStore.setState(initialRequestDraftStoreState);
}


















