import { Coord } from './coord';
import { Gene } from './gene';
import { Genome } from './genome';
import { Grid } from './grid';
import { Individual } from './individual';
import { params } from './params';
import { getRandomInt } from './utils';

export class Peeps {
  individuals: Individual[] = [];
  moveQueue: { indiv: Individual; newloc: Coord }[] = [];
  deathQueue: Individual[] = [];

  init() {
    this.individuals = [];
    // individuals[0] is ignored because in the grid index 0 is an empty cell
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

  queueForMove(indiv: Individual, newloc: Coord) {
    this.moveQueue.push({ indiv, newloc });
  }

  drainMoveQueue(grid: Grid) {
    this.moveQueue.forEach((move) => {
      const { indiv, newloc } = move;
      const moveDir = newloc.sub(indiv.loc).asDir();
      if (grid.isEmptyAt(newloc)) {
        grid.set(indiv.loc, 0);
        grid.set(move.newloc, indiv.index);
        indiv.loc = move.newloc;
        indiv.lastMoveDir = moveDir;
      }
    });
    this.moveQueue = [];
  }

  queueForDeath(indiv: Individual) {
    this.deathQueue.push(indiv);
  }

  drainDeathQueue(grid: Grid) {
    this.deathQueue.forEach((indiv) => {
      grid.set(indiv.loc, 0);
      indiv.alive = false;
    });
    this.deathQueue = [];
  }
}
