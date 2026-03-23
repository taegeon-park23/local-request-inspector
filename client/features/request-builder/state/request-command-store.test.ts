import { afterEach, describe, expect, it } from 'vitest';
import { resetRequestCommandStore, useRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import type { RequestRunObservation } from '@client/features/request-builder/request-builder.api';

function createExecution(overrides?: Partial<RequestRunObservation>): RequestRunObservation {
  return {
    executionId: 'execution-1',
    executionOutcome: 'Succeeded',
    responseStatus: 200,
    responseStatusLabel: 'HTTP 200',
    responseHeaders: [],
    responseHeadersSummary: 'No response headers were captured.',
    responseBodyPreview: '{"ok":true}',
    responseBodyHint: '11 characters captured from the latest run.',
    responsePreviewSizeLabel: '11 B response body',
    responsePreviewPolicy: 'Preview is bounded before richer diagnostics and raw payload inspection are added.',
    startedAt: '2026-03-23T08:00:00.000Z',
    completedAt: '2026-03-23T08:00:00.050Z',
    durationMs: 50,
    consoleSummary: 'No console entries were recorded for the latest execution.',
    consoleEntries: [],
    consoleLogCount: 0,
    consoleWarningCount: 0,
    testsSummary: 'No tests were recorded for the latest execution.',
    testEntries: [],
    requestSnapshotSummary: 'GET https://api.example.com/focus executed from the active workspace draft.',
    requestInputSummary: '0 params · 0 headers · No body · No auth',
    requestHeaderCount: 0,
    requestParamCount: 0,
    requestBodyMode: 'none',
    authSummary: 'No auth',
    stageSummaries: [],
    ...overrides,
  };
}

afterEach(() => {
  resetRequestCommandStore();
});

describe('request-command-store result focus', () => {
  it('prioritizes the tests tab when the latest execution returns test output', () => {
    const store = useRequestCommandStore.getState();

    store.startRun('tab-1');
    store.finishRunSuccess('tab-1', createExecution({
      consoleEntries: ['[post-response] response logged'],
      testEntries: ['PASS response status is 200'],
      testsSummary: '1 assertion passed. No failures.',
      consoleSummary: '1 bounded console entry captured across script stages.',
    }));

    expect(useRequestCommandStore.getState().byTabId['tab-1']?.run.activeResultTab).toBe('tests');
  });

  it('falls back to the console tab when a run has console output but no tests', () => {
    const store = useRequestCommandStore.getState();

    store.startRun('tab-2');
    store.finishRunError('tab-2', createExecution({
      executionOutcome: 'Failed',
      responseStatus: null,
      responseStatusLabel: 'No response',
      consoleEntries: ['[pre-request] request prepared'],
      consoleSummary: '1 bounded console entry captured before transport failed.',
      errorSummary: 'Transport failed.',
      testsSummary: 'No tests were recorded because transport never completed.',
    }), 'Transport failed.');

    expect(useRequestCommandStore.getState().byTabId['tab-2']?.run.activeResultTab).toBe('console');
  });
});
