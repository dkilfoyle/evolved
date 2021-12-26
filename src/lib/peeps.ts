import { Coord } from './coord';
import { Gene } from './gene';
import { Genome } from './genome';
import { Grid } from './grid';
import { Individual } from './individual';
import { params } from './params';
import { getRandomInt } from './utils';

interface Survivor {
  index: number;
  score: number;
}

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
    this.init();
    this.individuals.forEach((indiv) => {
      indiv.loc = grid.findEmptyLocation();
      indiv.genome.makeRandom();
      grid.set(indiv.loc, indiv.index);
    });
  }

  initializeNewGeneration(grid: Grid, survivors: Survivor[]) {
    this.init();
    this.individuals.forEach((indiv) => {
      indiv.loc = grid.findEmptyLocation();
      indiv.genome = this.generateChildGenome(survivors);
      grid.set(indiv.loc, indiv.index);
    });
  }

  generateChildGenome(survivors: Survivor[]) {
    let gp1, gp2;
    if (params.chooseParentsByFitness && survivors.length > 1) {
      const p1idx = getRandomInt(1, survivors.length - 1);
      const p2idx = getRandomInt(0, p1idx - 1);
      gp1 = this.individuals[survivors[p1idx].index].genome;
      gp2 = this.individuals[survivors[p2idx].index].genome;
    } else {
      gp1 =
        this.individuals[getRandomInt(0, this.individuals.length - 1)].genome;
      gp2 =
        this.individuals[getRandomInt(0, this.individuals.length - 1)].genome;
    }

    const gc = new Genome();
    if (params.sexualReproduction) {
      // child genome is [....p1....][..p2..][...............p1..............]
      let crossStart = getRandomInt(0, gp1.genes.length - 1);
      let crossEnd = getRandomInt(0, gp1.genes.length - 1);
      if (crossEnd < crossStart)
        [crossStart, crossEnd] = [crossEnd, crossStart];

      gc.genes = new Array<Gene>().concat(
        [...gp1.genes.slice(0, crossStart)],
        [...gp2.genes.slice(crossStart, crossEnd)],
        [...gp1.genes.slice(crossEnd)]
      );
    } else gc.genes = [...gp2.genes];

    gc.randomInsertDeletion();
    gc.applyPointMutations();

    return gc;
  }

  calculateSurvival() {
    this.individuals.forEach((indiv) => {
      indiv.calculateSurvivalScore();
    });
  }

  spawnNewGeneration(grid: Grid) {
    // calculateSurvival should alreayd have been called
    const survivors: Survivor[] = [];
    this.individuals.forEach((indiv) => {
      if (indiv.survivalScore > 0)
        survivors.push({ index: indiv.index, score: indiv.survivalScore });
    });

    survivors.sort((a, b) => a.score - b.score);

    if (survivors.length == 0) this.initializeGeneration0(grid);
    else this.initializeNewGeneration(grid, survivors);
  }

  queueForMove(indiv: Individual, newloc: Coord) {
    this.moveQueue.push({ indiv, newloc });
  }

  drainMoveQueue(grid: Grid) {
    this.moveQueue.forEach((move) => {
      const { indiv, newloc } = move;
      const moveDir = newloc.sub(indiv.loc).asDir();
      // if (moveDir.dir9 == Compass.CENTER) debugger;
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
