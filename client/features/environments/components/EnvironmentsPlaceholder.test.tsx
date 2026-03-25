import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppRouter } from '@client/app/router/AppRouter';
import { defaultEnvironmentFixtureDetails } from '@client/features/environments/data/environment-fixtures';
import type { EnvironmentDetailRecord, EnvironmentInput } from '@client/features/environments/environment.types';
import { renderApp } from '@client/shared/test/render-app';

function createApiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
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

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function summarizeEnvironment(environment: EnvironmentDetailRecord) {
  return Object.fromEntries(
    Object.entries(environment).filter(([key]) => key !== 'variables'),
  ) as Omit<EnvironmentDetailRecord, 'variables'>;
}

function buildEnvironmentRecord(input: EnvironmentInput, existing?: EnvironmentDetailRecord): EnvironmentDetailRecord {
  const now = '2026-03-22T10:00:00.000Z';
  const existingVariablesById = new Map((existing?.variables ?? []).map((row) => [row.id, row]));
  const variables = input.variables.map((row, index) => {
    const existingVariable = typeof row.id === 'string' ? existingVariablesById.get(row.id) : null;
    const isSecret = row.isSecret === true;
    const storedValue = isSecret
      ? row.clearStoredValue === true
        ? ''
        : (row.replacementValue?.length ?? 0) > 0
          ? row.replacementValue ?? ''
          : existingVariable?.hasStoredValue
            ? 'stored-secret'
            : ''
      : (row.value ?? '');

    return {
      id: row.id ?? `environment-variable-${index + 1}`,
      key: row.key.trim(),
      description: row.description,
      isEnabled: row.isEnabled !== false,
      isSecret,
      valueType: row.valueType,
      value: isSecret ? '' : storedValue,
      hasStoredValue: isSecret ? storedValue.length > 0 : false,
      createdAt: existingVariable?.createdAt ?? now,
      updatedAt: now,
    };
  });

  return {
    id: existing?.id ?? `environment-${Math.random().toString(36).slice(2, 9)}`,
    workspaceId: 'local-workspace',
    name: input.name.trim(),
    description: input.description,
    isDefault: input.isDefault,
    variableCount: variables.length,
    enabledVariableCount: variables.filter((row) => row.isEnabled !== false).length,
    secretVariableCount: variables.filter((row) => row.isSecret === true).length,
    resolutionSummary: `${variables.length} variables are managed here, including ${variables.filter((row) => row.isSecret === true).length} secret-backed entries. Plain placeholders resolve at run time, while secret rows stay write-only until a secure backend is available.`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    variables,
  };
}

function enforceDefault(environments: EnvironmentDetailRecord[]) {
  if (environments.length === 0) {
    return environments;
  }
  const defaultEnvironment = environments.find((environment) => environment.isDefault)
    ?? environments[0]
    ?? null;
  return environments.map((environment) => ({
    ...environment,
    isDefault: environment.id === defaultEnvironment?.id,
  }));
}

function createEnvironmentsFetch(initialEnvironments = defaultEnvironmentFixtureDetails) {
  let environments = enforceDefault(initialEnvironments.map((environment) => cloneValue(environment)));
  let sequence = environments.length + 1;

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = getUrl(input);
    const method = init?.method ?? 'GET';

    if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
      return createApiResponse({ items: [] });
    }

    if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
      return createApiResponse({ items: environments.map((environment) => summarizeEnvironment(environment)) });
    }

    if (url === '/api/workspaces/local-workspace/environments' && method === 'POST') {
      const payload = JSON.parse(String(init?.body ?? '{}')) as { environment: EnvironmentInput };
      const createdEnvironment = buildEnvironmentRecord(payload.environment);
      createdEnvironment.id = `environment-created-${sequence}`;
      sequence += 1;
      environments = enforceDefault([createdEnvironment, ...environments].map((environment) => (
        createdEnvironment.isDefault
          ? { ...environment, isDefault: environment.id === createdEnvironment.id }
          : environment
      )));
      return createApiResponse({ environment: environments.find((environment) => environment.id === createdEnvironment.id) }, 201);
    }

    if (url.startsWith('/api/environments/') && method === 'GET') {
      const environmentId = url.split('/').pop() ?? '';
      const environment = environments.find((item) => item.id === environmentId);
      return createApiResponse({ environment });
    }

    if (url.startsWith('/api/environments/') && method === 'PATCH') {
      const environmentId = url.split('/').pop() ?? '';
      const existingEnvironment = environments.find((item) => item.id === environmentId);
      const payload = JSON.parse(String(init?.body ?? '{}')) as { environment: EnvironmentInput };
      const updatedEnvironment = buildEnvironmentRecord(payload.environment, existingEnvironment);
      updatedEnvironment.id = environmentId;
      environments = enforceDefault(
        environments.map((environment) => environment.id === environmentId ? updatedEnvironment : environment)
          .map((environment) => updatedEnvironment.isDefault ? { ...environment, isDefault: environment.id === environmentId } : environment),
      );
      return createApiResponse({ environment: environments.find((environment) => environment.id === environmentId) });
    }

    if (url.startsWith('/api/environments/') && method === 'DELETE') {
      const environmentId = url.split('/').pop() ?? '';
      environments = enforceDefault(environments.filter((environment) => environment.id !== environmentId));
      return createApiResponse({ deletedEnvironmentId: environmentId });
    }

    throw new Error(`Unexpected fetch call: ${method} ${url}`);
  });
}

describe('Environments MVP route', () => {
  it('renders persisted environments and keeps secret rows masked', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createEnvironmentsFetch());
    renderApp(<AppRouter />, { initialEntries: ['/environments'] });

    expect(screen.getByRole('heading', { name: 'Environments' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search environments')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort environments')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Open environment Local API' }));
    expect(await screen.findByRole('button', { name: 'Save environment' })).toBeEnabled();
    expect(screen.getByText(/Persisted variables are managed here\./i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Where environment values resolve' })).toBeInTheDocument();
    expect(screen.getByText(/\{\{VARIABLE_NAME\}\} form/i)).toBeInTheDocument();
    expect(screen.getAllByText(/env\.get\('token'\)/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/replacementValue is reserved for a future secure backend/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Secret replacement value 2')).toHaveValue('');
    expect(screen.queryByDisplayValue('secret-token')).not.toBeInTheDocument();
  }, 15000);



  it('auto-collapses the explorer after environment selection and shows the selected summary when reopened', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createEnvironmentsFetch());
    renderApp(<AppRouter />, { initialEntries: ['/environments'] });

    const explorer = screen.getByLabelText('Section explorer');
    const detailPanel = screen.getByLabelText('Contextual detail panel');

    await user.click(await within(explorer).findByRole('button', { name: 'Open environment Local API' }));
    expect(screen.getByRole('heading', { name: 'Edit environment' })).toBeInTheDocument();
    expect(screen.getByLabelText('Environment name')).toHaveValue('Local API');
    expect(within(detailPanel).getByText(/Current default intent/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    expect(screen.getByLabelText('Section explorer')).toBeInTheDocument();
    expect(within(explorer).getByRole('heading', { name: 'Current environment summary' })).toBeInTheDocument();
    expect(within(explorer).getByText(/3 variables are managed here/i)).toBeInTheDocument();
    expect(within(explorer).getByText('3 vars')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse explorer' }));
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('creates, updates, and deletes a persisted environment', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createEnvironmentsFetch());
    renderApp(<AppRouter />, { initialEntries: ['/environments'] });

    await screen.findByRole('button', { name: 'Open environment Local API' });
    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    await user.click(screen.getByRole('button', { name: 'New environment' }));
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');

    expect(screen.getByRole('heading', { name: 'Create environment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create environment' })).toBeDisabled();

    await user.type(screen.getByLabelText('Environment name'), 'Stage copy');
    await user.type(screen.getByLabelText('Variable key 1'), 'API_BASE');
    await user.type(screen.getByLabelText('Variable value 1'), 'https://stage-copy.example.com');
    await user.click(screen.getByLabelText('Default environment'));
    await user.click(screen.getByRole('button', { name: 'Create environment' }));

    expect(await screen.findByRole('heading', { name: 'Edit environment' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open environment Stage copy' })).toBeInTheDocument());
    expect(within(screen.getByLabelText('Environments list')).getAllByText('Default').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Open environment Stage copy' }));

    await user.clear(screen.getByLabelText('Environment name'));
    await user.type(screen.getByLabelText('Environment name'), 'Stage copy updated');
    await user.click(screen.getByRole('button', { name: 'Save environment' }));
    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open environment Stage copy updated' })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Open environment Stage copy updated' }));
    await user.click(screen.getByRole('button', { name: 'Delete environment' }));
    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Open environment Stage copy updated' })).not.toBeInTheDocument());
  }, 30000);
  it('shows degraded detail state when the selected environment cannot be loaded', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/environments' && method === 'GET') {
        return createApiResponse({ items: defaultEnvironmentFixtureDetails.map((environment) => summarizeEnvironment(environment)) });
      }

      if (url.startsWith('/api/environments/') && method === 'GET') {
        return new Response(JSON.stringify({ error: { message: 'Environment detail is temporarily unavailable.' } }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, { initialEntries: ['/environments'] });

    const explorer = screen.getByLabelText('Section explorer');
    await user.click(await within(explorer).findByRole('button', { name: 'Open environment Local API' }));

    expect(await screen.findByText('Environment management is degraded')).toBeInTheDocument();
    expect(screen.getByText('Environment resources could not be loaded cleanly. Environment detail is temporarily unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('No environment selected')).not.toBeInTheDocument();
  });
  it('renders the environments route copy in Korean when the locale is switched', async () => {
    vi.stubGlobal('fetch', createEnvironmentsFetch());
    renderApp(<AppRouter />, { initialEntries: ['/environments'], initialLocale: 'ko' });

    expect(screen.getByRole('heading', { name: '환경' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '환경 목록' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 환경' })).toBeInTheDocument();
    expect(screen.getByLabelText('환경 검색')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '환경 열기 Local API' })).toBeInTheDocument();
  });
});
