import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MarketDataSource, DataBoundExecutor } from '../../src/distributed/LiveDataRuntime';
import type { DataSnapshot } from '../../src/distributed/LiveDataRuntime';
import type { ExecutionRequest, ExecutionResult } from '../../src/plugin-loader/PluginContract';

/**
 * P15 — Market-Data Lineage Propagation Tests
 * 
 * Validates that market-data snapshot identity (snapshotId) propagates through
 * the governed execution path without breaking existing contracts.
 * 
 * Acceptance Criteria: AC-01 through AC-23
 */

describe('P15: Market-Data Lineage Propagation', () => {
  
  // AC-01, AC-02: Immutable market-data snapshot identity
  describe('AC-01/02: Immutable snapshot identity', () => {
    it('should create deterministic snapshot ID from provider + dataVersion + asOf', () => {
      const source = new MarketDataSource('test-provider');
      const snapshot1 = source.snapshot('v1.0', '2024-01-01', 'good', 100, { 'MD:peRatio': 15.5 });
      const snapshot2 = source.snapshot('v1.0', '2024-01-01', 'good', 100, { 'MD:peRatio': 15.5 });
      
      assert.equal(snapshot1.snapshotId, snapshot2.snapshotId, 'Same inputs produce same snapshotId');
      assert.equal(snapshot1.snapshotId, 'data-test-provider-v1.0-2024-01-01');
      assert.ok(Object.isFrozen(snapshot1), 'Snapshot is frozen (immutable)');
    });
    
    it('should produce different snapshot IDs for different data versions', () => {
      const source = new MarketDataSource('test-provider');
      const snapshot1 = source.snapshot('v1.0', '2024-01-01', 'good', 100, { 'MD:peRatio': 15.5 });
      const snapshot2 = source.snapshot('v1.1', '2024-01-01', 'good', 100, { 'MD:peRatio': 15.5 });
      
      assert.notEqual(snapshot1.snapshotId, snapshot2.snapshotId, 'Different versions produce different IDs');
    });
  });
  
  // AC-03, AC-04, AC-05: Lineage enters governed execution path
  describe('AC-03/04/05: Lineage enters EngineApiAdapter', () => {
    it('should extract marketDataLineage from DataSnapshot and pass to execution', () => {
      const source = new MarketDataSource('test-provider');
      const snapshot = source.snapshot('v1.0', '2024-01-01', 'good', 100, { 'MD:peRatio': 15.5 });
      
      let capturedRequest: ExecutionRequest | null = null;
      const mockExec = (engineId: string, request: ExecutionRequest): ExecutionResult => {
        capturedRequest = request;
        return {
          state: 'COMPLETED',
          snapshotRef: 'snap-123',
          evidenceRef: 'ev-123',
          metadata: { metrics: { composite: 75 }, scores: { quality: 80 }, verdict: 'BUY' }
        };
      };
      
      const executor = new DataBoundExecutor(mockExec);
      const result = executor.execute({
        engineId: 'sector.banking',
        requestId: 'req-001',
        data: snapshot,
        companyInputs: { revenue: 1000000 },
        contributingIds: ['contrib-1']
      });
      
      assert.ok(capturedRequest, 'Execution request was captured');
      assert.equal(capturedRequest!.marketDataLineage, snapshot.snapshotId, 'Lineage extracted from snapshot');
      assert.equal(result.snapshotIdentity, snapshot.snapshotId, 'Snapshot identity returned');
    });
    
    it('should use explicit marketDataLineage if provided', () => {
      const source = new MarketDataSource('test-provider');
      const snapshot = source.snapshot('v1.0', '2024-01-01', 'good', 100, { 'MD:peRatio': 15.5 });
      
      let capturedRequest: ExecutionRequest | null = null;
      const mockExec = (engineId: string, request: ExecutionRequest): ExecutionResult => {
        capturedRequest = request;
        return {
          state: 'COMPLETED',
          metadata: { metrics: {}, scores: {} }
        };
      };
      
      const executor = new DataBoundExecutor(mockExec);
      executor.execute({
        engineId: 'sector.banking',
        requestId: 'req-001',
        data: snapshot,
        companyInputs: { revenue: 1000000 },
        marketDataLineage: 'custom-lineage-id'
      });
      
      assert.equal(capturedRequest!.marketDataLineage, 'custom-lineage-id', 'Explicit lineage used');
    });
  });
  
  // AC-19: Backward compatibility
  describe('AC-19: Backward compatibility', () => {
    it('should work without marketDataLineage (defaults to snapshotId)', () => {
      const source = new MarketDataSource('test-provider');
      const snapshot = source.snapshot('v1.0', '2024-01-01', 'good', 100, { 'MD:peRatio': 15.5 });
      
      let capturedRequest: ExecutionRequest | null = null;
      const mockExec = (engineId: string, request: ExecutionRequest): ExecutionResult => {
        capturedRequest = request;
        return {
          state: 'COMPLETED',
          metadata: { metrics: {}, scores: {} }
        };
      };
      
      const executor = new DataBoundExecutor(mockExec);
      executor.execute({
        engineId: 'sector.banking',
        requestId: 'req-001',
        data: snapshot,
        companyInputs: { revenue: 1000000 }
        // No marketDataLineage provided
      });
      
      assert.equal(capturedRequest!.marketDataLineage, snapshot.snapshotId, 'Defaults to snapshotId');
    });
    
    it('should work with ExecutionRequest without marketDataLineage', () => {
      // This tests that existing code that doesn't use marketDataLineage still works
      const request: ExecutionRequest = {
        requestId: 'req-001',
        inputs: { 'MD:peRatio': 15.5 }
        // No marketDataLineage
      };
      
      assert.equal(request.requestId, 'req-001');
      assert.ok(!request.marketDataLineage, 'marketDataLineage is optional');
    });
  });
  
  // AC-17, AC-18: No methodology/engine behavior change
  describe('AC-17/18: No methodology change', () => {
    it('should not modify company inputs or market-data fields', () => {
      const source = new MarketDataSource('test-provider');
      const snapshot = source.snapshot('v1.0', '2024-01-01', 'good', 100, { 'MD:peRatio': 15.5 });
      
      const companyInputs = { revenue: 1000000, debt: 500000 };
      const originalCompanyInputs = { ...companyInputs };
      
      let capturedInputs: any = null;
      const mockExec = (engineId: string, request: ExecutionRequest): ExecutionResult => {
        capturedInputs = request.inputs;
        return {
          state: 'COMPLETED',
          metadata: { metrics: {}, scores: {} }
        };
      };
      
      const executor = new DataBoundExecutor(mockExec);
      executor.execute({
        engineId: 'sector.banking',
        requestId: 'req-001',
        data: snapshot,
        companyInputs,
        contributingIds: []
      });
      
      assert.deepEqual(companyInputs, originalCompanyInputs, 'Company inputs not modified');
      assert.equal(capturedInputs.peRatio, 15.5, 'Market-data fields preserved (MD: prefix stripped for engine)');
      assert.equal(capturedInputs.revenue, 1000000, 'Company inputs merged');
    });
  });
  
  // AC-22, AC-23: No execution bypass
  describe('AC-22/23: No execution bypass', () => {
    it('should always call the governed execution function', () => {
      const source = new MarketDataSource('test-provider');
      const snapshot = source.snapshot('v1.0', '2024-01-01', 'good', 100, { 'MD:peRatio': 15.5 });
      
      let execCallCount = 0;
      const mockExec = (engineId: string, request: ExecutionRequest): ExecutionResult => {
        execCallCount++;
        return {
          state: 'COMPLETED',
          metadata: { metrics: {}, scores: {} }
        };
      };
      
      const executor = new DataBoundExecutor(mockExec);
      executor.execute({
        engineId: 'sector.banking',
        requestId: 'req-001',
        data: snapshot,
        companyInputs: { revenue: 1000000 }
      });
      
      assert.equal(execCallCount, 1, 'Governed execution called exactly once');
    });
  });
});
