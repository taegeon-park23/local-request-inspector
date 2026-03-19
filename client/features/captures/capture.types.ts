export type CaptureMockOutcome = 'Mocked' | 'Bypassed' | 'No rule matched' | 'Blocked';

export type CaptureOutcomeFilter = 'all' | CaptureMockOutcome;

export interface CaptureTimelineEntry {
  id: string;
  title: string;
  summary: string;
}

export interface CaptureRecord {
  id: string;
  method: string;
  host: string;
  path: string;
  receivedAtIso: string;
  receivedAtLabel: string;
  bodyHint: string;
  requestSummary: string;
  headersSummary: string;
  bodyPreview: string;
  mockOutcome: CaptureMockOutcome;
  mockSummary: string;
  responseSummary: string;
  scopeLabel: string;
  timelineEntries: CaptureTimelineEntry[];
  mockRuleName?: string;
}
