import { Peeps } from '../../../src/lib/peeps';
import { describe, expect, it, beforeAll } from '@jest/globals';
import { params } from 'src/lib/utils';

describe('Peeps', () => {
  let peeps: Peeps;
  beforeAll(() => {
    peeps = new Peeps();
  });
  it('has an array of individuals of population size', () => {
    expect(peeps.individuals.length).toEqual(params.population + 1);
  });

  it('can make children', () => {
    const childGenome = peeps.generateChildGenome();
    childGenome.applyPointMutations();
    // console.log(childGenome);
    expect(childGenome).toBeDefined();
    expect(childGenome.genes.length).toEqual(params.genomeLength);
  });
});
