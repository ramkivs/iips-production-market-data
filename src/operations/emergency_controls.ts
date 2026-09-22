/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-F / Package P17: Emergency Controls & Local Simulation Circuits
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W5-AUTH-2026-01
 */

import { DataDomain } from '../contracts/types.js';

export interface EmergencyControlState {
  globalKillSwitchActive: boolean;
  disabledDomains: Set<DataDomain>;
  disabledProviders: Set<string>;
  engineFallbackSuppressed: boolean;
  lastToggledAt: string;
}

export class EmergencyControlCircuit {
  private static state: EmergencyControlState = {
    globalKillSwitchActive: false,
    disabledDomains: new Set<DataDomain>(),
    disabledProviders: new Set<string>(),
    engineFallbackSuppressed: false,
    lastToggledAt: new Date().toISOString(),
  };

  /**
   * Activates the global emergency kill switch (immediately blocks all market data dispatching)
   */
  public static triggerGlobalKillSwitch(): void {
    EmergencyControlCircuit.state.globalKillSwitchActive = true;
    EmergencyControlCircuit.state.lastToggledAt = new Date().toISOString();
  }

  /**
   * Disarms the global kill switch
   */
  public static resetGlobalKillSwitch(): void {
    EmergencyControlCircuit.state.globalKillSwitchActive = false;
    EmergencyControlCircuit.state.lastToggledAt = new Date().toISOString();
  }

  /**
   * Disables a specific data domain
   */
  public static disableDomain(domain: DataDomain): void {
    EmergencyControlCircuit.state.disabledDomains.add(domain);
    EmergencyControlCircuit.state.lastToggledAt = new Date().toISOString();
  }

  /**
   * Enables a specific data domain
   */
  public static enableDomain(domain: DataDomain): void {
    EmergencyControlCircuit.state.disabledDomains.delete(domain);
    EmergencyControlCircuit.state.lastToggledAt = new Date().toISOString();
  }

  /**
   * Disables a specific provider tier/source
   */
  public static disableProvider(providerId: string): void {
    EmergencyControlCircuit.state.disabledProviders.add(providerId);
    EmergencyControlCircuit.state.lastToggledAt = new Date().toISOString();
  }

  /**
   * Suppresses engine default fallback injection (enforces fail-closed on missing metric inputs)
   */
  public static setEngineFallbackSuppression(suppress: boolean): void {
    EmergencyControlCircuit.state.engineFallbackSuppressed = suppress;
    EmergencyControlCircuit.state.lastToggledAt = new Date().toISOString();
  }

  /**
   * Checks whether a dispatch request should proceed or be cut off by active emergency circuits
   */
  public static shouldAllowDispatch(domain: DataDomain, providerId?: string): boolean {
    if (EmergencyControlCircuit.state.globalKillSwitchActive) {
      return false; // Global kill switch cut off
    }
    if (EmergencyControlCircuit.state.disabledDomains.has(domain)) {
      return false; // Domain disabled
    }
    if (providerId && EmergencyControlCircuit.state.disabledProviders.has(providerId)) {
      return false; // Provider disabled
    }
    return true;
  }

  public static isFallbackSuppressed(): boolean {
    return EmergencyControlCircuit.state.engineFallbackSuppressed;
  }

  public static getState(): Readonly<EmergencyControlState> {
    return EmergencyControlCircuit.state;
  }

  public static resetAll(): void {
    EmergencyControlCircuit.state = {
      globalKillSwitchActive: false,
      disabledDomains: new Set<DataDomain>(),
      disabledProviders: new Set<string>(),
      engineFallbackSuppressed: false,
      lastToggledAt: new Date().toISOString(),
    };
  }
}
