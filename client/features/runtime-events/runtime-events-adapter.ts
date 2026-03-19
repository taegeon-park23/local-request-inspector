import { syntheticRuntimeCaptureEvents } from '@client/features/runtime-events/data/runtime-events-fixtures';
import { normalizeRuntimeCaptureEvent } from '@client/features/runtime-events/runtime-events-normalizers';
import type {
  RuntimeCaptureTransportEvent,
  RuntimeConnectionHealth,
  RuntimeEventsAdapter,
  RuntimeEventsAdapterFactory,
  RuntimeEventsMessageHandler,
} from '@client/features/runtime-events/runtime-events.types';

interface SyntheticRuntimeEventsAdapterOptions {
  captureEvents?: RuntimeCaptureTransportEvent[];
  terminalConnectionHealth?: Extract<RuntimeConnectionHealth, 'connected' | 'degraded' | 'offline'>;
}

interface ServerSentRuntimeEventsAdapterOptions {
  url?: string;
}

function parseTransportEvent(rawData: string) {
  try {
    return JSON.parse(rawData) as RuntimeCaptureTransportEvent;
  } catch {
    return null;
  }
}

export function createSyntheticRuntimeEventsAdapter({
  captureEvents = syntheticRuntimeCaptureEvents,
  terminalConnectionHealth = 'connected',
}: SyntheticRuntimeEventsAdapterOptions = {}): RuntimeEventsAdapter {
  let timerIds: Array<ReturnType<typeof globalThis.setTimeout>> = [];

  return {
    start: (handler: RuntimeEventsMessageHandler) => {
      handler({ kind: 'connection', health: 'connecting' });

      timerIds.push(
        globalThis.setTimeout(() => {
          handler({ kind: 'connection', health: terminalConnectionHealth });
        }, 0),
      );

      captureEvents.forEach((event, index) => {
        timerIds.push(
          globalThis.setTimeout(() => {
            handler({
              kind: 'capture.received',
              capture: normalizeRuntimeCaptureEvent(event),
            });
          }, 10 + index * 10),
        );
      });
    },
    stop: () => {
      for (const timerId of timerIds) {
        globalThis.clearTimeout(timerId);
      }

      timerIds = [];
    },
  };
}

export function createServerSentRuntimeEventsAdapter({
  url = '/events',
}: ServerSentRuntimeEventsAdapterOptions = {}): RuntimeEventsAdapter {
  let eventSource: EventSource | null = null;

  return {
    start: (handler: RuntimeEventsMessageHandler) => {
      if (typeof EventSource === 'undefined') {
        handler({ kind: 'connection', health: 'offline' });
        return;
      }

      handler({ kind: 'connection', health: 'connecting' });
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        handler({ kind: 'connection', health: 'connected' });
      };

      eventSource.onerror = () => {
        handler({ kind: 'connection', health: 'degraded' });
      };

      eventSource.onmessage = (message) => {
        const parsedEvent = parseTransportEvent(message.data);

        if (!parsedEvent) {
          handler({ kind: 'connection', health: 'degraded' });
          return;
        }

        handler({
          kind: 'capture.received',
          capture: normalizeRuntimeCaptureEvent(parsedEvent),
        });
      };
    },
    stop: () => {
      eventSource?.close();
      eventSource = null;
    },
  };
}

export const createDefaultRuntimeEventsAdapter: RuntimeEventsAdapterFactory = () =>
  createSyntheticRuntimeEventsAdapter();

