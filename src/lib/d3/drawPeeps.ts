import { Peeps } from '../peeps';
import * as d3 from 'd3';
import { cellSize } from './drawGrid';
import { Individual } from '../individual';
import { Coord, Dir } from '../coord';
import { svgDrawNeuralNet } from './drawNeuralNet';

let latchSelected = false;
export let selectedIndividualIndex = -1;
let selectedIndividualChangeCallback: (selectedIndex: number) => void;

export const svgInitPeeps = (callback: (selectedIndex: number) => void) => {
  selectedIndividualChangeCallback = callback;
};

const setSelectedIndex = (index: number) => {
  selectedIndividualIndex = index;
  selectedIndividualChangeCallback(index);
};

export const svgNewPeeps = () => {
  latchSelected = false;
  setSelectedIndex(-1);
  unsetSelected();
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const svgDrawPeeps = (peeps: Peeps, simStep: number) => {
  const offset = (cellSize - 1) / 2;
  const radius = offset * 0.8;

  const peepColor = (indiv: Individual) => {
    if (!indiv.alive) return '#795548';
    if (indiv.survivalScore == 0) return indiv.color;
    return d3.interpolateHsl('orange', 'red')(indiv.survivalScore);
  };

  d3.select('#peeps')
    .selectAll('.small')
    .data(peeps.individuals)
    .join('circle')
    .attr('class', 'small')
    .attr('r', radius)
    .attr('cx', (d) => d.loc.x * cellSize + offset)
    .attr('cy', (d) => d.loc.y * cellSize + offset)
    .attr('fill', (d) => peepColor(d));

  d3.select('#peeps')
    .selectAll('.large')
    .data(peeps.individuals)
    .join('circle')
    .attr('class', 'large')
    .attr('r', radius * 2)
    .attr('cx', (d) => d.loc.x * cellSize + offset)
    .attr('cy', (d) => d.loc.y * cellSize + offset)
    .attr('fill', 'transparent')
    .attr('stroke-width', 3)
    .attr('stroke', (d, i) =>
      i == selectedIndividualIndex ? 'green' : 'transparent'
    )
    .classed('selected', (d) => selectedIndividualIndex == d.index)
    .on('mouseover', function (e, d) {
      if (!latchSelected) setSelected(this as SVGCircleElement, d);
    })
    .on('click', function (e, d) {
      if (latchSelected == true && selectedIndividualIndex == d.index) {
        // already selected and latched so unlatch and unselect
        latchSelected = false;
        unsetSelected();
        setSelectedIndex(-1);
      } else latchSelected = !latchSelected;
    });
  // .on('mouseout', function (d) { d3.select(this).attr('r', 3); selectedIndividualIndex = {} })

  if (selectedIndividualIndex != -1)
    drawSelected(peeps.individuals[selectedIndividualIndex]);
};

const unsetSelected = () => {
  d3.select('#peeps')
    .select('.selected')
    .classed('selected', false)
    .attr('stroke', 'transparent');
  d3.select('#dir').selectAll('line').remove();
};

const setSelected = (el: SVGCircleElement, indiv: Individual) => {
  unsetSelected();
  d3.select(el).classed('selected', true).attr('stroke', 'green'); // highlight new
  setSelectedIndex(indiv.index);
  drawSelected(indiv);
  svgDrawNeuralNet(indiv);
};

const drawSelected = (indiv: Individual) => {
  if (selectedIndividualIndex == -1) return;
  const selectedCircle = d3.select('.selected');
  const cx = parseInt(selectedCircle.attr('cx'));
  const cy = parseInt(selectedCircle.attr('cy'));

  const dir = new Dir(indiv.lastMoveDir.dir9);

  d3.select('#dir').selectAll('line').remove();

  d3.select('#dir')
    .append('line')
    .attr('x1', cx)
    .attr('y1', cy)
    .attr('x2', cx + dir.asNormalizedCoord().x * 20)
    .attr('y2', cy + dir.asNormalizedCoord().y * 20)
    .attr('marker-end', 'url(#arrow)')
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

  const offset = (cellSize - 1) / 2;
  const trail = d3
    .line<Coord>()
    .x((d) => d.x * cellSize + offset)
    .y((d) => d.y * cellSize + offset);

  d3.select('#trail').select('path').attr('d', null);

  d3.select('#trail')
    .select('path')
    .datum(indiv.pastLocations)
    .attr('d', trail)
    .attr('stroke', (d, i) => `rgb(${i * 5},0,0)`)
    .attr('stroke-width', 2);
};
