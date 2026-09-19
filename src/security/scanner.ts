/**
 * Institutional Investment Platform System (IIPS)
 * Static Security & Zero-Plaintext Scanner (P03 / AD-17)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import * as fs from 'fs';
import * as path from 'path';

export interface SecurityScanViolation {
  filePath?: string;
  line?: number;
  patternName: string;
  matchedSnippet: string;
  severity: 'CRITICAL' | 'HIGH';
}

export interface SecurityScanReport {
  passed: boolean;
  scannedFiles: number;
  violations: SecurityScanViolation[];
}

const SUSPICIOUS_PATTERNS: Array<{ name: string; regex: RegExp; severity: 'CRITICAL' | 'HIGH' }> = [
  {
    name: 'AWS_ACCESS_KEY',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    severity: 'CRITICAL',
  },
  {
    name: 'PRIVATE_KEY_PEM',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'CRITICAL',
  },
  {
    name: 'GENERIC_BEARER_TOKEN',
    regex: /bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_=]*/gi,
    severity: 'CRITICAL',
  },
  {
    name: 'HARDCODED_PASSWORD_FIELD',
    regex: /(?:password|passwd|pwd|secret|api_key|apiKey)\s*[:=]\s*["'][a-zA-Z0-9!@#$%^&*()_+]{8,}["']/gi,
    severity: 'HIGH',
  },
];

/**
 * Scans a text buffer or file content for prohibited plaintext secret patterns.
 */
export function scanTextForSecrets(content: string, filePath?: string): SecurityScanViolation[] {
  const violations: SecurityScanViolation[] = [];
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    for (const pat of SUSPICIOUS_PATTERNS) {
      const match = line.match(pat.regex);
      if (match) {
        // Exclude scanner definition itself or legitimate SecretRef URI patterns
        if (
          line.includes('regex:') ||
          line.includes('SUSPICIOUS_PATTERNS') ||
          line.includes('vault://') ||
          line.includes('SecretRef')
        ) {
          continue;
        }
        violations.push({
          filePath,
          line: lineNum + 1,
          patternName: pat.name,
          matchedSnippet: match[0].substring(0, 20) + '...',
          severity: pat.severity,
        });
      }
    }
  }

  return violations;
}

/**
 * Recursively scans a directory of files for zero-plaintext credential compliance.
 */
export function scanDirectoryForSecrets(dirPath: string, extensions = ['.ts', '.js', '.json']): SecurityScanReport {
  const violations: SecurityScanViolation[] = [];
  let scannedFiles = 0;

  function scanDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          scannedFiles++;
          const content = fs.readFileSync(fullPath, 'utf-8');
          const fileViolations = scanTextForSecrets(content, fullPath);
          violations.push(...fileViolations);
        }
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    scanDir(dirPath);
  }

  return {
    passed: violations.length === 0,
    scannedFiles,
    violations,
  };
}
