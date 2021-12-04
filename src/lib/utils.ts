export const params = {
  maxNumberNeurons: 10,
  genomeLength: 16,
  initialNeuronOutput: 0.5,
  stepsPerGeneration: 100,
  maxGenerations: 100,
  pointMutationRate: 0.0001,
  deletionRatio: 0.7,
  sizeX: 128,
  sizeY: 128,
  population: 100,
};

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
