import { Grid } from './grid';
import { Peeps } from './peeps';
import { params } from './params';
import { Signals } from './signals';
import { executeActions } from './actionUtils';

export class Simulator {
  grid: Grid;
  peeps: Peeps;
  signals: Signals;
  simStep = 0;
  generation = 0;

  constructor() {
    this.grid = new Grid();
    this.peeps = new Peeps();
    this.signals = new Signals(1, params.sizeX, params.sizeY);
  }

  init() {
    this.grid.init();
    this.peeps.init(); // make individuals of size population
    this.peeps.initializeGeneration0(this.grid); // make random genome for each individual
    this.simStep = 0;
    this.generation = 0;
    console.log('Simulator.init', this.getSimState());
    self.postMessage(this.getSimState());
  }

  getSimState() {
    return {
      grid: this.grid,
      peeps: this.peeps,
      signals: this.signals,
      simStep: this.simStep,
      generation: this.generation,
    };
  }

  stepSimulation() {
    console.log('Simulator.stepSimulation', this.simStep);
    const simState = this.getSimState();
    this.peeps.individuals.forEach((indiv) => {
      if (indiv.alive) {
        indiv.age++;
        const actionLevels = indiv.nnet.feedForward(simState);
        executeActions(indiv, actionLevels, simState);
      }
    });
    this.peeps.drainMoveQueue(this.grid);
    this.signals.fade(0);
    self.postMessage(this.getSimState());
    this.simStep++;
  }

  runSimulation() {
    while (this.simStep < params.stepsPerGeneration) this.stepSimulation();
  }

  simulate() {
    this.init();

    let generation = 0;
    // while (generation < params.maxGenerations) {
    while (generation < 1) {
      console.log('generation ', generation);
      for (let simStep = 0; simStep < params.stepsPerGeneration; simStep++) {
        console.log(' -- simstep: ', simStep);
        const simState = this.getSimState();
        this.peeps.individuals.forEach((indiv) => {
          if (indiv.alive) {
            indiv.age++;
            const actionLevels = indiv.nnet.feedForward(simState);
            executeActions(indiv, actionLevels, simState);
          }
        });
        this.endOfSimStep(simStep, generation);
        if (generation == 0) self.postMessage({ simState });
      }
      this.endOfGeneration(generation);
      this.peeps.spawnNewGeneration(this.grid);
      generation++;
    }
  }

  endOfSimStep(simStep: number, generation: number) {
    // TODO: ?challenges
    // TODO: produce image
  }

  endOfGeneration(generation: number) {
    // throw new Error();
  }
}

const simulator = new Simulator();

self.onmessage = (msg) => {
  switch (msg.data) {
    case 'init':
      simulator.init();
    case 'stepSim':
      simulator.stepSimulation();
      break;
    case 'runSim':
      simulator.runSimulation();
      break;
    case 'stepGeneration':
      break;
    case 'runGeneration':
      break;
    default:
      throw new Error();
  }
  if (msg.data == 'simulate') {
    simulator.simulate();
  }
};
