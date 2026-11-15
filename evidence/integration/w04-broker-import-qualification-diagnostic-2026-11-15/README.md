# W04 broker import qualification diagnostic (prepared 2026-11-15)

Status: **prepared, not run on the host.** W04 remains **PARTIALLY COMPLETE — NOT ACCEPTED**.

Record: [root cause and prevention](../../../docs/integration/IIPS-W04-BROKER-IMPORT-SECURITY-IDENTITY-QUALIFICATION-ROOT-CAUSE-AND-PREVENTION-2026-11-15.md).

## What it answers

`DHAN_PORTFOLIO` revision 1 stores a security identity on 1 holding and `null` on 63. The typed reason computed at that import was not returned, stored or logged. It cannot be read back from any artefact.

The diagnostic answers a different question that can be answered: **with the sources the examined IPD checkout holds now, which rows of the original CSV qualify, which do not, and for what typed reason? Does that agree with what revision 1 stored?**

| Result | Meaning |
|---|---|
| `REPRODUCES_STORED_STATE` | Every holding that has a stored identity qualifies today to the same security identifier, and every holding stored as `null` is unresolved today. The sources of the checkout are sufficient to explain revision 1. The reasons printed are those the checkout gives today. |
| `DIFFERS_FROM_STORED_STATE` | At least one holding does not agree. The sources in force at the import were not those of this checkout. |
| `COUNTS_ONLY_NO_CAPTURE` | No capture was given. The counts of today's qualification stand alone. |
| `PARTIAL` | The capture and the CSV could not be paired completely. |
| `INCONCLUSIVE` | The run stopped. The `[STOP]` line names the step. |

A reproduction is a new measurement. It is not a record of the import and it does not prove the reason computed then.

## Files

| File | Content |
|---|---|
| `w04-broker-import-qualification-diagnostic.mjs` | The diagnostic. SHA-256 `629572186a6f91fec510f1b34f4ab961772fd911e6140c815250a417d3de2088`. |
| `qualification-diagnostic-selftest.mjs` | Self-test on synthetic inputs: 24 checks. |
| `qualification-diagnostic-selftest.output.txt` | Output of the self-test in the sandbox. |
| `sample-output-synthetic.txt` | Output of one run on four invented rows and a hand-built capture. It shows the form of the output only. |

## Read-only

- Node built-ins used: `node:crypto`, `node:fs`, `node:path`, `node:url`. No network module, no child process, no database module. Every file is opened with the `'r'` flag. There is no write, rename, delete or mkdir call.
- It does not start, stop or contact IPD or IRR. It does not open the portfolio database or any journal. It does not run git.
- It loads four compiled modules of the examined checkout and the seven they import. At the reviewed commits these eleven modules import no Node built-in and no package: they cannot read or write a file or open a socket. The diagnostic checks this for the files it is about to load and stops if it does not hold.
- It never loads `dhan_local_daemon.js`, which is a start script. It fills the registry from the manifest with the same rule that file uses.
- The self-test checks the source for write, process, network and database calls, and checks that the manifest, the compiled code and the inputs are byte-identical after eight runs.

## Output

Counts, SHA-256 digests of whole files, Git object ids of source files, one commit id, yes/no answers and values from closed vocabularies. It prints no symbol, ISIN, company identifier, security identifier, file name, path, quantity, price, value or weight. The self-test checks this.

## How to run it on the Windows host

Do not change the IPD checkout. Do not pull, switch branch or rebuild. Save the one file `w04-broker-import-qualification-diagnostic.mjs` to a folder outside both checkouts and check its SHA-256 against the value above.

```powershell
Get-FileHash -Algorithm SHA256 .\w04-broker-import-qualification-diagnostic.mjs

node .\w04-broker-import-qualification-diagnostic.mjs `
  --csv "<path of the original CSV>" `
  --ipd-root "<IPD checkout the IPC provider is started from>" `
  --capture-dir "<capture root used for the lineage utility>" `
  --server-cwd "<directory the IPC provider command is run in>"
```

`--capture-dir` and `--server-cwd` are optional. Without `--capture-dir` the result is counts only. Node 22.13 or later, the version the IPC provider needs.

Send back the complete output. It contains no holding data.

## What each part settles

| Part of the output | Question it settles |
|---|---|
| `checkout.commit`, `checkout.sources` | Which commit the checkout is at, and whether its 14 identity-deciding source files are the reviewed versions. |
| `checkout.compiled.fresh` | Whether the compiled code is at least as new as those sources. This is a hint from file times. |
| `checkout.manifest.*` | Whether the P7 manifest of the checkout is the tracked one (96 mappings, 48 ISINs). |
| `serverCwd.manifest` | Whether a different manifest sits where the server looks first. |
| `gate`, `qualification`, `qualification.perExchange` | What the company gate and the qualification return today for the CSV holdings. |
| `table`, `reproduction` | Whether that agrees, holding by holding, with what revision 1 stored. |

## What it cannot settle

- Which process and which build served the import of revision 1. No artefact records it.
- The reason computed at that import.
- Anything about a holding outside the two inputs.

## Self-test

```
npm run build
node evidence/integration/w04-broker-import-qualification-diagnostic-2026-11-15/qualification-diagnostic-selftest.mjs
```

The inputs of the self-test are synthetic. The rows use issuer facts of the tracked P04 master and P7 manifest; quantities and prices are invented; the captures are hand-built. The self-test says nothing about revision 1.
