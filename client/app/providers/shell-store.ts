import type { RuntimeConnectionHealth } from '@client/features/runtime-events/runtime-events.types';
import { create } from 'zustand';

interface ShellState {
  runtimeConnectionHealth: RuntimeConnectionHealth;
  navRailCollapsed: boolean;
  setRuntimeConnectionHealth: (health: RuntimeConnectionHealth) => void;
  toggleNavRailCollapsed: () => void;
}

const initialShellState: Pick<ShellState, 'runtimeConnectionHealth' | 'navRailCollapsed'> = {
  runtimeConnectionHealth: 'idle',
  navRailCollapsed: false,
};

export const useShellStore = create<ShellState>((set) => ({
  ...initialShellState,
  setRuntimeConnectionHealth: (runtimeConnectionHealth) => set({ runtimeConnectionHealth }),
  toggleNavRailCollapsed: () => set((state) => ({ navRailCollapsed: !state.navRailCollapsed })),
}));

export function resetShellStore() {
  useShellStore.setState(initialShellState);
}
