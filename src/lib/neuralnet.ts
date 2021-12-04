import { Gene } from './gene';
import { Neuron } from './neuron';

export class NeuralNet {
  connections: Gene[];
  neurons: Neuron[];

  constructor() {
    this.connections = [];
    this.neurons = [];
  }
}
