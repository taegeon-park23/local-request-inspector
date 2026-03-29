import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppRouter } from '@client/app/router/AppRouter';
import { defaultSavedScriptFixtureRecords, defaultScriptTemplateFixtureRecords } from '@client/features/scripts/data/script-fixtures';
import type { SavedScriptInput, SavedScriptRecord } from '@client/features/scripts/scripts.types';
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

function summarizeScript(input: SavedScriptInput, existing?: SavedScriptRecord): SavedScriptRecord {
  const now = '2026-03-22T10:05:00.000Z';
  const templateName = defaultScriptTemplateFixtureRecords.find((template) => template.id === input.templateId)?.name;
  return {
    id: existing?.id ?? `saved-script-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: 'local-workspace',
    name: input.name.trim(),
    description: input.description,
    scriptType: input.scriptType,
    sourceCode: input.sourceCode,
    ...(input.templateId ? { templateId: input.templateId } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    sourcePreview: input.sourceCode.replace(/\s+/g, ' ').trim(),
    capabilitySummary: input.scriptType === 'tests'
      ? 'Tests scripts focus on pass/fail assertions and bounded summaries rather than transport mutation.'
      : input.scriptType === 'post-response'
        ? 'Post-response scripts stay read-focused and emit bounded console summaries after transport completes.'
        : 'Pre-request scripts can use bounded request mutation helpers before transport is sent.',
    deferredSummary: 'Live shared references, backlinks, and plugin-style editor expansion remain deferred.',
    templateSummary: templateName ? `Created from template: ${templateName}.` : 'Created directly in the scripts library.',
    sourceLabel: 'Persisted workspace script',
  };
}

function createScriptsFetch() {
  let scripts = defaultSavedScriptFixtureRecords.map((script) => cloneValue(script));
  let sequence = scripts.length + 1;

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = getUrl(input);
    const method = init?.method ?? 'GET';

    if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
      return createApiResponse({ items: [] });
    }

    if (url === '/api/workspaces/local-workspace/scripts' && method === 'GET') {
      return createApiResponse({ items: scripts });
    }

    if (url === '/api/script-templates' && method === 'GET') {
      return createApiResponse({ items: defaultScriptTemplateFixtureRecords });
    }

    if (url.startsWith('/api/scripts/') && method === 'GET') {
      const scriptId = url.split('/').pop() ?? '';
      return createApiResponse({ script: scripts.find((script) => script.id === scriptId) });
    }

    if (url === '/api/workspaces/local-workspace/scripts' && method === 'POST') {
      const payload = JSON.parse(String(init?.body ?? '{}')) as { script: SavedScriptInput };
      const nextScript = summarizeScript(payload.script);
      nextScript.id = `saved-script-created-${sequence}`;
      sequence += 1;
      scripts = [nextScript, ...scripts];
      return createApiResponse({ script: nextScript }, 201);
    }

    if (url.startsWith('/api/scripts/') && method === 'PATCH') {
      const scriptId = url.split('/').pop() ?? '';
      const existingScript = scripts.find((script) => script.id === scriptId);
      const payload = JSON.parse(String(init?.body ?? '{}')) as { script: SavedScriptInput };
      const updatedScript = summarizeScript(payload.script, existingScript);
      updatedScript.id = scriptId;
      scripts = scripts.map((script) => script.id === scriptId ? updatedScript : script);
      return createApiResponse({ script: updatedScript });
    }

    if (url.startsWith('/api/scripts/') && method === 'DELETE') {
      const scriptId = url.split('/').pop() ?? '';
      scripts = scripts.filter((script) => script.id !== scriptId);
      return createApiResponse({ deletedScriptId: scriptId });
    }

    throw new Error(`Unexpected fetch call: ${method} ${url}`);
  });
}

describe('Scripts MVP route', () => {
  it('renders the saved script library and read-only templates', async () => {
    vi.stubGlobal('fetch', createScriptsFetch());
    renderApp(<AppRouter />, { initialEntries: ['/scripts'] });

    expect(screen.getByRole('heading', { name: 'Scripts' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search scripts')).toBeInTheDocument();
    expect(screen.getByLabelText('Stage filter')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Open script Health status assertions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use Trace ID starter' })).toBeInTheDocument();
    expect(screen.getByText(/Top-level Scripts manages standalone saved scripts/i)).toBeInTheDocument();
  });




  it('applies request-stage route-bridge context in the scripts library', async () => {
    vi.stubGlobal('fetch', createScriptsFetch());
    renderApp(<AppRouter />, { initialEntries: ['/scripts?from=request-stage&stage=tests&scriptId=saved-script-tests-health'] });

    expect(await screen.findByText('Opened from request stage')).toBeInTheDocument();
    expect(screen.getByLabelText('Stage filter')).toHaveValue('tests');
    expect(screen.getByText('Requested stage: Tests')).toBeInTheDocument();
    expect(screen.getByText('Requested saved script: Health status assertions')).toBeInTheDocument();
    expect(screen.getByLabelText('Script name')).toHaveValue('Health status assertions');
    expect(screen.getByRole('button', { name: 'Back to request builder' })).toBeInTheDocument();
  });
  it('auto-collapses the explorer after script selection and shows the selected summary when reopened', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createScriptsFetch());
    renderApp(<AppRouter />, { initialEntries: ['/scripts'] });

    const explorer = screen.getByLabelText('Section explorer');
    const detailPanel = screen.getByLabelText('Contextual detail panel');

    await user.click(await within(explorer).findByRole('button', { name: 'Open script Health status assertions' }));
    expect(screen.getByRole('heading', { name: 'Edit saved script' })).toBeInTheDocument();
    expect(screen.getByLabelText('Script name')).toHaveValue('Health status assertions');
    expect(within(detailPanel).getByRole('button', { name: 'Use Trace ID starter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    expect(screen.getByLabelText('Section explorer')).toBeInTheDocument();
    expect(within(explorer).getByRole('heading', { name: 'Current script summary' })).toBeInTheDocument();
    expect(within(explorer).getByText(/Tests scripts focus on pass\/fail assertions/i)).toBeInTheDocument();
    expect(within(explorer).getByText(/assert\(response\.status === 200\)/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse explorer' }));
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('creates a saved script from a template, updates it, and deletes it', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createScriptsFetch());
    renderApp(<AppRouter />, { initialEntries: ['/scripts'] });

    await user.click(await screen.findByRole('button', { name: 'Open script Health status assertions' }));
    await user.click(screen.getByRole('button', { name: 'Use Response status assertion' }));
    expect(screen.getByRole('button', { name: 'Expand explorer' })).toHaveAttribute('aria-expanded', 'false');

    expect(screen.getByRole('heading', { name: 'Create saved script' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Response status assertion copy')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create script' }));

    expect(await screen.findByRole('heading', { name: 'Edit saved script' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open script Response status assertion copy' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Open script Response status assertion copy' }));

    await user.clear(screen.getByLabelText('Script name'));
    await user.type(screen.getByLabelText('Script name'), 'Response status assertion updated');
    await user.click(screen.getByRole('button', { name: 'Save script' }));
    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open script Response status assertion updated' })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Open script Response status assertion updated' }));
    await user.click(screen.getByRole('button', { name: 'Delete script' }));
    await user.click(screen.getByRole('button', { name: 'Expand explorer' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Open script Response status assertion updated' })).not.toBeInTheDocument());

    const templatesList = screen.getByLabelText('Script templates list');
    expect(within(templatesList).getByRole('button', { name: 'Use Trace ID starter' })).toBeInTheDocument();
  });
  it('shows degraded detail state when the selected script cannot be loaded', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/scripts' && method === 'GET') {
        return createApiResponse({ items: defaultSavedScriptFixtureRecords });
      }

      if (url === '/api/script-templates' && method === 'GET') {
        return createApiResponse({ items: defaultScriptTemplateFixtureRecords });
      }

      if (url.startsWith('/api/scripts/') && method === 'GET') {
        return new Response(JSON.stringify({ error: { message: 'Saved script detail is temporarily unavailable.' } }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, { initialEntries: ['/scripts'] });

    const explorer = screen.getByLabelText('Section explorer');
    await user.click(await within(explorer).findByRole('button', { name: 'Open script Health status assertions' }));

    expect(await screen.findByText('Scripts library is degraded')).toBeInTheDocument();
    expect(screen.getByText('Saved scripts could not be loaded cleanly. Saved script detail is temporarily unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('No script selected')).not.toBeInTheDocument();
  });
  it('renders the scripts route copy in Korean when the locale is switched', async () => {
    vi.stubGlobal('fetch', createScriptsFetch());
    renderApp(<AppRouter />, { initialEntries: ['/scripts'], initialLocale: 'ko' });

    expect(screen.getByRole('heading', { name: '스크립트' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '스크립트 목록' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 스크립트' })).toBeInTheDocument();
    expect(screen.getByLabelText('스크립트 검색')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '스크립트 열기 Health status assertions' })).toBeInTheDocument();
  });
});
