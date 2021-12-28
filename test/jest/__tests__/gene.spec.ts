import { Gene } from '../../../src/lib/gene';
import { describe, expect, it, beforeAll } from '@jest/globals';

describe('Gene', () => {
  describe('preMutation', () => {
    let gene: Gene;
    beforeAll(() => {
      gene = new Gene();
      gene.makeRandom();
    });
    it('has valid source index', () => {
      expect(gene.sourceIndex).toBeLessThanOrEqual(gene.getMaxSourceIndex());
      expect(gene.sourceIndex).toBeGreaterThanOrEqual(0);
    });
    it('has valid sink index', () => {
      expect(gene.sinkIndex).toBeLessThanOrEqual(gene.getMaxSinkIndex());
      expect(gene.sinkIndex).toBeGreaterThanOrEqual(0);
    });
    it('has valid weight', () => {
      expect(gene.weight).toBeLessThan(4);
      expect(gene.weight).toBeGreaterThan(-4);
    });
  });

  describe('postMutation', () => {
    let gene: Gene;
    beforeAll(() => {
      gene = new Gene();
      gene.makeRandom();
      gene.applyPointMutation();
    });
    it('has valid source index', () => {
      expect(gene.sourceIndex).toBeLessThanOrEqual(gene.getMaxSourceIndex());
      expect(gene.sourceIndex).toBeGreaterThanOrEqual(0);
    });
    it('has valid sink index', () => {
      expect(gene.sinkIndex).toBeLessThanOrEqual(gene.getMaxSinkIndex());
      expect(gene.sinkIndex).toBeGreaterThanOrEqual(0);
    });
    it('has valid weight', () => {
      expect(gene.weight).toBeLessThan(4);
      expect(gene.weight).toBeGreaterThan(-4);
    });
  });
});
