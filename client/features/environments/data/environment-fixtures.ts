import type {
  EnvironmentDetailRecord,
  EnvironmentSummaryRecord,
} from '@client/features/environments/environment.types';

const localEnvironment: EnvironmentDetailRecord = {
  id: 'environment-local',
  workspaceId: 'local-workspace',
  name: 'Local API',
  description: 'Primary localhost defaults for development.',
  isDefault: true,
  variableCount: 3,
  enabledVariableCount: 3,
  secretVariableCount: 1,
  resolutionSummary: '3 variables are managed here, including 1 secret-backed entry. Plain placeholders resolve at run time, while secret rows stay write-only until a secure backend is available.',
  createdAt: '2026-03-22T09:00:00.000Z',
  updatedAt: '2026-03-22T09:00:00.000Z',
  variables: [
    {
      id: 'environment-variable-local-1',
      key: 'API_BASE',
      description: 'Runtime base URL',
      isEnabled: true,
      isSecret: false,
      valueType: 'plain',
      value: 'http://localhost:5671',
      hasStoredValue: false,
      createdAt: '2026-03-22T09:00:00.000Z',
      updatedAt: '2026-03-22T09:00:00.000Z',
    },
    {
      id: 'environment-variable-local-2',
      key: 'API_TOKEN',
      description: 'Write-only local token',
      isEnabled: true,
      isSecret: true,
      valueType: 'plain',
      value: '',
      hasStoredValue: true,
      createdAt: '2026-03-22T09:00:00.000Z',
      updatedAt: '2026-03-22T09:00:00.000Z',
    },
    {
      id: 'environment-variable-local-3',
      key: 'STRIPE_MODE',
      description: 'Example non-secret flag',
      isEnabled: true,
      isSecret: false,
      valueType: 'plain',
      value: 'test',
      hasStoredValue: false,
      createdAt: '2026-03-22T09:00:00.000Z',
      updatedAt: '2026-03-22T09:00:00.000Z',
    },
  ],
};

const stagingEnvironment: EnvironmentDetailRecord = {
  id: 'environment-staging',
  workspaceId: 'local-workspace',
  name: 'Shared staging',
  description: 'Bounded shared staging defaults without runtime linkage yet.',
  isDefault: false,
  variableCount: 2,
  enabledVariableCount: 1,
  secretVariableCount: 1,
  resolutionSummary: '2 variables are managed here, including 1 secret-backed entry. Plain placeholders resolve at run time, while secret rows stay write-only until a secure backend is available.',
  createdAt: '2026-03-21T09:00:00.000Z',
  updatedAt: '2026-03-21T09:00:00.000Z',
  variables: [
    {
      id: 'environment-variable-staging-1',
      key: 'API_BASE',
      description: 'Shared staging base URL',
      isEnabled: true,
      isSecret: false,
      valueType: 'plain',
      value: 'https://staging.example.com',
      hasStoredValue: false,
      createdAt: '2026-03-21T09:00:00.000Z',
      updatedAt: '2026-03-21T09:00:00.000Z',
    },
    {
      id: 'environment-variable-staging-2',
      key: 'STAGING_TOKEN',
      description: 'Shared staging token',
      isEnabled: false,
      isSecret: true,
      valueType: 'plain',
      value: '',
      hasStoredValue: true,
      createdAt: '2026-03-21T09:00:00.000Z',
      updatedAt: '2026-03-21T09:00:00.000Z',
    },
  ],
};

export const defaultEnvironmentFixtureDetails: EnvironmentDetailRecord[] = [
  localEnvironment,
  stagingEnvironment,
];

export const defaultEnvironmentFixtureSummaries: EnvironmentSummaryRecord[] =
  defaultEnvironmentFixtureDetails.map((environment) => (
    Object.fromEntries(
      Object.entries(environment).filter(([key]) => key !== 'variables'),
    ) as EnvironmentSummaryRecord
  ));
