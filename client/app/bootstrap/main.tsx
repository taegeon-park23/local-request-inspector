import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from '@client/app/providers/AppProviders';
import { AppRouter } from '@client/app/router/AppRouter';
import '@client/app/shell/shell.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>,
);
