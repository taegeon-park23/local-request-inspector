import type { CaptureMockOutcome, CaptureRecord } from '@client/features/captures/capture.types';
import type { RuntimeCaptureTransportEvent } from '@client/features/runtime-events/runtime-events.types';

const bodyHintByOutcome: Record<CaptureMockOutcome, string> = {
  Mocked: 'Mock response returned from an enabled rule.',
  Bypassed: 'Request continued through the fallback runtime path.',
  'No rule matched': 'No enabled mock rule matched this request.',
  Blocked: 'Mock evaluation could not finish safely.',
};

function formatReceivedAtLabel(receivedAtIso?: string, timestamp?: string) {
  if (receivedAtIso) {
    return new Date(receivedAtIso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return timestamp ?? 'Unknown time';
}

function createBodyHint(event: RuntimeCaptureTransportEvent) {
  if (typeof event.parsedBody === 'string' && event.parsedBody.trim().length > 0) {
    return `Text body · ${event.parsedBody.trim().slice(0, 44)}`;
  }

  if (event.parsedBody && typeof event.parsedBody === 'object') {
    return `JSON body · ${Object.keys(event.parsedBody as Record<string, unknown>).length} field(s)`;
  }

  if (event.rawBody && event.rawBody !== 'No Body or Binary') {
    return `Raw body · ${event.rawBody.slice(0, 44)}`;
  }

  return 'No body payload';
}

function createBodyPreview(event: RuntimeCaptureTransportEvent) {
  if (typeof event.parsedBody === 'string' && event.parsedBody.trim().length > 0) {
    return event.parsedBody;
  }

  if (event.parsedBody && typeof event.parsedBody === 'object') {
    return JSON.stringify(event.parsedBody, null, 2);
  }

  if (event.rawBody && event.rawBody !== 'No Body or Binary') {
    return event.rawBody;
  }

  return 'No request body payload was captured for this request.';
}

function createHeadersSummary(headers: Record<string, string>) {
  const headerNames = Object.keys(headers);
  const contentType = headers['content-type'] ?? headers['Content-Type'];

  if (headerNames.length === 0) {
    return 'No headers were normalized into this capture skeleton.';
  }

  if (contentType) {
    return `${headerNames.length} header(s) · ${contentType}`;
  }

  return `${headerNames.length} header(s) observed`;
}

function createMockSummary(mockOutcome: CaptureMockOutcome, mockRuleName?: string) {
  if (mockOutcome === 'Mocked' && mockRuleName) {
    return `Matched mock rule "${mockRuleName}" and generated the response locally.`;
  }

  return bodyHintByOutcome[mockOutcome];
}

function createResponseSummary(mockOutcome: CaptureMockOutcome) {
  switch (mockOutcome) {
    case 'Mocked':
      return 'Response handling stayed inside the mock engine. Upstream transport detail is intentionally absent.';
    case 'Bypassed':
      return 'The runtime let this request continue through the fallback handling path.';
    case 'No rule matched':
      return 'No rule matched, so the runtime fell back without recording deep transport detail in S4.';
    case 'Blocked':
      return 'The runtime blocked response generation before a mock or fallback response could complete.';
    default:
      return 'Response handling summary is not available.';
  }
}

export function normalizeRuntimeCaptureEvent(event: RuntimeCaptureTransportEvent): CaptureRecord {
  const normalizedUrl = new URL(event.url, 'http://localhost');
  const mockOutcome = event.mockOutcome ?? 'Bypassed';
  const receivedAtIso = event.receivedAtIso ?? new Date(0).toISOString();
  const receivedAtLabel = formatReceivedAtLabel(event.receivedAtIso, event.timestamp);
  const headers = event.parsedHeaders ?? {};
  const path = `${normalizedUrl.pathname}${normalizedUrl.search}`;
  const scopeLabel = event.workspaceLabel ?? 'All runtime captures';
  const mockSummary = createMockSummary(mockOutcome, event.mockRuleName);
  const responseSummary = createResponseSummary(mockOutcome);

  return {
    id: String(event.id),
    method: event.method.toUpperCase(),
    host: normalizedUrl.host,
    path,
    receivedAtIso,
    receivedAtLabel,
    bodyHint: createBodyHint(event),
    requestSummary: `${event.method.toUpperCase()} ${path} reached ${normalizedUrl.host} as an inbound capture.`,
    headersSummary: createHeadersSummary(headers),
    bodyPreview: createBodyPreview(event),
    mockOutcome,
    mockSummary,
    responseSummary,
    scopeLabel,
    timelineEntries: [
      {
        id: `${event.id}-received`,
        title: 'Request received',
        summary: `${event.method.toUpperCase()} ${path} was captured at ${receivedAtLabel}.`,
      },
      {
        id: `${event.id}-mock`,
        title: 'Mock evaluation summary',
        summary: mockSummary,
      },
      {
        id: `${event.id}-response`,
        title: 'Response handling summary',
        summary: responseSummary,
      },
    ],
    ...(event.mockRuleName ? { mockRuleName: event.mockRuleName } : {}),
  };
}
