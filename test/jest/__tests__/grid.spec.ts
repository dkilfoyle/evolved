import { Grid } from '../../../src/lib/grid';
import { describe, expect, it, beforeAll } from '@jest/globals';
import { params } from 'src/lib/params';

describe('Grid', () => {
  let grid: Grid;
  beforeAll(() => {
    grid = new Grid();
    grid.init();
  });
  it('is correct size', () => {
    expect(grid.data.length).toEqual(params.sizeX);
    expect(grid.data[0].length).toEqual(params.sizeY);
  });
});
