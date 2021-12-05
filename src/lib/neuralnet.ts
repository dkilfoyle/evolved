import { Gene } from './gene';
import { Actions, Nodes } from './models';
import { Neuron } from './neuron';

export class NeuralNet {
  connections: Gene[];
  neurons: Neuron[];

  constructor() {
    this.connections = [];
    this.neurons = [];
  }

  feedForward() {
    const actionAccumulators = new Array<number>(Actions.NUM_ACTIONS).fill(0);
    const neuronAccumulators = new Array<number>(this.neurons.length).fill(0);

    let neuronOutputsComputed = false;
    this.connections.forEach((con) => {
      if (con.sinkType == Nodes.ACTION && !neuronOutputsComputed) {
        // connections are listed with neuron outputs first then action outputs
        // have reached the first output to action so latch all neuron outputs into -1 to 1 range
        this.neurons.forEach((neuron, i) => {
          if (neuron.driven) {
            neuron.output = Math.tanh(neuronAccumulators[i]);
          }
        });
        neuronOutputsComputed = true;
      }

      let inputVal;
      if (con.sourceType == Nodes.SENSOR) {
        inputVal = 111; // getSensor(con.sourceIndex, simStep)
      } else {
        inputVal = this.neurons[con.sourceIndex].output;
      }

      if (con.sinkType == Nodes.ACTION) {
        actionAccumulators[con.sinkIndex] += inputVal * con.weight;
      } else {
        neuronAccumulators[con.sinkIndex] += inputVal * con.weight;
      }
    });
    return actionAccumulators;
  }
}
