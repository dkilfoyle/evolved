import { Peeps } from '../../../src/lib/peeps';
import { describe, expect, it, beforeAll } from '@jest/globals';
import { params } from 'src/lib/params';
import { Genome } from 'src/lib/genome';
import { Grid } from 'src/lib/grid';
import { Individual } from 'src/lib/individual';
import { Coord } from 'src/lib/coord';

describe('Peeps', () => {
  let peeps: Peeps;
  let grid: Grid;
  beforeAll(() => {
    grid = new Grid();
    grid.init(0);
    peeps = new Peeps();
    peeps.initializeGeneration0(grid);
  });

  it('has an array of individuals of population size', () => {
    expect(peeps.individuals.length).toEqual(params.population + 1);
  });

  it('can make children', () => {
    let index = 0;
    const survivors = [
      new Individual(index++, new Coord(0, 0), new Genome()),
      new Individual(index++, new Coord(0, 0), new Genome()),
      new Individual(index++, new Coord(0, 0), new Genome()),
      new Individual(index++, new Coord(0, 0), new Genome()),
      new Individual(index++, new Coord(0, 0), new Genome()),
      new Individual(index++, new Coord(0, 0), new Genome()),
      new Individual(index++, new Coord(0, 0), new Genome()),
    ];
    const childGenome = peeps.generateChildGenome(survivors, 0);
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
