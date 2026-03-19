import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';

interface RequestTabShellProps {
  tabs: RequestTabRecord[];
  activeTabId: string | null;
  onCreateRequest: () => void;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

export function RequestTabShell({
  tabs,
  activeTabId,
  onCreateRequest,
  onSelectTab,
  onCloseTab,
}: RequestTabShellProps) {
  return (
    <div className="request-tab-shell">
      <div className="request-tab-shell__strip" role="tablist" aria-label="Request tab strip">
        {tabs.length === 0 ? (
          <p className="request-tab-shell__strip-empty">No request tabs are open.</p>
        ) : null}

        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

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
                <span className="request-tab__meta">{tab.methodLabel}</span>
              </button>
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
          + New Request
        </button>
      </div>
    </div>
  );
}

