/**
 * Program v3.0 — Phase 3: SessionContext.
 * Minimal context providing the current (inert) session for role-aware shell rendering.
 * Does not perform auth; that remains owned by the platform + transport adapter.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { ANONYMOUS_SESSION, type Session } from './session';

export interface SessionContextValue {
  session: Session;
}

const SessionContext = createContext<SessionContextValue>({ session: ANONYMOUS_SESSION });

export function SessionProvider({ session, children }: { session: Session; children: ReactNode }) {
  return <SessionContext.Provider value={{ session }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
