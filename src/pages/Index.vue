<template>
  <q-page padding>
    <div class="row q-gutter-md">
      <div class="col-auto">
        <div class="column q-gutter-md">
          <div class="col-auto">
            <div id="grid"></div>
          </div>
          <div class="col-auto">
            <div id="survival"></div>
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
                <q-linear-progress
                  :value="simStep / params.stepsPerGeneration"
                  class="col"
                  size="25px"
                  instant-feedback
                >
                  <div class="absolute-full flex flex-center">
                    <q-badge color="white" text-color="black" :label="simStep"></q-badge>
                  </div>
                </q-linear-progress>
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
                <q-linear-progress
                  :value="generation / params.maxGenerations"
                  class="col"
                  size="25px"
                  instant-feedback
                >
                  <div class="absolute-full flex flex-center">
                    <q-badge color="white" text-color="black" :label="generation"></q-badge>
                  </div>
                </q-linear-progress>
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
        <div class="row">
          <span>birthLoc: {{ selindiv.birthLoc.x }}, {{ selindiv.birthLoc.y }}</span>
          <span>loc: {{ selindiv.loc.x }}, {{ selindiv.loc.y }}</span>
        </div>
        <div id="nnet"></div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import * as d3 from 'd3';
import { Actions, InitState, Nodes, Sensors, SimState } from 'src/lib/models';
import { params } from 'src/lib/params'
import { simWorker } from 'src/lib/worker';
import { Individual } from 'src/lib/individual';
import { Synapse } from 'src/lib/synapse';
import { Coord, Dir } from 'src/lib/coord'
import { Grid } from 'src/lib/grid';
import { Peeps } from 'src/lib/peeps';

let gridsvg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
let nnetsvg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
let survsvg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;

const simStep = ref(0);
const generation = ref(0);
const selectedIndividual = ref(-1);
let latchSelected = false;
const survivalScores = ref(new Array<number>());
const survivors = ref(new Array<number>());
const selindiv = reactive({
  birthLoc: new Coord(0, 0),
  loc: new Coord(0, 0),
})

const paramsRef = reactive(params as Record<string, number | boolean>);

simWorker.onmessage = (msg: MessageEvent) => {
  // console.log('Index.vue simWorker.onmessage', msg.data)
  const e = msg.data as { msg: string; payload: unknown };
  let simState: SimState;
  switch (e.msg) {
    case 'endInit':
      const initState = e.payload as InitState;
      simStep.value = 0;
      generation.value = 0;
      survivors.value = [];
      survivalScores.value = [];
      drawGrid(initState.grid);
      drawPeeps(initState.peeps, 0);
      drawSurvivalGraph();
      break;
    case 'endStep':
      simState = e.payload as SimState;
      simStep.value = simState.simStep;
      generation.value = simState.generation;
      drawPeeps(simState.peeps, simState.simStep);
      if (selectedIndividual.value != -1) {
        drawSelected(simState.peeps.individuals[selectedIndividual.value]);
        updateNnet(simState.peeps.individuals[selectedIndividual.value]);
      }
      break;
    case 'endGeneration':
      simState = e.payload as SimState;
      simStep.value = simState.simStep;
      generation.value = simState.generation;
      drawPeeps(simState.peeps, simState.simStep);
      survivalScores.value.push(simState.peeps.survivorsScore);
      survivors.value.push(simState.peeps.survivorCount);
      console.log('endofgeneration', simState.peeps.individuals)
      drawSurvivalGraph();
      break;
    default:
      console.log('received unknown message: ', e.msg)
      throw new Error();
  }
}

const gridMargin = { top: 0, right: 0, bottom: 0, left: 0 },
  gridWidth = 800 - gridMargin.left - gridMargin.right,
  gridHeight = 800 - gridMargin.top - gridMargin.bottom;

const survMargin = { top: 0, right: 0, bottom: 0, left: 0 },
  survWidth = 800 - survMargin.left - survMargin.right,
  survHeight = 80 - survMargin.top - survMargin.bottom;

const nnetMargin = { top: 0, right: 0, bottom: 0, left: 0 },
  nnetWidth = 500 - nnetMargin.left - nnetMargin.right,
  nnetHeight = 500 - nnetMargin.top - nnetMargin.bottom;

const survX = computed(() => {
  return d3.scaleLinear().domain([0, paramsRef['maxGenerations'] as number]).range([0, survWidth]);
})

const survY = computed(() => {
  // return d3.scaleLinear().domain([0, Math.max(...survivors.value)]).range([0, survWidth]);
  return d3.scaleLinear().domain([0, paramsRef['population'] as number]).range([survHeight, 0]);
})

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

  survsvg = d3.select('#survival').append('svg')
    .attr('width', survWidth + survMargin.left + survMargin.right)
    .attr('height', survHeight + survMargin.top + survMargin.bottom)
    .append('g')
    .attr('transform', `translate(${survMargin.left},${survMargin.top})`);

  // Add X axis --> it is a date format
  survsvg.append('g')
    .attr('transform', `translate(0,${survHeight})`)
    .attr('id', 'xaxis')
    .call(d3.axisBottom(survX.value));

  // Add Y axis
  survsvg.append('g')
    .attr('id', 'yaxis')
    .call(d3.axisLeft(survY.value));

  // Add the line
  survsvg.append('g').attr('id', 'survCount').append('path')

  nnetsvg = d3.select('#nnet')
    .append('svg')
    .attr('width', nnetWidth + nnetMargin.left + nnetMargin.right)
    .attr('height', nnetHeight + nnetMargin.top + nnetMargin.bottom)
    .append('g')
    .attr('transform', `translate(${nnetMargin.left},${nnetMargin.top})`)
    .call(g => g.append('g').attr('id', 'connections'))
    .call(g => g.append('g').attr('id', 'sensors'))
    .call(g => g.append('g').attr('id', 'neurons'))
    .call(g => g.append('g').attr('id', 'actions'))

  drawNnet();
  simWorker.postMessage({ msg: 'init' })
})

// prettier-ignore
const drawGrid = (grid: Grid) => {
  const row = gridsvg.select('#floor').selectAll('g')
    .data(grid.data)
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


const drawPeeps = (peeps: Peeps, simStep: number) => {

  // gridsvg.select('#floor').selectAll('g')
  //   .data(sim.grid.data)
  //   .join('g')
  //   .selectAll('rect')
  //   .data((d) => { return d })
  //   .join('rect')
  //   .attr('fill', (d) => d > 0 ? 'cyan' : 'lightgrey')

  gridsvg.select('#peeps').selectAll('circle')
    .data(peeps.individuals)
    .join(
      enter => enter
        .append('circle')
        .attr('r', 3)
        .attr('fill', 'blue')
        .on('mouseover', function (e, d) {
          if (!latchSelected) setSelected(this, d)
        })
        .on('click', function (e, d) {
          if (latchSelected == true && selectedIndividual.value == d.index) {
            // already selected and latched so unlatch and unselect
            latchSelected = false;
            unsetSelected();
          } else
            latchSelected = !latchSelected
          // if (selectedIndividual.value == d.index) {
          //   latchSelected.value = false;
          //   selectedIndividual.value = -1;
          //   unsetSelected();
          // } else {
          //   latchSelected.value = true;
          //   selectedIndividual.value = d.index
          //   setSelected(this, d, sim)
          // }
        })

      // .on('mouseout', function (d) { d3.select(this).attr('r', 3); selectedIndividual.value = {} })
    )
    .attr('cx', (d) => (d.loc.x) * 11 + 5)
    .attr('cy', (d) => (d.loc.y) * 11 + 5)
    .attr('fill', (d, i) => i == selectedIndividual.value ? 'red' : 'blue')
    .attr('r', (d, i) => i == selectedIndividual.value ? 5 : 3)

  if (simStep == params.stepsPerGeneration) {
    gridsvg.select('#peeps').selectAll('circle')
      .data(peeps.individuals)
      .attr('fill', d => d.survivalScore > 0 ? 'green' : 'blue')
  }

}

const unsetSelected = () => {
  gridsvg.select('.selected').classed('selected', false).attr('r', 3); // unselect last
  d3.select('#dir').selectAll('line').remove()
}

const setSelected = (el: SVGCircleElement, indiv: Individual) => {
  unsetSelected();
  d3.select(el).classed('selected', true).attr('r', 5) // highlight new
  selectedIndividual.value = indiv.index;
  drawSelected(indiv)
  updateNnet(indiv);
}

const drawSelected = (indiv: Individual) => {
  selindiv.birthLoc = indiv.birthLoc;
  selindiv.loc = indiv.loc;
  if (selectedIndividual.value == -1) return;
  const selectedCircle = d3.select('.selected');
  const cx = parseInt(selectedCircle.attr('cx'))
  const cy = parseInt(selectedCircle.attr('cy'))

  const dir = new Dir(indiv.lastMoveDir.dir9);

  d3.select('#dir').selectAll('line').data([null]).join('line')
    .attr('x1', cx)
    .attr('y1', cy)
    .attr('x2', cx + dir.asNormalizedCoord().x * 20)
    .attr('y2', cy + dir.asNormalizedCoord().y * 20)
    .attr('marker-end', 'url(#arrow)')
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
}

const drawSurvivalGraph = () => {
  const line = d3.line<number>()
    .x((d, i) => survX.value(i))
    .y(d => survY.value(d))

  survsvg.select('#survCount').select('path')
    .datum(survivors.value)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', line)
  // .attr('id', d => d)
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

  nnetsvg.select('#actions').selectAll('circle')
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

const updateNnet = (indiv: Individual) => {
  const neuronY = d3.scaleLinear().domain([0, indiv.nnet.neurons.length - 1]).range([20, nnetHeight - 20])
  const neuronX = d3.scaleLinear().domain([0, indiv.nnet.neurons.length - 1]).range([270 - 50, 270 + 50])
  var actionColor = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([4, -4])
  var sensorColor = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([1, 0])

  nnetsvg.select('#sensors').selectAll('circle')
    .data(sensorNames)
    .join('circle')
    .attr('fill', (d, i) => indiv.nnet.senses[i] ? sensorColor(indiv.nnet.senses[i] || 0) : 'lightgrey')
    .attr('stroke', (d, i) => indiv.nnet.senses[i] ? 'black' : 'lightgrey')

  nnetsvg.select('#sensors').selectAll('text')
    .data(sensorNames)
    .join('text')
    .attr('fill', (d, i) => indiv.nnet.senses[i] ? 'black' : 'lightgrey')

  nnetsvg.select('#neurons').selectAll('circle')
    .data(indiv.nnet.neurons)
    .join('circle')
    .attr('cx', (d, i) => neuronX(i))
    .attr('cy', (d, i) => neuronY(i))
    .attr('r', 4)
    .attr('fill', d => sensorColor(d.output))
    .attr('stroke', 'black')

  nnetsvg.select('#actions').selectAll('circle')
    .data(actionNames)
    .join('circle')
    .attr('fill', (d, i) => indiv.nnet.actions[i] ? actionColor(indiv.nnet.actions[i] || 0) : 'lightgrey')
    .attr('stroke', (d, i) => indiv.nnet.actions[i] ? 'black' : 'lightgrey')

  nnetsvg.select('#actions').selectAll('text')
    .data(actionNames)
    .join('text')
    .attr('fill', (d, i) => indiv.nnet.actions[i] ? 'black' : 'lightgrey')

  const neuron2action = d3.linkHorizontal<Synapse, [number, number]>().source(d => {
    return d.sourceType == Nodes.SENSOR ? [170, sensorY(d.sourceIndex)] : [neuronX(d.sourceIndex), neuronY(d.sourceIndex)]
  }).target(d => {
    return d.sinkType == Nodes.NEURON ? [neuronX(d.sinkIndex), neuronY(d.sinkIndex)] : [370, actionY(d.sinkIndex)]
  })

  nnetsvg.select('#connections').selectAll('path')
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