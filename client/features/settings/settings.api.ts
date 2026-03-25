import { parseApiJsonResponse } from '@client/features/request-builder/request-builder.api';
import type { RuntimeStatusResponse } from '@client/features/settings/settings.types';

export const runtimeStatusQueryKey = ['settings-runtime-status'] as const;

export async function readRuntimeStatus() {
  const response = await fetch('/api/settings/runtime-status');
  return parseApiJsonResponse<{ status: RuntimeStatusResponse }>(response).then((payload) => payload.status);
}
