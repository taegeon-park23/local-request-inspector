import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '@client/app/router/AppRouter';
import { useCapturesStore } from '@client/features/captures/state/captures-store';
import { degradedEmptyHistoryFixtureScenario } from '@client/features/history/data/history-fixtures';
import { useHistoryStore } from '@client/features/history/state/history-store';
import { useRequestDraftStore } from '@client/features/request-builder/state/request-draft-store';
import { renderApp } from '@client/shared/test/render-app';

describe('History S6 observation skeleton', () => {
  it('renders the history list/detail skeleton and result composition tabs', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search history')).toBeInTheDocument();
    expect(screen.getByLabelText('Execution outcome filter')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Open history Create user' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'History detail' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'History result tabs' })).toBeInTheDocument();

    expect(screen.getByText('Succeeded', { selector: '[data-kind="executionOutcome"]' })).toHaveAttribute(
      'data-kind',
      'executionOutcome',
    );
    expect(screen.getByText('200 OK', { selector: '[data-kind="transportOutcome"]' })).toHaveAttribute(
      'data-kind',
      'transportOutcome',
    );
    expect(screen.getByText('All tests passed', { selector: '[data-kind="testSummary"]' })).toHaveAttribute(
      'data-kind',
      'testSummary',
    );
    expect(screen.queryByText('Mocked', { selector: '[data-kind="mockOutcome"]' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Console' }));
    expect(screen.getByRole('heading', { name: 'Console summary' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Tests' }));
    expect(screen.getByRole('heading', { name: 'Tests summary' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Execution Info' }));
    expect(screen.getByRole('heading', { name: 'Execution info' })).toBeInTheDocument();
  });

  it('changes the active detail when a history row is selected', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    const historyList = await screen.findByLabelText('History list');
    await user.click(within(historyList).getByRole('button', { name: 'Open history Load dashboard' }));

    expect(screen.getByText(/GET https:\/\/api.example.com\/dashboard ran from an ad hoc tab/i)).toBeInTheDocument();
    expect(screen.getAllByText('503 Service Unavailable', { selector: '[data-kind="transportOutcome"]' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Some tests failed', { selector: '[data-kind="testSummary"]' }).length).toBeGreaterThan(0);
  });

  it('shows degraded empty-state copy when the fixture scenario is empty', async () => {
    useHistoryStore.getState().applyFixtureScenario(degradedEmptyHistoryFixtureScenario);
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    await waitFor(() => expect(screen.getByText('History observation is degraded')).toBeInTheDocument());
    expect(screen.getByText('No history yet')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No history selected' })).toBeInTheDocument();
  });

  it('keeps history observation separate from capture observation and request draft state', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />, { initialEntries: ['/history'] });

    const historyList = await screen.findByLabelText('History list');
    const initialCaptureSelection = useCapturesStore.getState().selectedCaptureId;

    await user.click(within(historyList).getByRole('button', { name: 'Open history Purge admin cache' }));

    expect(Object.keys(useRequestDraftStore.getState().draftsByTabId)).toHaveLength(0);
    expect(useCapturesStore.getState().selectedCaptureId).toBe(initialCaptureSelection);
    expect(useHistoryStore.getState().selectedHistoryId).toBe('history-4');
  });
});
