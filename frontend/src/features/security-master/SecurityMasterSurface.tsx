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
 *
 * ══ HONEST DISCLOSURE (PA decision 2026-10-19-01 C1–C7; implementation act 2026-10-19-01) ══
 *  · Record origin is rendered as UNKNOWN — never REAL. Successful resolution, a valid ISIN
 *    or corpus membership does not establish real-market status (C1/C2/C5).
 *  · Missing or invalid face value / currency are rendered as such — never a default (C4).
 *  · A historical asOf scopes identity only; the descriptor and listings shown are the current
 *    governed snapshot and are labelled as NOT historically verified (§5.1).
 *  · Consumer eligibility is not asserted here; each consumer decides its own admission (C6).
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
type Resolution = UI08SecurityMasterModalViewModel['resolution'];
type DescriptorFieldStatus = Resolution['integrity']['descriptor']['faceValue'];

/** Render a descriptor attribute without ever substituting a value the source did not provide. */
function describeDescriptor(value: string | number | null, status: DescriptorFieldStatus): string {
  if (status === 'SOURCE_PROVIDED' && value !== null) return String(value);
  if (status === 'MISSING') return 'Not provided by source (missing — no default substituted)';
  return 'Invalid or unsupported in source (not displayed — no default substituted)';
}

function describeTemporal(r: Resolution): string {
  const t = r.integrity.temporal;
  switch (t.descriptorStatus) {
    case 'CURRENT_SNAPSHOT':
      return 'Current governed snapshot (descriptor and listings are not versioned)';
    case 'AS_OF_NOT_VERSIONED':
      return `Current governed snapshot — NOT historically verified for ${t.identityAsOf}; historical descriptor and listing values are unavailable`;
    case 'OUTSIDE_RECORD_EFFECTIVE_WINDOW':
      return `Current governed snapshot — the resolved record is NOT effective at ${t.identityAsOf}; identity resolved via an effective-dated mapping, descriptor and listings are present-day values, not historical`;
  }
}

function describeRevision(r: Resolution): string {
  const rev = r.integrity.sourceRevision;
  if (!rev) return 'None — not hydrated from a governed deposition';
  return `${rev.batchId} · sha256 ${rev.fileChecksumSha256.slice(0, 12)}… · ${rev.recordCount} records · ${rev.operatingMode}`;
}

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
                {
                  field: 'Face Value',
                  value: describeDescriptor(resolution.vm.resolution.faceValue, resolution.vm.resolution.integrity.descriptor.faceValue),
                },
                {
                  field: 'Currency',
                  value: describeDescriptor(resolution.vm.resolution.currency, resolution.vm.resolution.integrity.descriptor.currency),
                },
                { field: 'Identity As of', value: resolution.vm.asOf },
                { field: 'Descriptor Temporal Basis', value: describeTemporal(resolution.vm.resolution) },
                { field: 'Source Classification', value: resolution.vm.provenance.sourceClassification },
                {
                  field: 'Record Origin',
                  value: 'Unknown — no record-specific origin evidence; not asserted as real-market or synthetic',
                },
                {
                  field: 'Descriptor Quality',
                  value:
                    resolution.vm.provenance.quality +
                    (resolution.vm.resolution.integrity.qualityAnomalyCodes.length > 0
                      ? ` (${resolution.vm.resolution.integrity.qualityAnomalyCodes.join(', ')})`
                      : ''),
                },
                { field: 'Governed Source Revision', value: describeRevision(resolution.vm.resolution) },
                { field: 'Consumer Eligibility', value: 'Not asserted by IPD — each consumer decides its own admission' },
                { field: 'Lineage Digest', value: resolution.vm.provenance.lineageDigest },
              ]}
            />
          </div>
          <div role="region" aria-label="Exchange Listings (current governed snapshot; not effective-dated)">
            <DataTable columns={LISTING_COLUMNS} rows={resolution.vm.resolution.listings} />
          </div>
          <p className="app-surface__note" data-testid="security-master-provenance-note">
            Resolved locally from the governed D05 broad security master. Provenance and
            lineage digest are computed by the governed resolver — never synthesized here.
          </p>
          <p className="app-surface__note" data-testid="security-master-origin-disclosure">
            Non-production, offline-bootstrap reference data. Records are not classified as
            real-market or synthetic: a valid ISIN, corpus membership or successful resolution
            does not establish real-market status. Descriptor quality describes completeness
            only and is not an eligibility or admission decision.
          </p>
        </div>
      )}
    </section>
  );
}
