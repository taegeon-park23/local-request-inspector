import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoutePanelTabsLayout } from '@client/features/route-panel-tabs-layout';
import { resetShellStore } from '@client/app/providers/shell-store';
import { renderApp } from '@client/shared/test/render-app';
import type { ComponentProps } from 'react';

const originalWindowInnerWidth = window.innerWidth;

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });

  window.dispatchEvent(new Event('resize'));
}

function renderFloatingLayout(overrides: Partial<ComponentProps<typeof RoutePanelTabsLayout>> = {}) {
  return renderApp(
    <RoutePanelTabsLayout
      layoutMode="floating-explorer"
      floatingExplorerRouteKey="workspace"
      floatingExplorerVariant="focused-overlay"
      defaultActiveTab="main"
      explorer={<section className="shell-panel" aria-label="Section explorer"><p>Explorer pane</p></section>}
      main={<section className="shell-panel" aria-label="Main work surface"><p>Main pane</p></section>}
      detail={<aside className="shell-panel" aria-label="Contextual detail panel"><p>Detail pane</p></aside>}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  resetShellStore();
});

afterEach(() => {
  setViewportWidth(originalWindowInnerWidth);
  resetShellStore();
  window.localStorage.clear();
});

describe('RoutePanelTabsLayout', () => {
  it('keeps the detail column visible on desktop floating layouts and assigns explicit scroll owners', () => {
    setViewportWidth(1440);
    renderFloatingLayout();

    const floatingRoot = document.querySelector('.shell-route-panels--floating');
    const floatingDetail = document.querySelector('.shell-route-panels__floating-detail');
    const explorerScrollOwner = document.querySelector('.shell-route-panels__floating-explorer .shell-route-panels__scroll-owner[data-scroll-owner="explorer"]');
    const mainScrollOwner = document.querySelector('.shell-route-panels__floating-main > .shell-route-panels__scroll-owner[data-scroll-owner="main"]');
    const detailScrollOwner = document.querySelector('.shell-route-panels__floating-detail > .shell-route-panels__scroll-owner[data-scroll-owner="detail"]');

    expect(floatingRoot).toHaveAttribute('data-floating-layout-tier', 'wide');
    expect(floatingDetail).toHaveAttribute('data-detail-visibility', 'visible');
    expect(explorerScrollOwner).not.toBeNull();
    expect(mainScrollOwner).not.toBeNull();
    expect(detailScrollOwner).not.toBeNull();
    expect(screen.queryByRole('tablist', { name: 'Route layout panels' })).not.toBeInTheDocument();
  });

  it('switches to stacked surface/detail tabs below the medium breakpoint', async () => {
    const user = userEvent.setup();
    setViewportWidth(1024);
    renderFloatingLayout();

    const floatingRoot = document.querySelector('.shell-route-panels--floating');
    expect(floatingRoot).toHaveAttribute('data-floating-layout-tier', 'stacked');
    expect(screen.queryByRole('tab', { name: 'Explorer' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Surface' })).toHaveAttribute('aria-selected', 'true');
    expect(document.querySelector('.shell-route-panels__floating-stack-panel--active[data-route-panel="main"]')).not.toBeNull();
    expect(document.querySelector('.shell-route-panels__floating-stack-panel--active .shell-route-panels__scroll-owner[data-scroll-owner="main"]')).not.toBeNull();

    await user.click(screen.getByRole('tab', { name: 'Details' }));

    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
    expect(document.querySelector('.shell-route-panels__floating-stack-panel--active[data-route-panel="detail"]')).not.toBeNull();
    expect(document.querySelector('.shell-route-panels__floating-stack-panel--active .shell-route-panels__scroll-owner[data-scroll-owner="detail"]')).not.toBeNull();
  });

  it('shows the focused-overlay scrim only in stacked mode', async () => {
    const user = userEvent.setup();
    setViewportWidth(1024);
    renderFloatingLayout();

    expect(document.querySelector('.shell-route-panels__floating-scrim--visible')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Collapse explorer' }));
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.shell-route-panels__floating-scrim--hidden')).not.toBeNull();
  });

  it('supports route-local medium breakpoints and auto-collapses the explorer once when entering stacked mode', async () => {
    const user = userEvent.setup();
    setViewportWidth(1100);
    renderFloatingLayout({
      floatingBalancedMinWidth: 1200,
      collapseFloatingExplorerOnStacked: true,
    });

    const floatingRoot = document.querySelector('.shell-route-panels--floating');
    expect(floatingRoot).toHaveAttribute('data-floating-layout-tier', 'stacked');
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.shell-route-panels__floating-scrim--visible')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));

    expect(screen.getByRole('button', { name: 'Collapse explorer' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.shell-route-panels__floating-scrim--visible')).not.toBeNull();
  });
});

