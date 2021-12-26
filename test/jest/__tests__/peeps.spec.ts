import { Peeps } from '../../../src/lib/peeps';
import { describe, expect, it, beforeAll } from '@jest/globals';
import { params } from 'src/lib/params';

describe('Peeps', () => {
  let peeps: Peeps;
  beforeAll(() => {
    peeps = new Peeps();
  });
  it('has an array of individuals of population size', () => {
    expect(peeps.individuals.length).toEqual(params.population + 1);
  });

  it('can make children', () => {
    const survivors = [
      { index: 0, score: 1 },
      { index: 1, score: 1 },
      { index: 2, score: 1 },
      { index: 3, score: 1 },
      { index: 4, score: 1 },
      { index: 5, score: 1 },
    ];
    const childGenome = peeps.generateChildGenome(survivors);
    childGenome.applyPointMutations();
    // console.log(childGenome);
    expect(childGenome).toBeDefined();
    expect(childGenome.genes.length).toEqual(params.genomeMaxLength);
  });
});
