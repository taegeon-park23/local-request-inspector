import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertContainsInOrder(source, fragments, message) {
  let lastIndex = -1;

  for (const fragment of fragments) {
    const nextIndex = source.indexOf(fragment, lastIndex + 1);
    assert.notEqual(nextIndex, -1, `${message}: missing "${fragment}"`);
    lastIndex = nextIndex;
  }
}

function extractSection(source, startMarker, endMarker) {
  const startIndex = source.indexOf(startMarker);
  assert.notEqual(startIndex, -1, `Missing section start: ${startMarker}`);

  const endIndex = endMarker ? source.indexOf(endMarker, startIndex + startMarker.length) : -1;
  return source.slice(startIndex, endIndex === -1 ? source.length : endIndex);
}

const requestWorkSurfaceSource = readRepoFile(
  'client/features/request-builder/components/RequestWorkSurface.tsx',
);

assertContainsInOrder(
  requestWorkSurfaceSource,
  [
    '<div className="request-work-surface__header-copy">',
    '<div className="request-builder-core__identity-support">',
    '<div className="request-builder-core__command-copy-group">',
    '<div className="request-builder-core__command-intro">',
    '<div className="request-builder-core__command-status-list">',
    'data-testid="save-command-status"',
    'data-testid="run-command-status"',
    '<div className="request-builder-core__command-support">',
  ],
  'Request work surface should keep the M3-F3 header/identity/command grouping in place',
);

const resultPanelSource = readRepoFile(
  'client/features/request-builder/components/RequestResultPanel.tsx',
);

assertContainsInOrder(
  resultPanelSource,
  [
    'function renderHeaderExecutionStatus(',
    '<div className="workspace-detail-panel__header-copy">',
    '<div className="workspace-detail-panel__header-meta request-work-surface__badges">',
    '{renderHeaderExecutionStatus(t, runStatus, execution)}',
  ],
  'Result panel header should keep the applied M3-F3 execution-status meta cluster',
);

const responseSection = extractSection(
  resultPanelSource,
  "      {activeResultTab === 'response' ? (",
  "      {activeResultTab === 'console' ? (",
);

assertContainsInOrder(
  responseSection,
  [
    '<div className="workspace-detail-panel__result-stack">',
    '<div className="workspace-detail-panel__result-summary">',
    '<div className="workspace-detail-panel__result-support">',
    'data-testid="request-response-preview"',
  ],
  'Response tab should keep the applied M3-F3 summary/support grouping',
);

const executionInfoSection = extractSection(
  resultPanelSource,
  "      {activeResultTab === 'execution-info' ? (",
  null,
);

assertContainsInOrder(
  executionInfoSection,
  [
    '<div className="workspace-detail-panel__result-stack">',
    '<div className="workspace-detail-panel__result-summary">',
    '<div className="workspace-detail-panel__result-support">',
    "aria-label={t('workspaceRoute.resultPanel.executionInfo.executionStageSummaryAriaLabel')}",
  ],
  'Execution info tab should keep the applied M3-F3 summary/support grouping',
);

const materialThemeSource = readRepoFile('client/app/shell/material-theme.css');

for (const className of [
  'request-work-surface__header-copy',
  'request-builder-core__identity-support',
  'request-builder-core__command-intro',
  'request-builder-core__command-status-list',
  'request-builder-core__command-support',
  'workspace-detail-panel__header-copy',
  'workspace-detail-panel__header-meta',
  'workspace-detail-panel__result-stack',
  'workspace-detail-panel__result-summary',
  'workspace-detail-panel__result-support',
]) {
  assert.match(
    materialThemeSource,
    new RegExp(`\\.${className}\\b`, 'u'),
    `material-theme.css should keep the applied M3-F3 selector ".${className}"`,
  );
}

