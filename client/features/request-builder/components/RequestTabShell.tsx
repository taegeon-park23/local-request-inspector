import { memo, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useI18n } from '@client/app/providers/useI18n';
import { isRequestWorkbenchTab } from '@client/features/request-builder/request-tab-state';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import {
  selectRequestTabDraftPresentation,
  useRequestDraftStore,
} from '@client/features/request-builder/state/request-draft-store';
import { AppIcon } from '@client/shared/ui/AppIcon';
import { IconLabel } from '@client/shared/ui/IconLabel';

interface RequestTabShellProps {
  tabs: RequestTabRecord[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onPinTab: (tabId: string) => void;
  onReopenClosedTab: () => void;
  onCloseCurrentTab: () => void;
  onCloseOtherTabs: () => void;
  onCloseAllTabs: () => void;
  canReopenClosedTab: boolean;
  canCloseCurrentTab: boolean;
  canCloseOtherTabs: boolean;
  canCloseAllTabs: boolean;
}

interface ResolvedTabPresentation {
  title: string;
  methodLabel: RequestTabRecord['methodLabel'];
  hasUnsavedChanges: boolean;
}

interface RequestTabShellItemProps {
  tab: RequestTabRecord;
  isActive: boolean;
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
    case 'collection-overview':
      return t('workspaceRoute.tabShell.sourceCollectionOverview');
    case 'request-group-overview':
      return t('workspaceRoute.tabShell.sourceRequestGroupOverview');
    case 'batch-result':
      return t('workspaceRoute.tabShell.sourceBatchResult');
    default:
      return null;
  }
}

function getTabStateLabel(
  tab: RequestTabRecord,
  t: ReturnType<typeof useI18n>['t'],
) {
  const saveState = tab.statusMeta?.saveState ?? 'idle';
  const runState = tab.statusMeta?.runState ?? 'idle';

  if (saveState === 'conflict') {
    return t('workspaceRoute.tabShell.states.conflict');
  }

  if (saveState === 'pending') {
    return t('workspaceRoute.tabShell.states.saving');
  }

  if (runState === 'pending') {
    return t('workspaceRoute.tabShell.states.running');
  }

  if (tab.hasUnsavedChanges) {
    return t('workspaceRoute.tabShell.states.dirty');
  }

  if (saveState === 'saved') {
    return t('workspaceRoute.tabShell.states.saved');
  }

  if (saveState === 'error') {
    return t('workspaceRoute.tabShell.states.saveError');
  }

  if (runState === 'error') {
    return t('workspaceRoute.tabShell.states.runError');
  }

  return null;
}

function resolvePresentedTab(
  tab: RequestTabRecord,
  presentation: ResolvedTabPresentation | null,
  defaultTitle: string,
): RequestTabRecord {
  if (!presentation) {
    return tab;
  }

  return {
    ...tab,
    title: presentation.title.trim() || defaultTitle,
    methodLabel: presentation.methodLabel,
    hasUnsavedChanges: presentation.hasUnsavedChanges,
  };
}

const RequestTabShellItem = memo(function RequestTabShellItem({
  tab,
  isActive,
  onSelectTab,
  onCloseTab,
  onPinTab,
}: RequestTabShellItemProps) {
  const { t } = useI18n();
  const draftPresentation = useRequestDraftStore(
    useShallow((state): ReturnType<typeof selectRequestTabDraftPresentation> => selectRequestTabDraftPresentation(state, tab.id)),
  );

  const presentedTab = resolvePresentedTab(
    tab,
    draftPresentation,
    t('workspaceRoute.requestBuilder.defaultTitle'),
  );
  const tabSourceLabel = getTabSourceLabel(presentedTab, t);
  const tabStateLabel = getTabStateLabel(presentedTab, t);
  const isRequestTab = isRequestWorkbenchTab(presentedTab);
  const tabMeta = [
    ...(isRequestTab ? [presentedTab.methodLabel] : []),
    ...(tabSourceLabel ? [tabSourceLabel] : []),
    ...(tabStateLabel ? [tabStateLabel] : []),
  ].join(' · ');

  return (
    <div
      key={presentedTab.id}
      className={isActive ? 'request-tab request-tab--active' : 'request-tab'}
      data-active={isActive}
    >
      {presentedTab.tabMode === 'preview' ? (
        <button
          type="button"
          className="request-tab__pin request-tab__pin--interactive"
          aria-label={t('workspaceRoute.tabShell.pinTab', { title: presentedTab.title })}
          onClick={() => onPinTab(presentedTab.id)}
        >
          <AppIcon name="pin" size={14} />
        </button>
      ) : (
        <button
          type="button"
          className="request-tab__pin request-tab__pin--pinned"
          aria-label={t('workspaceRoute.tabShell.pinnedTab', { title: presentedTab.title })}
          disabled
        >
          <AppIcon name="pin" size={14} />
        </button>
      )}

      <button
        type="button"
        role="tab"
        className="request-tab__button"
        aria-selected={isActive}
        title={tabMeta.length > 0 ? `${presentedTab.title} · ${tabMeta}` : presentedTab.title}
        onClick={() => onSelectTab(presentedTab.id)}
      >
        <span className="request-tab__label">
          {isRequestTab ? <span className="request-tab__method">{presentedTab.methodLabel}</span> : null}
          <span className="request-tab__title">{presentedTab.title}</span>
          {presentedTab.hasUnsavedChanges ? (
            <span className="request-tab__dirty" aria-label={t('workspaceRoute.tabShell.dirtyIndicator', { title: presentedTab.title })}>
              *
            </span>
          ) : null}
        </span>
      </button>

      <button
        type="button"
        className="request-tab__close"
        aria-label={t('workspaceRoute.tabShell.closeTab', { title: presentedTab.title })}
        onClick={() => onCloseTab(presentedTab.id)}
      >
        <AppIcon name="disable" size={14} />
      </button>
    </div>
  );
});

export function RequestTabShell({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onPinTab,
  onReopenClosedTab,
  onCloseCurrentTab,
  onCloseOtherTabs,
  onCloseAllTabs,
  canReopenClosedTab,
  canCloseCurrentTab,
  canCloseOtherTabs,
  canCloseAllTabs,
}: RequestTabShellProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchPresentationsByTabId = useRequestDraftStore(useShallow((state): Record<string, ResolvedTabPresentation | null> | null => {
      if (normalizedQuery.length === 0) {
        return null;
      }

      const nextEntries = tabs.map((tab) => {
        const presentation = selectRequestTabDraftPresentation(state, tab.id);

        if (!presentation) {
          return [tab.id, null] as const;
        }

        return [
          tab.id,
          {
            ...presentation,
            title: presentation.title.trim() || t('workspaceRoute.requestBuilder.defaultTitle'),
          } satisfies ResolvedTabPresentation,
        ] as const;
      });

      return Object.fromEntries(nextEntries) as Record<string, ResolvedTabPresentation | null>;
    }));

  const filteredTabs = useMemo(() => {
    if (normalizedQuery.length === 0) {
      return tabs;
    }

    return tabs.filter((tab) => {
      const presentedTab = resolvePresentedTab(
        tab,
        searchPresentationsByTabId?.[tab.id] ?? null,
        t('workspaceRoute.requestBuilder.defaultTitle'),
      );
      const sourceLabel = getTabSourceLabel(presentedTab, t) ?? '';
      const stateLabel = getTabStateLabel(presentedTab, t) ?? '';
      const haystack = `${presentedTab.title} ${presentedTab.methodLabel} ${presentedTab.summary} ${sourceLabel} ${stateLabel}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, searchPresentationsByTabId, t, tabs]);

  return (
    <div className="request-tab-shell">
      <div className="request-tab-shell__toolbar">
        <div className="request-tab-shell__controls">
          <input
            type="search"
            className="request-tab-shell__search-input"
            aria-label={t('workspaceRoute.tabShell.searchLabel')}
            placeholder={t('workspaceRoute.tabShell.searchPlaceholder')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </div>

        <div className="request-tab-shell__bulk-actions">
          <button
            type="button"
            className="request-tab-shell__new-tab"
            onClick={onReopenClosedTab}
            disabled={!canReopenClosedTab}
          >
            <IconLabel icon="replay">{t('workspaceRoute.tabShell.reopenClosedTab')}</IconLabel>
          </button>
          <button
            type="button"
            className="request-tab-shell__new-tab"
            onClick={onCloseCurrentTab}
            disabled={!canCloseCurrentTab}
          >
            {t('workspaceRoute.tabShell.closeCurrentTab')}
          </button>
          <button
            type="button"
            className="request-tab-shell__new-tab"
            onClick={onCloseOtherTabs}
            disabled={!canCloseOtherTabs}
          >
            {t('workspaceRoute.tabShell.closeOtherTabs')}
          </button>
          <button
            type="button"
            className="request-tab-shell__new-tab"
            onClick={onCloseAllTabs}
            disabled={!canCloseAllTabs}
          >
            {t('workspaceRoute.tabShell.closeAllTabs')}
          </button>
        </div>
      </div>

      <div className="request-tab-shell__rail" role="tablist" aria-label={t('workspaceRoute.tabShell.ariaLabel')}>
        {tabs.length === 0 ? (
          <p className="request-tab-shell__strip-empty">{t('workspaceRoute.tabShell.empty')}</p>
        ) : normalizedQuery.length > 0 && filteredTabs.length === 0 ? (
          <p className="request-tab-shell__search-empty">{t('workspaceRoute.tabShell.searchNoMatches')}</p>
        ) : null}

        {filteredTabs.map((tab) => (
          <RequestTabShellItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSelectTab={onSelectTab}
            onCloseTab={onCloseTab}
            onPinTab={onPinTab}
          />
        ))}
      </div>
    </div>
  );
}
