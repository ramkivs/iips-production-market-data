# IIPS v3.0 — G-2 — GATE V WINDOWS TEST PROCEDURE AND SEQUENCING DETERMINATION

> **⚠ STATUS: PREPARATION ONLY — NOT EXECUTED — NO RESULTS — NOT EVIDENCE.**
> This document contains a copy-paste-ready Windows procedure and the determination of what can
> legitimately be tested before implementation authority. **No Gate V requirement is satisfied,
> closed, or dispositioned by this document.** It contains **no** measurements. The Gate V evidence
> artifact may be published **only** after real output exists from the operator's laptop.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-G2-GATE-V-WINDOWS-TEST-PROCEDURE-AND-SEQUENCING-2026-10-16-01` |
| **Record type** | Test **preparation** + sequencing determination. Design/proposal only. Renders no authority, accepts no contract, authorizes no implementation, provisioning, write, or route. |
| **Repository / ref** | `ramkivs/iips-production-market-data` — branch `arena/21c63aef-iips-production-market-data`, PR #8 (existing workstream) |
| **Verified live state at this record** | PR #8 `OPEN`, head `8b1988b13771a00353790ea45b8c8010da02d459` (local == remote), base `main@70b24f0`, 9 files, +2196/−62, `MERGEABLE`/`CLEAN`, 0 comments, 0 reviews — **not merged** |
| **Governs** | Gate V rows **V-1 … V-5** of `IIPS_v3.0_G2_IPD_LOCAL_PRINCIPAL_OS_IPC_SECURITY_CONTRACT_PROPOSAL_2026-10-16.md` §9, and **V-6** of `IIPS-V3-G2-LOCAL-IPC-TRUST-BOUNDARY-VERIFICATION-AND-RECOMMENDATION-2026-10-16-01` §8 |
| **Platform facts under test** | F-3 (default DACL), F-4 (remote clients accepted, DACL-checked), F-5 (duplex ⇒ read-only client open is legal), F-7/F-8 (bind/collision fail-closed), F-9 (no peer identity) |

---

## 1. PHASE 1 — WHAT CAN ACTUALLY BE TESTED

### 1.1 No endpoint exists to test (verified)

| Check | Result |
|---|---|
| Any IPC endpoint, pipe server, or transport in the application (`frontend/src`, `src`) | **None.** `grep` for `net.createServer` / `node:net` / `createServer(` across both trees returns nothing |
| The bounded UI-store-port implementation (`8c9ef08`) | `PortfolioStore.durability = 'SESSION_ONLY'`, `durable = false` — in-memory only; its act **excludes** "IPC client, endpoint, service, or transport of any kind" |
| G24 lineage (`6828155e`, evidence only, **not admitted**) | An **HTTP** server, not IPC; and not a base for implementation |
| Therefore | **Gate V as written cannot be executed today**: V-1's procedure begins *"Start the IPD process; then inspect the endpoint's effective permissions"* — there is no IPD process that binds a pipe, and creating one is exactly what gates B/C do not yet authorize |

**This is a real sequencing problem, not a formality:** §9 requires V to be executed and published *"before any implementation-authority act is exercised"*, while V-1's procedure presumes an implemented endpoint. Left unresolved, the sequence deadlocks.

### 1.2 Is a disposable probe legitimate? (Yes — for the platform half only)

**Argument.** F-3/F-4/F-5/F-8 are properties of **Windows + libuv + the owning account**, not of the application. A probe that creates a pipe through the *same runtime code path* the production endpoint would use, on the *same host*, in the *same account*, reproduces the **OS-applied security configuration** exactly:

| Link in the chain | Evidence |
|---|---|
| A Node pipe server is created via `pipe_wrap` | Node v22.22.3 `lib/net.js` L76 (`internalBinding('pipe_wrap')`), L204 (`isPipeName`), L1851 (`new Pipe(PipeConstants.SERVER)`), L1937 (`this._handle.listen(backlog)`) |
| `pipe_wrap` bind reaches libuv's `pipe_alloc_accept` | libuv v1.51.0 `src/win/pipe.c` — **exactly one** `CreateNamedPipeW` call site in the file (grep count = 1, L546), inside `pipe_alloc_accept` |
| That call passes `lpSecurityAttributes = NULL`, `PIPE_ACCESS_DUPLEX`, no `PIPE_REJECT_REMOTE_CLIENTS` | `src/win/pipe.c` L546–550 (verified verbatim) |

⇒ **Any** Node named-pipe server on Windows — probe or production — is created by the identical OS call with identical flags. The DACL and pipe mode Windows applies are therefore **identical by construction**; what differs is the endpoint *name* and the application-level behaviour.

**What the probe therefore DOES prove** (if it runs): the Windows-applied DACL for a pipe created by this account with this runtime (V-1 platform truth), whether that DACL admits write to anyone but the owner/Admins/SYSTEM (V-1 criterion), who can complete a read-only connection (V-3, V-2), whether the runtime fails closed on collision (V-4), whether the endpoint disappears on abrupt termination (V-4), version inventory (V-5), and the same-account residual (V-6).

**What the probe DOES NOT prove, and must never be recorded as proving:**

| Not proven by the probe | Why | Closes at |
|---|---|---|
| That the **production endpoint name** carries that DACL | Names differ; the production name and process do not exist yet | re-run V-1 against the production endpoint after gate B |
| The application's **C5.1** control (never emit a byte before a valid, authorized request) | The probe deliberately implements no request protocol and never writes — it demonstrates the *platform* condition that makes C5.1 necessary, not the application control that satisfies it | gate C (Q9 negative test) on the real endpoint |
| **C5.3 / C6** (fail-closed bind, no fallback, no owner disclosure) | Same: application behaviour | gate C |
| Any **portfolio** behaviour — refusal matrix, 2F, revisions, durability | Out of scope of a pipe probe entirely | gates B/C |
| Operability of the design | §9's own words: a passing probe is not an operability claim | gate C, then D |

**Disclosed side effect.** Reading the pipe's security descriptor requires a handle, and obtaining a client handle on a named pipe *completes a connection*. Expect the probe to log connections that are **not** test attempts (the ACL capture, AccessChk, the client probes). Correlate by timestamp; do not silently drop them.

### 1.3 Minimum sequencing change required

**No authority change is required, and no new act is needed to run the platform half.** The change is a **clarification of Gate V's own procedure**, so the two halves are separable and neither is skipped:

| Phase | What | When | Authority |
|---|---|---|---|
| **V-P — platform/host phase** | The procedure below, on a **disposable probe** (never a production name), operator account | **Now** — it is measurement, not implementation | None required; adds no application code, no endpoint to the repository, no service, no persistent state |
| **V-E — endpoint phase** | Re-run V-1/V-3/V-4 against the **production endpoint** + application-level checks C5.1/C5.3/C6 | **After gate B**, before any operability claim | Existing gate B/C authority; no new act |

A published V-P result is a legitimate, non-substituting input to gate V; a **V-E** result is what closes V-1/V-3/V-4 for the realized design. §9's failure disposition is unchanged: if V-P shows write access beyond operator/Admins/SYSTEM/CREATOR OWNER, or V-2 shows remote invocation, the design does not satisfy the boundary as written.

*Applied in the proposal (§9, dated clarification note) so the contract text is not misleading.*

---

## 2. PHASE 2 — THE PROCEDURE (copy-paste ready)

Run in the **operator's own account**, **no elevation**. Nothing is installed, nothing is downloaded, no firewall rule is changed, no ACL is modified, no service is created, no production name is used.

### BLOCK A — operator account (laptop)

```powershell
# =============================================================================
# GATE V - V-P PHASE - DISPOSABLE PROBE. NON-PRODUCTION. NOT THE PRODUCTION
# ENDPOINT. No install / no download / no firewall change / no elevation /
# no permission or ACL change / nothing persistent.
# Leave this PowerShell session OPEN until Block D completes.
# =============================================================================
$ErrorActionPreference = 'Continue'
$stamp    = Get-Date -Format 'yyyyMMdd-HHmmss'
$evid     = Join-Path $env:USERPROFILE "gv-evidence-$stamp"   # KEEP (handoff)
$pub      = Join-Path $env:PUBLIC      "gv-probe-$stamp"      # readable by a 2nd local account
$pipeName = "gv-probe-$stamp"                                 # deliberately NOT a production name
New-Item -ItemType Directory -Force -Path $evid, $pub | Out-Null
Start-Transcript -Path (Join-Path $evid 'transcript.txt') -Force | Out-Null
function Say($m) { Write-Host ("[{0}] {1}" -f (Get-Date -Format o), $m) }

Say '=== V-5 CONTEXT AND VERSION INVENTORY ==='
Say "whoami      : $(whoami)"
Say "computer    : $env:COMPUTERNAME"
Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture | Format-List
Say "elevated    : $([Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))"
Say "is admin grp: $([Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))"
Say "powershell  : $($PSVersionTable.PSVersion) / $($PSVersionTable.PSEdition)"
Say "node        : $(node -v)"
Say "libuv       : $(node -p 'process.versions.uv')"
Say "node path   : $((Get-Command node).Source)"
Say "pipe name   : $pipeName"
Say "evidence    : $evid"
Say "public      : $pub"
Say '=== NOTE: record any version that differs from Node v22.22.3 / libuv 1.51.0 ==='
```

```powershell
# ---- probe server (disposable; writes NOTHING to a connection, per C5.1) ----
$serverJs = Join-Path $pub 'gv-probe-server.js'
@'
const net = require('node:net');
const fs  = require('node:fs');
const name    = process.argv[2];
const logFile = process.argv[3];
const pipePath = '\\.\pipe\' + name;
const ts  = () => new Date().toISOString();
const log = (m) => { const l = '[' + ts() + '] ' + m; console.log(l); try { fs.appendFileSync(logFile, l + '\n'); } catch (e) {} };
log('PROBE pid=' + process.pid + ' node=' + process.version + ' uv=' + process.versions.uv + ' pipe=' + pipePath);
let conns = 0;
const server = net.createServer((socket) => {
  conns++;
  // F-9 check: record what (if anything) the server learns about the peer.
  log('CONNECTION #' + conns + ' peer=' + socket.remoteAddress + ' family=' + socket.remoteFamily + ' port=' + socket.remotePort);
  // C5.1 control replicated in the probe: emit NOTHING. No protocol exists -> never writes.
  socket.on('data',  (d) => log('RX ' + d.length + ' bytes on connection #' + conns + ' (probe never replies)'));
  socket.on('error', (e) => log('SOCKET_ERROR ' + (e.code || e.message)));
  socket.on('close', ()  => log('CONNECTION #' + conns + ' closed'));
});
server.on('error', (e) => { log('SERVER_ERROR code=' + e.code + ' message=' + e.message); process.exit(2); });
server.listen(pipePath, () => log('LISTENING'));
process.on('SIGINT', () => { log('SIGINT - closing'); server.close(() => process.exit(0)); });
'@ | Set-Content -Path $serverJs -Encoding UTF8

# ---- probe client (records connect vs write permission vs bytes received) ----
$clientPs1 = Join-Path $pub 'gv-client.ps1'
@'
param(
  [Parameter(Mandatory=$true)][string]$Pipe,
  [string]$Machine = '.', [int]$TimeoutMs = 3000, [int]$ReadMs = 1500,
  [string]$Tag = 'local', [switch]$Send
)
$ErrorActionPreference = 'Continue'
Write-Host ("=== gv-client tag={0} user={1} machine={2} pipe={3} at {4} ===" -f $Tag,(whoami),$Machine,$Pipe,(Get-Date -Format o))
$rows = @()
foreach ($dir in @('In','Out','InOut')) {
  $d  = [System.IO.Pipes.PipeDirection]$dir
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $rec = [ordered]@{ tag=$Tag; user=(whoami); machine=$Machine; pipe=$Pipe; direction=$dir;
    connected=$false; elapsedMs=$null; canRead=$null; canWrite=$null; bytesReceived=$null;
    bytesSent=$null; errorType=$null; errorMessage=$null; timestamp=(Get-Date -Format o) }
  try {
    $c = New-Object System.IO.Pipes.NamedPipeClientStream($Machine, $Pipe, $d)
    $c.Connect($TimeoutMs)
    $rec.connected = $true; $rec.canRead = $c.CanRead; $rec.canWrite = $c.CanWrite
    if ($dir -eq 'In') {                      # read-only: prove ZERO bytes are emitted
      $buf = New-Object byte[] 64; $c.ReadTimeout = $ReadMs
      try { $rec.bytesReceived = $c.Read($buf,0,64) }
      catch { $rec.bytesReceived = 0; $rec.errorType = $_.Exception.GetType().Name; $rec.errorMessage = 'read: ' + $_.Exception.Message }
    }
    if ($Send -and $c.CanWrite) {             # explicit send proof (same-account residual only)
      $m = [Text.Encoding]::UTF8.GetBytes("GV-SEND-PROBE $Tag $dir")
      $c.Write($m,0,$m.Length); $c.Flush(); Start-Sleep -Milliseconds 250; $rec.bytesSent = $m.Length
    }
    $c.Dispose()
  } catch { $rec.errorType = $_.Exception.GetType().FullName; $rec.errorMessage = $_.Exception.Message }
  $sw.Stop(); $rec.elapsedMs = $sw.ElapsedMilliseconds
  Write-Host (("[{0}] dir={1} connected={2} ms={3} canWrite={4} bytesReceived={5} error={6}" -f (Get-Date -Format o), $dir, $rec.connected, $rec.elapsedMs, $rec.canWrite, $rec.bytesReceived, $rec.errorType))
  $rows += [pscustomobject]$rec
}
$rows | Format-List | Out-String -Width 300 | Write-Host
$outDir  = Join-Path $env:PUBLIC 'gv-probe-output'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir ("v3-{0}-{1}.json" -f $Tag, ((whoami) -replace '[\\/:*?"<>|]','_'))
try { $rows | ConvertTo-Json -Depth 5 | Set-Content -Path $outFile -Encoding UTF8; Write-Host "WROTE $outFile" }
catch { Write-Host "FALLBACK - could not write $outFile ($($_.Exception.Message)). COPY THE JSON BELOW MANUALLY:"; $rows | ConvertTo-Json -Depth 5 | Write-Host }
'@ | Set-Content -Path $clientPs1 -Encoding UTF8
Say "wrote $serverJs and $clientPs1"
```

```powershell
Say '=== START DISPOSABLE PROBE (separate window; log also written to the evidence dir) ==='
$nodeExe = (Get-Command node).Source
$logFile = Join-Path $evid 'probe-server.log'
$srv = Start-Process -FilePath $nodeExe -ArgumentList @($serverJs, $pipeName, $logFile) -PassThru
Start-Sleep -Seconds 2
Say "probe pid=$($srv.Id) hasExited=$($srv.HasExited)"
Get-Content $logFile -ErrorAction SilentlyContinue
Say '=== PIPES VISIBLE NOW (should include the probe name) ==='
[System.IO.Directory]::GetFiles('\\.\pipe\') | Where-Object { $_ -like "*$pipeName*" }
```

```powershell
Say '=== V-1a: Get-Acl attempt (record the result either way) ==='
try { Get-Acl -Path "\\.\pipe\$pipeName" | Format-List * } catch { Say "Get-Acl FAILED: $($_.Exception.Message)" }
```

```powershell
Say '=== V-1b: built-in security-descriptor capture (GetSecurityInfo -> SDDL) ==='
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class GvPipeAcl {
  const int SE_KERNEL_OBJECT = 1;
  const int SECINFO = 0x1 | 0x2 | 0x4;          // OWNER | GROUP | DACL  (never SACL: needs SeSecurity)
  const uint READ_CONTROL = 0x00020000;
  const uint OPEN_EXISTING = 3;
  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  static extern IntPtr CreateFileW(string n, uint a, uint s, IntPtr sa, uint c, uint f, IntPtr t);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool CloseHandle(IntPtr h);
  [DllImport("advapi32.dll", SetLastError=true)]
  static extern uint GetSecurityInfo(IntPtr h, int t, int i, out IntPtr o, out IntPtr g, out IntPtr d, out IntPtr s, out IntPtr sd);
  [DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  static extern bool ConvertSecurityDescriptorToStringSecurityDescriptorW(IntPtr sd, uint rev, int i, out IntPtr str, out uint len);
  [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr h);
  public static string GetSddl(string path, out string error) {
    error = null;
    IntPtr h = CreateFileW(path, READ_CONTROL, 0, IntPtr.Zero, OPEN_EXISTING, 0, IntPtr.Zero);
    if (h == new IntPtr(-1)) { error = "CreateFileW failed, Win32=" + Marshal.GetLastWin32Error(); return null; }
    try {
      IntPtr o,g,d,s,sd; uint rc = GetSecurityInfo(h, SE_KERNEL_OBJECT, SECINFO, out o, out g, out d, out s, out sd);
      if (rc != 0) { error = "GetSecurityInfo failed, Win32=" + rc; return null; }
      try {
        IntPtr str; uint len;
        if (!ConvertSecurityDescriptorToStringSecurityDescriptorW(sd, 1, SECINFO, out str, out len)) { error = "SDDL conversion failed, Win32=" + Marshal.GetLastWin32Error(); return null; }
        try { return Marshal.PtrToStringUni(str); } finally { LocalFree(str); }
      } finally { LocalFree(sd); }
    } finally { CloseHandle(h); }
  }
}
'@
$err = $null
$sddl = [GvPipeAcl]::GetSddl("\\.\pipe\$pipeName", [ref]$err)
if ($sddl) {
  Say "SDDL: $sddl"
  $sddl | Set-Content (Join-Path $evid 'v1-pipe-sddl.txt') -Encoding UTF8
  if (Get-Command ConvertFrom-SddlString -ErrorAction SilentlyContinue) {
    try { $sddl | ConvertFrom-SddlString | Format-List * | Out-String -Width 300 |
          Tee-Object -FilePath (Join-Path $evid 'v1-pipe-sddl-decoded.txt') | Write-Host }
    catch { Say "decode failed: $($_.Exception.Message) - the raw SDDL above is the record" }
  } else { Say 'ConvertFrom-SddlString not present - the raw SDDL above is the record' }
  Say '=== V-1 CRITERION: write (W) only for the operator account, Administrators, SYSTEM, CREATOR OWNER;'
  Say '    Everyone/anonymous at most read (R) - record them, do not hide them ==='
} else { Say "SDDL CAPTURE FAILED: $err" }
Say '=== NOTE: this ACL read opens a client handle and therefore registers as a connection in the probe log ==='
Get-Content $logFile -ErrorAction SilentlyContinue
```

```powershell
Say '=== V-1c: AccessChk (OPTIONAL corroboration) ==='
# Documented syntax (Sysinternals AccessChk v6.15):
#   accesschk [-s][-e][-u][-r][-w][-n][-v]-[f <account>,...][[-a]|[-k]|[-p [-f] [-t]]|[-h][-o [-t <type>]][-c]|[-d]] [[-l [-i]]|[username]] <object>
#   -l = "Show full security descriptor"   -i = ignore inherited ACEs   -v = verbose
#   "\pipe\" prefix = named pipe path (otherwise the path is treated as a file system path)
#   Optional: accesschk -v Everyone \pipe\<name>  reports that account's effective access.
# NOTE: -accepteula is the Sysinternals suite EULA flag (not listed in the v6.15 parameter table).
#       Omit it to accept the dialog interactively instead.
$ac = $null
foreach ($c in @('accesschk64.exe','accesschk.exe')) { $g = Get-Command $c -ErrorAction SilentlyContinue; if ($g) { $ac = $g.Source; break } }
if (-not $ac) { foreach ($p in @("$env:ProgramFiles\Sysinternals\accesschk64.exe","$env:ProgramFiles\SysinternalsSuite\accesschk64.exe","${env:ProgramFiles(x86)}\Sysinternals\accesschk64.exe","$env:LOCALAPPDATA\Microsoft\WinGet\Links\accesschk64.exe","C:\Sysinternals\accesschk64.exe")) { if (Test-Path $p) { $ac = $p; break } } }
if ($ac) {
  Say "AccessChk found: $ac"
  & $ac -accepteula -l -v "\pipe\$pipeName" 2>&1 | Tee-Object -FilePath (Join-Path $evid 'v1-accesschk.txt') | Write-Host
  Say "accesschk exit code: $LASTEXITCODE"
  & $ac -accepteula -v Everyone "\pipe\$pipeName" 2>&1 | Tee-Object -FilePath (Join-Path $evid 'v1-accesschk-everyone.txt') | Write-Host
} else {
  Say 'AccessChk NOT installed. NO download performed and NONE is required: the built-in SDDL capture above is the primary V-1 record.'
}
```

```powershell
Say '=== V-6: SAME-ACCOUNT RESIDUAL (expected: In/Out/InOut all connect; -Send succeeds) ==='
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $clientPs1 -Pipe $pipeName -Tag 'operator' -Send
Get-Content $logFile -ErrorAction SilentlyContinue
```

```powershell
Say '=== V-4a: BIND COLLISION (expected: second bind FAILS with EADDRINUSE, no fallback) ==='
$log2 = Join-Path $evid 'v4-second-bind.log'
$srv2 = Start-Process -FilePath $nodeExe -ArgumentList @($serverJs, $pipeName, $log2) -PassThru
Start-Sleep -Seconds 2
Say "second bind hasExited=$($srv2.HasExited) exitCode=$(if ($srv2.HasExited) { $srv2.ExitCode } else { 'n/a' })"
Get-Content $log2 -ErrorAction SilentlyContinue
if (-not $srv2.HasExited) { Stop-Process -Id $srv2.Id -Force; Say 'UNEXPECTED: second bind still alive -> stopped' }

Say '=== V-4b: ABRUPT TERMINATION + immediate re-bind (Windows pipe object disappears with its last handle) ==='
Stop-Process -Id $srv.Id -Force
Start-Sleep -Milliseconds 500
Say "pipe still present? $(([System.IO.Directory]::GetFiles('\\.\pipe\') | Where-Object { $_ -like "*$pipeName*" }) -join ', ')"
$log3 = Join-Path $evid 'v4-rebind.log'
$srv3 = Start-Process -FilePath $nodeExe -ArgumentList @($serverJs, $pipeName, $log3) -PassThru
Start-Sleep -Seconds 2
Get-Content $log3 -ErrorAction SilentlyContinue   # expect: LISTENING (free immediately -> no stale endpoint)
Stop-Process -Id $srv3.Id -Force
Start-Sleep -Milliseconds 500
Say "after stop, pipe present? $(([System.IO.Directory]::GetFiles('\\.\pipe\') | Where-Object { $_ -like "*$pipeName*" }) -join ', ')"
```

```powershell
# ---- restart the probe for BLOCKS B and C (keep it running) ----
$log4 = Join-Path $evid 'probe-server-bc.log'
$srv  = Start-Process -FilePath $nodeExe -ArgumentList @($serverJs, $pipeName, $log4) -PassThru
Start-Sleep -Seconds 2
Get-Content $log4 -ErrorAction SilentlyContinue     # expect: LISTENING
Say '*** LEAVE THIS SESSION OPEN AND THE PROBE RUNNING FOR BLOCKS B AND C ***'
Say "*** pipeName = $pipeName   pub = $pub   evid = $evid ***"
```

### BLOCK B — second, non-administrator local account

Two options. **Option B2 changes the machine** (one elevated command); if you prefer not to create an account, run Option B1 only if a second non-admin account already exists, otherwise record **V-3 = BLOCKED (no second account)** — that is an honest outcome.

```powershell
# ================== B1: run in the OPERATOR session (no elevation) ==================
# Use an EXISTING non-administrator account on this laptop.
$pipeName = '<paste gv-probe-... from Block A>'
$pub      = '<paste C:\Users\Public\gv-probe-... from Block A>'
$acct     = "$env:COMPUTERNAME\<second-nonadmin-user>"
# Enumerate candidates first (informational):
Get-LocalUser | Select-Object Name,Enabled,LastLogon | Format-Table -AutoSize
Get-LocalGroupMember -Group 'Administrators' | Select-Object Name | Format-Table -AutoSize
Then:
$cred = Get-Credential -UserName $acct -Message 'Second non-admin account password - used ONLY to launch the local test client'
Start-Process powershell.exe -Credential $cred -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-NoExit','-File',"$pub\gv-client.ps1",'-Pipe',$pipeName,'-Tag','second-account','-ReadMs','1500')
# Expect, in that window: dir=In connected=True canWrite=False bytesReceived=0 (or connect denied),
#                        dir=Out  and dir=InOut -> UnauthorizedAccessException (no write permission).
# The client writes v3-second-account-*.json under C:\Users\Public\gv-probe-output\
Get-Content '<paste the probe log path>' -ErrorAction SilentlyContinue
```

```powershell
# ================== B2: ONLY IF no second account exists (ONE elevated step) ==================
# Run in an elevated PowerShell. Creates a TEMPORARY standard user, then deletes it in Block D.
$tmp = 'gv-testuser'
net user $tmp 'Gv!' + [Guid]::NewGuid().ToString('N').Substring(0,12) /add /comment "GATE V temporary test account - DELETE AFTER TEST"
# then log the generated password, run B1 with $acct = "$env:COMPUTERNAME\$tmp", and delete in Block D:
#   Remove-LocalUser -Name $tmp      (elevated)
```

### BLOCK C — remote reachability

Run the laptop part in the operator session **while the probe is running**; run the remote part on a second machine.

```powershell
# ================== C1: run on the LAPTOP (operator session) ==================
Say '=== V-2 host reachability posture (MEASURE ONLY - nothing is changed) ==='
Get-SmbServerConfiguration | Select-Object EnableSMB1Protocol,EnableSMB2Protocol,RestrictNullSessAccess,NullSessionPipes,NullSessionShares | Format-List
Get-NetConnectionProfile | Select-Object Name,InterfaceAlias,NetworkCategory | Format-List
Get-NetFirewallRule -DisplayGroup 'File and Printer Sharing' | Select-Object DisplayName,Enabled,Direction,Action,Profile | Format-Table -AutoSize
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Lsa' | Select-Object RestrictAnonymous,RestrictAnonymousSAM,LimitBlankPasswordUse | Format-List
net share
Test-NetConnection -ComputerName localhost -Port 445        # SMB listener state (loopback only)
```

```powershell
# ================== C2: run ON THE SECOND MACHINE (any account) ==================
$laptop = '<LAPTOP-NAME>'
Test-NetConnection -ComputerName $laptop -Port 445
Try { [System.IO.Directory]::GetFiles("\\$laptop\pipe\") | Where-Object { $_ -like '*gv-probe*' } }
Catch { "pipe enumeration FAILED: $($_.Exception.Message)" }
Try { [System.IO.Directory]::GetFiles("\\$laptop\pipe\") | Measure-Object | Select-Object -ExpandProperty Count }
Catch { }
# Then, using the client script (copy it over, or paste its contents into a local file):
& .\gv-client.ps1 -Pipe '<paste gv-probe-... name>' -Machine $laptop -Tag 'remote' -ReadMs 1500
# Expect: In -> read-only connect at most (bytesReceived=0); Out/InOut -> denied (no write access).
# DO NOT sign in to the laptop with the operator's own credentials for this test:
#  - credential handling is out of scope here, and the operator-account remote case is
#    already characterised by the DACL itself (CREATOR OWNER = the owner SID).
```

### BLOCK D — cleanup, manifest, handoff (operator session)

```powershell
# =============================================================================
# BLOCK D - CLEANUP + EVIDENCE MANIFEST.  Session must be the SAME one as Block A
# (it holds $srv / $evid / $pub / $pipeName).
# =============================================================================
$ErrorActionPreference = 'Continue'
Say '=== CLEANUP ==='
if ($srv -and -not $srv.HasExited) { Stop-Process -Id $srv.Id -Force; Say "stopped probe pid $($srv.Id)" }
else { Say 'NOTE: probe not running or already stopped. If needed, stop ONLY the pid printed in the probe log:' ; Get-Content $logFile -ErrorAction SilentlyContinue | Select-String 'PROBE pid' }
Start-Sleep -Seconds 1
Say "pipe present after cleanup? $(([System.IO.Directory]::GetFiles('\\.\pipe\') | Where-Object { $_ -like "*$pipeName*" }) -join ', ')"
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,Path | Format-Table -AutoSize
Say 'WARNING: do NOT bulk-kill node processes - stop only the probe pid if it is still listed.'
Remove-Item -Recurse -Force $pub -ErrorAction SilentlyContinue
Say "removed disposable probe dir: $pub (the evidence dir is retained)"
Say '--- IF you created the temporary account in B2, delete it now in an elevated shell: Remove-LocalUser -Name gv-testuser ---'

Say '=== EVIDENCE MANIFEST ==='
$man = Get-ChildItem $evid -File | ForEach-Object {
  [pscustomobject]@{ Name=$_.Name; Bytes=$_.Length; SHA256=(Get-FileHash $_.FullName -Algorithm SHA256).Hash; Modified=$_.LastWriteTime.ToString('o') }
}
$man | Format-Table -AutoSize | Out-String -Width 250 | Tee-Object -FilePath (Join-Path $evid 'MANIFEST.txt') | Write-Host
Stop-Transcript
Compress-Archive -Path (Join-Path $evid '*') -DestinationPath "$evid.zip" -Force
Say "HANDOFF ZIP: $evid.zip"
Say 'ALSO COLLECT: C:\Users\Public\gv-probe-output\*.json (all client JSON files), the public-folder client output,'
Say 'and any copy of the second-account / remote-machine windows that could not write a JSON file.'
```

---

## 3. PER-REQUIREMENT DISPOSITION MAP

| Gate V requirement | V-P (disposable probe, now) | V-E (production endpoint, after gate B) | Status today |
|---|---|---|---|
| **V-1** endpoint DACL | **Probe-provable** for the platform/applied DACL (identical OS call, same account/runtime). AccessChk *optional*; built-in SDDL is primary | **Re-run** on the production name/process | **NOT TESTED** |
| **V-2** remote reachability | Probe-provable as a *host-posture + remote-connect* measurement | Re-run against the production name | **NOT TESTED** (also needs a second machine) |
| **V-3** second local account | Probe-provable (read-only connect vs write denial) | Re-run on the production name | **NOT TESTED** (also needs a second account) |
| **V-4** fail-closed bind / no stale endpoint | **Probe-provable** (`EADDRINUSE` on collision; immediate re-bind after kill) — F-7/F-8 are runtime facts | **Re-run** + application-level C5.3/C6 | **NOT TESTED** |
| **V-5** version inventory | **Probe-provable now** (this is the one requirement that does not need any endpoint) | Same, re-recorded for the endpoint phase | **NOT TESTED** (runnable immediately) |
| **V-6** same-account residual | **Probe-provable** (deviation: expected *success*, to document the accepted residual) | Re-run | **NOT TESTED** |
| C5.1 no-bytes-before-request | **Not provable** — the probe has no protocol; it only shows the platform condition that makes C5.1 necessary | **Required** (gate C, Q9 negative test) | **NOT TESTED** |
| C5.3/C6 fail-closed app behaviour, owner non-disclosure | **Not provable** | **Required** (gate C, Q2/Q4) | **NOT TESTED** |

**Dated update (2026-10-16, after this preparation was published).** The Program Authority has **waived** V-2 and V-3 as **NOT REQUIRED — PA-WAIVED** (one Windows account; no separate remote machine). Block B and the C2 remote block are therefore **not to be executed**; the V-2/V-3 rows above are **not pending and not failed**. V-1, V-4 and the V-6 send half remain local, executable as prepared.

**Second dated update (2026-10-16, later the same day).** **V-1 and V-4 are now ALSO waived by the Program Authority as NOT REQUIRED — PA-WAIVED**, following failed V-1 capture attempts on a fresh disposable probe (`GetNamedSecurityInfo` error 87; PowerShell `Get-Acl` error 231 = `ERROR_PIPE_BUSY`, which fails at the *open* step and says nothing about the ACL's contents). **No further attempt is to be made, and Blocks A/A′ must not be executed.** All four Gate V measurements (V-1, V-2, V-3, V-4) are waived; the V-P platform phase is CLOSED (closed by waiver where unmeasured, V-5 satisfied by evidence). This procedure document is retained as the historical record of what was prepared — **it is not to be run** — and the waived properties remain technically unverified. The V-E items that were never among the waived measurements remain for the future endpoint phase: see `IIPS-V3-G2-GATE-V-EVIDENCE-RECONCILIATION-AND-PA-WAIVER-2026-10-16-01` §9.5. See `IIPS-V3-G2-GATE-V-EVIDENCE-RECONCILIATION-AND-PA-WAIVER-2026-10-16-01` §2/§5/§8.

**No row above is closed, and no Gate V disposition has changed.**

---

## 4. WHAT MUST NOT BE MISREAD FROM THIS DOCUMENT

1. A probe PASS is **not** Gate V closed and **not** an operability claim (§9's own words).
2. A probe PASS does **not** validate the application's controls (C5.1, C5.3, C6) — those are application behaviour and are tested at gate C.
3. A probe FAIL on V-1/V-3/V-2 is nonetheless decisive **against the design as written**, because those facts are runtime/OS facts, not application facts (§9 failure disposition).
4. The probe must **never** be given a production name, and must never be running during any attempt to characterise the production endpoint.
5. Reading the DACL opens a client handle and therefore appears as a connection in the probe log — expected, not an anomaly.
6. `peer=undefined` in the probe log is **expected** and corroborates F-9 (no peer identity on this stack); record it, do not treat it as a failure.

## 5. PUBLICATION RULE

- **This document** = preparation + sequencing. May be published now (it is the durable handoff to the laptop and the record of the sequencing determination). It contains no results.
- **The Gate V evidence artifact** = published **only** after real laptop output exists, and it must state: which phase (V-P / V-E) produced each result, the raw output, the manifest hashes, and any FAIL/contradiction. No projected, illustrative, or synthesised results may ever appear in it.
- The security contract remains **PROPOSAL ONLY** until the IPD security-contract authority accepts §13. Nothing here accepts it, and nothing here grants provisioning, implementation, qualification, write, route, or admission authority. IRR's HTTP `503 owner-context-unavailable` fence and DP-2 Option 2F remain in force.

---

*Recording agent: Arena — preparation, sequencing determination and recording only. Program Authority: Ramki. **Nothing in this document has been executed.** All Gate V requirements remain NOT TESTED.*
