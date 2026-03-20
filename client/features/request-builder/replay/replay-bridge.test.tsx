import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '@client/app/router/AppRouter';
import { useCapturesStore } from '@client/features/captures/state/captures-store';
import { useHistoryStore } from '@client/features/history/state/history-store';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { useWorkspaceShellStore } from '@client/features/workspace/state/workspace-shell-store';
import { renderApp } from '@client/shared/test/render-app';

describe('Replay bridge S8', () => {
  it('opens a replay draft from capture detail and hydrates a new workspace draft tab', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/captures'] });

    const capturesList = await screen.findByLabelText('Captures list');
    await user.click(within(capturesList).getByRole('button', { name: /Open capture POST \/webhooks\/stripe\?env=dev/i }));

    expect(screen.getByRole('button', { name: 'Open Replay Draft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Replay Now' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Open Replay Draft' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument());
    expect(screen.getByLabelText('Request name')).toHaveValue('Replay of POST /webhooks/stripe');
    expect(screen.getByLabelText('Request method')).toHaveValue('POST');
    expect(screen.getByLabelText('Request URL')).toHaveValue('http://localhost:5671/webhooks/stripe');
    expect(screen.getByText('Opened from capture')).toBeInTheDocument();
    expect(screen.getByLabelText('Param row 1 key')).toHaveValue('env');
    expect(screen.getByLabelText('Param row 1 value')).toHaveValue('dev');

    await user.click(screen.getByRole('button', { name: 'Body' }));
    expect(screen.getByLabelText('Body mode')).toHaveValue('json');
    expect((screen.getByLabelText('Body content (JSON)') as HTMLTextAreaElement).value).toContain('invoice.paid');

    await user.clear(screen.getByLabelText('Request URL'));
    await user.type(screen.getByLabelText('Request URL'), 'http://localhost:5671/edited');

    expect(useCapturesStore.getState().selectedCaptureId).toBe('cap-stripe-webhook');
    expect(useCapturesStore.getState().listItems.find((capture) => capture.id === 'cap-stripe-webhook')?.path).toBe('/webhooks/stripe?env=dev');
  });

  it('opens a replay draft from history detail and hydrates request snapshot fields', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    expect(screen.getByRole('button', { name: 'Open Replay Draft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Replay Now' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Open Replay Draft' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument());
    expect(screen.getByLabelText('Request name')).toHaveValue('Replay of Create user');
    expect(screen.getByLabelText('Request method')).toHaveValue('POST');
    expect(screen.getByLabelText('Request URL')).toHaveValue('https://api.example.com/users');
    expect(screen.getByText('Opened from history')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Body' }));
    expect(screen.getByLabelText('Body mode')).toHaveValue('json');
    expect((screen.getByLabelText('Body content (JSON)') as HTMLTextAreaElement).value).toContain('Morgan Lee');

    await user.click(screen.getByRole('button', { name: 'Auth' }));
    expect(screen.getByLabelText('Auth type')).toHaveValue('bearer');
    expect(screen.getByLabelText('Bearer token')).toHaveValue('qa-token-104');

    await user.click(screen.getByRole('button', { name: 'Scripts' }));
    expect(await screen.findByLabelText('Pre-request script')).toBeInTheDocument();
    const scriptStages = screen.getByRole('tablist', { name: 'Script stages' });
    await user.click(within(scriptStages).getByRole('tab', { name: 'Tests' }));
    await user.type(screen.getByLabelText('Tests script'), 'assert(response.status === 201);');
    expect(screen.getByLabelText('Tests script')).toHaveValue('assert(response.status === 201);');

    await user.click(screen.getByRole('button', { name: 'Params' }));
    await user.clear(screen.getByLabelText('Request URL'));
    await user.type(screen.getByLabelText('Request URL'), 'https://api.example.com/edited-users');
    expect(useHistoryStore.getState().selectedHistoryId).toBe(null);
  });

  it('opens replay in a new draft tab without overwriting an existing workspace draft', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/workspace'] });

    const explorer = screen.getByLabelText('Section explorer');
    await user.click(within(explorer).getByRole('button', { name: 'New Request' }));
    await user.type(screen.getByLabelText('Request URL'), 'https://draft-one.example');

    await user.click(screen.getByRole('link', { name: /history/i }));
    await user.click(screen.getByRole('button', { name: 'Open Replay Draft' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument());

    const tabStrip = screen.getByRole('tablist', { name: 'Request tab strip' });
    expect(within(tabStrip).getByRole('tab', { name: /Replay of Create user/i })).toBeInTheDocument();
    expect(within(tabStrip).getByRole('tab', { name: /Untitled Request/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Request name')).toHaveValue('Replay of Create user');

    await user.click(within(tabStrip).getByRole('tab', { name: /Untitled Request/i }));
    expect(screen.getByLabelText('Request URL')).toHaveValue('https://draft-one.example');
    expect(useWorkspaceShellStore.getState().tabs).toHaveLength(2);
    expect(Object.keys(useRequestDraftStore.getState().draftsByTabId)).toHaveLength(2);
  });
});



