import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '@client/app/router/AppRouter';
import { renderApp } from '@client/shared/test/render-app';

describe('AppRouter shell bootstrap', () => {
  it('renders the persistent shell regions and nav labels', () => {
    renderApp(<AppRouter />);

    expect(screen.getByLabelText('Top bar')).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('Workbench');
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('Workspace');
    expect(screen.getByText('Runtime Connection')).toBeInTheDocument();
    const navigationRail = screen.getByLabelText('Navigation rail');
    expect(navigationRail).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Route layout panels' })).toBeInTheDocument();
    expect(screen.getByLabelText('Section explorer')).toBeInTheDocument();
    expect(screen.getByLabelText('Main work surface')).toBeInTheDocument();
    expect(screen.getByLabelText('Contextual detail panel')).toBeInTheDocument();

    for (const label of ['Workspace', 'Captures', 'History', 'Mocks', 'Environments', 'Scripts', 'Settings']) {
      expect(within(navigationRail).getByText(label)).toBeInTheDocument();
    }
  });

  it('renders translated shell copy when the initial locale is Korean', () => {
    renderApp(<AppRouter />, { initialLocale: 'ko' });

    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('워크벤치');
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('작업공간');
    expect(screen.getByText('런타임 연결')).toBeInTheDocument();
    expect(screen.getByText('작업공간')).toBeInTheDocument();
    expect(screen.getByText('설정')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: '라우트 패널 탭' })).toBeInTheDocument();
    expect(screen.getByLabelText('섹션 탐색기')).toBeInTheDocument();
    expect(screen.getByLabelText('메인 작업면')).toBeInTheDocument();
    expect(screen.getByLabelText('컨텍스트 상세 패널')).toBeInTheDocument();
  });

  it('switches top-level placeholder sections from the navigation rail', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('Workspace');

    await user.click(screen.getByRole('link', { name: /captures/i }));
    expect(screen.getByRole('heading', { name: 'Captures' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('Captures');

    await user.click(screen.getByRole('link', { name: /history/i }));
    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('History');

    await user.click(screen.getByRole('link', { name: /settings/i }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('Settings');
  });

  it('collapses the navigation rail without losing accessible route names', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const navigationRail = screen.getByLabelText('Navigation rail');
    expect(navigationRail).toHaveAttribute('data-collapsed', 'false');

    await user.click(within(navigationRail).getByRole('button', { name: 'Collapse navigation' }));
    expect(navigationRail).toHaveAttribute('data-collapsed', 'true');
    expect(within(navigationRail).getByRole('link', { name: 'Workspace' })).toBeInTheDocument();
    expect(within(navigationRail).getByRole('link', { name: 'Settings' })).toBeInTheDocument();

    await user.click(within(navigationRail).getByRole('button', { name: 'Expand navigation' }));
    expect(navigationRail).toHaveAttribute('data-collapsed', 'false');
  });

  it('supports the smoke path across workspace, scripts, history replay, and mocks shell readiness', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const workspaceExplorer = screen.getByLabelText('Section explorer');
    const workspaceMainSurface = screen.getByLabelText('Main work surface');

    await user.click(within(workspaceExplorer).getByRole('button', { name: 'New Request' }));
    expect(screen.getByText(/Save updates the request definition\. Run does not save automatically and does not clear unsaved authoring changes\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();

    await user.click(within(workspaceMainSurface).getByRole('button', { name: 'Scripts' }));
    expect(await screen.findByTestId('script-editor-loading')).toBeInTheDocument();
    expect(await screen.findByLabelText('Pre-request script')).toBeInTheDocument();
    expect(screen.getByText(/loaded on demand so the rest of the request builder stays responsive/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /captures/i }));
    expect(screen.getByRole('heading', { name: 'Captures' })).toBeInTheDocument();
    expect(screen.getByText(/observation route for inbound traffic/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /history/i }));
    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(await screen.findByText(/Run Replay Now stays disabled in this slice because replay remains edit-first/i)).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Open Replay Draft' }));
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getAllByText('Opened from history', { selector: '.workspace-chip--replay' }).length).toBeGreaterThan(0);

    const replayMainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(replayMainSurface).getByRole('button', { name: 'Scripts' }));
    expect(await screen.findByLabelText('Pre-request script')).toBeInTheDocument();
    expect(screen.getByText(/Scripts stays request-bound and draft-owned/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /mocks/i }));
    expect(screen.getByRole('heading', { name: 'Mocks' })).toBeInTheDocument();
    expect(screen.getByText(/Persisted authored rules live here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save rule' })).toBeEnabled();
  });
});
