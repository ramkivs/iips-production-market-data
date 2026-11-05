#Requires -Version 5.1
<#
.SYNOPSIS
    IIPS Windows setup - step 0 of 7: native PowerShell syntax validation.

.DESCRIPTION
    Parses every IIPS PowerShell script with the REAL PowerShell parser before anything is executed:

        [System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$tokens, [ref]$errors)

    This is a native parse on the operator's own PowerShell engine - it is categorically stronger
    than any regex or brace-counting heuristic, and it is the first thing to run.

    For each script it reports:
      * every ParseError with file, line, column, error id and message
      * whether the AST was produced at all
      * a token count (a parse that yields zero tokens is not a successful parse)

    It then walks the AST to enforce the project's structural rules, which a parser alone does not:
      * no `else` clause      (IfStatementAst with a non-null ElseClause)
      * no `elseif` clause    (IfStatementAst ElseIfClauses count > 0)
      * no `finally` block    (TryStatementAst with a non-null Finally)
      * every `try` has a `catch`
      * Set-StrictMode and $ErrorActionPreference = 'Stop' are present
      * no bare `npm` or `npx` command invocation - every call must be an explicit absolute path
        to npm.cmd / npx.cmd / node.exe / git.exe / taskkill.exe

    The last check is what makes this script the gatekeeper for the mandatory Windows Node.js
    command rule: a bare `npm` or `npx` anywhere fails validation before setup can run.

    EXIT CODES
      0  every script parsed cleanly and satisfied every structural rule
      1  unhandled failure
      2  precondition failure - no scripts found, or the parser API is unavailable
      3  one or more syntax errors were found
      4  one or more structural rule violations were found

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\00-Validate-PowerShell-Syntax.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\00-Validate-PowerShell-Syntax.ps1 -ScriptDirectory 'H:\IIPS-scripts'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string] $ScriptDirectory = $PSScriptRoot,

    [Parameter(Mandatory = $false)]
    [switch] $IncludeSelf,

    [Parameter(Mandatory = $false)]
    [switch] $NoPause

)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-IipsPause {
    param([Parameter(Mandatory = $false)][switch] $NoPause)
    if ($NoPause) { return }
    Write-Host ''
    Write-Host 'Press Enter to close this window...' -ForegroundColor Yellow
    try { $null = Read-Host }
    catch { Write-Host '(no interactive input available - continuing without a pause)' -ForegroundColor DarkGray }
}

function Write-IipsFinalStatus {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('PASS', 'FAIL')] [string] $Outcome,
        [Parameter(Mandatory = $true)][string] $Message,
        [Parameter(Mandatory = $false)][int] $ExitCode = 0,
        [Parameter(Mandatory = $false)][switch] $NoPause
    )
    $colour = 'Green'
    if ($Outcome -eq 'FAIL') { $colour = 'Red' }
    Write-Host ''
    Write-Host '=============================================================' -ForegroundColor $colour
    Write-Host " FINAL STATUS: $Outcome" -ForegroundColor $colour
    Write-Host " $Message" -ForegroundColor $colour
    Write-Host '=============================================================' -ForegroundColor $colour
    Write-IipsPause -NoPause:$NoPause
    return $ExitCode
}

$script:Rows = New-Object System.Collections.Generic.List[object]
$script:Violations = New-Object System.Collections.Generic.List[object]

function Add-Violation {
    param(
        [Parameter(Mandatory = $true)][string] $File,
        [Parameter(Mandatory = $true)][string] $Rule,
        [Parameter(Mandatory = $true)][string] $Detail
    )
    $script:Violations.Add([pscustomobject]@{ File = $File; Rule = $Rule; Detail = $Detail })
}

try {
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ' IIPS Windows Setup - Native PowerShell Syntax Validation ' -ForegroundColor White
    Write-Host '=============================================================' -ForegroundColor White
    Write-Host ''
    Write-Host "Engine      : PowerShell $($PSVersionTable.PSVersion) ($($PSVersionTable.PSEdition))" -ForegroundColor Gray
    Write-Host "CLR         : $([System.Environment]::Version)" -ForegroundColor Gray
    Write-Host "Directory   : $ScriptDirectory" -ForegroundColor Gray
    Write-Host ''

    # -----------------------------------------------------------------------------------------
    if (-not (Test-Path -LiteralPath $ScriptDirectory)) {
        Write-Host "FAILED: script directory not found: $ScriptDirectory" -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'PowerShell syntax validation: stopped with exit 2. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 2
    }

    # Prove the parser API is actually available before claiming any result from it.
    $parserType = [System.Management.Automation.Language.Parser]
    if ($null -eq $parserType) {
        Write-Host 'FAILED: System.Management.Automation.Language.Parser is not available in this engine.' -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'PowerShell syntax validation: stopped with exit 2. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 2
    }
    Write-Host "Parser API  : $($parserType.AssemblyQualifiedName.Split(',')[0])" -ForegroundColor Gray
    Write-Host ''

    $scripts = @(Get-ChildItem -LiteralPath $ScriptDirectory -Filter '*.ps1' -File | Sort-Object Name)
    if (-not $IncludeSelf) { $scripts = @($scripts | Where-Object { $_.Name -ne '00-Validate-PowerShell-Syntax.ps1' }) }
    if ($scripts.Count -eq 0) {
        Write-Host "FAILED: no .ps1 files were found in $ScriptDirectory" -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'PowerShell syntax validation: stopped with exit 2. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 2
    }
    Write-Host "Scripts     : $($scripts.Count)" -ForegroundColor Gray
    Write-Host ''
    Write-Host '    FILE                                  PARSE   TOKENS  ERRORS  RULES' -ForegroundColor DarkGray
    Write-Host '    ----------------------------------------------------------------------' -ForegroundColor DarkGray

    $totalErrors = 0

    foreach ($s in $scripts) {
        $tokens = $null
        $errors = $null
        $ast = $null

        # THE NATIVE PARSE. This is the real engine parser, not a heuristic.
        $ast = $parserType::ParseFile($s.FullName, [ref]$tokens, [ref]$errors)

        $errCount = 0
        if ($null -ne $errors) { $errCount = @($errors).Count }
        $tokenCount = 0
        if ($null -ne $tokens) { $tokenCount = @($tokens).Count }

        $parseVerdict = 'FAIL'
        if ($errCount -eq 0 -and $null -ne $ast -and $tokenCount -gt 0) { $parseVerdict = 'OK' }
        $totalErrors += $errCount

        # ---- structural rules, evaluated on the AST ----------------------------------------
        $ruleCount = 0

        if ($null -ne $ast) {
            # no else / elseif
            $ifs = $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.IfStatementAst] }, $true)
            foreach ($ifAst in $ifs) {
                if ($null -ne $ifAst.ElseClause) {
                    Add-Violation -File $s.Name -Rule 'no-else' -Detail "else clause at line $($ifAst.ElseClause.Extent.StartLineNumber)"
                    $ruleCount++
                }
                if (@($ifAst.ElseIfClauses).Count -gt 0) {
                    foreach ($ei in $ifAst.ElseIfClauses) {
                        Add-Violation -File $s.Name -Rule 'no-elseif' -Detail "elseif clause at line $($ei.Extent.StartLineNumber)"
                        $ruleCount++
                    }
                }
            }

            # no finally, and every try has a catch
            $tries = $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.TryStatementAst] }, $true)
            foreach ($t in $tries) {
                if ($null -ne $t.Finally) {
                    Add-Violation -File $s.Name -Rule 'no-finally' -Detail "finally block at line $($t.Finally.Extent.StartLineNumber)"
                    $ruleCount++
                }
                if (@($t.CatchClauses).Count -eq 0) {
                    Add-Violation -File $s.Name -Rule 'try-needs-catch' -Detail "try at line $($t.Extent.StartLineNumber) has no catch clause"
                    $ruleCount++
                }
            }

            # mandatory strict mode + stop preference
            $text = Get-Content -LiteralPath $s.FullName -Raw
            if ($text -notmatch 'Set-StrictMode\s+-Version') {
                Add-Violation -File $s.Name -Rule 'strict-mode' -Detail 'Set-StrictMode -Version is not present'
                $ruleCount++
            }
            if ($text -notmatch "\`$ErrorActionPreference\s*=\s*'Stop'") {
                Add-Violation -File $s.Name -Rule 'stop-preference' -Detail "`$ErrorActionPreference = 'Stop' is not present"
                $ruleCount++
            }

            # ---- MANDATORY NODE.JS COMMAND RULE ------------------------------------------
            # Every command invocation must be a bare-word cmdlet/function or an explicit path.
            # A bare `npm` or `npx` command name is a hard violation on Windows.
            $commands = $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.CommandAst] }, $true)
            foreach ($cmd in $commands) {
                $name = $cmd.GetCommandName()
                if ($null -eq $name) { continue }
                $lower = $name.ToLowerInvariant()
                $isBareNodeTool = ($lower -eq 'npm' -or $lower -eq 'npx' -or $lower -eq 'node' -or $lower -eq 'npm.exe' -or $lower -eq 'npx.exe' -or $lower -eq 'node.exe')
                if ($isBareNodeTool) {
                    Add-Violation -File $s.Name -Rule 'explicit-node-path' -Detail "bare '$name' invoked at line $($cmd.Extent.StartLineNumber); use an explicit absolute path to npm.cmd or npx.cmd with the call operator"
                    $ruleCount++
                }
                # An invocation through a variable is only acceptable when the variable holds an
                # absolute .cmd/.exe path; flag obviously relative or name-only variable calls.
                if ($name.StartsWith('$') -and $lower -match 'npm|npx') {
                    $isCallOperator = $cmd.Extent.Text.TrimStart().StartsWith('&')
                    if (-not $isCallOperator) {
                        Add-Violation -File $s.Name -Rule 'call-operator' -Detail "'$name' invoked at line $($cmd.Extent.StartLineNumber) without the call operator '&'"
                        $ruleCount++
                    }
                }
            }

            # ---- WINDOWS-HOST DEFECT REGRESSIONS -------------------------------------------
            # Each of these was observed on a real native Windows PowerShell 5.1 run and had to be
            # corrected by hand. They are enforced here so a fresh bundle cannot reintroduce them.

            # (D) Get-NetTCPConnection must never be filtered on -State Listen: on the real host an
            # active listener was returned with a BLANK State, so the filter hid a live port.
            $netConns = $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.CommandAst] }, $true)
            foreach ($nc in $netConns) {
                $ncName = $nc.GetCommandName()
                if ($null -eq $ncName) { continue }
                if ($ncName -ne 'Get-NetTCPConnection') { continue }
                if ($nc.Extent.Text -match '-State\s+Listen') {
                    Add-Violation -File $s.Name -Rule 'no-state-listen' -Detail "Get-NetTCPConnection filtered on -State Listen at line $($nc.Extent.StartLineNumber); a blank State hides a real listener"
                    $ruleCount++
                }
            }

            # (G) native stderr must never be piped into the PowerShell pipeline: under
            # $ErrorActionPreference = 'Stop' the first stderr line becomes a terminating error,
            # which turned an expected fail-closed exit into a validator crash.
            if ($text -match '2>&1\s*\|\s*Out-String') {
                Add-Violation -File $s.Name -Rule 'no-native-stderr-pipe' -Detail 'a native command pipes stderr into the pipeline (2>&1 | Out-String); use Start-Process with file redirection'
                $ruleCount++
            }

            # (E) collection-returning calls must be normalised with @( ), or a single result
            # unrolls to a scalar and .Count / [0] silently mean something different.
            foreach ($m in [regex]::Matches($text, '\$(\w+)\s*=\s*(?!@\()(Get-IipsNamedPipes|Get-ChildItem|Get-NetTCPConnection)\b')) {
                Add-Violation -File $s.Name -Rule 'array-normalisation' -Detail "`$$($m.Groups[1].Value) = $($m.Groups[2].Value) is not wrapped in @( )"
                $ruleCount++
            }
            foreach ($m in [regex]::Matches($text, '\$(\w+)\s*=\s*(?!@\()Get-Content\b([^\r\n]*)')) {
                if ($m.Groups[2].Value -match '-Raw') { continue }
                Add-Violation -File $s.Name -Rule 'array-normalisation' -Detail "`$$($m.Groups[1].Value) = Get-Content (without -Raw) is not wrapped in @( )"
                $ruleCount++
            }

            # (F) the writer PID lives in the JSON the harness emits, not on the result object.
            foreach ($m in [regex]::Matches($text, '\$writerResults\[[^\]]+\]\.pid')) {
                Add-Violation -File $s.Name -Rule 'writer-pid-source' -Detail 'the writer PID is read off the PowerShell result object instead of the emitted JSON'
                $ruleCount++
            }

            # (A) the session must never be force-closed, and every script must end with an
            # explicit final status and offer -NoPause.
            if ($text -match '\[Environment\]::Exit') {
                Add-Violation -File $s.Name -Rule 'no-session-exit' -Detail '[Environment]::Exit closes the user session; use exit with an explicit code'
                $ruleCount++
            }
            if ($text -notmatch 'Write-IipsFinalStatus') {
                Add-Violation -File $s.Name -Rule 'final-status' -Detail 'no Write-IipsFinalStatus call; every script must state an explicit final result'
                $ruleCount++
            }
            if ($text -notmatch '\[switch\]\s*\$NoPause') {
                Add-Violation -File $s.Name -Rule 'nopause-param' -Detail 'no [switch] $NoPause parameter; automation cannot skip the pause'
                $ruleCount++
            }

            # (C) port 5173 belongs to ArthaVault. IIPS uses 5176.
            # Two files are exempt by design because they OWN the port policy rather than consume
            # it: Iips-Common.ps1 declares the constant and this script enforces the rule, so both
            # must legitimately name the digit.
            if ($s.Name -ne 'Iips-Common.ps1' -and $s.Name -ne '00-Validate-PowerShell-Syntax.ps1') {
                $lineNo = 0
                foreach ($rawLine in ($text -split "`r?`n")) {
                    $lineNo++
                    if ($rawLine.TrimStart().StartsWith('#')) { continue }
                    $scan = ($rawLine -split '#')[0]
                    if ($scan -match '\b5173\b') {
                        Add-Violation -File $s.Name -Rule 'no-stale-port' -Detail "port 5173 referenced at line $lineNo; 5173 belongs to ArthaVault and IIPS uses 5176"
                        $ruleCount++
                    }
                }
            }

            # The literal strings 'npm' / 'npx' must never appear as a resolved executable argument
            # to Start-Process either.
            $strings = $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.StringConstantExpressionAst] }, $true)
            foreach ($str in $strings) {
                $v = $str.Value
                if ($v -eq 'npm' -or $v -eq 'npx') {
                    Add-Violation -File $s.Name -Rule 'explicit-node-path' -Detail "the bare string '$v' is used at line $($str.Extent.StartLineNumber); a full npm.cmd / npx.cmd path is required"
                    $ruleCount++
                }
            }
        }

        $colour = 'Green'
        if ($errCount -gt 0 -or $ruleCount -gt 0) { $colour = 'Red' }
        Write-Host ("    {0,-38} {1,-7} {2,6}  {3,6}  {4,5}" -f $s.Name, $parseVerdict, $tokenCount, $errCount, $ruleCount) -ForegroundColor $colour

        if ($errCount -gt 0) {
            foreach ($e in $errors) {
                Write-Host "        L$($e.Extent.StartLineNumber):$($e.Extent.StartColumnNumber)  [$($e.ErrorId)]  $($e.Message)" -ForegroundColor Red
            }
        }

        $script:Rows.Add([pscustomobject]@{
            File = $s.Name; Parse = $parseVerdict; Tokens = $tokenCount
            ParseErrors = $errCount; RuleViolations = $ruleCount
        })
    }

    # -----------------------------------------------------------------------------------------
    Write-Host ''
    if ($script:Violations.Count -gt 0) {
        Write-Host 'STRUCTURAL RULE VIOLATIONS' -ForegroundColor Red
        foreach ($v in $script:Violations) {
            Write-Host "    $($v.File)  [$($v.Rule)]  $($v.Detail)" -ForegroundColor Red
        }
        Write-Host ''
    }

    Write-Host '-------------------------------------------------------------' -ForegroundColor DarkGray
    $okCount = @($script:Rows | Where-Object { $_.Parse -eq 'OK' -and $_.RuleViolations -eq 0 }).Count

    # Resolved into variables first: inline conditional expressions are not used in these scripts.
    $parseColour = 'Red'
    if ($okCount -eq $scripts.Count) { $parseColour = 'Green' }
    $errorColour = 'Red'
    if ($totalErrors -eq 0) { $errorColour = 'Green' }
    $ruleColour = 'Red'
    if ($script:Violations.Count -eq 0) { $ruleColour = 'Green' }

    Write-Host "    scripts parsed cleanly : $okCount / $($scripts.Count)" -ForegroundColor $parseColour
    Write-Host "    total parse errors     : $totalErrors" -ForegroundColor $errorColour
    Write-Host "    rule violations        : $($script:Violations.Count)" -ForegroundColor $ruleColour
    Write-Host ''

    if ($totalErrors -gt 0) {
        Write-Host "FAILED: $totalErrors syntax error(s) were reported by the native parser." -ForegroundColor Red
        Write-Host '        Do not run any other setup script until these are fixed.' -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'PowerShell syntax validation: stopped with exit 3. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 3
    }
    if ($script:Violations.Count -gt 0) {
        Write-Host "FAILED: $($script:Violations.Count) structural rule violation(s) were found." -ForegroundColor Red
        Write-Host '        The mandatory rules are: no else / elseif / finally, try+catch, strict mode,' -ForegroundColor Red
        Write-Host '        stop preference, and an explicit absolute path for every npm.cmd / npx.cmd call.' -ForegroundColor Red
        Write-IipsFinalStatus -Outcome 'FAIL' -Message 'PowerShell syntax validation: stopped with exit 4. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
        exit 4
    }

    Write-Host 'All scripts parsed cleanly and satisfy every structural rule.' -ForegroundColor Green
    Write-Host ''
    Write-Host 'WHAT THIS PROVES AND WHAT IT DOES NOT' -ForegroundColor Cyan
    Write-Host '  PROVES     : the scripts are syntactically valid for this PowerShell engine, and they' -ForegroundColor Gray
    Write-Host '               obey the structural and explicit-node-path rules.' -ForegroundColor Gray
    Write-Host '  NOT PROVEN : runtime behaviour. Type errors, wrong arguments, missing files and' -ForegroundColor Gray
    Write-Host '               Windows-specific API behaviour are only revealed by actual execution.' -ForegroundColor Gray
    Write-Host ''
    Write-Host 'NEXT: 01-Fresh-Clone-And-Install.ps1' -ForegroundColor Yellow
    Write-IipsFinalStatus -Outcome 'PASS' -Message 'PowerShell syntax validation: completed successfully.' -NoPause:$NoPause | Out-Null
    exit 0
}
catch {
    Write-Host ''
    Write-Host "FAILURE: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  at $($_.InvocationInfo.ScriptName):$($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor DarkGray
    Write-IipsFinalStatus -Outcome 'FAIL' -Message 'PowerShell syntax validation: stopped with exit 1. The specific reason is printed immediately above.' -NoPause:$NoPause | Out-Null
    exit 1
}
