import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppRouter } from '@client/app/router/AppRouter';
import { renderApp } from '@client/shared/test/render-app';

function createApiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

async function openNewRequest(user: ReturnType<typeof userEvent.setup>) {
  const explorer = screen.getByLabelText('Section explorer');
  await user.click(within(explorer).getByRole('button', { name: 'New Request' }));
}

describe('Workspace request builder authoring shell', () => {
  it('renders method and url authoring controls for the active tab', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    await openNewRequest(user);
    expect(screen.getByText(/Workspace remains the authoring surface/i)).toBeInTheDocument();

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

  it('loads a stage-aware Scripts editor lazily and keeps stage content independent', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const mainSurface = screen.getByLabelText('Main work surface');
    const detailPanel = screen.getByLabelText('Contextual detail panel');

    await openNewRequest(user);
    await user.type(screen.getByLabelText('Request URL'), 'https://scripts.example/resource');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));

    expect(await screen.findByTestId('script-editor-loading')).toBeInTheDocument();
    expect(await screen.findByLabelText('Pre-request script')).toBeInTheDocument();

    const scriptStages = screen.getByRole('tablist', { name: 'Script stages' });
    await user.type(screen.getByLabelText('Pre-request script'), "request.headers.set('x-trace-id', 'draft-local');");

    await user.click(within(scriptStages).getByRole('tab', { name: 'Post-response' }));
    expect(screen.getByLabelText('Post-response script')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Post-response script'), "console.warn('review response');");

    await user.click(within(scriptStages).getByRole('tab', { name: 'Tests' }));
    expect(screen.getByLabelText('Tests script')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Tests script'), 'assert(response.status === 200);');

    await user.click(within(scriptStages).getByRole('tab', { name: 'Pre-request' }));
    expect(screen.getByLabelText('Pre-request script')).toHaveValue("request.headers.set('x-trace-id', 'draft-local');");

    await user.click(within(scriptStages).getByRole('tab', { name: 'Post-response' }));
    expect(screen.getByLabelText('Post-response script')).toHaveValue("console.warn('review response');");

    await user.click(within(mainSurface).getByRole('button', { name: 'Params' }));
    expect(screen.getByLabelText('Request URL')).toHaveValue('https://scripts.example/resource');

    expect(within(detailPanel).getByRole('tablist', { name: 'Result panel tabs' })).toBeInTheDocument();
    await user.click(within(detailPanel).getByRole('tab', { name: 'Console' }));
    expect(within(detailPanel).getByRole('heading', { name: 'Console summary' })).toBeInTheDocument();
    expect(within(detailPanel).queryByLabelText('Pre-request script')).not.toBeInTheDocument();
  });

  it('keeps stage-specific script drafts across workspace tab switches', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const mainSurface = screen.getByLabelText('Main work surface');

    await openNewRequest(user);
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    await screen.findByLabelText('Pre-request script');

    const firstTabScriptStages = screen.getByRole('tablist', { name: 'Script stages' });
    await user.click(within(firstTabScriptStages).getByRole('tab', { name: 'Tests' }));
    await user.type(screen.getByLabelText('Tests script'), 'assert(response.status === 200);');

    await user.click(within(explorer).getByRole('button', { name: 'Open Health check' }));
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    expect(screen.getByLabelText('Pre-request script')).toHaveValue('');
    await user.type(screen.getByLabelText('Pre-request script'), "request.headers.set('x-health-check', '1');");

    const tabStrip = screen.getByRole('tablist', { name: 'Request tab strip' });
    await user.click(within(tabStrip).getByRole('tab', { name: /Untitled Request/i }));
    expect(screen.getByLabelText('Tests script')).toHaveValue('assert(response.status === 200);');

    await user.click(within(tabStrip).getByRole('tab', { name: /Health check/i }));
    expect(screen.getByLabelText('Pre-request script')).toHaveValue("request.headers.set('x-health-check', '1');");
  });

  it('prefers persisted saved requests over starter fixtures and keeps canonical ordering stable', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({
          items: [
            {
              id: 'request-alpha-persisted',
              workspaceId: 'local-workspace',
              name: 'Alpha persisted',
              method: 'GET',
              url: 'http://localhost:5671/alpha',
              params: [],
              headers: [],
              bodyMode: 'none',
              bodyText: '',
              formBody: [],
              multipartBody: [],
              auth: {
                type: 'none',
                bearerToken: '',
                basicUsername: '',
                basicPassword: '',
                apiKeyName: '',
                apiKeyValue: '',
                apiKeyPlacement: 'header',
              },
              scripts: {
                activeStage: 'pre-request',
                preRequest: '',
                postResponse: '',
                tests: '',
              },
              summary: 'Persisted alpha request',
              collectionName: 'Saved Requests',
              createdAt: '2026-03-20T09:00:00.000Z',
              updatedAt: '2026-03-20T09:30:00.000Z',
            },
            {
              id: 'request-zeta-persisted',
              workspaceId: 'local-workspace',
              name: 'Zeta persisted',
              method: 'POST',
              url: 'http://localhost:5671/zeta',
              params: [],
              headers: [],
              bodyMode: 'json',
              bodyText: '{"ok":true}',
              formBody: [],
              multipartBody: [],
              auth: {
                type: 'none',
                bearerToken: '',
                basicUsername: '',
                basicPassword: '',
                apiKeyName: '',
                apiKeyValue: '',
                apiKeyPlacement: 'header',
              },
              scripts: {
                activeStage: 'pre-request',
                preRequest: '',
                postResponse: '',
                tests: '',
              },
              summary: 'Persisted zeta request',
              collectionName: 'Saved Requests',
              createdAt: '2026-03-20T08:00:00.000Z',
              updatedAt: '2026-03-20T10:30:00.000Z',
            },
          ],
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />);

    const explorer = screen.getByLabelText('Section explorer');
    const persistedButtons = await within(explorer).findAllByRole('button', { name: /^Open / });

    expect(persistedButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Open Zeta persisted',
      'Open Alpha persisted',
    ]);
    expect(within(explorer).queryByRole('button', { name: 'Open Health check' })).not.toBeInTheDocument();

    await user.click(persistedButtons[0]!);

    expect(screen.getByLabelText('Request name')).toHaveValue('Zeta persisted');
    expect(screen.getByText('Saved request')).toBeInTheDocument();
  });

  it('renders scripts stage copy inside replay drafts without breaking shell composition', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    await user.click(screen.getByRole('button', { name: 'Open Replay Draft' }));
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByText('Opened from history')).toBeInTheDocument();

    const mainSurface = screen.getByLabelText('Main work surface');
    await user.click(within(mainSurface).getByRole('button', { name: 'Scripts' }));
    expect(await screen.findByLabelText('Pre-request script')).toBeInTheDocument();
    expect(screen.getByText('Deferred in later slices')).toBeInTheDocument();
  });
});




