import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from '@client/app/providers/AppProviders';
import { AppRouter } from '@client/app/router/AppRouter';
import { applyMaterialTheme } from '@client/shared/ui/theme/material-theme';
import '@client/app/shell/shell.css';
import '@client/app/shell/material-theme.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

applyMaterialTheme();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>,
);
