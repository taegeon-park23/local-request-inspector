import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import {
  useShellStore,
  type FloatingExplorerRouteKey,
} from '@client/app/providers/shell-store';
import { AppIcon, type AppIconName } from '@client/shared/ui/AppIcon';
import { PanelTabs, type PanelTabOption } from '@client/shared/ui/PanelTabs';

export type RoutePanelTabId = 'explorer' | 'main' | 'detail';
type ContentRoutePanelTabId = Exclude<RoutePanelTabId, 'explorer'>;

type RoutePanelLayoutMode = 'tabs' | 'floating-explorer';
type FloatingExplorerVariant = 'default' | 'focused-overlay';
type FloatingLayoutTier = 'wide' | 'balanced' | 'stacked';

interface RoutePanelTabsLayoutProps {
  explorer: ReactNode;
  main: ReactNode;
  detail: ReactNode;
  layoutMode?: RoutePanelLayoutMode;
  floatingExplorerRouteKey?: FloatingExplorerRouteKey;
  floatingExplorerVariant?: FloatingExplorerVariant;
  floatingBalancedMinWidth?: number;
  collapseFloatingExplorerOnStacked?: boolean;
  defaultActiveTab?: RoutePanelTabId;
  activeTab?: RoutePanelTabId;
  onActiveTabChange?: (tab: RoutePanelTabId) => void;
}

const routePanelTabIcons: Record<RoutePanelTabId, AppIconName> = {
  explorer: 'overview',
  main: 'workspace',
  detail: 'info',
};

const FLOATING_LAYOUT_WIDE_MIN_WIDTH = 1360;
const FLOATING_LAYOUT_BALANCED_MIN_WIDTH = 1100;

function readFloatingLayoutTier(
  balancedMinWidth = FLOATING_LAYOUT_BALANCED_MIN_WIDTH,
): FloatingLayoutTier {
  if (typeof window === 'undefined') {
    return 'wide';
  }

  const width = window.innerWidth || document.documentElement.clientWidth || FLOATING_LAYOUT_WIDE_MIN_WIDTH;

  if (width >= FLOATING_LAYOUT_WIDE_MIN_WIDTH) {
    return 'wide';
  }

  if (width >= balancedMinWidth) {
    return 'balanced';
  }

  return 'stacked';
}

function renderScrollOwner(tabId: RoutePanelTabId, content: ReactNode) {
  return (
    <div className="shell-route-panels__scroll-owner" data-scroll-owner={tabId}>
      {content}
    </div>
  );
}

export function RoutePanelTabsLayout({
  explorer,
  main,
  detail,
  layoutMode = 'tabs',
  floatingExplorerRouteKey,
  floatingExplorerVariant = 'default',
  floatingBalancedMinWidth = FLOATING_LAYOUT_BALANCED_MIN_WIDTH,
  collapseFloatingExplorerOnStacked = false,
  defaultActiveTab = 'main',
  activeTab: controlledActiveTab,
  onActiveTabChange,
}: RoutePanelTabsLayoutProps) {
  const { t } = useI18n();
  const detailPanelExpanded = useShellStore((state) => (
    floatingExplorerRouteKey ? state.detailPanelExpandedByRoute[floatingExplorerRouteKey] : false
  ));
  const floatingExplorerOpen = useShellStore((state) => (
    floatingExplorerRouteKey ? state.floatingExplorerOpenByRoute[floatingExplorerRouteKey] : false
  ));
  const setFloatingExplorerOpen = useShellStore((state) => state.setFloatingExplorerOpen);
  const setDetailPanelExpanded = useShellStore((state) => state.setDetailPanelExpanded);
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState<RoutePanelTabId>(defaultActiveTab);
  const [floatingLayoutTier, setFloatingLayoutTier] = useState<FloatingLayoutTier>(() => readFloatingLayoutTier(floatingBalancedMinWidth));
  const hasAutoCollapsedFloatingExplorerRef = useRef(false);
  const activeTab = controlledActiveTab ?? uncontrolledActiveTab;

  useEffect(() => {
    if (layoutMode !== 'floating-explorer') {
      return undefined;
    }

    const handleResize = () => {
      setFloatingLayoutTier(readFloatingLayoutTier(floatingBalancedMinWidth));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [floatingBalancedMinWidth, layoutMode]);

  useEffect(() => {
    if (layoutMode !== 'floating-explorer' || !floatingExplorerRouteKey || !collapseFloatingExplorerOnStacked) {
      return;
    }

    if (floatingLayoutTier !== 'stacked') {
      hasAutoCollapsedFloatingExplorerRef.current = false;
      return;
    }

    if (floatingExplorerOpen && !hasAutoCollapsedFloatingExplorerRef.current) {
      setFloatingExplorerOpen(floatingExplorerRouteKey, false);
      hasAutoCollapsedFloatingExplorerRef.current = true;
    }
  }, [
    collapseFloatingExplorerOnStacked,
    floatingExplorerOpen,
    floatingExplorerRouteKey,
    floatingLayoutTier,
    layoutMode,
    setFloatingExplorerOpen,
  ]);

  const handleActiveTabChange = (tab: RoutePanelTabId) => {
    if (controlledActiveTab === undefined) {
      setUncontrolledActiveTab(tab);
    }

    onActiveTabChange?.(tab);
  };

  const tabs: PanelTabOption<RoutePanelTabId>[] = [
    { id: 'explorer', label: t('shell.routePanels.explorer'), icon: routePanelTabIcons.explorer },
    { id: 'main', label: t('shell.routePanels.main'), icon: routePanelTabIcons.main },
    { id: 'detail', label: t('shell.routePanels.detail'), icon: routePanelTabIcons.detail },
  ];
  const stackedTabs: PanelTabOption<ContentRoutePanelTabId>[] = [
    { id: 'main', label: t('shell.routePanels.main'), icon: routePanelTabIcons.main },
    { id: 'detail', label: t('shell.routePanels.detail'), icon: routePanelTabIcons.detail },
  ];

  const detailPanelToggleLabel = detailPanelExpanded
    ? t('shell.routePanels.detailPanel.restoreAction')
    : t('shell.routePanels.detailPanel.expandAction');

  const handleDetailPanelToggle = () => {
    if (!floatingExplorerRouteKey) {
      return;
    }

    setDetailPanelExpanded(floatingExplorerRouteKey, !detailPanelExpanded);
  };

  if (layoutMode === 'floating-explorer' && floatingExplorerRouteKey) {
    const isFocusedOverlay = floatingExplorerVariant === 'focused-overlay';
    const isStackedTier = floatingLayoutTier === 'stacked';
    const shouldShowFocusedScrim = isFocusedOverlay && isStackedTier;
    const stackedActiveTab: ContentRoutePanelTabId = activeTab === 'detail' ? 'detail' : 'main';
    const floatingExplorerToggleLabel = floatingExplorerOpen
      ? t('shell.routePanels.floatingExplorer.collapseAction')
      : t('shell.routePanels.floatingExplorer.expandAction');
    const floatingPanelClassName = [
      'shell-route-panels',
      'shell-route-panels--floating',
      `shell-route-panels--floating-${floatingLayoutTier}`,
      !floatingExplorerOpen ? 'shell-route-panels--floating-collapsed' : null,
      isFocusedOverlay ? 'shell-route-panels--floating-focused' : null,
      isStackedTier ? 'shell-route-panels--floating-stacked' : null,
    ]
      .filter(Boolean)
      .join(' ');

    const handleFloatingExplorerToggle = () => {
      setFloatingExplorerOpen(floatingExplorerRouteKey, !floatingExplorerOpen);
    };

    return (
      <div
        className={floatingPanelClassName}
        data-floating-explorer-open={floatingExplorerOpen}
        data-floating-explorer-variant={floatingExplorerVariant}
        data-floating-layout-tier={floatingLayoutTier}
      >
        <div className="shell-route-panels__floating-layout">
          {shouldShowFocusedScrim ? (
            <div
              className={floatingExplorerOpen
                ? 'shell-route-panels__floating-scrim shell-route-panels__floating-scrim--visible'
                : 'shell-route-panels__floating-scrim shell-route-panels__floating-scrim--hidden'}
              aria-hidden="true"
              onClick={floatingExplorerOpen ? handleFloatingExplorerToggle : undefined}
            />
          ) : null}
          <div className="shell-route-panels__floating-overlay">
            <button
              type="button"
              className={isFocusedOverlay
                ? 'workspace-button workspace-button--secondary shell-route-panels__floating-toggle shell-route-panels__floating-toggle--compact'
                : 'workspace-button workspace-button--secondary shell-route-panels__floating-toggle'}
              aria-label={floatingExplorerToggleLabel}
              aria-expanded={floatingExplorerOpen}
              aria-controls={`floating-explorer-${floatingExplorerRouteKey}`}
              onClick={handleFloatingExplorerToggle}
              title={floatingExplorerToggleLabel}
            >
              <AppIcon
                name="overview"
                className="shell-route-panels__floating-toggle-glyph"
              />
              {isFocusedOverlay ? null : (
                <span className="shell-route-panels__floating-toggle-copy">
                  {floatingExplorerToggleLabel}
                </span>
              )}
            </button>
            <div className="shell-route-panels__floating-explorer-slot">
              <div
                id={`floating-explorer-${floatingExplorerRouteKey}`}
                className={floatingExplorerOpen
                  ? 'shell-route-panels__floating-explorer shell-route-panels__floating-explorer--open'
                  : 'shell-route-panels__floating-explorer shell-route-panels__floating-explorer--closed'}
              >
                {renderScrollOwner('explorer', explorer)}
              </div>
            </div>
          </div>
          <div className="shell-route-panels__floating-content">
            {isStackedTier ? (
              <div className="shell-route-panels__floating-stack" data-route-panel={stackedActiveTab}>
                <PanelTabs
                  ariaLabel={t('shell.routePanels.tabList')}
                  tabs={stackedTabs}
                  activeTab={stackedActiveTab}
                  onChange={(tab) => handleActiveTabChange(tab)}
                />
                <div className="shell-route-panels__floating-stack-panels">
                  <div
                    className={stackedActiveTab === 'main'
                      ? 'shell-route-panels__floating-stack-panel shell-route-panels__floating-stack-panel--active'
                      : 'shell-route-panels__floating-stack-panel shell-route-panels__floating-stack-panel--inactive'}
                    data-route-panel="main"
                  >
                    {renderScrollOwner('main', main)}
                  </div>
                  <div
                    className={stackedActiveTab === 'detail'
                      ? 'shell-route-panels__floating-stack-panel shell-route-panels__floating-stack-panel--active'
                      : 'shell-route-panels__floating-stack-panel shell-route-panels__floating-stack-panel--inactive'}
                    data-route-panel="detail"
                  >
                    {renderScrollOwner('detail', detail)}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div
                  className={shouldShowFocusedScrim && floatingExplorerOpen
                    ? 'shell-route-panels__floating-main shell-route-panels__floating-main--scrimmed'
                    : 'shell-route-panels__floating-main'}
                  data-route-panel={activeTab === 'main' ? 'main-active' : 'main'}
                  data-scrimmed={shouldShowFocusedScrim && floatingExplorerOpen ? 'true' : 'false'}
                >
                  {renderScrollOwner('main', main)}
                </div>
                <div
                  className={[
                    'shell-route-panels__floating-detail',
                    detailPanelExpanded ? 'shell-route-panels__floating-detail--expanded' : null,
                  ].filter(Boolean).join(' ')}
                  data-route-panel={activeTab === 'detail' ? 'detail-active' : 'detail'}
                  data-detail-visibility="visible"
                  data-detail-expanded={detailPanelExpanded ? 'true' : 'false'}
                >
                  <button
                    type="button"
                    className="workspace-button workspace-button--secondary shell-route-panels__detail-toggle"
                    aria-label={detailPanelToggleLabel}
                    title={detailPanelToggleLabel}
                    aria-pressed={detailPanelExpanded}
                    onClick={handleDetailPanelToggle}
                  >
                    <AppIcon name={detailPanelExpanded ? 'minimize' : 'maximize'} />
                  </button>
                  {renderScrollOwner('detail', detail)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell-route-panels">
      <PanelTabs
        ariaLabel={t('shell.routePanels.tabList')}
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleActiveTabChange}
      />
      <div className="shell-route-panels__body">
        <div
          className={activeTab === 'explorer' ? 'shell-route-panels__panel shell-route-panels__panel--active' : 'shell-route-panels__panel shell-route-panels__panel--inactive'}
          data-route-panel="explorer"
        >
          {renderScrollOwner('explorer', explorer)}
        </div>
        <div
          className={activeTab === 'main' ? 'shell-route-panels__panel shell-route-panels__panel--active' : 'shell-route-panels__panel shell-route-panels__panel--inactive'}
          data-route-panel="main"
        >
          {renderScrollOwner('main', main)}
        </div>
        <div
          className={activeTab === 'detail' ? 'shell-route-panels__panel shell-route-panels__panel--active' : 'shell-route-panels__panel shell-route-panels__panel--inactive'}
          data-route-panel="detail"
        >
          {renderScrollOwner('detail', detail)}
        </div>
      </div>
    </div>
  );
}

