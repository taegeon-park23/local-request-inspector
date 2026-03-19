import { create } from 'zustand';
import { defaultMockRuleFixtureScenario } from '@client/features/mocks/data/mock-rule-fixtures';
import type {
  MockRuleFixtureScenario,
  MockRuleRecord,
  MockRuleStateFilter,
} from '@client/features/mocks/mock-rule.types';

interface MocksStoreState {
  listItems: MockRuleRecord[];
  selectedRuleId: string | null;
  searchText: string;
  stateFilter: MockRuleStateFilter;
  nextDraftSequence: number;
  selectRule: (ruleId: string) => void;
  setSearchText: (searchText: string) => void;
  setStateFilter: (stateFilter: MockRuleStateFilter) => void;
  openNewRuleDraft: () => void;
  applyFixtureScenario: (scenario: MockRuleFixtureScenario) => void;
}

const initialMocksStoreState: Pick<
  MocksStoreState,
  'listItems' | 'selectedRuleId' | 'searchText' | 'stateFilter' | 'nextDraftSequence'
> = {
  listItems: defaultMockRuleFixtureScenario.listItems,
  selectedRuleId: defaultMockRuleFixtureScenario.selectedRuleId,
  searchText: '',
  stateFilter: 'all',
  nextDraftSequence: 1,
};

function getFallbackSelectedRuleId(listItems: MockRuleRecord[], selectedRuleId: string | null) {
  if (selectedRuleId && listItems.some((item) => item.id === selectedRuleId)) {
    return selectedRuleId;
  }

  return listItems[0]?.id ?? null;
}

function buildDraftRule(nextDraftSequence: number): MockRuleRecord {
  const draftSuffix = nextDraftSequence === 1 ? '' : ` ${nextDraftSequence}`;

  return {
    id: `mock-rule-draft-${nextDraftSequence}`,
    name: `Untitled Mock Rule${draftSuffix}`,
    ruleState: 'Disabled',
    priority: 100,
    matcherSummary: 'Draft matcher scaffold. Structured matcher editing lands in a later slice.',
    responseSummary: 'Draft static response scaffold. Persistence and generation stay deferred in S7.',
    methodSummary: 'Method: any',
    pathSummary: 'Path matcher: not set',
    querySummary: 'Query matcher summary: none yet',
    headerSummary: 'Header matcher summary: none yet',
    bodySummary: 'Body matcher summary: none yet',
    responseStatusSummary: '200 OK placeholder',
    responseHeadersSummary: 'Header summary not configured',
    responseBodyPreview: '{\n  "draft": true\n}',
    fixedDelayLabel: 'No fixed delay',
    diagnosticsSummary: 'Local-only draft shell. Saving, persistence, and runtime evaluation remain disabled in S7.',
    deferredSummary: 'Script-assisted matcher/response, validation-heavy forms, and runtime traces remain deferred.',
    sourceLabel: 'Local draft shell',
    isDraftShell: true,
  };
}

export const useMocksStore = create<MocksStoreState>((set) => ({
  ...initialMocksStoreState,
  selectRule: (selectedRuleId) => set({ selectedRuleId }),
  setSearchText: (searchText) => set({ searchText }),
  setStateFilter: (stateFilter) => set({ stateFilter }),
  openNewRuleDraft: () =>
    set((state) => {
      const draftRule = buildDraftRule(state.nextDraftSequence);

      return {
        listItems: [draftRule, ...state.listItems],
        selectedRuleId: draftRule.id,
        searchText: '',
        stateFilter: 'all',
        nextDraftSequence: state.nextDraftSequence + 1,
      };
    }),
  applyFixtureScenario: ({ listItems, selectedRuleId }) =>
    set((state) => ({
      listItems,
      selectedRuleId: getFallbackSelectedRuleId(listItems, selectedRuleId ?? state.selectedRuleId),
      searchText: '',
      stateFilter: 'all',
      nextDraftSequence: 1,
    })),
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
