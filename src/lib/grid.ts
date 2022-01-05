import { Coord, visitNeighborhood } from './coord';
import { Barrier } from './models';
import { params } from './params';
import { getRandomInt } from './utils';

export class Grid {
  sizeX = 0;
  sizeY = 0;
  data: number[][] = [[]];
  barrierCenters: Coord[] = [];
  barrierLocations: Coord[] = [];

  clearData() {
    this.data = Array.from({ length: this.sizeX }, () =>
      Array<number>(this.sizeY).fill(0)
    );
  }

  init(generation: number) {
    this.sizeX = params.sizeX;
    this.sizeY = params.sizeY;
    this.clearData();
    if (params.replaceBarrierTypeGenerationNumber == -1)
      this.createBarrier(params.barrierType);
    else
      this.createBarrier(
        generation >= params.replaceBarrierTypeGenerationNumber
          ? params.replaceBarrierType
          : params.barrierType
      );
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

  isBorder(loc: Coord) {
    return (
      loc.x == 0 ||
      loc.y == 0 ||
      loc.x == this.sizeX - 1 ||
      loc.y == this.sizeY - 1
    );
  }

  set(loc: Coord, index: number) {
    this.data[loc.x][loc.y] = index;
  }

  get(loc: Coord) {
    return this.data[loc.x][loc.y];
  }

  createBarrier(barrierId: Barrier) {
    this.barrierLocations = [];
    this.barrierCenters = [];

    const addLocation = (loc: Coord) => {
      this.set(loc, 0xffff);
      this.barrierLocations.push(loc);
    };

    const drawBox = (
      minX: number,
      minY: number,
      maxX: number,
      maxY: number
    ) => {
      for (let x = minX; x <= maxX; ++x) {
        for (let y = minY; y <= maxY; ++y) {
          const loc = new Coord(x, y);
          this.set(loc, 0xffff);
          this.barrierLocations.push(loc);
        }
      }
    };

    switch (barrierId) {
      case Barrier.NONE:
        return;

      // Vertical bar in constant location
      case Barrier.VERTICAL_BAR:
        {
          const minX = params.sizeX / 2;
          const maxX = minX + 1;
          const minY = params.sizeY / 4;
          const maxY = minY + params.sizeY / 2;

          drawBox(minX, minY, maxX, maxY);
        }
        break;

      // Vertical bar in random location
      case Barrier.VERTICAL_BAR_RAND:
        {
          const minX = getRandomInt(20, params.sizeX - 20);
          const maxX = minX + 1;
          const minY = getRandomInt(20, params.sizeY / 2 - 20);
          const maxY = minY + params.sizeY / 2;

          drawBox(minX, minY, maxX, maxY);
        }
        break;

      // five blocks staggered
      case 3:
        {
          const blockSizeX = 2;
          const blockSizeY = params.sizeX / 3;
          let y0 = params.sizeY / 4 - blockSizeY / 2;
          let x0 = params.sizeX / 4 - blockSizeX / 2;
          let x1 = x0 + blockSizeX;
          let y1 = y0 + blockSizeY;

          drawBox(x0, y0, x1, y1);
          x0 += params.sizeX / 2;
          x1 = x0 + blockSizeX;
          drawBox(x0, y0, x1, y1);
          y0 += params.sizeY / 2;
          y1 = y0 + blockSizeY;
          drawBox(x0, y0, x1, y1);
          x0 -= params.sizeX / 2;
          x1 = x0 + blockSizeX;
          drawBox(x0, y0, x1, y1);
          x0 = params.sizeX / 2 - blockSizeX / 2;
          x1 = x0 + blockSizeX;
          y0 = params.sizeY / 2 - blockSizeY / 2;
          y1 = y0 + blockSizeY;
          drawBox(x0, y0, x1, y1);
        }
        break;

      // Horizontal bar in constant location
      case 4:
        {
          const minX = params.sizeX / 4;
          const maxX = minX + params.sizeX / 2;
          const minY = params.sizeY / 2 + params.sizeY / 4;
          const maxY = minY + 2;

          drawBox(minX, minY, maxX, maxY);
        }
        break;

      // Three floating islands -- different locations every generation
      case 5:
        {
          const radius = 3.0;
          const margin = 2 * radius;

          const randomLoc = () => {
            return new Coord(
              getRandomInt(margin, params.sizeX - margin),
              getRandomInt(margin, params.sizeY - margin)
            );
          };

          const center0 = randomLoc();
          let center1: Coord;
          let center2: Coord;

          do {
            center1 = randomLoc();
          } while (center0.sub(center1).length() < margin);

          do {
            center2 = randomLoc();
          } while (
            center0.sub(center2).length() < margin ||
            center1.sub(center2).length() < margin
          );

          this.barrierCenters.push(center0);
          this.barrierCenters.push(center1);
          this.barrierCenters.push(center2);

          visitNeighborhood(center0, radius, addLocation);
          visitNeighborhood(center1, radius, addLocation);
          visitNeighborhood(center2, radius, addLocation);
        }
        break;

      // Spots, specified number, radius, locations
      case Barrier.SPOTS:
        {
          const numberOfLocations = 5;
          const radius = 5.0;

          const verticalSliceSize = params.sizeY / (numberOfLocations + 1);

          for (let n = 1; n <= numberOfLocations; ++n) {
            const loc = new Coord(
              getRandomInt(radius, params.sizeX - radius),
              n * verticalSliceSize
            );
            visitNeighborhood(loc, radius, addLocation);
            this.barrierCenters.push(loc);
          }
        }
        break;

      default:
        throw new Error('barrier type not processed');
    }
  }
}
