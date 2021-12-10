import { Individual } from '../../../src/lib/individual';
import { describe, expect, it, beforeAll, beforeEach } from '@jest/globals';
import { Coord } from 'src/lib/coord';
import { Genome } from 'src/lib/genome';
import { Gene } from 'src/lib/gene';
import { Actions, Nodes, Sensors } from 'src/lib/models';
import { params } from 'src/lib/params';

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
      // sensor 1 to action 16
      new Gene(1, 1, 1, 15, -2.95361301210089),

      // sensor 5 to action 8
      new Gene(1, 5, 1, 8, 3.734717143111734),

      // neuron 4 to neuron 4
      new Gene(0, 4, 0, 4, 3.069997885821225),

      // neuron 3 to neuron 1
      new Gene(0, 3, 0, 1, 3.069997885821225),

      // sensor 2 to neuron 9 to neuron 8
      new Gene(1, 2, 0, 9, -2.951891588576032),
      new Gene(0, 9, 0, 8, 2.951891588576032),

      // sensor 3 to neuron 7 to neuron 5 to action 10
      new Gene(1, 3, 0, 7, -2.142790939487151),
      new Gene(0, 7, 0, 5, 1.5134911564336129),
      new Gene(0, 5, 1, 10, -2.951891588576032),

      // neuron to action
      new Gene(0, 9, 1, 1, 2.4861636469169373),
      new Gene(0, 8, 1, 2, 1.142790939487151),
      new Gene(0, 6, 1, 3, -1.622634462668488),
      new Gene(0, 4, 1, 4, -0.5134911564336129),

      // sensor to neuron
      new Gene(1, 5, 0, 8, -1.1271399966105573),
      new Gene(1, 12, 0, 3, 2.3429095821144834),
    ];

    indiv = new Individual(0, new Coord(0, 0), genome);
  });

  describe('makeRenumberedConnectionList', () => {
    beforeAll(() => {
      indiv.makeConnectionList();
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
      indiv.makeConnectionList();
      indiv.makeNodeMap();
    });

    // node with a sensor and static neuron inputs
    it('calculates N8 with multiple inputs correctly', () => {
      expect(indiv.nodes.get(8)?.numOutputs).toEqual(1);
      expect(indiv.nodes.get(8)?.numSelfInputs).toEqual(0);
      expect(indiv.nodes.get(8)?.numInputsFromSensorsOrOtherNeurons).toEqual(2);
    });

    // a node with no inputs but 3 outputs
    it('calculates N4 with self-input correctly', () => {
      expect(indiv.nodes.get(4)?.numOutputs).toEqual(2);
      expect(indiv.nodes.get(4)?.numSelfInputs).toEqual(1);
      expect(indiv.nodes.get(4)?.numInputsFromSensorsOrOtherNeurons).toEqual(0);
    });

    // a node with no outputs
    it('calculates N1 with 0 outputs correctly', () => {
      expect(indiv.nodes.get(1)?.numOutputs).toEqual(0);
      expect(indiv.nodes.get(1)?.numSelfInputs).toEqual(0);
      expect(indiv.nodes.get(1)?.numInputsFromSensorsOrOtherNeurons).toEqual(1);
    });
  });

  describe('cullUselessNeurons', () => {
    beforeAll(() => {
      indiv.makeConnectionList();
      indiv.makeNodeMap();
      indiv.cullUselessNeurons();
    });

    it('culls empty neurons', () => {
      expect(indiv.nodes.has(1)).toBeFalsy();
      expect(indiv.nodes.has(3)).toBeFalsy();
      // culling N1 will leave N3 with no outputs
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

    it('has neuron connections before action connections', () => {
      const firstAction = indiv.nnet.connections.findIndex(
        (con) => con.sinkType == Nodes.ACTION
      );
      expect(
        indiv.nnet.connections
          .slice(firstAction)
          .find((con) => con.sinkType == Nodes.NEURON)
      ).toBeUndefined();
    });

    it('has N0 (was N4) connected to A4', () => {
      expect(
        indiv.nnet.connections.some((con) => {
          return (
            con.sourceType == Nodes.NEURON &&
            con.sinkType == Nodes.ACTION &&
            con.sourceIndex == 0 &&
            con.sinkIndex == 4
          );
        })
      ).toBeTruthy();
    });
    it('has S2 connected to N1 (was N9)', () => {
      expect(
        indiv.nnet.connections.some((con) => {
          return (
            con.sourceType == Nodes.SENSOR &&
            con.sinkType == Nodes.NEURON &&
            con.sourceIndex == 2 &&
            con.sinkIndex == 1
          );
        })
      ).toBeTruthy();
    });
  });
});
