import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createQueryClient } from '@client/app/providers/queryClient';
import { RuntimeEventsProvider } from '@client/app/providers/runtime-events';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <RuntimeEventsProvider>{children}</RuntimeEventsProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
