import type { Principal } from '../../../iips-platform/src/distributed/EnterpriseRuntime';
import { AggregateMutationError, type MutationInput, type MutationResult, type MultiMutationInput } from './aggregate-persistence';
import { createProductionDomainNeutralAggregateCaller, DomainNeutralAggregateCaller } from './domain-neutral-aggregate-caller';
import { PersistenceService } from './persistence-service';

/** Existing trusted server context produced by SecuredExecutor; this boundary does not derive it. */
export type TrustedAggregateContext = Pick<Principal, 'tenantId' | 'userId'>;

/** Domain-neutral bootstrap owner: binds an already-trusted scope to the generic caller. */
export class AggregatePersistenceBootstrap<T> {
  constructor(
    readonly context: TrustedAggregateContext,
    private readonly caller: DomainNeutralAggregateCaller<T>,
  ) {}

  read(aggregateId: string) { return this.caller.read(this.context.tenantId, this.context.userId, aggregateId); }

  mutate(input: MutationInput<T>): MutationResult<T> {
    this.assertScope(input.tenantId, input.ownerUserId);
    return this.caller.mutate(input);
  }

  mutateMany(inputs: readonly MultiMutationInput<T>[]): readonly MutationResult<T>[] {
    for (const input of inputs) this.assertScope(input.tenantId, input.ownerUserId);
    return this.caller.mutateMany(inputs);
  }

  historyFor(aggregateId: string) { return this.caller.historyFor(this.context.tenantId, this.context.userId, aggregateId); }
  recover() { this.caller.recoverScope(this.context.tenantId, this.context.userId); }

  private assertScope(tenantId: string, ownerUserId: string): void {
    if (tenantId !== this.context.tenantId || ownerUserId !== this.context.userId) throw new AggregateMutationError('TENANT_SCOPE_DENIED', 'aggregate is outside the trusted scope');
  }
}

/** Production bootstrap using the existing PersistenceService and composition point. */
export function createProductionAggregatePersistenceBootstrap<T>(
  context: TrustedAggregateContext,
  journal: PersistenceService,
  clock?: () => string,
  idFactory?: () => string,
): AggregatePersistenceBootstrap<T> {
  return new AggregatePersistenceBootstrap(context, createProductionDomainNeutralAggregateCaller<T>(journal, clock, idFactory));
}
