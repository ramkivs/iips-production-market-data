/**
 * Institutional Investment Platform System (IIPS)
 * Main React DOM Mount Entrypoint (main.tsx)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 *                 Phase-1B Authority Decision (shell mount + BI-08 portfolio route)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ PHASE-1B MOUNT ═══════════════════════════════════════════════════════════════════════
 *  Boots the recovered full-IIPS application shell:
 *
 *      main.tsx -> BrowserRouter -> SessionProvider -> App -> AppShell
 *                                                             ├── TopBar
 *                                                             ├── Sidebar
 *                                                             └── /portfolio -> BI-08
 *                                                                 PortfolioWorkspace
 *
 * ══ DELIBERATE EXCLUSIONS FROM THE HISTORICAL ENTRYPOINT ═════════════════════════════════
 *  The historical main.tsx (baseline tree 682f4e60, ref origin/arena/01a0c440) performed
 *  three additional boot steps. ALL THREE ARE INTENTIONALLY NOT REPRODUCED:
 *
 *    1. `<AuthProvider>` — booted a real Keycloak OIDC/PKCE session. Excluded: the target
 *       application has no client-side authentication and no authenticated transport.
 *       Reintroducing it would cross the fail-closed production identity boundary.
 *       (Preserves the Phase-1A F-a decision; the seam remains TopBar's optional onSignOut.)
 *
 *    2. `applyTheme('light')` — wrote the historical token set onto document.documentElement
 *       as :root CSS variables. Excluded: that is the global-reset/global-theme vector the
 *       Phase-1A CSS mitigation exists to prevent. Tokens are instead scoped to `.app-shell`
 *       in index.css, so BI surfaces are unaffected. `core/theme/theme.ts` is retained as a
 *       recovered artifact but is deliberately NEVER INVOKED.
 *
 *    3. `import './core/theme/global.css'` — the historical global reset (bare * / html /
 *       body / a, light theme). Excluded for the same reason; index.css remains the single
 *       stylesheet and was appended to, never replaced.
 *
 *  SESSION: ANONYMOUS_SESSION is the recovered model's own documented default
 *  (`authenticated: false`, role `viewer`, tenant `system`). It is display-only and is NEVER
 *  an authorization authority. No identity, credential, companyId or privileged role is
 *  fabricated here — D115 remains untouched and UNRESOLVED.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App.js';
import { SessionProvider } from './core/session/SessionContext.js';
import { ANONYMOUS_SESSION } from './core/session/session.js';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <SessionProvider session={ANONYMOUS_SESSION}>
          <App />
        </SessionProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
