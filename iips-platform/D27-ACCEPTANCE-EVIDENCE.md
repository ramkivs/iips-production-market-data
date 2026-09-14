# D27 — Bounded Plugin Namespace Acceptance Evidence

Status: ACCEPTED
Gate: D26
Date: 2026-09-10

## Authority

D22-B authorized a new bounded namespace contract based on current
PluginLoader / PluginContract identity semantics.

This implementation is NOT a reconstruction of the lost historical
NamespaceCollisionGuard API.

Historical EngineRegistry API is likewise NOT reconstructed.

## Implemented Contract

New bounded namespace:

src/plugin-loader/PluginNamespace.ts

Identity key:

PluginContract.identity.engineId

Semantics:

- register(plugin) rejects missing identity engineId
- duplicate engineId registration is rejected
- successful registration is keyed by identity.engineId
- get(engineId) retrieves the registered plugin
- has(engineId) reports registration
- list() returns registered engine IDs
- size reports registration count

## Integration

PluginLoader delegates namespace ownership to PluginNamespace while
preserving the existing PluginLoader public registration behavior.

## Regression Coverage

tests/regression/plugin-registration.test.ts

Validated:

- plugin lifecycle registration
- duplicate plugin rejection
- identity engineId as registration key
- different plugin instances with same engineId remain rejected
- bounded namespace keyed by identity engineId

Focused regression result: 5/5 PASS.

## Preservation

Current 13 engine IDs preserved.

LiveDataRuntime.ts unchanged.

No historical NamespaceCollisionGuard.ts or EngineRegistry.ts introduced.

## Baseline

Pre-implementation accepted baseline:

957c5f6041b0ab21a2acf7192877e52849e64ff6

## Acceptance

D26-R3 certification validation: PASS.

Implementation is bounded to the explicitly authorized new namespace
contract and does not claim recovery of the lost historical APIs.

D27 acceptance evidence created.
