import { useState, type ReactNode } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import { PanelTabs, type PanelTabOption } from '@client/shared/ui/PanelTabs';
import type { AppIconName } from '@client/shared/ui/AppIcon';

export type RoutePanelTabId = 'explorer' | 'main' | 'detail';

interface RoutePanelTabsLayoutProps {
  explorer: ReactNode;
  main: ReactNode;
  detail: ReactNode;
  defaultActiveTab?: RoutePanelTabId;
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
}: RoutePanelTabsLayoutProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<RoutePanelTabId>(defaultActiveTab);

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
        onChange={setActiveTab}
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
  return (
    <RoutePanelTabsLayout
      defaultActiveTab="main"
      explorer={(
        <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
          <h2>{title} explorer</h2>
          <p>{sidebarLabel}</p>
        </section>
      )}
      main={(
        <section className="shell-panel shell-panel--main" aria-label="Main work surface">
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
        <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
          <h2>{title} detail</h2>
          <p>{detailLabel}</p>
        </aside>
      )}
    />
  );
}
