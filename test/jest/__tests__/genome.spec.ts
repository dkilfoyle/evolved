import { Genome } from 'src/lib/genome';
import { describe, expect, it } from '@jest/globals';
import { params } from 'src/lib/params';

describe('Genome', () => {
  const genome = new Genome();
  it('has correct length', () => {
    expect(genome.genes.length).toBeLessThanOrEqual(
      params.genomeInitialLengthMax
    );
    expect(genome.genes.length).toBeGreaterThanOrEqual(
      params.genomeInitialLengthMin
    );
  });
});
