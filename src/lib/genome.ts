import { Gene } from './gene';
import { params } from './params';

export class Genome {
  genes: Gene[];

  constructor() {
    this.genes = [];
    for (let i = 0; i < params.genomeMaxLength; i++) {
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

  similarity(other: Genome) {
    let similarity = 0;
    if (this.genes.length != other.genes.length) throw new Error();
    for (let i = 0; i < this.genes.length; i++) {
      similarity += this.genes[i].similarity(other.genes[i]);
    }
    return similarity / this.genes.length;
  }
}
