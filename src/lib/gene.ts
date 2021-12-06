import { Actions, Nodes, Sensors } from './models';
import { params } from './params';
import { getRandomInt } from './utils';

// each gene represents 1 synaptic connection
export class Gene {
  sourceType: Nodes.SENSOR | Nodes.NEURON;
  sourceIndex: number;
  sinkType: Nodes.NEURON | Nodes.ACTION;
  sinkIndex: number;
  weightInt: number;
  weight: number;

  constructor(
    sourceType = 0,
    sourceIndex = 0,
    sinkType = 0,
    sinkIndex = 0,
    weightInt = 0
  ) {
    this.sourceType = sourceType;
    this.sourceIndex = sourceIndex;
    this.sinkType = sinkType;
    this.sinkIndex = sinkIndex;
    this.weightInt = weightInt;
    this.weight = this.weightInt / 8192.0;
  }

  getMaxSourceIndex() {
    return this.sourceType == Nodes.NEURON
      ? params.maxNumberNeurons - 1
      : Sensors.NUM_SENSES - 1;
  }

  getMaxSinkIndex() {
    return this.sinkType == Nodes.NEURON
      ? params.maxNumberNeurons - 1
      : Actions.NUM_ACTIONS - 1;
  }

  makeRandom() {
    this.sourceType = getRandomInt(0, 1);
    this.sourceIndex = getRandomInt(0, this.getMaxSourceIndex());
    this.sinkType = getRandomInt(0, 1);
    this.sinkIndex = getRandomInt(0, this.getMaxSinkIndex());
    this.weightInt = getRandomInt(0, 0xefff) - 0x8000; //(Math.random() - 0.5) * 8; // -4 to 4
    this.weight = this.weightInt / 8192.0;
  }

  applyPointMutation() {
    const geneRegion = getRandomInt(0, 4);
    switch (geneRegion) {
      case 0:
        this.sourceType = this.sourceType ^ 1;
        break;
      case 1:
        this.sourceIndex ^= 1 << getRandomInt(0, 7);
        if (this.sourceIndex > this.getMaxSourceIndex()) {
          console.log(
            this.sourceIndex,
            this.sourceIndex % (this.getMaxSourceIndex() + 1)
          );
        }
        this.sourceIndex %= this.getMaxSourceIndex() + 1;

        break;
      case 2:
        this.sinkType = this.sinkType ^ 1;
        break;
      case 3:
        this.sinkIndex ^= 1 << getRandomInt(0, 7);
        this.sinkIndex %= this.getMaxSinkIndex() + 1;
        break;
      case 4:
        this.weightInt ^= 1 << getRandomInt(0, 15);
        this.weight = this.weightInt / 8192.0;
        break;
      default:
        throw new Error();
    }
  }
}
