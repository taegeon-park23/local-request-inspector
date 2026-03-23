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

interface RoutePanelTabsLayoutProps {
  explorer: ReactNode;
  main: ReactNode;
  detail: ReactNode;
  defaultActiveTab?: RoutePanelTabId;
  activeTab?: RoutePanelTabId;
  onChange?: (tabId: RoutePanelTabId) => void;
  layoutMode?: RoutePanelLayoutMode;
  floatingExplorerRouteKey?: FloatingExplorerRouteKey;
}

interface SectionPlaceholderProps {
  title: string;
  summary: string;
  sidebarLabel: string;
  detailLabel: string;
  children?: ReactNode;
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
  defaultActiveTab = 'main',
  layoutMode = 'tabs',
  floatingExplorerRouteKey,
  activeTab: controlledActiveTab,
  onChange,
}: RoutePanelTabsLayoutProps) {
  const { t } = useI18n();
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState<RoutePanelTabId>(defaultActiveTab);
  const activeTab = controlledActiveTab ?? uncontrolledActiveTab;

  const handleChange = (tabId: RoutePanelTabId) => {
    if (controlledActiveTab === undefined) {
      setUncontrolledActiveTab(tabId);
    }

    onChange?.(tabId);
  };
  const floatingExplorerOpen = useShellStore((state) => (
    floatingExplorerRouteKey ? state.floatingExplorerOpenByRoute[floatingExplorerRouteKey] : true
  ));
  const toggleFloatingExplorer = useShellStore((state) => state.toggleFloatingExplorer);

  if (layoutMode === 'floating-explorer' && floatingExplorerRouteKey) {
    const toggleLabel = floatingExplorerOpen
      ? t('shell.routePanels.floatingExplorer.collapseAction')
      : t('shell.routePanels.floatingExplorer.expandAction');

    return (
      <div
        className={floatingExplorerOpen ? 'shell-route-panels shell-route-panels--floating' : 'shell-route-panels shell-route-panels--floating shell-route-panels--floating-collapsed'}
        data-floating-explorer-open={floatingExplorerOpen ? 'true' : 'false'}
      >
        <div className="shell-route-panels__floating-layout">
          <div className="shell-route-panels__floating-explorer-slot">
            <button
              type="button"
              className="workspace-button workspace-button--ghost shell-route-panels__floating-toggle"
              aria-label={toggleLabel}
              aria-expanded={floatingExplorerOpen}
              aria-controls={`floating-explorer-${floatingExplorerRouteKey}`}
              onClick={() => toggleFloatingExplorer(floatingExplorerRouteKey)}
              title={toggleLabel}
            >
              <AppIcon name="overview" size={18} />
              <span className="shell-route-panels__floating-toggle-copy">{toggleLabel}</span>
            </button>
            <div
              id={`floating-explorer-${floatingExplorerRouteKey}`}
              className={floatingExplorerOpen ? 'shell-route-panels__floating-explorer shell-route-panels__floating-explorer--open' : 'shell-route-panels__floating-explorer shell-route-panels__floating-explorer--closed'}
            >
              {explorer}
            </div>
          </div>
          <div className="shell-route-panels__floating-content">
            <div className="shell-route-panels__floating-main">{main}</div>
            <div className="shell-route-panels__floating-detail">{detail}</div>
          </div>
        </div>
      </div>
    );
  }

  const tabs: PanelTabOption<RoutePanelTabId>[] = [
    { id: 'explorer', label: t('shell.routePanels.explorer'), icon: routePanelTabIcons.explorer },
    { id: 'main', label: t('shell.routePanels.main'), icon: routePanelTabIcons.main },
    { id: 'detail', label: t('shell.routePanels.detail'), icon: routePanelTabIcons.detail },
  ];

  return (
    <div className="shell-route-panels">
      <PanelTabs
        ariaLabel={t('shell.routePanels.tabList')}
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleChange}
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

export function SectionPlaceholder({
  title,
  summary,
  sidebarLabel,
  detailLabel,
  children,
}: SectionPlaceholderProps) {
  const { t } = useI18n();

  return (
    <RoutePanelTabsLayout
      defaultActiveTab="main"
      explorer={(
        <section className="shell-panel shell-panel--sidebar" aria-label={t('shell.routePanels.explorerRegion')}>
          <h2>{title} explorer</h2>
          <p>{sidebarLabel}</p>
        </section>
      )}
      main={(
        <section className="shell-panel shell-panel--main" aria-label={t('shell.routePanels.mainRegion')}>
          <header className="section-placeholder__header">
            <p className="section-placeholder__eyebrow">Top-level section</p>
            <h1>{title}</h1>
          </header>
          <p>{summary}</p>
          <p>This section is intentionally a placeholder in S1 and does not include feature-specific business logic yet.</p>
          {children}
        </section>
      )}
      detail={(
        <aside className="shell-panel shell-panel--detail" aria-label={t('shell.routePanels.detailRegion')}>
          <h2>{title} detail</h2>
          <p>{detailLabel}</p>
        </aside>
      )}
    />
  );
}
