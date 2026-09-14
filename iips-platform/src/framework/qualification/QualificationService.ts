/** Qualification — gate an engine as production-ready (generic, IES-006.2A WP-2). */
export interface QualificationGateResult {
  readonly gateId: string;
  readonly name: string;
  readonly status: 'PASS' | 'FAIL';
}

export interface QualificationResult {
  readonly qualificationId: string;
  readonly engineId: string;
  readonly qualified: boolean;
  readonly gates: readonly QualificationGateResult[];
  readonly reason: string;
}

export interface QualificationInputs {
  readonly engineId: string;
  readonly certified: boolean;
  readonly replayVerified: boolean;
  readonly regressionPassed: boolean;
  readonly deterministic: boolean;
}

export class QualificationService {
  qualify(inputs: QualificationInputs): QualificationResult {
    const gates: QualificationGateResult[] = [
      { gateId: 'certified', name: 'Certified', status: inputs.certified ? 'PASS' : 'FAIL' },
      { gateId: 'replayable', name: 'Replay verified', status: inputs.replayVerified ? 'PASS' : 'FAIL' },
      { gateId: 'regression', name: 'Regression passed', status: inputs.regressionPassed ? 'PASS' : 'FAIL' },
      { gateId: 'deterministic', name: 'Deterministic', status: inputs.deterministic ? 'PASS' : 'FAIL' },
    ];
    const qualified = gates.every((g) => g.status === 'PASS');
    return Object.freeze({
      qualificationId: `qual_${inputs.engineId}`,
      engineId: inputs.engineId,
      qualified,
      gates: Object.freeze(gates),
      reason: qualified ? 'Production ready' : `Gated: ${gates.filter((g) => g.status === 'FAIL').map((g) => g.gateId).join(', ')}`,
    });
  }
}
