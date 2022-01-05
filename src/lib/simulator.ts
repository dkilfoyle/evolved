import { Grid } from './grid';
import { Peeps } from './peeps';
import { params } from './params';
import { Signals } from './signals';
import { executeActions } from './actionUtils';
import { Challenge } from './models';

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
    this.grid.init(this.generation);
    this.signals.init();
    // this.peeps.init(); // make individuals of size population
    this.peeps.initializeGeneration0(this.grid); // make random genome for each individual
    this.simStep = 0;
    this.generation = 0;
    // console.log('Simulator.init', this.getSimState());
    self.postMessage({
      msg: 'endInit',
      payload: { grid: this.grid, peeps: this.peeps },
    });
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

  getSimInfo() {
    return {
      peeps: this.peeps,
      signals: this.signals,
      simStep: this.simStep,
      generation: this.generation,
    };
  }

  simulateOneStep() {
    this.simStep++;
    if (this.simStep > params.stepsPerGeneration) {
      throw new Error('exceeded simulation steps');
    }

    const simState = this.getSimState();
    this.peeps.individuals.forEach((indiv) => {
      if (indiv.alive) {
        indiv.age++;
        const actionLevels = indiv.nnet.feedForward(simState);
        executeActions(indiv, actionLevels, simState);
      }
    });

    if (params.challenge == Challenge.RADIOACTIVE_WALLS) {
      // During the first half of the generation, the west wall is radioactive,
      // where X == 0. In the last half of the generation, the east wall is
      // radioactive, where X = the area width - 1. There's an exponential
      // falloff of the danger, falling off to zero at the arena half line.
      const radioactiveX =
        this.simStep < params.stepsPerGeneration / 2 ? 0 : params.sizeX - 1;

      this.peeps.individuals.forEach((indiv) => {
        const distanceFromRadioactiveWall = Math.abs(
          indiv.loc.x - radioactiveX
        );
        if (distanceFromRadioactiveWall < params.sizeX / 2) {
          const chanceOfDeath = 1.0 / (distanceFromRadioactiveWall * 2);
          if (Math.random() < chanceOfDeath) {
            this.peeps.queueForDeath(indiv);
          }
        }
      });
    }

    // If the individual is touching any wall, we set its challengeFlag to true.
    // At the end of the generation, all those with the flag true will reproduce.
    if (params.challenge == Challenge.TOUCH_ANY_WALL) {
      this.peeps.individuals.forEach((indiv) => {
        if (
          indiv.loc.x == 0 ||
          indiv.loc.x == params.sizeX - 1 ||
          indiv.loc.y == 0 ||
          indiv.loc.y == params.sizeY - 1
        ) {
          indiv.challengeBits = 1;
        }
      });
    }

    // If this challenge is enabled, the individual gets a bit set in their challengeBits
    // member if they are within a specified radius of a barrier center. They have to
    // visit the barriers in sequential order.
    if (params.challenge == Challenge.LOCATION_SEQUENCE) {
      const radius = 9.0;
      this.peeps.individuals.forEach((indiv) => {
        this.grid.barrierCenters.forEach((b, n) => {
          const bit = 1 << n;
          if ((indiv.challengeBits & bit) == 0) {
            if (indiv.loc.sub(b).length() <= radius) indiv.challengeBits |= bit;
          }
        });
      });
    }

    this.peeps.drainDeathQueue(this.grid);
    this.peeps.drainMoveQueue(this.grid);
    this.signals.fade(0);

    if (this.simStep == params.stepsPerGeneration) {
      this.peeps.calculateSurvival(simState);
      this.peeps.calculateGeneticDiversity();
    }
  }

  stepSimulation(postStepInfo = true, postGenerationInfo = true) {
    if (this.simStep == params.stepsPerGeneration) {
      this.startNewGeneration(postStepInfo);
      return;
    }

    this.simulateOneStep();

    if (this.simStep == params.stepsPerGeneration && postGenerationInfo) {
      self.postMessage({ msg: 'endGeneration', payload: this.getSimInfo() });
    } else if (postStepInfo)
      self.postMessage({
        msg: 'endStep',
        payload: this.getSimInfo(),
      });
  }

  // run to end of current generation
  runSimulation(postStepInfo = true, postGenerationInfo = true) {
    while (this.simStep < params.stepsPerGeneration)
      this.stepSimulation(
        postStepInfo && this.simStep % params.displayPerSteps == 0,
        postGenerationInfo
      );
  }

  stepGeneration(postStepInfo = false, postGenerationInfo = true) {
    if (this.simStep == params.stepsPerGeneration) {
      this.startNewGeneration(postGenerationInfo);
    }

    // run up to the last step of current generation and show
    this.runSimulation(postStepInfo, true);
  }

  runGeneration() {
    while (this.generation < params.maxGenerations) {
      this.stepGeneration(false, true);
    }
  }

  startNewGeneration(postStepInfo = true) {
    this.simStep = 0;
    this.generation++;
    this.grid.init(this.generation); // empty the grid
    if (this.generation == params.replaceBarrierTypeGenerationNumber)
      self.postMessage({ msg: 'newBarrier', payload: this.getSimState() });
    this.signals.init();
    this.peeps.spawnNewGeneration(this.grid, this.generation);
    if (postStepInfo)
      self.postMessage({ msg: 'endStep', payload: this.getSimInfo() });
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
  // console.log('recevied ', e);
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
      simulator.stepGeneration();
      break;
    case 'runGeneration':
      simulator.runGeneration();
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
