import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';
import { useShellStore } from '@client/app/providers/shell-store';

export interface RuntimeEventsAdapter {
  start: () => void;
  stop: () => void;
}

function createRuntimeEventsAdapter(): RuntimeEventsAdapter {
  return {
    start: () => undefined,
    stop: () => undefined,
  };
}

const RuntimeEventsContext = createContext<RuntimeEventsAdapter | null>(null);

export function RuntimeEventsProvider({ children }: PropsWithChildren) {
  const adapter = useMemo(() => createRuntimeEventsAdapter(), []);
  const setRuntimeConnectionHealth = useShellStore((state) => state.setRuntimeConnectionHealth);

  useEffect(() => {
    setRuntimeConnectionHealth('connecting');
    adapter.start();
    setRuntimeConnectionHealth('offline');

    return () => {
      adapter.stop();
      setRuntimeConnectionHealth('idle');
    };
  }, [adapter, setRuntimeConnectionHealth]);

  return <RuntimeEventsContext.Provider value={adapter}>{children}</RuntimeEventsContext.Provider>;
}

export function useRuntimeEventsAdapter() {
  const context = useContext(RuntimeEventsContext);

  if (!context) {
    throw new Error('useRuntimeEventsAdapter must be used within RuntimeEventsProvider.');
  }

  return context;
}
