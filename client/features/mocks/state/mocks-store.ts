import { create } from 'zustand';
import type { MockRuleRecord, MockRuleStateFilter } from '@client/features/mocks/mock-rule.types';

interface MocksStoreState {
  selectedRuleId: string | null;
  searchText: string;
  stateFilter: MockRuleStateFilter;
  isCreatingRule: boolean;
  selectRule: (ruleId: string) => void;
  clearSelection: () => void;
  setSearchText: (searchText: string) => void;
  setStateFilter: (stateFilter: MockRuleStateFilter) => void;
  startCreatingRule: () => void;
  finishCreatingRule: (ruleId: string) => void;
}

const initialMocksStoreState: Pick<
  MocksStoreState,
  'selectedRuleId' | 'searchText' | 'stateFilter' | 'isCreatingRule'
> = {
  selectedRuleId: null,
  searchText: '',
  stateFilter: 'all',
  isCreatingRule: false,
};

export const useMocksStore = create<MocksStoreState>((set) => ({
  ...initialMocksStoreState,
  selectRule: (selectedRuleId) => set({ selectedRuleId, isCreatingRule: false }),
  clearSelection: () => set({ selectedRuleId: null, isCreatingRule: false }),
  setSearchText: (searchText) => set({ searchText }),
  setStateFilter: (stateFilter) => set({ stateFilter }),
  startCreatingRule: () =>
    set({
      isCreatingRule: true,
      selectedRuleId: null,
      searchText: '',
      stateFilter: 'all',
    }),
  finishCreatingRule: (ruleId) => set({ selectedRuleId: ruleId, isCreatingRule: false }),
}));

export function mockRuleMatchesSearch(rule: MockRuleRecord, searchText: string) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  if (normalizedSearchText.length === 0) {
    return true;
  }

  const haystack = [
    rule.name,
    rule.ruleState,
    rule.matcherSummary,
    rule.responseSummary,
    rule.methodSummary,
    rule.pathSummary,
    rule.sourceLabel,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedSearchText);
}

export function mockRuleMatchesStateFilter(rule: MockRuleRecord, stateFilter: MockRuleStateFilter) {
  return stateFilter === 'all' || rule.ruleState === stateFilter;
}

export const mockRuleStateFilterOptions: Array<{
  value: MockRuleStateFilter;
  label: string;
}> = [
  { value: 'all', label: 'All rules' },
  { value: 'Enabled', label: 'Enabled' },
  { value: 'Disabled', label: 'Disabled' },
];

export function resetMocksStore() {
  useMocksStore.setState(initialMocksStoreState);
}
