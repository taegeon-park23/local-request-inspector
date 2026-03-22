import { screen, within } from '@testing-library/react';
import { AppRouter } from '@client/app/router/AppRouter';
import { useShellStore } from '@client/app/providers/shell-store';
import { renderApp } from '@client/shared/test/render-app';

describe('Settings MVP route', () => {
  it('renders diagnostics cards, command copy affordances, and route-path copy affordances', async () => {
    useShellStore.getState().setRuntimeConnectionHealth('connected');
    renderApp(<AppRouter />, { initialEntries: ['/settings'] });

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'App shell availability' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Storage readiness' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Runtime connection health' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Local command catalog' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Data path and route hints' })).toBeInTheDocument();
    expect(screen.getAllByText('connected', { selector: '[data-kind="connection"]' }).length).toBeGreaterThan(0);

    const commandsList = screen.getByLabelText('Settings commands list');
    expect(within(commandsList).getAllByRole('button', { name: 'Copy command' }).length).toBeGreaterThan(0);

    const routesList = screen.getByLabelText('Settings route hints list');
    expect(within(routesList).getAllByRole('button', { name: 'Copy path' }).length).toBeGreaterThan(0);
  });
});
