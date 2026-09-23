/**
 * Institutional Investment Platform System (IIPS)
 * Security Master Surface — F-3, UI08_SECURITY_MASTER functional mount
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 *                 f3-ui08-security-master-functional-2026-09-23-001 (F-3 authority act)
 *                 AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001 (D05 data)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * ══ WHAT THIS SURFACE IS ══════════════════════════════════════════════════════════════════
 *  The first functional surface beyond Portfolio authorized after the offline full-shell
 *  restoration: governed D05 identity resolution at /security-master, using the EXISTING
 *  UI08SecurityMasterModalBuilder (Contract C7 / AD-15) and the EXISTING in-process
 *  ObjectResolverService bound to the governed D05 broad security master (2,250 canonical
 *  entities, manifest BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001).
 *
 * ══ DESIGN CONTRACTS (F-3 act §2) ═════════════════════════════════════════════════════════
 *  · NO new identity resolver — resolution flows exclusively through the governed D05
 *    machinery (SecurityMaster -> IdentityMappingStore -> quarantine). Nothing here may
 *    fabricate, fuzzy-match, or promote an identity.
 *  · NO duplication of D05 data — the surface binds the App-injected master or the cached
 *    governed singleton (getGovernedBroadSecurityMaster).
 *  · FAIL-CLOSED: an unmapped or ambiguous identifier renders an explicit error state
 *    carrying the quarantine record (IdentityAmbiguityError). No canonical id, name, or
 *    descriptor is ever displayed for a failed resolution.
 *  · DEEP-LINKABLE: the query lives in the URL (?type=…&value=…&asOf=…), so any resolution
 *    is shareable and re-executable offline. No network, no API, no auth — ever.
 *  · The UI08 view model's accessibility contract (dialog role, aria-live assertive,
 *    focus element, table caption) and responsive tiers are rendered as defined by the
 *    builder — not re-invented here.
 */

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SecurityMaster,
  getGovernedBroadSecurityMaster,
  IdentityAmbiguityError,
  type IdentityQuery,
} from '../../../../src/identity/index.js';
import { ObjectResolverService } from '../../../../src/transports/object_resolver.js';
import { UI08SecurityMasterModalBuilder } from '../../../../src/ui/view_models/ui08_security_master_modal.js';
import type { UI08SecurityMasterModalViewModel } from '../../../../src/ui/types.js';
import { DataTable, type Column } from '../../components/data/DataComponents.js';
import { EmptyState } from '../../components/state/StateComponents.js';
import { CertifiedBadge } from '../../components/ui/Badges.js';

export interface SecurityMasterSurfaceProps {
  /**
   * Governed D05 security master. Optional: defaults to the cached governed broad
   * universe singleton (2,250 entities) — the same instance the application injects
   * into the BI-08 workspace. No local/secondary master is ever constructed here.
   */
  securityMaster?: SecurityMaster;
  /** Viewport width forwarded to the UI08 responsive engine (builder default 1280). */
  viewportWidth?: number;
}

type Listing = UI08SecurityMasterModalViewModel['resolution']['listings'][number];

const IDENTIFIER_TYPES: readonly IdentityQuery['identifierType'][] = [
  'NSE_SYMBOL',
  'BSE_SYMBOL',
  'ISIN',
  'CIN',
  'COMPOSITE_TICKER',
];

const LISTING_COLUMNS: readonly Column<Listing>[] = [
  { key: 'exchange', header: 'Exchange', render: (r) => r.exchange },
  { key: 'symbol', header: 'Symbol', render: (r) => r.symbol },
  { key: 'status', header: 'Status', render: (r) => r.status },
  { key: 'lotSize', header: 'Lot Size', render: (r) => String(r.lotSize) },
  { key: 'tickSize', header: 'Tick Size', render: (r) => String(r.tickSize) },
];

/** Parse the governed query from the URL (single source of truth for the resolution). */
function queryFromParams(params: URLSearchParams): IdentityQuery | null {
  const type = params.get('type');
  const value = params.get('value');
  if (!type || !value) return null;
  if (!IDENTIFIER_TYPES.includes(type as IdentityQuery['identifierType'])) return null;
  const asOf = params.get('asOf') ?? undefined;
  return { identifierType: type as IdentityQuery['identifierType'], identifierValue: value, asOf };
}

export function SecurityMasterSurface({
  securityMaster,
  viewportWidth,
}: SecurityMasterSurfaceProps) {
  // Governed binding: the injected master (App singleton) or the cached governed broad
  // master. NEVER a locally-constructed or synthetic master.
  const master = securityMaster ?? getGovernedBroadSecurityMaster();
  const resolverService = useMemo(() => new ObjectResolverService(master), [master]);

  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => queryFromParams(searchParams), [searchParams]);

  // Form state (client-side only; submit writes the URL, which drives the resolution).
  const [formType, setFormType] = useState<IdentityQuery['identifierType']>('NSE_SYMBOL');
  const [formValue, setFormValue] = useState('');

  // Pure, synchronous, offline resolution through the EXISTING builder + resolver.
  // Fail-closed: IdentityAmbiguityError (unmapped OR ambiguous collision) renders the
  // explicit quarantine state — never a fabricated or ticker-only identity.
  const resolution = useMemo<{
    vm: UI08SecurityMasterModalViewModel | null;
    failure: IdentityAmbiguityError | null;
  }>(() => {
    if (!query) return { vm: null, failure: null };
    try {
      return {
        vm: UI08SecurityMasterModalBuilder.build({
          query,
          resolverService,
          isModalOpen: true,
          viewportWidth,
        }),
        failure: null,
      };
    } catch (e) {
      if (e instanceof IdentityAmbiguityError) return { vm: null, failure: e };
      throw e;
    }
  }, [query, resolverService, viewportWidth]);

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!formValue.trim()) return;
    const next = new URLSearchParams();
    next.set('type', formType);
    next.set('value', formValue.trim());
    setSearchParams(next, { replace: true });
  };

  return (
    <section className="app-surface" aria-labelledby="security-master-heading">
      <header className="app-surface__header">
        <h2 id="security-master-heading" className="app-surface__title">
          Security Master — Governed Identity Resolution
        </h2>
        <div className="app-surface__meta">
          <CertifiedBadge />
          <span data-testid="security-master-source">D05 Governed Broad Universe (2,250 entities)</span>
        </div>
      </header>
      <p className="app-surface__subtitle">
        Canonical object resolution against the governed D05 security master. Unmapped and
        ambiguous identifiers fail closed with a quarantine record — no identity is ever
        fabricated, fuzzy-matched, or promoted.
      </p>

      {/* Deep-linkable query form: submit writes the URL; the URL drives the resolution. */}
      <form onSubmit={submit} data-testid="security-master-query-form" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label htmlFor="security-master-type" style={{ fontSize: 13 }}>Identifier type</label>
        <select
          id="security-master-type"
          value={formType}
          onChange={(e) => setFormType(e.target.value as IdentityQuery['identifierType'])}
          style={{ padding: '4px 8px' }}
        >
          {IDENTIFIER_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <label htmlFor="security-master-value" style={{ fontSize: 13 }}>Identifier</label>
        <input
          id="security-master-value"
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="e.g. INFY, EQ symbol, ISIN, CIN"
          style={{ padding: '4px 8px', minWidth: 220 }}
        />
        <button type="submit" data-testid="security-master-resolve">Resolve</button>
      </form>

      {!query && (
        <div data-testid="security-master-empty" style={{ marginTop: 16 }}>
          <EmptyState label="No identifier queried. Enter an identifier to resolve it against the governed D05 master. No data is fetched and none is fabricated." />
        </div>
      )}

      {query && resolution.failure && (
        <div
          data-testid="security-master-fail-closed"
          role="alert"
          style={{ marginTop: 16, border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, background: 'var(--color-surface-1)' }}
        >
          <strong data-testid="security-master-fail-reason">
            Resolution failed — {resolution.failure.quarantineRecord.reason}
          </strong>
          <p style={{ fontSize: 13, marginTop: 4 }} data-testid="security-master-quarantine-details">
            {resolution.failure.quarantineRecord.details}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
            Quarantined (record {resolution.failure.quarantineRecord.quarantineId}). The identifier
            is NOT mapped in the governed D05 master, so no canonical identity, name, or
            descriptor is displayed. This failure is honest and final — no fuzzy matching,
            no fallback, no fabrication.
          </p>
        </div>
      )}

      {query && resolution.vm && (
        <div
          data-testid="security-master-resolution"
          role={resolution.vm.accessibility.ariaRole}
          aria-live={resolution.vm.accessibility.ariaLive}
          aria-label="Security master resolution details"
          style={{ marginTop: 16 }}
        >
          {/* UI08 contract: the resolution modal's focus target (focus trap semantics). */}
          <button
            type="button"
            id={resolution.vm.accessibility.focusElementId}
            data-testid="ui08-modal-close-btn"
            autoFocus
            onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
            style={{ float: 'right' }}
          >
            Close
          </button>
          <div className="app-surface__meta" data-testid="security-master-canonical">
            <span data-testid="security-master-company-id"><strong>{resolution.vm.companyId}</strong></span>
            <span data-testid="security-master-company-name">{resolution.vm.companyName}</span>
            <span data-testid="ui08-responsive-tier" data-resp-tier={resolution.vm.responsiveLayout.tier}>
              {resolution.vm.responsiveLayout.tier} · {resolution.vm.responsiveLayout.columns} col
            </span>
          </div>
          <div role="region" aria-label={resolution.vm.accessibility.tableCaption}>
            <DataTable
              columns={[
                { key: 'field', header: 'Field', render: (r) => r.field },
                { key: 'value', header: 'Governed value', render: (r) => r.value },
              ] as readonly Column<{ field: string; value: string }>[]}
              rows={[
                { field: 'Canonical Company ID', value: resolution.vm.resolution.companyId },
                { field: 'Company Name', value: resolution.vm.resolution.companyName },
                { field: 'ISIN', value: resolution.vm.resolution.isin },
                { field: 'CIN', value: resolution.vm.resolution.cin ?? '—' },
                { field: 'Industry', value: resolution.vm.resolution.industry },
                { field: 'Sector', value: resolution.vm.resolution.sector },
                { field: 'Face Value', value: String(resolution.vm.resolution.faceValue) },
                { field: 'Currency', value: resolution.vm.resolution.currency },
                { field: 'As of', value: resolution.vm.asOf },
                { field: 'Source Classification', value: resolution.vm.provenance.sourceClassification },
                { field: 'Lineage Digest', value: resolution.vm.provenance.lineageDigest },
              ]}
            />
          </div>
          <div role="region" aria-label="Exchange Listings (governed)">
            <DataTable columns={LISTING_COLUMNS} rows={resolution.vm.resolution.listings} />
          </div>
          <p className="app-surface__note" data-testid="security-master-provenance-note">
            Resolved locally from the governed D05 broad security master. Provenance and
            lineage digest are computed by the governed resolver — never synthesized here.
          </p>
        </div>
      )}
    </section>
  );
}
