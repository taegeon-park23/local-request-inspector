import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import { resetShellStore } from '@client/app/providers/shell-store';
import { resetCapturesStore } from '@client/features/captures/state/captures-store';
import { resetHistoryStore } from '@client/features/history/state/history-store';
import { resetMocksStore } from '@client/features/mocks/state/mocks-store';
import { resetRequestCommandStore } from '@client/features/request-builder/state/request-command-store';
import { resetRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { resetWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';

afterEach(() => {
  cleanup();
  resetShellStore();
  resetCapturesStore();
  resetHistoryStore();
  resetMocksStore();
  resetWorkspaceShellStore();
  resetRequestDraftStore();
  resetRequestCommandStore();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
