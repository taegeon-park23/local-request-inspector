import { Navigate, Route, Routes } from 'react-router-dom';
import { appSections } from '@client/app/router/sections';
import { AppShell } from '@client/app/shell/AppShell';
import { CapturesPlaceholder } from '@client/features/captures/components/CapturesPlaceholder';
import { EnvironmentsPlaceholder } from '@client/features/environments/components/EnvironmentsPlaceholder';
import { HistoryPlaceholder } from '@client/features/history/components/HistoryPlaceholder';
import { MocksPlaceholder } from '@client/features/mocks/components/MocksPlaceholder';
import { ScriptsPlaceholder } from '@client/features/scripts/components/ScriptsPlaceholder';
import { SettingsPlaceholder } from '@client/features/settings/components/SettingsPlaceholder';
import { WorkspacePlaceholder } from '@client/features/workspace/components/WorkspacePlaceholder';

const [workspaceSection, capturesSection, historySection, mocksSection, environmentsSection, scriptsSection, settingsSection] = appSections;

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={workspaceSection.path} replace />} />
      <Route element={<AppShell />}>
        <Route path={workspaceSection.path} element={<WorkspacePlaceholder />} />
        <Route path={capturesSection.path} element={<CapturesPlaceholder />} />
        <Route path={historySection.path} element={<HistoryPlaceholder />} />
        <Route path={mocksSection.path} element={<MocksPlaceholder />} />
        <Route path={environmentsSection.path} element={<EnvironmentsPlaceholder />} />
        <Route path={scriptsSection.path} element={<ScriptsPlaceholder />} />
        <Route path={settingsSection.path} element={<SettingsPlaceholder />} />
      </Route>
    </Routes>
  );
}
