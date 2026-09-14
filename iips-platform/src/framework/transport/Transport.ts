/** Transport Layer — versioned DTO + serializer + checksum + validator (generic, IES-006.2A WP-2). */
import type { Clock } from '../../infrastructure/Clock';

export interface TransportMetadata {
  readonly transportVersion: string;
  readonly engineId: string;
  readonly schemaVersion: string;
  readonly generatedAt: string;
  readonly checksum: string;
}

export interface TransportRow {
  readonly sectorId: string;
  readonly sectorFamily: string;
  readonly companyName: string;
  readonly metrics: Readonly<Record<string, number>>;
  readonly scores: Readonly<Record<string, number>>;
  readonly verdict?: string;
}

export interface TransportDTO {
  readonly metadata: TransportMetadata;
  readonly rows: readonly TransportRow[];
}

export class Transport {
  constructor(
    private readonly clock: Clock,
    private readonly version = 'v1',
    private readonly schemaVersion = 'transport-1.0',
  ) {}

  /** Deterministic canonical serialization (stable key ordering). */
  serialize(dto: TransportDTO): string {
    const { metadata, rows } = dto;
    const orderedRows = rows.map((r) => ({
      sectorId: r.sectorId,
      sectorFamily: r.sectorFamily,
      companyName: r.companyName,
      metrics: r.metrics,
      scores: r.scores,
      verdict: r.verdict,
    }));
    return JSON.stringify({ metadata, rows: orderedRows });
  }

  /** FNV-1a-ish checksum (deterministic, excludes the checksum field). */
  checksum(dto: TransportDTO): string {
    const { checksum: _c, ...rest } = dto.metadata;
    const payload = JSON.stringify({ metadata: rest, rows: dto.rows });
    return transportHash(payload);
  }

  /** Build a transport DTO from rows. */
  build(engineId: string, rows: TransportRow[]): TransportDTO {
    const dto: TransportDTO = {
      metadata: {
        transportVersion: this.version,
        engineId,
        schemaVersion: this.schemaVersion,
        generatedAt: this.clock.now(),
        checksum: '',
      },
      rows,
    };
    const checksum = this.checksum(dto);
    return Object.freeze({
      metadata: Object.freeze({ ...dto.metadata, checksum }),
      rows: Object.freeze(rows.map((r) => Object.freeze({ ...r }))),
    });
  }

  /** Validate a DTO (version, metadata, at least one row). */
  validate(dto: TransportDTO): boolean {
    return (
      dto.metadata?.transportVersion === this.version &&
      !!dto.metadata?.engineId &&
      !!dto.metadata?.checksum &&
      Array.isArray(dto.rows) &&
      dto.rows.length > 0
    );
  }
}

export function transportHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
