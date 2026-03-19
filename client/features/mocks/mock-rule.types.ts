export type MockRuleStateLabel = 'Enabled' | 'Disabled';

export type MockRuleStateFilter = 'all' | MockRuleStateLabel;

export type MockRuleDetailTabId = 'overview' | 'matchers' | 'response' | 'diagnostics';

export interface MockRuleRecord {
  id: string;
  name: string;
  ruleState: MockRuleStateLabel;
  priority: number;
  matcherSummary: string;
  responseSummary: string;
  methodSummary: string;
  pathSummary: string;
  querySummary: string;
  headerSummary: string;
  bodySummary: string;
  responseStatusSummary: string;
  responseHeadersSummary: string;
  responseBodyPreview: string;
  fixedDelayLabel: string;
  diagnosticsSummary: string;
  deferredSummary: string;
  sourceLabel: string;
  isDraftShell?: boolean;
}

export interface MockRuleFixtureScenario {
  listItems: MockRuleRecord[];
  selectedRuleId: string | null;
}
