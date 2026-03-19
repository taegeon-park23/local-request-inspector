import { create } from 'zustand';
import { defaultHistoryFixtureScenario } from '@client/features/history/data/history-fixtures';
import type {
  HistoryFixtureScenario,
  HistoryObservationHealth,
  HistoryOutcomeFilter,
  HistoryRecord,
} from '@client/features/history/history.types';

interface HistoryStoreState {
  observationHealth: HistoryObservationHealth;
  listItems: HistoryRecord[];
  selectedHistoryId: string | null;
  searchText: string;
  executionOutcomeFilter: HistoryOutcomeFilter;
  selectHistory: (historyId: string) => void;
  setSearchText: (searchText: string) => void;
  setExecutionOutcomeFilter: (executionOutcomeFilter: HistoryOutcomeFilter) => void;
  applyFixtureScenario: (scenario: HistoryFixtureScenario) => void;
}

const initialHistoryStoreState: Pick<
  HistoryStoreState,
  'observationHealth' | 'listItems' | 'selectedHistoryId' | 'searchText' | 'executionOutcomeFilter'
> = {
  observationHealth: defaultHistoryFixtureScenario.observationHealth,
  listItems: defaultHistoryFixtureScenario.listItems,
  selectedHistoryId: defaultHistoryFixtureScenario.selectedHistoryId,
  searchText: '',
  executionOutcomeFilter: 'all',
};

function getFallbackSelectedHistoryId(listItems: HistoryRecord[], selectedHistoryId: string | null) {
  if (selectedHistoryId && listItems.some((item) => item.id === selectedHistoryId)) {
    return selectedHistoryId;
  }

  return listItems[0]?.id ?? null;
}

export const useHistoryStore = create<HistoryStoreState>((set) => ({
  ...initialHistoryStoreState,
  selectHistory: (selectedHistoryId) => set({ selectedHistoryId }),
  setSearchText: (searchText) => set({ searchText }),
  setExecutionOutcomeFilter: (executionOutcomeFilter) => set({ executionOutcomeFilter }),
  applyFixtureScenario: ({ observationHealth, listItems, selectedHistoryId }) =>
    set((state) => ({
      observationHealth,
      listItems,
      selectedHistoryId: getFallbackSelectedHistoryId(listItems, selectedHistoryId ?? state.selectedHistoryId),
      searchText: '',
      executionOutcomeFilter: 'all',
    })),
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
