import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { I18nProvider } from '@client/app/providers/i18n';
import { createQueryClient } from '@client/app/providers/queryClient';
import { RuntimeEventsProvider } from '@client/app/providers/runtime-events';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);
  const routerBasename =
    import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');
  const routerProps = routerBasename ? { basename: routerBasename } : {};

  return (
    <I18nProvider>
      <BrowserRouter {...routerProps}>
        <QueryClientProvider client={queryClient}>
          <RuntimeEventsProvider>{children}</RuntimeEventsProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </I18nProvider>
  );
}
