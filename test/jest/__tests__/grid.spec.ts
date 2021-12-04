import { Grid } from '../../../src/lib/grid';
import { describe, expect, it, beforeAll } from '@jest/globals';

describe('Grid', () => {
  let grid: Grid;
  beforeAll(() => {
    grid = new Grid(5, 10);
  });
  it('is correct size', () => {
    expect(grid.data.length).toEqual(5);
    expect(grid.data[0].length).toEqual(10);
  });
});
