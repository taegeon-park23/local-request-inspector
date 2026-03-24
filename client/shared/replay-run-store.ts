import { create } from 'zustand';

interface ReplayRunState {
  pendingReplayRunTabId: string | null;
  queueReplayRun: (tabId: string) => void;
  consumeReplayRun: (tabId: string) => boolean;
}

const initialReplayRunState: Pick<ReplayRunState, 'pendingReplayRunTabId'> = {
  pendingReplayRunTabId: null,
};

export const useReplayRunStore = create<ReplayRunState>((set, get) => ({
  ...initialReplayRunState,
  queueReplayRun: (tabId) => set({ pendingReplayRunTabId: tabId }),
  consumeReplayRun: (tabId) => {
    if (get().pendingReplayRunTabId !== tabId) {
      return false;
    }

    set({ pendingReplayRunTabId: null });
    return true;
  },
}));

export function resetReplayRunStore() {
  useReplayRunStore.setState(initialReplayRunState);
}
