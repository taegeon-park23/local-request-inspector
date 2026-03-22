export type HistoryObservationHealth = 'ready' | 'degraded';
export type HistoryExecutionOutcome = 'Succeeded' | 'Failed' | 'Timed out' | 'Cancelled' | 'Blocked';
export type HistoryTransportOutcome = string;
export type HistoryTestOutcome = 'All tests passed' | 'Some tests failed' | 'No tests' | 'Tests skipped';
export type HistoryOutcomeFilter = 'all' | HistoryExecutionOutcome;
export type HistoryResultTabId = 'response' | 'console' | 'tests' | 'execution-info';
export type HistoryRequestBodyMode = 'none' | 'json' | 'text' | 'form-urlencoded' | 'multipart-form-data';
export type HistoryRequestAuthType = 'none' | 'bearer' | 'basic' | 'api-key';
export type HistoryApiKeyPlacement = 'header' | 'query';
export type HistoryStageOutcome = 'Succeeded' | 'Failed' | 'Blocked' | 'Timed out' | 'Skipped';

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

export interface HistoryStageSummary {
  stageId: 'pre-request' | 'transport' | 'post-response' | 'tests';
  label: string;
  status: HistoryStageOutcome;
  summary: string;
  errorCode?: string;
  errorSummary?: string;
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
  requestInputSummary?: string;
  requestParamCount?: number;
  requestHeaderCount?: number;
  requestParams: HistoryRequestInputItem[];
  requestHeaders: HistoryRequestInputItem[];
  requestBodyMode: HistoryRequestBodyMode;
  requestBodyText: string;
  requestAuth: HistoryRequestAuthSnapshot;
  requestResourceId?: string | null;
  requestCollectionName?: string;
  requestFolderName?: string;
  responseSummary: string;
  headersSummary: string;
  bodyHint: string;
  bodyPreview: string;
  responsePreviewSizeLabel?: string;
  responsePreviewPolicy?: string;
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
  environmentId?: string | null;
  environmentLabel: string;
  sourceLabel: string;
  errorCode?: string | null;
  errorSummary?: string;
  stageSummaries?: HistoryStageSummary[];
  timelineEntries: HistoryTimelineEntry[];
}

export interface HistoryFixtureScenario {
  observationHealth: HistoryObservationHealth;
  listItems: HistoryRecord[];
  selectedHistoryId: string | null;
}
