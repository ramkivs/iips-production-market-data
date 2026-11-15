#!/usr/bin/env python3
"""W04 E4 follow-up. Read-only search of two Git object stores for the committed import.

For every blob reachable from any local or remote-tracking ref (all history), it computes
SHA-256 of the bytes as stored and, for text, of five text forms (byte-order mark removed;
LF; CRLF; LF and CRLF without the final line break) and compares each with the import
content digest. Only equality is reported. No file content and no path is printed.

Usage: search-import-content-digest.py <IPD checkout> <IRR checkout>
"""
import hashlib
import subprocess
import sys
import threading

TARGET = 'a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107'
LIMIT = 4 * 1024 * 1024


def git(repo, *args, data=None):
    return subprocess.run(['git', '-C', repo, *args], input=data, capture_output=True, check=True).stdout


def search(name, repo):
    listed = git(repo, 'rev-list', '--all', '--objects').decode('utf-8', 'replace').splitlines()
    ids = sorted({line.split(' ', 1)[0] for line in listed})
    checked = [c.split() for c in git(repo, 'cat-file', '--batch-check', data=('\n'.join(ids) + '\n').encode()).decode().splitlines()]
    blobs = [c[0] for c in checked if c[1] == 'blob' and 0 < int(c[2]) <= LIMIT]
    too_large = sum(1 for c in checked if c[1] == 'blob' and int(c[2]) > LIMIT)
    proc = subprocess.Popen(['git', '-C', repo, 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)

    def feed():
        proc.stdin.write(('\n'.join(blobs) + '\n').encode())
        proc.stdin.close()

    threading.Thread(target=feed, daemon=True).start()
    equal = []
    for _ in blobs:
        header = proc.stdout.readline().split()
        body = proc.stdout.read(int(header[2]))
        proc.stdout.read(1)
        forms = [body]
        if b'\x00' not in body[:4096]:
            text = body[3:] if body.startswith(b'\xef\xbb\xbf') else body
            lf = text.replace(b'\r\n', b'\n')
            bare = lf.rstrip(b'\n')
            forms += [text, lf, lf.replace(b'\n', b'\r\n'), bare, bare.replace(b'\n', b'\r\n')]
        if any(hashlib.sha256(f).hexdigest() == TARGET for f in forms):
            equal.append(header[0].decode())
    refs = len(git(repo, 'for-each-ref', '--format=%(refname)').decode().splitlines())
    mentions = len(git(repo, 'log', '--all', '--oneline', '-S' + TARGET[:16]).decode().splitlines())
    print(f'{name}: HEAD {git(repo, "rev-parse", "HEAD").decode().strip()}; refs {refs}; blobs compared {len(blobs)}; '
          f'blobs over 4 MiB not compared {too_large}; blobs equal to the digest {len(equal)} {equal}; '
          f'commits that add or remove the digest text {mentions}')


if __name__ == '__main__':
    print(f'target import content digest: {TARGET}')
    search('IPD', sys.argv[1])
    search('IRR', sys.argv[2])
