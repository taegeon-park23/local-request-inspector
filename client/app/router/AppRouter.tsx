import { Navigate, Route, Routes } from 'react-router-dom';
import { appSections } from '@client/app/router/sections';
import { AppShell } from '@client/app/shell/AppShell';
import { CapturesRoute } from '@client/features/captures/components/CapturesRoute';
import { EnvironmentsRoute } from '@client/features/environments/components/EnvironmentsRoute';
import { HistoryRoute } from '@client/features/history/components/HistoryRoute';
import { MocksRoute } from '@client/features/mocks/components/MocksRoute';
import { ScriptsRoute } from '@client/features/scripts/components/ScriptsRoute';
import { SettingsRoute } from '@client/features/settings/components/SettingsRoute';
import { WorkspaceRoute } from '@client/features/workspace/components/WorkspaceRoute';

const workspaceSection = appSections[0]!;
const capturesSection = appSections[1]!;
const historySection = appSections[2]!;
const mocksSection = appSections[3]!;
const environmentsSection = appSections[4]!;
const scriptsSection = appSections[5]!;
const settingsSection = appSections[6]!;

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={workspaceSection.path} replace />} />
      <Route element={<AppShell />}>
        <Route path={workspaceSection.path} element={<WorkspaceRoute />} />
        <Route path={capturesSection.path} element={<CapturesRoute />} />
        <Route path={historySection.path} element={<HistoryRoute />} />
        <Route path={mocksSection.path} element={<MocksRoute />} />
        <Route path={environmentsSection.path} element={<EnvironmentsRoute />} />
        <Route path={scriptsSection.path} element={<ScriptsRoute />} />
        <Route path={settingsSection.path} element={<SettingsRoute />} />
      </Route>
    </Routes>
  );
}
