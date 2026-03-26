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
  RequestScriptStageBinding,
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

interface RequestDraftScriptStageBaseline {
  mode: 'inline' | 'linked';
  sourceCode?: string;
  savedScriptId?: string;
  savedScriptNameSnapshot?: string;
  linkedAt?: string;
}

interface RequestDraftScriptsBaseline {
  preRequest: RequestDraftScriptStageBaseline;
  postResponse: RequestDraftScriptStageBaseline;
  tests: RequestDraftScriptStageBaseline;
}

interface RequestDraftBaseline {
  name: string;
  method: RequestDraftState['method'];
  url: string;
  selectedEnvironmentId: string | null;
  params: RequestKeyValueRow[];
  headers: RequestKeyValueRow[];
  bodyMode: RequestDraftState['bodyMode'];
  bodyText: string;
  formBody: RequestKeyValueRow[];
  multipartBody: RequestKeyValueRow[];
  auth: RequestDraftAuthState;
  scripts: RequestDraftScriptsBaseline;
  collectionId: string | null;
  collectionName: string | null;
  requestGroupId: string | null;
  requestGroupName: string | null;
}

interface RequestDraftEntry {
  baseline: RequestDraftBaseline;
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

function createScriptStageBaseline(stage: RequestScriptStageBinding): RequestDraftScriptStageBaseline {
  if (stage.mode === 'inline') {
    return {
      mode: 'inline',
      sourceCode: stage.sourceCode,
    };
  }

  return {
    mode: 'linked',
    savedScriptId: stage.savedScriptId,
    savedScriptNameSnapshot: stage.savedScriptNameSnapshot,
    linkedAt: stage.linkedAt,
  };
}

function createDraftScriptsBaseline(scripts: RequestDraftScriptsState): RequestDraftScriptsBaseline {
  return {
    preRequest: createScriptStageBaseline(scripts.preRequest),
    postResponse: createScriptStageBaseline(scripts.postResponse),
    tests: createScriptStageBaseline(scripts.tests),
  };
}

function createDraftBaseline(draft: RequestDraftState): RequestDraftBaseline {
  return {
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
    scripts: createDraftScriptsBaseline(draft.scripts),
    collectionId: draft.collectionId ?? null,
    collectionName: draft.collectionName ?? null,
    requestGroupId: draft.requestGroupId ?? null,
    requestGroupName: readRequestGroupName(draft) ?? null,
  };
}

function areRowsEqual(left: RequestKeyValueRow[], right: RequestKeyValueRow[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftRow = left[index];
    const rightRow = right[index];

    if (!leftRow || !rightRow) {
      return false;
    }

    if (leftRow.id !== rightRow.id
      || leftRow.key !== rightRow.key
      || leftRow.value !== rightRow.value
      || leftRow.enabled !== rightRow.enabled
      || normalizeRowValueType(leftRow.valueType) !== normalizeRowValueType(rightRow.valueType)) {
      return false;
    }
  }

  return true;
}

function isAuthEqual(left: RequestDraftAuthState, right: RequestDraftAuthState) {
  if (left === right) {
    return true;
  }

  return left.type === right.type
    && left.bearerToken === right.bearerToken
    && left.basicUsername === right.basicUsername
    && left.basicPassword === right.basicPassword
    && left.apiKeyName === right.apiKeyName
    && left.apiKeyValue === right.apiKeyValue
    && left.apiKeyPlacement === right.apiKeyPlacement;
}

function isScriptStageEqual(stage: RequestScriptStageBinding, baseline: RequestDraftScriptStageBaseline) {
  if (stage.mode !== baseline.mode) {
    return false;
  }

  if (stage.mode === 'inline') {
    return stage.sourceCode === (baseline.sourceCode ?? '');
  }

  return stage.savedScriptId === (baseline.savedScriptId ?? '')
    && stage.savedScriptNameSnapshot === (baseline.savedScriptNameSnapshot ?? '')
    && stage.linkedAt === (baseline.linkedAt ?? '');
}

function isScriptsEqual(scripts: RequestDraftScriptsState, baseline: RequestDraftScriptsBaseline) {
  return isScriptStageEqual(scripts.preRequest, baseline.preRequest)
    && isScriptStageEqual(scripts.postResponse, baseline.postResponse)
    && isScriptStageEqual(scripts.tests, baseline.tests);
}

function isDraftMatchingBaseline(draft: RequestDraftState, baseline: RequestDraftBaseline) {
  if (draft.name !== baseline.name
    || draft.method !== baseline.method
    || draft.url !== baseline.url
    || (draft.selectedEnvironmentId ?? null) !== baseline.selectedEnvironmentId
    || draft.bodyMode !== baseline.bodyMode
    || draft.bodyText !== baseline.bodyText
    || (draft.collectionId ?? null) !== baseline.collectionId
    || (draft.collectionName ?? null) !== baseline.collectionName
    || (draft.requestGroupId ?? null) !== baseline.requestGroupId
    || (readRequestGroupName(draft) ?? null) !== baseline.requestGroupName) {
    return false;
  }

  if (!areRowsEqual(draft.params, baseline.params)
    || !areRowsEqual(draft.headers, baseline.headers)
    || !areRowsEqual(draft.formBody, baseline.formBody)
    || !areRowsEqual(draft.multipartBody, baseline.multipartBody)) {
    return false;
  }

  if (!isAuthEqual(draft.auth, baseline.auth)) {
    return false;
  }

  return isScriptsEqual(draft.scripts, baseline.scripts);
}

function withDirtyState(entry: RequestDraftEntry, draft: RequestDraftState): RequestDraftEntry {
  const baseline = entry.baseline;
  const nextDraft = {
    ...draft,
    dirty: !isDraftMatchingBaseline(draft, baseline),
  };

  return {
    ...entry,
    draft: nextDraft,
  };
}


function createPlacementValueSnapshot(source: {
  collectionId: string | null;
  collectionName: string | null;
  requestGroupId: string | null;
  requestGroupName: string | null;
}): RequestPlacementValue {
  const placement: RequestPlacementValue = {};

  if (source.collectionId) {
    placement.collectionId = source.collectionId;
  }

  if (source.collectionName) {
    placement.collectionName = source.collectionName;
  }

  if (source.requestGroupId) {
    placement.requestGroupId = source.requestGroupId;
  }

  if (source.requestGroupName) {
    placement.requestGroupName = source.requestGroupName;
  }

  return placement;
}
function syncPlacementBaseline(
  baseline: RequestDraftBaseline,
  placement: RequestPlacementValue,
): RequestDraftBaseline {
  const baselinePlacement = createPlacementValueSnapshot(baseline);
  const nextPlacement = replaceRequestPlacement(
    baselinePlacement,
    resolveRequestPlacement(placement, baselinePlacement),
  );

  return {
    ...baseline,
    collectionId: nextPlacement.collectionId ?? null,
    collectionName: nextPlacement.collectionName ?? null,
    requestGroupId: nextPlacement.requestGroupId ?? null,
    requestGroupName: readRequestGroupName(nextPlacement) ?? null,
  };
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
      dirty: !isDraftMatchingBaseline(nextDraft, nextBaseline),
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
            baseline: createDraftBaseline(draft),
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
          baseline: createDraftBaseline(nextDraft),
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

export function selectRequestDraftByTabId(
  state: Pick<RequestDraftStoreState, 'draftsByTabId'>,
  tabId: string | null | undefined,
): RequestDraftState | null {
  if (!tabId) {
    return null;
  }

  return state.draftsByTabId[tabId]?.draft ?? null;
}

export interface RequestTabDraftPresentation {
  title: string;
  methodLabel: RequestDraftState['method'];
  hasUnsavedChanges: boolean;
}

export function selectRequestTabDraftPresentation(
  state: Pick<RequestDraftStoreState, 'draftsByTabId'>,
  tabId: string | null | undefined,
): RequestTabDraftPresentation | null {
  const draft = selectRequestDraftByTabId(state, tabId);

  if (!draft) {
    return null;
  }

  return {
    title: draft.name,
    methodLabel: draft.method,
    hasUnsavedChanges: draft.dirty,
  };
}

export interface RequestDraftPlacementSnapshot {
  collectionId: string | null;
  collectionName: string | null;
  requestGroupId: string | null;
  requestGroupName: string | null;
}

export function selectRequestDraftPlacementSnapshot(
  state: Pick<RequestDraftStoreState, 'draftsByTabId'>,
  tabId: string | null | undefined,
): RequestDraftPlacementSnapshot | null {
  const draft = selectRequestDraftByTabId(state, tabId);

  if (!draft) {
    return null;
  }

  return {
    collectionId: draft.collectionId ?? null,
    collectionName: draft.collectionName ?? null,
    requestGroupId: draft.requestGroupId ?? null,
    requestGroupName: readRequestGroupName(draft) ?? null,
  };
}

export function selectRequestDraftDirtyByTabId(
  state: Pick<RequestDraftStoreState, 'draftsByTabId'>,
  tabId: string | null | undefined,
): boolean {
  return selectRequestDraftByTabId(state, tabId)?.dirty ?? false;
}

export function resetRequestDraftStore() {
  useRequestDraftStore.setState(initialRequestDraftStoreState);
}
