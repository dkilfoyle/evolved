import { Compass } from './models';
import { params } from './params';
import { getRandomInt } from './utils';

export class Coord {
  x: number;
  y: number;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
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

  add(loc: Coord) {
    return new Coord(this.x + loc.x, this.y + loc.y);
  }

  sub(loc: Coord) {
    return new Coord(this.x - loc.x, this.y - loc.y);
  }

  isEqual(loc: Coord) {
    return this.x == loc.x && this.y == loc.y;
  }

  asDir() {
    if (this.x == 0 && this.y == 0) return new Dir(Compass.CENTER);
    const TWO_PI = 3.1415927 * 2.0;
    let angle = Math.atan2(this.y, this.x);

    if (angle < 0.0) {
      angle = 3.1415927 + (3.1415927 + angle);
    }
    //assert(angle >= 0.0 && angle <= TWO_PI);

    angle += TWO_PI / 16.0; // offset by half a slice
    if (angle > TWO_PI) {
      angle -= TWO_PI;
    }
    const slice = angle / (TWO_PI / 8.0); // find which division it's in
    /*
        We have to convert slice values:
            3  2  1
            4     0
            5  6  7
        into Dir8Compass value:
            6  7  8
            3  4  5
            0  1  2
    */
    const dirconversion = [
      Compass.E,
      Compass.NE,
      Compass.N,
      Compass.NW,
      Compass.W,
      Compass.SW,
      Compass.S,
      Compass.SE,
    ];
    return new Dir(dirconversion[slice]);
  }
}

export class Dir {
  dir9: Compass;
  constructor(dir: Compass = Compass.CENTER) {
    this.dir9 = dir;
  }
  asNormalizedCoord() {
    return new Coord((this.dir9 % 3) - 1, Math.floor(this.dir9 / 3 - 1));
  }
  static random8() {
    return new Dir(Compass.N).rotate(getRandomInt(0, 7));
  }

  rotate(n: number) {
    const rotateRight = [3, 0, 1, 6, 4, 2, 7, 8, 5];
    const rotateLeft = [1, 2, 5, 0, 4, 8, 3, 6, 7];

    let n9 = this.dir9;
    if (n < 0) {
      while (n++ < 0) {
        n9 = rotateLeft[n9];
      }
    } else if (n > 0) {
      while (n-- > 0) {
        n9 = rotateRight[n9];
      }
    }
    return new Dir(n9);
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
