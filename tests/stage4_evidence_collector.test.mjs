import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/Collect-Stage4ClassPEvidence.ps1');
const source = readFileSync(script, 'utf8');
const quote = x => "'" + x.replaceAll("'", "''") + "'";
const windows = process.platform === 'win32';
const runPS = command => spawnSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8', timeout: 60000 });
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');

test('declares PS 5.1 and excludes newer language constructs and forbidden syntax', () => {
  assert.match(source, /^#Requires -Version 5\.1/m);
  for (const word of ['else', 'elseif', 'finally', 'Read-Host', 'pause', '$PSScriptRoot']) {
    assert.ok(!source.toLowerCase().includes(word.toLowerCase()), word);
  }
  assert.doesNotMatch(source, /\?\?|\?\.|ForEach-Object\s+-Parallel|^\s*class\s+\w+/im);
});

test('no execution, connectivity, database or service mutation surfaces', () => {
  for (const pattern of [
    /\b(?:Invoke-Expression|Invoke-Command|Start-Process|Stop-Process|Restart-Service|Start-Service|Stop-Service|Remove-Item|Clear-Content|Set-Content|Add-Content|Out-File|Copy-Item|Move-Item|Set-Item|Set-ItemProperty|Set-Location)\b/i,
    /\b(?:Invoke-WebRequest|Invoke-RestMethod|Test-NetConnection|New-PSSession|Register-WmiEvent)\b/i,
    /\b(?:NamedPipeClientStream|TcpClient|HttpClient|WebClient|DatabaseSync|SQLiteConnection|SqlConnection|Win32_ProcessStartup)\b/i,
    /\$env:|Environment\]::Set|process\.env|portfolio\.importBroker\s*\(/i,
    /\b(?:npm|npx|node|git|sqlite3|curl|wget)\s+(?:run|install|ci|fetch|push|reset|dist|--|\.\\)/i,
    /(?:File|Directory)\]::(?:Delete|Move|Copy|WriteAll|Set|CreateDirectory)/i,
    /\b(?:Set-CimInstance|Invoke-CimMethod|Remove-CimInstance)\b/i
  ]) assert.doesNotMatch(source, pattern);
  assert.match(source, /FileMode\]::CreateNew/);
  assert.equal((source.match(/FileAccess\]::Write/g) ?? []).length, 1);
  assert.match(source, /FileAccess\]::Read/);
  assert.match(source, /Get-CimInstance -ClassName Win32_Process -Filter/);
});

test('bounded local discovery, path validation and no file reads from log-derived paths', () => {
  assert.doesNotMatch(source, /-Recurse|SearchOption|ReadAllText|Get-Content|Resolve-Path/);
  assert.match(source, /LOCAL_FIXED_DRIVE_REQUIRED/);
  assert.match(source, /REPARSE_POINT_REFUSED/);
  assert.match(source, /OUTPUT_MUST_BE_OUTSIDE_REPOSITORY/);
  assert.match(source, /OUTPUT_MUST_BE_OUTSIDE_LOG_DIRECTORIES/);
  assert.match(source, /DEDICATED_OUTPUT_DIRECTORY_NAME_REQUIRED/);
  assert.match(source, /Scanned -gt 1024/);
  assert.match(source, /Count -ge \$MaxFiles/);
  assert.match(source, /TotalMatchCount -ge \$MaxMatchesTotal/);
  assert.match(source, /Visited -lt 512/);
  assert.match(source, /Read-BoundedBytes \$Path \$MaxLogBytes/);
  assert.match(source, /Sort-Object\)\)/);
  assert.doesNotMatch(source, /Get-LocalPath\s+\$(?:Raw|Line|Json)/);
});

test('secret-safe emission uses fixed signals and no raw log values or command arguments', () => {
  assert.match(source, /matchingLine = '\[VALUES REDACTED\] ' \+ \(\$Found -join/);
  assert.match(source, /unrecognized-key-redacted/);
  assert.match(source, /OTHER ARGUMENTS REDACTED/);
  assert.doesNotMatch(source, /(?:matchingLine|commandLine|detail|error)\s*=\s*\$(?:Line|Command|Text|Raw|_)(?:\s|;|\.)/i);
  assert.doesNotMatch(source, /Write-(?:Output|Error|Host)\s+\$_/);
  assert.match(source, /requestIdType = \$Raw\.GetType\(\)\.Name/);
});

test('missing evidence, PID reuse, access errors, instability and truncation are explicit', () => {
  for (const reason of ['ACCESS_DENIED','FILE_OR_DIRECTORY_MISSING','PROCESS_IDENTITY_CHANGED','FILE_CHANGED_DURING_HASH','FILE_CHANGED_DURING_READ','FILE_SIZE_LIMIT','MATCH_LIMIT_REACHED','FILE_COUNT_LIMIT','METADATA_DEPTH_LIMIT','NO_ALLOWLISTED_FILES_IN_DIRECTORY']) {
    assert.ok(source.includes(reason), reason);
  }
  assert.match(source, /Again\.CreationDate -ne \$Process\.CreationDate/);
  assert.match(source, /Parent\.CreationDate -le \$Process\.CreationDate/);
  assert.match(source, /PARTIAL_COLLECTION/);
  assert.match(source, /\$ExitCode = 2/);
  assert.match(source, /exit 3/);
  assert.match(source, /Win32_Process does not expose process working directory/);
});

test('native Windows PowerShell 5.1 parser accepts script', { skip: !windows }, () => {
  const command = `$tokens=$null; $errors=$null; [void][System.Management.Automation.Language.Parser]::ParseFile(${quote(script)},[ref]$tokens,[ref]$errors); if($errors.Count -gt 0){$errors | ForEach-Object {Write-Output $_.Message}; exit 1}; Write-Output $PSVersionTable.PSVersion.ToString(); if($PSVersionTable.PSVersion.Major -ne 5){exit 2}`;
  const result = runPS(command);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

const artifactNames = ['ipc/entrypoint.js','ipc/dispatch.js','ipc/protocol.js','ipc/endpoint.js','ipc/brokerImportConsumer.js','ipc/brokerImportComposition.js','persistence/brokerImportPersistence.js','persistence/durablePortfolioStorePort.js','persistence/localSingleUserAuthorization.js','persistence/portfolio_store.js','persistence/binding.js'];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'ipd-evidence-test-'));
  const repo = join(root, 'repo'); const logs = join(root, 'logs'); const output = join(root, 'ipd-stage4-evidence');
  mkdirSync(logs); mkdirSync(output);
  for (const name of artifactNames) { const path = join(repo, 'dist', 'src', name); mkdirSync(resolve(path, '..'), { recursive: true }); writeFileSync(path, '// synthetic artifact, never executed\n'); }
  const file = join(logs, 'irr-transport.err.log');
  writeFileSync(file, '2026-11-11T16:27:51Z ipc-class-p-refusal token=CANARY_SECRET_9981\nBINDING_INVALID password=CANARY_SECRET_9981\n');
  writeFileSync(join(logs, 'ipc-request.json'), JSON.stringify({ v: 1, op: 'portfolio.importBroker', requestId: 'CANARY_SECRET_9981', payload: { holdings: [{ symbol: 'CANARY_SECRET_9981', companyId: 'CANARY_SECRET_9981', CANARY_SECRET_9981: 'CANARY_SECRET_9981' }] }, metadata: { declaredLength: 123, actualUtf8Length: 123, trailingData: false, connectedAt: '2026-11-11T16:27:51Z' }, token: 'CANARY_SECRET_9981' }));
  return { root, repo, logs, output, file };
}
function command(f, extra = '', mock = '') {
  const entry = join(f.repo, 'dist', 'src', 'ipc', 'entrypoint.js');
  const fake = `function global:Get-CimInstance { param($ClassName,$Filter) Write-Host ('SYNTHETIC_QUERY=' + $Filter); if($Filter -eq 'ProcessId=1'){return [pscustomobject]@{ProcessId=1;Name='powershell.exe';CreationDate=[datetime]'2026-11-11T15:00:00Z'}}; return [pscustomobject]@{ProcessId=14484;ParentProcessId=1;CreationDate=[datetime]'2026-11-11T16:00:00Z';ExecutablePath='C:\\Windows\\node.exe';CommandLine=('node.exe "' + ${quote(entry)} + '" --secret=CANARY_SECRET_9981')} };`;
  return `${fake}${mock} & ${quote(script)} -RepositoryRoot ${quote(f.repo)} -LogDirectories ${quote(f.logs)} -OutputDirectory ${quote(f.output)} ${extra}; exit $LASTEXITCODE`;
}
function reports(f) { return readdirSync(f.output).map(x => JSON.parse(readFileSync(join(f.output,x),'utf8'))); }

test('native synthetic collection: redaction, metadata, hashes, rerun no overwrite, no input changes', { skip: !windows }, () => {
  const f = fixture();
  try {
    const paths = [f.file, ...artifactNames.map(x => join(f.repo,'dist','src',x))];
    const before = paths.map(p => [hash(p), statSync(p).mtimeMs]);
    for(let i=0;i<2;i++) {
      const result = runPS(command(f)); assert.equal(result.status,0,result.stdout+result.stderr+JSON.stringify(reports(f).map(r=>({issues:r.issues,processes:r.processes,logs:r.logs.map(l=>({matches:l.matches,metadata:l.retainedMetadata}))}))));
      assert.ok(!result.stdout.includes('CANARY_SECRET_9981'));
    }
    const all = reports(f); assert.equal(all.length,2);
    const text=JSON.stringify(all); assert.ok(!text.includes('CANARY_SECRET_9981'));
    const r=all[0]; assert.equal(r.state,'COLLECTION_COMPLETE_NOT_INCIDENT_RESOLVED');
    assert.equal(r.artifacts.length,11); assert.equal(r.processes[0].pid,14484);
    const m=r.logs.find(x=>x.retainedMetadata)?.retainedMetadata;
    assert.equal(m.protocolVersion,1); assert.equal(m.operation,'portfolio.importBroker'); assert.equal(m.requestIdType,'String'); assert.equal(m.actualUtf8Length,123); assert.equal(m.trailingData,false);
    assert.ok(m.keyNames.some(x=>x.endsWith(':companyId')));
    assert.deepEqual(paths.map(p=>[hash(p),statSync(p).mtimeMs]),before);
  } catch(e) { throw e; } finally { rmSync(f.root,{recursive:true,force:true}); }
});

test('native missing files and oversized logs are partial, not success', { skip: !windows }, () => {
  const f=fixture();
  try {
    rmSync(join(f.repo,'dist','src','ipc','dispatch.js'));
    writeFileSync(f.file,'x'.repeat(2048));
    const result=runPS(command(f,'-MaxLogBytes 1024'));
    assert.equal(result.status,2,result.stdout+result.stderr);
    const r=reports(f)[0]; assert.equal(r.state,'PARTIAL_COLLECTION');
    assert.ok(r.issues.some(x=>x.reason==='FILE_OR_DIRECTORY_MISSING'));
    assert.ok(r.issues.some(x=>x.reason==='FILE_SIZE_LIMIT'));
  } finally { rmSync(f.root,{recursive:true,force:true}); }
});

test('native access-denied failure is classified without leaking exception text', { skip: !windows }, () => {
  const f=fixture();
  try {
    const mock="function Get-Item { [CmdletBinding()] param([string]$LiteralPath,[switch]$Force) if($LiteralPath -like '*dispatch.js'){throw [System.UnauthorizedAccessException]::new('CANARY_SECRET_9981')}; Microsoft.PowerShell.Management\\Get-Item -LiteralPath $LiteralPath -Force:$Force };";
    const result=runPS(command(f,'',mock)); assert.equal(result.status,2,result.stdout+result.stderr);
    const r=reports(f)[0]; assert.ok(r.issues.some(x=>x.reason==='ACCESS_DENIED'));
    assert.ok(!JSON.stringify(r).includes('CANARY_SECRET_9981'));
  } finally { rmSync(f.root,{recursive:true,force:true}); }
});

test('native limits, malformed metadata and invalid output path fail explicitly', { skip: !windows }, () => {
  const f=fixture();
  try {
    writeFileSync(f.file,'IDLE_TIMEOUT\n'.repeat(4));
    writeFileSync(join(f.logs,'ipc-request.json'),'{broken');
    const result=runPS(command(f,'-MaxMatchesPerFile 1'));
    assert.equal(result.status,2,result.stdout+result.stderr);
    const r=reports(f)[0]; assert.ok(r.issues.some(x=>x.reason==='MATCH_LIMIT_REACHED'));
    assert.ok(r.issues.some(x=>x.reason==='INVALID_OR_UNREADABLE_RETAINED_JSON'));
    const invalid=runPS(command({...f,output:f.repo})); assert.equal(invalid.status,3);
  } finally { rmSync(f.root,{recursive:true,force:true}); }
});
