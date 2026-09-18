/** G-018 A1 — authenticated-scope API/service facade; transport-neutral. */
import { WatchlistAlertPersistence, type PrincipalScope } from './watchlist-alert-persistence';
import type { Alert, AlertAcknowledgement, AlertEvidenceReference, Watchlist, WatchlistMembership, WatchlistRule } from './watchlist-alert-contract';

export class WatchlistAlertApi {
  constructor(private readonly persistence: WatchlistAlertPersistence) {}

  listWatchlists(scope: PrincipalScope): readonly Watchlist[] { return this.persistence.listWatchlists(scope); }
  createWatchlist(scope: PrincipalScope, name: string): Watchlist { return this.persistence.createWatchlist(scope, name); }
  updateWatchlist(scope: PrincipalScope, id: string, name: string): Watchlist { return this.persistence.updateWatchlist(scope, id, name); }
  addMembership(scope: PrincipalScope, id: string, membership: WatchlistMembership) { return this.persistence.addMembership(scope, id, membership); }
  addRule(scope: PrincipalScope, rule: WatchlistRule): WatchlistRule { return this.persistence.addRule(scope, rule); }
  listAlerts(scope: PrincipalScope): readonly Alert[] { return this.persistence.listAlerts(scope); }
  createAlert(scope: PrincipalScope, alert: Alert): Alert { return this.persistence.createAlert(scope, alert); }
  acknowledgeAlert(scope: PrincipalScope, acknowledgement: AlertAcknowledgement): Alert { return this.persistence.acknowledgeAlert(scope, acknowledgement); }
  addEvidenceReference(scope: PrincipalScope, reference: AlertEvidenceReference): AlertEvidenceReference { return this.persistence.addEvidenceReference(scope, reference); }
}
