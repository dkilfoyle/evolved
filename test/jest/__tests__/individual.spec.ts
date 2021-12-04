import { Individual } from '../../../src/lib/individual';
import { describe, expect, it, beforeAll, beforeEach } from '@jest/globals';
import { Coord } from 'src/lib/coord';
import { Genome } from 'src/lib/genome';
import { Gene } from 'src/lib/gene';
import { Actions, Nodes, Sensors } from 'src/lib/models';
import { params } from 'src/lib/utils';

describe('Individual', () => {
  let indiv: Individual;

  beforeAll(() => {
    const genome = new Genome();
    // genome.genes.forEach((gene) =>
    //   console.log(
    //     `new Gene(${gene.sourceType}, ${gene.sourceIndex}, ${gene.sinkType}, ${gene.sinkIndex}, ${gene.weight})`
    //   )
    // );

    genome.genes = [
      new Gene(0, 7574, 0, 15290, 2.4861636469169373),
      new Gene(0, 5150, 0, 26121, 1.142790939487151),
      new Gene(1, 6086, 0, 12216, -1.622634462668488),
      new Gene(0, 2902, 1, 16541, -0.5134911564336129),
      new Gene(1, 20932, 1, 22191, 3.045912503827074),
      new Gene(0, 10436, 1, 15266, 3.069997885821225),
      new Gene(1, 10533, 1, 26416, -2.951891588576032),
      new Gene(1, 24150, 1, 6507, 1.7292580213990405),
      new Gene(0, 1964, 1, 14202, 0.4390910012126348),
      new Gene(1, 2985, 0, 13140, 1.8943137530256369),
      new Gene(0, 28034, 1, 25345, -1.1271399966105573),
      new Gene(1, 853, 0, 8946, 2.3429095821144834),
      new Gene(0, 17373, 0, 17059, -3.0568789535750955),
      new Gene(1, 17548, 0, 9508, -2.95361301210089),
      new Gene(1, 32534, 1, 26510, 3.734717143111734),
      new Gene(0, 3615, 1, 13026, -2.048515535023567),
    ];

    indiv = new Individual(0, new Coord(0, 0), genome);
  });

  describe('makeRenumberedConnectionList', () => {
    beforeAll(() => {
      indiv.makeRenumberedConnectionList();
      console.log('Sensor (1) to Neuron (0)');
      indiv.connections
        .filter(
          (con) =>
            con.sourceType == Nodes.SENSOR && con.sinkType == Nodes.NEURON
        )
        .forEach((con) =>
          console.log(`${con.sourceIndex} => ${con.sinkIndex}, ${con.weight}`)
        );
      console.log('Sensor (1) to Action (1)');
      indiv.connections
        .filter(
          (con) =>
            con.sourceType == Nodes.SENSOR && con.sinkType == Nodes.ACTION
        )
        .forEach((con) =>
          console.log(`${con.sourceIndex} => ${con.sinkIndex}, ${con.weight}`)
        );
      console.log('Neuron (0) to Neuron (0)');
      indiv.connections
        .filter(
          (con) =>
            con.sourceType == Nodes.NEURON && con.sinkType == Nodes.NEURON
        )
        .forEach((con) =>
          console.log(`${con.sourceIndex} => ${con.sinkIndex}, ${con.weight}`)
        );
      console.log('Neuron (0) to Action (1)');
      indiv.connections
        .filter(
          (con) =>
            con.sourceType == Nodes.NEURON && con.sinkType == Nodes.ACTION
        )
        .forEach((con) =>
          console.log(`${con.sourceIndex} => ${con.sinkIndex}, ${con.weight}`)
        );
    });

    it('calculates source indexes correctly', () => {
      indiv.connections
        .filter((con) => con.sourceType == Nodes.SENSOR)
        .forEach((con) => {
          expect(con.sourceIndex).toBeLessThan(Sensors.NUM_SENSES);
        });
      indiv.connections
        .filter((con) => con.sourceType == Nodes.NEURON)
        .forEach((con) => {
          expect(con.sourceIndex).toBeLessThan(params.maxNumberNeurons);
        });
    });

    it('calculates sink indexes correctly', () => {
      indiv.connections
        .filter((con) => con.sinkType == Nodes.ACTION)
        .forEach((con) => {
          expect(con.sinkIndex).toBeLessThan(Actions.NUM_ACTIONS);
        });
      indiv.connections
        .filter((con) => con.sinkType == Nodes.NEURON)
        .forEach((con) => {
          expect(con.sinkIndex).toBeLessThan(params.maxNumberNeurons);
        });
    });
  });

  describe('makeNodeMap', () => {
    beforeAll(() => {
      indiv.makeRenumberedConnectionList();
      indiv.makeNodeMap();
    });

    // node with a sensor and static neuron inputs
    it('calculates N0 correctly', () => {
      expect(indiv.nodes.get(0)?.numOutputs).toEqual(1);
      expect(indiv.nodes.get(0)?.numSelfInputs).toEqual(0);
      expect(indiv.nodes.get(0)?.numInputsFromSensorsOrOtherNeurons).toEqual(2);
    });

    // a node with no inputs but 3 outputs
    it('calculates N4 correctly', () => {
      expect(indiv.nodes.get(4)?.numOutputs).toEqual(3);
      expect(indiv.nodes.get(4)?.numSelfInputs).toEqual(0);
      expect(indiv.nodes.get(4)?.numInputsFromSensorsOrOtherNeurons).toEqual(0);
    });

    // a node with no outputs
    it('calculates N8 correctly', () => {
      expect(indiv.nodes.get(8)?.numOutputs).toEqual(0);
      expect(indiv.nodes.get(8)?.numSelfInputs).toEqual(0);
      expect(indiv.nodes.get(8)?.numInputsFromSensorsOrOtherNeurons).toEqual(1);
    });
  });

  describe('cullUselessNeurons', () => {
    beforeAll(() => {
      indiv.makeRenumberedConnectionList();
      indiv.makeNodeMap();
      indiv.cullUselessNeurons();
    });

    it('culls empty neurons', () => {
      expect(indiv.nodes.has(1)).toBeFalsy();
      expect(indiv.nodes.has(8)).toBeFalsy();
      expect(indiv.nodes.has(9)).toBeFalsy();
      // culling N1 will leave N0 with no outputs
      expect(indiv.nodes.has(0)).toBeFalsy();
      // culling N9 will leave N3 with no outputs
      expect(indiv.nodes.has(3)).toBeFalsy();
    });

    it('selects only nodes with at least 1 output', () => {
      indiv.nodes.forEach((node) => {
        expect(node.numOutputs).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('createWiringFromGenome', () => {
    beforeAll(() => {
      indiv.createWiringFromGenome();
      console.log(indiv.nnet.connections);
    });

    it('has N3 (was N5) connected to A2', () => {
      expect(
        indiv.nnet.connections.some((con) => {
          return (
            con.sourceType == Nodes.NEURON &&
            con.sinkType == Nodes.ACTION &&
            con.sourceIndex == 3 &&
            con.sinkIndex == 2
          );
        })
      ).toBeTruthy();
    });
    it('has S13 connected to N1 (was N6)', () => {
      expect(
        indiv.nnet.connections.some((con) => {
          return (
            con.sourceType == Nodes.SENSOR &&
            con.sinkType == Nodes.NEURON &&
            con.sourceIndex == 13 &&
            con.sinkIndex == 1
          );
        })
      ).toBeTruthy();
    });
    it('has S0 connected to A11', () => {
      expect(
        indiv.nnet.connections.some((con) => {
          return (
            con.sourceType == Nodes.SENSOR &&
            con.sinkType == Nodes.ACTION &&
            con.sourceIndex == 0 &&
            con.sinkIndex == 11
          );
        })
      ).toBeTruthy();
    });
  });
});
