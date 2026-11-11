/** Offline read-only operator command; deliberately does not import the IPC entrypoint. */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectClassPJournal } from './classPJournal.js';

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--directory') {
    console.error('Usage: node dist/src/ipc/inspectClassPDiagnostics.js --directory <absolute local journal directory>');
    process.exitCode = 2;
  } else {
    try {
      const result = inspectClassPJournal(args[1]);
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.issues.length ? 1 : 0;
    } catch {
      console.error('IPD_CLASS_P_INSPECTION_FAILED: journal unavailable, unsafe, or inaccessible; no changes made');
      process.exitCode = 1;
    }
  }
}
