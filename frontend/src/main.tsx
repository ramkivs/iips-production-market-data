/**
 * Institutional Investment Platform System (IIPS)
 * Main React DOM Mount Entrypoint (main.tsx)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.js';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
