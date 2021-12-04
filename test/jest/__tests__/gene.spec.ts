import { Gene } from '../../../src/lib/gene';
import { describe, expect, it } from '@jest/globals';

describe('Gene', () => {
  const gene = new Gene();
  it('has valid source index', () => {
    expect(gene.sourceIndex).toBeLessThan(32767);
    expect(gene.sourceIndex).toBeGreaterThanOrEqual(0);
  });
  it('has valid sink index', () => {
    expect(gene.sinkIndex).toBeLessThan(32767);
    expect(gene.sinkIndex).toBeGreaterThanOrEqual(0);
  });
  it('has valid weight', () => {
    expect(gene.weight).toBeLessThan(4);
    expect(gene.weight).toBeGreaterThan(-4);
  });
});
