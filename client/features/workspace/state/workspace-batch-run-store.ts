import { create } from 'zustand';
import type { RequestResultPanelTabId } from '@client/features/request-builder/state/request-command-store';
import type { WorkspaceBatchExecution } from '@client/features/workspace/workspace-request-tree.api';

export type WorkspaceBatchAsyncStatus = 'idle' | 'pending' | 'success' | 'error';

interface WorkspaceBatchRunState {
  isActive: boolean;
  status: WorkspaceBatchAsyncStatus;
  message: string | null;
  latestExecution: WorkspaceBatchExecution | null;
  activeResultTab: RequestResultPanelTabId;
  startBatchRun: (message: string) => void;
  finishBatchRunSuccess: (execution: WorkspaceBatchExecution, message?: string | null) => void;
  finishBatchRunError: (message: string) => void;
  setActiveResultTab: (tabId: RequestResultPanelTabId) => void;
  deactivate: () => void;
  clear: () => void;
}

const initialWorkspaceBatchRunState: Pick<
  WorkspaceBatchRunState,
  'isActive' | 'status' | 'message' | 'latestExecution' | 'activeResultTab'
> = {
  isActive: false,
  status: 'idle',
  message: null,
  latestExecution: null,
  activeResultTab: 'response',
};

function createBatchRunMessage(execution: WorkspaceBatchExecution) {
  if (execution.aggregateOutcome === 'Empty') {
    return `${execution.containerName} has no saved requests to run.`;
  }

  return `${execution.containerName} batch run completed with ${execution.totalRuns} step${execution.totalRuns === 1 ? '' : 's'}.`;
}

export const useWorkspaceBatchRunStore = create<WorkspaceBatchRunState>((set) => ({
  ...initialWorkspaceBatchRunState,
  startBatchRun: (message) =>
    set((state) => ({
      isActive: true,
      status: 'pending',
      message,
      latestExecution: state.latestExecution,
      activeResultTab: 'response',
    })),
  finishBatchRunSuccess: (execution, message = null) =>
    set(() => ({
      isActive: true,
      status: 'success',
      message: message ?? createBatchRunMessage(execution),
      latestExecution: execution,
      activeResultTab: 'response',
    })),
  finishBatchRunError: (message) =>
    set(() => ({
      isActive: true,
      status: 'error',
      message,
      latestExecution: null,
      activeResultTab: 'response',
    })),
  setActiveResultTab: (activeResultTab) =>
    set((state) => ({
      isActive: true,
      activeResultTab,
      latestExecution: state.latestExecution,
      status: state.status,
      message: state.message,
    })),
  deactivate: () =>
    set((state) => ({
      ...state,
      isActive: false,
    })),
  clear: () => set(initialWorkspaceBatchRunState),
}));

export function resetWorkspaceBatchRunStore() {
  useWorkspaceBatchRunStore.setState(initialWorkspaceBatchRunState);
}
