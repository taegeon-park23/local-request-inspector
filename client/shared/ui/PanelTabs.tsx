import type { AppIconName } from '@client/shared/ui/AppIcon';
import { IconLabel } from '@client/shared/ui/IconLabel';

export interface PanelTabOption<TTabId extends string> {
  id: TTabId;
  label: string;
  icon?: AppIconName;
}

interface PanelTabsProps<TTabId extends string> {
  ariaLabel: string;
  tabs: readonly PanelTabOption<TTabId>[];
  activeTab: TTabId;
  onChange: (tabId: TTabId) => void;
}

export function PanelTabs<TTabId extends string>({
  ariaLabel,
  tabs,
  activeTab,
  onChange,
}: PanelTabsProps<TTabId>) {
  return (
    <div className="shared-panel-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={isActive ? 'shared-panel-tabs__tab shared-panel-tabs__tab--active' : 'shared-panel-tabs__tab'}
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon ? <IconLabel icon={tab.icon}>{tab.label}</IconLabel> : tab.label}
          </button>
        );
      })}
    </div>
  );
}
