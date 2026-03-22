import type { AppIconName } from '@client/shared/ui/AppIcon';

export type AppSectionId =
  | 'workspace'
  | 'captures'
  | 'history'
  | 'mocks'
  | 'environments'
  | 'scripts'
  | 'settings';

export type AppSectionRole = 'authoring' | 'observation' | 'management' | 'placeholder';

export interface AppSection {
  id: AppSectionId;
  path: string;
  role: AppSectionRole;
  icon: AppIconName;
}

export const appSections: AppSection[] = [
  {
    id: 'workspace',
    path: '/workspace',
    role: 'authoring',
    icon: 'workspace',
  },
  {
    id: 'captures',
    path: '/captures',
    role: 'observation',
    icon: 'captures',
  },
  {
    id: 'history',
    path: '/history',
    role: 'observation',
    icon: 'history',
  },
  {
    id: 'mocks',
    path: '/mocks',
    role: 'management',
    icon: 'mocks',
  },
  {
    id: 'environments',
    path: '/environments',
    role: 'authoring',
    icon: 'environments',
  },
  {
    id: 'scripts',
    path: '/scripts',
    role: 'authoring',
    icon: 'scripts',
  },
  {
    id: 'settings',
    path: '/settings',
    role: 'management',
    icon: 'settings',
  },
];
