export interface AppSection {
  label: string;
  path: string;
  summary: string;
  role: 'Authoring' | 'Observation' | 'Management' | 'Placeholder';
}

export const appSections: AppSection[] = [
  { label: 'Workspace', path: '/workspace', summary: 'Request authoring, saved definitions, and active result observation.', role: 'Authoring' },
  { label: 'Captures', path: '/captures', summary: 'Inbound request observation with replay bridge and bounded handling detail.', role: 'Observation' },
  { label: 'History', path: '/history', summary: 'Persisted execution observation with response, console, tests, and stage summary.', role: 'Observation' },
  { label: 'Mocks', path: '/mocks', summary: 'Persisted mock rule management with bounded matcher and static response editing.', role: 'Management' },
  { label: 'Environments', path: '/environments', summary: 'Environment and secret management placeholder.', role: 'Placeholder' },
  { label: 'Scripts', path: '/scripts', summary: 'Automation script catalog placeholder.', role: 'Placeholder' },
  { label: 'Settings', path: '/settings', summary: 'Workspace settings and diagnostics placeholder.', role: 'Placeholder' },
];
