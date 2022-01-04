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

  size() {
    return this.genes.length;
  }

  makeRandom() {
    this.genes.forEach((gene) => gene.makeRandom());
  }

  randomInsertDeletion() {
    if (Math.random() < params.geneInsertionDeletionRate)
      if (Math.random() < params.deletionRatio) {
        // deletion
        if (this.genes.length > 1) {
          this.genes.splice(getRandomInt(0, this.genes.length - 1), 1);
          return [0, 1];
        }
      } else if (this.genes.length < params.genomeMaxLength) {
        // insertion
        const newgene = new Gene();
        newgene.makeRandom();
        this.genes.push(newgene);
        return [1, 0];
      }
    return [0, 0];
  }

  applyPointMutations() {
    let mutations = 0;
    this.genes.forEach((gene) => {
      if (Math.random() < params.pointMutationRate) {
        gene.applyPointMutation();
        mutations++;
      }
    });
    return mutations;
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

const genesMatch = (g1: Gene, g2: Gene) => {
  return (
    g1.sinkIndex == g2.sinkIndex &&
    g1.sourceIndex == g2.sourceIndex &&
    g1.sinkType == g2.sinkType &&
    g1.sourceType == g2.sourceType &&
    g1.weight == g2.weight
  );
};

// The jaro_winkler_distance() function is adapted from the C version at
// https://github.com/miguelvps/c/blob/master/jarowinkler.c
// under a GNU license, ver. 3. This comparison function is useful if
// the simulator allows genomes to change length, or if genes are allowed
// to relocate to different offsets in the genome. I.e., this function is
// tolerant of gaps, relocations, and genomes of unequal lengths.
//
const jaro_winkler_distance = (genome1: Genome, genome2: Genome) => {
  const s = genome1;
  const a = genome2;

  let i, j, l;
  let m = 0,
    t = 0;
  let sl = s.genes.length; // strlen(s);
  let al = a.genes.length; // strlen(a);

  const maxNumGenesToCompare = 20;
  sl = Math.min(maxNumGenesToCompare, sl); // optimization: approximate for long genomes
  al = Math.min(maxNumGenesToCompare, al);

  const sflags = new Array(sl).fill(0);
  const aflags = new Array(al).fill(0);

  const range = Math.max(0, Math.max(sl, al) / 2 - 1);

  if (!sl || !al) return 0.0;

  /* calculate matching characters */
  for (i = 0; i < al; i++) {
    for (
      j = Math.max(i - range, 0), l = Math.min(i + range + 1, sl);
      j < l;
      j++
    ) {
      if (genesMatch(a.genes[i], s.genes[j]) && !sflags[j]) {
        sflags[j] = 1;
        aflags[i] = 1;
        m++;
        break;
      }
    }
  }

  if (!m) return 0.0;

  /* calculate character transpositions */
  l = 0;
  for (i = 0; i < al; i++) {
    if (aflags[i] == 1) {
      for (j = l; j < sl; j++) {
        if (sflags[j] == 1) {
          l = j + 1;
          break;
        }
      }
      if (!genesMatch(a.genes[i], s.genes[j])) t++;
    }
  }
  t /= 2;

  /* Jaro distance */
  const dw = (m / sl + m / al + (m - t) / m) / 3.0;
  return dw;
};

const bitCount = (n: number) => {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
};

// xor flags bits that are different
// 1100 xor
// 1011
//=0111
// now count the bits that are 1 = number of bits that are different
const countNumBitsDifferent = (gene1: Gene, gene2: Gene) => {
  return (
    bitCount(gene1.sourceIndex ^ gene2.sourceIndex) +
    bitCount(gene1.sourceType ^ gene2.sourceType) +
    bitCount(gene1.sinkIndex ^ gene2.sinkIndex) +
    bitCount(gene1.sinkType ^ gene2.sinkType) +
    bitCount(gene1.weightInt ^ gene2.weightInt)
  );
};

// Works only for genomes of equal length
const hammingDistanceBits = (genome1: Genome, genome2: Genome) => {
  if (genome1.size() != genome2.size()) throw new Error();

  const lengthBits = 34; // index = 8 bits * 2, weight = 16, type = 1*2
  let bitCount = 0;

  for (let index = 0; index < genome1.size(); ++index) {
    bitCount += countNumBitsDifferent(
      genome1.genes[index],
      genome2.genes[index]
    );
  }

  // For two completely random bit patterns, about half the bits will differ,
  // resulting in c. 50% match. We will scale that by 2X to make the range
  // from 0 to 1.0. We clip the value to 1.0 in case the two patterns are
  // negatively correlated for some reason.
  return 1.0 - Math.min(1.0, (2.0 * bitCount) / (lengthBits * genome1.size()));
};

// Works only for genomes of equal length
const hammingDistanceBytes = (genome1: Genome, genome2: Genome) => {
  if (genome1.size() != genome2.size()) throw new Error();
  let byteCount = 0;
  for (let index = 0; index < genome1.size(); index++) {
    const b1 = Buffer.from(JSON.stringify(genome1.genes[index]));
    const b2 = Buffer.from(JSON.stringify(genome2.genes[index]));
    for (let i = 0; i < b1.length; i++) {
      byteCount += +(b1[i] == b2[i]);
    }
  }

  return byteCount / Buffer.from(JSON.stringify(genome1.genes[0])).length;
};

// Returns 0.0..1.0
//
// ToDo: optimize by approximation for long genomes
export const genomeSimilarity = (g1: Genome, g2: Genome) => {
  switch (params.genomeComparisonMethod) {
    case 0:
      return jaro_winkler_distance(g1, g2);
    case 1:
      return hammingDistanceBits(g1, g2);
    case 2:
      return hammingDistanceBytes(g1, g2);
    default:
      throw new Error();
  }
};
