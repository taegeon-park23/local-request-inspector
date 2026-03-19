import type { RequestTabRecord } from '@client/features/request-builder/request-tab.types';
import type { RequestDraftState } from '@client/features/request-builder/request-draft.types';
import { RequestKeyValueEditor } from '@client/features/request-builder/components/RequestKeyValueEditor';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';

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

  if (!activeTab) {
    return (
      <div className="request-work-surface request-work-surface--empty" data-testid="request-tab-empty-state">
        <h2>No request tab selected</h2>
        <p>
          S3 keeps `/workspace` route-light. Open a saved request from the explorer or create a new
          draft tab to start authoring request fields.
        </p>
        <button type="button" className="workspace-button" onClick={onCreateRequest}>
          Open Draft Tab
        </button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="request-work-surface request-work-surface--empty">
        <h2>Preparing request draft</h2>
        <p>Request draft state is being hydrated for the active workspace tab.</p>
      </div>
    );
  }

  const displayTitle = draft.name.trim() || 'Untitled Request';
  const locationSummary = draft.collectionName
    ? `${draft.collectionName}${draft.folderName ? ` / ${draft.folderName}` : ''}`
    : 'Unsaved draft';

  return (
    <div className="request-work-surface request-builder-core" data-testid="request-work-surface">
      <header className="request-work-surface__header request-builder-core__header">
        <div>
          <p className="section-placeholder__eyebrow">Request builder core</p>
          <h2>{displayTitle}</h2>
          <p>Request authoring state lives in this workspace tab and remains separate from observation surfaces.</p>
        </div>
        <div className="request-work-surface__badges">
          <span className="workspace-chip">{draft.method}</span>
          <span className="workspace-chip">{draft.collectionName ? 'Saved placeholder' : 'New draft'}</span>
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
          <p>{locationSummary}</p>
        </div>
        <div className="request-builder-core__command-area">
          <div className="request-work-surface__future-actions" aria-label="Request header actions">
            <button type="button" className="workspace-button workspace-button--secondary" disabled>
              Save
            </button>
            <button type="button" className="workspace-button workspace-button--secondary" disabled>
              Duplicate
            </button>
            <button type="button" className="workspace-button workspace-button--secondary" disabled>
              Run
            </button>
          </div>
          <p className="request-builder-core__command-copy">
            Save updates authored request definition. Run will stay separate from runtime observation wiring until a later slice.
          </p>
        </div>
      </div>

      <section className="workspace-surface-card request-editor-card request-editor-card--primary">
        <div className="request-editor-card__grid">
          <label className="request-field request-field--compact">
            <span>Request method</span>
            <select
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
            description="Edit query params as request authoring inputs. URL serialization remains a later concern."
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
            description="Edit request headers without introducing execution-time validation or transport coupling yet."
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
                <p>Choose a lightweight authoring mode. Monaco, binary uploads, and schema helpers stay out of S3.</p>
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
                description="Scaffold x-www-form-urlencoded request bodies as key/value rows."
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
                description="Scaffold multipart rows only. Real file attachment UX is explicitly deferred."
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
                <p>Keep auth authoring lightweight in S3. OAuth and environment resolution remain out of scope.</p>
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
          <section className="workspace-surface-card request-editor-card request-editor-card--scripts">
            <header className="request-editor-card__header">
              <div>
                <h3>Scripts</h3>
                <p>Script authoring remains a later slice. S3 only reserves the stage-aware authoring slot.</p>
              </div>
            </header>

            <div className="request-script-placeholder-grid">
              <article className="workspace-surface-card workspace-surface-card--muted">
                <h4>Pre-request</h4>
                <p>Later slice: stage-aware script editor for request preparation.</p>
              </article>
              <article className="workspace-surface-card workspace-surface-card--muted">
                <h4>Post-response</h4>
                <p>Later slice: response-bound script authoring stays separate from Response observation.</p>
              </article>
              <article className="workspace-surface-card workspace-surface-card--muted">
                <h4>Tests</h4>
                <p>Later slice: assertion authoring and diagnostics wiring.</p>
              </article>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
