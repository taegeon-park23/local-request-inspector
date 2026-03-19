import { useState } from 'react';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { PanelTabs } from '@client/shared/ui/PanelTabs';

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
  if (activeTab.source === 'draft') {
    return 'Draft request tab';
  }

  const collectionCopy = activeTab.collectionName ? `Saved in ${activeTab.collectionName}` : 'Saved request';

  return activeTab.folderName ? `${collectionCopy} / ${activeTab.folderName}` : collectionCopy;
}

export function RequestResultPanelPlaceholder({
  activeTab,
}: RequestResultPanelPlaceholderProps) {
  const [activeResultTab, setActiveResultTab] = useState<ResultPanelTabId>('response');

  if (!activeTab) {
    return (
      <div className="workspace-detail-panel workspace-detail-panel--empty">
        <EmptyStateCallout
          title="Result and detail panel placeholder"
          description="Runtime observation surfaces stay empty until a request tab is active. Execution results, console output, tests, and execution info remain intentionally deferred."
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
            Shared result/detail primitives now shape this placeholder while runtime-backed execution data stays out of scope.
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
        description="This panel remains observation-only and does not own request authoring state."
      >
        <KeyValueMetaList
          items={[
            { label: 'Active request', value: activeTab.title },
            { label: 'Method', value: activeTab.methodLabel },
            { label: 'Tab source', value: getTabSourceCopy(activeTab) },
            { label: 'Reserved surface', value: activeResultTabLabel },
          ]}
        />
      </DetailViewerSection>

      <DetailViewerSection
        title={`${activeResultTabLabel} detail`}
        description={`Runtime-backed ${activeResultTabLabel.toLowerCase()} payloads, diagnostics, and composition stay deferred from S5.`}
        tone="muted"
      >
        <EmptyStateCallout
          title={`${activeResultTabLabel} is still placeholder-only`}
          description={`This shared shell reserves the structural seam for future ${activeResultTabLabel.toLowerCase()} content without introducing execution state into the request builder feature.`}
        />
      </DetailViewerSection>
    </div>
  );
}
