import { Coord } from './coord';
import { Gene } from './gene';
import { Genome } from './genome';
import { Grid } from './grid';
import { Individual } from './individual';
import { Compass } from './models';
import { params } from './params';
import { getRandomInt } from './utils';

interface Survivor {
  index: number;
  score: number;
  genes: Gene[];
}

export class Peeps {
  individuals: Individual[] = [];
  moveQueue: { indiv: Individual; newloc: Coord }[] = [];
  deathQueue: Individual[] = [];
  survivorCount = 0;
  survivorsScore = 0;

  // init() {
  //   this.individuals = [];
  //   // individuals[0] is ignored because in the grid index 0 is an empty cell
  //   for (let index = 0; index <= params.population; ++index) {
  //     this.individuals.push(
  //       new Individual(index, new Coord(0, 0), new Genome())
  //     );
  //   }
  // }

  initializeGeneration0(grid: Grid) {
    this.individuals = [];

    for (let index = 0; index <= params.population; ++index) {
      const indiv = new Individual(
        index,
        grid.findEmptyLocation(),
        new Genome()
      );
      grid.set(indiv.loc, indiv.index);
      this.individuals.push(indiv);
    }
  }

  initializeNewGeneration(grid: Grid, survivors: Survivor[]) {
    this.individuals = [];
    for (let index = 0; index <= params.population; ++index) {
      const indiv = new Individual(
        index,
        grid.findEmptyLocation(),
        this.generateChildGenome(survivors)
      );
      grid.set(indiv.loc, indiv.index);
      this.individuals.push(indiv);
    }
  }

  generateChildGenome(survivors: Survivor[]) {
    let gp1, gp2;
    if (params.chooseParentsByFitness && survivors.length > 1) {
      const p1idx = getRandomInt(1, survivors.length - 1);
      const p2idx = getRandomInt(0, p1idx - 1);
      gp1 = survivors[p1idx].genes;
      gp2 = survivors[p2idx].genes;
    } else {
      gp1 = survivors[getRandomInt(0, survivors.length - 1)].genes;
      gp2 = survivors[getRandomInt(0, survivors.length - 1)].genes;
    }

    const gc = new Genome();
    if (params.sexualReproduction) {
      // child genome is [....p1....][..p2..][...............p1..............]
      let crossStart = getRandomInt(0, gp1.length - 1);
      let crossEnd = getRandomInt(0, gp1.length - 1);
      if (crossEnd < crossStart)
        [crossStart, crossEnd] = [crossEnd, crossStart];

      gc.genes = new Array<Gene>().concat(
        [...gp1.slice(0, crossStart)],
        [...gp2.slice(crossStart, crossEnd)],
        [...gp1.slice(crossEnd)]
      );
    } else gc.genes = [...gp2];

    gc.randomInsertDeletion();
    gc.applyPointMutations();

    return gc;
  }

  calculateSurvival() {
    this.survivorCount = 0;
    this.survivorsScore = 0;
    this.individuals.forEach((indiv) => {
      indiv.calculateSurvivalScore();
      if (indiv.survivalScore > 0) this.survivorCount++;
      this.survivorsScore += indiv.survivalScore;
    });
  }

  spawnNewGeneration(grid: Grid) {
    // calculateSurvival should alreayd have been called
    const survivors: Survivor[] = [];
    this.individuals.forEach((indiv) => {
      indiv.calculateSurvivalScore();
      if (indiv.survivalScore > 0)
        survivors.push({
          index: indiv.index,
          score: indiv.survivalScore,
          genes: [...indiv.genome.genes],
        });
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
      // const { indiv, newloc } = move;
      const indiv = move.indiv;
      const newloc = move.newloc;
      const moveDir = newloc.sub(indiv.loc).asDir();
      // console.log(
      //   indiv.index,
      //   indiv.birthLoc,
      //   indiv.loc,
      //   newloc,
      //   indiv.lastMoveDir
      // );
      if (moveDir.dir9 == Compass.CENTER) {
        debugger;
        const zz = newloc.sub(indiv.loc).asDir();
        console.log(zz);
      }
      if (grid.isEmptyAt(newloc)) {
        grid.set(indiv.loc, 0);
        grid.set(move.newloc, indiv.index);
        indiv.loc.set(move.newloc);
        indiv.lastMoveDir.set(moveDir);
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
