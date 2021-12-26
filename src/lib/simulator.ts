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
    this.signals = new Signals();
  }

  init() {
    this.grid.init();
    this.signals.init();
    this.peeps.init(); // make individuals of size population
    this.peeps.initializeGeneration0(this.grid); // make random genome for each individual
    this.simStep = 0;
    this.generation = 0;
    console.log('Simulator.init', this.getSimState());
    self.postMessage({ msg: 'simState', payload: this.getSimState() });
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
    console.log(
      'Simulator.stepSimulation',
      this.simStep,
      params.stepsPerGeneration
    );
    if (this.simStep == params.stepsPerGeneration) {
      this.endOfGeneration();
      this.stepSimulation();
      return;
    }
    const simState = this.getSimState();
    this.peeps.individuals.forEach((indiv) => {
      if (indiv.alive) {
        indiv.age++;
        const actionLevels = indiv.nnet.feedForward(simState);
        executeActions(indiv, actionLevels, simState);
      }
    });
    this.peeps.drainDeathQueue(this.grid);
    this.peeps.drainMoveQueue(this.grid);
    this.signals.fade(0);

    if (this.simStep == params.stepsPerGeneration - 1) {
      // this is the last step of this generation
      this.peeps.calculateSurvival();
    }

    self.postMessage({ msg: 'simState', payload: this.getSimState() });
    this.simStep++;
  }

  runSimulation() {
    while (this.simStep < params.stepsPerGeneration) this.stepSimulation();
  }

  simulate() {
    this.init();

    while (this.generation < params.maxGenerations) {
      console.log('generation ', this.generation);
      for (let simStep = 0; simStep < params.stepsPerGeneration; simStep++) {
        this.stepSimulation();
      }
      this.endOfGeneration();
    }
  }

  endOfGeneration() {
    this.peeps.spawnNewGeneration(this.grid);
    this.simStep = 0;
    this.generation++;
  }
}

const simulator = new Simulator();

interface Params {
  sizeX: number;
  sizeY: number;
  population: number;
  stepsPerGeneration: number;
  maxGenerations: number;
}

self.onmessage = (msg) => {
  const e = msg.data as { msg: string; payload: unknown };
  console.log('recevied ', e);
  switch (e.msg) {
    case 'init':
      simulator.init();
      break;
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
    case 'setParam':
      const { param, value } = e.payload as { param: string; value: number };
      params[param as keyof Params] = value;
      break;
    // case 'getParam':
    //   const getParamData = e.payload as { param: string };
    //   self.postMessage({
    //     msg: 'getParam',
    //     payload: params[getParamData.param as keyof Params],
    //   });
    //   break;
    default:
      throw new Error();
  }
};
