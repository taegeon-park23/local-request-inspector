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

function getTabSourceLabel(
  tab: RequestTabRecord,
  t: ReturnType<typeof useI18n>['t'],
) {
  if (tab.tabMode === 'preview') {
    return t('workspaceRoute.tabShell.sourcePreview');
  }

  switch (tab.source) {
    case 'quick':
      return t('workspaceRoute.tabShell.sourceQuick');
    case 'replay':
      return t('workspaceRoute.tabShell.sourceReplay');
    case 'detached':
      return t('workspaceRoute.tabShell.sourceDetached');
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
      <div className="request-tab-shell__strip" role="tablist" aria-label={t('workspaceRoute.tabShell.ariaLabel')}>
        {tabs.length === 0 ? (
          <p className="request-tab-shell__strip-empty">{t('workspaceRoute.tabShell.empty')}</p>
        ) : null}

        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const tabSourceLabel = getTabSourceLabel(tab, t);

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
                    <span className="request-tab__dirty" aria-label={t('workspaceRoute.tabShell.dirtyIndicator', { title: tab.title })}>
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
                  aria-label={t('workspaceRoute.tabShell.pinTab', { title: tab.title })}
                  onClick={() => onPinTab(tab.id)}
                >
                  {t('workspaceRoute.tabShell.pinAction')}
                </button>
              ) : null}
              <button
                type="button"
                className="request-tab__close"
                aria-label={t('workspaceRoute.tabShell.closeTab', { title: tab.title })}
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
          <IconLabel icon="new">{t('workspaceRoute.tabShell.quickRequest')}</IconLabel>
        </button>
      </div>
    </div>
  );
}
