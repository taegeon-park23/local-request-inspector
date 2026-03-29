import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsRoute } from '@client/features/settings/components/SettingsRoute';
import { resetShellStore, useShellStore } from '@client/app/providers/shell-store';
import { renderApp } from '@client/shared/test/render-app';

function createApiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

afterEach(() => {
  resetShellStore();
  vi.unstubAllGlobals();
});

describe('SettingsRoute', () => {
  it('uses segmented controls for shell density and persists the selected value through the shell store', async () => {
    const user = userEvent.setup();

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (url === '/api/settings/runtime-status') {
        return createApiResponse({
          status: {
            appShell: {
              builtClientAvailable: true,
              clientDistPath: 'dist/client',
              clientIndexPath: 'dist/client/index.html',
              legacyRoute: '/legacy',
              appRoute: '/app',
              devClientUrl: 'http://localhost:5173',
              buildCommand: 'npm run build',
              serveCommand: 'npm run serve',
              devCommand: 'npm run dev',
              note: 'ready',
            },
            storage: {
              ready: true,
              rootDir: 'C:/data',
              versionManifestPath: 'C:/data/version.json',
              resourceManifestPath: 'C:/data/resources.json',
              runtimeDbPath: 'C:/data/runtime.db',
              versionManifestAvailable: true,
              resourceManifestAvailable: true,
              runtimeDbAvailable: true,
            },
            secretStorage: null,
            routes: [
              { label: 'Workspace', path: '/workspace', note: 'authoring' },
            ],
            commands: [
              { label: 'Serve', command: 'npm run serve', purpose: 'start app' },
            ],
          },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }));

    resetShellStore();
    useShellStore.getState().setShellDensityMode('compact');

    renderApp(<SettingsRoute />);

    const densityHeading = await screen.findByRole('heading', { name: 'Shell density preference' });
    const densitySection = densityHeading.closest('section');
    expect(densitySection).not.toBeNull();
    expect((densitySection as HTMLElement).querySelector('.shared-support-block--notes')).not.toBeNull();

    const densityControls = within(densitySection as HTMLElement);
    expect(densityControls.getByRole('button', { name: 'Compact' })).toHaveAttribute('aria-pressed', 'true');
    expect(densityControls.getByRole('button', { name: 'Comfortable' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(densityControls.getByRole('button', { name: 'Comfortable' }));

    await waitFor(() => {
      expect(useShellStore.getState().shellDensityMode).toBe('comfortable');
      expect(densityControls.getByRole('button', { name: 'Comfortable' })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
