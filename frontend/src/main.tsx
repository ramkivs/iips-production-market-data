/**
 * Program v3.0 — Entry point.
 * Applies theme (light default), boots the Keycloak AuthProvider (real OIDC/PKCE
 * session), and mounts the router. No hardcoded demo session.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { AuthProvider } from './core/auth/AuthProvider';
import { applyTheme } from './core/theme/theme';
import './core/theme/global.css';

applyTheme('light');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
