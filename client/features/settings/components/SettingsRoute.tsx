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
import { SegmentedControl } from '@client/shared/ui/SegmentedControl';
import { localeStorageKey, type LocaleCode } from '@client/shared/i18n/messages';
import { RoutePanelTabsLayout } from '@client/features/route-panel-tabs-layout';
import { resolveApiErrorMessage } from '@client/shared/api-error-message';

async function writeClipboardText(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(value);
  }
}

export function SettingsRoute() {
  const runtimeConnectionHealth = useShellStore((state) => state.runtimeConnectionHealth);
  const navRailCollapsed = useShellStore((state) => state.navRailCollapsed);
  const floatingExplorerDefaultOpen = useShellStore((state) => state.floatingExplorerDefaultOpen);
  const shellDensityMode = useShellStore((state) => state.shellDensityMode);
  const setNavRailCollapsed = useShellStore((state) => state.setNavRailCollapsed);
  const setFloatingExplorerDefaultOpen = useShellStore((state) => state.setFloatingExplorerDefaultOpen);
  const setShellDensityMode = useShellStore((state) => state.setShellDensityMode);
  const { locale, locales, setLocale, t } = useI18n();
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const runtimeStatusQuery = useQuery({ queryKey: runtimeStatusQueryKey, queryFn: readRuntimeStatus });
  const runtimeStatus = runtimeStatusQuery.data;
  const secretStorage = runtimeStatus?.secretStorage;

  const describeLocale = (localeCode: LocaleCode) => (
    localeCode === 'ko' ? t('common.locales.ko') : t('common.locales.en')
  );
  const describeNavRailState = (collapsed: boolean) => (
    collapsed
      ? t('settings.cards.navigationRailPreference.values.collapsed')
      : t('settings.cards.navigationRailPreference.values.expanded')
  );
  const describeFloatingExplorerState = (open: boolean) => (
    open
      ? t('settings.cards.routeExplorerPreference.values.expanded')
      : t('settings.cards.routeExplorerPreference.values.collapsed')
  );
  const describeShellDensity = (mode: 'compact' | 'comfortable') => (
    mode === 'comfortable'
      ? t('settings.cards.shellDensityPreference.values.comfortable')
      : t('settings.cards.shellDensityPreference.values.compact')
  );
  const affectedRoutesLabel = [
    t('sections.workspace.label'),
    t('sections.captures.label'),
    t('sections.history.label'),
    t('sections.mocks.label'),
    t('sections.environments.label'),
    t('sections.scripts.label'),
  ].join(', ');
  const localeOptions = locales.map((localeOption) => ({
    value: localeOption,
    label: describeLocale(localeOption),
  }));
  const navRailOptions = [
    { value: 'expanded', label: t('settings.cards.navigationRailPreference.actions.expanded') },
    { value: 'collapsed', label: t('settings.cards.navigationRailPreference.actions.collapsed') },
  ] as const;
  const routeExplorerOptions = [
    { value: 'expanded', label: t('settings.cards.routeExplorerPreference.actions.expanded') },
    { value: 'collapsed', label: t('settings.cards.routeExplorerPreference.actions.collapsed') },
  ] as const;
  const shellDensityOptions = [
    { value: 'compact', label: t('settings.cards.shellDensityPreference.actions.compact') },
    { value: 'comfortable', label: t('settings.cards.shellDensityPreference.actions.comfortable') },
  ] as const;
  const copyValue = async (label: string, value: string) => {
    try {
      await writeClipboardText(value);
      setCopiedMessage(t('common.copy.copied', { label }));
    } catch {
      setCopiedMessage(t('common.copy.unavailable', { label }));
    }
  };

  return (
    <RoutePanelTabsLayout
      defaultActiveTab="main"
      explorer={(
        <section className="shell-panel shell-panel--sidebar" aria-label={t('shell.routePanels.explorerRegion')}>
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
                description={resolveApiErrorMessage(runtimeStatusQuery.error, t('settings.diagnosticsDegraded.fallbackDescription'), t)}
              />
            ) : null}
            {copiedMessage ? <p className="workspace-explorer__status workspace-explorer__status--info">{copiedMessage}</p> : null}
            {runtimeStatus ? (
              <DetailViewerSection
                icon="connection"
                title={t('settings.cards.connectionHealth.title')}
                description={t('settings.cards.connectionHealth.description')}
                className="workspace-surface-card"
                tone="supporting"
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
      )}
      main={(
        <section className="shell-panel shell-panel--main" aria-label={t('shell.routePanels.mainRegion')}>
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
                description={resolveApiErrorMessage(runtimeStatusQuery.error, t('settings.empty.settingsDiagnosticsDegraded.fallbackDescription'), t)}
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
              {secretStorage ? (
                <DetailViewerSection
                  icon="shield"
                  title={t('settings.cards.secretStoragePolicy.title')}
                  description={t('settings.cards.secretStoragePolicy.description')}
                  className="workspace-surface-card workspace-surface-card--muted"
                  tone="supporting"
                >
                  <KeyValueMetaList
                    items={[
                      { label: t('settings.cards.secretStoragePolicy.labels.secureBackend'), value: secretStorage.secureBackendAvailable ? t('common.values.yes') : t('common.values.no') },
                      { label: t('settings.cards.secretStoragePolicy.labels.backend'), value: secretStorage.backendLabel },
                      { label: t('settings.cards.secretStoragePolicy.labels.replacementWrites'), value: secretStorage.replacementWritePolicy },
                      { label: t('settings.cards.secretStoragePolicy.labels.runtimeResolution'), value: secretStorage.runtimeResolutionPolicy },
                      { label: t('settings.cards.secretStoragePolicy.labels.readModel'), value: secretStorage.readModelPolicy },
                      { label: t('settings.cards.secretStoragePolicy.labels.legacySanitizedRows'), value: secretStorage.sanitizedLegacySecretRowCount },
                    ]}
                  />
                  <div className="shared-support-block shared-support-block--notes">
                    <p className="shared-readiness-note">{secretStorage.note}</p>
                    <p className="shared-readiness-note">{secretStorage.legacySanitizationNote}</p>
                  </div>
                </DetailViewerSection>
              ) : null}
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
                <div className="shared-support-block shared-support-block--notes">
                  <p className="shared-readiness-note">{t('settings.cards.interfaceLanguage.helper')}</p>
                  <SegmentedControl
                    ariaLabel="Locale switcher"
                    value={locale}
                    options={localeOptions}
                    onChange={setLocale}
                  />
                </div>
              </DetailViewerSection>
              <DetailViewerSection
                icon="settings"
                title={t('settings.cards.navigationRailPreference.title')}
                description={t('settings.cards.navigationRailPreference.description')}
                className="workspace-surface-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('settings.cards.navigationRailPreference.labels.currentState'), value: describeNavRailState(navRailCollapsed) },
                    { label: t('settings.cards.navigationRailPreference.labels.persistence'), value: t('settings.cards.navigationRailPreference.values.persistence') },
                    { label: t('settings.cards.navigationRailPreference.labels.scope'), value: t('settings.cards.navigationRailPreference.values.scope') },
                  ]}
                />
                <div className="shared-support-block shared-support-block--notes">
                  <p className="shared-readiness-note">{t('settings.cards.navigationRailPreference.helper')}</p>
                  <SegmentedControl
                    ariaLabel={t('settings.cards.navigationRailPreference.actions.groupLabel')}
                    value={navRailCollapsed ? 'collapsed' : 'expanded'}
                    options={navRailOptions}
                    onChange={(value) => setNavRailCollapsed(value === 'collapsed')}
                  />
                </div>
              </DetailViewerSection>
              <DetailViewerSection
                icon="overview"
                title={t('settings.cards.routeExplorerPreference.title')}
                description={t('settings.cards.routeExplorerPreference.description')}
                className="workspace-surface-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('settings.cards.routeExplorerPreference.labels.currentState'), value: describeFloatingExplorerState(floatingExplorerDefaultOpen) },
                    { label: t('settings.cards.routeExplorerPreference.labels.affectedRoutes'), value: affectedRoutesLabel },
                    { label: t('settings.cards.routeExplorerPreference.labels.persistence'), value: t('settings.cards.routeExplorerPreference.values.persistence') },
                    { label: t('settings.cards.routeExplorerPreference.labels.scope'), value: t('settings.cards.routeExplorerPreference.values.scope') },
                  ]}
                />
                <div className="shared-support-block shared-support-block--notes">
                  <p className="shared-readiness-note">{t('settings.cards.routeExplorerPreference.helper')}</p>
                  <SegmentedControl
                    ariaLabel={t('settings.cards.routeExplorerPreference.actions.groupLabel')}
                    value={floatingExplorerDefaultOpen ? 'expanded' : 'collapsed'}
                    options={routeExplorerOptions}
                    onChange={(value) => setFloatingExplorerDefaultOpen(value === 'expanded')}
                  />
                </div>
              </DetailViewerSection>
              <DetailViewerSection
                icon="workspace"
                title={t('settings.cards.shellDensityPreference.title')}
                description={t('settings.cards.shellDensityPreference.description')}
                className="workspace-surface-card"
              >
                <KeyValueMetaList
                  items={[
                    { label: t('settings.cards.shellDensityPreference.labels.currentState'), value: describeShellDensity(shellDensityMode) },
                    { label: t('settings.cards.shellDensityPreference.labels.affectedSurfaces'), value: t('settings.cards.shellDensityPreference.values.affectedSurfaces') },
                    { label: t('settings.cards.shellDensityPreference.labels.persistence'), value: t('settings.cards.shellDensityPreference.values.persistence') },
                    { label: t('settings.cards.shellDensityPreference.labels.scope'), value: t('settings.cards.shellDensityPreference.values.scope') },
                  ]}
                />
                <div className="shared-support-block shared-support-block--notes">
                  <p className="shared-readiness-note">{t('settings.cards.shellDensityPreference.helper')}</p>
                  <SegmentedControl
                    ariaLabel={t('settings.cards.shellDensityPreference.actions.groupLabel')}
                    value={shellDensityMode}
                    options={shellDensityOptions}
                    onChange={setShellDensityMode}
                  />
                </div>
              </DetailViewerSection>
              <DetailViewerSection
                icon="command"
                title={t('settings.cards.localCommandCatalog.title')}
                description={t('settings.cards.localCommandCatalog.description')}
                className="workspace-surface-card"
                tone="supporting"
              >
                <ul className="settings-copy-list" aria-label="Settings commands list">
                  {runtimeStatus.commands.map((command) => (
                    <li key={command.command} className="settings-copy-item">
                      <div className="settings-copy-item__content">
                        <div>
                          <strong>{command.label}</strong>
                          <p>{command.purpose}</p>
                        </div>
                        <div className="shared-support-block shared-support-block--preview settings-copy-item__preview">
                          <code>{command.command}</code>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="workspace-button workspace-button--secondary"
                        onClick={() => void copyValue(command.label, command.command)}
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
                  tone="supporting"
                >
                  <ul className="settings-copy-list" aria-label="Settings route hints list">
                    {runtimeStatus.routes.map((routeHint) => (
                      <li key={routeHint.path} className="settings-copy-item">
                        <div className="settings-copy-item__content">
                          <div>
                            <strong>{routeHint.label}</strong>
                            <p>{routeHint.note}</p>
                          </div>
                          <div className="shared-support-block shared-support-block--preview settings-copy-item__preview">
                            <code>{routeHint.path}</code>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="workspace-button workspace-button--secondary"
                          onClick={() => void copyValue(routeHint.label, routeHint.path)}
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
      )}
      detail={(
        <aside className="shell-panel shell-panel--detail" aria-label={t('shell.routePanels.detailRegion')}>
          <div className="workspace-detail-panel">
            {runtimeStatus ? (
              <>
                <DetailViewerSection
                  icon="database"
                  title={t('settings.cards.storagePaths.title')}
                  description={t('settings.cards.storagePaths.description')}
                  className="workspace-surface-card"
                  tone="supporting"
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
                  tone="supporting"
                >
                  <EmptyStateCallout
                    title={t('settings.empty.readOnlyByDesign.title')}
                    description={t('settings.empty.readOnlyByDesign.description', {
                      environmentsLabel: t('sections.environments.label'),
                      scriptsLabel: t('sections.scripts.label'),
                    })}
                  />
                  <div className="shared-support-block shared-support-block--notes">
                    <p className="shared-readiness-note">{localeStorageKey}</p>
                  </div>
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
      )}
    />
  );
}
