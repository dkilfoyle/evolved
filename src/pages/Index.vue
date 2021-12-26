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
              <div class="row">
                <div class="col">Survivors: {{ survivors }}</div>
                <div class="col">Survival Score: {{ survivalScore }}</div>
              </div>
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
import { ref, onMounted, watch, computed, reactive } from 'vue';
import * as d3 from 'd3';
import { Actions, Nodes, Sensors, SimState } from 'src/lib/models';
import { params } from 'src/lib/params'
import { simWorker } from 'src/lib/worker';
import { Individual } from 'src/lib/individual';
import { Neuron } from 'src/lib/neuron';
import { Synapse } from 'src/lib/synapse';
import { cursorTo } from 'readline';

let gridsvg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
let nnetsvg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

const simStep = ref(0);
const generation = ref(0);
const selectedIndividual = ref(-1);
const survivalScore = ref(0);
const survivors = ref(0);

simWorker.onmessage = (msg: MessageEvent) => {
  console.log('Index.vue simWorker.onmessage', msg.data)
  const e = msg.data as { msg: string; payload: unknown };
  switch (e.msg) {
    case 'simState':
      const simState = e.payload as SimState;
      simStep.value = simState.simStep;
      generation.value = simState.generation;
      survivalScore.value = simState.peeps.individuals.reduce((accum, cur) => accum += cur.survivalScore, 0);
      survivors.value = simState.peeps.individuals.reduce((accum, cur) => accum += cur.survivalScore > 0 ? 1 : 0, 0);
      drawGrid(simState);
      drawPeeps(simState);
      if (selectedIndividual.value != -1) {
        drawSelected();
        updateNnet(simState.peeps.individuals[selectedIndividual.value], simState)
      }
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

onMounted(() => {
  gridsvg = d3.select('#grid')
    .append('svg')
    .attr('width', gridWidth + gridMargin.left + gridMargin.right)
    .attr('height', gridHeight + gridMargin.top + gridMargin.bottom)
    .append('g')
    .attr('transform', `translate(${gridMargin.left},${gridMargin.top})`);

  d3.select('#grid').select('svg').append('defs').append('marker')
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

  gridsvg.append('g').attr('id', 'floor')
  gridsvg.append('g').attr('id', 'peeps')
  gridsvg.append('g').attr('id', 'dir')

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

  simWorker.postMessage({ msg: 'init' })
})

// prettier-ignore
const drawGrid = (sim: SimState) => {
  const row = gridsvg.select('#floor').selectAll('g')
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
}

const drawPeeps = (sim: SimState) => {
  const cell = gridsvg.select('#peeps').selectAll('circle')
    .data(sim.peeps.individuals)
    .join(
      enter => enter
        .append('circle')
        .attr('r', 3)
        .attr('fill', 'blue')
        .on('click', function (e, d) {
          gridsvg.select('.selected').classed('selected', false).attr('r', 3); // unselect last
          d3.select(this).classed('selected', true).attr('r', 5) // highlight new
          selectedIndividual.value = d.index;
          drawSelected();
          updateNnet(d, sim);
        })

      // .on('mouseout', function (d) { d3.select(this).attr('r', 3); selectedIndividual.value = {} })
    )
    .attr('cx', (d, i) => (d.loc.x) * 11 + 5)
    .attr('cy', (d, i) => (d.loc.y) * 11 + 5)
    .attr('fill', (d, i) => i == selectedIndividual.value ? 'red' : 'blue')
    .attr('r', (d, i) => i == selectedIndividual.value ? 3 : 5)

  if (sim.simStep == params.stepsPerGeneration - 1) {
    gridsvg.select('#peeps').selectAll('circle')
      .data(sim.peeps.individuals)
      .attr('fill', d => d.survivalScore > 0 ? 'green' : 'blue')
  }

}

const drawSelected = () => {
  if (selectedIndividual.value == -1) return;
  const selectedCircle = d3.select('.selected');
  const cx = parseInt(selectedCircle.attr('cx'))
  const cy = parseInt(selectedCircle.attr('cy'))

  d3.select('#dir').selectAll('line').data([null]).join('line')
    .attr('x1', cx)
    .attr('y1', cy)
    .attr('x2', cx + 40)
    .attr('y2', cy + 40)
    .attr('marker-end', 'url(#arrow)')
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
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

const updateNnet = (indiv: Individual, sim: SimState) => {
  const neuronNames = Object.keys(indiv.nnet.neurons)
  const neuronY = d3.scaleLinear().domain([0, indiv.nnet.neurons.length - 1]).range([20, nnetHeight - 20])
  const neuronX = d3.scaleLinear().domain([0, indiv.nnet.neurons.length - 1]).range([270 - 50, 270 + 50])
  var actionColor = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([-4, 4])
  var sensorColor = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([0, 1])

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