import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { type PropsWithChildren, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { createQueryClient } from '@client/app/providers/queryClient';
import { RuntimeEventsProvider } from '@client/app/providers/runtime-events';

interface RenderAppOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

export function renderApp(ui: ReactElement, { initialEntries = ['/workspace'], ...options }: RenderAppOptions = {}) {
  const queryClient = createQueryClient();

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={queryClient}>
          <RuntimeEventsProvider>{children}</RuntimeEventsProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
