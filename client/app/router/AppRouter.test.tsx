import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '@client/app/router/AppRouter';
import { renderApp } from '@client/shared/test/render-app';

describe('AppRouter shell bootstrap', () => {
  it('renders the persistent shell regions and nav labels', () => {
    renderApp(<AppRouter />);

    expect(screen.getByLabelText('Top bar')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigation rail')).toBeInTheDocument();
    expect(screen.getByLabelText('Section explorer')).toBeInTheDocument();
    expect(screen.getByLabelText('Main work surface')).toBeInTheDocument();
    expect(screen.getByLabelText('Contextual detail panel')).toBeInTheDocument();

    for (const label of ['Workspace', 'Captures', 'History', 'Mocks', 'Environments', 'Scripts', 'Settings']) {
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }
  });

  it('switches top-level placeholder sections from the navigation rail', async () => {
    const user = userEvent.setup();
    renderApp(<AppRouter />);

    expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /captures/i }));
    expect(screen.getByRole('heading', { name: 'Captures' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /history/i }));
    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /settings/i }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });
});
