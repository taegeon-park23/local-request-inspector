import { create } from 'zustand';
import type { CaptureOutcomeFilter } from '@client/features/captures/capture.types';
import type { RuntimeConnectionHealth } from '@client/features/runtime-events/runtime-events.types';

interface CapturesStoreState {
  connectionHealth: RuntimeConnectionHealth;
  selectedCaptureId: string | null;
  searchText: string;
  outcomeFilter: CaptureOutcomeFilter;
  setConnectionHealth: (connectionHealth: RuntimeConnectionHealth) => void;
  selectCapture: (captureId: string) => void;
  setSearchText: (searchText: string) => void;
  setOutcomeFilter: (outcomeFilter: CaptureOutcomeFilter) => void;
}

const initialCapturesStoreState: Pick<
  CapturesStoreState,
  'connectionHealth' | 'selectedCaptureId' | 'searchText' | 'outcomeFilter'
> = {
  connectionHealth: 'idle',
  selectedCaptureId: null,
  searchText: '',
  outcomeFilter: 'all',
};

export const useCapturesStore = create<CapturesStoreState>((set) => ({
  ...initialCapturesStoreState,
  setConnectionHealth: (connectionHealth) => set({ connectionHealth }),
  selectCapture: (selectedCaptureId) => set({ selectedCaptureId }),
  setSearchText: (searchText) => set({ searchText }),
  setOutcomeFilter: (outcomeFilter) => set({ outcomeFilter }),
}));

export function resetCapturesStore() {
  useCapturesStore.setState(initialCapturesStoreState);
}
