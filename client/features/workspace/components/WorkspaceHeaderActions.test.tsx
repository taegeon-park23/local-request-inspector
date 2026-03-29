import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceHeaderActions } from '@client/features/workspace/components/WorkspaceHeaderActions';
import { renderApp } from '@client/shared/test/render-app';

interface ControlledHeaderActionsProps {
  canCreateRequestGroup?: boolean;
  canRunSelectedContainer?: boolean;
  onCreateRequest?: () => void;
  onCreateQuickRequest?: () => void;
  onOpenCreateCollectionSheet?: () => void;
  onOpenCreateRequestGroupSheet?: () => void;
  onRunSelectedContainer?: () => void;
  onImportCurl?: () => void;
  onImportOpenApi?: () => void;
  onImportPostman?: () => void;
}

function ControlledHeaderActions({
  canCreateRequestGroup = false,
  canRunSelectedContainer = false,
  onCreateRequest = vi.fn(),
  onCreateQuickRequest = vi.fn(),
  onOpenCreateCollectionSheet = vi.fn(),
  onOpenCreateRequestGroupSheet = vi.fn(),
  onRunSelectedContainer = vi.fn(),
  onImportCurl = vi.fn(),
  onImportOpenApi = vi.fn(),
  onImportPostman = vi.fn(),
}: ControlledHeaderActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <WorkspaceHeaderActions
      isMenuOpen={isMenuOpen}
      canCreateRequestGroup={canCreateRequestGroup}
      canRunSelectedContainer={canRunSelectedContainer}
      onMenuOpenChange={setIsMenuOpen}
      onCreateRequest={onCreateRequest}
      onCreateQuickRequest={onCreateQuickRequest}
      onOpenCreateCollectionSheet={onOpenCreateCollectionSheet}
      onOpenCreateRequestGroupSheet={onOpenCreateRequestGroupSheet}
      onRunSelectedContainer={onRunSelectedContainer}
      onImportCurl={onImportCurl}
      onImportOpenApi={onImportOpenApi}
      onImportPostman={onImportPostman}
    />
  );
}

describe('WorkspaceHeaderActions', () => {
  it('keeps New Request as the only visible top-level primary CTA and moves secondary actions into overflow', async () => {
    const user = userEvent.setup();

    renderApp(<ControlledHeaderActions />);

    expect(screen.getAllByRole('button', { name: 'New Request' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'More Actions' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Quick Request/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /New collection/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Import cURL/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'More Actions' }));
    expect(screen.getByRole('button', { name: /Quick Request/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New collection/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import cURL/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New group/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Run Selected/i })).toBeDisabled();
  });

  it('routes overflow actions through their assigned handlers', async () => {
    const user = userEvent.setup();
    const onCreateQuickRequest = vi.fn();

    renderApp(
      <ControlledHeaderActions
        canCreateRequestGroup
        canRunSelectedContainer
        onCreateQuickRequest={onCreateQuickRequest}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'More Actions' }));
    await user.click(screen.getByRole('button', { name: /Quick Request/i }));
    expect(onCreateQuickRequest).toHaveBeenCalledTimes(1);
  });
});
