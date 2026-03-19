import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  idle: 'Capture observation is idle until the runtime adapter starts.',
  connecting: 'Connecting to the runtime capture feed and waiting for normalized observations.',
  connected: 'Normalized capture observations are flowing. Select a row to inspect it or open a replay draft without mutating the capture record.',
  degraded: 'Capture observation is degraded. Showing the last normalized records while deeper loading and replay execution remain deferred.',
  offline: 'Capture observation is offline. Existing rows stay visible, but no new normalized captures can arrive.',
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

export function CapturesPlaceholder() {
  const navigate = useNavigate();
  const [activeDetailTab, setActiveDetailTab] = useState<CaptureDetailTabId>('timeline');
  const connectionHealth = useCapturesStore((state) => state.connectionHealth);
  const listItems = useCapturesStore((state) => state.listItems);
  const selectedCaptureId = useCapturesStore((state) => state.selectedCaptureId);
  const searchText = useCapturesStore((state) => state.searchText);
  const outcomeFilter = useCapturesStore((state) => state.outcomeFilter);
  const selectCapture = useCapturesStore((state) => state.selectCapture);
  const setSearchText = useCapturesStore((state) => state.setSearchText);
  const setOutcomeFilter = useCapturesStore((state) => state.setOutcomeFilter);

  const filteredCaptures = listItems.filter((capture) => {
    const matchesSearch = captureMatchesSearch(capture, searchText);
    const matchesOutcome = outcomeFilter === 'all' || capture.mockOutcome === outcomeFilter;

    return matchesSearch && matchesOutcome;
  });

  const selectedCapture = listItems.find((capture) => capture.id === selectedCaptureId) ?? null;
  const isLoading = connectionHealth === 'connecting' && listItems.length === 0;
  const isEmpty = !isLoading && listItems.length === 0;
  const hasNoFilteredResults = !isLoading && listItems.length > 0 && filteredCaptures.length === 0;

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
              <p>{connectionCopyByHealth[connectionHealth]}</p>
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

          {connectionHealth === 'degraded' ? (
            <EmptyStateCallout
              title="Capture observation is degraded"
              description="The adapter is degraded. Existing summaries remain visible, but deeper loading, replay execution, and richer diagnostics stay deferred."
            />
          ) : null}

          {isLoading ? (
            <EmptyStateCallout
              title="Waiting for inbound traffic"
              description="The runtime adapter has started, but no normalized capture records have arrived yet. This route stays observation-only until traffic reaches the adapter."
              className="captures-empty-state"
            />
          ) : null}

          {isEmpty ? (
            <EmptyStateCallout
              title="No captures yet"
              description="Inbound traffic will appear here once the runtime seam receives normalized capture events. Until then, replay and deeper runtime detail have nothing to open."
              className="captures-empty-state"
            />
          ) : null}

          {hasNoFilteredResults ? (
            <EmptyStateCallout
              title="No captures match these filters"
              description="Adjust the search text or mock outcome filter to bring list rows back into view."
              className="captures-empty-state"
            />
          ) : null}

          {filteredCaptures.length > 0 ? (
            <ul className="captures-list" aria-label="Captures list">
              {filteredCaptures.map((capture) => {
                const isSelected = capture.id === selectedCaptureId;

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
            Captures is an observation route for inbound traffic. Select a row to inspect normalized summaries or open an edit-first replay draft without mutating the capture record.
          </p>
        </header>

        {!selectedCapture ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title="No capture selected"
              description="Pick a capture row to inspect normalized request summaries, mock outcome vocabulary, and the compact timeline scaffold. Replay opens a separate authoring draft in Workspace."
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
              description="Replay stays edit-first. Open Replay Draft creates a new request draft while the capture record remains observation-only."
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
                Run Replay Now is disabled on purpose in this readiness slice. Save and execution wiring land later, so replay opens a fresh editable draft first.
              </p>
            </DetailViewerSection>

            <div className="captures-summary-grid">
              <DetailViewerSection
                title="Request summary"
                description="Normalized request metadata remains owned by the captures feature."
                className="capture-summary-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: 'Scope', value: selectedCapture.scopeLabel },
                    { label: 'Host/path', value: `${selectedCapture.host}${selectedCapture.path}` },
                    { label: 'Received', value: selectedCapture.receivedAtLabel },
                  ]}
                />
                <p>{selectedCapture.requestSummary}</p>
              </DetailViewerSection>

              <DetailViewerSection
                title="Headers preview"
                description="Deeper header diff and raw transport views remain deferred."
                className="capture-summary-card"
              >
                <p>{selectedCapture.headersSummary}</p>
              </DetailViewerSection>

              <DetailViewerSection
                title="Body preview"
                description={selectedCapture.bodyHint}
                className="capture-summary-card"
              >
                <pre>{selectedCapture.bodyPreview}</pre>
              </DetailViewerSection>

              <DetailViewerSection
                title="Mock outcome"
                description="Mock outcome family stays separate from transport and execution vocabulary."
                className="capture-summary-card"
              >
                <p className="captures-meta-label">Mock outcome family</p>
                <StatusBadge kind="mockOutcome" value={selectedCapture.mockOutcome} />
                <KeyValueMetaList
                  items={[
                    { label: 'Summary', value: selectedCapture.mockSummary },
                    ...(selectedCapture.mockRuleName ? [{ label: 'Rule', value: selectedCapture.mockRuleName }] : []),
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
              description="Capture timeline summaries, deeper transport views, and replay bridge notes appear after a list row is selected."
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
                    { label: 'Response summary', value: selectedCapture.responseSummary },
                  ]}
                />
                <EmptyStateCallout
                  title="Deeper capture composition is deferred"
                  description="Shared result/detail primitives reserve this panel while raw transport views, richer diagnostics, and replay execution remain out of scope."
                />
              </DetailViewerSection>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

