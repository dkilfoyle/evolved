import { Gene } from './gene';
import { params } from './params';

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

  applyPointMutations() {
    this.genes.forEach((gene) => {
      if (Math.random() < params.pointMutationRate) gene.applyPointMutation();
    });
  }
}
