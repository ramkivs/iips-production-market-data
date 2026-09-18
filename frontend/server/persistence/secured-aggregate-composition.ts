import type { Principal } from '../../../iips-platform/src/distributed/EnterpriseRuntime';
import { createProductionAggregatePersistenceBootstrap, type AggregatePersistenceBootstrap, type TrustedAggregateContext } from './aggregate-persistence-bootstrap';
import { PersistenceService } from './persistence-service';

/**
 * Composition seam after an existing SecuredExecutor authorization decision.
 * It accepts only the trusted Principal produced by that boundary.
 */
export function createAggregateBootstrapFromAuthorizedPrincipal<T>(
  principal: Principal,
  journal: PersistenceService,
  clock?: () => string,
  idFactory?: () => string,
): AggregatePersistenceBootstrap<T> {
  const context: TrustedAggregateContext = { tenantId: principal.tenantId, userId: principal.userId };
  return createProductionAggregatePersistenceBootstrap<T>(context, journal, clock, idFactory);
}
