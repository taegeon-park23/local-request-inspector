import type { RuntimeEventsAdapterFactory } from '@client/features/runtime-events/runtime-events.types';
import { createSyntheticRuntimeEventsAdapter } from '@client/features/runtime-events/runtime-events-adapter';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { type PropsWithChildren, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@client/app/providers/i18n';
import { createQueryClient } from '@client/app/providers/queryClient';
import { RuntimeEventsProvider } from '@client/app/providers/runtime-events';
import type { LocaleCode } from '@client/shared/i18n/messages';

interface RenderAppOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  initialLocale?: LocaleCode;
  runtimeEventsAdapterFactory?: RuntimeEventsAdapterFactory;
}

export function renderApp(
  ui: ReactElement,
  {
    initialEntries = ['/workspace'],
    initialLocale = 'en',
    runtimeEventsAdapterFactory = createSyntheticRuntimeEventsAdapter,
    ...options
  }: RenderAppOptions = {},
) {
  const queryClient = createQueryClient();

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <I18nProvider initialLocale={initialLocale}>
        <MemoryRouter initialEntries={initialEntries}>
          <QueryClientProvider client={queryClient}>
            <RuntimeEventsProvider createAdapter={runtimeEventsAdapterFactory}>
              {children}
            </RuntimeEventsProvider>
          </QueryClientProvider>
        </MemoryRouter>
      </I18nProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
