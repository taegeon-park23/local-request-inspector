import { create } from 'zustand';
import type { RequestResultPanelTabId } from '@client/features/request-builder/state/request-command-store';
import type { WorkspaceBatchExecution } from '@client/features/workspace/workspace-request-tree.api';

export type WorkspaceBatchAsyncStatus = 'idle' | 'pending' | 'success' | 'error';

interface WorkspaceBatchRunState {
  isActive: boolean;
  status: WorkspaceBatchAsyncStatus;
  message: string | null;
  latestExecution: WorkspaceBatchExecution | null;
  executionHistory: WorkspaceBatchExecution[];
  activeResultTab: RequestResultPanelTabId;
  startBatchRun: (message: string) => void;
  finishBatchRunSuccess: (execution: WorkspaceBatchExecution, message?: string | null) => void;
  finishBatchRunError: (message: string) => void;
  setActiveResultTab: (tabId: RequestResultPanelTabId) => void;
  deactivate: () => void;
  clear: () => void;
}

const MAX_WORKSPACE_BATCH_HISTORY = 16;

const initialWorkspaceBatchRunState: Pick<
  WorkspaceBatchRunState,
  'isActive' | 'status' | 'message' | 'latestExecution' | 'executionHistory' | 'activeResultTab'
> = {
  isActive: false,
  status: 'idle',
  message: null,
  latestExecution: null,
  executionHistory: [],
  activeResultTab: 'response',
};

function createBatchRunMessage(execution: WorkspaceBatchExecution) {
  if (execution.aggregateOutcome === 'Empty') {
    return `${execution.containerName} has no saved requests to run.`;
  }

  return `${execution.containerName} batch run completed with ${execution.totalRuns} step${execution.totalRuns === 1 ? '' : 's'}.`;
}

function pushWorkspaceBatchHistory(
  history: WorkspaceBatchExecution[],
  execution: WorkspaceBatchExecution,
) {
  const filtered = history.filter((entry) => entry.batchExecutionId !== execution.batchExecutionId);
  return [execution, ...filtered].slice(0, MAX_WORKSPACE_BATCH_HISTORY);
}

export const useWorkspaceBatchRunStore = create<WorkspaceBatchRunState>((set) => ({
  ...initialWorkspaceBatchRunState,
  startBatchRun: (message) =>
    set((state) => ({
      isActive: true,
      status: 'pending',
      message,
      latestExecution: state.latestExecution,
      executionHistory: state.executionHistory,
      activeResultTab: 'response',
    })),
  finishBatchRunSuccess: (execution, message = null) =>
    set((state) => ({
      isActive: true,
      status: 'success',
      message: message ?? createBatchRunMessage(execution),
      latestExecution: execution,
      executionHistory: pushWorkspaceBatchHistory(state.executionHistory, execution),
      activeResultTab: 'response',
    })),
  finishBatchRunError: (message) =>
    set((state) => ({
      isActive: true,
      status: 'error',
      message,
      latestExecution: null,
      executionHistory: state.executionHistory,
      activeResultTab: 'response',
    })),
  setActiveResultTab: (activeResultTab) =>
    set((state) => ({
      isActive: true,
      activeResultTab,
      latestExecution: state.latestExecution,
      executionHistory: state.executionHistory,
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
