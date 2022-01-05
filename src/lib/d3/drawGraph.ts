import * as d3 from 'd3';

export interface GraphDefinition {
  id: string;
  maxX: number;
  maxY: number;
  width?: number;
  height?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
}

export interface Graph {
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
  x: d3.ScaleLinear<number, number, never>;
  y: d3.ScaleLinear<number, number, never>;
  line: d3.Line<number>;
  area: d3.Line<number>;
}

export const svgInitGraph = (graphDefinition: GraphDefinition) => {
  const options = Object.assign(
    {
      width: 600,
      height: 80,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    graphDefinition
  );
  options.width = options.width - options.marginLeft - options.marginRight;
  options.height = options.height - options.marginTop - options.marginBottom;

  const x = d3
    .scaleLinear()
    .domain([0, options.maxX])
    .range([0, options.width]);
  const y = d3
    .scaleLinear()
    .domain([0, options.maxY])
    .range([options.height, 0]);

  const svg = d3
    .select(`#${options.id}`)
    .append('svg')
    .attr('width', options.width + options.marginLeft + options.marginRight)
    .attr('height', options.height + options.marginTop + options.marginBottom)
    .append('g')
    .attr('transform', `translate(${options.marginLeft},${options.marginTop})`);

  const line = d3
    .line<number>()
    .x((d, i) => x(i))
    .y((d) => y(d));

  const area = d3
    .area<number>()
    .x((d, i) => x(i))
    .y1((d) => y(d))
    .y0(options.height);

  svg.append('defs');
  svg.call(createGradient);
  svg.call(createGlowFilter);

  svg
    .append('g')
    .attr('transform', `translate(0,${options.height})`)
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

  svg.append('g').attr('id', 'events');

  return {
    svg,
    x,
    y,
    line,
    area,
  };
};

export interface GraphEvent {
  xVal: number;
  color: string;
}

export const svgDrawGraph = (
  graph: Graph,
  data: number[],
  events?: GraphEvent[]
) => {
  graph.svg.select('#line').select('path').datum(data).attr('d', graph.line);
  graph.svg.select('#area').select('path').datum(data).attr('d', graph.area);

  if (events)
    graph.svg
      .select('#events')
      .selectAll('line')
      .data(events)
      .join('line')
      .attr('x1', (d) => graph.x(d.xVal))
      .attr('y1', graph.y(0))
      .attr('x2', (d) => graph.x(d.xVal))
      .attr('y2', graph.y(graph.y.domain()[1] * 0.25))
      .attr('stroke', (d) => d.color);
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
