import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useShellStore } from '@client/app/providers/shell-store';
import { readRuntimeStatus, runtimeStatusQueryKey } from '@client/features/settings/settings.api';
import { DetailViewerSection } from '@client/shared/ui/DetailViewerSection';
import { EmptyStateCallout } from '@client/shared/ui/EmptyStateCallout';
import { KeyValueMetaList } from '@client/shared/ui/KeyValueMetaList';
import { StatusBadge } from '@client/shared/ui/StatusBadge';
import { SectionHeading } from '@client/shared/ui/SectionHeading';
import { IconLabel } from '@client/shared/ui/IconLabel';

async function writeClipboardText(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(value);
  }
}

export function SettingsRoute() {
  const runtimeConnectionHealth = useShellStore((state) => state.runtimeConnectionHealth);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const runtimeStatusQuery = useQuery({ queryKey: runtimeStatusQueryKey, queryFn: readRuntimeStatus });
  const runtimeStatus = runtimeStatusQuery.data;

  return (
    <>
      <section className="shell-panel shell-panel--sidebar" aria-label="Section explorer">
        <div className="settings-surface">
          <header className="settings-surface__header">
            <div>
              <p className="section-placeholder__eyebrow">Diagnostics-first settings</p>
              <h2>Runtime status</h2>
              <p>Settings stays read-only in this MVP and acts as a diagnostics hub for shell availability, storage readiness, and local command guidance.</p>
            </div>
          </header>
          {runtimeStatusQuery.isPending ? <EmptyStateCallout title="Loading runtime diagnostics" description="Waiting for app-shell and storage readiness status from the server." /> : null}
          {runtimeStatusQuery.isError ? <EmptyStateCallout title="Diagnostics are degraded" description={runtimeStatusQuery.error instanceof Error ? runtimeStatusQuery.error.message : 'Runtime diagnostics could not be loaded cleanly.'} /> : null}
          {copiedMessage ? <p className="workspace-explorer__status workspace-explorer__status--info">{copiedMessage}</p> : null}
          {runtimeStatus ? <DetailViewerSection icon="connection" title="Connection health" description="Connection health still comes from the shell store so route diagnostics stay separate from runtime event transport state." className="workspace-surface-card"><div className="request-work-surface__badges"><StatusBadge kind="connection" value={runtimeConnectionHealth} /></div><KeyValueMetaList items={[{ label: 'Runtime connection', value: runtimeConnectionHealth }, { label: 'App shell route', value: runtimeStatus.appShell.appRoute }, { label: 'Storage ready', value: runtimeStatus.storage.ready ? 'Yes' : 'No' }]} /></DetailViewerSection> : null}
        </div>
      </section>
      <section className="shell-panel shell-panel--main" aria-label="Main work surface">
        <SectionHeading
          icon="settings"
          title="Settings"
          summary="Settings is intentionally read-only in this MVP. It surfaces diagnostics and route hints instead of introducing persisted preferences before ownership is clear."
        />
        {runtimeStatusQuery.isPending ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title="Loading settings diagnostics" description="Cards appear after app-shell and storage diagnostics return from the server." /></div> : runtimeStatusQuery.isError || !runtimeStatus ? <div className="request-work-surface request-work-surface--empty"><EmptyStateCallout title="Settings diagnostics are degraded" description={runtimeStatusQuery.error instanceof Error ? runtimeStatusQuery.error.message : 'Runtime diagnostics could not be loaded cleanly.'} /></div> : (
          <div className="settings-summary-grid">
            <DetailViewerSection icon="workspace" title="App shell availability" description="The built shell route and Vite authoring route remain explicitly visible here." className="workspace-surface-card"><KeyValueMetaList items={[{ label: 'Built shell available', value: runtimeStatus.appShell.builtClientAvailable ? 'Yes' : 'No' }, { label: 'Built shell route', value: runtimeStatus.appShell.appRoute }, { label: 'Dev client', value: runtimeStatus.appShell.devClientUrl }, { label: 'Note', value: runtimeStatus.appShell.note }]} /></DetailViewerSection>
            <DetailViewerSection icon="database" title="Storage readiness" description="Storage bootstrap remains separate from route-level preference persistence." className="workspace-surface-card"><KeyValueMetaList items={[{ label: 'Storage ready', value: runtimeStatus.storage.ready ? 'Ready' : 'Not ready' }, { label: 'Version manifest', value: runtimeStatus.storage.versionManifestAvailable ? 'Present' : 'Missing' }, { label: 'Resource manifest', value: runtimeStatus.storage.resourceManifestAvailable ? 'Present' : 'Missing' }, { label: 'Runtime database', value: runtimeStatus.storage.runtimeDbAvailable ? 'Present' : 'Missing' }]} /></DetailViewerSection>
            <DetailViewerSection icon="connection" title="Runtime connection health" description="This card combines server diagnostics with the live shell-store connection badge." className="workspace-surface-card"><div className="request-work-surface__badges"><StatusBadge kind="connection" value={runtimeConnectionHealth} /></div><KeyValueMetaList items={[{ label: 'Connection state', value: runtimeConnectionHealth }, { label: 'Serve command', value: runtimeStatus.appShell.serveCommand }, { label: 'Dev command', value: runtimeStatus.appShell.devCommand }]} /></DetailViewerSection>
            <DetailViewerSection icon="command" title="Local command catalog" description="Commands are visible here so local verification and bootstrap work can be handed off cleanly." className="workspace-surface-card"><ul className="settings-copy-list" aria-label="Settings commands list">{runtimeStatus.commands.map((command) => <li key={command.command} className="settings-copy-item"><div><strong>{command.label}</strong><p>{command.purpose}</p><code>{command.command}</code></div><button type="button" className="workspace-button workspace-button--secondary" onClick={async () => { try { await writeClipboardText(command.command); setCopiedMessage(`${command.label} copied.`); } catch { setCopiedMessage(`${command.label} is visible but clipboard access is unavailable in this environment.`); } }}><IconLabel icon="copy">Copy command</IconLabel></button></li>)}</ul></DetailViewerSection>
            <DetailViewerSection icon="paths" title="Data path and route hints" description="Paths and routes stay visible for diagnosis without turning settings into a mutation-heavy control panel." className="workspace-surface-card workspace-surface-card--muted"><ul className="settings-copy-list" aria-label="Settings route hints list">{runtimeStatus.routes.map((routeHint) => <li key={routeHint.path} className="settings-copy-item"><div><strong>{routeHint.label}</strong><p>{routeHint.note}</p><code>{routeHint.path}</code></div><button type="button" className="workspace-button workspace-button--secondary" onClick={async () => { try { await writeClipboardText(routeHint.path); setCopiedMessage(`${routeHint.label} copied.`); } catch { setCopiedMessage(`${routeHint.label} is visible but clipboard access is unavailable in this environment.`); } }}><IconLabel icon="copy">Copy path</IconLabel></button></li>)}</ul></DetailViewerSection>
          </div>
        )}
      </section>
      <aside className="shell-panel shell-panel--detail" aria-label="Contextual detail panel">
        <div className="workspace-detail-panel">
          {runtimeStatus ? <>
            <DetailViewerSection icon="database" title="Storage paths" description="These paths help operators confirm bootstrap state without adding mutation controls here." className="workspace-surface-card"><KeyValueMetaList items={[{ label: 'Data root', value: runtimeStatus.storage.rootDir }, { label: 'Version manifest', value: runtimeStatus.storage.versionManifestPath }, { label: 'Resource manifest', value: runtimeStatus.storage.resourceManifestPath }, { label: 'Runtime database', value: runtimeStatus.storage.runtimeDbPath }]} /></DetailViewerSection>
            <DetailViewerSection icon="info" title="Scope boundary" description="This route deliberately avoids persisted settings mutation until ownership and preference shape are clearer." className="workspace-surface-card workspace-surface-card--muted"><EmptyStateCallout title="Read-only by design" description="Use Environments for variable management and Scripts for standalone script management. Settings currently aggregates diagnostics, command guidance, and route hints only." /></DetailViewerSection>
          </> : <EmptyStateCallout title="No diagnostics loaded yet" description="Route and path notes appear once runtime diagnostics are available." />}
        </div>
      </aside>
    </>
  );
}
