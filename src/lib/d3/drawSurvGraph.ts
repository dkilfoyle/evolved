import * as d3 from 'd3';
import { params } from '../params';
import { Peeps } from '../peeps';

const survMargin = { top: 0, right: 0, bottom: 0, left: 0 },
  survWidth = 600 - survMargin.left - survMargin.right,
  survHeight = 80 - survMargin.top - survMargin.bottom;

let svg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
let x: d3.ScaleLinear<number, number, never>;
let y: d3.ScaleLinear<number, number, never>;

export const svgInitSurvivalGraph = () => {
  x = d3.scaleLinear().domain([0, params.maxGenerations]).range([0, survWidth]);
  y = d3.scaleLinear().domain([0, params.population]).range([survHeight, 0]);

  svg = d3
    .select('#survival')
    .append('svg')
    .attr('width', survWidth + survMargin.left + survMargin.right)
    .attr('height', survHeight + survMargin.top + survMargin.bottom)
    .append('g')
    .attr('transform', `translate(${survMargin.left},${survMargin.top})`);

  svg.append('defs');
  svg.call(createGradient);
  svg.call(createGlowFilter);

  svg
    .append('g')
    .attr('transform', `translate(0,${survHeight})`)
    .attr('id', 'xaxis')
    .call(d3.axisBottom(x));

  // Add Y axis
  svg.append('g').attr('id', 'yaxis').call(d3.axisLeft(y));

  // Add the line
  svg
    .append('g')
    .attr('id', 'line')
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5);

  // Add the area
  svg
    .append('g')
    .attr('id', 'area')
    .append('path')
    .style('fill', 'url(#gradient)');
};

export const svgDrawSurvivalGraph = (peeps: Peeps) => {
  const line = d3
    .line<number>()
    .x((d, i) => x(i))
    .y((d) => y(d));

  const area = d3
    .area<number>()
    .x((d, i) => x(i))
    .y1((d) => y(d))
    .y0(survHeight);

  svg
    .select('#line')
    .select('path')
    .datum(peeps.survivorCounts)
    .attr('d', line);

  svg
    .select('#area')
    .select('path')
    .datum(peeps.survivorCounts)
    .attr('d', area);
};

const createGradient = (
  select: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>
) => {
  const gradient = select
    .select('defs')
    .append('linearGradient')
    .attr('id', 'gradient')
    .attr('x1', '0%')
    .attr('y1', '100%')
    .attr('x2', '0%')
    .attr('y2', '0%');

  gradient
    .append('stop')
    .attr('offset', '0%')
    .attr('style', 'stop-color:#BBF6CA;stop-opacity:0.05');

  gradient
    .append('stop')
    .attr('offset', '100%')
    .attr('style', 'stop-color:#BBF6CA;stop-opacity:.5');
};

const createGlowFilter = (
  select: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>
) => {
  const filter = select.select('defs').append('filter').attr('id', 'glow');

  filter
    .append('feGaussianBlur')
    .attr('stdDeviation', '4')
    .attr('result', 'coloredBlur');

  const femerge = filter.append('feMerge');

  femerge.append('feMergeNode').attr('in', 'coloredBlur');
  femerge.append('feMergeNode').attr('in', 'SourceGraphic');
};
