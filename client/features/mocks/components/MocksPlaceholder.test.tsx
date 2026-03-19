import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '@client/app/router/AppRouter';
import { useCapturesStore } from '@client/features/captures/state/captures-store';
import { useHistoryStore } from '@client/features/history/state/history-store';
import { emptyMockRuleFixtureScenario } from '@client/features/mocks/data/mock-rule-fixtures';
import { useMocksStore } from '@client/features/mocks/state/mocks-store';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { renderApp } from '@client/shared/test/render-app';

describe('Mocks S7 management skeleton', () => {
  it('renders the mocks list/detail skeleton and shows rule vocabulary without using mock outcome family', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });

    expect(screen.getByRole('heading', { name: 'Mocks' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search rules')).toBeInTheDocument();
    expect(screen.getByLabelText('Rule state filter')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Open mock rule Stripe webhook accepted' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Rule' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mock rule detail' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Mock rule detail tabs' })).toBeInTheDocument();
    expect(screen.getAllByText('Enabled', { selector: '[data-kind="neutral"]' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Priority 10').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/POST \/webhooks\/stripe exact/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Static 202 Accepted payload/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('Mocked', { selector: '[data-kind="mockOutcome"]' })).not.toBeInTheDocument();
    expect(screen.getByText(/Disabled actions here are readiness cues, not broken buttons/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Matchers' }));
    expect(screen.getByRole('heading', { name: 'Matchers' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Response' }));
    expect(screen.getByRole('heading', { name: 'Response' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Diagnostics' }));
    expect(screen.getByRole('heading', { name: 'Diagnostics and deferred work' })).toBeInTheDocument();
  });

  it('changes the active detail when a rule row is selected', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });

    const rulesList = await screen.findByLabelText('Mock rules list');
    await user.click(within(rulesList).getByRole('button', { name: 'Open mock rule Maintenance banner fallback' }));

    expect(screen.getAllByText(/Any method with a \/beta path prefix/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Disabled', { selector: '[data-kind="neutral"]' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Priority 250').length).toBeGreaterThan(0);
  });

  it('opens a local-only draft shell from the New Rule entrypoint', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });

    await user.click(screen.getByRole('button', { name: 'New Rule' }));

    expect(screen.getAllByText('Untitled Mock Rule').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Local draft shell').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Disabled', { selector: '[data-kind="neutral"]' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Create rule' })).toBeDisabled();
  });

  it('shows empty-state copy when the fixture scenario has no rules', async () => {
    useMocksStore.getState().applyFixtureScenario(emptyMockRuleFixtureScenario);
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });

    await waitFor(() => expect(screen.getByText('No mock rules yet')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'No mock rule selected' })).toBeInTheDocument();
    expect(screen.getByText('Persistence is deferred')).toBeInTheDocument();
  });

  it('keeps mock rule management state separate from captures, history, and request drafts', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/mocks'] });

    const initialCaptureSelection = useCapturesStore.getState().selectedCaptureId;
    const initialHistorySelection = useHistoryStore.getState().selectedHistoryId;

    await user.click(screen.getByRole('button', { name: 'New Rule' }));

    expect(Object.keys(useRequestDraftStore.getState().draftsByTabId)).toHaveLength(0);
    expect(useCapturesStore.getState().selectedCaptureId).toBe(initialCaptureSelection);
    expect(useHistoryStore.getState().selectedHistoryId).toBe(initialHistorySelection);
    expect(useMocksStore.getState().selectedRuleId).toBe('mock-rule-draft-1');
  });
});

