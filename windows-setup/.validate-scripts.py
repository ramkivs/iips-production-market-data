"""Structural validator for the IIPS PowerShell deliverables.

No PowerShell runtime is reachable from this sandbox (release-assets.githubusercontent.com is not
on the allowlist and there is no apt/dotnet route), so a real parse could not be executed. This
validator checks the things that actually break PowerShell scripts mechanically:

  1. forbidden constructs: else / elseif / finally
  2. brace, parenthesis and bracket balance, computed OUTSIDE strings and comments
  3. every `try` has a matching `catch`
  4. no unterminated here-strings
  5. no tab characters, no CRLF-in-the-middle surprises
  6. every function body is brace-balanced
  7. `exit` codes are explicit integers
"""
import re
import sys
from pathlib import Path

ROOT = Path("/home/user/iips-production-market-data/windows-setup")


def strip_strings_and_comments(src: str) -> str:
    """Blank out everything inside strings/comments so balance counting only sees code."""
    out = []
    i = 0
    n = len(src)
    while i < n:
        c = src[i]
        # here-strings
        if src.startswith("@'", i) or src.startswith('@"', i):
            quote = src[i + 1]
            end = "\n'@" if quote == "'" else '\n"@'
            j = src.find(end, i)
            if j == -1:
                out.append("\n" * src.count("\n", i))
                i = n
                continue
            out.append("\n" * src.count("\n", i, j + len(end)))
            i = j + len(end)
            continue
        # line comment
        if c == "#":
            j = src.find("\n", i)
            if j == -1:
                i = n
            else:
                i = j
            continue
        # block comment
        if src.startswith("<#", i):
            j = src.find("#>", i)
            if j == -1:
                out.append("\n" * src.count("\n", i))
                i = n
                continue
            out.append("\n" * src.count("\n", i, j + 2))
            i = j + 2
            continue
        # quoted strings
        if c in "'\"":
            j = i + 1
            while j < n:
                if src[j] == "`":
                    j += 2
                    continue
                if src[j] == c:
                    break
                j += 1
            out.append(" ")
            i = j + 1
            continue
        out.append(c)
        i += 1
    return "".join(out)


ok = fail = 0


def check(cond, label, detail=""):
    global ok, fail
    if cond:
        ok += 1
        print(f"  PASS  {label}")
    else:
        fail += 1
        print(f"  FAIL  {label}  {detail}")


LIBRARY = "Iips-Common.ps1"

for path in sorted(ROOT.glob("*.ps1")):
    is_library = path.name == LIBRARY
    script_name = path.name
    raw = path.read_text(encoding="utf-8")
    code = strip_strings_and_comments(raw)
    print(f"\n=== {path.name} ({len(raw.splitlines())} lines) ===")

    # 1. forbidden constructs
    forbidden = []
    for kw in ("else", "elseif", "finally"):
        for m in re.finditer(rf"\b{kw}\b", code):
            line = code.count("\n", 0, m.start()) + 1
            forbidden.append(f"{kw}@L{line}")
    check(not forbidden, "no else / elseif / finally", ",".join(forbidden))

    # 2. balance
    for open_c, close_c, name in (("{", "}", "braces"), ("(", ")", "parens"), ("[", "]", "brackets")):
        diff = code.count(open_c) - code.count(close_c)
        check(diff == 0, f"{name} balanced", f"net {diff:+d}")

    # 3. try/catch pairing
    tries = len(re.findall(r"\btry\b", code))
    catches = len(re.findall(r"\bcatch\b", code))
    if is_library:
        check(tries == catches, f"try/catch balanced in library ({tries} try, {catches} catch)")
    if not is_library:
        check(tries == catches and tries > 0, f"try/catch paired ({tries} try, {catches} catch)")

    # 4. here-strings terminated
    hs_open = raw.count("@'") + raw.count('@"')
    hs_close = raw.count("'@") + raw.count('"@')
    check(hs_open == hs_close, f"here-strings terminated ({hs_open}/{hs_close})")

    # 5. whitespace hygiene
    check("\t" not in raw, "no tab characters")
    check("\r\n" not in raw, "no CRLF (Windows will accept LF; avoids mixed endings)")

    # 6. every function balanced
    bad_fn = []
    for m in re.finditer(r"^\s*function\s+([A-Za-z0-9_-]+)", code, re.M):
        start = code.find("{", m.end())
        if start == -1:
            bad_fn.append(f"{m.group(1)}:no-body")
            continue
        depth = 0
        for k in range(start, len(code)):
            if code[k] == "{":
                depth += 1
            elif code[k] == "}":
                depth -= 1
                if depth == 0:
                    break
        if depth != 0:
            bad_fn.append(m.group(1))
    check(not bad_fn, "every function body closed", ",".join(bad_fn))

    # 7. explicit exit codes
    exits = re.findall(r"^\s*exit\s+(\$?\w+)", code, re.M)
    check(all(e.isdigit() or e.startswith("$") for e in exits), f"explicit exit codes {sorted(set(exits))}")

    # 8. required quality features
    check("Set-StrictMode" in code, "Set-StrictMode present")
    if not is_library:
        # checked against the RAW text: the literal 'Stop' is a string and gets blanked out above
        check("$ErrorActionPreference = 'Stop'" in raw, "ErrorActionPreference = Stop")
        check("[CmdletBinding()]" in code, "CmdletBinding declared")
    check("#Requires -Version 5.1" in raw, "Requires PowerShell 5.1")

    # 9. mandatory Windows Node.js command rule: no bare npm / npx anywhere
    bare = []
    stale_ports = []
    for pat, label in ((r"(?<![\w.-])npm(?![\w.-])", "bare 'npm'"),
                       (r"(?<![\w.-])npx(?![\w.-])", "bare 'npx'")):
        for m in re.finditer(pat, code):
            line = code.count("\n", 0, m.start()) + 1
            bare.append(f"{label}@L{line}")
    # `npm.cmd` / `npx.cmd` are allowed; the regex above excludes them via the trailing \w check
    invokes_node = ("NpmCmd" in raw) or ("NpxCmd" in raw) or ("NodeExe" in raw)
    if invokes_node:
        check("$toolchain.NpmCmd" in raw or "$toolchain.NpxCmd" in raw or "Resolve-IipsNodeToolchain" in raw,
              "uses the shared resolved toolchain")
    if not invokes_node:
        check(True, f"no Node.js invocation - toolchain rule not applicable")

    # 10. WINDOWS-HOST DEFECT REGRESSIONS (each one was observed on a real Windows run) --------

    # (D) listener detection must not depend on a populated State property
    check("-State Listen" not in code,
          "port owner lookup does not filter on -State Listen (a blank State hides a real listener)")
    if script_name == "Iips-Common.ps1":
        check("MSFT_NetTCPConnection" in raw,
              "documents/handles the empty Get-NetTCPConnection result")
        check("Get-IipsPortOccupantCount" in raw,
              "release check uses occupant count, not merely absence of a listener")

    # (G) native stderr must never be piped into the PowerShell pipeline under Stop
    check("2>&1 | Out-String" not in code,
          "no native stderr piped into the pipeline (`2>&1 | Out-String` terminates under Stop)")

    # (E) scalar-versus-array: collection-returning calls must be normalised with @( )
    # Only calls that can return zero/one/many objects are in scope. `Get-Content -Raw` returns a
    # single string by design, and `Get-Process -Id` / `Get-CimInstance -Filter ProcessId=` return
    # exactly one object, so those are excluded rather than flagged as noise.
    unnormalised = []
    for m in re.finditer(
        r"\$(\w+)\s*=\s*(?!@\()(Get-IipsNamedPipes|Get-ChildItem|Get-NetTCPConnection)\b",
        code):
        unnormalised.append(f"${m.group(1)}={m.group(2)}@L{code.count(chr(10), 0, m.start()) + 1}")
    for m in re.finditer(r"\$(\w+)\s*=\s*(?!@\()Get-Content\b([^\n]*)", code):
        if "-Raw" in m.group(2):
            continue
        unnormalised.append(f"${m.group(1)}=Get-Content@L{code.count(chr(10), 0, m.start()) + 1}")
    check(not unnormalised, "collection-returning calls are normalised with @( )", ",".join(unnormalised[:6]))

    # (F) the writer PID lives in the harness JSON, not on the PowerShell result object
    check(not re.search(r"\$writerResults\[[^\]]+\]\.pid", code),
          "writer PID is not read off the result object (it lives in the emitted JSON)")

    # (B) node must be invoked by explicit path too, not only npm/npx
    for m in re.finditer(r"(?<![\w.$-])node(?![\w.-])", code):
        line = code.count("\n", 0, m.start()) + 1
        bare.append(f"bare 'node'@L{line}")

    # (A) terminal preservation and an explicit final status
    if not is_library:
        # The DECLARATION must be present, not merely the token: usages like -NoPause:$NoPause
        # would satisfy a substring test even with the parameter removed.
        check("[switch] $NoPause" in raw, "declares the -NoPause switch parameter")
        check("Write-IipsFinalStatus" in raw, "ends through Write-IipsFinalStatus (explicit final status)")
        check("Read-Host" not in raw or "try { $null = Read-Host }" in raw,
              "pause is guarded so a non-interactive run cannot fail")


    # (C) port allocation: 5173 belongs to ArthaVault, IIPS uses 5176.
    #
    # This scans the RAW text with only comments removed, because port references live inside
    # string literals (browser URLs) as well as in code (parameter defaults); scanning the fully
    # string-stripped `code` makes every URL reference invisible - a silent false negative.
    #
    # Two files are exempt by design, because they OWN the port policy rather than consume it:
    #   Iips-Common.ps1                   declares $script:IipsArthaVaultPort and the plan
    #   00-Validate-PowerShell-Syntax.ps1 enforces this rule, so it must name the digit
    # Exempting them at file level is deliberate and auditable; trying to exempt individual lines
    # by pattern is fragile and self-referential.
    if script_name not in ("Iips-Common.ps1", "00-Validate-PowerShell-Syntax.ps1"):
        for lineno, rawline in enumerate(raw.splitlines(), 1):
            if rawline.strip().startswith("#"):
                continue
            scan = rawline.split("#", 1)[0]
            if re.search(r"\b5173\b", scan):
                stale_ports.append(f"5173@L{lineno}")

    # The accumulators above are only complete at this point, so these two gates must run here.
    check(not bare, "no bare npm / npx / node (only *.cmd by explicit path)", ",".join(bare[:8]))
    check(not stale_ports, "no stale 5173 (ArthaVault owns it; IIPS uses 5176)", ",".join(stale_ports[:8]))

    check("[Environment]::Exit" not in code and "Stop-Process -Id $PID" not in code,
          "never force-closes the user's PowerShell session")

    # 11. localhost-only binding for dev servers
    if "run', 'dev'" in raw:
        check("'--host'" in raw, "dev server passes an explicit --host")
        check("ExpectedAddress" in raw or "LocalAddress" in raw, "verifies the actual listener address")

    # 11. no destructive verbs against the checkouts
    destructive = re.findall(r"Remove-Item[^|]*\$irrDir|Remove-Item[^|]*\$ipdDir|git\s+push|git\s+reset|git\s+clean|-Force\s+.*clone", code)
    check(not destructive, "no destructive repo operations", str(destructive))

print(f"\n=== TALLY: {ok} pass / {fail} fail ===")
sys.exit(1 if fail else 0)
