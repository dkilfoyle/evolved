import * as d3 from 'd3';
import { Grid } from '../grid';

const gridMargin = { top: 0, right: 0, bottom: 0, left: 0 },
  gridWidth = 800 - gridMargin.left - gridMargin.right,
  gridHeight = 800 - gridMargin.top - gridMargin.bottom;

export let cellSize: number;

export let gridsvg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;

export const svgInitGrid = () => {
  gridsvg = d3
    .select('#grid')
    .append('svg')
    .attr('width', gridWidth + gridMargin.left + gridMargin.right)
    .attr('height', gridHeight + gridMargin.top + gridMargin.bottom)
    .attr('style', 'display:block')
    // .attr('viewbox', `0 0 ${gridWidth} ${gridHeight}`)
    .append('g')
    .attr('transform', `translate(${gridMargin.left},${gridMargin.top})`);

  d3.select('#grid')
    .select('svg')
    .append('defs')
    .append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 5)
    .attr('refY', 0)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('class', 'arrowHead');

  gridsvg.append('g').attr('id', 'floor');
  gridsvg.append('g').attr('id', 'barriers');
  gridsvg.append('g').attr('id', 'peeps');
  gridsvg.append('g').attr('id', 'dir');
  gridsvg
    .append('g')
    .attr('id', 'trail')
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5);
};

// prettier-ignore
export const svgDrawGrid = (grid: Grid) => {
  cellSize = Math.max(gridWidth / grid.sizeX, gridHeight / grid.sizeY);
  const row = gridsvg.select('#floor').selectAll('g')
    .data(grid.data)
    .join('g')
    .attr('transform', (d, i) => { return `translate(${i * cellSize})` })

  const cols = row
    // each col
    .selectAll('g')
    .data((d) => { return d })

  cols
    .join(enter =>
      enter.append('rect')
        .attr('width', cellSize - 1)
        .attr('height', cellSize - 1)
        .attr('fill', 'lightgrey')
        .attr('y', (d, i) => i * cellSize)
    )
}

export const svgDrawBarriers = (grid: Grid) => {
  gridsvg
    .select('#barriers')
    .selectAll('rect')
    .data(grid.barrierLocations)
    .join('rect')
    .attr('width', cellSize - 1)
    .attr('height', cellSize - 1)
    .attr('fill', 'black')
    .attr('x', (d) => d.x * cellSize)
    .attr('y', (d) => d.y * cellSize);
};
