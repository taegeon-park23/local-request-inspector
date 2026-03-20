import { normalizeRuntimeCaptureEvent } from '@client/features/runtime-events/runtime-events-normalizers';
import { syntheticRuntimeCaptureEvents } from '@client/features/runtime-events/data/runtime-events-fixtures';

export const defaultCaptureFixtureRecords = syntheticRuntimeCaptureEvents.map((event) =>
  normalizeRuntimeCaptureEvent(event),
);
