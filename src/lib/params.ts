import { Challenge } from './models';

/*
Simulation

sizeX
sizeY
population
maxGenerations
stepsPerGeneration
challenge

Display
perSteps
perGeneration

Genetics
genomeMaxLength
pointMutationRate
geneInsertionalDeletionRate
sexualReproduction
chooseParentsByFitness

Senses
populationSensorRadius
signalSensorRadius
longProbeDistance
shortProbeBarrierDistance




*/

export const params = {
  sizeX: 128,
  sizeY: 128,
  challenge: Challenge.RIGHT_HALF,

  genomeInitialLengthMin: 16,
  genomeInitialLengthMax: 16,
  genomeMaxLength: 30,
  maxNumberNeurons: 5,

  population: 100,
  stepsPerGeneration: 100,
  maxGenerations: 100,

  barrierType: 0,
  replaceBarrierType: 0,
  replaceBarrierTypeGenerationNumber: -1,
  numThreads: 1,
  signalLayers: 1,

  pointMutationRate: 0.0001,
  geneInsertionDeletionRate: 0.0001,
  deletionRatio: 0.7,
  killEnable: false,
  sexualReproduction: true,
  chooseParentsByFitness: true,

  populationSensorRadius: 2.0,
  signalSensorRadius: 1,
  responsiveness: 0.5,
  responsivenessCurveKFactor: 2,
  longProbeDistance: 16,
  shortProbeBarrierDistance: 3,
  valenceSaturationMag: 0.5,
  saveVideo: true,
  videoStride: 1,
  videoSaveFirstFrames: 0,
  displayScale: 1,
  agentSize: 2,
  genomeAnalysisStride: 1,
  displaySampleGenomes: 0,
  genomeComparisonMethod: 1,
  updateGraphLog: false,
  updateGraphLogStride: 16,
  initialNeuronOutput: 0.5,
  numLayers: 1,
  displayPerSteps: 10,
  displayPerGenerations: 10,
};

params.sizeX = 64;
params.sizeY = 64;
params.population = 50;
params.stepsPerGeneration = 100;
params.maxGenerations = 50;
