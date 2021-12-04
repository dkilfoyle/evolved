import { Coord } from '../../../src/lib/coord';
import { describe, expect, it } from '@jest/globals';

describe('Coord', () => {
  it('calculates correct length', () => {
    const coord = new Coord(3, 4);
    expect(coord.length()).toEqual(5);
  });
});
