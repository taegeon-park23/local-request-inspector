import type { CaptureRecord } from '@client/features/captures/capture.types';

export type RuntimeConnectionHealth = 'idle' | 'connecting' | 'connected' | 'degraded' | 'offline';

export interface RuntimeCaptureTransportEvent {
  id: string | number;
  method: string;
  url: string;
  receivedAtIso?: string;
  timestamp?: string;
  parsedHeaders?: Record<string, string>;
  rawBody?: string;
  parsedBody?: unknown;
  mockOutcome?: CaptureRecord['mockOutcome'];
  mockRuleName?: string;
  workspaceLabel?: string;
}

export type RuntimeEventsMessage =
  | {
      kind: 'connection';
      health: RuntimeConnectionHealth;
    }
  | {
      kind: 'capture.received';
      capture: CaptureRecord;
    };

export type RuntimeEventsMessageHandler = (message: RuntimeEventsMessage) => void;

export interface RuntimeEventsAdapter {
  start: (handler: RuntimeEventsMessageHandler) => void;
  stop: () => void;
}

export type RuntimeEventsAdapterFactory = () => RuntimeEventsAdapter;
