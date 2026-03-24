import type { RuntimeConnectionHealth } from '@client/features/runtime-events/runtime-events.types';
import { create } from 'zustand';

export type FloatingExplorerRouteKey =
  | 'workspace'
  | 'captures'
  | 'history'
  | 'mocks'
  | 'environments'
  | 'scripts';

type FloatingExplorerOpenByRoute = Record<FloatingExplorerRouteKey, boolean>;
export type ShellDensityMode = 'compact' | 'comfortable';

export const shellNavRailPreferenceStorageKey = 'local-request-inspector.shell.navRailCollapsed';
export const shellFloatingExplorerDefaultOpenStorageKey = 'local-request-inspector.shell.floatingExplorerDefaultOpen';
export const shellDensityPreferenceStorageKey = 'local-request-inspector.shell.densityMode';

const floatingExplorerRouteKeys: FloatingExplorerRouteKey[] = [
  'workspace',
  'captures',
  'history',
  'mocks',
  'environments',
  'scripts',
];

interface ShellState {
  runtimeConnectionHealth: RuntimeConnectionHealth;
  navRailCollapsed: boolean;
  floatingExplorerDefaultOpen: boolean;
  shellDensityMode: ShellDensityMode;
  floatingExplorerOpenByRoute: FloatingExplorerOpenByRoute;
  setRuntimeConnectionHealth: (health: RuntimeConnectionHealth) => void;
  setNavRailCollapsed: (collapsed: boolean) => void;
  setFloatingExplorerDefaultOpen: (open: boolean) => void;
  setShellDensityMode: (mode: ShellDensityMode) => void;
  toggleNavRailCollapsed: () => void;
  setFloatingExplorerOpen: (route: FloatingExplorerRouteKey, open: boolean) => void;
  toggleFloatingExplorer: (route: FloatingExplorerRouteKey) => void;
}

function readNavRailPreference() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(shellNavRailPreferenceStorageKey) === 'true';
  } catch {
    return false;
  }
}

function readFloatingExplorerDefaultOpenPreference() {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage.getItem(shellFloatingExplorerDefaultOpenStorageKey) !== 'false';
  } catch {
    return true;
  }
}

function readShellDensityPreference(): ShellDensityMode {
  if (typeof window === 'undefined') {
    return 'compact';
  }

  try {
    return window.localStorage.getItem(shellDensityPreferenceStorageKey) === 'comfortable'
      ? 'comfortable'
      : 'compact';
  } catch {
    return 'compact';
  }
}

function writeNavRailPreference(collapsed: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(shellNavRailPreferenceStorageKey, String(collapsed));
  } catch {
    // Ignore storage write failures.
  }
}

function writeFloatingExplorerDefaultOpenPreference(open: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(shellFloatingExplorerDefaultOpenStorageKey, String(open));
  } catch {
    // Ignore storage write failures.
  }
}

function writeShellDensityPreference(mode: ShellDensityMode) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(shellDensityPreferenceStorageKey, mode);
  } catch {
    // Ignore storage write failures.
  }
}

function createFloatingExplorerOpenByRoute(open: boolean): FloatingExplorerOpenByRoute {
  return floatingExplorerRouteKeys.reduce<FloatingExplorerOpenByRoute>((accumulator, routeKey) => {
    accumulator[routeKey] = open;
    return accumulator;
  }, {} as FloatingExplorerOpenByRoute);
}

function createInitialShellState(): Pick<ShellState, 'runtimeConnectionHealth' | 'navRailCollapsed' | 'floatingExplorerDefaultOpen' | 'shellDensityMode' | 'floatingExplorerOpenByRoute'> {
  const floatingExplorerDefaultOpen = readFloatingExplorerDefaultOpenPreference();
  return {
    runtimeConnectionHealth: 'idle',
    navRailCollapsed: readNavRailPreference(),
    floatingExplorerDefaultOpen,
    shellDensityMode: readShellDensityPreference(),
    floatingExplorerOpenByRoute: createFloatingExplorerOpenByRoute(floatingExplorerDefaultOpen),
  };
}

export const useShellStore = create<ShellState>((set) => ({
  ...createInitialShellState(),
  setRuntimeConnectionHealth: (runtimeConnectionHealth) => set({ runtimeConnectionHealth }),
  setNavRailCollapsed: (navRailCollapsed) => {
    writeNavRailPreference(navRailCollapsed);
    set({ navRailCollapsed });
  },
  setFloatingExplorerDefaultOpen: (floatingExplorerDefaultOpen) => {
    writeFloatingExplorerDefaultOpenPreference(floatingExplorerDefaultOpen);
    set({
      floatingExplorerDefaultOpen,
      floatingExplorerOpenByRoute: createFloatingExplorerOpenByRoute(floatingExplorerDefaultOpen),
    });
  },
  setShellDensityMode: (shellDensityMode) => {
    writeShellDensityPreference(shellDensityMode);
    set({ shellDensityMode });
  },
  toggleNavRailCollapsed: () => set((state) => {
    const navRailCollapsed = !state.navRailCollapsed;
    writeNavRailPreference(navRailCollapsed);
    return { navRailCollapsed };
  }),
  setFloatingExplorerOpen: (route, open) => set((state) => ({
    floatingExplorerOpenByRoute: {
      ...state.floatingExplorerOpenByRoute,
      [route]: open,
    },
  })),
  toggleFloatingExplorer: (route) => set((state) => ({
    floatingExplorerOpenByRoute: {
      ...state.floatingExplorerOpenByRoute,
      [route]: !state.floatingExplorerOpenByRoute[route],
    },
  })),
}));

export function resetShellStore() {
  const initialShellState = createInitialShellState();
  useShellStore.setState({
    ...initialShellState,
  });
}
