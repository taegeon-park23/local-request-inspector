import { useI18n } from '@client/app/providers/useI18n';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { IconLabel } from '@client/shared/ui/IconLabel';

interface RequestTabShellProps {
  tabs: RequestTabRecord[];
  activeTabId: string | null;
  onCreateRequest: () => void;
  onCreateQuickRequest: () => void;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onPinTab: (tabId: string) => void;
}

function getTabSourceLabel(tab: RequestTabRecord) {
  if (tab.tabMode === 'preview') {
    return 'Preview';
  }

  switch (tab.source) {
    case 'quick':
      return 'Quick';
    case 'replay':
      return 'Replay';
    case 'detached':
      return 'Detached';
    default:
      return null;
  }
}

export function RequestTabShell({
  tabs,
  activeTabId,
  onCreateRequest,
  onCreateQuickRequest,
  onSelectTab,
  onCloseTab,
  onPinTab,
}: RequestTabShellProps) {
  const { t } = useI18n();

  return (
    <div className="request-tab-shell">
      <div className="request-tab-shell__strip" role="tablist" aria-label="Request tab strip">
        {tabs.length === 0 ? (
          <p className="request-tab-shell__strip-empty">{t('workspaceRoute.tabShell.empty')}</p>
        ) : null}

        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const tabSourceLabel = getTabSourceLabel(tab);

          return (
            <div
              key={tab.id}
              className={isActive ? 'request-tab request-tab--active' : 'request-tab'}
              data-active={isActive}
            >
              <button
                type="button"
                role="tab"
                className="request-tab__button"
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.id)}
              >
                <span className="request-tab__title-row">
                  <span className="request-tab__title">{tab.title}</span>
                  {tab.hasUnsavedChanges ? (
                    <span className="request-tab__dirty" aria-label={`${tab.title} has unsaved changes`}>
                      *
                    </span>
                  ) : null}
                </span>
                <span className="request-tab__meta">
                  {tab.methodLabel}
                  {tabSourceLabel ? ` · ${tabSourceLabel}` : ''}
                </span>
              </button>
              {tab.tabMode === 'preview' ? (
                <button
                  type="button"
                  className="request-tab__close"
                  aria-label={`Pin ${tab.title}`}
                  onClick={() => onPinTab(tab.id)}
                >
                  pin
                </button>
              ) : null}
              <button
                type="button"
                className="request-tab__close"
                aria-label={`Close ${tab.title}`}
                onClick={() => onCloseTab(tab.id)}
              >
                x
              </button>
            </div>
          );
        })}

        <button type="button" className="request-tab-shell__new-tab" onClick={onCreateRequest}>
          <IconLabel icon="new">{t('workspaceRoute.tabShell.newRequest')}</IconLabel>
        </button>
        <button type="button" className="request-tab-shell__new-tab" onClick={onCreateQuickRequest}>
          <IconLabel icon="new">Quick Request</IconLabel>
        </button>
      </div>
    </div>
  );
}
