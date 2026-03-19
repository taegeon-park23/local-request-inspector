import { create } from 'zustand';
import type { CaptureOutcomeFilter, CaptureRecord } from '@client/features/captures/capture.types';
import type { RuntimeConnectionHealth } from '@client/features/runtime-events/runtime-events.types';

interface CapturesStoreState {
  connectionHealth: RuntimeConnectionHealth;
  listItems: CaptureRecord[];
  selectedCaptureId: string | null;
  searchText: string;
  outcomeFilter: CaptureOutcomeFilter;
  setConnectionHealth: (connectionHealth: RuntimeConnectionHealth) => void;
  ingestCapture: (capture: CaptureRecord) => void;
  selectCapture: (captureId: string) => void;
  setSearchText: (searchText: string) => void;
  setOutcomeFilter: (outcomeFilter: CaptureOutcomeFilter) => void;
}

const initialCapturesStoreState: Pick<
  CapturesStoreState,
  'connectionHealth' | 'listItems' | 'selectedCaptureId' | 'searchText' | 'outcomeFilter'
> = {
  connectionHealth: 'idle',
  listItems: [],
  selectedCaptureId: null,
  searchText: '',
  outcomeFilter: 'all',
};

export const useCapturesStore = create<CapturesStoreState>((set) => ({
  ...initialCapturesStoreState,
  setConnectionHealth: (connectionHealth) => set({ connectionHealth }),
  ingestCapture: (capture) =>
    set((state) => {
      const nextListItems = [
        capture,
        ...state.listItems.filter((existingCapture) => existingCapture.id !== capture.id),
      ];

      return {
        listItems: nextListItems,
        selectedCaptureId: state.selectedCaptureId ?? capture.id,
      };
    }),
  selectCapture: (selectedCaptureId) => set({ selectedCaptureId }),
  setSearchText: (searchText) => set({ searchText }),
  setOutcomeFilter: (outcomeFilter) => set({ outcomeFilter }),
}));

export function resetCapturesStore() {
  useCapturesStore.setState(initialCapturesStoreState);
}
