import { Coord } from './coord';
import { params } from './params';
import { getRandomInt } from './utils';

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
    const loc = new Coord();
    const found = false;

    while (!found) {
      loc.x = getRandomInt(0, params.sizeX - 1);
      loc.y = getRandomInt(0, params.sizeY - 1);
      if (this.isEmptyAt(loc)) {
        break;
      }
    }
    return loc;
  }

  isEmptyAt(loc: Coord) {
    return this.get(loc) == 0;
  }

  isBarrierAt(loc: Coord) {
    return this.get(loc) == 0xfffff;
  }

  isOccupiedAt(loc: Coord) {
    const at = this.get(loc);
    return at != 0 && at != 0xffff;
  }

  isInBounds(loc: Coord) {
    return loc.x >= 0 && loc.x < this.sizeX && loc.y >= 0 && loc.y < this.sizeY;
  }

  set(loc: Coord, index: number) {
    this.data[loc.x][loc.y] = index;
  }

  get(loc: Coord) {
    return this.data[loc.x][loc.y];
  }
}
