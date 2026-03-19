export interface AppSection {
  label: string;
  path: string;
  summary: string;
}

export const appSections: AppSection[] = [
  { label: 'Workspace', path: '/workspace', summary: 'Request authoring shell placeholder.' },
  { label: 'Captures', path: '/captures', summary: 'Inbound capture observation skeleton and runtime feed seam.' },
  { label: 'History', path: '/history', summary: 'Execution history observation skeleton and result composition.' },
  { label: 'Mocks', path: '/mocks', summary: 'Mock rule management skeleton with list/detail shell and local draft entrypoint.' },
  { label: 'Environments', path: '/environments', summary: 'Environment and secret management placeholder.' },
  { label: 'Scripts', path: '/scripts', summary: 'Automation script catalog placeholder.' },
  { label: 'Settings', path: '/settings', summary: 'Workspace settings and diagnostics placeholder.' },
];
