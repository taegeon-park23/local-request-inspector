import type { AppIconName } from '@client/shared/ui/AppIcon';

export interface AppSection {
  label: string;
  path: string;
  summary: string;
  role: 'Authoring' | 'Observation' | 'Management' | 'Placeholder';
  icon: AppIconName;
  breadcrumbLabel: string;
}

export const appSections: AppSection[] = [
  {
    label: 'Workspace',
    path: '/workspace',
    summary: 'Request authoring, saved definitions, and active result observation.',
    role: 'Authoring',
    icon: 'workspace',
    breadcrumbLabel: 'Workspace',
  },
  {
    label: 'Captures',
    path: '/captures',
    summary: 'Inbound request observation with replay bridge and bounded handling detail.',
    role: 'Observation',
    icon: 'captures',
    breadcrumbLabel: 'Captures',
  },
  {
    label: 'History',
    path: '/history',
    summary: 'Persisted execution observation with response, console, tests, and stage summary.',
    role: 'Observation',
    icon: 'history',
    breadcrumbLabel: 'History',
  },
  {
    label: 'Mocks',
    path: '/mocks',
    summary: 'Persisted mock rule management with bounded matcher and static response editing.',
    role: 'Management',
    icon: 'mocks',
    breadcrumbLabel: 'Mocks',
  },
  {
    label: 'Environments',
    path: '/environments',
    summary: 'Persisted environment and secret management with default-environment guardrails.',
    role: 'Authoring',
    icon: 'environments',
    breadcrumbLabel: 'Environments',
  },
  {
    label: 'Scripts',
    path: '/scripts',
    summary: 'Standalone saved script library with read-only starter templates.',
    role: 'Authoring',
    icon: 'scripts',
    breadcrumbLabel: 'Scripts',
  },
  {
    label: 'Settings',
    path: '/settings',
    summary: 'Read-only diagnostics hub for app shell, storage, and local command guidance.',
    role: 'Management',
    icon: 'settings',
    breadcrumbLabel: 'Settings',
  },
];
