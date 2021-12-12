import { Individual } from './individual';
import { Actions, Nodes, SimState } from './models';
import { Neuron } from './neuron';
import { getSensor } from './sensorUtils';
import { Synapse } from './synapse';

export class NeuralNet {
  connections: Synapse[];
  neurons: Neuron[];
  indiv: Individual;

  constructor(indiv: Individual) {
    this.indiv = indiv;
    this.connections = [];
    this.neurons = [];
  }

  feedForward(sim: SimState) {
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
        inputVal = getSensor(con.sourceIndex, this.indiv, sim);
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
