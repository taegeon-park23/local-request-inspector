import { create } from 'zustand';

export type RuntimeConnectionHealth = 'idle' | 'connecting' | 'offline';

interface ShellState {
  runtimeConnectionHealth: RuntimeConnectionHealth;
  setRuntimeConnectionHealth: (health: RuntimeConnectionHealth) => void;
}

export const useShellStore = create<ShellState>((set) => ({
  runtimeConnectionHealth: 'idle',
  setRuntimeConnectionHealth: (runtimeConnectionHealth) => set({ runtimeConnectionHealth }),
}));
