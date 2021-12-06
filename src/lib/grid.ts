import { Coord } from './coord';
import { params } from './params';

export class Grid {
  sizeX = 0;
  sizeY = 0;
  data: number[][] = [[]];

  clearData() {
    this.data = Array.from({ length: this.sizeX }, () =>
      Array<number>(this.sizeY).fill(0)
    );
  }

  init() {
    this.sizeX = params.sizeX;
    this.sizeY = params.sizeY;
    this.clearData();
  }

  findEmptyLocation() {
    return new Coord(0, 0);
  }
}
