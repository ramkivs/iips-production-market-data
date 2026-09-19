/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-F / Package P17: 12-Dimensional Telemetry & Context Propagation
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W5-AUTH-2026-01
 */

import { DataDomain, OperatingMode, QualityState, VendorTier } from '../contracts/types.js';
import { CertifiedSectorEngineId } from '../engine_adapters/types.js';
import { UISurfaceId } from '../ui/types.js';
import { UIRegistry } from '../ui/ui_registry.js';

export interface TelemetryCorrelationVector {
  correlationId: string;
  tenantId: string;
  domain: DataDomain;
  companyId: string;
  asOf: string;
  vendorTier: VendorTier;
  qualityState: QualityState;
  lineageHash: string;
  engineId?: CertifiedSectorEngineId | 'CSIP_COMPOSITE';
  surfaceId?: UISurfaceId;
  operationMode: OperatingMode;
  timestamp: string;
}

export interface TelemetrySpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  attributes: TelemetryCorrelationVector;
  events: Array<{ name: string; timestamp: string; data?: Record<string, unknown> }>;
}

export class TelemetryContextManager {
  private static spans: TelemetrySpan[] = [];

  /**
   * Creates an instrumented telemetry span bound to the 12-dimensional correlation vector
   */
  public static startSpan(name: string, vector: TelemetryCorrelationVector, parentSpanId?: string): TelemetrySpan {
    // Validate NFR-06 provider masking invariant across all vector fields
    if (!UIRegistry.verifyProviderMasking(JSON.stringify(vector))) {
      throw new Error(`Telemetry violation: proprietary provider details detected in correlation vector`);
    }

    const span: TelemetrySpan = {
      spanId: `span-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      parentSpanId,
      name,
      startTime: Date.now(),
      attributes: { ...vector },
      events: [],
    };

    TelemetryContextManager.spans.push(span);
    return span;
  }

  /**
   * Records an event on an active span
   */
  public static addEvent(span: TelemetrySpan, eventName: string, data?: Record<string, unknown>): void {
    if (data && !UIRegistry.verifyProviderMasking(JSON.stringify(data))) {
      throw new Error(`Telemetry violation: proprietary provider details detected in event data`);
    }
    span.events.push({
      name: eventName,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  /**
   * Concludes a span and calculates duration
   */
  public static endSpan(span: TelemetrySpan): TelemetrySpan {
    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    return span;
  }

  public static getRecordedSpans(): ReadonlyArray<TelemetrySpan> {
    return TelemetryContextManager.spans;
  }

  public static clearSpans(): void {
    TelemetryContextManager.spans = [];
  }
}
