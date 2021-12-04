import { Coord } from './coord';
import { Genome } from './genome';
import { Individual } from './individual';
import { params } from './utils';

export class Peeps {
  individuals: Individual[];
  constructor() {
    this.individuals = [];
    for (let index = 0; index <= params.population; ++index) {
      this.individuals.push(
        new Individual(index, new Coord(0, 0), new Genome())
      );
    }
  }

  initializeGeneration0(grid: Grid) {
    this.individuals.forEach((indiv) => {
      indiv.loc = grid.findEmptyLocation();
      indiv.genome.makeRandom();
    });
  }
}
