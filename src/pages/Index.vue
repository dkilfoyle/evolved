<template>
  <q-page padding>
    <div class="row q-gutter-md">
      <div class="col-auto">
        <div class="column q-gutter-md">
          <div class="col-auto">
            <div id="grid"></div>
          </div>
          <div class="col">
            <div class="column q-gutter-sm q-mt-md">
              <div class="row q-gutter-sm items-center">
                <span style="width:70px; text-align:right">SimStep</span>
                <q-btn
                  icon="skip_next"
                  round
                  color="secondary"
                  size="sm"
                  @click="simWorker.postMessage({ msg: 'stepSim' })"
                ></q-btn>
                <q-slider
                  v-model="simStep"
                  :max="params.stepsPerGeneration"
                  label-always
                  class="col q-mx-lg"
                ></q-slider>
                <q-btn
                  icon="fast_forward"
                  round
                  color="secondary"
                  size="sm"
                  @click="simWorker.postMessage({ msg: 'runSim' })"
                ></q-btn>
              </div>
              <div class="row q-gutter-sm items-center">
                <span style="width:70px; text-align:right">Generation</span>
                <q-btn
                  icon="skip_next"
                  round
                  color="secondary"
                  size="sm"
                  @click="simWorker.postMessage({ msg: 'stepGeneration' })"
                ></q-btn>
                <q-slider
                  v-model="generation"
                  :max="params.maxGenerations"
                  label-always
                  class="col q-mx-lg"
                ></q-slider>
                <q-btn
                  icon="fast_forward"
                  round
                  color="secondary"
                  size="sm"
                  @click="simWorker.postMessage({ msg: 'runGeneration' })"
                ></q-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col">
        <div id="nnet"></div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import * as d3 from 'd3';
import { Actions, Nodes, Sensors, SimState } from 'src/lib/models';
import { params } from 'src/lib/params'
import { simWorker } from 'src/lib/worker';
import { Individual } from 'src/lib/individual';
import { Neuron } from 'src/lib/neuron';
import { Synapse } from 'src/lib/synapse';

let gridsvg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
let nnetsvg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

const simStep = ref(0);
const generation = ref(0);
const selectedIndividual = ref(-1);

simWorker.onmessage = (msg: MessageEvent) => {
  console.log('Index.vue simWorker.onmessage', msg.data)
  const e = msg.data as { msg: string; payload: unknown };
  switch (e.msg) {
    case 'simState':
      const simState = e.payload as SimState;
      simStep.value = simState.simStep;
      generation.value = simState.generation;
      drawGrid(simState);
      if (selectedIndividual.value != -1) updateNnet(simState.peeps.individuals[selectedIndividual.value], simState)
      break;
    default:
      throw new Error();
  }
}


const gridMargin = { top: 0, right: 0, bottom: 0, left: 0 },
  gridWidth = 500 - gridMargin.left - gridMargin.right,
  gridHeight = 500 - gridMargin.top - gridMargin.bottom;

const nnetMargin = { top: 0, right: 0, bottom: 0, left: 0 },
  nnetWidth = 500 - nnetMargin.left - nnetMargin.right,
  nnetHeight = 500 - nnetMargin.top - nnetMargin.bottom;

// append the svg object to the body of the page
// const svg = d3.select('#grid')
//   .append('svg')
//   .attr('width', gridWidth + gridMargin.left + gridMargin.right)
//   .attr('height', gridHeight + gridMargin.top + gridMargin.bottom)
//   .append('g')
//   .attr('transform', `translate(${gridMargin.left},${gridMargin.top})`);

onMounted(() => {
  gridsvg = d3.select('#grid')
    .append('svg')
    .attr('width', gridWidth + gridMargin.left + gridMargin.right)
    .attr('height', gridHeight + gridMargin.top + gridMargin.bottom)
    .append('g')
    .attr('transform', `translate(${gridMargin.left},${gridMargin.top})`);

  nnetsvg = d3.select('#nnet')
    .append('svg')
    .attr('width', nnetWidth + nnetMargin.left + nnetMargin.right)
    .attr('height', nnetHeight + nnetMargin.top + nnetMargin.bottom)
    .append('g')
    .attr('transform', `translate(${nnetMargin.left},${nnetMargin.top})`)
    .call(g => g.append('g').attr('id', 'sensors'))
    .call(g => g.append('g').attr('id', 'neurons'))
    .call(g => g.append('g').attr('id', 'actions'))

  drawNnet();

  simWorker.postMessage({ msg: 'setParam', payload: { param: 'stepsPerGeneration', value: 15 } })
  simWorker.postMessage({ msg: 'init' })
})

// prettier-ignore
const drawGrid = (sim: SimState) => {
  const row = gridsvg.selectAll('g')
    .data(sim.grid.data)
    .join('g')
    .attr('transform', (d, i) => { return `translate(${i * 11})` })

  const cols = row
    // each col
    .selectAll('g')
    .data((d) => { return d })

  cols
    .join(enter =>
      enter.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', 'lightgrey')
        .attr('y', (d, i) => i * 11)
    )

  const cell = gridsvg.selectAll('circle')
    .data(sim.peeps.individuals)
    .join(
      enter => enter
        .append('circle')
        .attr('r', 3)
        .attr('fill', 'blue')
        .on('click', function (e, d) {
          gridsvg.select('.selected').classed('selected', false).attr('r', 3);
          d3.select(this).classed('selected', true).attr('r', 5);
          selectedIndividual.value = d.index;
          updateNnet(d, sim);
        })
      // .on('mouseout', function (d) { d3.select(this).attr('r', 3); selectedIndividual.value = {} })
    )
    .attr('cx', (d, i) => (d.loc.x) * 11 + 5)
    .attr('cy', (d, i) => (d.loc.y) * 11 + 5)
}

const getNames = (e: string[]) => e.filter(s => isNaN(Number(s)))
const sensorNames = getNames(Object.keys(Sensors))
const actionNames = getNames(Object.keys(Actions))

const sensorY = d3.scaleLinear().domain([0, sensorNames.length - 1]).range([20, nnetHeight - 20])
const actionY = d3.scaleLinear().domain([0, actionNames.length - 1]).range([20, nnetHeight - 20])
// const actionY = d3.scalePoint().domain(actionNames).range([0, nnetHeight]).padding(0.5)

const drawNnet = () => {

  nnetsvg.select('#sensors').selectAll('circle')
    .data(sensorNames)
    .join('circle')
    .attr('cx', 170)
    .attr('cy', (d, i) => sensorY(i))
    .attr('r', 4)

  nnetsvg.select('#sensors').selectAll('text')
    .data(sensorNames)
    .join('text')
    .attr('x', 150)
    .attr('y', (d, i) => sensorY(i))
    .text(d => d)
    .style('text-anchor', 'end')
    .style('alignment-baseline', 'middle')

  const actions = nnetsvg.select('#actions').selectAll('circle')
    .data(actionNames)
    .join('circle')
    .attr('cx', 370)
    .attr('cy', (d, i) => actionY(i))
    .attr('r', 4)

  nnetsvg.select('#actions').selectAll('text')
    .data(actionNames)
    .join('text')
    .attr('x', 390)
    .attr('y', (d, i) => actionY(i))
    .text(d => d)
    .style('text-anchor', 'start')
    .style('alignment-baseline', 'middle')
}

// const actionRange = (indiv: Individual) => {
//   return [
//     indiv.nnet.actions.reduce(
//       (accum, x) => Math.max(accum || -Infinity, x || -Infinity),
//       -Infinity
//     ),
//     indiv.nnet.actions.reduce(
//       (accum, x) => Math.min(accum || Infinity, x || Infinity),
//       Infinity
//     ),
//   ];
// }

// const sensorRange = (indiv: Individual) => {
//   return [
//     indiv.nnet.senses.reduce(
//       (accum, x) => Math.max(accum || -Infinity, x || -Infinity),
//       -Infinity
//     ),
//     indiv.nnet.senses.reduce(
//       (accum, x) => Math.min(accum || Infinity, x || Infinity),
//       Infinity
//     ),
//   ];
// }

const updateNnet = (indiv: Individual, sim: SimState) => {
  const neuronNames = Object.keys(indiv.nnet.neurons)
  console.log(indiv)
  const neuronY = d3.scaleLinear().domain([0, indiv.nnet.neurons.length - 1]).range([20, nnetHeight - 20])
  const neuronX = d3.scaleLinear().domain([0, indiv.nnet.neurons.length - 1]).range([270 - 50, 270 + 50])
  const sensorColor = d3.scaleLinear<string>().domain([0, 1]).range(['blue', 'red'])
  const actionColor = d3.scaleLinear<string>().domain([-4, 4]).range(['blue', 'red'])

  nnetsvg.select('#sensors').selectAll('circle')
    .data(sensorNames)
    .join('circle')
    .attr('fill', (d, i) => indiv.nnet.senses[i] ? sensorColor(indiv.nnet.senses[i] || 0) : 'lightgrey')

  nnetsvg.select('#sensors').selectAll('text')
    .data(sensorNames)
    .join('text')
    .attr('fill', (d, i) => indiv.nnet.senses[i] ? 'black' : 'lightgrey')

  const neurons = nnetsvg.select('#neurons').selectAll('circle')
    .data(indiv.nnet.neurons)
    .join('circle')
    .attr('cx', (d, i) => neuronX(i))
    .attr('cy', (d, i) => neuronY(i))
    .attr('r', 4)
    .attr('fill', d => sensorColor(d.output))

  const actions = nnetsvg.select('#actions').selectAll('circle')
    .data(actionNames)
    .join('circle')
    .attr('fill', (d, i) => indiv.nnet.actions[i] ? actionColor(indiv.nnet.actions[i] || 0) : 'lightgrey')

  nnetsvg.select('#actions').selectAll('text')
    .data(actionNames)
    .join('text')
    .attr('fill', (d, i) => indiv.nnet.actions[i] ? 'black' : 'lightgrey')

  const neuron2action = d3.linkHorizontal<Synapse, [number, number]>().source(d => {
    return d.sourceType == Nodes.SENSOR ? [170, sensorY(d.sourceIndex)] : [neuronX(d.sourceIndex), neuronY(d.sourceIndex)]
  }).target(d => {
    return d.sinkType == Nodes.NEURON ? [neuronX(d.sinkIndex), neuronY(d.sinkIndex)] : [370, actionY(d.sinkIndex)]
  })
  console.log(indiv.nnet.connections)

  nnetsvg.selectAll('path')
    .data(indiv.nnet.connections, (d, i) => (i))
    .join('path')
    .attr('d', neuron2action)
    .attr('fill', 'none')
    .attr('stroke', 'black');
}


</script>

<style>
#grid {
  border: 1px solid black;
}

.selected {
  fill: red;
}
</style>