import { Gene } from './gene';
import { params } from './params';
import { getRandomInt } from './utils';

export class Genome {
  genes: Gene[];

  constructor() {
    this.genes = [];
    for (
      let i = 0;
      i <
      getRandomInt(
        params.genomeInitialLengthMin,
        params.genomeInitialLengthMax
      );
      i++
    ) {
      const gene = new Gene();
      gene.makeRandom();
      this.genes.push(gene);
    }
  }

  makeRandom() {
    this.genes.forEach((gene) => gene.makeRandom());
  }

  randomInsertDeletion() {
    if (Math.random() < params.geneInsertionDeletionRate)
      if (Math.random() < params.deletionRatio) {
        // deletion
        if (this.genes.length > 1)
          this.genes.splice(getRandomInt(0, this.genes.length - 1), 1);
      } else if (this.genes.length < params.genomeMaxLength) {
        // insertion
        const newgene = new Gene();
        newgene.makeRandom();
        this.genes.push(newgene);
      }
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
