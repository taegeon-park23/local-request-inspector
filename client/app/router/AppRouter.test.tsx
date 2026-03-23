import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppRouter } from '@client/app/router/AppRouter';
import { renderApp } from '@client/shared/test/render-app';

function createRect(height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 1280,
    bottom: height,
    width: 1280,
    height,
    toJSON: () => ({}),
  } as DOMRect;
}

function installLayoutRectMock() {
  const rectByClassName: Array<[string, number]> = [
    ['shell-body', 720],
    ['shell-content', 720],
    ['shell-route-panels', 720],
    ['shell-route-panels__body', 672],
    ['shell-route-panels__panel--active', 672],
    ['shell-route-panels__floating-layout', 720],
    ['shell-route-panels__floating-content', 720],
    ['shell-route-panels__floating-main', 720],
    ['shell-route-panels__floating-detail', 720],
  ];

  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(this: HTMLElement) {
    for (const [className, height] of rectByClassName) {
      if (this.classList.contains(className)) {
        return createRect(height);
      }
    }

    if (this.matches('.shell-route-panels__floating-main > .shell-panel, .shell-route-panels__floating-detail > .shell-panel')) {
      return createRect(720);
    }

    return createRect(0);
  });
}

describe('AppRouter shell bootstrap', () => {
  it('renders the persistent shell regions and nav labels', () => {
    renderApp(<AppRouter />);

    expect(screen.getByLabelText('Top bar')).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('Workbench');
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('Workspace');
    expect(screen.getByText('Runtime Connection')).toBeInTheDocument();
    const navigationRail = screen.getByLabelText('Navigation rail');
    expect(navigationRail).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse explorer' })).toBeInTheDocument();
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
    expect(screen.getAllByText('작업공간').length).toBeGreaterThan(0);
    expect(screen.getAllByText('설정').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '탐색기 접기' })).toBeInTheDocument();
    expect(screen.getByLabelText('섹션 탐색기')).toBeInTheDocument();
    expect(screen.getByLabelText('메인 작업면')).toBeInTheDocument();
    expect(screen.getByLabelText('컨텍스트 상세 패널')).toBeInTheDocument();
  });

  it('switches top-level placeholder sections from the navigation rail', async () => {
    renderApp(<AppRouter />);

    expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('Workspace');

    fireEvent.click(screen.getByRole('link', { name: /captures/i }));
    expect(await screen.findByRole('heading', { name: 'Captures' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('Captures');

    fireEvent.click(screen.getByRole('link', { name: /history/i }));
    expect(await screen.findByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('History');

    fireEvent.click(screen.getByRole('link', { name: /settings/i }));
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current section breadcrumb')).toHaveTextContent('Settings');
  });

  it('collapses the navigation rail without losing accessible route names', async () => {
    renderApp(<AppRouter />);

    const navigationRail = screen.getByLabelText('Navigation rail');
    expect(navigationRail).toHaveAttribute('data-collapsed', 'false');

    fireEvent.click(within(navigationRail).getByRole('button', { name: 'Collapse navigation' }));
    expect(navigationRail).toHaveAttribute('data-collapsed', 'true');
    expect(within(navigationRail).getByRole('link', { name: 'Workspace' })).toBeInTheDocument();
    expect(within(navigationRail).getByRole('link', { name: 'Settings' })).toBeInTheDocument();

    fireEvent.click(within(navigationRail).getByRole('button', { name: 'Expand navigation' }));
    expect(navigationRail).toHaveAttribute('data-collapsed', 'false');
  });

  it('lets workspace explorer selection surface content immediately and allows explorer collapse', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const detailPanel = screen.getByLabelText('Contextual detail panel');
    await user.click(within(explorer).getByRole('button', { name: 'Open Health check' }));

    expect(screen.getByLabelText('Request URL')).toHaveValue('http://localhost:5671/health');
    expect(within(detailPanel).getByRole('tablist', { name: 'Result panel tabs' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse explorer' }));
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    expect(screen.getByLabelText('Section explorer')).toBeInTheDocument();
  });

  it('keeps page-level scroll disabled by constraining shell-body, shell-content, and floating main/detail panels to the shell height', async () => {
    const user = userEvent.setup();
    const rectMock = installLayoutRectMock();
    renderApp(<AppRouter />);

    const shellBody = document.querySelector('.shell-body');
    const shellContent = document.querySelector('main.shell-content');
    const floatingMain = document.querySelector('.shell-route-panels__floating-main');
    const floatingDetail = document.querySelector('.shell-route-panels__floating-detail');

    expect(shellBody).not.toBeNull();
    expect(shellContent).not.toBeNull();
    expect(floatingMain).not.toBeNull();
    expect(floatingDetail).not.toBeNull();

    expect(shellContent!.getBoundingClientRect().height).toBe(shellBody!.getBoundingClientRect().height);
    expect(floatingMain!.getBoundingClientRect().height).toBeLessThanOrEqual(shellContent!.getBoundingClientRect().height);
    expect(floatingDetail!.getBoundingClientRect().height).toBeLessThanOrEqual(shellContent!.getBoundingClientRect().height);

    await user.click(screen.getByRole('button', { name: 'Collapse explorer' }));
    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));

    expect(shellContent!.getBoundingClientRect().height).toBe(shellBody!.getBoundingClientRect().height);
    expect(floatingMain!.getBoundingClientRect().height).toBeLessThanOrEqual(shellBody!.getBoundingClientRect().height);
    expect(floatingDetail!.getBoundingClientRect().height).toBeLessThanOrEqual(shellBody!.getBoundingClientRect().height);

    rectMock.mockRestore();
  });

  it('keeps panel-level scroll, not page-level scroll, when the floating drawer opens over the workspace surface', async () => {
    const user = userEvent.setup();
    const rectMock = installLayoutRectMock();
    renderApp(<AppRouter />);

    const shellBody = document.querySelector('.shell-body');
    const shellContent = document.querySelector('main.shell-content');
    const floatingMain = document.querySelector('.shell-route-panels__floating-main > .shell-panel');
    const floatingDetail = document.querySelector('.shell-route-panels__floating-detail > .shell-panel');

    expect(shellBody).not.toBeNull();
    expect(shellContent).not.toBeNull();
    expect(floatingMain).not.toBeNull();
    expect(floatingDetail).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Collapse explorer' }));
    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));

    expect(screen.getByRole('button', { name: 'Collapse explorer' })).toHaveAttribute('aria-expanded', 'true');
    expect(shellContent!.getBoundingClientRect().height).toBeLessThanOrEqual(shellBody!.getBoundingClientRect().height);
    expect(floatingMain!.getBoundingClientRect().height).toBeLessThanOrEqual(shellContent!.getBoundingClientRect().height);
    expect(floatingDetail!.getBoundingClientRect().height).toBeLessThanOrEqual(shellContent!.getBoundingClientRect().height);

    rectMock.mockRestore();
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
    expect(await screen.findByLabelText('Pre-request script', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getByText(/loaded on demand so the rest of the request builder stays responsive/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /captures/i }));
    expect(await screen.findByRole('heading', { name: 'Captures' })).toBeInTheDocument();
    expect(screen.getByText(/observation route for inbound traffic/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /history/i }));
    expect(await screen.findByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(await screen.findByText(/Run Replay Now stays disabled in this slice because replay remains edit-first/i)).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Open Replay Draft' }));
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getAllByText('Opened from history', { selector: '.workspace-chip--replay' }).length).toBeGreaterThan(0);

    const replayMainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(replayMainSurface).getByRole('button', { name: 'Scripts' }));
    expect(await screen.findByLabelText('Pre-request script', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getByText(/Scripts stays request-bound and draft-owned/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /mocks/i }));
    expect(screen.getByRole('heading', { name: 'Mocks' })).toBeInTheDocument();
    expect(screen.getByText(/Persisted authored rules live here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save rule' })).toBeEnabled();
  }, 15000);
});
