import { Coord, Dir } from '../../../src/lib/coord';
import { describe, expect, it } from '@jest/globals';
import { Compass } from 'src/lib/models';
import { getRandomInt } from 'src/lib/utils';

describe('Coord', () => {
  it('calculates correct length', () => {
    const coord = new Coord(3, 4);
    expect(coord.length()).toEqual(5);
  });
});

describe('Dir', () => {
  it('normalizes ok', () => {
    const x = new Dir(Compass.NE).asNormalizedCoord();
    expect([-1, 0, 1].includes(x.x)).toBeTruthy();
    expect([-1, 0, 1].includes(x.y)).toBeTruthy();
  });
  it('rotates ok', () => {
    const x0 = new Dir(Compass.N).rotate(0);
    const x1 = new Dir(Compass.N).rotate(1);
    const x2 = new Dir(Compass.N).rotate(2);
    const x3 = new Dir(Compass.N).rotate(3);
    const x4 = new Dir(Compass.N).rotate(4);
    const x5 = new Dir(Compass.N).rotate(5);
    const x6 = new Dir(Compass.N).rotate(6);
    const x7 = new Dir(Compass.N).rotate(7);
    expect(x0.dir9).toEqual(Compass.N);
    expect(x1.dir9).toEqual(Compass.NE);
    expect(x2.dir9).toEqual(Compass.E);
    expect(x3.dir9).toEqual(Compass.SE);
    expect(x4.dir9).toEqual(Compass.S);
    expect(x5.dir9).toEqual(Compass.SW);
    expect(x6.dir9).toEqual(Compass.W);
    expect(x7.dir9).toEqual(Compass.NW);
  });
});
