# D115 Canonical Identity Allocator

Development/reference governance utility authorized by
`D115-ST3-CANONICAL-ID-ALLOCATOR-AUTH-20260918-01`.

It is isolated from the active Security Master and product runtime. The real register is
`d115/governance/canonical-identity/allocation-register.jsonl`; readiness tests never write to it.
The empty file represents a valid pre-allocation register. The first record uses the explicit
`GENESIS` predecessor.

Run readiness tests:

```bash
python3 -m unittest discover -s d115/tools/canonical-identity-allocator -p 'test_*.py' -v
```

No HDFC Life allocation is authorized by implementation or test success.
