import * as d3 from 'd3';
import { params } from '../params';
import { Peeps } from '../peeps';

const survMargin = { top: 0, right: 0, bottom: 0, left: 0 },
  survWidth = 800 - survMargin.left - survMargin.right,
  survHeight = 80 - survMargin.top - survMargin.bottom;

let survsvg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
let x: d3.ScaleLinear<number, number, never>;
let y: d3.ScaleLinear<number, number, never>;

export const svgInitSurvivalGraph = () => {
  x = d3.scaleLinear().domain([0, params.maxGenerations]).range([0, survWidth]);
  y = d3.scaleLinear().domain([0, params.population]).range([survHeight, 0]);

  survsvg = d3
    .select('#survival')
    .append('svg')
    .attr('width', survWidth + survMargin.left + survMargin.right)
    .attr('height', survHeight + survMargin.top + survMargin.bottom)
    .append('g')
    .attr('transform', `translate(${survMargin.left},${survMargin.top})`);

  survsvg
    .append('g')
    .attr('transform', `translate(0,${survHeight})`)
    .attr('id', 'xaxis')
    .call(d3.axisBottom(x));

  // Add Y axis
  survsvg.append('g').attr('id', 'yaxis').call(d3.axisLeft(y));

  // Add the line
  survsvg
    .append('g')
    .attr('id', 'survCount')
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5);
};

export const svgDrawSurvivalGraph = (peeps: Peeps) => {
  const line = d3
    .line<number>()
    .x((d, i) => x(i))
    .y((d) => y(d));

  survsvg
    .select('#survCount')
    .select('path')
    .datum(peeps.survivorCounts)
    .attr('d', line);
  // .attr('id', d => d)
};
