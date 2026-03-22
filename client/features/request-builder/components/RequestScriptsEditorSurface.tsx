import { useI18n } from '@client/app/providers/useI18n';
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
  ariaLabel: string;
  fieldAriaLabel: string;
  icon: AppIconName;
  eyebrow: string;
  title: string;
  description: string;
  helperItems: string[];
  exampleLabel: string;
  exampleSnippet: string;
}

const scriptContentFieldMap: Record<RequestScriptStageId, keyof Omit<RequestDraftScriptsState, 'activeStage'>> = {
  'pre-request': 'preRequest',
  'post-response': 'postResponse',
  tests: 'tests',
};

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
  const { t } = useI18n();
  const scriptStageDefinitions: ScriptStageDefinition[] = [
    {
      id: 'pre-request',
      label: t('workspaceRoute.scriptsEditor.stages.preRequest.label'),
      ariaLabel: 'Pre-request',
      fieldAriaLabel: 'Pre-request script',
      icon: 'code',
      eyebrow: t('workspaceRoute.scriptsEditor.stages.preRequest.eyebrow'),
      title: t('workspaceRoute.scriptsEditor.stages.preRequest.title'),
      description: t('workspaceRoute.scriptsEditor.stages.preRequest.description'),
      helperItems: [
        t('workspaceRoute.scriptsEditor.stages.preRequest.helperFirst'),
        t('workspaceRoute.scriptsEditor.stages.preRequest.helperSecond'),
        t('workspaceRoute.scriptsEditor.stages.preRequest.helperThird'),
      ],
      exampleLabel: t('workspaceRoute.scriptsEditor.stages.preRequest.exampleLabel'),
      exampleSnippet: "// prepare request context\nrequest.headers.set('x-trace-id', 'draft-local');",
    },
    {
      id: 'post-response',
      label: t('workspaceRoute.scriptsEditor.stages.postResponse.label'),
      ariaLabel: 'Post-response',
      fieldAriaLabel: 'Post-response script',
      icon: 'response',
      eyebrow: t('workspaceRoute.scriptsEditor.stages.postResponse.eyebrow'),
      title: t('workspaceRoute.scriptsEditor.stages.postResponse.title'),
      description: t('workspaceRoute.scriptsEditor.stages.postResponse.description'),
      helperItems: [
        t('workspaceRoute.scriptsEditor.stages.postResponse.helperFirst'),
        t('workspaceRoute.scriptsEditor.stages.postResponse.helperSecond'),
        t('workspaceRoute.scriptsEditor.stages.postResponse.helperThird'),
      ],
      exampleLabel: t('workspaceRoute.scriptsEditor.stages.postResponse.exampleLabel'),
      exampleSnippet: "// inspect response after transport\nif (response.status >= 400) {\n  console.warn('review response');\n}",
    },
    {
      id: 'tests',
      label: t('workspaceRoute.scriptsEditor.stages.tests.label'),
      ariaLabel: 'Tests',
      fieldAriaLabel: 'Tests script',
      icon: 'tests',
      eyebrow: t('workspaceRoute.scriptsEditor.stages.tests.eyebrow'),
      title: t('workspaceRoute.scriptsEditor.stages.tests.title'),
      description: t('workspaceRoute.scriptsEditor.stages.tests.description'),
      helperItems: [
        t('workspaceRoute.scriptsEditor.stages.tests.helperFirst'),
        t('workspaceRoute.scriptsEditor.stages.tests.helperSecond'),
        t('workspaceRoute.scriptsEditor.stages.tests.helperThird'),
      ],
      exampleLabel: t('workspaceRoute.scriptsEditor.stages.tests.exampleLabel'),
      exampleSnippet: "// assertion sketch\nassert(response.status === 200);",
    },
  ];

  const activeStage = draft.scripts.activeStage;
  const activeStageDefinition = scriptStageDefinitions.find((definition) => definition.id === activeStage) ?? scriptStageDefinitions[0]!;
  const activeStageContent = getStageContent(draft.scripts, activeStage);
  const activeStageLabelId = `script-stage-${draft.tabId}-${activeStage}`;
  const activeStagePanelId = `script-stage-panel-${draft.tabId}-${activeStage}`;

  return (
    <section className="workspace-surface-card request-editor-card request-editor-card--scripts" data-testid="script-editor-surface">
      <header className="request-editor-card__header">
        <div>
          <h3>{t('workspaceRoute.scriptsEditor.header.title')}</h3>
          <p>{t('workspaceRoute.scriptsEditor.header.description')}</p>
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
              aria-label={stage.ariaLabel}
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
          <ul className="request-script-helper-list" aria-label={`${activeStageDefinition.ariaLabel} guidance`}>
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
            <span>{activeStageDefinition.label}</span>
            <textarea
              aria-label={activeStageDefinition.fieldAriaLabel}
              rows={14}
              placeholder={activeStageDefinition.exampleSnippet}
              value={activeStageContent}
              onChange={(event) => onContentChange(activeStage, event.currentTarget.value)}
            />
          </label>

          <div className="request-script-editor__meta">
            <p>{t('workspaceRoute.scriptsEditor.guidance.loadedOnDemand')}</p>
            <div className="request-script-example">
              <span>{activeStageDefinition.exampleLabel}</span>
              <pre>{activeStageDefinition.exampleSnippet}</pre>
            </div>
          </div>
        </section>
      </div>

      <footer className="request-script-footer workspace-surface-card workspace-surface-card--muted">
        <h4>{t('workspaceRoute.scriptsEditor.footer.title')}</h4>
        <p>{t('workspaceRoute.scriptsEditor.footer.description')}</p>
      </footer>
    </section>
  );
}

