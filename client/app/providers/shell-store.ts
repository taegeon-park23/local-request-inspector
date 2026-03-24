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

export const shellNavRailPreferenceStorageKey = 'local-request-inspector.shell.navRailCollapsed';

interface ShellState {
  runtimeConnectionHealth: RuntimeConnectionHealth;
  navRailCollapsed: boolean;
  floatingExplorerOpenByRoute: FloatingExplorerOpenByRoute;
  setRuntimeConnectionHealth: (health: RuntimeConnectionHealth) => void;
  setNavRailCollapsed: (collapsed: boolean) => void;
  toggleNavRailCollapsed: () => void;
  setFloatingExplorerOpen: (route: FloatingExplorerRouteKey, open: boolean) => void;
  toggleFloatingExplorer: (route: FloatingExplorerRouteKey) => void;
}

const initialFloatingExplorerOpenByRoute: FloatingExplorerOpenByRoute = {
  workspace: true,
  captures: true,
  history: true,
  mocks: true,
  environments: true,
  scripts: true,
};

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

function createInitialShellState(): Pick<ShellState, 'runtimeConnectionHealth' | 'navRailCollapsed' | 'floatingExplorerOpenByRoute'> {
  return {
    runtimeConnectionHealth: 'idle',
    navRailCollapsed: readNavRailPreference(),
    floatingExplorerOpenByRoute: { ...initialFloatingExplorerOpenByRoute },
  };
}

export const useShellStore = create<ShellState>((set) => ({
  ...createInitialShellState(),
  setRuntimeConnectionHealth: (runtimeConnectionHealth) => set({ runtimeConnectionHealth }),
  setNavRailCollapsed: (navRailCollapsed) => {
    writeNavRailPreference(navRailCollapsed);
    set({ navRailCollapsed });
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
    floatingExplorerOpenByRoute: { ...initialFloatingExplorerOpenByRoute },
  });
}
