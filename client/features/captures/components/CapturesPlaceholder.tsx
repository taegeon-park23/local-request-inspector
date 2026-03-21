import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { StatusBadge } from '@client/shared/ui/StatusBadge';

const outcomeFilterOptions: Array<{ value: CaptureOutcomeFilter; label: string }> = [
  { value: 'all', label: 'All outcomes' },
  { value: 'Mocked', label: 'Mocked' },
  { value: 'Bypassed', label: 'Bypassed' },
  { value: 'No rule matched', label: 'No rule matched' },
  { value: 'Blocked', label: 'Blocked' },
];

const captureDetailTabs = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'deferred-detail', label: 'Deferred detail' },
] as const;

type CaptureDetailTabId = (typeof captureDetailTabs)[number]['id'];

const connectionCopyByHealth = {
  idle: 'Capture observation is idle until the runtime adapter starts and the persisted capture list is queried.',
  connecting: 'Connecting to the runtime capture feed while loading the latest persisted inbound capture summaries.',
  connected: 'Persisted inbound capture summaries are available. Select a row to inspect it or open a replay draft without mutating the capture record.',
  degraded: 'Capture observation is degraded. Existing persisted inbound summaries may still be visible while refresh and deeper diagnostics remain limited.',
  offline: 'Capture observation is offline. Persisted inbound capture rows remain queryable, but no new runtime events can trigger refresh right now.',
} as const;

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

function getCaptureStorageSummary(capture: CaptureRecord) {
  return capture.storageSummary
    ?? `Persisted capture keeps ${capture.requestHeaderCount ?? capture.requestHeaders.length} header(s) and bounded request previews for observation and replay.`;
}

function getCaptureBodyPreviewPolicy(capture: CaptureRecord) {
  return capture.bodyPreviewPolicy
    ?? (capture.bodyPreview.length > 0
      ? 'Captured request body preview remains bounded before deeper diagnostics are added.'
      : 'No request body preview was persisted for this capture.');
}

function getCaptureStatusSummary(capture: CaptureRecord) {
  return capture.statusCode === null ? 'No response status summary' : `HTTP ${capture.statusCode}`;
}

function getCaptureObservationSourceLabel() {
  return 'Inbound request snapshot';
}

export function CapturesPlaceholder() {
  const navigate = useNavigate();
  const [activeDetailTab, setActiveDetailTab] = useState<CaptureDetailTabId>('timeline');
  const connectionHealth = useCapturesStore((state) => state.connectionHealth);
  const selectedCaptureId = useCapturesStore((state) => state.selectedCaptureId);
  const searchText = useCapturesStore((state) => state.searchText);
  const outcomeFilter = useCapturesStore((state) => state.outcomeFilter);
  const selectCapture = useCapturesStore((state) => state.selectCapture);
  const setSearchText = useCapturesStore((state) => state.setSearchText);
  const setOutcomeFilter = useCapturesStore((state) => state.setOutcomeFilter);

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
              <p className="section-placeholder__eyebrow">Observation feed</p>
              <h2>Capture list</h2>
              <p>{connectionCopyByHealth[observationHealth]}</p>
            </div>
            <StatusBadge kind="connection" value={connectionHealth} />
          </header>

          <div className="captures-filter-grid">
            <label className="request-field">
              <span>Search captures</span>
              <input
                aria-label="Search captures"
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.currentTarget.value)}
              />
            </label>
            <label className="request-field request-field--compact">
              <span>Mock outcome filter</span>
              <select
                aria-label="Mock outcome filter"
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
              title="Loading persisted captures"
              description="Waiting for the runtime lane to return the latest inbound capture summaries. Runtime events refresh this list when new captures arrive."
              className="captures-empty-state"
            />
          ) : null}

          {observationHealth === 'degraded' ? (
            <EmptyStateCallout
              title="Capture observation is degraded"
              description={`Persisted capture summaries could not be refreshed cleanly. ${degradedReason}`}
            />
          ) : null}

          {isEmpty ? (
            <EmptyStateCallout
              title="No captures yet"
              description="Inbound traffic will appear here once requests hit the local server and the runtime lane persists bounded capture summaries."
              className="captures-empty-state"
            />
          ) : null}

          {hasNoFilteredResults ? (
            <EmptyStateCallout
              title="No captures match these filters"
              description="Adjust the search text or mock outcome filter to bring persisted capture rows back into view."
              className="captures-empty-state"
            />
          ) : null}

          {filteredCaptures.length > 0 ? (
            <ul className="captures-list" aria-label="Captures list">
              {filteredCaptures.map((capture) => {
                const isSelected = capture.id === effectiveSelectedCaptureId;

                return (
                  <li key={capture.id}>
                    <button
                      type="button"
                      className={isSelected ? 'capture-row capture-row--selected' : 'capture-row'}
                      aria-label={`Open capture ${capture.method} ${capture.path}`}
                      aria-pressed={isSelected}
                      onClick={() => selectCapture(capture.id)}
                    >
                      <span className="capture-row__top">
                        <span className="workspace-chip">{capture.method}</span>
                        <StatusBadge kind="mockOutcome" value={capture.mockOutcome} />
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
        <header className="section-placeholder__header">
          <p className="section-placeholder__eyebrow">Top-level section</p>
          <h1>Captures</h1>
          <p>
            Captures is an observation route for inbound traffic. It reads persisted capture summaries from the runtime lane and keeps replay as an explicit edit-first bridge into Workspace.
          </p>
        </header>

        {isLoading ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="Loading persisted capture detail"
              description="The runtime lane is loading the latest capture list before a detail row can be selected."
            />
          </div>
        ) : !selectedCapture ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="No capture selected"
              description="Pick a capture row to inspect the persisted inbound request snapshot, mock outcome vocabulary, and the compact timeline scaffold. Replay opens a separate authoring draft in Workspace."
            />
          </div>
        ) : isDetailLoading ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="Loading persisted capture detail"
              description="Fetching the selected captured request from the runtime lane. The detail surface stays observation-only once the row loads."
            />
          </div>
        ) : captureDetailQuery.isError ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="Capture detail is degraded"
              description={`The selected captured request could not be loaded cleanly. ${degradedReason}`}
            />
          </div>
        ) : (
          <div className="captures-detail">
            <header className="captures-detail__header">
              <div>
                <p className="section-placeholder__eyebrow">Observation detail</p>
                <h2>Capture detail</h2>
                <p>{selectedCapture.requestSummary}</p>
              </div>
              <div className="request-work-surface__badges">
                <span className="workspace-chip">{selectedCapture.method}</span>
                <StatusBadge kind="mockOutcome" value={selectedCapture.mockOutcome} />
                <span className="workspace-chip">{selectedCapture.receivedAtLabel}</span>
              </div>
            </header>

            <DetailViewerSection
              title="Observation bridge"
              description="Replay stays edit-first. Open Replay Draft creates a new request draft while the captured request remains observation-only."
              actions={(
                <div className="request-work-surface__future-actions">
                  <button type="button" className="workspace-button workspace-button--secondary" onClick={handleOpenReplayDraft}>
                    Open Replay Draft
                  </button>
                  <button type="button" className="workspace-button workspace-button--secondary" disabled>
                    Run Replay Now
                  </button>
                </div>
              )}
            >
              <p className="shared-readiness-note">
                Run Replay Now stays disabled in this slice. Real capture data now drives this route, but replay still opens a fresh editable draft first.
              </p>
            </DetailViewerSection>

            <div className="captures-summary-grid">
              <DetailViewerSection
                title="Request snapshot"
                description="Inbound request snapshots stay separate from outbound execution history and editable request drafts."
                className="capture-summary-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Snapshot source', value: getCaptureObservationSourceLabel() },
                    { label: 'Host/path', value: `${selectedCapture.host}${selectedCapture.path}` },
                    { label: 'Observed at', value: selectedCapture.receivedAtLabel },
                    { label: 'Scope', value: selectedCapture.scopeLabel },
                    { label: 'Headers', value: selectedCapture.requestHeaderCount ?? selectedCapture.requestHeaders.length },
                  ]}
                />
                <p>{selectedCapture.requestSummary}</p>
              </DetailViewerSection>

              <DetailViewerSection
                title="Persistence summary"
                description="Stored capture headers and body previews remain bounded and redacted where needed before replay or deeper diagnostics are considered."
                className="capture-summary-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Headers summary', value: selectedCapture.headersSummary },
                    { label: 'Body hint', value: selectedCapture.bodyHint },
                    { label: 'Stored summary', value: getCaptureStorageSummary(selectedCapture) },
                    { label: 'Preview policy', value: getCaptureBodyPreviewPolicy(selectedCapture) },
                  ]}
                />
              </DetailViewerSection>

              <DetailViewerSection
                title="Body preview"
                description={selectedCapture.bodyHint}
                className="capture-summary-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Response status', value: getCaptureStatusSummary(selectedCapture) },
                    { label: 'Preview policy', value: getCaptureBodyPreviewPolicy(selectedCapture) },
                  ]}
                />
                <pre>{selectedCapture.bodyPreview}</pre>
              </DetailViewerSection>

              <DetailViewerSection
                title="Mock handling"
                description="Mock outcome family stays separate from connection, execution, and transport vocabulary."
                className="capture-summary-card"
              >
                <p className="captures-meta-label">Mock outcome family</p>
                <StatusBadge kind="mockOutcome" value={selectedCapture.mockOutcome} />
                <KeyValueMetaList
                  items={[
                    { label: 'Summary', value: selectedCapture.mockSummary },
                    { label: 'Handling summary', value: selectedCapture.responseSummary },
                    ...(selectedCapture.mockRuleName ? [{ label: 'Rule', value: selectedCapture.mockRuleName }] : []),
                    ...(selectedCapture.delayLabel ? [{ label: 'Delay', value: selectedCapture.delayLabel }] : []),
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
              title="Compact timeline placeholder"
              description="Capture timeline summaries, handling notes, and replay bridge guidance appear after a persisted capture row is selected."
            />
          </div>
        ) : (
          <div className="workspace-detail-panel">
            <header className="workspace-detail-panel__header">
              <div>
                <p className="section-placeholder__eyebrow">Observation panel</p>
                <h2>Compact timeline</h2>
                <p>Compact summary blocks only. Unified timelines, diff viewers, and deep traces remain out of scope.</p>
              </div>
            </header>

            <PanelTabs
              ariaLabel="Capture detail tabs"
              tabs={captureDetailTabs}
              activeTab={activeDetailTab}
              onChange={setActiveDetailTab}
            />

            {activeDetailTab === 'timeline' ? (
              <DetailViewerSection
                title="Timeline summary"
                description="Compact summary blocks only. Unified timelines, diff viewers, and deep traces remain out of scope for this slice."
              >
                <ol className="capture-timeline" aria-label="Capture timeline">
                  {selectedCapture.timelineEntries.map((entry) => (
                    <li key={entry.id} className="capture-timeline__item">
                      <DetailViewerSection title={entry.title} description={entry.summary} tone="muted" />
                    </li>
                  ))}
                </ol>
              </DetailViewerSection>
            ) : (
              <DetailViewerSection
                title="Deferred runtime detail"
                description={selectedCapture.responseSummary}
                tone="muted"
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Mock outcome', value: selectedCapture.mockOutcome },
                    { label: 'Handling summary', value: selectedCapture.responseSummary },
                    { label: 'Stored summary', value: getCaptureStorageSummary(selectedCapture) },
                    { label: 'Preview policy', value: getCaptureBodyPreviewPolicy(selectedCapture) },
                  ]}
                />
                <EmptyStateCallout
                  title="Deeper capture composition is deferred"
                  description="Persisted capture detail stops at bounded handling summaries while raw transport views, richer diagnostics, and replay execution remain out of scope."
                />
              </DetailViewerSection>
            )}
          </div>
        )}
      </aside>
    </>
  );
}












