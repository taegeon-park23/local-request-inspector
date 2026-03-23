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
  onActiveTabChange?: (tab: RoutePanelTabId) => void;
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
  activeTab: controlledActiveTab,
  onActiveTabChange,
}: RoutePanelTabsLayoutProps) {
  const { t } = useI18n();
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
