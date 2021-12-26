import { Challenge } from './models';

export const params = {
  sizeX: 128,
  sizeY: 128,
  challenge: Challenge.RIGHT_HALF,
  genomeInitialLengthMin: 16,
  genomeInitialLengthMax: 16,
  genomeMaxLength: 20,
  maxNumberNeurons: -1,
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
};
params.maxNumberNeurons = params.genomeMaxLength / 2;

params.sizeX = 32;
params.sizeY = 32;
params.population = 10;
params.stepsPerGeneration = 10;
params.maxGenerations = 10;
