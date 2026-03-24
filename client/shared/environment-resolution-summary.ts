export type EnvironmentResolutionStatus =
  | 'not-selected'
  | 'resolved'
  | 'blocked-missing-environment'
  | 'blocked-unresolved-placeholders'
  | 'blocked-invalid-resolved-json';

export type EnvironmentResolutionAffectedInputArea = 'url' | 'params' | 'headers' | 'body' | 'auth';

export interface EnvironmentResolutionSummary {
  status: EnvironmentResolutionStatus;
  summary: string;
  resolvedPlaceholderCount: number;
  unresolvedPlaceholderCount: number;
  affectedInputAreas: EnvironmentResolutionAffectedInputArea[];
}
