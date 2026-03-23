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

interface ShellState {
  runtimeConnectionHealth: RuntimeConnectionHealth;
  navRailCollapsed: boolean;
  floatingExplorerOpenByRoute: FloatingExplorerOpenByRoute;
  setRuntimeConnectionHealth: (health: RuntimeConnectionHealth) => void;
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

const initialShellState: Pick<ShellState, 'runtimeConnectionHealth' | 'navRailCollapsed' | 'floatingExplorerOpenByRoute'> = {
  runtimeConnectionHealth: 'idle',
  navRailCollapsed: false,
  floatingExplorerOpenByRoute: initialFloatingExplorerOpenByRoute,
};

export const useShellStore = create<ShellState>((set) => ({
  ...initialShellState,
  setRuntimeConnectionHealth: (runtimeConnectionHealth) => set({ runtimeConnectionHealth }),
  toggleNavRailCollapsed: () => set((state) => ({ navRailCollapsed: !state.navRailCollapsed })),
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
  useShellStore.setState({
    ...initialShellState,
    floatingExplorerOpenByRoute: { ...initialFloatingExplorerOpenByRoute },
  });
}
