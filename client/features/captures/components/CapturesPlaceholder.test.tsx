import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '@client/app/router/AppRouter';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { createSyntheticRuntimeEventsAdapter } from '@client/features/runtime-events/runtime-events-adapter';
import { renderApp } from '@client/shared/test/render-app';

describe('Captures S4 observation skeleton', () => {
  it('renders the captures list/detail skeleton and shared detail tabs while exposing connection health', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/captures'] });

    expect(screen.getByRole('heading', { name: 'Captures' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search captures')).toBeInTheDocument();
    expect(screen.getByLabelText('Mock outcome filter')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Open capture POST \/webhooks\/stripe/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Runtime seam: connected/i)).toBeInTheDocument());

    const connectionBadge = screen.getByText('connected', { selector: '[data-kind="connection"]' });
    expect(connectionBadge).toHaveAttribute('data-kind', 'connection');
    expect(screen.getByRole('heading', { name: 'Capture detail' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Capture detail tabs' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Deferred detail' }));
    expect(screen.getByRole('heading', { name: 'Deferred runtime detail' })).toBeInTheDocument();
    expect(screen.getByText('Mock outcome family')).toBeInTheDocument();
    expect(screen.getAllByText('Mocked', { selector: '[data-kind="mockOutcome"]' }).length).toBeGreaterThan(0);
  });

  it('changes the active detail when a capture row is selected', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/captures'] });

    const capturesList = await screen.findByLabelText('Captures list');
    const healthRow = within(capturesList).getByRole('button', { name: /Open capture GET \/health/i });

    await user.click(healthRow);

    expect(screen.getByText(/GET \/health reached localhost:5671 as an inbound capture/i)).toBeInTheDocument();
    expect(screen.getAllByText('Bypassed', { selector: '[data-kind="mockOutcome"]' }).length).toBeGreaterThan(0);
  });

  it('shows degraded empty-state copy when the synthetic feed has no captures', async () => {
    renderApp(<AppRouter />, {
      initialEntries: ['/captures'],
      runtimeEventsAdapterFactory: () =>
        createSyntheticRuntimeEventsAdapter({
          captureEvents: [],
          terminalConnectionHealth: 'degraded',
        }),
    });

    await waitFor(() => expect(screen.getByText(/Runtime seam: degraded/i)).toBeInTheDocument());
    expect(screen.getByText('Runtime seam is degraded')).toBeInTheDocument();
    expect(screen.getByText('No captures yet')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No capture selected' })).toBeInTheDocument();
  });

  it('keeps capture observation separate from request draft authoring state', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/captures'] });

    const capturesList = await screen.findByLabelText('Captures list');
    await user.click(within(capturesList).getByRole('button', { name: /Open capture DELETE \/admin\/purge/i }));

    expect(Object.keys(useRequestDraftStore.getState().draftsByTabId)).toHaveLength(0);
    expect(screen.queryByLabelText('Request method')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Request URL')).not.toBeInTheDocument();
  });
});
