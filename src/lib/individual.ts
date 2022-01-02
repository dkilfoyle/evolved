import { Coord, Dir, visitNeighborhood } from './coord';
import { Gene } from './gene';
import { Genome } from './genome';
import { Nodes, Node, Challenge, SimState, Compass } from './models';
import { NeuralNet } from './neuralnet';
import { Neuron } from './neuron';
import { params } from './params';
import { Synapse } from './synapse';

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
  survivalScore = 0;
  challengeBits = 0;
  pastLocations: Coord[] = [];

  constructor(index: number, loc: Coord, genome: Genome) {
    this.index = index;
    this.loc = loc;
    this.genome = genome;

    this.alive = true;
    this.birthLoc = loc.clone();
    this.lastMoveDir = Dir.random8();
    this.age = 0;
    this.challengeBits = 0;
    this.pastLocations = [];
    this.nnet = new NeuralNet(this);
    this.connections = [];
    this.nodes = new Map<number, Node>();
    this.createWiringFromGenome();
  }

  moveTo(newloc: Coord) {
    const moveDir = newloc.sub(this.loc).asDir();
    if (moveDir.dir9 == Compass.CENTER) {
      debugger;
    }
    this.pastLocations.push(this.loc.clone());
    this.loc.set(newloc);
    this.lastMoveDir.set(moveDir);
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
    for (const [, node] of this.nodes) {
      node.remappedNumber = newNumber++;
    }

    this.nnet.connections = [];

    // first add connections from (sensor or neuron) to neuron
    for (const con of this.connections) {
      if (con.sinkType == Nodes.NEURON) {
        this.nnet.connections.push(
          new Synapse(
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
          new Synapse(
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
    for (const [, node] of this.nodes) {
      this.nnet.neurons.push(
        new Neuron(
          params.initialNeuronOutput,
          node.numInputsFromSensorsOrOtherNeurons != 0
        )
      );
    }
  }

  calculateSurvivalScore(sim: SimState) {
    if (!this.alive) {
      this.survivalScore = 0;
    }

    switch (params.challenge) {
      // Survivors are those inside the circular area defined by
      // safeCenter and radius
      case Challenge.CIRCLE:
        const safeCenter = new Coord(params.sizeX / 4, params.sizeY / 4);
        const radius = params.sizeX / 4.0;
        const offset = safeCenter.sub(this.loc);
        const distance = offset.length();
        this.survivalScore =
          distance <= radius ? (radius - distance) / radius : 0;
        break;

      // Survivors are all those on the right side of the arena
      case Challenge.RIGHT_HALF:
        this.survivalScore = this.loc.x > params.sizeX * 0.5 ? 1.0 : 0;
        break;

      // Survivors are all those on the right quarter of the arena
      case Challenge.RIGHT_QUARTER:
        this.survivalScore = this.loc.x > params.sizeX * 0.75 ? 1.0 : 0;
        break;

      // Survivors are all those on the left eighth of the arena
      case Challenge.LEFT_EIGHTH:
        this.survivalScore = this.loc.x < params.sizeX / 8 ? 1.0 : 0.0;

      // Survivors are those not touching the border and with exactly the number
      // of neighbors defined by neighbors and radius, where neighbors includes self
      case Challenge.STRING: {
        const minNeighbors = 22;
        const maxNeighbors = 2;
        const radius = 1.5;

        if (sim.grid.isBorder(this.loc)) {
          this.survivalScore = 0;
          return;
        }

        let count = 0;
        const fn = (loc2: Coord) => {
          if (sim.grid.isOccupiedAt(loc2)) ++count;
        };

        visitNeighborhood(this.loc, radius, fn);

        this.survivalScore = +(count >= minNeighbors && count <= maxNeighbors);
        break;
      }

      // Survivors are those within the specified radius of the center. The score
      // is linearly weighted by distance from the center.
      case Challenge.CENTER_WEIGHTED: {
        const safeCenter = new Coord(params.sizeX / 2, params.sizeY / 2.0);
        const radius = params.sizeX / 3.0;

        const offset = safeCenter.sub(this.loc);
        const distance = offset.length();
        if (distance <= radius) {
          this.survivalScore = (radius - distance) / radius;
        } else this.survivalScore = 0;
        break;
      }

      // Survivors are those within the specified radius of the center
      case Challenge.CENTER_UNWEIGHTED: {
        const safeCenter = new Coord(params.sizeX / 2, params.sizeY / 2);
        const radius = params.sizeX / 3.0;

        const offset = safeCenter.sub(this.loc);
        const distance = offset.length();
        this.survivalScore = +(distance <= radius);
        break;
      }

      // Survivors are those within the specified outer radius of the center and with
      // the specified number of neighbors in the specified inner radius.
      // The score is not weighted by distance from the center.
      case Challenge.CENTER_SPARSE: {
        const safeCenter = new Coord(params.sizeX / 2.0, params.sizeY / 2);
        const outerRadius = params.sizeX / 4.0;
        const innerRadius = 1.5;
        const minNeighbors = 5; // includes self
        const maxNeighbors = 8;

        const offset = safeCenter.sub(this.loc);
        const distance = offset.length();
        if (distance <= outerRadius) {
          let count = 0;
          const fn = (loc2: Coord) => {
            if (sim.grid.isOccupiedAt(loc2)) ++count;
          };

          visitNeighborhood(this.loc, innerRadius, fn);
          this.survivalScore = +(
            count >= minNeighbors && count <= maxNeighbors
          );
        }
        break;
      }

      // Survivors are those within the specified radius of any corner.
      // Assumes square arena.
      case Challenge.CORNER: {
        const radius = params.sizeX / 8.0;
        let distance = 0;
        distance = new Coord(0, 0).sub(this.loc).length();
        if (distance <= radius) {
          this.survivalScore = 1;
          return;
        }
        distance = new Coord(0, params.sizeY - 1).sub(this.loc).length();
        if (distance <= radius) {
          this.survivalScore = 1;
          return;
        }
        distance = new Coord(params.sizeX - 1, 0).sub(this.loc).length();
        if (distance <= radius) {
          this.survivalScore = 1;
          return;
        }
        distance = new Coord(params.sizeX - 1, params.sizeY - 1)
          .sub(this.loc)
          .length();
        if (distance <= radius) {
          this.survivalScore = 1;
          return;
        }
        this.survivalScore = 0;
        break;
      }

      // Survivors are those within the specified radius of any corner. The score
      // is linearly weighted by distance from the corner point.
      case Challenge.CORNER_WEIGHTED: {
        const radius = params.sizeX / 8.0;
        let distance = 0;
        distance = new Coord(0, 0).sub(this.loc).length();
        if (distance <= radius) {
          this.survivalScore = (radius - distance) / radius;
          return;
        }
        distance = new Coord(0, params.sizeY - 1).sub(this.loc).length();
        if (distance <= radius) {
          this.survivalScore = (radius - distance) / radius;
          return;
        }
        distance = new Coord(params.sizeX - 1, 0).sub(this.loc).length();
        if (distance <= radius) {
          this.survivalScore = (radius - distance) / radius;
          return;
        }
        distance = new Coord(params.sizeX - 1, params.sizeY - 1)
          .sub(this.loc)
          .length();
        if (distance <= radius) {
          this.survivalScore = (radius - distance) / radius;
          return;
        }
        this.survivalScore = 0;
        break;
      }

      // This challenge is handled in endOfSimStep(), where individuals may die
      // at the end of any sim step. There is nothing else to do here at the
      // end of a generation. All remaining alive become parents.
      case Challenge.RADIOACTIVE_WALLS:
        this.survivalScore = 1;
        break;

      // Survivors are those touching any wall at the end of the generation
      case Challenge.AGAINST_ANY_WALL: {
        const onEdge =
          this.loc.x == 0 ||
          this.loc.x == params.sizeX - 1 ||
          this.loc.y == 0 ||
          this.loc.y == params.sizeY - 1;

        this.survivalScore = +onEdge;
        break;
      }

      // This challenge is partially handled in endOfSimStep(), where individuals
      // that are touching a wall are flagged in their Indiv record. They are
      // allowed to continue living. Here at the end of the generation, any that
      // never touch a wall will die. All that touched a wall at any time during
      // their life will become parents.
      case Challenge.TOUCH_ANY_WALL:
        this.survivalScore = +(this.challengeBits != 0);
        break;

      // Everybody survives and are candidate parents, but scored by how far
      // they migrated from their birth location.
      case Challenge.MIGRATE_DISTANCE: {
        const distance = this.loc.sub(this.birthLoc).length();
        this.survivalScore = distance / Math.max(params.sizeX, params.sizeY);
        break;
      }

      // Survivors are all those on the left or right eighths of the arena
      case Challenge.EAST_WEST_EIGHTHS:
        this.survivalScore = +(
          this.loc.x < params.sizeX / 8 ||
          this.loc.x >= params.sizeX - params.sizeX / 8
        );
        break;

      // Survivors are those within radius of any barrier center. Weighted by distance.
      case Challenge.NEAR_BARRIER: {
        const radius = params.sizeX / 2;

        const barrierCenters = sim.grid.barrierCenters;
        const minDistance = barrierCenters.reduce((accum, cur) => {
          return Math.min(accum, this.loc.sub(cur).length());
        }, 1e8);
        this.survivalScore =
          minDistance <= radius ? 1.0 - minDistance / radius : 0;
        break;
      }

      // Survivors are those not touching a border and with exactly one neighbor which has no other neighbor
      case Challenge.PAIRS: {
        const onEdge =
          this.loc.x == 0 ||
          this.loc.x == params.sizeX - 1 ||
          this.loc.y == 0 ||
          this.loc.y == params.sizeY - 1;

        if (onEdge) {
          this.survivalScore = 0;
          return;
        }

        let count = 0;
        for (let x = this.loc.x - 1; x < this.loc.x + 1; ++x) {
          for (let y = this.loc.y - 1; y < this.loc.y + 1; ++y) {
            const tloc = new Coord(x, y);
            if (
              tloc != this.loc &&
              sim.grid.isInBounds(tloc) &&
              sim.grid.isOccupiedAt(tloc)
            ) {
              ++count;
              if (count == 1) {
                for (let x1 = tloc.x - 1; x1 < tloc.x + 1; ++x1) {
                  for (let y1 = tloc.y - 1; y1 < tloc.y + 1; ++y1) {
                    const tloc1 = new Coord(x1, y1);
                    if (
                      tloc1.notEqual(tloc) &&
                      tloc1.notEqual(this.loc) &&
                      sim.grid.isInBounds(tloc1) &&
                      sim.grid.isOccupiedAt(tloc1)
                    ) {
                      this.survivalScore = 0;
                      return;
                    }
                  }
                }
              } else {
                this.survivalScore = 0;
                return;
              }
            }
          }
        }
        this.survivalScore = +(count == 1);
        break;
      }

      // Survivors are those that contacted one or more specified locations in a sequence,
      // ranked by the number of locations contacted. There will be a bit set in their
      // challengeBits member for each location contacted.
      /*case Challenge.LOCATION_SEQUENCE:
        {
            const count = 0;
            const bits = this.challengeBits;
            const maxNumberOfBits = sizeof(bits) * 8;

            for (unsigned n = 0; n < maxNumberOfBits; ++n) {
                if ((bits & (1 << n)) != 0) {
                    ++count;
                }
            }
            if (count > 0) {
                return { true, count / (float)maxNumberOfBits };
            } else {
                return { false, 0.0 };
            }
        }
        break;*/

      // Survivors are all those within the specified radius of the NE corner
      case Challenge.ALTRUISM_SACRIFICE: {
        const radius = params.sizeX / 4.0; // in 128^2 world, holds 804 agents

        const distance = new Coord(
          params.sizeX - params.sizeX / 4,
          params.sizeY - params.sizeY / 4
        )
          .sub(this.loc)
          .length();
        this.survivalScore =
          distance <= radius ? (radius - distance) / radius : 0;
        break;
      }

      // Survivors are those inside the circular area defined by
      // safeCenter and radius
      case Challenge.ALTRUISM: {
        const safeCenter = new Coord(params.sizeX / 4, params.sizeY / 4);
        const radius = params.sizeX / 4.0; // in a 128^2 world, holds 3216

        const offset = safeCenter.sub(this.loc);
        const distance = offset.length();
        this.survivalScore =
          distance <= radius ? (radius - distance) / radius : 0;
        break;
      }

      default:
        throw new Error('challenge not handled');
    }
  }
}
