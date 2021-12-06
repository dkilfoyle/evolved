import { Grid } from './grid';
import { Peeps } from './peeps';
import { params } from './params';
import { Individual } from './individual';

export class Simulator {
  grid: Grid;
  peeps: Peeps;

  constructor() {
    this.grid = new Grid();
    this.peeps = new Peeps();
  }

  simulate() {
    this.grid.init();
    this.peeps.init(); // make individuals of size population
    this.peeps.initializeGeneration0(this.grid); // make random genome for each individual

    let generation = 0;
    while (generation < params.maxGenerations) {
      for (let simStep = 0; simStep < params.stepsPerGeneration; simStep++) {
        this.peeps.individuals.forEach((indiv) => {
          if (indiv.alive) {
            indiv.age++;
            const actionLevels = indiv.nnet.feedForward();
            this.executeActions(indiv, actionLevels);
          }
        });
        this.endOfSimStep(simStep, generation);
      }
      this.endOfGeneration(generation);
      this.peeps.spawnNewGeneration(this.grid);
      generation++;
    }
  }

  executeActions(indiv: Individual, actionLevels: number[]) {
    throw new Error();
  }

  endOfSimStep(simStep: number, generation: number) {
    throw new Error();
  }

  endOfGeneration(generation: number) {
    throw new Error();
  }
}
