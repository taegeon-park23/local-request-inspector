import type { RuntimeConnectionHealth } from '@client/features/runtime-events/runtime-events.types';
import { create } from 'zustand';

interface ShellState {
  runtimeConnectionHealth: RuntimeConnectionHealth;
  setRuntimeConnectionHealth: (health: RuntimeConnectionHealth) => void;
}

const initialShellState: Pick<ShellState, 'runtimeConnectionHealth'> = {
  runtimeConnectionHealth: 'idle',
};

export const useShellStore = create<ShellState>((set) => ({
  ...initialShellState,
  setRuntimeConnectionHealth: (runtimeConnectionHealth) => set({ runtimeConnectionHealth }),
}));

export function resetShellStore() {
  useShellStore.setState(initialShellState);
}
