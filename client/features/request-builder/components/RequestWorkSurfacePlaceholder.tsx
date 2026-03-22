import { Suspense, lazy } from 'react';
import { useRequestBuilderCommands } from '@client/features/request-builder/hooks/useRequestBuilderCommands';
import type { RequestDraftState } from '@client/features/request-builder/request-draft.types';
import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import { RequestKeyValueEditor } from '@client/features/request-builder/components/RequestKeyValueEditor';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';

const LazyRequestScriptsEditorSurface = lazy(async () => {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return import('@client/features/request-builder/components/RequestScriptsEditorSurface');
});

const requestEditorTabs: Array<{ id: RequestDraftState['activeEditorTab']; label: string }> = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'auth', label: 'Auth' },
  { id: 'scripts', label: 'Scripts' },
];

const httpMethodOptions: RequestDraftState['method'][] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const bodyModeOptions: Array<{ value: RequestDraftState['bodyMode']; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
  { value: 'form-urlencoded', label: 'x-www-form-urlencoded' },
  { value: 'multipart-form-data', label: 'multipart/form-data' },
];
const authTypeOptions: Array<{ value: RequestDraftState['auth']['type']; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer token' },
  { value: 'basic', label: 'Basic auth' },
  { value: 'api-key', label: 'API key' },
];

interface RequestWorkSurfacePlaceholderProps {
  activeTab: RequestTabRecord | null;
  onCreateRequest: () => void;
}

function formatSavedAt(savedAt: string | null) {
  if (!savedAt) {
    return 'Saved request definition is up to date.';
  }

  return `Saved request definition at ${new Date(savedAt).toLocaleTimeString()}.`;
}

export function RequestWorkSurfacePlaceholder({
  activeTab,
  onCreateRequest,
}: RequestWorkSurfacePlaceholderProps) {
  const draft = useRequestDraftStore((state) =>
    activeTab ? state.draftsByTabId[activeTab.id]?.draft ?? null : null,
  );
  const updateDraftName = useRequestDraftStore((state) => state.updateDraftName);
  const updateDraftMethod = useRequestDraftStore((state) => state.updateDraftMethod);
  const updateDraftUrl = useRequestDraftStore((state) => state.updateDraftUrl);
  const setActiveEditorTab = useRequestDraftStore((state) => state.setActiveEditorTab);
  const addRow = useRequestDraftStore((state) => state.addRow);
  const updateRow = useRequestDraftStore((state) => state.updateRow);
  const removeRow = useRequestDraftStore((state) => state.removeRow);
  const updateBodyMode = useRequestDraftStore((state) => state.updateBodyMode);
  const updateBodyText = useRequestDraftStore((state) => state.updateBodyText);
  const updateAuthType = useRequestDraftStore((state) => state.updateAuthType);
  const updateAuthField = useRequestDraftStore((state) => state.updateAuthField);
  const setActiveScriptStage = useRequestDraftStore((state) => state.setActiveScriptStage);
  const updateScriptContent = useRequestDraftStore((state) => state.updateScriptContent);
  const { saveStatus, runStatus, saveDisabledReason, runDisabledReason, handleSave, handleRun } = useRequestBuilderCommands(
    activeTab,
    draft,
  );

  if (!activeTab) {
    return (
      <div className="request-work-surface request-work-surface--empty" data-testid="request-tab-empty-state">
        <h2>No request tab selected</h2>
        <p>
          Open a saved request or create a draft to begin authoring. Response stays in the right-hand observation panel, while history, captures, and mocks remain separate observation or rule-management routes.
        </p>
        <button type="button" className="workspace-button" onClick={onCreateRequest}>
          Create Draft Request
        </button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="request-work-surface request-work-surface--empty">
        <h2>Preparing request draft</h2>
        <p>This tab is creating a fresh authoring context. Replay and other observation records are always copied into a new draft instead of being edited in place.</p>
      </div>
    );
  }

  const displayTitle = draft.name.trim() || 'Untitled Request';
  const replaySource = activeTab.source === 'replay' ? activeTab.replaySource ?? null : null;
  const locationSummary = replaySource
    ? replaySource.description
    : activeTab.source === 'saved'
      ? `${draft.collectionName}${draft.folderName ? ` / ${draft.folderName}` : ''}`
      : draft.collectionName
        ? `Default save placement: ${draft.collectionName}${draft.folderName ? ` / ${draft.folderName}` : ''}`
        : 'Unsaved draft';
  const saveStatusCopy = saveStatus.status === 'success'
    ? formatSavedAt(saveStatus.savedAt)
    : saveStatus.message ?? (saveDisabledReason ?? 'Save updates the request definition only.');
  const runStatusCopy = runStatus.message ?? (runDisabledReason ?? 'Run creates a separate observation record in the right-hand panel.');

  return (
    <div className="request-work-surface request-builder-core" data-testid="request-work-surface">
      <header className="request-work-surface__header request-builder-core__header">
        <div className="request-work-surface__header-copy">
          <p className="section-placeholder__eyebrow">Request builder core</p>
          <h2>{displayTitle}</h2>
          <p>This tab owns editable request state only. Save updates the request definition, while Run creates separate observation in the right-hand panel without mutating history or captures.</p>
        </div>
        <div className="request-work-surface__badges">
          <span className="workspace-chip">{draft.method}</span>
          {replaySource ? (
            <span className="workspace-chip workspace-chip--replay">{replaySource.label}</span>
          ) : (
            <span className="workspace-chip">{activeTab.source === 'saved' ? 'Saved request' : 'New draft'}</span>
          )}
          {draft.dirty ? <span className="workspace-chip workspace-chip--accent">Dirty</span> : null}
        </div>
      </header>

      <div className="request-work-surface__header-strip request-builder-core__header-strip">
        <div className="request-builder-core__identity">
          <label className="request-field">
            <span>Request name</span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => updateDraftName(draft.tabId, event.currentTarget.value)}
            />
          </label>
          <div className="request-builder-core__identity-support">
            <p className="request-builder-core__source-copy">{locationSummary}</p>
          </div>
        </div>
        <div className="request-builder-core__command-area">
          <div className="request-work-surface__future-actions" aria-label="Request header actions">
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={handleSave}
              disabled={Boolean(saveDisabledReason)}
            >
              {saveStatus.status === 'pending' ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="workspace-button workspace-button--secondary" disabled>
              Duplicate
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={handleRun}
              disabled={Boolean(runDisabledReason)}
            >
              {runStatus.status === 'pending' ? 'Running...' : 'Run'}
            </button>
          </div>
          <div className="request-builder-core__command-copy-group">
            <div className="request-builder-core__command-intro">
              <p className="request-builder-core__command-copy">
                {replaySource
                  ? 'Replay drafts still open in edit-first mode. Save creates or updates a request definition, while Run creates separate observation for this draft only.'
                  : 'Save updates the request definition. Run does not save automatically and does not clear unsaved authoring changes.'}
              </p>
            </div>
            <div className="request-builder-core__command-status-list">
              <p className="shared-readiness-note" data-testid="save-command-status">{saveStatusCopy}</p>
              <p className="shared-readiness-note" data-testid="run-command-status">{runStatusCopy}</p>
            </div>
            <div className="request-builder-core__command-support">
              <p className="shared-readiness-note">Duplicate stays deferred until saved-request copy semantics are added in a later slice.</p>
            </div>
          </div>
        </div>
      </div>

      <section className="workspace-surface-card request-editor-card request-editor-card--primary">
        <div className="request-editor-card__grid">
          <label className="request-field request-field--compact">
            <span>Request method</span>
            <select
              aria-label="Request method"
              value={draft.method}
              onChange={(event) => updateDraftMethod(draft.tabId, event.currentTarget.value as RequestDraftState['method'])}
            >
              {httpMethodOptions.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label className="request-field request-field--wide">
            <span>Request URL</span>
            <input
              aria-label="Request URL"
              placeholder="https://api.example.com/resource"
              type="text"
              value={draft.url}
              onChange={(event) => updateDraftUrl(draft.tabId, event.currentTarget.value)}
            />
          </label>
        </div>
      </section>

      <div className="request-work-surface__editor-tabs" aria-label="Editor surface tabs">
        {requestEditorTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={draft.activeEditorTab === tab.id ? 'workspace-subtab workspace-subtab--active' : 'workspace-subtab'}
            aria-pressed={draft.activeEditorTab === tab.id}
            onClick={() => setActiveEditorTab(draft.tabId, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="request-work-surface__body request-work-surface__body--single">
        {draft.activeEditorTab === 'params' ? (
          <RequestKeyValueEditor
            addButtonLabel="Add param"
            description="Edit query params as request authoring inputs. Run applies only enabled rows, and save persists the authored definition as-is."
            emptyCopy="No params yet. Add rows only if this request needs query input."
            rowLabel="Param"
            rows={draft.params}
            title="Params"
            onAddRow={() => addRow(draft.tabId, 'params')}
            onRemoveRow={(rowId) => removeRow(draft.tabId, 'params', rowId)}
            onUpdateRow={(rowId, field, value) => updateRow(draft.tabId, 'params', rowId, field, value)}
          />
        ) : null}

        {draft.activeEditorTab === 'headers' ? (
          <RequestKeyValueEditor
            addButtonLabel="Add header"
            description="Edit request headers without coupling them to runtime history or captures. Save persists them, and Run applies enabled rows only to this execution."
            emptyCopy="No headers yet. Add rows when this request needs explicit header values."
            rowLabel="Header"
            rows={draft.headers}
            title="Headers"
            onAddRow={() => addRow(draft.tabId, 'headers')}
            onRemoveRow={(rowId) => removeRow(draft.tabId, 'headers', rowId)}
            onUpdateRow={(rowId, field, value) => updateRow(draft.tabId, 'headers', rowId, field, value)}
          />
        ) : null}

        {draft.activeEditorTab === 'body' ? (
          <section className="workspace-surface-card request-editor-card">
            <header className="request-editor-card__header">
              <div>
                <h3>Body</h3>
                <p>Choose a lightweight authoring mode. Save persists body inputs, while Run sends the current authored body without pulling observation state back into the draft.</p>
              </div>
            </header>

            <label className="request-field request-field--compact">
              <span>Body mode</span>
              <select
                value={draft.bodyMode}
                onChange={(event) => updateBodyMode(draft.tabId, event.currentTarget.value as RequestDraftState['bodyMode'])}
              >
                {bodyModeOptions.map((bodyMode) => (
                  <option key={bodyMode.value} value={bodyMode.value}>
                    {bodyMode.label}
                  </option>
                ))}
              </select>
            </label>

            {draft.bodyMode === 'none' ? (
              <p className="request-editor-card__empty">No body content is attached to this request draft.</p>
            ) : null}

            {draft.bodyMode === 'json' || draft.bodyMode === 'text' ? (
              <label className="request-field">
                <span>{draft.bodyMode === 'json' ? 'Body content (JSON)' : 'Body content (Text)'}</span>
                <textarea
                  rows={10}
                  value={draft.bodyText}
                  onChange={(event) => updateBodyText(draft.tabId, event.currentTarget.value)}
                />
              </label>
            ) : null}

            {draft.bodyMode === 'form-urlencoded' ? (
              <RequestKeyValueEditor
                addButtonLabel="Add form field"
                description="Scaffold x-www-form-urlencoded request bodies as key/value rows. Save persists them, and Run encodes only enabled rows."
                emptyCopy="No form fields yet. Add rows to prepare encoded body inputs."
                rowLabel="Form field"
                rows={draft.formBody}
                title="Form body"
                onAddRow={() => addRow(draft.tabId, 'formBody')}
                onRemoveRow={(rowId) => removeRow(draft.tabId, 'formBody', rowId)}
                onUpdateRow={(rowId, field, value) => updateRow(draft.tabId, 'formBody', rowId, field, value)}
              />
            ) : null}

            {draft.bodyMode === 'multipart-form-data' ? (
              <RequestKeyValueEditor
                addButtonLabel="Add multipart field"
                description="Scaffold multipart rows only. Real file attachment UX is still deferred, but enabled rows are already preserved in the saved definition."
                emptyCopy="No multipart rows yet. Add basic fields or file placeholders for later implementation."
                rowLabel="Multipart field"
                rows={draft.multipartBody}
                title="Multipart body"
                onAddRow={() => addRow(draft.tabId, 'multipartBody')}
                onRemoveRow={(rowId) => removeRow(draft.tabId, 'multipartBody', rowId)}
                onUpdateRow={(rowId, field, value) => updateRow(draft.tabId, 'multipartBody', rowId, field, value)}
              />
            ) : null}
          </section>
        ) : null}

        {draft.activeEditorTab === 'auth' ? (
          <section className="workspace-surface-card request-editor-card">
            <header className="request-editor-card__header">
              <div>
                <h3>Auth</h3>
                <p>Auth stays lightweight here. Save persists authored auth fields, while Run applies them for this request only without reusing history or capture observation state.</p>
              </div>
            </header>

            <label className="request-field request-field--compact">
              <span>Auth type</span>
              <select
                value={draft.auth.type}
                onChange={(event) => updateAuthType(draft.tabId, event.currentTarget.value as RequestDraftState['auth']['type'])}
              >
                {authTypeOptions.map((authType) => (
                  <option key={authType.value} value={authType.value}>
                    {authType.label}
                  </option>
                ))}
              </select>
            </label>

            {draft.auth.type === 'none' ? (
              <p className="request-editor-card__empty">No auth is attached to this request draft.</p>
            ) : null}

            {draft.auth.type === 'bearer' ? (
              <label className="request-field">
                <span>Bearer token</span>
                <input
                  type="text"
                  value={draft.auth.bearerToken}
                  onChange={(event) => updateAuthField(draft.tabId, 'bearerToken', event.currentTarget.value)}
                />
              </label>
            ) : null}

            {draft.auth.type === 'basic' ? (
              <div className="request-editor-card__grid">
                <label className="request-field">
                  <span>Username</span>
                  <input
                    type="text"
                    value={draft.auth.basicUsername}
                    onChange={(event) => updateAuthField(draft.tabId, 'basicUsername', event.currentTarget.value)}
                  />
                </label>
                <label className="request-field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={draft.auth.basicPassword}
                    onChange={(event) => updateAuthField(draft.tabId, 'basicPassword', event.currentTarget.value)}
                  />
                </label>
              </div>
            ) : null}

            {draft.auth.type === 'api-key' ? (
              <div className="request-editor-card__grid">
                <label className="request-field">
                  <span>API key name</span>
                  <input
                    type="text"
                    value={draft.auth.apiKeyName}
                    onChange={(event) => updateAuthField(draft.tabId, 'apiKeyName', event.currentTarget.value)}
                  />
                </label>
                <label className="request-field">
                  <span>API key value</span>
                  <input
                    type="text"
                    value={draft.auth.apiKeyValue}
                    onChange={(event) => updateAuthField(draft.tabId, 'apiKeyValue', event.currentTarget.value)}
                  />
                </label>
                <label className="request-field request-field--compact">
                  <span>API key placement</span>
                  <select
                    value={draft.auth.apiKeyPlacement}
                    onChange={(event) => updateAuthField(draft.tabId, 'apiKeyPlacement', event.currentTarget.value)}
                  >
                    <option value="header">Header</option>
                    <option value="query">Query</option>
                  </select>
                </label>
              </div>
            ) : null}
          </section>
        ) : null}

        {draft.activeEditorTab === 'scripts' ? (
          <Suspense
            fallback={
              <section className="workspace-surface-card request-editor-card request-editor-card--scripts request-script-loading" data-testid="script-editor-loading">
                <header className="request-editor-card__header">
                  <div>
                    <h3>Scripts</h3>
                    <p>
                      Loading the stage-aware script editor on demand so Params, Headers, Body, and Auth stay responsive while the heavier authoring path initializes.
                    </p>
                  </div>
                </header>
                <div className="request-script-loading__body">
                  <article className="workspace-surface-card workspace-surface-card--muted">
                    <h4>Lazy editor path</h4>
                    <p>
                      This fallback explains the wait: the script editor bundle is loaded only when Scripts is active. Advanced editor assistance remains deferred even though bounded script execution already writes observation summaries elsewhere.
                    </p>
                  </article>
                </div>
              </section>
            }
          >
            <LazyRequestScriptsEditorSurface
              draft={draft}
              onStageChange={(stage) => setActiveScriptStage(draft.tabId, stage)}
              onContentChange={(stage, content) => updateScriptContent(draft.tabId, stage, content)}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
