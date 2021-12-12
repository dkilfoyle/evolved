import { Nodes } from './models';

export class Synapse {
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
}
