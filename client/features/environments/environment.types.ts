export type EnvironmentValueType = 'plain' | 'number' | 'boolean' | 'json';

export interface EnvironmentVariableRecord {
  id: string;
  key: string;
  description: string;
  isEnabled: boolean;
  isSecret: boolean;
  valueType: EnvironmentValueType;
  value: string;
  hasStoredValue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentSummaryRecord {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isDefault: boolean;
  variableCount: number;
  enabledVariableCount: number;
  secretVariableCount: number;
  resolutionSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentDetailRecord extends EnvironmentSummaryRecord {
  variables: EnvironmentVariableRecord[];
}

export interface EnvironmentVariableInput {
  id?: string;
  key: string;
  description: string;
  isEnabled: boolean;
  isSecret: boolean;
  valueType: EnvironmentValueType;
  value?: string;
  replacementValue?: string;
  clearStoredValue?: boolean;
  hasStoredValue?: boolean;
}

export interface EnvironmentInput {
  id?: string;
  name: string;
  description: string;
  isDefault: boolean;
  variables: EnvironmentVariableInput[];
}
