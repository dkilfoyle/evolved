import { Grid } from './grid';
import { Peeps } from './peeps';
import { params } from './params';
import { Signals } from './signals';
import { executeActions } from './actionUtils';

export class Simulator {
  grid: Grid;
  peeps: Peeps;
  signals: Signals;

  constructor() {
    this.grid = new Grid();
    this.peeps = new Peeps();
    this.signals = new Signals(0, params.sizeX, params.sizeY);
  }

  simulate() {
    this.grid.init();
    this.peeps.init(); // make individuals of size population
    this.peeps.initializeGeneration0(this.grid); // make random genome for each individual

    let generation = 0;
    while (generation < params.maxGenerations) {
      for (let simStep = 0; simStep < params.stepsPerGeneration; simStep++) {
        const simState = {
          grid: this.grid,
          peeps: this.peeps,
          signals: this.signals,
          simStep,
        };
        this.peeps.individuals.forEach((indiv) => {
          if (indiv.alive) {
            indiv.age++;
            const actionLevels = indiv.nnet.feedForward(simState);
            executeActions(indiv, actionLevels, simState);
          }
        });
        this.endOfSimStep(simStep, generation);
      }
      this.endOfGeneration(generation);
      this.peeps.spawnNewGeneration(this.grid);
      generation++;
    }
  }

  endOfSimStep(simStep: number, generation: number) {
    // TODO: ?challenges

    this.peeps.drainMoveQueue(this.grid);
    this.signals.fade(0);

    // TODO: produce image
  }

  endOfGeneration(generation: number) {
    // throw new Error();
  }
}
