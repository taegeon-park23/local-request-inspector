import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import { useNavigate } from 'react-router-dom';
import {
  capturedRequestDetailQueryKey,
  capturedRequestsQueryKey,
  listCapturedRequests,
  readCapturedRequest,
} from '@client/features/captures/captures.api';
import type { CaptureOutcomeFilter, CaptureRecord } from '@client/features/captures/capture.types';
import { useCapturesStore } from '@client/features/captures/state/captures-store';
import { openCaptureReplayDraft } from '@client/features/request-builder/replay/replay-bridge';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { PanelTabs } from '@client/shared/ui/PanelTabs';
import { SectionHeading } from '@client/shared/ui/SectionHeading';
import { StatusBadge } from '@client/shared/ui/StatusBadge';
import { IconLabel } from '@client/shared/ui/IconLabel';

type TranslateFn = ReturnType<typeof useI18n>['t'];
type CaptureDetailTabId = 'timeline' | 'deferred-detail';

function getOutcomeFilterOptions(t: TranslateFn): Array<{ value: CaptureOutcomeFilter; label: string }> {
  return [
    { value: 'all', label: t('capturesRoute.outcomeFilterOptions.all') },
    { value: 'Mocked', label: t('capturesRoute.outcomeFilterOptions.mocked') },
    { value: 'Bypassed', label: t('capturesRoute.outcomeFilterOptions.bypassed') },
    { value: 'No rule matched', label: t('capturesRoute.outcomeFilterOptions.noRuleMatched') },
    { value: 'Blocked', label: t('capturesRoute.outcomeFilterOptions.blocked') },
  ];
}

function getCaptureDetailTabs(t: TranslateFn) {
  return [
    { id: 'timeline', label: t('capturesRoute.timelinePanel.tabs.timeline'), icon: 'timeline' },
    { id: 'deferred-detail', label: t('capturesRoute.timelinePanel.tabs.deferredDetail'), icon: 'pending' },
  ] as const;
}

function getConnectionCopyByHealth(t: TranslateFn) {
  return {
    idle: t('capturesRoute.sidebar.health.idle'),
    connecting: t('capturesRoute.sidebar.health.connecting'),
    connected: t('capturesRoute.sidebar.health.connected'),
    degraded: t('capturesRoute.sidebar.health.degraded'),
    offline: t('capturesRoute.sidebar.health.offline'),
  } as const;
}

function captureMatchesSearch(capture: CaptureRecord, searchText: string) {
  const normalizedSearchText = searchText.trim().toLowerCase();

  if (normalizedSearchText.length === 0) {
    return true;
  }

  const haystack = [
    capture.method,
    capture.host,
    capture.path,
    capture.bodyHint,
    capture.mockOutcome,
    capture.mockRuleName,
    capture.scopeLabel,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedSearchText);
}

function hasStoredBodyPreview(capture: CaptureRecord) {
  return capture.bodyPreview.trim().length > 0 && !capture.bodyPreview.startsWith('No request body preview');
}

function getCaptureStorageSummary(capture: CaptureRecord, t: TranslateFn) {
  if (capture.storageSummary) {
    return capture.storageSummary;
  }

  return hasStoredBodyPreview(capture)
    ? t('capturesRoute.helpers.storageSummaryWithPreview', {
      count: capture.requestHeaderCount ?? capture.requestHeaders.length,
    })
    : t('capturesRoute.helpers.storageSummaryWithoutPreview', {
      count: capture.requestHeaderCount ?? capture.requestHeaders.length,
    });
}

function getCaptureBodyPreviewPolicy(capture: CaptureRecord, t: TranslateFn) {
  if (capture.bodyPreviewPolicy) {
    return capture.bodyPreviewPolicy;
  }

  return hasStoredBodyPreview(capture)
    ? t('capturesRoute.helpers.bodyPreviewPolicyWithPreview')
    : t('capturesRoute.helpers.bodyPreviewPolicyWithoutPreview');
}

function getCaptureStatusSummary(capture: CaptureRecord, t: TranslateFn) {
  return capture.statusCode === null
    ? t('capturesRoute.helpers.statusSummaryNoResponse')
    : t('capturesRoute.helpers.statusSummaryHttp', { statusCode: capture.statusCode });
}

function getCaptureObservationSourceLabel(t: TranslateFn) {
  return t('capturesRoute.helpers.observationSourceLabel');
}

export function CapturesPlaceholder() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [activeDetailTab, setActiveDetailTab] = useState<CaptureDetailTabId>('timeline');
  const connectionHealth = useCapturesStore((state) => state.connectionHealth);
  const selectedCaptureId = useCapturesStore((state) => state.selectedCaptureId);
  const searchText = useCapturesStore((state) => state.searchText);
  const outcomeFilter = useCapturesStore((state) => state.outcomeFilter);
  const selectCapture = useCapturesStore((state) => state.selectCapture);
  const setSearchText = useCapturesStore((state) => state.setSearchText);
  const setOutcomeFilter = useCapturesStore((state) => state.setOutcomeFilter);

  const outcomeFilterOptions = getOutcomeFilterOptions(t);
  const captureDetailTabs = getCaptureDetailTabs(t);
  const connectionCopyByHealth = getConnectionCopyByHealth(t);

  const capturesListQuery = useQuery({
    queryKey: capturedRequestsQueryKey,
    queryFn: listCapturedRequests,
  });

  const listItems = capturesListQuery.data ?? [];
  const filteredCaptures = listItems.filter((capture) => {
    const matchesSearch = captureMatchesSearch(capture, searchText);
    const matchesOutcome = outcomeFilter === 'all' || capture.mockOutcome === outcomeFilter;

    return matchesSearch && matchesOutcome;
  });
  const effectiveSelectedCaptureId = filteredCaptures.some((capture) => capture.id === selectedCaptureId)
    ? selectedCaptureId
    : filteredCaptures[0]?.id ?? null;
  useEffect(() => {
    if (selectedCaptureId !== effectiveSelectedCaptureId) {
      selectCapture(effectiveSelectedCaptureId);
    }
  }, [effectiveSelectedCaptureId, selectCapture, selectedCaptureId]);

  const captureDetailQuery = useQuery({
    queryKey: capturedRequestDetailQueryKey(effectiveSelectedCaptureId),
    queryFn: () => readCapturedRequest(effectiveSelectedCaptureId!),
    enabled: effectiveSelectedCaptureId !== null,
  });

  const selectedCapture = captureDetailQuery.data
    ?? filteredCaptures.find((capture) => capture.id === effectiveSelectedCaptureId)
    ?? null;
  const observationHealth = capturesListQuery.isError || captureDetailQuery.isError ? 'degraded' : connectionHealth;
  const isLoading = capturesListQuery.isPending && !capturesListQuery.data;
  const isDetailLoading = effectiveSelectedCaptureId !== null && captureDetailQuery.isPending && !captureDetailQuery.data;
  const isEmpty = !isLoading && listItems.length === 0;
  const hasNoFilteredResults = !isLoading && listItems.length > 0 && filteredCaptures.length === 0;
  const degradedReason = capturesListQuery.error instanceof Error
    ? capturesListQuery.error.message
    : captureDetailQuery.error instanceof Error
      ? captureDetailQuery.error.message
      : connectionHealth === 'degraded'
        ? 'Runtime events are degraded, so new capture refreshes may lag behind persisted data.'
        : 'Capture observation is temporarily unavailable.';

  const handleOpenReplayDraft = () => {
    if (!selectedCapture) {
      return;
    }

    openCaptureReplayDraft(selectedCapture);
    navigate('/workspace');
  };

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <div className="captures-explorer">
          <header className="captures-explorer__header">
            <div>
              <p className="section-placeholder__eyebrow">{t('capturesRoute.sidebar.eyebrow')}</p>
              <h2>{t('capturesRoute.sidebar.title')}</h2>
              <p>{connectionCopyByHealth[observationHealth]}</p>
              <div className="workspace-explorer__role-strip" aria-label="Capture surface role">
                <span className="workspace-chip">{t('roles.observation')}</span>
                <span className="workspace-chip workspace-chip--secondary">{t('capturesRoute.sidebar.roleChip')}</span>
              </div>
            </div>
            <StatusBadge kind="connection" value={connectionHealth} />
          </header>

          <div className="captures-filter-grid">
            <label className="request-field">
              <span>{t('capturesRoute.filters.searchLabel')}</span>
              <input
                aria-label={t('capturesRoute.filters.searchLabel')}
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.currentTarget.value)}
              />
            </label>
            <label className="request-field request-field--compact">
              <span>{t('capturesRoute.filters.outcomeFilterLabel')}</span>
              <select
                aria-label={t('capturesRoute.filters.outcomeFilterLabel')}
                value={outcomeFilter}
                onChange={(event) => setOutcomeFilter(event.currentTarget.value as CaptureOutcomeFilter)}
              >
                {outcomeFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <EmptyStateCallout
              title={t('capturesRoute.empty.loadingList.title')}
              description={t('capturesRoute.empty.loadingList.description')}
              className="captures-empty-state"
            />
          ) : null}

          {observationHealth === 'degraded' ? (
            <EmptyStateCallout
              title={t('capturesRoute.empty.degraded.title')}
              description={`${t('capturesRoute.empty.degraded.fallbackDescription')} ${degradedReason}`}
            />
          ) : null}

          {isEmpty ? (
            <EmptyStateCallout
              title={t('capturesRoute.empty.noItems.title')}
              description={t('capturesRoute.empty.noItems.description')}
              className="captures-empty-state"
            />
          ) : null}

          {hasNoFilteredResults ? (
            <EmptyStateCallout
              title={t('capturesRoute.empty.noFilteredItems.title')}
              description={t('capturesRoute.empty.noFilteredItems.description')}
              className="captures-empty-state"
            />
          ) : null}

          {filteredCaptures.length > 0 ? (
            <ul className="captures-list" aria-label={t('capturesRoute.filters.listAriaLabel')}>
              {filteredCaptures.map((capture) => {
                const isSelected = capture.id === effectiveSelectedCaptureId;

                return (
                  <li key={capture.id}>
                    <button
                      type="button"
                      className={isSelected ? 'capture-row capture-row--selected' : 'capture-row'}
                      aria-label={t('capturesRoute.helpers.openCaptureAction', {
                        method: capture.method,
                        path: capture.path,
                      })}
                      aria-pressed={isSelected}
                      data-mock-outcome={capture.mockOutcome.toLowerCase().replace(/\s+/g, '-')}
                      onClick={() => selectCapture(capture.id)}
                    >
                      <span className="capture-row__top">
                        <span className="workspace-chip">{capture.method}</span>
                        <StatusBadge kind="mockOutcome" value={capture.mockOutcome} />
                        <span className="workspace-chip workspace-chip--secondary">{capture.scopeLabel}</span>
                      </span>
                      <span className="capture-row__path">{capture.host}{capture.path}</span>
                      <span className="capture-row__summary">{capture.bodyHint}</span>
                      <span className="capture-row__meta">{capture.receivedAtLabel} · {capture.scopeLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <SectionHeading
          icon="captures"
          title={t('routes.captures.title')}
          summary={t('routes.captures.summary')}
        >
          <div className="workspace-explorer__role-strip" aria-label="Captures route role">
            <span className="workspace-chip">{t('roles.observation')}</span>
            <span className="workspace-chip workspace-chip--secondary">{t('routes.captures.contextChip')}</span>
          </div>
        </SectionHeading>

        {isLoading ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title={t('capturesRoute.empty.loadingDetail.title')}
              description={t('capturesRoute.empty.loadingDetail.description')}
            />
          </div>
        ) : !selectedCapture ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title={t('capturesRoute.empty.noSelection.title')}
              description={t('capturesRoute.empty.noSelection.description')}
            />
          </div>
        ) : isDetailLoading ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title={t('capturesRoute.empty.loadingPersistedDetail.title')}
              description={t('capturesRoute.empty.loadingPersistedDetail.description')}
            />
          </div>
        ) : captureDetailQuery.isError ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title={t('capturesRoute.empty.detailDegraded.title')}
              description={`${t('capturesRoute.empty.detailDegraded.fallbackDescription')} ${degradedReason}`}
            />
          </div>
        ) : (
          <div className="captures-detail">
            <header className="captures-detail__header">
              <div>
                <p className="section-placeholder__eyebrow">{t('capturesRoute.detail.header.eyebrow')}</p>
                <h2>{t('capturesRoute.detail.header.title')}</h2>
                <p>{selectedCapture.requestSummary}</p>
                <div className="workspace-explorer__role-strip" aria-label="Capture detail role">
                  <span className="workspace-chip">{t('roles.observation')}</span>
                  <span className="workspace-chip workspace-chip--secondary">{t('capturesRoute.detail.header.roleChip')}</span>
                </div>
              </div>
              <div className="request-work-surface__badges">
                <span className="workspace-chip">{selectedCapture.method}</span>
                <StatusBadge kind="mockOutcome" value={selectedCapture.mockOutcome} />
                <span className="workspace-chip">{selectedCapture.receivedAtLabel}</span>
              </div>
            </header>

            <DetailViewerSection
              title={t('capturesRoute.detail.bridge.title')}
              description={t('capturesRoute.detail.bridge.description')}
              className="capture-summary-card capture-summary-card--bridge"
              actions={(
                <div className="request-work-surface__future-actions">
                  <button type="button" className="workspace-button workspace-button--secondary" onClick={handleOpenReplayDraft}>
                    <IconLabel icon="replay">{t('capturesRoute.detail.bridge.openReplayDraft')}</IconLabel>
                  </button>
                  <button type="button" className="workspace-button workspace-button--secondary" disabled>
                    <IconLabel icon="run">{t('capturesRoute.detail.bridge.runReplayNow')}</IconLabel>
                  </button>
                </div>
              )}
            >
              <p className="shared-readiness-note">{t('capturesRoute.detail.bridge.readinessNote')}</p>
            </DetailViewerSection>

            <div className="captures-summary-grid">
              <DetailViewerSection
                title={t('capturesRoute.detail.requestSnapshot.title')}
                description={t('capturesRoute.detail.requestSnapshot.description')}
                className="capture-summary-card capture-summary-card--snapshot"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('capturesRoute.detail.requestSnapshot.labels.snapshotSource'), value: getCaptureObservationSourceLabel(t) },
                    { label: t('capturesRoute.detail.requestSnapshot.labels.hostPath'), value: `${selectedCapture.host}${selectedCapture.path}` },
                    { label: t('capturesRoute.detail.requestSnapshot.labels.observedAt'), value: selectedCapture.receivedAtLabel },
                    { label: t('capturesRoute.detail.requestSnapshot.labels.scope'), value: selectedCapture.scopeLabel },
                    { label: t('capturesRoute.detail.requestSnapshot.labels.headers'), value: selectedCapture.requestHeaderCount ?? selectedCapture.requestHeaders.length },
                  ]}
                />
                <p>{selectedCapture.requestSummary}</p>
              </DetailViewerSection>

              <DetailViewerSection
                title={t('capturesRoute.detail.persistenceSummary.title')}
                description={t('capturesRoute.detail.persistenceSummary.description')}
                className="capture-summary-card capture-summary-card--storage"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('capturesRoute.detail.persistenceSummary.labels.headersSummary'), value: selectedCapture.headersSummary },
                    { label: t('capturesRoute.detail.persistenceSummary.labels.bodyHint'), value: selectedCapture.bodyHint },
                    { label: t('capturesRoute.detail.persistenceSummary.labels.storedSummary'), value: getCaptureStorageSummary(selectedCapture, t) },
                    { label: t('capturesRoute.detail.persistenceSummary.labels.previewPolicy'), value: getCaptureBodyPreviewPolicy(selectedCapture, t) },
                  ]}
                />
              </DetailViewerSection>

              <DetailViewerSection
                title={t('capturesRoute.detail.bodyPreview.title')}
                description={selectedCapture.bodyHint}
                className="capture-summary-card capture-summary-card--preview"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('capturesRoute.detail.bodyPreview.labels.responseStatus'), value: getCaptureStatusSummary(selectedCapture, t) },
                    { label: t('capturesRoute.detail.bodyPreview.labels.previewPolicy'), value: getCaptureBodyPreviewPolicy(selectedCapture, t) },
                  ]}
                />
                <pre>{selectedCapture.bodyPreview}</pre>
              </DetailViewerSection>

              <DetailViewerSection
                title={t('capturesRoute.detail.mockHandling.title')}
                description={t('capturesRoute.detail.mockHandling.description')}
                className="capture-summary-card capture-summary-card--outcome"
              >
                <p className="captures-meta-label">{t('capturesRoute.detail.mockHandling.outcomeFamilyLabel')}</p>
                <StatusBadge kind="mockOutcome" value={selectedCapture.mockOutcome} />
                <KeyValueMetaList
                  items={[
                    { label: t('capturesRoute.detail.mockHandling.labels.summary'), value: selectedCapture.mockSummary },
                    { label: t('capturesRoute.detail.mockHandling.labels.handlingSummary'), value: selectedCapture.responseSummary },
                    ...(selectedCapture.mockRuleName ? [{ label: t('capturesRoute.detail.mockHandling.labels.rule'), value: selectedCapture.mockRuleName }] : []),
                    ...(selectedCapture.delayLabel ? [{ label: t('capturesRoute.detail.mockHandling.labels.delay'), value: selectedCapture.delayLabel }] : []),
                  ]}
                />
              </DetailViewerSection>
            </div>
          </div>
        )}
      </section>

      <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
        {!selectedCapture ? (
          <div className="workspace-detail-panel workspace-detail-panel--empty">
            <EmptyStateCallout
              title={t('capturesRoute.empty.timelinePlaceholder.title')}
              description={t('capturesRoute.empty.timelinePlaceholder.description')}
            />
          </div>
        ) : (
          <div className="workspace-detail-panel">
            <header className="workspace-detail-panel__header">
              <div>
                <p className="section-placeholder__eyebrow">{t('capturesRoute.timelinePanel.header.eyebrow')}</p>
                <h2>{t('capturesRoute.timelinePanel.header.title')}</h2>
                <p>{t('capturesRoute.timelinePanel.header.description')}</p>
                <div className="workspace-explorer__role-strip" aria-label="Capture timeline role">
                  <span className="workspace-chip">{t('roles.observation')}</span>
                  <span className="workspace-chip workspace-chip--secondary">{t('capturesRoute.timelinePanel.header.roleChip')}</span>
                </div>
              </div>
            </header>

            <PanelTabs
              ariaLabel={t('capturesRoute.timelinePanel.tabs.ariaLabel')}
              tabs={captureDetailTabs}
              activeTab={activeDetailTab}
              onChange={setActiveDetailTab}
            />

            {activeDetailTab === 'timeline' ? (
              <DetailViewerSection
                title={t('capturesRoute.timelinePanel.timelineSummary.title')}
                description={t('capturesRoute.timelinePanel.timelineSummary.description')}
                className="capture-summary-card capture-summary-card--timeline"
              >
                <ol className="capture-timeline" aria-label={t('capturesRoute.timelinePanel.timelineSummary.ariaLabel')}>
                  {selectedCapture.timelineEntries.map((entry) => (
                    <li key={entry.id} className="capture-timeline__item">
                      <DetailViewerSection title={entry.title} description={entry.summary} tone="muted" />
                    </li>
                  ))}
                </ol>
              </DetailViewerSection>
            ) : (
              <DetailViewerSection
                title={t('capturesRoute.timelinePanel.deferred.title')}
                description={selectedCapture.responseSummary}
                className="capture-summary-card capture-summary-card--deferred"
                tone="muted"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('capturesRoute.timelinePanel.deferred.labels.mockOutcome'), value: selectedCapture.mockOutcome },
                    { label: t('capturesRoute.timelinePanel.deferred.labels.handlingSummary'), value: selectedCapture.responseSummary },
                    { label: t('capturesRoute.timelinePanel.deferred.labels.storedSummary'), value: getCaptureStorageSummary(selectedCapture, t) },
                    { label: t('capturesRoute.timelinePanel.deferred.labels.previewPolicy'), value: getCaptureBodyPreviewPolicy(selectedCapture, t) },
                  ]}
                />
                <EmptyStateCallout
                  title={t('capturesRoute.timelinePanel.deferred.emptyTitle')}
                  description={t('capturesRoute.timelinePanel.deferred.emptyDescription')}
                />
              </DetailViewerSection>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
