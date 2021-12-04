import { Nodes } from './models';
import { getRandomInt } from './utils';

// each gene represents 1 synaptic connection
export class Gene {
  sourceType: Nodes.SENSOR | Nodes.NEURON;
  sourceIndex: number;
  sinkType: Nodes.NEURON | Nodes.ACTION;
  sinkIndex: number;
  weight: number;

  constructor(
    sourceType = 0,
    sourceIndex = 0,
    sinkType = 0,
    sinkIndex = 0,
    weight = 0
  ) {
    this.sourceType = sourceType;
    this.sourceIndex = sourceIndex;
    this.sinkType = sinkType;
    this.sinkIndex = sinkIndex;
    this.weight = weight;
  }

  makeRandom() {
    this.sourceType = getRandomInt(0, 1);
    this.sourceIndex = getRandomInt(0, 0x7fff);
    this.sinkType = getRandomInt(0, 1);
    this.sinkIndex = getRandomInt(0, 0x7fff);
    this.weight = (Math.random() - 0.5) * 8; // -4 to 4
  }
}
