import { useState, type ReactNode } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import {
  useShellStore,
  type FloatingExplorerRouteKey,
} from '@client/app/providers/shell-store';
import { AppIcon, type AppIconName } from '@client/shared/ui/AppIcon';
import { PanelTabs, type PanelTabOption } from '@client/shared/ui/PanelTabs';

export type RoutePanelTabId = 'explorer' | 'main' | 'detail';

type RoutePanelLayoutMode = 'tabs' | 'floating-explorer';
type FloatingExplorerVariant = 'default' | 'focused-overlay';

interface RoutePanelTabsLayoutProps {
  explorer: ReactNode;
  main: ReactNode;
  detail: ReactNode;
  layoutMode?: RoutePanelLayoutMode;
  floatingExplorerRouteKey?: FloatingExplorerRouteKey;
  floatingExplorerVariant?: FloatingExplorerVariant;
  defaultActiveTab?: RoutePanelTabId;
  activeTab?: RoutePanelTabId;
  onActiveTabChange?: (tab: RoutePanelTabId) => void;
}

const routePanelTabIcons: Record<RoutePanelTabId, AppIconName> = {
  explorer: 'overview',
  main: 'workspace',
  detail: 'info',
};

export function RoutePanelTabsLayout({
  explorer,
  main,
  detail,
  layoutMode = 'tabs',
  floatingExplorerRouteKey,
  floatingExplorerVariant = 'default',
  defaultActiveTab = 'main',
  activeTab: controlledActiveTab,
  onActiveTabChange,
}: RoutePanelTabsLayoutProps) {
  const { t } = useI18n();
  const floatingExplorerOpen = useShellStore((state) => (
    floatingExplorerRouteKey ? state.floatingExplorerOpenByRoute[floatingExplorerRouteKey] : false
  ));
  const setFloatingExplorerOpen = useShellStore((state) => state.setFloatingExplorerOpen);
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState<RoutePanelTabId>(defaultActiveTab);
  const activeTab = controlledActiveTab ?? uncontrolledActiveTab;

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

  if (layoutMode === 'floating-explorer' && floatingExplorerRouteKey) {
    const isFocusedOverlay = floatingExplorerVariant === 'focused-overlay';
    const floatingExplorerToggleLabel = floatingExplorerOpen
      ? t('shell.routePanels.floatingExplorer.collapseAction')
      : t('shell.routePanels.floatingExplorer.expandAction');
    const floatingPanelClassName = [
      'shell-route-panels',
      'shell-route-panels--floating',
      !floatingExplorerOpen ? 'shell-route-panels--floating-collapsed' : null,
      isFocusedOverlay ? 'shell-route-panels--floating-focused' : null,
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
      >
        <div className="shell-route-panels__floating-layout">
          {isFocusedOverlay ? (
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
                {explorer}
              </div>
            </div>
          </div>
          <div className="shell-route-panels__floating-content">
            <div
              className={isFocusedOverlay && floatingExplorerOpen
                ? 'shell-route-panels__floating-main shell-route-panels__floating-main--scrimmed'
                : 'shell-route-panels__floating-main'}
              data-route-panel={activeTab === 'main' ? 'main-active' : 'main'}
              data-scrimmed={isFocusedOverlay && floatingExplorerOpen ? 'true' : 'false'}
            >
              {main}
            </div>
            <div
              className={isFocusedOverlay && floatingExplorerOpen
                ? 'shell-route-panels__floating-detail shell-route-panels__floating-detail--hidden'
                : 'shell-route-panels__floating-detail'}
              data-route-panel={activeTab === 'detail' ? 'detail-active' : 'detail'}
              data-detail-visibility={isFocusedOverlay && floatingExplorerOpen ? 'hidden' : 'visible'}
            >
              {detail}
            </div>
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
          {explorer}
        </div>
        <div
          className={activeTab === 'main' ? 'shell-route-panels__panel shell-route-panels__panel--active' : 'shell-route-panels__panel shell-route-panels__panel--inactive'}
          data-route-panel="main"
        >
          {main}
        </div>
        <div
          className={activeTab === 'detail' ? 'shell-route-panels__panel shell-route-panels__panel--active' : 'shell-route-panels__panel shell-route-panels__panel--inactive'}
          data-route-panel="detail"
        >
          {detail}
        </div>
      </div>
    </div>
  );
}
