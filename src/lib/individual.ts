import { Coord, Dir } from './coord';
import { Gene } from './gene';
import { Genome } from './genome';
import { Nodes, Node } from './models';
import { NeuralNet } from './neuralnet';
import { Neuron } from './neuron';
import { params } from './params';

export class Individual {
  alive: boolean;
  index: number;
  loc: Coord;
  birthLoc: Coord;
  lastMoveDir: Dir;
  age: number;
  genome: Genome;
  nnet: NeuralNet;
  connections: Gene[];
  nodes: Map<number, Node>;
  oscPeriod = 34;
  longProbeDist = params.longProbeDistance;
  responsiveness = 0.5;

  constructor(index: number, loc: Coord, genome: Genome) {
    this.index = index;
    this.loc = loc;
    this.genome = genome;
    this.alive = true;
    this.birthLoc = loc;
    this.lastMoveDir = Dir.random8();
    this.age = 0;
    this.nnet = new NeuralNet(this);
    this.connections = [];
    this.nodes = new Map<number, Node>();
    // this.createWiringFromGenome();
  }

  makeConnectionList() {
    this.connections = [...this.genome.genes];
  }

  getNode(nodeIndex: number) {
    const node =
      this.nodes.get(nodeIndex) ||
      this.nodes
        .set(nodeIndex, {
          remappedNumber: -1,
          numOutputs: 0,
          numSelfInputs: 0,
          numInputsFromSensorsOrOtherNeurons: 0,
        })
        .get(nodeIndex);
    if (!node) throw new Error();
    return node;
  }

  makeNodeMap() {
    this.nodes.clear();

    for (const connection of this.connections) {
      if (connection.sinkType == Nodes.NEURON) {
        const node = this.getNode(connection.sinkIndex);
        if (
          connection.sourceType == Nodes.NEURON &&
          connection.sourceIndex == connection.sinkIndex
        )
          node.numSelfInputs++;
        else node.numInputsFromSensorsOrOtherNeurons++;
      }
      if (connection.sourceType == Nodes.NEURON) {
        const node = this.getNode(connection.sourceIndex);
        node.numOutputs++;
      }
    }
  }

  removeConnectionsToNeuron(neuronIndex: number) {
    this.connections = this.connections.filter((connection) => {
      if (
        connection.sinkType == Nodes.NEURON &&
        connection.sinkIndex == neuronIndex
      ) {
        if (connection.sourceType == Nodes.NEURON) {
          this.getNode(connection.sourceIndex).numOutputs--;
        }
        return false; // delete (filter out) this connection
      }
      return true;
    });
  }

  // remove neurons with no outputs and the connections to that neuron
  cullUselessNeurons() {
    let allDone = false;
    while (!allDone) {
      allDone = true;
      for (const [index, node] of this.nodes) {
        // remove neurons/nodes with zero outputs or that feedself only
        if (node.numOutputs == node.numSelfInputs) {
          // could be 0
          allDone = false;
          this.removeConnectionsToNeuron(index);
          this.nodes.delete(index);
        }
      }
    }
  }
  createWiringFromGenome() {
    this.makeConnectionList();
    this.makeNodeMap();
    this.cullUselessNeurons();

    let newNumber = 0;
    for (const [index, node] of this.nodes) {
      node.remappedNumber = newNumber++;
    }

    this.nnet.connections = [];

    // first add connections from (sensor or neuron) to neuron
    for (const con of this.connections) {
      if (con.sinkType == Nodes.NEURON) {
        this.nnet.connections.push(
          new Gene(
            con.sourceType,
            con.sourceType == Nodes.NEURON
              ? this.nodes.get(con.sourceIndex)?.remappedNumber
              : con.sourceIndex,
            con.sinkType,
            // fix the destination number
            this.nodes.get(con.sinkIndex)?.remappedNumber,
            con.weight
          )
        );
      }
    }

    // last the connections from (sensor or neuron) to action
    for (const con of this.connections) {
      if (con.sinkType == Nodes.ACTION) {
        this.nnet.connections.push(
          new Gene(
            con.sourceType,
            con.sourceType == Nodes.NEURON
              ? this.nodes.get(con.sourceIndex)?.remappedNumber
              : con.sourceIndex,
            con.sinkType,
            con.sinkIndex,
            con.weight
          )
        );
      }
    }

    // create neurons
    this.nnet.neurons = [];
    for (const [index, node] of this.nodes) {
      this.nnet.neurons.push(
        new Neuron(
          params.initialNeuronOutput,
          node.numInputsFromSensorsOrOtherNeurons != 0
        )
      );
    }
  }
}
