import { create } from 'zustand';
import type { RequestRunObservation } from '@client/features/request-builder/request-builder.api';

export type RequestAsyncStatus = 'idle' | 'pending' | 'success' | 'error';

export interface RequestSaveCommandState {
  status: RequestAsyncStatus;
  message: string | null;
  savedAt: string | null;
}

export interface RequestRunCommandState {
  status: RequestAsyncStatus;
  message: string | null;
  latestExecution: RequestRunObservation | null;
}

interface RequestCommandEntry {
  save: RequestSaveCommandState;
  run: RequestRunCommandState;
}

interface RequestCommandStoreState {
  byTabId: Record<string, RequestCommandEntry>;
  startSave: (tabId: string) => void;
  finishSaveSuccess: (tabId: string, savedAt: string) => void;
  finishSaveError: (tabId: string, message: string) => void;
  startRun: (tabId: string) => void;
  finishRunSuccess: (tabId: string, execution: RequestRunObservation) => void;
  finishRunError: (tabId: string, execution: RequestRunObservation, message: string) => void;
  removeTab: (tabId: string) => void;
}

const initialRequestCommandStoreState: Pick<RequestCommandStoreState, 'byTabId'> = {
  byTabId: {},
};

function createEmptyRequestCommandEntry(): RequestCommandEntry {
  return {
    save: {
      status: 'idle',
      message: null,
      savedAt: null,
    },
    run: {
      status: 'idle',
      message: null,
      latestExecution: null,
    },
  };
}

function createRunStatusMessage(execution: RequestRunObservation) {
  switch (execution.executionOutcome) {
    case 'Succeeded':
      return 'Request run completed.';
    case 'Blocked':
      return 'Request run was blocked before completion.';
    case 'Timed out':
      return 'Request run timed out.';
    default:
      return 'Request run failed.';
  }
}

function withEntry(
  state: RequestCommandStoreState,
  tabId: string,
  updater: (entry: RequestCommandEntry) => RequestCommandEntry,
) {
  const entry = state.byTabId[tabId] ?? createEmptyRequestCommandEntry();

  return {
    byTabId: {
      ...state.byTabId,
      [tabId]: updater(entry),
    },
  };
}

export const useRequestCommandStore = create<RequestCommandStoreState>((set) => ({
  ...initialRequestCommandStoreState,
  startSave: (tabId) =>
    set((state) =>
      withEntry(state, tabId, (entry) => ({
        ...entry,
        save: {
          status: 'pending',
          message: 'Saving request definition...',
          savedAt: entry.save.savedAt,
        },
      })),
    ),
  finishSaveSuccess: (tabId, savedAt) =>
    set((state) =>
      withEntry(state, tabId, (entry) => ({
        ...entry,
        save: {
          status: 'success',
          message: 'Request definition saved.',
          savedAt,
        },
      })),
    ),
  finishSaveError: (tabId, message) =>
    set((state) =>
      withEntry(state, tabId, (entry) => ({
        ...entry,
        save: {
          status: 'error',
          message,
          savedAt: entry.save.savedAt,
        },
      })),
    ),
  startRun: (tabId) =>
    set((state) =>
      withEntry(state, tabId, (entry) => ({
        ...entry,
        run: {
          status: 'pending',
          message: 'Running request...',
          latestExecution: entry.run.latestExecution,
        },
      })),
    ),
  finishRunSuccess: (tabId, execution) =>
    set((state) =>
      withEntry(state, tabId, (entry) => ({
        ...entry,
        run: {
          status: 'success',
          message: createRunStatusMessage(execution),
          latestExecution: execution,
        },
      })),
    ),
  finishRunError: (tabId, execution, message) =>
    set((state) =>
      withEntry(state, tabId, (entry) => ({
        ...entry,
        run: {
          status: 'error',
          message,
          latestExecution: execution,
        },
      })),
    ),
  removeTab: (tabId) =>
    set((state) => {
      if (!state.byTabId[tabId]) {
        return {};
      }

      const nextByTabId = { ...state.byTabId };
      delete nextByTabId[tabId];

      return {
        byTabId: nextByTabId,
      };
    }),
}));

export function resetRequestCommandStore() {
  useRequestCommandStore.setState(initialRequestCommandStoreState);
}

