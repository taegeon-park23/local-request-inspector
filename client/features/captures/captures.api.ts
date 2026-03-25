import { parseApiJsonResponse } from '@client/features/request-builder/request-builder.api';
import type { RequestDefinitionInput } from '@client/features/request-builder/request-builder.api';
import type { CaptureRecord } from '@client/features/captures/capture.types';

export const capturedRequestsQueryKey = ['captured-requests'] as const;
export const capturedRequestDetailQueryKey = (capturedRequestId: string | null) =>
  ['captured-requests', capturedRequestId] as const;

export async function listCapturedRequests() {
  const response = await fetch('/api/captured-requests');
  return parseApiJsonResponse<{ items: CaptureRecord[] }>(response).then((payload) => payload.items);
}

export async function readCapturedRequest(capturedRequestId: string) {
  const response = await fetch(`/api/captured-requests/${capturedRequestId}`);
  return parseApiJsonResponse<{ capture: CaptureRecord }>(response).then((payload) => payload.capture);
}

export async function createCapturedRequestReplay(capturedRequestId: string) {
  const response = await fetch(`/api/captured-requests/${capturedRequestId}/replay`, {
    method: 'POST',
  });
  return parseApiJsonResponse<{ request: RequestDefinitionInput }>(response).then((payload) => payload.request);
}
