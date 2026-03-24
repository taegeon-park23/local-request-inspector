import type {
  EnvironmentResolutionAffectedInputArea,
  EnvironmentResolutionStatus,
} from '@client/shared/environment-resolution-summary';
import type { MessageValues } from '@client/shared/i18n/messages';
const statusTranslationKeys: Record<EnvironmentResolutionStatus, string> = {
  'not-selected': 'status.notSelected',
  resolved: 'status.resolved',
  'blocked-missing-environment': 'status.missingEnvironment',
  'blocked-unresolved-placeholders': 'status.unresolvedPlaceholders',
  'blocked-invalid-resolved-json': 'status.invalidResolvedJson',
};

const areaTranslationKeys: Record<EnvironmentResolutionAffectedInputArea, string> = {
  url: 'areas.url',
  params: 'areas.params',
  headers: 'areas.headers',
  body: 'areas.body',
  auth: 'areas.auth',
};

export function formatEnvironmentResolutionStatusLabel(
  status: EnvironmentResolutionStatus,
  translate: (key: string, values?: MessageValues) => string,
  translationBaseKey: string,
) {
  const key = `${translationBaseKey}.${statusTranslationKeys[status]}`;
  return translate(key);
}

export function formatEnvironmentResolutionAffectedAreas(
  affectedInputAreas: EnvironmentResolutionAffectedInputArea[],
  translate: (key: string, values?: MessageValues) => string,
  translationBaseKey: string,
) {
  if (affectedInputAreas.length === 0) {
    const noneKey = `${translationBaseKey}.areas.none`;
    return translate(noneKey);
  }

  return affectedInputAreas
    .map((area) => {
      const key = `${translationBaseKey}.${areaTranslationKeys[area]}`;
      return translate(key);
    })
    .join(', ');
}
