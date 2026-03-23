import { create } from 'zustand';
import type { RoutePanelTabId } from '@client/features/shared-section-placeholder';

export type WorkspaceUiRouteId = 'workspace' | 'environments' | 'scripts';
export type WorkspaceAutoFocusTarget = 'explorer' | 'main' | 'detail';
export type WorkspaceResultPanelTabId = 'response' | 'console' | 'tests' | 'execution-info';

interface RoutePanelUiState {
  activePanel: RoutePanelTabId;
  floatingExplorerOpen: boolean;
}

interface WorkspaceUiState {
  routePanels: Record<WorkspaceUiRouteId, RoutePanelUiState>;
  activeResultPanelVisible: boolean;
  activeResultTab: WorkspaceResultPanelTabId;
  runAutoFocusTarget: WorkspaceAutoFocusTarget;
  setRouteActivePanel: (routeId: WorkspaceUiRouteId, panel: RoutePanelTabId) => void;
  openFloatingExplorer: (routeId: WorkspaceUiRouteId) => void;
  collapseFloatingExplorer: (routeId: WorkspaceUiRouteId) => void;
  focusWorkspaceWorkSurface: () => void;
  focusWorkspaceResultPanel: (tab?: WorkspaceResultPanelTabId) => void;
  setActiveResultTab: (tab: WorkspaceResultPanelTabId) => void;
  setRunAutoFocusTarget: (target: WorkspaceAutoFocusTarget) => void;
}

const defaultRoutePanels: Record<WorkspaceUiRouteId, RoutePanelUiState> = {
  workspace: { activePanel: 'main', floatingExplorerOpen: false },
  environments: { activePanel: 'explorer', floatingExplorerOpen: true },
  scripts: { activePanel: 'explorer', floatingExplorerOpen: true },
};

const initialWorkspaceUiState: Pick<
  WorkspaceUiState,
  'routePanels' | 'activeResultPanelVisible' | 'activeResultTab' | 'runAutoFocusTarget'
> = {
  routePanels: defaultRoutePanels,
  activeResultPanelVisible: false,
  activeResultTab: 'response',
  runAutoFocusTarget: 'main',
};

function createRoutePanelState(panel: RoutePanelTabId): RoutePanelUiState {
  return {
    activePanel: panel,
    floatingExplorerOpen: panel === 'explorer',
  };
}

export const useWorkspaceUiStore = create<WorkspaceUiState>((set) => ({
  ...initialWorkspaceUiState,
  setRouteActivePanel: (routeId, panel) =>
    set((state) => ({
      routePanels: {
        ...state.routePanels,
        [routeId]: createRoutePanelState(panel),
      },
      ...(routeId === 'workspace'
        ? {
            activeResultPanelVisible: panel === 'detail',
            runAutoFocusTarget: panel,
          }
        : {}),
    })),
  openFloatingExplorer: (routeId) =>
    set((state) => ({
      routePanels: {
        ...state.routePanels,
        [routeId]: createRoutePanelState('explorer'),
      },
      ...(routeId === 'workspace'
        ? {
            activeResultPanelVisible: false,
            runAutoFocusTarget: 'explorer' as WorkspaceAutoFocusTarget,
          }
        : {}),
    })),
  collapseFloatingExplorer: (routeId) =>
    set((state) => {
      const fallbackPanel: RoutePanelTabId = routeId === 'workspace' && state.activeResultPanelVisible ? 'detail' : 'main';

      return {
        routePanels: {
          ...state.routePanels,
          [routeId]: createRoutePanelState(fallbackPanel),
        },
        ...(routeId === 'workspace'
          ? {
              activeResultPanelVisible: fallbackPanel === 'detail',
              runAutoFocusTarget: fallbackPanel,
            }
          : {}),
      };
    }),
  focusWorkspaceWorkSurface: () =>
    set((state) => ({
      routePanels: {
        ...state.routePanels,
        workspace: createRoutePanelState('main'),
      },
      activeResultPanelVisible: false,
      runAutoFocusTarget: 'main',
    })),
  focusWorkspaceResultPanel: (tab = 'response') =>
    set((state) => ({
      routePanels: {
        ...state.routePanels,
        workspace: createRoutePanelState('detail'),
      },
      activeResultPanelVisible: true,
      activeResultTab: tab,
      runAutoFocusTarget: 'detail',
    })),
  setActiveResultTab: (tab) =>
    set((state) => ({
      activeResultTab: tab,
      activeResultPanelVisible: true,
      routePanels: {
        ...state.routePanels,
        workspace: createRoutePanelState('detail'),
      },
      runAutoFocusTarget: 'detail',
    })),
  setRunAutoFocusTarget: (target) => set({ runAutoFocusTarget: target }),
}));

export function resetWorkspaceUiStore() {
  useWorkspaceUiStore.setState(initialWorkspaceUiState);
}
