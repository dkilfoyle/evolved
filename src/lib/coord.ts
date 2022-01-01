import { Compass } from './models';
import { params } from './params';
import { getRandomInt } from './utils';

export class Coord {
  x: number;
  y: number;
  constructor(x = 0, y = 0) {
    this.x = Math.floor(x);
    this.y = Math.floor(y);
  }

  length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  normalize() {
    return this.asDir().asNormalizedCoord();
  }

  // to(end: Coord) {
  //   return new Dir(end.x - this.x, end.y - this.y);
  // }

  clone() {
    return new Coord(this.x, this.y);
  }

  set(loc: Coord) {
    this.x = loc.x;
    this.y = loc.y;
  }

  add(loc: Coord) {
    return new Coord(this.x + loc.x, this.y + loc.y);
  }

  sub(loc: Coord) {
    return new Coord(this.x - loc.x, this.y - loc.y);
  }

  isEqual(loc: Coord) {
    return this.x == loc.x && this.y == loc.y;
  }

  notEqual(loc: Coord) {
    return !this.isEqual(loc);
  }

  isZeroLength() {
    return this.x == 0 && this.y == 0;
  }

  asDir() {
    // tanN/tanD is the best rational approximation to tan(22.5) under the constraint that
    // tanN + tanD < 2**16 (to avoid overflows). We don't care about the scale of the result,
    // only the ratio of the terms. The actual rotation is (22.5 - 1.5e-8) degrees, whilst
    // the closest a pair of int16_t's come to any of these lines is 8e-8 degrees, so the result is exact
    const tanN = 13860;
    const tanD = 33461;
    const conversion = [S, C, SW, N, SE, E, N, N, N, N, W, NW, N, NE, N, N];

    const xp = this.x * tanD + this.y * tanN;
    const yp = this.y * tanD - this.x * tanN;

    // We can easily check which side of the four boundary lines
    // the point now falls on, giving 16 cases, though only 9 are
    // possible.
    return new Dir(
      conversion[+(yp > 0) * 8 + +(xp > 0) * 4 + +(yp > xp) * 2 + +(yp >= -xp)]
    );
  }
}

const N = Compass.N;
const NE = Compass.NE;
const E = Compass.E;
const SE = Compass.SE;
const S = Compass.S;
const SW = Compass.SW;
const W = Compass.W;
const NW = Compass.NW;
const C = Compass.CENTER;

const rotations = [
  SW,
  W,
  NW,
  N,
  NE,
  E,
  SE,
  S,
  S,
  SW,
  W,
  NW,
  N,
  NE,
  E,
  SE,
  SE,
  S,
  SW,
  W,
  NW,
  N,
  NE,
  E,
  W,
  NW,
  N,
  NE,
  E,
  SE,
  S,
  SW,
  C,
  C,
  C,
  C,
  C,
  C,
  C,
  C,
  E,
  SE,
  S,
  SW,
  W,
  NW,
  N,
  NE,
  NW,
  N,
  NE,
  E,
  SE,
  S,
  SW,
  W,
  N,
  NE,
  E,
  SE,
  S,
  SW,
  W,
  NW,
  NE,
  E,
  SE,
  S,
  SW,
  W,
  NW,
  N,
];

export class Dir {
  dir9: Compass;
  constructor(dir: Compass = Compass.CENTER) {
    this.dir9 = dir;
  }

  clone() {
    return new Dir(this.dir9);
  }

  set(dir: Dir) {
    this.dir9 = dir.dir9;
  }

  asNormalizedCoord() {
    return new Coord((this.dir9 % 3) - 1, Math.floor(this.dir9 / 3 - 1));
  }
  static random8() {
    return new Dir(Compass.N).rotate(getRandomInt(0, 7));
  }

  rotate(n: number) {
    return new Dir(rotations[this.dir9 * 8 + (n & 7)]);
  }

  rotate90DegCW() {
    return this.rotate(2);
  }
  rotate90DegCCW() {
    return this.rotate(-2);
  }
  rotate180Deg() {
    return this.rotate(4);
  }
}

export function visitNeighborhood(
  loc: Coord,
  radius: number,
  f: (x: Coord) => void
) {
  for (
    let dx = -Math.floor(Math.min(radius, loc.x));
    dx <= Math.floor(Math.min(radius, params.sizeX - loc.x - 1));
    ++dx
  ) {
    const x = loc.x + dx;
    // assert(x >= 0 && x < p.sizeX);
    const extentY = Math.sqrt(radius * radius - dx * dx);
    for (
      let dy = -Math.floor(Math.min(extentY, loc.y));
      dy <= Math.floor(Math.min(extentY, params.sizeY - loc.y - 1));
      ++dy
    ) {
      const y = loc.y + dy;
      // assert(y >= 0 && y < p.sizeY);
      f(new Coord(x, y));
    }
  }
}
