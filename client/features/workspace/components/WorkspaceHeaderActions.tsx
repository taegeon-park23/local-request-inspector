import { useMemo } from 'react';
import { useI18n } from '@client/app/providers/useI18n';
import { ActionMenu, type ActionMenuItem } from '@client/shared/ui/ActionMenu';
import { IconLabel } from '@client/shared/ui/IconLabel';

interface WorkspaceHeaderActionsProps {
  isMenuOpen: boolean;
  canCreateRequestGroup: boolean;
  canRunSelectedContainer: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onCreateRequest: () => void;
  onCreateQuickRequest: () => void;
  onOpenCreateCollectionSheet: () => void;
  onOpenCreateRequestGroupSheet: () => void;
  onRunSelectedContainer: () => void;
  onImportCurl: () => void;
  onImportOpenApi: () => void;
  onImportPostman: () => void;
}

export function WorkspaceHeaderActions({
  isMenuOpen,
  canCreateRequestGroup,
  canRunSelectedContainer,
  onMenuOpenChange,
  onCreateRequest,
  onCreateQuickRequest,
  onOpenCreateCollectionSheet,
  onOpenCreateRequestGroupSheet,
  onRunSelectedContainer,
  onImportCurl,
  onImportOpenApi,
  onImportPostman,
}: WorkspaceHeaderActionsProps) {
  const { t } = useI18n();
  const menuItems = useMemo<ActionMenuItem[]>(() => ([
    {
      id: 'quick-request',
      label: t('workspaceRoute.tabShell.quickRequest'),
      icon: 'new',
      shortcut: t('workspaceRoute.commandMenu.shortcuts.quickRequest'),
      onSelect: onCreateQuickRequest,
    },
    {
      id: 'new-collection',
      label: t('workspaceRoute.explorer.actions.createCollectionShort'),
      icon: 'add',
      shortcut: t('workspaceRoute.commandMenu.shortcuts.newCollection'),
      onSelect: onOpenCreateCollectionSheet,
    },
    {
      id: 'new-request-group',
      label: t('workspaceRoute.explorer.actions.createRequestGroupShort'),
      icon: 'add',
      shortcut: t('workspaceRoute.commandMenu.shortcuts.newRequestGroup'),
      disabled: !canCreateRequestGroup,
      onSelect: onOpenCreateRequestGroupSheet,
    },
    {
      id: 'run-selected',
      label: t('workspaceRoute.explorer.actions.runSelected'),
      icon: 'run',
      shortcut: t('workspaceRoute.commandMenu.shortcuts.runSelected'),
      disabled: !canRunSelectedContainer,
      onSelect: onRunSelectedContainer,
    },
    {
      id: 'import-curl',
      label: t('workspaceRoute.newImport.actions.importCurl'),
      icon: 'import',
      onSelect: onImportCurl,
    },
    {
      id: 'import-openapi',
      label: t('workspaceRoute.newImport.actions.importOpenApi'),
      icon: 'import',
      onSelect: onImportOpenApi,
    },
    {
      id: 'import-postman',
      label: t('workspaceRoute.newImport.actions.importPostman'),
      icon: 'import',
      onSelect: onImportPostman,
    },
  ]), [
    canCreateRequestGroup,
    canRunSelectedContainer,
    onCreateQuickRequest,
    onImportCurl,
    onImportOpenApi,
    onImportPostman,
    onOpenCreateCollectionSheet,
    onOpenCreateRequestGroupSheet,
    onRunSelectedContainer,
    t,
  ]);

  return (
    <div className="shared-action-bar workspace-header-actions" aria-label={t('workspaceRoute.a11y.headerActions')}>
      <button
        type="button"
        className="workspace-button"
        onClick={onCreateRequest}
        aria-keyshortcuts={t('workspaceRoute.commandMenu.shortcuts.newRequest')}
      >
        <IconLabel icon="new">{t('workspaceRoute.tabShell.newRequest')}</IconLabel>
      </button>
      <ActionMenu
        ariaLabel={t('workspaceRoute.headerMenu.ariaLabel')}
        triggerLabel={t('workspaceRoute.headerMenu.trigger')}
        triggerIcon="command"
        items={menuItems}
        isOpen={isMenuOpen}
        onOpenChange={onMenuOpenChange}
        footer={<p className="shared-readiness-note">{t('workspaceRoute.headerMenu.shortcutHint', { shortcut: t('workspaceRoute.commandMenu.shortcuts.openMenu') })}</p>}
      />
    </div>
  );
}
