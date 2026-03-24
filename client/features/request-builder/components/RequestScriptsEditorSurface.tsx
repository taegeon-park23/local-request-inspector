import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@client/app/providers/useI18n';
import type {
  RequestDraftState,
  RequestLinkedScriptBinding,
  RequestScriptStageId,
} from '@client/features/request-builder/request-draft.types';
import {
  getInlineRequestScriptStageSourceCode,
  getRequestScriptStageBinding,
} from '@client/features/request-builder/request-script-binding';
import {
  listWorkspaceScripts,
  workspaceScriptsQueryKey,
} from '@client/features/scripts/scripts.api';
import type { SavedScriptRecord } from '@client/features/scripts/scripts.types';
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

interface RequestScriptsEditorSurfaceProps {
  draft: RequestDraftState;
  onStageChange: (stage: RequestScriptStageId) => void;
  onContentChange: (stage: RequestScriptStageId, content: string) => void;
  copiedFromScriptNames: Partial<Record<RequestScriptStageId, string>>;
  onAttachSavedScript: (stage: RequestScriptStageId, scriptName: string, content: string) => void;
  onLinkSavedScript: (stage: RequestScriptStageId, script: SavedScriptRecord) => void;
  onDetachSavedScript: (stage: RequestScriptStageId, scriptName: string, content: string) => void;
}

interface LinkedStageResolution {
  status: 'healthy' | 'missing' | 'mismatched';
  savedScript: SavedScriptRecord | null;
}

function isScriptCompatibleWithStage(script: SavedScriptRecord, stage: RequestScriptStageId) {
  return script.scriptType === stage;
}

function resolveLinkedStage(
  binding: RequestLinkedScriptBinding,
  stage: RequestScriptStageId,
  savedScripts: SavedScriptRecord[],
): LinkedStageResolution {
  const savedScript = savedScripts.find((script) => script.id === binding.savedScriptId) ?? null;

  if (!savedScript) {
    return {
      status: 'missing',
      savedScript: null,
    };
  }

  if (!isScriptCompatibleWithStage(savedScript, stage)) {
    return {
      status: 'mismatched',
      savedScript,
    };
  }

  return {
    status: 'healthy',
    savedScript,
  };
}

export default function RequestScriptsEditorSurface({
  draft,
  onStageChange,
  onContentChange,
  copiedFromScriptNames,
  onAttachSavedScript,
  onLinkSavedScript,
  onDetachSavedScript,
}: RequestScriptsEditorSurfaceProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [selectedSavedScriptId, setSelectedSavedScriptId] = useState('');
  const savedScriptsQuery = useQuery({
    queryKey: workspaceScriptsQueryKey,
    queryFn: listWorkspaceScripts,
  });
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
  const activeStageBinding = getRequestScriptStageBinding(draft.scripts, activeStage);
  const activeStageContent = getInlineRequestScriptStageSourceCode(draft.scripts, activeStage);
  const savedScripts = savedScriptsQuery.data ?? [];
  const compatibleSavedScripts = savedScripts.filter((script) => isScriptCompatibleWithStage(script, activeStage));
  const selectedSavedScript = compatibleSavedScripts.find((script) => script.id === selectedSavedScriptId) ?? compatibleSavedScripts[0] ?? null;
  const selectedSavedScriptValue = selectedSavedScript?.id ?? '';
  const hasStageContent = activeStageBinding.mode === 'linked' || activeStageContent.trim().length > 0;
  const activeStageLabelId = `script-stage-${draft.tabId}-${activeStage}`;
  const activeStagePanelId = `script-stage-panel-${draft.tabId}-${activeStage}`;
  const copiedFromScriptName = activeStageBinding.mode === 'inline' ? copiedFromScriptNames[activeStage] : null;
  const linkedResolution = activeStageBinding.mode === 'linked'
    ? resolveLinkedStage(activeStageBinding, activeStage, savedScripts)
    : null;
  const linkedScriptName = activeStageBinding.mode === 'linked'
    ? ((linkedResolution?.savedScript?.name ?? activeStageBinding.savedScriptNameSnapshot) || activeStageBinding.savedScriptId)
    : '';
  const linkedSourcePreview = linkedResolution?.savedScript?.sourceCode ?? '';
  const canDetachToCopy = activeStageBinding.mode === 'linked' && linkedSourcePreview.length > 0;
  const linkedStatusTone = linkedResolution?.status === 'healthy' ? 'secondary' : 'replay';
  const linkedStatusCopy = linkedResolution?.status === 'missing'
    ? t('workspaceRoute.scriptsEditor.attach.linkedMissingSummary')
    : linkedResolution?.status === 'mismatched'
      ? t('workspaceRoute.scriptsEditor.attach.linkedMismatchSummary')
      : t('workspaceRoute.scriptsEditor.attach.linkedResolvedHint', { name: linkedScriptName });

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
          {activeStageBinding.mode === 'inline' ? (
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
          ) : (
            <article className="workspace-surface-card workspace-surface-card--muted request-script-library-card" aria-labelledby={activeStageLabelId}>
              <div className="request-script-library-card__header">
                <div>
                  <h4>{t('workspaceRoute.scriptsEditor.attach.linkedTitle')}</h4>
                  <p>{t('workspaceRoute.scriptsEditor.attach.linkedDescription')}</p>
                </div>
                <span className={`workspace-chip workspace-chip--${linkedStatusTone}`}>
                  {linkedResolution?.status === 'healthy'
                    ? t('workspaceRoute.scriptsEditor.attach.linkedBadge')
                    : t('workspaceRoute.scriptsEditor.attach.linkedBrokenBadge')}
                </span>
              </div>

              <div className="request-script-library-card__body">
                <p><strong>{t('workspaceRoute.scriptsEditor.attach.linkedNameLabel')}:</strong> {linkedScriptName}</p>
                <p className="shared-readiness-note">{linkedStatusCopy}</p>
                {activeStageBinding.savedScriptNameSnapshot.length > 0 && activeStageBinding.savedScriptNameSnapshot !== linkedScriptName ? (
                  <p className="shared-readiness-note">
                    {t('workspaceRoute.scriptsEditor.attach.linkedSnapshotHint', { name: activeStageBinding.savedScriptNameSnapshot })}
                  </p>
                ) : null}
                {linkedResolution?.savedScript ? (
                  <div className="request-script-example">
                    <span>{t('workspaceRoute.scriptsEditor.attach.linkedPreviewLabel')}</span>
                    <pre>{linkedSourcePreview}</pre>
                  </div>
                ) : null}
              </div>
            </article>
          )}

          <div className="request-script-editor__meta">
            <article className="request-script-library-card workspace-surface-card workspace-surface-card--muted">
              <div className="request-script-library-card__header">
                <div>
                  <h4>{t('workspaceRoute.scriptsEditor.attach.title')}</h4>
                  <p>{t('workspaceRoute.scriptsEditor.attach.description')}</p>
                </div>
                {copiedFromScriptName ? (
                  <span className="workspace-chip workspace-chip--secondary">
                    {t('workspaceRoute.scriptsEditor.attach.copiedBadge')}
                  </span>
                ) : null}
              </div>

              {savedScriptsQuery.isPending ? (
                <p className="shared-readiness-note">{t('workspaceRoute.scriptsEditor.attach.loading')}</p>
              ) : null}

              {savedScriptsQuery.isError ? (
                <p className="shared-readiness-note">{t('workspaceRoute.scriptsEditor.attach.degraded')}</p>
              ) : null}

              {!savedScriptsQuery.isPending && !savedScriptsQuery.isError && compatibleSavedScripts.length === 0 ? (
                <p className="shared-readiness-note">{t('workspaceRoute.scriptsEditor.attach.empty')}</p>
              ) : null}

              {!savedScriptsQuery.isPending && !savedScriptsQuery.isError && selectedSavedScript ? (
                <div className="request-script-library-card__body">
                  <label className="request-field request-field--compact">
                    <span>{t('workspaceRoute.scriptsEditor.attach.selectLabel')}</span>
                    <select
                      aria-label={t('workspaceRoute.scriptsEditor.attach.selectLabel')}
                      value={selectedSavedScriptValue}
                      onChange={(event) => setSelectedSavedScriptId(event.currentTarget.value)}
                    >
                      {compatibleSavedScripts.map((script) => (
                        <option key={script.id} value={script.id}>
                          {script.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="request-script-library-card__actions">
                    <button
                      type="button"
                      className="workspace-button workspace-button--secondary"
                      onClick={() => onAttachSavedScript(activeStage, selectedSavedScript.name, selectedSavedScript.sourceCode)}
                    >
                      {hasStageContent
                        ? t('workspaceRoute.scriptsEditor.attach.replaceAction')
                        : t('workspaceRoute.scriptsEditor.attach.copyAction')}
                    </button>
                    <button
                      type="button"
                      className="workspace-button workspace-button--secondary"
                      onClick={() => onLinkSavedScript(activeStage, selectedSavedScript)}
                    >
                      {activeStageBinding.mode === 'linked'
                        ? t('workspaceRoute.scriptsEditor.attach.relinkAction')
                        : t('workspaceRoute.scriptsEditor.attach.linkAction')}
                    </button>
                    {canDetachToCopy ? (
                      <button
                        type="button"
                        className="workspace-button workspace-button--ghost"
                        onClick={() => onDetachSavedScript(activeStage, linkedScriptName, linkedSourcePreview)}
                      >
                        {t('workspaceRoute.scriptsEditor.attach.detachAction')}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="workspace-button workspace-button--ghost"
                      onClick={() => {
                        const scriptId = activeStageBinding.mode === 'linked'
                          ? activeStageBinding.savedScriptId || selectedSavedScript.id
                          : selectedSavedScript.id;
                        const searchParams = new URLSearchParams({
                          from: 'request-stage',
                          stage: activeStage,
                          scriptId,
                        });
                        navigate(`/scripts?${searchParams.toString()}`);
                      }}
                    >
                      {t('workspaceRoute.scriptsEditor.attach.openLibraryAction')}
                    </button>
                  </div>
                  <p className="shared-readiness-note">{selectedSavedScript.description}</p>
                  <div className="request-script-example">
                    <span>{t('workspaceRoute.scriptsEditor.attach.previewLabel')}</span>
                    <pre>{selectedSavedScript.sourcePreview}</pre>
                  </div>
                </div>
              ) : null}

              {copiedFromScriptName ? (
                <p className="shared-readiness-note request-script-library-card__copied">
                  {t('workspaceRoute.scriptsEditor.attach.copiedHint', { name: copiedFromScriptName })}
                </p>
              ) : null}
            </article>

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


