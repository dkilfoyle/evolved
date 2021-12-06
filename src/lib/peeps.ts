import { Coord } from './coord';
import { Gene } from './gene';
import { Genome } from './genome';
import { Grid } from './grid';
import { Individual } from './individual';
import { params } from './params';
import { getRandomInt } from './utils';

export class Peeps {
  individuals: Individual[] = [];

  init() {
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

  generateChildGenome() {
    const gp1 =
      this.individuals[getRandomInt(0, this.individuals.length - 1)].genome;
    const gp2 =
      this.individuals[getRandomInt(0, this.individuals.length - 1)].genome;

    const gc = new Genome();
    let crossStart = getRandomInt(0, gp1.genes.length - 1);
    let crossEnd = getRandomInt(0, gp1.genes.length - 1);
    if (crossEnd < crossStart) [crossStart, crossEnd] = [crossEnd, crossStart];

    gc.genes = new Array<Gene>().concat(
      [...gp1.genes.slice(0, crossStart)],
      [...gp2.genes.slice(crossStart, crossEnd)],
      [...gp1.genes.slice(crossEnd)]
    );

    return gc;
  }

  spawnNewGeneration(grid: Grid) {
    throw new Error();
  }
}
