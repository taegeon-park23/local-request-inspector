import type {
  RequestDraftScriptsState,
  RequestDraftState,
  RequestScriptStageId,
} from '@client/features/request-builder/request-draft.types';
import type { AppIconName } from '@client/shared/ui/AppIcon';
import { IconLabel } from '@client/shared/ui/IconLabel';

interface ScriptStageDefinition {
  id: RequestScriptStageId;
  label: string;
  icon: AppIconName;
  eyebrow: string;
  title: string;
  description: string;
  helperItems: string[];
  exampleLabel: string;
  exampleSnippet: string;
}

const scriptStageDefinitions: ScriptStageDefinition[] = [
  {
    id: 'pre-request',
    label: 'Pre-request',
    icon: 'code',
    eyebrow: 'Before transport',
    title: 'Prepare request inputs',
    description: 'Use this stage for request-bound setup such as deriving headers, shaping body text, or preparing ad hoc values before send.',
    helperItems: [
      'Keep work scoped to request preparation rather than response inspection.',
      'Only bounded request mutation and explicit runtime helpers are available here. Broader capability expansion stays deferred.',
      'Replay source cues remain metadata only and do not become script globals in this slice.',
    ],
    exampleLabel: 'Typical use',
    exampleSnippet: "// prepare request context\nrequest.headers.set('x-trace-id', 'draft-local');",
  },
  {
    id: 'post-response',
    label: 'Post-response',
    icon: 'response',
    eyebrow: 'After transport',
    title: 'Summarize response handling intent',
    description: 'Use this stage for lightweight post-response diagnostics. Bounded console summaries and derived execution notes run after transport, while richer diagnostics stay deferred.',
    helperItems: [
      'Capture summary logic or redaction notes you want after a response arrives.',
      'Do not expect history or result-panel data to flow into this authoring state yet.',
      'Richer diagnostics and execution-linked console output remain deferred.',
    ],
    exampleLabel: 'Typical use',
    exampleSnippet: "// inspect response after transport\nif (response.status >= 400) {\n  console.warn('review response');\n}",
  },
  {
    id: 'tests',
    label: 'Tests',
    icon: 'tests',
    eyebrow: 'Assertions later',
    title: 'Plan request-bound assertions',
    description: 'Use this stage for assertion authoring. Bounded pass/fail summaries flow into the result panel and persisted history, while richer diagnostics remain deferred.',
    helperItems: [
      'Keep assertions request-bound instead of coupling them to history or capture detail panels.',
      'Reusable script templates and shared libraries remain deferred.',
      'Editor assistance, Monaco, and richer diagnostics will arrive in later slices.',
    ],
    exampleLabel: 'Typical use',
    exampleSnippet: "// assertion sketch\nassert(response.status === 200);",
  },
];

const scriptContentFieldMap: Record<RequestScriptStageId, keyof Omit<RequestDraftScriptsState, 'activeStage'>> = {
  'pre-request': 'preRequest',
  'post-response': 'postResponse',
  tests: 'tests',
};

function getStageDefinition(stage: RequestScriptStageId): ScriptStageDefinition {
  return scriptStageDefinitions.find((definition) => definition.id === stage) ?? scriptStageDefinitions[0]!;
}

function getStageContent(scripts: RequestDraftScriptsState, stage: RequestScriptStageId) {
  return scripts[scriptContentFieldMap[stage]];
}

interface RequestScriptsEditorSurfaceProps {
  draft: RequestDraftState;
  onStageChange: (stage: RequestScriptStageId) => void;
  onContentChange: (stage: RequestScriptStageId, content: string) => void;
}

export default function RequestScriptsEditorSurface({
  draft,
  onStageChange,
  onContentChange,
}: RequestScriptsEditorSurfaceProps) {
  const activeStage = draft.scripts.activeStage;
  const activeStageDefinition = getStageDefinition(activeStage);
  const activeStageContent = getStageContent(draft.scripts, activeStage);
  const activeStageLabelId = `script-stage-${draft.tabId}-${activeStage}`;
  const activeStagePanelId = `script-stage-panel-${draft.tabId}-${activeStage}`;

  return (
    <section className="workspace-surface-card request-editor-card request-editor-card--scripts" data-testid="script-editor-surface">
      <header className="request-editor-card__header">
        <div>
          <h3>Scripts</h3>
          <p>
            Scripts stays request-bound and draft-owned. This surface remains authoring-owned, while Run executes bounded stage-aware scripts and sends redacted summaries to observation panels and persisted history.
          </p>
        </div>
      </header>

      <div className="request-script-stage-tabs" role="tablist" aria-label="Script stages">
        {scriptStageDefinitions.map((stage) => {
          const isActive = stage.id === activeStage;

          return (
            <button
              key={stage.id}
              id={`script-stage-tab-${draft.tabId}-${stage.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`script-stage-panel-${draft.tabId}-${stage.id}`}
              className={isActive ? 'workspace-subtab workspace-subtab--active' : 'workspace-subtab'}
              onClick={() => onStageChange(stage.id)}
            >
              <span className="workspace-subtab__content"><IconLabel icon={stage.icon}>{stage.label}</IconLabel></span>
            </button>
          );
        })}
      </div>

      <div className="request-script-editor__layout">
        <article className="workspace-surface-card workspace-surface-card--muted request-script-stage-card">
          <p className="section-placeholder__eyebrow">{activeStageDefinition.eyebrow}</p>
          <h4 id={activeStageLabelId}>{activeStageDefinition.title}</h4>
          <p>{activeStageDefinition.description}</p>
          <ul className="request-script-helper-list" aria-label={`${activeStageDefinition.label} guidance`}>
            {activeStageDefinition.helperItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <section
          id={activeStagePanelId}
          role="tabpanel"
          aria-labelledby={`script-stage-tab-${draft.tabId}-${activeStage}`}
          className="workspace-surface-card request-script-editor"
        >
          <label className="request-field">
            <span>{activeStageDefinition.label} script</span>
            <textarea
              rows={14}
              placeholder={activeStageDefinition.exampleSnippet}
              value={activeStageContent}
              onChange={(event) => onContentChange(activeStage, event.currentTarget.value)}
            />
          </label>

          <div className="request-script-editor__meta">
            <p>
              This editor path is loaded on demand so the rest of the request builder stays responsive when Scripts is not active, even after stage execution wiring landed.
            </p>
            <div className="request-script-example">
              <span>{activeStageDefinition.exampleLabel}</span>
              <pre>{activeStageDefinition.exampleSnippet}</pre>
            </div>
          </div>
        </section>
      </div>

      <footer className="request-script-footer workspace-surface-card workspace-surface-card--muted">
        <h4>Deferred in later slices</h4>
        <p>
          Reusable script management, richer diagnostics, broader capability surfaces, and Monaco or intellisense expansion remain explicitly later-slice work.
        </p>
      </footer>
    </section>
  );
}






