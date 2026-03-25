import { RequestBuilderApiError } from '@client/features/request-builder/request-builder.api';

type SharedErrorMessageKey =
  | 'common.errors.backendUnavailable'
  | 'common.errors.invalidApiResponse';

type SharedTranslate = (key: SharedErrorMessageKey) => string;

export function isBackendUnavailableApiError(error: unknown) {
  return error instanceof RequestBuilderApiError && error.code === 'backend_unavailable';
}

export function resolveApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
  t: SharedTranslate,
) {
  if (isBackendUnavailableApiError(error)) {
    return t('common.errors.backendUnavailable');
  }

  if (error instanceof RequestBuilderApiError && error.code === 'invalid_api_response') {
    return t('common.errors.invalidApiResponse');
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
