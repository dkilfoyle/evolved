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
}
