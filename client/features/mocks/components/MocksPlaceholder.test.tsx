import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppRouter } from '@client/app/router/AppRouter';
import { useCapturesStore } from '@client/features/captures/state/captures-store';
import { useHistoryStore } from '@client/features/history/state/history-store';
import { defaultMockRuleFixtureRecords } from '@client/features/mocks/data/mock-rule-fixtures';
import type { MockRuleRecord } from '@client/features/mocks/mock-rule.types';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { renderApp } from '@client/shared/test/render-app';

function createApiResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createApiError(message: string, status = 500) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'mock_rule_query_failed',
        message,
        retryable: false,
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
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

function cloneRule<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function summarizeRule(rule: {
  id: string;
  workspaceId: string;
  name: string;
  enabled: boolean;
  priority: number;
  methodMode: 'any' | 'exact';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  pathMode: 'exact' | 'prefix';
  pathValue: string;
  queryMatchers: Array<{ id: string; key: string; operator: 'exists' | 'equals' | 'contains'; value: string; enabled: boolean }>;
  headerMatchers: Array<{ id: string; key: string; operator: 'exists' | 'equals' | 'contains'; value: string; enabled: boolean }>;
  bodyMatcherMode: 'none' | 'exact' | 'contains';
  bodyMatcherValue: string;
  responseStatusCode: number;
  responseHeaders: Array<{ id: string; key: string; value: string; enabled: boolean }>;
  responseBody: string;
  fixedDelayMs: number;
  createdAt: string;
  updatedAt: string;
}): MockRuleRecord {
  const enabledRows = (rows: Array<{ key: string; operator?: string; value: string; enabled: boolean }>) =>
    rows.filter((row) => row.enabled !== false && row.key.trim().length > 0);
  const summarizeRows = (rows: Array<{ key: string; operator?: string; value: string; enabled: boolean }>, emptyLabel: string) => {
    const activeRows = enabledRows(rows);
    if (activeRows.length === 0) {
      return emptyLabel;
    }

    return activeRows.map((row) => {
      if (row.operator === 'exists') {
        return `${row.key} exists`;
      }
      if (row.operator === 'contains') {
        return `${row.key} contains ${row.value}`;
      }
      if (row.operator === 'equals') {
        return `${row.key} equals ${row.value}`;
      }
      return row.key;
    }).join(' · ');
  };

  const methodSummary = rule.methodMode === 'any' ? 'Method: any' : `Method exact: ${rule.method}`;
  const pathSummary = rule.pathMode === 'prefix' ? `Path prefix: ${rule.pathValue}` : `Path exact: ${rule.pathValue}`;
  const querySummary = summarizeRows(rule.queryMatchers, 'No query matcher');
  const headerSummary = summarizeRows(rule.headerMatchers, 'No header matcher');
  const bodySummary = rule.bodyMatcherMode === 'none'
    ? 'No body matcher'
    : rule.bodyMatcherMode === 'contains'
      ? `Body contains: ${rule.bodyMatcherValue}`
      : `Body exact: ${rule.bodyMatcherValue}`;

  return {
    ...rule,
    ruleState: rule.enabled ? 'Enabled' : 'Disabled',
    matcherSummary: [methodSummary, pathSummary, querySummary, headerSummary, bodySummary].join(' with '),
    responseSummary: `Static ${rule.responseStatusCode} response${rule.fixedDelayMs > 0 ? ` with ${rule.fixedDelayMs} ms fixed delay` : ''}.`,
    methodSummary,
    pathSummary,
    querySummary,
    headerSummary,
    bodySummary,
    responseStatusSummary: String(rule.responseStatusCode),
    responseHeadersSummary: enabledRows(rule.responseHeaders).length === 0 ? 'No static response headers' : `${enabledRows(rule.responseHeaders).length} static response header${enabledRows(rule.responseHeaders).length === 1 ? '' : 's'}`,
    responseBodyPreview: rule.responseBody,
    fixedDelayLabel: rule.fixedDelayMs > 0 ? `Fixed delay: ${rule.fixedDelayMs} ms` : 'No fixed delay',
    diagnosticsSummary: 'Rules are evaluated by enabled state, explicit priority, matcher specificity, and a stable tie-breaker.',
    deferredSummary: 'Script-assisted matcher/response authoring and scenario state remain deferred.',
    sourceLabel: 'Persisted workspace rule',
  };
}

type PersistedMockRuleShape = Parameters<typeof summarizeRule>[0];

function createMockRulesFetch(initialRules = defaultMockRuleFixtureRecords) {
  let rules = initialRules.map((rule) => cloneRule(rule));
  let nextRuleSequence = rules.length + 1;

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = getUrl(input);
    const method = init?.method ?? 'GET';

    if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
      return createApiResponse({ items: [] });
    }

    if (url === '/api/workspaces/local-workspace/mock-rules' && method === 'GET') {
      return createApiResponse({ items: rules });
    }

    if (url === '/api/workspaces/local-workspace/mock-rules' && method === 'POST') {
      const payload = JSON.parse(String(init?.body ?? '{}')) as {
        rule: Omit<PersistedMockRuleShape, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>;
      };
      const now = '2026-03-20T12:00:00.000Z';
      const nextRule = summarizeRule({
        id: `mock-rule-${nextRuleSequence}`,
        workspaceId: 'local-workspace',
        createdAt: now,
        updatedAt: now,
        ...payload.rule,
      });

      nextRuleSequence += 1;
      rules = [nextRule, ...rules];
      return createApiResponse({ rule: nextRule });
    }

    if (url.startsWith('/api/mock-rules/') && url.endsWith('/resource-bundle') && method === 'GET') {
      const mockRuleId = url.split('/')[3] ?? '';
      const rule = rules.find((item) => item.id === mockRuleId);
      return rule
        ? createApiResponse({
          bundle: {
            schemaVersion: 1,
            resourceKind: 'local-request-inspector-authored-resource-bundle',
            exportedAt: '2026-03-21T12:00:00.000Z',
            workspaceId: 'local-workspace',
            requests: [],
            mockRules: [rule],
          },
        })
        : createApiError(`Mock rule ${mockRuleId} was not found.`, 404);
    }

    if (url.startsWith('/api/mock-rules/') && method === 'GET') {
      const mockRuleId = url.split('/').pop() ?? '';
      const rule = rules.find((item) => item.id === mockRuleId);
      return rule
        ? createApiResponse({ rule })
        : createApiError(`Mock rule ${mockRuleId} was not found.`, 404);
    }

    if (url.startsWith('/api/mock-rules/') && method === 'PATCH') {
      const mockRuleId = url.split('/')[3] ?? '';
      const existingRule = rules.find((item) => item.id === mockRuleId);
      if (!existingRule) {
        return createApiError(`Mock rule ${mockRuleId} was not found.`, 404);
      }

      const payload = JSON.parse(String(init?.body ?? '{}')) as {
        rule: Omit<PersistedMockRuleShape, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>;
      };
      const updatedRule = summarizeRule({
        ...existingRule,
        ...payload.rule,
        updatedAt: '2026-03-20T12:05:00.000Z',
      });

      rules = rules.map((item) => item.id === updatedRule.id ? updatedRule : item);
      return createApiResponse({ rule: updatedRule });
    }

    if (url.endsWith('/enable') && method === 'POST') {
      const mockRuleId = url.split('/')[3] ?? '';
      const existingRule = rules.find((item) => item.id === mockRuleId);
      if (!existingRule) {
        return createApiError(`Mock rule ${mockRuleId} was not found.`, 404);
      }

      const updatedRule = summarizeRule({
        ...existingRule,
        enabled: true,
        updatedAt: '2026-03-20T12:10:00.000Z',
      });

      rules = rules.map((item) => item.id === updatedRule.id ? updatedRule : item);
      return createApiResponse({ rule: updatedRule });
    }

    if (url.endsWith('/disable') && method === 'POST') {
      const mockRuleId = url.split('/')[3] ?? '';
      const existingRule = rules.find((item) => item.id === mockRuleId);
      if (!existingRule) {
        return createApiError(`Mock rule ${mockRuleId} was not found.`, 404);
      }

      const updatedRule = summarizeRule({
        ...existingRule,
        enabled: false,
        updatedAt: '2026-03-20T12:10:00.000Z',
      });

      rules = rules.map((item) => item.id === updatedRule.id ? updatedRule : item);
      return createApiResponse({ rule: updatedRule });
    }

    if (url.startsWith('/api/mock-rules/') && method === 'DELETE') {
      const mockRuleId = url.split('/')[3] ?? '';
      rules = rules.filter((item) => item.id !== mockRuleId);
      return createApiResponse({ deletedRuleId: mockRuleId });
    }

    throw new Error(`Unexpected fetch call: ${method} ${url}`);
  });
}

describe('Mocks S16 persisted CRUD surface', () => {
  it('renders persisted mock rules without collapsing rule state into mock outcome family', async () => {
    vi.stubGlobal('fetch', createMockRulesFetch());
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });

    expect(screen.getByRole('heading', { name: 'Mocks' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search rules')).toBeInTheDocument();
    expect(screen.getByLabelText('Rule state filter')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Open mock rule Stripe webhook accepted' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save rule' })).toBeEnabled();
    expect(screen.getByText(/Persisted authored rules live here/i)).toBeInTheDocument();
    expect(screen.getByText(/Runtime mock outcomes remain in Captures/i)).toBeInTheDocument();
    expect(screen.getAllByText('Enabled', { selector: '[data-kind="neutral"]' }).length).toBeGreaterThan(0);
    expect(screen.queryByText('Mocked', { selector: '[data-kind="mockOutcome"]' })).not.toBeInTheDocument();
  });

  it('creates and updates a persisted mock rule from the New Rule entrypoint', async () => {
    const user = userEvent.setup();
    const fetchMock = createMockRulesFetch();
    vi.stubGlobal('fetch', fetchMock);
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });

    await screen.findByRole('button', { name: 'Open mock rule Stripe webhook accepted' });
    await user.click(screen.getByRole('button', { name: 'New Rule' }));

    expect(screen.getByRole('heading', { name: 'Create mock rule' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create rule' })).toBeDisabled();

    await user.type(screen.getByLabelText('Rule name'), 'Health fallback');
    await user.type(screen.getByLabelText('Path value'), '/health');

    expect(screen.getByRole('button', { name: 'Create rule' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Create rule' }));

    expect(await screen.findByRole('button', { name: 'Open mock rule Health fallback' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit mock rule' })).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Rule name'));
    await user.type(screen.getByLabelText('Rule name'), 'Health fallback updated');
    await user.click(screen.getByRole('button', { name: 'Save rule' }));

    expect(await screen.findByRole('button', { name: 'Open mock rule Health fallback updated' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input, init]) => getUrl(input as RequestInfo | URL) === '/api/workspaces/local-workspace/mock-rules' && (init?.method ?? 'GET') === 'POST')).toBe(true);
    expect(fetchMock.mock.calls.some(([input, init]) => getUrl(input as RequestInfo | URL).includes('/api/mock-rules/') && init?.method === 'PATCH')).toBe(true);
  });

  it('supports enable, disable, and delete for persisted rules with stable ordering and selection fallback', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createMockRulesFetch());
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });

    const rulesList = screen.getByLabelText('Mock rules list');
    await screen.findByRole('button', { name: 'Open mock rule Stripe webhook accepted' });

    const getRuleOrder = () => within(rulesList)
      .getAllByRole('button', { name: /^Open mock rule / })
      .map((button) => button.getAttribute('aria-label'));

    expect(getRuleOrder()).toEqual([
      'Open mock rule Stripe webhook accepted',
      'Open mock rule Maintenance banner fallback',
    ]);

    await user.click(screen.getByRole('button', { name: 'Disable rule' }));
    expect(await screen.findAllByText('Disabled', { selector: '[data-kind="neutral"]' })).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Enable rule' })).toBeEnabled();
    expect(getRuleOrder()).toEqual([
      'Open mock rule Maintenance banner fallback',
      'Open mock rule Stripe webhook accepted',
    ]);

    await user.click(screen.getByRole('button', { name: 'Enable rule' }));
    expect(await screen.findAllByText('Enabled', { selector: '[data-kind="neutral"]' })).not.toHaveLength(0);
    expect(getRuleOrder()).toEqual([
      'Open mock rule Stripe webhook accepted',
      'Open mock rule Maintenance banner fallback',
    ]);

    await user.click(within(rulesList).getByRole('button', { name: 'Open mock rule Maintenance banner fallback' }));
    await user.click(screen.getByRole('button', { name: 'Delete rule' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Open mock rule Maintenance banner fallback' })).not.toBeInTheDocument());
    expect(getRuleOrder()).toEqual(['Open mock rule Stripe webhook accepted']);
    expect(screen.getByText('Stripe webhook accepted')).toBeInTheDocument();
  });

  it('shows the empty state from the real query seam', async () => {
    const emptyFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/mock-rules' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', emptyFetch);
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });
    expect(await screen.findByText('No mock rules yet')).toBeInTheDocument();
  });

  it('shows the degraded state when the mock rules query fails', async () => {
    const degradedFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getUrl(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/workspaces/local-workspace/requests' && method === 'GET') {
        return createApiResponse({ items: [] });
      }

      if (url === '/api/workspaces/local-workspace/mock-rules' && method === 'GET') {
        return createApiError('Mock rule query failed');
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', degradedFetch);
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });
    expect(await screen.findByText('Mock rules are degraded')).toBeInTheDocument();
  });

  it('exports a single mock rule bundle without runtime observation artifacts', async () => {
    const user = userEvent.setup();
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:single-mock-rule-bundle');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    vi.stubGlobal('fetch', createMockRulesFetch());
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });

    await screen.findByRole('button', { name: 'Open mock rule Stripe webhook accepted' });
    await user.click(screen.getByRole('button', { name: 'Export rule' }));

    expect(await screen.findByText(/Exported Stripe webhook accepted from the authored resource lane/i)).toBeInTheDocument();
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(linkClickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:single-mock-rule-bundle');

    const exportedBlob = createObjectURLSpy.mock.calls[0]?.[0];
    expect(exportedBlob).toBeInstanceOf(Blob);

    if (!(exportedBlob instanceof Blob)) {
      throw new Error('Single mock-rule export did not create a Blob.');
    }

    const exportedText = await exportedBlob.text();
    expect(exportedText).toContain('"mockRules"');
    expect(exportedText).toContain('"Stripe webhook accepted"');
    expect(exportedText).not.toContain('executionHistories');
    expect(exportedText).not.toContain('capturedRequests');
  });

  it('keeps mocks management state separate from captures, history, and request drafts', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createMockRulesFetch());
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });

    const initialCaptureSelection = useCapturesStore.getState().selectedCaptureId;
    const initialHistorySelection = useHistoryStore.getState().selectedHistoryId;

    await screen.findByRole('button', { name: 'Open mock rule Stripe webhook accepted' });
    await user.click(screen.getByRole('button', { name: 'New Rule' }));
    await user.type(screen.getByLabelText('Rule name'), 'Isolation check');
    await user.type(screen.getByLabelText('Path value'), '/isolation');
    await user.click(screen.getByRole('button', { name: 'Create rule' }));

    expect(Object.keys(useRequestDraftStore.getState().draftsByTabId)).toHaveLength(0);
    expect(useCapturesStore.getState().selectedCaptureId).toBe(initialCaptureSelection);
    expect(useHistoryStore.getState().selectedHistoryId).toBe(initialHistorySelection);
  });
});

