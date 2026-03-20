import { useState } from 'react';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { useRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { PanelTabs } from '@client/shared/ui/PanelTabs';
import { StatusBadge } from '@client/shared/ui/StatusBadge';

const resultPanelTabs = [
  { id: 'response', label: 'Response' },
  { id: 'console', label: 'Console' },
  { id: 'tests', label: 'Tests' },
  { id: 'execution-info', label: 'Execution Info' },
] as const;

type ResultPanelTabId = (typeof resultPanelTabs)[number]['id'];

interface RequestResultPanelPlaceholderProps {
  activeTab: RequestTabRecord | null;
}

function getTabSourceCopy(activeTab: RequestTabRecord) {
  if (activeTab.source === 'replay') {
    return activeTab.replaySource?.label ?? 'Replay draft';
  }

  if (activeTab.source === 'draft') {
    return 'Draft request tab';
  }

  const collectionCopy = activeTab.collectionName ? `Saved in ${activeTab.collectionName}` : 'Saved request';
  return activeTab.folderName ? `${collectionCopy} / ${activeTab.folderName}` : collectionCopy;
}

function getTransportOutcomeLabel(responseStatus: number | null) {
  if (responseStatus === null) {
    return 'No response';
  }

  return `HTTP ${responseStatus}`;
}

export function RequestResultPanelPlaceholder({
  activeTab,
}: RequestResultPanelPlaceholderProps) {
  const [activeResultTab, setActiveResultTab] = useState<ResultPanelTabId>('response');
  const commandEntry = useRequestCommandStore((state) =>
    activeTab ? state.byTabId[activeTab.id] : undefined,
  );
  const runStatus = commandEntry?.run ?? {
    status: 'idle' as const,
    message: null,
    latestExecution: null,
  };
  const execution = runStatus.latestExecution;

  if (!activeTab) {
    return (
      <div className="workspace-detail-panel workspace-detail-panel--empty">
        <EmptyStateCallout
          title="Observation panel is waiting for an active draft"
          description="Open a request tab first. Save updates request definitions in the center authoring surface, and Run sends execution results here without turning this panel into editable state."
        />
      </div>
    );
  }

  const activeResultTabLabel = resultPanelTabs.find((tab) => tab.id === activeResultTab)?.label ?? 'Response';

  return (
    <div className="workspace-detail-panel">
      <header className="workspace-detail-panel__header">
        <div>
          <p className="section-placeholder__eyebrow">Observation surface</p>
          <h2>Observation for {activeTab.title}</h2>
          <p>
            This right-hand panel is reserved for run observation only. Save never updates it, and request authoring stays in the center workspace surface.
          </p>
        </div>
      </header>

      <PanelTabs
        ariaLabel="Result panel tabs"
        tabs={resultPanelTabs}
        activeTab={activeResultTab}
        onChange={setActiveResultTab}
      />

      <DetailViewerSection
        title={`${activeResultTabLabel} summary`}
        description="Observation stays separate from the editable request draft. Run creates execution output here without clearing unsaved changes in the center panel."
        actions={
          execution ? <StatusBadge kind="executionOutcome" value={execution.executionOutcome} /> : null
        }
      >
        <KeyValueMetaList
          items={[
            { label: 'Active request', value: activeTab.title },
            { label: 'Method', value: activeTab.methodLabel },
            { label: 'Tab source', value: getTabSourceCopy(activeTab) },
            { label: 'Visible slot', value: activeResultTabLabel },
            { label: 'Run lane', value: runStatus.status === 'pending' ? 'Execution in progress' : runStatus.message ?? 'No execution yet' },
          ]}
        />
      </DetailViewerSection>

      {activeResultTab === 'response' ? (
        <DetailViewerSection
          title="Response detail"
          description="Response preview belongs to the latest run for this active tab only. It remains bounded here and does not rewrite the request draft."
          tone="muted"
        >
          {runStatus.status === 'pending' && !execution ? (
            <EmptyStateCallout
              title="Running request"
              description="The request is in flight. Response headers, preview size, and body preview will appear here when the current run settles."
            />
          ) : execution ? (
            <>
              <div className="request-run-outcome-row">
                <StatusBadge kind="executionOutcome" value={execution.executionOutcome} />
                <StatusBadge kind="transportOutcome" value={getTransportOutcomeLabel(execution.responseStatus)} />
              </div>
              <KeyValueMetaList
                items={[
                  { label: 'HTTP status', value: execution.responseStatusLabel },
                  { label: 'Duration', value: `${execution.durationMs} ms` },
                  { label: 'Preview size', value: execution.responsePreviewSizeLabel ?? 'No preview stored' },
                  { label: 'Headers summary', value: execution.responseHeadersSummary },
                  { label: 'Body hint', value: execution.responseBodyHint },
                ]}
              />
              <p className="shared-readiness-note">{execution.responsePreviewPolicy ?? 'Response preview stays bounded in this surface while richer inspection remains deferred.'}</p>
              <pre className="history-preview-block" data-testid="request-response-preview">{execution.responseBodyPreview || 'No response body preview was captured.'}</pre>
            </>
          ) : (
            <EmptyStateCallout
              title="Run this request to populate Response"
              description="Save only updates the request definition. Use Run to execute the current draft and load response status, preview size, headers, and body preview here."
            />
          )}
        </DetailViewerSection>
      ) : null}

      {activeResultTab === 'console' ? (
        <DetailViewerSection
          title="Console detail"
          description="Console stays observation-only. Script execution is still deferred, so this tab explains what was or was not captured instead of inventing logs."
          tone="muted"
        >
          {execution ? (
            <>
              <KeyValueMetaList
                items={[
                  { label: 'Log lines', value: execution.consoleLogCount ?? execution.consoleEntries.length },
                  { label: 'Warnings', value: execution.consoleWarningCount ?? 0 },
                  { label: 'Summary', value: execution.consoleSummary },
                ]}
              />
              {execution.consoleEntries.length > 0 ? (
                <ul className="history-preview-list">
                  {execution.consoleEntries.map((entry, index) => (
                    <li key={`${entry}-${index}`}>{entry}</li>
                  ))}
                </ul>
              ) : (
                <EmptyStateCallout
                  title="No console entries for this run"
                  description={execution.consoleSummary}
                />
              )}
            </>
          ) : (
            <EmptyStateCallout
              title="Console waits for an execution"
              description="Run the current request to associate console output with this tab. Script-linked console diagnostics remain deferred in this slice."
            />
          )}
        </DetailViewerSection>
      ) : null}

      {activeResultTab === 'tests' ? (
        <DetailViewerSection
          title="Tests detail"
          description="Tests are reserved for execution-linked assertions. Script execution is not wired in this slice, so this slot stays explicitly deferred instead of fabricating results."
          tone="muted"
        >
          {execution ? (
            <>
              <KeyValueMetaList
                items={[
                  { label: 'Summary', value: execution.testsSummary },
                  { label: 'Entries', value: execution.testEntries.length },
                ]}
              />
              {execution.testEntries.length > 0 ? (
                <ul className="history-preview-list">
                  {execution.testEntries.map((entry, index) => (
                    <li key={`${entry}-${index}`}>{entry}</li>
                  ))}
                </ul>
              ) : (
                <EmptyStateCallout
                  title="No tests ran for this execution"
                  description={execution.testsSummary}
                />
              )}
            </>
          ) : (
            <EmptyStateCallout
              title="Tests remain deferred"
              description="Running the request will populate execution metadata first. Script-backed tests and richer diagnostics stay for later slices."
            />
          )}
        </DetailViewerSection>
      ) : null}

      {activeResultTab === 'execution-info' ? (
        <DetailViewerSection
          title="Execution info"
          description="Execution metadata belongs to the latest run and stays separate from saved request definitions and inbound observation routes."
          tone="muted"
        >
          {runStatus.status === 'pending' && !execution ? (
            <EmptyStateCallout
              title="Execution is starting"
              description="A local run id, timing data, and bounded request snapshot summary will appear here once the current request settles."
            />
          ) : execution ? (
            <>
              <KeyValueMetaList
                items={[
                  { label: 'Execution id', value: execution.executionId },
                  { label: 'Started at', value: execution.startedAt },
                  { label: 'Completed at', value: execution.completedAt },
                  { label: 'Outcome', value: execution.executionOutcome },
                  { label: 'Error code', value: execution.errorCode ?? 'No execution error code' },
                  { label: 'Error summary', value: execution.errorSummary ?? 'No execution error was reported.' },
                  { label: 'Request input', value: execution.requestInputSummary ?? 'Request snapshot summary was not returned.' },
                ]}
              />
              {execution.requestSnapshotSummary ? <p className="shared-readiness-note">{execution.requestSnapshotSummary}</p> : null}
              {runStatus.message ? <p className="shared-readiness-note">{runStatus.message}</p> : null}
            </>
          ) : (
            <EmptyStateCallout
              title="No execution info yet"
              description="Use Run to create a fresh execution record for this tab. Save success does not populate execution info."
            />
          )}
        </DetailViewerSection>
      ) : null}
    </div>
  );
}
