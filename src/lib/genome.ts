import { Gene } from './gene';
import { params } from './utils';

export class Genome {
  genes: Gene[];

  constructor() {
    this.genes = [];

    for (let i = 0; i < params.genomeLength; i++) {
      const gene = new Gene();
      gene.makeRandom();
      this.genes.push(gene);
    }
  }

  makeRandom() {
    this.genes.forEach((gene) => gene.makeRandom());
  }
}
