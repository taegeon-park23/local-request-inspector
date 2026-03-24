import { RequestBuilderApiError } from '@client/features/request-builder/request-builder.api';
import type { RequestDefinitionInput } from '@client/features/request-builder/request-builder.api';
import type { CaptureRecord } from '@client/features/captures/capture.types';

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

export const capturedRequestsQueryKey = ['captured-requests'] as const;
export const capturedRequestDetailQueryKey = (capturedRequestId: string | null) =>
  ['captured-requests', capturedRequestId] as const;


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

export async function listCapturedRequests() {
  const response = await fetch('/api/captured-requests');
  return parseJsonResponse<{ items: CaptureRecord[] }>(response).then((payload) => payload.items);
}

export async function readCapturedRequest(capturedRequestId: string) {
  const response = await fetch(`/api/captured-requests/${capturedRequestId}`);
  return parseJsonResponse<{ capture: CaptureRecord }>(response).then((payload) => payload.capture);
}

export async function createCapturedRequestReplay(capturedRequestId: string) {
  const response = await fetch(`/api/captured-requests/${capturedRequestId}/replay`, {
    method: 'POST',
  });
  return parseJsonResponse<{ request: RequestDefinitionInput }>(response).then((payload) => payload.request);
}
