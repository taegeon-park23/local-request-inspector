import { createContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useShellStore } from '@client/app/providers/shell-store';
import { useCapturesStore } from '@client/features/captures/state/captures-store';
import { createDefaultRuntimeEventsAdapter } from '@client/features/runtime-events/runtime-events-adapter';
import type {
  RuntimeEventsAdapter,
  RuntimeEventsAdapterFactory,
  RuntimeEventsMessage,
} from '@client/features/runtime-events/runtime-events.types';

const RuntimeEventsContext = createContext<RuntimeEventsAdapter | null>(null);

interface RuntimeEventsProviderProps extends PropsWithChildren {
  createAdapter?: RuntimeEventsAdapterFactory;
}

export function RuntimeEventsProvider({
  children,
  createAdapter = createDefaultRuntimeEventsAdapter,
}: RuntimeEventsProviderProps) {
  const [adapter] = useState(createAdapter);
  const setRuntimeConnectionHealth = useShellStore((state) => state.setRuntimeConnectionHealth);
  const setCapturesConnectionHealth = useCapturesStore((state) => state.setConnectionHealth);
  const ingestCapture = useCapturesStore((state) => state.ingestCapture);

  useEffect(() => {
    const handleMessage = (message: RuntimeEventsMessage) => {
      if (message.kind === 'connection') {
        setRuntimeConnectionHealth(message.health);
        setCapturesConnectionHealth(message.health);
        return;
      }

      if (message.kind === 'capture.received') {
        ingestCapture(message.capture);
      }
    };

    adapter.start(handleMessage);

    return () => {
      adapter.stop();
      setRuntimeConnectionHealth('idle');
      setCapturesConnectionHealth('idle');
    };
  }, [adapter, ingestCapture, setCapturesConnectionHealth, setRuntimeConnectionHealth]);

  return <RuntimeEventsContext.Provider value={adapter}>{children}</RuntimeEventsContext.Provider>;
}
