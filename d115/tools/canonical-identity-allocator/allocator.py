#!/usr/bin/env python3
"""D115 development/reference canonical identity allocator.

Isolated governance utility. It does not integrate with the Security Master or runtime.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Iterable

SCHEMA_VERSION = "d115-canonical-identity-allocation-register/1.0.0"
PROCESS_VERSION = "d115-canonical-id-allocator/1.0.0"
GENESIS_PREDECESSOR = "GENESIS"
TEST_MARKER = "NON_PRODUCTION_MECHANISM_TEST_ONLY"

NAMESPACE_TYPES = {
    "IIPS-CANONICAL-ISSUER": "CANONICAL_ISSUER",
    "IIPS-CANONICAL-SECURITY": "CANONICAL_SECURITY",
    "IIPS-CSIP-COMPANY": "CSIP_COMPANY",
}
UUID4_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
DIGEST_RE = re.compile(r"^[0-9a-f]{64}$")
MERGE_MARKERS = ("<<<<<<<", "=======", ">>>>>>>")
REQUIRED_FIELDS = {
    "recordSchemaVersion", "recordSequence", "previousRecordDigest", "recordDigest",
    "allocatedId", "identityType", "namespace", "allocationStatus", "allocationTimestamp",
    "allocatorProcessVersion", "executingActor", "governanceOwner", "evidenceReferences",
    "externalIdentifierReferences", "identityMatchResult", "collisionCheckResult",
    "duplicateSearchResult", "reason", "approvalReference", "auditReference",
    "supersessionReference", "usageMarker",
}


class AllocationError(RuntimeError):
    """Fail-closed allocator error."""


class RegisterMalformed(AllocationError):
    pass


class RegisterLocked(AllocationError):
    pass


class IdentityConflict(AllocationError):
    pass


class GlobalCollision(AllocationError):
    pass


@dataclass(frozen=True)
class AllocationRequest:
    namespace: str
    identity_type: str
    executing_actor: str
    governance_owner: str
    evidence_references: tuple[str, ...]
    external_identifier_references: tuple[tuple[str, str], ...]
    reason: str
    approval_reference: str
    audit_reference: str
    usage_marker: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")


def canonical_bytes(record: dict) -> bytes:
    material = {k: v for k, v in record.items() if k != "recordDigest"}
    return json.dumps(material, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def record_digest(record: dict) -> str:
    return hashlib.sha256(canonical_bytes(record)).hexdigest()


def _nonempty_string(value: object, field: str) -> None:
    if not isinstance(value, str) or not value.strip():
        raise RegisterMalformed(f"{field} must be a non-empty string")


def validate_record(record: object, expected_sequence: int | None = None,
                    expected_previous: str | None = None) -> None:
    if not isinstance(record, dict):
        raise RegisterMalformed("record must be an object")
    missing = REQUIRED_FIELDS - set(record)
    extra = set(record) - REQUIRED_FIELDS
    if missing or extra:
        raise RegisterMalformed(f"schema fields mismatch; missing={sorted(missing)} extra={sorted(extra)}")
    if record["recordSchemaVersion"] != SCHEMA_VERSION:
        raise RegisterMalformed("unknown record schema version")
    if record["allocatorProcessVersion"] != PROCESS_VERSION:
        raise RegisterMalformed("unknown allocator process version")
    if not isinstance(record["recordSequence"], int) or isinstance(record["recordSequence"], bool) or record["recordSequence"] < 1:
        raise RegisterMalformed("recordSequence must be a positive integer")
    if expected_sequence is not None and record["recordSequence"] != expected_sequence:
        raise RegisterMalformed("non-monotonic record sequence")
    if expected_previous is not None and record["previousRecordDigest"] != expected_previous:
        raise RegisterMalformed("digest-chain predecessor mismatch")
    if record["previousRecordDigest"] != GENESIS_PREDECESSOR and not DIGEST_RE.fullmatch(str(record["previousRecordDigest"])):
        raise RegisterMalformed("invalid previousRecordDigest")
    if not DIGEST_RE.fullmatch(str(record["recordDigest"])) or record_digest(record) != record["recordDigest"]:
        raise RegisterMalformed("record digest mismatch")
    if record["namespace"] not in NAMESPACE_TYPES or NAMESPACE_TYPES[record["namespace"]] != record["identityType"]:
        raise RegisterMalformed("namespace/identityType mismatch")
    if not UUID4_RE.fullmatch(str(record["allocatedId"])):
        raise RegisterMalformed("allocatedId is not canonical lowercase UUIDv4")
    if record["allocationStatus"] not in {"RELEASED", "SUPERSEDED"}:
        raise RegisterMalformed("unknown allocationStatus")
    for field in ("executingActor", "governanceOwner", "reason", "approvalReference", "auditReference", "identityMatchResult", "collisionCheckResult", "duplicateSearchResult", "usageMarker"):
        _nonempty_string(record[field], field)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z", str(record["allocationTimestamp"])):
        raise RegisterMalformed("allocationTimestamp must be UTC RFC3339")
    if not isinstance(record["evidenceReferences"], list) or not record["evidenceReferences"] or not all(isinstance(x, str) and x.strip() for x in record["evidenceReferences"]):
        raise RegisterMalformed("evidenceReferences must be a non-empty string array")
    if not isinstance(record["externalIdentifierReferences"], list) or not record["externalIdentifierReferences"]:
        raise RegisterMalformed("externalIdentifierReferences must be non-empty")
    for identifier in record["externalIdentifierReferences"]:
        if set(identifier) != {"type", "value"}:
            raise RegisterMalformed("external identifier fields must be type and value")
        _nonempty_string(identifier["type"], "externalIdentifierReferences.type")
        _nonempty_string(identifier["value"], "externalIdentifierReferences.value")
    if record["supersessionReference"] is not None and not isinstance(record["supersessionReference"], str):
        raise RegisterMalformed("supersessionReference must be string or null")
    if record["allocationStatus"] == "SUPERSEDED" and not record["supersessionReference"]:
        raise RegisterMalformed("SUPERSEDED record requires supersessionReference")


def read_register(path: Path) -> list[dict]:
    if not path.exists():
        return []
    raw = path.read_bytes()
    if not raw:
        return []
    text = raw.decode("utf-8")
    if any(marker in text for marker in MERGE_MARKERS):
        raise RegisterMalformed("Git merge marker detected")
    if not raw.endswith(b"\n"):
        raise RegisterMalformed("truncated journal: final newline absent")
    records: list[dict] = []
    previous = GENESIS_PREDECESSOR
    for sequence, line in enumerate(text.splitlines(), 1):
        if not line.strip():
            raise RegisterMalformed("blank journal line")
        try:
            record = json.loads(line)
        except json.JSONDecodeError as exc:
            raise RegisterMalformed(f"invalid JSON at sequence {sequence}") from exc
        validate_record(record, sequence, previous)
        records.append(record)
        previous = record["recordDigest"]
    _validate_history(records)
    return records


def _identifier_key(values: Iterable[tuple[str, str]] | list[dict]) -> tuple[tuple[str, str], ...]:
    pairs = []
    for value in values:
        if isinstance(value, dict):
            pairs.append((value["type"].strip().upper(), value["value"].strip().upper()))
        else:
            pairs.append((value[0].strip().upper(), value[1].strip().upper()))
    return tuple(sorted(set(pairs)))


def _validate_history(records: list[dict]) -> None:
    first_seen: dict[str, tuple[str, str]] = {}
    audit_refs: set[str] = set()
    for record in records:
        allocated = record["allocatedId"]
        pair = (record["namespace"], record["identityType"])
        if allocated in first_seen and first_seen[allocated] != pair:
            raise RegisterMalformed("global UUID reused across namespaces")
        first_seen.setdefault(allocated, pair)
        if record["allocationStatus"] == "RELEASED" and allocated in first_seen and sum(r["allocatedId"] == allocated and r["allocationStatus"] == "RELEASED" for r in records) > 1:
            raise RegisterMalformed("released ID reused")
        if record["auditReference"] in audit_refs:
            raise RegisterMalformed("duplicate audit reference")
        audit_refs.add(record["auditReference"])


class ExclusiveLock:
    def __init__(self, path: Path, timeout: float = 5.0, poll: float = 0.01):
        self.path, self.timeout, self.poll, self.fd = path, timeout, poll, None

    def __enter__(self):
        deadline = time.monotonic() + self.timeout
        while True:
            try:
                self.fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                os.write(self.fd, f"pid={os.getpid()}\n".encode())
                os.fsync(self.fd)
                return self
            except FileExistsError:
                if time.monotonic() >= deadline:
                    raise RegisterLocked("exclusive register lock unavailable; state is ambiguous")
                time.sleep(self.poll)

    def __exit__(self, exc_type, exc, tb):
        if self.fd is not None:
            os.close(self.fd)
        try:
            self.path.unlink()
        except FileNotFoundError:
            pass


class Allocator:
    def __init__(self, register_path: Path, *, uuid_factory: Callable[[], uuid.UUID] = uuid.uuid4,
                 clock: Callable[[], str] = utc_now, lock_timeout: float = 5.0):
        self.path = Path(register_path)
        self.uuid_factory = uuid_factory
        self.clock = clock
        self.lock_timeout = lock_timeout

    def allocate(self, request: AllocationRequest) -> dict:
        self._validate_request(request)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with ExclusiveLock(self.path.with_suffix(self.path.suffix + ".lock"), self.lock_timeout):
            records = read_register(self.path)
            requested_key = _identifier_key(request.external_identifier_references)
            superseded_ids = {r["allocatedId"] for r in records if r["allocationStatus"] == "SUPERSEDED"}
            active = [r for r in records if r["allocationStatus"] == "RELEASED" and r["allocatedId"] not in superseded_ids]
            exact = [r for r in active if r["identityType"] == request.identity_type and _identifier_key(r["externalIdentifierReferences"]) == requested_key]
            if len(exact) == 1:
                return {"outcome": "RETAINED", "allocatedId": exact[0]["allocatedId"], "record": exact[0]}
            if len(exact) > 1:
                raise IdentityConflict("ambiguous identity: multiple retained exact matches")
            requested_ids = set(requested_key)
            overlaps = [r for r in active if requested_ids.intersection(_identifier_key(r["externalIdentifierReferences"]))]
            if overlaps:
                raise IdentityConflict("external identifier conflict; allocation refused")
            candidate = str(self.uuid_factory())
            if not UUID4_RE.fullmatch(candidate):
                raise AllocationError("UUID factory did not produce canonical lowercase UUIDv4")
            historical_ids = {r["allocatedId"] for r in records}
            if candidate in historical_ids:
                raise GlobalCollision("generated UUID has current or historical collision")
            record = self._build_record(request, records, candidate, "RELEASED", None)
            self._durable_append_and_verify(record)
            return {"outcome": "ALLOCATED", "allocatedId": candidate, "record": record}

    def supersede(self, allocated_id: str, request: AllocationRequest, supersession_reference: str) -> dict:
        self._validate_request(request)
        if not supersession_reference.strip():
            raise AllocationError("supersession reference is required")
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with ExclusiveLock(self.path.with_suffix(self.path.suffix + ".lock"), self.lock_timeout):
            records = read_register(self.path)
            matching = [r for r in records if r["allocatedId"] == allocated_id and r["allocationStatus"] == "RELEASED"]
            if len(matching) != 1:
                raise IdentityConflict("supersession requires exactly one released allocation")
            record = self._build_record(request, records, allocated_id, "SUPERSEDED", supersession_reference)
            self._durable_append_and_verify(record)
            return {"outcome": "SUPERSEDED", "allocatedId": allocated_id, "record": record}

    def _validate_request(self, request: AllocationRequest) -> None:
        if request.namespace not in NAMESPACE_TYPES or NAMESPACE_TYPES[request.namespace] != request.identity_type:
            raise AllocationError("namespace/identityType mismatch")
        for field in (request.executing_actor, request.governance_owner, request.reason, request.approval_reference, request.audit_reference, request.usage_marker):
            if not isinstance(field, str) or not field.strip():
                raise AllocationError("mandatory request string absent")
        if not request.evidence_references:
            raise AllocationError("evidence reference required")
        if not request.external_identifier_references:
            raise AllocationError("external identifier reference required")
        if request.usage_marker != TEST_MARKER:
            joined = " ".join(request.evidence_references).lower()
            if "fixture" in joined or "synthetic" in joined:
                raise AllocationError("synthetic/fixture evidence prohibited for governed allocation")

    def _build_record(self, req: AllocationRequest, records: list[dict], allocated_id: str,
                      status: str, supersession: str | None) -> dict:
        previous = records[-1]["recordDigest"] if records else GENESIS_PREDECESSOR
        record = {
            "recordSchemaVersion": SCHEMA_VERSION,
            "recordSequence": len(records) + 1,
            "previousRecordDigest": previous,
            "recordDigest": "",
            "allocatedId": allocated_id,
            "identityType": req.identity_type,
            "namespace": req.namespace,
            "allocationStatus": status,
            "allocationTimestamp": self.clock(),
            "allocatorProcessVersion": PROCESS_VERSION,
            "executingActor": req.executing_actor,
            "governanceOwner": req.governance_owner,
            "evidenceReferences": list(req.evidence_references),
            "externalIdentifierReferences": [{"type": k, "value": v} for k, v in req.external_identifier_references],
            "identityMatchResult": "NO_RETAINED_MATCH" if status == "RELEASED" else "RETAINED_ID_SUPERSESSION",
            "collisionCheckResult": "PASS_GLOBAL_CURRENT_AND_HISTORICAL",
            "duplicateSearchResult": "NO_DUPLICATE" if status == "RELEASED" else "EXACTLY_ONE_RELEASED_MATCH",
            "reason": req.reason,
            "approvalReference": req.approval_reference,
            "auditReference": req.audit_reference,
            "supersessionReference": supersession,
            "usageMarker": req.usage_marker,
        }
        record["recordDigest"] = record_digest(record)
        validate_record(record, len(records) + 1, previous)
        return record

    def _durable_append_and_verify(self, record: dict) -> None:
        line = json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode() + b"\n"
        fd = os.open(self.path, os.O_CREAT | os.O_WRONLY | os.O_APPEND, 0o600)
        try:
            view = memoryview(line)
            while view:
                written = os.write(fd, view)
                if written <= 0:
                    raise AllocationError("partial append")
                view = view[written:]
            os.fsync(fd)
        finally:
            os.close(fd)
        reread = read_register(self.path)
        if not reread or reread[-1] != record:
            raise AllocationError("fsync/re-read verification failed")
