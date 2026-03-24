import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '@client/app/router/AppRouter';
import {
  shellFloatingExplorerDefaultOpenStorageKey,
  shellNavRailPreferenceStorageKey,
  useShellStore,
} from '@client/app/providers/shell-store';
import { renderApp } from '@client/shared/test/render-app';
import { localeStorageKey } from '@client/shared/i18n/messages';

describe('Settings MVP route', () => {
  it('renders diagnostics cards, command copy affordances, and route-path copy affordances', async () => {
    useShellStore.getState().setRuntimeConnectionHealth('connected');
    renderApp(<AppRouter />, { initialEntries: ['/settings'] });

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'App shell availability' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Storage readiness' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Runtime connection health' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Interface language' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Route explorer preference' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Local command catalog' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Data path and route hints' })).toBeInTheDocument();
    expect(screen.getAllByText('connected', { selector: '[data-kind="connection"]' }).length).toBeGreaterThan(0);

    const commandsList = screen.getByLabelText('Settings commands list');
    expect(within(commandsList).getAllByRole('button', { name: 'Copy command' }).length).toBeGreaterThan(0);

    const routesList = screen.getByLabelText('Settings route hints list');
    expect(within(routesList).getAllByRole('button', { name: 'Copy path' }).length).toBeGreaterThan(0);
  });

  it('switches visible settings copy to Korean and persists the locale choice locally', async () => {
    const user = userEvent.setup();
    useShellStore.getState().setRuntimeConnectionHealth('connected');
    renderApp(<AppRouter />, { initialEntries: ['/settings'], initialLocale: 'en' });

    await screen.findByRole('heading', { name: 'Interface language' });
    await user.click(screen.getByRole('button', { name: '한국어' }));

    expect(screen.getByRole('heading', { name: '설정' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '인터페이스 언어' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('설정');
    expect(window.localStorage.getItem(localeStorageKey)).toBe('ko');
  });

  it('lets the user change the default navigation rail preference and persists it locally', async () => {
    const user = userEvent.setup();
    useShellStore.getState().setRuntimeConnectionHealth('connected');
    renderApp(<AppRouter />, { initialEntries: ['/settings'] });

    await screen.findByRole('heading', { name: 'Navigation rail preference' });

    const preferenceGroup = screen.getByRole('group', { name: 'Navigation rail preference' });
    const navigationRail = screen.getByLabelText('Navigation rail');

    expect(navigationRail).toHaveAttribute('data-collapsed', 'false');
    expect(within(preferenceGroup).getByRole('button', { name: 'Expanded by default' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(preferenceGroup).getByRole('button', { name: 'Collapsed by default' }));

    expect(navigationRail).toHaveAttribute('data-collapsed', 'true');
    expect(window.localStorage.getItem(shellNavRailPreferenceStorageKey)).toBe('true');
    expect(within(preferenceGroup).getByRole('button', { name: 'Collapsed by default' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('lets the user change the default route explorer preference, persists it locally, and applies it to floating routes', async () => {
    const user = userEvent.setup();
    useShellStore.getState().setRuntimeConnectionHealth('connected');
    renderApp(<AppRouter />, { initialEntries: ['/settings'] });

    await screen.findByRole('heading', { name: 'Route explorer preference' });

    const preferenceGroup = screen.getByRole('group', { name: 'Route explorer preference' });

    await user.click(within(preferenceGroup).getByRole('button', { name: 'Collapsed by default' }));

    expect(window.localStorage.getItem(shellFloatingExplorerDefaultOpenStorageKey)).toBe('false');

    await user.click(screen.getByRole('link', { name: 'Workspace' }));
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();

    const floatingRoot = document.querySelector('.shell-route-panels--floating');
    const floatingDetail = document.querySelector('.shell-route-panels__floating-detail');

    expect(floatingRoot).toHaveAttribute('data-floating-explorer-open', 'false');
    expect(floatingDetail).toHaveAttribute('data-detail-visibility', 'visible');
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');
  });
});
