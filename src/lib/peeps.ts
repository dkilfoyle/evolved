import { Coord } from './coord';
import { Gene } from './gene';
import { Genome, genomeSimilarity } from './genome';
import { Grid } from './grid';
import { Individual } from './individual';
import { SimState } from './models';
import { params } from './params';
import { getRandomInt } from './utils';

// interface Survivor {
//   indiv: Individual;
//   score: number;
// }

interface Mutation {
  mutation: string;
  num: number;
  generation: number;
}

export class Peeps {
  individuals: Individual[] = [];
  moveQueue: { indiv: Individual; newloc: Coord }[] = [];
  deathQueue: Individual[] = [];
  survivorCounts: number[] = [];
  survivorScores: number[] = [];
  diversityScores: number[] = [];
  mutations: Mutation[] = [];

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
    this.survivorCounts = [];
    this.survivorScores = [];
    this.diversityScores = [];
    this.mutations = [];

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

  initializeNewGeneration(
    grid: Grid,
    survivors: Individual[],
    generation: number
  ) {
    this.individuals = [];

    for (let index = 0; index <= params.population; ++index) {
      const indiv = new Individual(
        index,
        grid.findEmptyLocation(),
        this.generateChildGenome(survivors, generation)
      );
      grid.set(indiv.loc, indiv.index);
      this.individuals.push(indiv);
    }
  }

  generateChildGenome(survivors: Individual[], generation: number) {
    // select parents
    let p1idx, p2idx;
    if (params.chooseParentsByFitness && survivors.length > 1) {
      p1idx = getRandomInt(1, survivors.length - 1);
      p2idx = getRandomInt(0, p1idx - 1);
    } else {
      p1idx = getRandomInt(0, survivors.length - 1);
      p2idx = getRandomInt(0, survivors.length - 1);
    }
    const gp1 = survivors[p1idx].genome;
    const gp2 = survivors[p2idx].genome;

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

    const [insertions, deletions] = gc.randomInsertDeletion();
    const point = gc.applyPointMutations();

    if (insertions)
      this.mutations.push({
        mutation: 'insertion',
        num: insertions,
        generation,
      });
    if (deletions)
      this.mutations.push({ mutation: 'deletion', num: deletions, generation });
    if (point)
      this.mutations.push({ mutation: 'point', num: point, generation });

    return gc;
  }

  calculateSurvival(sim: SimState) {
    let survivorCount = 0;
    let survivorsScore = 0;
    this.individuals.forEach((indiv) => {
      indiv.calculateSurvivalScore(sim);
      if (indiv.survivalScore > 0) survivorCount++;
      survivorsScore += indiv.survivalScore;
    });
    this.survivorCounts.push(survivorCount);
    this.survivorScores.push(survivorsScore);
  }

  spawnNewGeneration(grid: Grid, generation: number) {
    // calculateSurvival should alreayd have been called
    const survivors: Individual[] = [];
    this.individuals.forEach((indiv) => {
      // indiv.calculateSurvivalScore(); // should already be called in simulateOneStep
      if (indiv.survivalScore > 0) survivors.push(indiv);
    });

    survivors.sort((a, b) => a.survivalScore - b.survivalScore);

    if (survivors.length == 0) this.initializeGeneration0(grid);
    else this.initializeNewGeneration(grid, survivors, generation);
  }

  queueForMove(indiv: Individual, newloc: Coord) {
    this.moveQueue.push({ indiv, newloc });
  }

  drainMoveQueue(grid: Grid) {
    this.moveQueue.forEach((move) => {
      const indiv = move.indiv;
      const newloc = move.newloc;
      if (grid.isEmptyAt(newloc)) {
        grid.set(indiv.loc, 0);
        grid.set(move.newloc, indiv.index);
        indiv.moveTo(move.newloc);
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

  // returns 0.0..1.0
  // Samples random pairs of individuals regardless if they are alive or not
  calculateGeneticDiversity() {
    if (params.population < 2) {
      return 0.0;
    }
    // count limits the number of genomes sampled for performance reasons.
    let count = Math.min(1000, params.population); // todo: !!! p.analysisSampleSize;
    let numSamples = 0;
    let similaritySum = 0.0;

    while (count > 0) {
      const index0 = getRandomInt(1, params.population - 1); // skip first and last elements
      const index1 = index0 + 1;
      similaritySum += genomeSimilarity(
        this.individuals[index0].genome,
        this.individuals[index1].genome
      );
      --count;
      ++numSamples;
    }
    const diversity = 1.0 - similaritySum / numSamples;
    this.diversityScores.push(diversity);
  }
}
