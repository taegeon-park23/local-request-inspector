export type HistoryObservationHealth = 'ready' | 'degraded';
export type HistoryExecutionOutcome = 'Succeeded' | 'Failed' | 'Timed out' | 'Cancelled' | 'Blocked';
export type HistoryTransportOutcome =
  | '200 OK'
  | '404 Not Found'
  | '503 Service Unavailable'
  | 'No response'
  | 'Blocked before transport';
export type HistoryTestOutcome = 'All tests passed' | 'Some tests failed' | 'No tests' | 'Tests skipped';
export type HistoryOutcomeFilter = 'all' | HistoryExecutionOutcome;
export type HistoryResultTabId = 'response' | 'console' | 'tests' | 'execution-info';
export type HistoryRequestBodyMode = 'none' | 'json' | 'text' | 'form-urlencoded' | 'multipart-form-data';
export type HistoryRequestAuthType = 'none' | 'bearer' | 'basic' | 'api-key';
export type HistoryApiKeyPlacement = 'header' | 'query';

export interface HistoryRequestInputItem {
  key: string;
  value: string;
}

export interface HistoryRequestAuthSnapshot {
  type: HistoryRequestAuthType;
  bearerToken: string;
  basicUsername: string;
  basicPassword: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyPlacement: HistoryApiKeyPlacement;
}

export interface HistoryTimelineEntry {
  id: string;
  title: string;
  summary: string;
}

export interface HistoryRecord {
  id: string;
  executionId: string;
  requestLabel: string;
  method: string;
  url: string;
  hostPathHint: string;
  executedAtLabel: string;
  durationLabel: string;
  durationMs: number;
  executionOutcome: HistoryExecutionOutcome;
  transportOutcome: HistoryTransportOutcome;
  transportStatusCode: number | null;
  testOutcome: HistoryTestOutcome;
  testSummaryLabel: string;
  requestSnapshotSummary: string;
  requestParams: HistoryRequestInputItem[];
  requestHeaders: HistoryRequestInputItem[];
  requestBodyMode: HistoryRequestBodyMode;
  requestBodyText: string;
  requestAuth: HistoryRequestAuthSnapshot;
  responseSummary: string;
  headersSummary: string;
  bodyHint: string;
  bodyPreview: string;
  consoleSummary: string;
  consolePreview: string[];
  consoleLogCount: number;
  consoleWarningCount: number;
  testsSummary: string;
  assertionCount: number;
  passedAssertions: number;
  failedAssertions: number;
  testsPreview: string[];
  startedAtLabel: string;
  completedAtLabel: string;
  environmentLabel: string;
  sourceLabel: string;
  timelineEntries: HistoryTimelineEntry[];
}

export interface HistoryFixtureScenario {
  observationHealth: HistoryObservationHealth;
  listItems: HistoryRecord[];
  selectedHistoryId: string | null;
}
