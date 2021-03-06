import { Coord, visitNeighborhood } from './coord';
import { params } from './params';

class Layer {
  data: number[][];
  constructor(sizeX: number, sizeY: number) {
    this.data = Array.from({ length: sizeX }, () =>
      Array.from({ length: sizeY }, () => 0)
    );
  }
}

export class Signals {
  static SIGNAL_MIN = 0;
  static SIGNAL_MAX = 0xff;
  layers: Layer[] = [];

  constructor() {
    this.init();
  }
  getMagnitude(layerNum: number, loc: Coord) {
    return this.layers[layerNum].data[loc.x][loc.y];
  }
  init() {
    this.layers = Array.from(
      { length: params.numLayers },
      () => new Layer(params.sizeX, params.sizeY)
    );
  }
  get(layerNum: number, loc: Coord) {
    return this.layers[layerNum].data[loc.x][loc.y];
  }

  set(layerNum: number, loc: Coord, val: number) {
    this.layers[layerNum].data[loc.x][loc.y] = val;
  }

  increment(layerNum: number, loc: Coord) {
    const radius = 3;
    const centerIncreaseAmount = 2;
    const neighborIncreaseAmount = 2;

    visitNeighborhood(loc, radius, (vloc) => {
      if (this.get(layerNum, vloc) < 255) {
        this.set(
          layerNum,
          vloc,
          Math.min(255, this.get(layerNum, vloc) + neighborIncreaseAmount)
        );
      }
    });

    if (this.get(layerNum, loc) < 255) {
      this.set(
        layerNum,
        loc,
        Math.min(255, this.get(layerNum, loc) + centerIncreaseAmount)
      );
    }
  }

  fade(layerNum: number) {
    const fadeAmount = 1;
    for (let x = 0; x < params.sizeX; x++) {
      for (let y = 0; y < params.sizeY; y++) {
        const signalAmount = this.get(layerNum, new Coord(x, y));
        this.set(
          layerNum,
          new Coord(x, y),
          Math.max(0, signalAmount - fadeAmount)
        );
      }
    }
  }
}
