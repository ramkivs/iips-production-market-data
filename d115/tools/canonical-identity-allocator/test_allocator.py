import importlib.util
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
import uuid
import sys

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("d115_allocator", HERE / "allocator.py")
a = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = a
SPEC.loader.exec_module(a)

FIXED_TIME = "2026-09-18T12:00:00.000000Z"
UUID_ISSUER = uuid.UUID("11111111-1111-4111-8111-111111111111")
UUID_SECURITY = uuid.UUID("22222222-2222-4222-8222-222222222222")


def req(*, namespace="IIPS-CANONICAL-ISSUER", identity_type="CANONICAL_ISSUER",
        identifiers=(("TEST-ID", "NONPROD-A"),), audit="AUDIT-1", marker=a.TEST_MARKER,
        evidence=("NON_PRODUCTION_MECHANISM_TEST_ONLY:EVIDENCE-1",),
        approval_reference="READINESS-ONLY"):
    return a.AllocationRequest(
        namespace=namespace, identity_type=identity_type,
        executing_actor="readiness-test", governance_owner="Program Authority",
        evidence_references=tuple(evidence), external_identifier_references=tuple(identifiers),
        reason="NON_PRODUCTION_MECHANISM_TEST_ONLY", approval_reference=approval_reference,
        audit_reference=audit, usage_marker=marker,
    )


class AllocatorReadiness(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / "register.jsonl"

    def tearDown(self):
        self.tmp.cleanup()

    def allocator(self, value=UUID_ISSUER, timeout=1.0):
        return a.Allocator(self.path, uuid_factory=lambda: value, clock=lambda: FIXED_TIME, lock_timeout=timeout)

    def allocate(self, **kwargs):
        return self.allocator().allocate(req(**kwargs))

    def test_01_empty_register_and_explicit_genesis(self):
        self.assertEqual(a.read_register(self.path), [])
        result = self.allocate()
        self.assertEqual(result["record"]["recordSequence"], 1)
        self.assertEqual(result["record"]["previousRecordDigest"], a.GENESIS_PREDECESSOR)

    def test_02_schema_validation_and_audit_completeness(self):
        record = self.allocate()["record"]
        a.validate_record(record, 1, a.GENESIS_PREDECESSOR)
        self.assertEqual(set(record), a.REQUIRED_FIELDS)

    def test_03_namespace_type_enforcement(self):
        with self.assertRaises(a.AllocationError):
            self.allocate(identity_type="CANONICAL_SECURITY")

    def test_04_valid_lowercase_uuid4(self):
        allocated = self.allocate()["allocatedId"]
        self.assertRegex(allocated, a.UUID4_RE)
        self.assertEqual(allocated, allocated.lower())

    def test_05_malformed_uuid_rejection(self):
        bad = a.Allocator(self.path, uuid_factory=lambda: "NOT-A-UUID", clock=lambda: FIXED_TIME)
        with self.assertRaises(a.AllocationError):
            bad.allocate(req())
        self.assertFalse(self.path.exists())

    def test_06_global_cross_namespace_collision_rejection(self):
        self.allocate()
        other = a.Allocator(self.path, uuid_factory=lambda: UUID_ISSUER, clock=lambda: FIXED_TIME)
        with self.assertRaises(a.GlobalCollision):
            other.allocate(req(namespace="IIPS-CANONICAL-SECURITY", identity_type="CANONICAL_SECURITY",
                               identifiers=(("TEST-ID", "NONPROD-B"),), audit="AUDIT-2"))

    def test_07_historical_id_non_reuse_after_supersession(self):
        result = self.allocate()
        self.allocator().supersede(result["allocatedId"], req(audit="AUDIT-SUP"), "CORRECTION-1")
        with self.assertRaises(a.GlobalCollision):
            self.allocator(UUID_ISSUER).allocate(req(identifiers=(("TEST-ID", "NONPROD-C"),), audit="AUDIT-3"))

    def test_08_duplicate_identity_returns_retained_id_without_append(self):
        first = self.allocate()
        second = self.allocator(UUID_SECURITY).allocate(req(audit="IGNORED-BECAUSE-RETAINED"))
        self.assertEqual(second["outcome"], "RETAINED")
        self.assertEqual(second["allocatedId"], first["allocatedId"])
        self.assertEqual(len(a.read_register(self.path)), 1)

    def test_09_external_identifier_conflict_fails_closed(self):
        self.allocate(identifiers=(("ISIN", "TEST00000001"), ("SYMBOL", "AAA")))
        with self.assertRaises(a.IdentityConflict):
            self.allocator(UUID_SECURITY).allocate(req(identifiers=(("ISIN", "TEST00000001"), ("SYMBOL", "BBB")), audit="AUDIT-2"))

    def test_10_atomic_lock_failure_fails_closed(self):
        lock = self.path.with_suffix(".jsonl.lock")
        lock.write_text("ambiguous")
        with self.assertRaises(a.RegisterLocked):
            self.allocator(timeout=0.01).allocate(req())
        self.assertFalse(self.path.exists())

    def test_11_truncated_journal_detection(self):
        self.path.write_text('{"partial":')
        with self.assertRaises(a.RegisterMalformed):
            a.read_register(self.path)

    def test_12_append_only_supersession(self):
        first = self.allocate()["record"]
        sup = self.allocator().supersede(first["allocatedId"], req(audit="AUDIT-2"), "CORRECTION-1")["record"]
        records = a.read_register(self.path)
        self.assertEqual(len(records), 2)
        self.assertEqual(records[0], first)
        self.assertEqual(sup["allocationStatus"], "SUPERSEDED")
        self.assertEqual(sup["supersessionReference"], "CORRECTION-1")

    def test_13_digest_chain_tamper_detection(self):
        self.allocate()
        data = self.path.read_text().replace("NONPROD-A", "NONPROD-X")
        self.path.write_text(data)
        with self.assertRaises(a.RegisterMalformed):
            a.read_register(self.path)

    def test_14_deterministic_retained_id_resolution(self):
        allocated = self.allocate()["allocatedId"]
        for _ in range(3):
            self.assertEqual(self.allocator(UUID_SECURITY).allocate(req())["allocatedId"], allocated)

    def test_15_concurrent_allocations_serialize(self):
        values = iter([UUID_ISSUER, UUID_SECURITY])
        guard = threading.Lock()
        def factory():
            with guard:
                return next(values)
        alloc = a.Allocator(self.path, uuid_factory=factory, clock=lambda: FIXED_TIME, lock_timeout=2)
        outcomes, errors = [], []
        def run():
            try: outcomes.append(alloc.allocate(req()))
            except Exception as exc: errors.append(exc)
        threads = [threading.Thread(target=run) for _ in range(2)]
        for t in threads: t.start()
        for t in threads: t.join()
        self.assertFalse(errors)
        self.assertEqual(sorted(x["outcome"] for x in outcomes), ["ALLOCATED", "RETAINED"])
        self.assertEqual(len(a.read_register(self.path)), 1)

    def test_16_fsync_reread_verification(self):
        result = self.allocate()
        self.assertEqual(a.read_register(self.path)[-1]["recordDigest"], result["record"]["recordDigest"])

    def test_17_unknown_schema_version_rejected(self):
        record = self.allocate()["record"]
        record["recordSchemaVersion"] = "unknown"
        record["recordDigest"] = a.record_digest(record)
        self.path.write_text(json.dumps(record, sort_keys=True, separators=(",", ":")) + "\n")
        with self.assertRaises(a.RegisterMalformed): a.read_register(self.path)

    def test_18_unknown_process_version_rejected(self):
        record = self.allocate()["record"]
        record["allocatorProcessVersion"] = "unknown"
        record["recordDigest"] = a.record_digest(record)
        self.path.write_text(json.dumps(record, sort_keys=True, separators=(",", ":")) + "\n")
        with self.assertRaises(a.RegisterMalformed): a.read_register(self.path)

    def test_19_duplicate_external_identifiers_normalized(self):
        first = self.allocate(identifiers=(("isin", " test00000001 "),))
        retained = self.allocator(UUID_SECURITY).allocate(req(identifiers=(("ISIN", "TEST00000001"),), audit="A2"))
        self.assertEqual(retained["allocatedId"], first["allocatedId"])

    def test_20_ambiguous_identity_fails_closed(self):
        r1 = self.allocate()["record"]
        r2 = dict(r1)
        r2.update(recordSequence=2, previousRecordDigest=r1["recordDigest"], allocatedId=str(UUID_SECURITY), auditReference="AUDIT-2")
        r2["recordDigest"] = a.record_digest(r2)
        self.path.write_text("\n".join(json.dumps(x, sort_keys=True, separators=(",", ":")) for x in (r1, r2)) + "\n")
        with self.assertRaises(a.IdentityConflict): self.allocator().allocate(req())

    def test_21_missing_approval_reference_rejected(self):
        with self.assertRaises(a.AllocationError): self.allocator().allocate(req(approval_reference=""))

    def test_22_missing_evidence_reference_rejected(self):
        with self.assertRaises(a.AllocationError): self.allocator().allocate(req(evidence=()))

    def test_23_synthetic_fixture_isolation_for_governed_request(self):
        with self.assertRaises(a.AllocationError):
            self.allocator().allocate(req(marker="GOVERNED", evidence=("synthetic-fixture",)))

    def test_24_git_merge_marker_fails_closed(self):
        self.path.write_text("<<<<<<< ours\n=======\n>>>>>>> theirs\n")
        with self.assertRaises(a.RegisterMalformed): a.read_register(self.path)

    def test_25_real_journal_remains_empty_and_has_no_hdfclife(self):
        real = HERE.parents[1] / "governance/canonical-identity/allocation-register.jsonl"
        self.assertTrue(real.exists())
        self.assertEqual(real.read_bytes(), b"")
        self.assertNotIn(b"HDFCLIFE", real.read_bytes())

    def test_26_no_product_runtime_imports(self):
        source = (HERE / "allocator.py").read_text()
        for token in ("frontend", "iips-platform", "dynamic-runner", "SecurityMaster"):
            self.assertNotIn(token, source)

    def test_27_explicit_null_supersession_on_release(self):
        self.assertIsNone(self.allocate()["record"]["supersessionReference"])

    def test_28_non_monotonic_sequence_rejected(self):
        r = self.allocate()["record"]
        r["recordSequence"] = 2
        r["recordDigest"] = a.record_digest(r)
        self.path.write_text(json.dumps(r, sort_keys=True, separators=(",", ":")) + "\n")
        with self.assertRaises(a.RegisterMalformed): a.read_register(self.path)

    def test_29_append_is_single_newline_terminated_record(self):
        self.allocate()
        raw = self.path.read_bytes()
        self.assertTrue(raw.endswith(b"\n"))
        self.assertEqual(raw.count(b"\n"), 1)

    def test_30_process_and_schema_versions_exact(self):
        r = self.allocate()["record"]
        self.assertEqual(r["recordSchemaVersion"], a.SCHEMA_VERSION)
        self.assertEqual(r["allocatorProcessVersion"], a.PROCESS_VERSION)


if __name__ == "__main__":
    unittest.main()
