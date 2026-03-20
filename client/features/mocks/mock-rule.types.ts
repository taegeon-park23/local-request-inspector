export type MockRuleStateLabel = 'Enabled' | 'Disabled';
export type MockRuleStateFilter = 'all' | MockRuleStateLabel;
export type MockRuleDetailTabId = 'overview' | 'matchers' | 'response' | 'diagnostics';

export type MockRuleMethodMode = 'any' | 'exact';
export type MockRuleMethodValue = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type MockRulePathMode = 'exact' | 'prefix';
export type MockRuleFieldOperator = 'exists' | 'equals' | 'contains';
export type MockRuleBodyMatcherMode = 'none' | 'exact' | 'contains';

export interface MockRuleMatcherRow {
  id: string;
  key: string;
  operator: MockRuleFieldOperator;
  value: string;
  enabled: boolean;
}

export interface MockRuleResponseHeaderRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface MockRuleInput {
  name: string;
  enabled: boolean;
  priority: number;
  methodMode: MockRuleMethodMode;
  method: MockRuleMethodValue;
  pathMode: MockRulePathMode;
  pathValue: string;
  queryMatchers: MockRuleMatcherRow[];
  headerMatchers: MockRuleMatcherRow[];
  bodyMatcherMode: MockRuleBodyMatcherMode;
  bodyMatcherValue: string;
  responseStatusCode: number;
  responseHeaders: MockRuleResponseHeaderRow[];
  responseBody: string;
  fixedDelayMs: number;
}

export interface MockRuleRecord extends MockRuleInput {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  ruleState: MockRuleStateLabel;
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
}
