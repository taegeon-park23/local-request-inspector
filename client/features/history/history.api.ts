import { RequestBuilderApiError } from '@client/features/request-builder/request-builder.api';
import type {
  HistoryExecutionResultRecord,
  HistoryPersistedTestResult,
  HistoryRecord,
} from '@client/features/history/history.types';

interface ApiEnvelope<TData> {
  data: TData;
}

interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable?: boolean;
  };
}

export const executionHistoryListQueryKey = ['execution-histories'] as const;
export const executionHistoryDetailQueryKey = (executionId: string | null) =>
  ['execution-histories', executionId] as const;

async function parseJsonResponse<TData>(response: Response): Promise<TData> {
  const responseText = await response.text();
  const payload = responseText.length > 0
    ? JSON.parse(responseText) as ApiEnvelope<TData> | ApiErrorEnvelope
    : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorEnvelope | null;

    throw new RequestBuilderApiError({
      message: errorPayload?.error?.message ?? `Request failed with status ${response.status}`,
      status: response.status,
      ...(errorPayload?.error?.code ? { code: errorPayload.error.code } : {}),
      ...(errorPayload?.error?.details ? { details: errorPayload.error.details } : {}),
      ...(typeof errorPayload?.error?.retryable === 'boolean'
        ? { retryable: errorPayload.error.retryable }
        : {}),
    });
  }

  return (payload as ApiEnvelope<TData>).data;
}

export async function listExecutionHistories() {
  const response = await fetch('/api/execution-histories');
  return parseJsonResponse<{ items: HistoryRecord[] }>(response).then((payload) => payload.items);
}

export async function readExecutionHistory(executionId: string) {
  const response = await fetch(`/api/execution-histories/${executionId}`);
  return parseJsonResponse<{ history: HistoryRecord }>(response).then((payload) => payload.history);
}

export async function readExecutionResult(executionId: string) {
  const response = await fetch(`/api/execution-histories/${executionId}/result`);
  return parseJsonResponse<{ result: HistoryExecutionResultRecord }>(response).then((payload) => payload.result);
}

export async function listExecutionTestResults(executionId: string) {
  const response = await fetch(`/api/execution-histories/${executionId}/test-results`);
  return parseJsonResponse<{ items: HistoryPersistedTestResult[] }>(response).then((payload) => payload.items);
}
