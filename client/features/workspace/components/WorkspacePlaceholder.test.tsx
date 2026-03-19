import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '@client/app/router/AppRouter';
import { renderApp } from '@client/shared/test/render-app';

async function openNewRequest(user: ReturnType<typeof userEvent.setup>) {
  const explorer = screen.getByLabelText('Section explorer');
  await user.click(within(explorer).getByRole('button', { name: 'New Request' }));
}

describe('Workspace S3 request builder core', () => {
  it('renders method and url authoring controls for the active tab', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    await openNewRequest(user);

    expect(screen.getByLabelText('Request method')).toBeInTheDocument();
    expect(screen.getByLabelText('Request URL')).toBeInTheDocument();
  });

  it('updates method and url draft values and shows a dirty indicator', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    await openNewRequest(user);

    const methodSelect = screen.getByLabelText('Request method');
    const urlInput = screen.getByLabelText('Request URL');

    await user.selectOptions(methodSelect, 'POST');
    await user.type(urlInput, 'https://api.example.com/users');

    expect(methodSelect).toHaveValue('POST');
    expect(urlInput).toHaveValue('https://api.example.com/users');
    expect(screen.getByLabelText('Untitled Request has unsaved changes')).toBeInTheDocument();
  });

  it('adds and removes params and headers rows', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const mainSurface = screen.getByLabelText('Main work surface');

    await openNewRequest(user);

    await user.click(within(mainSurface).getByRole('button', { name: 'Add param' }));
    expect(screen.getByLabelText('Param row 1 key')).toBeInTheDocument();

    await user.click(within(mainSurface).getByRole('button', { name: 'Headers' }));
    await user.click(within(mainSurface).getByRole('button', { name: 'Add header' }));
    expect(screen.getByLabelText('Header row 1 key')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove header row 1' }));
    expect(screen.queryByLabelText('Header row 1 key')).not.toBeInTheDocument();

    await user.click(within(mainSurface).getByRole('button', { name: 'Params' }));
    await user.click(screen.getByRole('button', { name: 'Remove param row 1' }));
    expect(screen.queryByLabelText('Param row 1 key')).not.toBeInTheDocument();
  });

  it('switches body and auth subtabs with real authoring controls', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const mainSurface = screen.getByLabelText('Main work surface');

    await openNewRequest(user);

    await user.click(within(mainSurface).getByRole('button', { name: 'Body' }));
    expect(screen.getByLabelText('Body mode')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Body mode'), 'json');
    expect(screen.getByLabelText('Body content (JSON)')).toBeInTheDocument();

    await user.click(within(mainSurface).getByRole('button', { name: 'Auth' }));
    expect(screen.getByLabelText('Auth type')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Auth type'), 'bearer');
    expect(screen.getByLabelText('Bearer token')).toBeInTheDocument();
  });

  it('keeps draft state independent across tabs', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const mainSurface = screen.getByLabelText('Main work surface');

    await openNewRequest(user);
    await user.type(screen.getByLabelText('Request URL'), 'https://draft-one.example');

    await user.click(within(explorer).getByRole('button', { name: 'Open Health check' }));
    expect(screen.getByLabelText('Request URL')).toHaveValue('http://localhost:5671/health');

    await user.selectOptions(screen.getByLabelText('Request method'), 'PATCH');
    await user.clear(screen.getByLabelText('Request name'));
    await user.type(screen.getByLabelText('Request name'), 'Health patch');

    await user.click(within(mainSurface).getByRole('tab', { name: /Untitled Request/i }));
    expect(screen.getByLabelText('Request URL')).toHaveValue('https://draft-one.example');
    expect(screen.getByLabelText('Request method')).toHaveValue('GET');

    await user.click(within(mainSurface).getByRole('tab', { name: /Health patch/i }));
    expect(screen.getByLabelText('Request method')).toHaveValue('PATCH');
    expect(screen.getByLabelText('Request name')).toHaveValue('Health patch');
  });

  it('keeps the Scripts tab as a placeholder and the shared observation tabs separate from authoring', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const mainSurface = screen.getByLabelText('Main work surface');
    const detailPanel = screen.getByLabelText('Contextual detail panel');

    await openNewRequest(user);
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));

    expect(screen.getByText('Pre-request')).toBeInTheDocument();
    expect(screen.getByText('Post-response')).toBeInTheDocument();
    expect(screen.getByText('Tests')).toBeInTheDocument();
    expect(within(detailPanel).getByRole('tablist', { name: 'Result panel tabs' })).toBeInTheDocument();
    await user.click(within(detailPanel).getByRole('tab', { name: 'Console' }));
    expect(within(detailPanel).getByRole('heading', { name: 'Console summary' })).toBeInTheDocument();
    expect(within(detailPanel).queryByLabelText('Request method')).not.toBeInTheDocument();
  });
});
