import { parseApiJsonResponse } from '@client/features/request-builder/request-builder.api';
import type {
  HistoryExecutionResultRecord,
  HistoryPersistedTestResult,
  HistoryRecord,
} from '@client/features/history/history.types';

export const executionHistoryListQueryKey = ['execution-histories'] as const;
export const executionHistoryDetailQueryKey = (executionId: string | null) =>
  ['execution-histories', executionId] as const;

export async function listExecutionHistories() {
  const response = await fetch('/api/execution-histories');
  return parseApiJsonResponse<{ items: HistoryRecord[] }>(response).then((payload) => payload.items);
}

export async function readExecutionHistory(executionId: string) {
  const response = await fetch(`/api/execution-histories/${executionId}`);
  return parseApiJsonResponse<{ history: HistoryRecord }>(response).then((payload) => payload.history);
}

export async function readExecutionResult(executionId: string) {
  const response = await fetch(`/api/execution-histories/${executionId}/result`);
  return parseApiJsonResponse<{ result: HistoryExecutionResultRecord }>(response).then((payload) => payload.result);
}

export async function listExecutionTestResults(executionId: string) {
  const response = await fetch(`/api/execution-histories/${executionId}/test-results`);
  return parseApiJsonResponse<{ items: HistoryPersistedTestResult[] }>(response).then((payload) => payload.items);
}
