/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-F / Package P17: Non-Production Release State Machine & Residual Risk Register
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W5-AUTH-2026-01
 */

export type ReleaseLifecycleState =
  | 'DRAFT'
  | 'QUALIFIED'
  | 'RELEASE_CANDIDATE'
  | 'WITHHELD_PENDING_WAVE6';

export interface ContainedDefectEntry {
  defectId: 'M-2' | 'M-5' | 'M-6';
  description: string;
  governingDecision: string;
  containmentMechanism: string;
  status: 'CONTAINED / NOT REPAIRED';
  remediationPermittedInWave5: false;
}

export interface GovernedReleaseManifest {
  manifestId: string;
  releaseCandidateVersion: string;
  state: ReleaseLifecycleState;
  evaluatedAt: string;
  sourceRevision: string;
  governanceDecisions: string[];
  containedDefects: ContainedDefectEntry[];
  programGates: {
    G01_to_G07: 'SATISFIED_LOCAL_SCOPE';
    G004_MasterProgramGate: 'OPEN_PRESERVED_WAVE6_DEPENDENCY';
  };
  operationalBoundaries: {
    operationalQualification: 'PENDING';
    releaseCertification: 'PENDING';
    productionAuthorization: 'PROHIBITED';
    commercialProviderActivation: 'PROHIBITED';
  };
}

export class ReleaseStateMachine {
  private currentState: ReleaseLifecycleState = 'DRAFT';

  public getState(): ReleaseLifecycleState {
    return this.currentState;
  }

  /**
   * Transitions lifecycle state under strict governance invariants
   */
  public transitionTo(nextState: ReleaseLifecycleState): ReleaseLifecycleState {
    const validTransitions: Record<ReleaseLifecycleState, ReleaseLifecycleState[]> = {
      DRAFT: ['QUALIFIED'],
      QUALIFIED: ['RELEASE_CANDIDATE'],
      RELEASE_CANDIDATE: ['WITHHELD_PENDING_WAVE6'],
      WITHHELD_PENDING_WAVE6: [],
    };

    if (!validTransitions[this.currentState].includes(nextState)) {
      throw new Error(`Illegal release state transition from '${this.currentState}' to '${nextState}'`);
    }

    this.currentState = nextState;
    return this.currentState;
  }

  /**
   * Generates the governed residual risk register confirming containment of M-2, M-5, and M-6
   */
  public static getResidualRiskRegister(): ContainedDefectEntry[] {
    return [
      {
        defectId: 'M-2',
        description: 'Unreconciled simulation artifacts in historical replay datasets',
        governingDecision: 'AD-17 / AD-CHARTER-2026-01',
        containmentMechanism: 'Mandatory AD17_CONSTRAINT disclosure injected across all simulation view models',
        status: 'CONTAINED / NOT REPAIRED',
        remediationPermittedInWave5: false,
      },
      {
        defectId: 'M-5',
        description: 'Incomplete lineage hash validation in legacy artifacts',
        governingDecision: 'AD-07 / AD-CHARTER-2026-01',
        containmentMechanism: 'Cryptographic SHA-256 provenance lineage hashing enforced on all new canonical DTOs',
        status: 'CONTAINED / NOT REPAIRED',
        remediationPermittedInWave5: false,
      },
      {
        defectId: 'M-6',
        description: 'Legacy decommissioned UI17 surface presence',
        governingDecision: 'AD-14 / AD-CHARTER-2026-01',
        containmentMechanism: 'Fixed UI inventory strictly to UI01–UI14; UI17 permanently blocked in UIRegistry',
        status: 'CONTAINED / NOT REPAIRED',
        remediationPermittedInWave5: false,
      },
    ];
  }

  /**
   * Generates the governed release evidence manifest
   */
  public static generateReleaseManifest(sourceRevision: string = 'fcf5dbe72e2fd0b1c91240eada7813fca4254f8b'): GovernedReleaseManifest {
    return {
      manifestId: `rel-manifest-${Date.now()}`,
      releaseCandidateVersion: 'v1.0.0-rc1-local-fixture',
      state: 'WITHHELD_PENDING_WAVE6',
      evaluatedAt: new Date().toISOString(),
      sourceRevision,
      governanceDecisions: [
        'AD-01', 'AD-02', 'AD-03', 'AD-04', 'AD-05', 'AD-06', 'AD-07', 'AD-08',
        'AD-09', 'AD-10', 'AD-11', 'AD-12', 'AD-13', 'AD-14', 'AD-15', 'AD-16',
        'AD-17', 'AD-18', 'AD-CHARTER-2026-01', 'AD-GATE-W1-EXIT-2026-01',
        'AD-GATE-W2-EXIT-2026-01', 'AD-GATE-W3-EXIT-2026-01', 'AD-GATE-W4-EXIT-2026-01',
        'AD-W5-AUTH-2026-01',
      ],
      containedDefects: ReleaseStateMachine.getResidualRiskRegister(),
      programGates: {
        G01_to_G07: 'SATISFIED_LOCAL_SCOPE',
        G004_MasterProgramGate: 'OPEN_PRESERVED_WAVE6_DEPENDENCY',
      },
      operationalBoundaries: {
        operationalQualification: 'PENDING',
        releaseCertification: 'PENDING',
        productionAuthorization: 'PROHIBITED',
        commercialProviderActivation: 'PROHIBITED',
      },
    };
  }
}
