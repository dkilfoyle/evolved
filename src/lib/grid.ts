export class Grid {
  sizeX: number;
  sizeY: number;
  data: number[][];

  constructor(sizeX: number, sizeY: number) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.data = [];
    this.init();
  }
  init() {
    this.data = Array.from({ length: this.sizeX }, () =>
      Array<number>(this.sizeY).fill(0)
    );
  }
}
