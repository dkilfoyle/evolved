import * as d3 from 'd3';
import { Individual } from '../individual';
import { Actions, Nodes, Sensors } from '../models';
import { Synapse } from '../synapse';

let nnetsvg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;

const nnetMargin = { top: 0, right: 0, bottom: 0, left: 0 },
  nnetWidth = 600 - nnetMargin.left - nnetMargin.right,
  nnetHeight = 600 - nnetMargin.top - nnetMargin.bottom;

const sensorXLoc = 180;
const actionXLoc = 400;

const getNames = (e: string[]) => e.filter((s) => isNaN(Number(s)));
const sensorNames = getNames(Object.keys(Sensors));
const actionNames = getNames(Object.keys(Actions));

const sensorY = d3
  .scaleLinear()
  .domain([0, sensorNames.length - 1])
  .range([20, nnetHeight - 20]);
const actionY = d3
  .scaleLinear()
  .domain([0, actionNames.length - 1])
  .range([20, nnetHeight - 20]);

export const svgInitNeuralNet = () => {
  nnetsvg = d3
    .select('#nnet')
    .append('svg')
    .attr('width', nnetWidth + nnetMargin.left + nnetMargin.right)
    .attr('height', nnetHeight + nnetMargin.top + nnetMargin.bottom)
    .append('g')
    .attr('transform', `translate(${nnetMargin.left},${nnetMargin.top})`)
    .call((g) => g.append('g').attr('id', 'connections'))
    .call((g) => g.append('g').attr('id', 'sensors'))
    .call((g) => g.append('g').attr('id', 'neurons'))
    .call((g) => g.append('g').attr('id', 'actions'));

  nnetsvg
    .select('#sensors')
    .selectAll('circle')
    .data(sensorNames)
    .join('circle')
    .attr('cx', 180)
    .attr('cy', (d, i) => sensorY(i))
    .attr('r', 8);

  nnetsvg
    .select('#sensors')
    .selectAll('text')
    .data(sensorNames)
    .join('text')
    .attr('x', sensorXLoc - 20)
    .attr('y', (d, i) => sensorY(i))
    .text((d) => d)
    .style('text-anchor', 'end')
    .style('alignment-baseline', 'middle');

  nnetsvg
    .select('#actions')
    .selectAll('circle')
    .data(actionNames)
    .join('circle')
    .attr('cx', actionXLoc)
    .attr('cy', (d, i) => actionY(i))
    .attr('r', 8);

  nnetsvg
    .select('#actions')
    .selectAll('text')
    .data(actionNames)
    .join('text')
    .attr('x', actionXLoc + 20)
    .attr('y', (d, i) => actionY(i))
    .text((d) => d)
    .style('text-anchor', 'start')
    .style('alignment-baseline', 'middle');
};

export const svgDrawNeuralNet = (indiv: Individual) => {
  const neuronY = d3
    .scaleLinear()
    .domain([0, indiv.nnet.neurons.length - 1])
    .range([60, nnetHeight - 60]);
  const neuronX = d3
    .scaleLinear()
    .domain([0, indiv.nnet.neurons.length - 1])
    .range([290 - 50, 290 + 50]);
  const actionColor = d3
    .scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([4, -4]);
  const sensorColor = d3
    .scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([1, 0]);

  nnetsvg
    .select('#sensors')
    .selectAll('circle')
    .data(sensorNames)
    .join('circle')
    .attr('fill', (d, i) =>
      indiv.nnet.senses[i]
        ? sensorColor(indiv.nnet.senses[i] || 0)
        : 'lightgrey'
    )
    .attr('stroke', (d, i) => (indiv.nnet.senses[i] ? 'black' : 'lightgrey'));

  nnetsvg
    .select('#sensors')
    .selectAll('text')
    .data(sensorNames)
    .join('text')
    .attr('fill', (d, i) => (indiv.nnet.senses[i] ? 'black' : 'lightgrey'));

  nnetsvg
    .select('#neurons')
    .selectAll('circle')
    .data(indiv.nnet.neurons)
    .join('circle')
    .attr('cx', (d, i) => neuronX(i))
    .attr('cy', (d, i) => neuronY(i))
    .attr('r', 8)
    .attr('fill', (d) => sensorColor(d.output))
    .attr('stroke', 'black');

  nnetsvg
    .select('#actions')
    .selectAll('circle')
    .data(actionNames)
    .join('circle')
    .attr('fill', (d, i) =>
      indiv.nnet.actions[i]
        ? actionColor(indiv.nnet.actions[i] || 0)
        : 'lightgrey'
    )
    .attr('stroke', (d, i) => (indiv.nnet.actions[i] ? 'black' : 'lightgrey'));

  nnetsvg
    .select('#actions')
    .selectAll('text')
    .data(actionNames)
    .join('text')
    .attr('fill', (d, i) => (indiv.nnet.actions[i] ? 'black' : 'lightgrey'));

  const neuron2action = d3
    .linkHorizontal<Synapse, [number, number]>()
    .source((d) => {
      return d.sourceType == Nodes.SENSOR
        ? [sensorXLoc, sensorY(d.sourceIndex)]
        : [neuronX(d.sourceIndex), neuronY(d.sourceIndex)];
    })
    .target((d) => {
      return d.sinkType == Nodes.NEURON
        ? [neuronX(d.sinkIndex), neuronY(d.sinkIndex)]
        : [actionXLoc, actionY(d.sinkIndex)];
    });

  nnetsvg
    .select('#connections')
    .selectAll('path')
    .data(indiv.nnet.connections, (d, i) => i)
    .join('path')
    .attr('d', neuron2action)
    .attr('fill', 'none')
    .attr('stroke', 'black');
};
