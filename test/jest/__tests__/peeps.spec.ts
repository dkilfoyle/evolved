import { Peeps } from '../../../src/lib/peeps';
import { describe, expect, it, beforeAll } from '@jest/globals';
import { params } from 'src/lib/params';
import { Genome } from 'src/lib/genome';
import { Grid } from 'src/lib/grid';

describe('Peeps', () => {
  let peeps: Peeps;
  let grid: Grid;
  beforeAll(() => {
    grid = new Grid();
    grid.init();
    peeps = new Peeps();
    peeps.initializeGeneration0(grid);
  });

  it('has an array of individuals of population size', () => {
    expect(peeps.individuals.length).toEqual(params.population + 1);
  });

  it('can make children', () => {
    const survivors = [
      { index: 0, score: 1, genes: new Genome().genes },
      { index: 1, score: 1, genes: new Genome().genes },
      { index: 2, score: 1, genes: new Genome().genes },
      { index: 3, score: 1, genes: new Genome().genes },
      { index: 4, score: 1, genes: new Genome().genes },
      { index: 5, score: 1, genes: new Genome().genes },
    ];
    const childGenome = peeps.generateChildGenome(survivors);
    childGenome.applyPointMutations();
    // console.log(childGenome);
    expect(childGenome).toBeDefined();
    expect(childGenome.genes.length).toBeGreaterThanOrEqual(
      params.genomeInitialLengthMin
    );
    expect(childGenome.genes.length).toBeLessThanOrEqual(
      params.genomeInitialLengthMax
    );
  });
});
