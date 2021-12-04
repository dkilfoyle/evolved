export class Neuron {
  output: number;
  driven: boolean;
  constructor(output = 0.5, driven = false) {
    this.output = output;
    this.driven = driven;
  }
}
