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
      <div class="col">{{ selectedIndividual.index }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import * as d3 from 'd3';
import { SimState } from 'src/lib/models';
import { params } from 'src/lib/params'
import { simWorker } from 'src/lib/worker';
import { Individual } from 'src/lib/individual';

let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;

const simStep = ref(0);
const generation = ref(0);
const selectedIndividual = ref({});

simWorker.onmessage = (msg: MessageEvent) => {
  console.log('Index.vue simWorker.onmessage', msg.data)
  const e = msg.data as { msg: string; payload: unknown };
  switch (e.msg) {
    case 'simState':
      const simState = e.payload as SimState;
      simStep.value = simState.simStep;
      generation.value = simState.generation;
      drawGrid(simState);
      break;
    default:
      throw new Error();
  }
}

onMounted(() => {
  svg = d3.select('#grid')
    .append('svg')
    .attr('width', 500)
    .attr('height', 500);
  simWorker.postMessage({ msg: 'setParam', payload: { param: 'stepsPerGeneration', value: 15 } })
  simWorker.postMessage({ msg: 'init' })
})

// prettier-ignore
const drawGrid = (sim: SimState) => {
  const row = svg.selectAll('g')
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

  const cell = svg.selectAll('circle')
    .data(sim.peeps.individuals)
    .join(
      enter => enter
        .append('circle')
        .attr('r', 3)
        .attr('fill', 'blue')
        .on('click', function (e, d) {
          svg.select('.selected').classed('selected', false).attr('r', 3);
          d3.select(this).classed('selected', true).attr('r', 5);
          selectedIndividual.value = d;
        })
      // .on('mouseout', function (d) { d3.select(this).attr('r', 3); selectedIndividual.value = {} })
    )
    .attr('cx', (d, i) => (d.loc.x) * 11 + 5)
    .attr('cy', (d, i) => (d.loc.y) * 11 + 5)
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