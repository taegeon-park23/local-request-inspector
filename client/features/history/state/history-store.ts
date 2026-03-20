import { create } from 'zustand';
import type {
  HistoryOutcomeFilter,
  HistoryRecord,
} from '@client/features/history/history.types';

interface HistoryStoreState {
  selectedHistoryId: string | null;
  searchText: string;
  executionOutcomeFilter: HistoryOutcomeFilter;
  selectHistory: (historyId: string) => void;
  setSearchText: (searchText: string) => void;
  setExecutionOutcomeFilter: (executionOutcomeFilter: HistoryOutcomeFilter) => void;
}

const initialHistoryStoreState: Pick<
  HistoryStoreState,
  'selectedHistoryId' | 'searchText' | 'executionOutcomeFilter'
> = {
  selectedHistoryId: null,
  searchText: '',
  executionOutcomeFilter: 'all',
};

export const useHistoryStore = create<HistoryStoreState>((set) => ({
  ...initialHistoryStoreState,
  selectHistory: (selectedHistoryId) => set({ selectedHistoryId }),
  setSearchText: (searchText) => set({ searchText }),
  setExecutionOutcomeFilter: (executionOutcomeFilter) => set({ executionOutcomeFilter }),
}));

export function historyMatchesSearch(history: HistoryRecord, searchText: string) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  if (normalizedSearchText.length === 0) {
    return true;
  }

  const haystack = [
    history.requestLabel,
    history.method,
    history.url,
    history.hostPathHint,
    history.executionOutcome,
    history.transportOutcome,
    history.testSummaryLabel,
    history.environmentLabel,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedSearchText);
}

export function historyMatchesExecutionOutcome(
  history: HistoryRecord,
  executionOutcomeFilter: HistoryOutcomeFilter,
) {
  return executionOutcomeFilter === 'all' || history.executionOutcome === executionOutcomeFilter;
}

export const historyExecutionOutcomeOptions: Array<{
  value: HistoryOutcomeFilter;
  label: string;
}> = [
  { value: 'all', label: 'All executions' },
  { value: 'Succeeded', label: 'Succeeded' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Timed out', label: 'Timed out' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Blocked', label: 'Blocked' },
];

export function resetHistoryStore() {
  useHistoryStore.setState(initialHistoryStoreState);
}
