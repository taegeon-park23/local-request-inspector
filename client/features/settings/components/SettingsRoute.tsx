import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import { useShellStore } from '@client/app/providers/shell-store';
import { readRuntimeStatus, runtimeStatusQueryKey } from '@client/features/settings/settings.api';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { StatusBadge } from '@client/shared/ui/StatusBadge';
import { SectionHeading } from '@client/shared/ui/SectionHeading';
import { IconLabel } from '@client/shared/ui/IconLabel';
import { localeStorageKey, type LocaleCode } from '@client/shared/i18n/messages';

async function writeClipboardText(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(value);
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function SettingsRoute() {
  const runtimeConnectionHealth = useShellStore((state) => state.runtimeConnectionHealth);
  const { locale, locales, setLocale, t } = useI18n();
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const runtimeStatusQuery = useQuery({ queryKey: runtimeStatusQueryKey, queryFn: readRuntimeStatus });
  const runtimeStatus = runtimeStatusQuery.data;

  const describeLocale = (localeCode: LocaleCode) => (
    localeCode === 'ko' ? t('common.locales.ko') : t('common.locales.en')
  );

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <div className="settings-surface">
          <header className="settings-surface__header">
            <div>
              <p className="section-placeholder__eyebrow">{t('settings.sidebar.eyebrow')}</p>
              <h2>{t('settings.sidebar.title')}</h2>
              <p>{t('settings.sidebar.summary')}</p>
            </div>
          </header>
          {runtimeStatusQuery.isPending ? (
            <EmptyStateCallout
              title={t('settings.loadingRuntimeDiagnostics.title')}
              description={t('settings.loadingRuntimeDiagnostics.description')}
            />
          ) : null}
          {runtimeStatusQuery.isError ? (
            <EmptyStateCallout
              title={t('settings.diagnosticsDegraded.title')}
              description={getErrorMessage(runtimeStatusQuery.error, t('settings.diagnosticsDegraded.fallbackDescription'))}
            />
          ) : null}
          {copiedMessage ? <p className="workspace-explorer__status workspace-explorer__status--info">{copiedMessage}</p> : null}
          {runtimeStatus ? (
            <DetailViewerSection
              icon="connection"
              title={t('settings.cards.connectionHealth.title')}
              description={t('settings.cards.connectionHealth.description')}
              className="workspace-surface-card"
            >
              <div className="request-work-surface__badges">
                <StatusBadge kind="connection" value={runtimeConnectionHealth} />
              </div>
              <KeyValueMetaList
                items={[
                  { label: t('settings.cards.connectionHealth.labels.runtimeConnection'), value: runtimeConnectionHealth },
                  { label: t('settings.cards.connectionHealth.labels.appShellRoute'), value: runtimeStatus.appShell.appRoute },
                  { label: t('settings.cards.connectionHealth.labels.storageReady'), value: runtimeStatus.storage.ready ? t('common.values.yes') : t('common.values.no') },
                ]}
              />
            </DetailViewerSection>
          ) : null}
        </div>
      </section>
      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <SectionHeading
          icon="settings"
          title={t('routes.settings.title')}
          summary={t('routes.settings.summary')}
        />
        {runtimeStatusQuery.isPending ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title={t('settings.empty.loadingSettingsDiagnostics.title')}
              description={t('settings.empty.loadingSettingsDiagnostics.description')}
            />
          </div>
        ) : runtimeStatusQuery.isError || !runtimeStatus ? (
          <div className="request-work-surface request-work-surface--empty">
            <EmptyStateCallout
              title={t('settings.empty.settingsDiagnosticsDegraded.title')}
              description={getErrorMessage(runtimeStatusQuery.error, t('settings.empty.settingsDiagnosticsDegraded.fallbackDescription'))}
            />
          </div>
        ) : (
          <div className="settings-summary-grid">
            <DetailViewerSection
              icon="workspace"
              title={t('settings.cards.appShellAvailability.title')}
              description={t('settings.cards.appShellAvailability.description')}
              className="workspace-surface-card"
            >
              <KeyValueMetaList
                items={[
                  { label: t('settings.cards.appShellAvailability.labels.builtShellAvailable'), value: runtimeStatus.appShell.builtClientAvailable ? t('common.values.yes') : t('common.values.no') },
                  { label: t('settings.cards.appShellAvailability.labels.builtShellRoute'), value: runtimeStatus.appShell.appRoute },
                  { label: t('settings.cards.appShellAvailability.labels.devClient'), value: runtimeStatus.appShell.devClientUrl },
                  { label: t('settings.cards.appShellAvailability.labels.note'), value: runtimeStatus.appShell.note },
                ]}
              />
            </DetailViewerSection>
            <DetailViewerSection
              icon="database"
              title={t('settings.cards.storageReadiness.title')}
              description={t('settings.cards.storageReadiness.description')}
              className="workspace-surface-card"
            >
              <KeyValueMetaList
                items={[
                  { label: t('settings.cards.storageReadiness.labels.storageReady'), value: runtimeStatus.storage.ready ? t('common.values.ready') : t('common.values.notReady') },
                  { label: t('settings.cards.storageReadiness.labels.versionManifest'), value: runtimeStatus.storage.versionManifestAvailable ? t('common.values.present') : t('common.values.missing') },
                  { label: t('settings.cards.storageReadiness.labels.resourceManifest'), value: runtimeStatus.storage.resourceManifestAvailable ? t('common.values.present') : t('common.values.missing') },
                  { label: t('settings.cards.storageReadiness.labels.runtimeDatabase'), value: runtimeStatus.storage.runtimeDbAvailable ? t('common.values.present') : t('common.values.missing') },
                ]}
              />
            </DetailViewerSection>
            <DetailViewerSection
              icon="connection"
              title={t('settings.cards.runtimeConnectionHealth.title')}
              description={t('settings.cards.runtimeConnectionHealth.description')}
              className="workspace-surface-card"
            >
              <div className="request-work-surface__badges">
                <StatusBadge kind="connection" value={runtimeConnectionHealth} />
              </div>
              <KeyValueMetaList
                items={[
                  { label: t('settings.cards.runtimeConnectionHealth.labels.connectionState'), value: runtimeConnectionHealth },
                  { label: t('settings.cards.runtimeConnectionHealth.labels.serveCommand'), value: runtimeStatus.appShell.serveCommand },
                  { label: t('settings.cards.runtimeConnectionHealth.labels.devCommand'), value: runtimeStatus.appShell.devCommand },
                ]}
              />
            </DetailViewerSection>
            <DetailViewerSection
              icon="summary"
              title={t('settings.cards.interfaceLanguage.title')}
              description={t('settings.cards.interfaceLanguage.description')}
              className="workspace-surface-card"
            >
              <KeyValueMetaList
                items={[
                  { label: t('settings.cards.interfaceLanguage.labels.currentLocale'), value: describeLocale(locale) },
                  { label: t('settings.cards.interfaceLanguage.labels.fallbackLocale'), value: describeLocale('en') },
                  { label: t('settings.cards.interfaceLanguage.labels.persistence'), value: t('settings.cards.interfaceLanguage.values.persistence') },
                  { label: t('settings.cards.interfaceLanguage.labels.coverage'), value: t('settings.cards.interfaceLanguage.values.coverage') },
                ]}
              />
              <p className="shared-readiness-note">{t('settings.cards.interfaceLanguage.helper')}</p>
              <div className="request-work-surface__future-actions" role="group" aria-label="Locale switcher">
                {locales.map((localeOption) => (
                  <button
                    key={localeOption}
                    type="button"
                    className={localeOption === locale ? 'workspace-button workspace-button--secondary' : 'workspace-button workspace-button--ghost'}
                    aria-pressed={localeOption === locale}
                    onClick={() => setLocale(localeOption)}
                  >
                    {describeLocale(localeOption)}
                  </button>
                ))}
              </div>
            </DetailViewerSection>
            <DetailViewerSection
              icon="command"
              title={t('settings.cards.localCommandCatalog.title')}
              description={t('settings.cards.localCommandCatalog.description')}
              className="workspace-surface-card"
            >
              <ul className="settings-copy-list" aria-label="Settings commands list">
                {runtimeStatus.commands.map((command) => (
                  <li key={command.command} className="settings-copy-item">
                    <div>
                      <strong>{command.label}</strong>
                      <p>{command.purpose}</p>
                      <code>{command.command}</code>
                    </div>
                    <button
                      type="button"
                      className="workspace-button workspace-button--secondary"
                      onClick={async () => {
                        try {
                          await writeClipboardText(command.command);
                          setCopiedMessage(t('common.copy.copied', { label: command.label }));
                        } catch {
                          setCopiedMessage(t('common.copy.unavailable', { label: command.label }));
                        }
                      }}
                    >
                      <IconLabel icon="copy">{t('settings.cards.localCommandCatalog.copyAction')}</IconLabel>
                    </button>
                  </li>
                ))}
              </ul>
            </DetailViewerSection>
            <DetailViewerSection
              icon="paths"
              title={t('settings.cards.dataPathAndRouteHints.title')}
              description={t('settings.cards.dataPathAndRouteHints.description')}
              className="workspace-surface-card workspace-surface-card--muted"
            >
              <ul className="settings-copy-list" aria-label="Settings route hints list">
                {runtimeStatus.routes.map((routeHint) => (
                  <li key={routeHint.path} className="settings-copy-item">
                    <div>
                      <strong>{routeHint.label}</strong>
                      <p>{routeHint.note}</p>
                      <code>{routeHint.path}</code>
                    </div>
                    <button
                      type="button"
                      className="workspace-button workspace-button--secondary"
                      onClick={async () => {
                        try {
                          await writeClipboardText(routeHint.path);
                          setCopiedMessage(t('common.copy.copied', { label: routeHint.label }));
                        } catch {
                          setCopiedMessage(t('common.copy.unavailable', { label: routeHint.label }));
                        }
                      }}
                    >
                      <IconLabel icon="copy">{t('settings.cards.dataPathAndRouteHints.copyAction')}</IconLabel>
                    </button>
                  </li>
                ))}
              </ul>
            </DetailViewerSection>
          </div>
        )}
      </section>
      <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
        <div className="workspace-detail-panel">
          {runtimeStatus ? (
            <>
              <DetailViewerSection
                icon="database"
                title={t('settings.cards.storagePaths.title')}
                description={t('settings.cards.storagePaths.description')}
                className="workspace-surface-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('settings.cards.storagePaths.labels.dataRoot'), value: runtimeStatus.storage.rootDir },
                    { label: t('settings.cards.storagePaths.labels.versionManifest'), value: runtimeStatus.storage.versionManifestPath },
                    { label: t('settings.cards.storagePaths.labels.resourceManifest'), value: runtimeStatus.storage.resourceManifestPath },
                    { label: t('settings.cards.storagePaths.labels.runtimeDatabase'), value: runtimeStatus.storage.runtimeDbPath },
                  ]}
                />
              </DetailViewerSection>
              <DetailViewerSection
                icon="info"
                title={t('settings.cards.scopeBoundary.title')}
                description={t('settings.cards.scopeBoundary.description')}
                className="workspace-surface-card workspace-surface-card--muted"
              >
                <EmptyStateCallout
                  title={t('settings.empty.readOnlyByDesign.title')}
                  description={t('settings.empty.readOnlyByDesign.description', {
                    environmentsLabel: t('sections.environments.label'),
                    scriptsLabel: t('sections.scripts.label'),
                  })}
                />
                <p className="shared-readiness-note">{localeStorageKey}</p>
              </DetailViewerSection>
            </>
          ) : (
            <EmptyStateCallout
              title={t('settings.empty.noDiagnosticsLoadedYet.title')}
              description={t('settings.empty.noDiagnosticsLoadedYet.description')}
            />
          )}
        </div>
      </aside>
    </>
  );
}
