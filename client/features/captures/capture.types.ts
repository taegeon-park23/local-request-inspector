export type CaptureMockOutcome = 'Mocked' | 'Bypassed' | 'No rule matched' | 'Blocked';

export type CaptureOutcomeFilter = 'all' | CaptureMockOutcome;

export type CaptureReplayBodyModeHint = 'none' | 'json' | 'text';

export interface CaptureRequestInputItem {
  key: string;
  value: string;
}

export interface CaptureTimelineEntry {
  id: string;
  title: string;
  summary: string;
}

export interface CaptureRecord {
  id: string;
  method: string;
  url: string;
  host: string;
  path: string;
  receivedAtIso: string;
  receivedAtLabel: string;
  bodyHint: string;
  requestSummary: string;
  headersSummary: string;
  bodyPreview: string;
  bodyModeHint: CaptureReplayBodyModeHint;
  requestHeaders: CaptureRequestInputItem[];
  mockOutcome: CaptureMockOutcome;
  mockSummary: string;
  responseSummary: string;
  scopeLabel: string;
  timelineEntries: CaptureTimelineEntry[];
  mockRuleName?: string;
}
