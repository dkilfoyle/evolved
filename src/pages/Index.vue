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
                  @click="simWorker.postMessage('stepSim')"
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
                  @click="simWorker.postMessage('runSim')"
                ></q-btn>
              </div>
              <div class="row q-gutter-sm items-center">
                <span style="width:70px; text-align:right">Generation</span>
                <q-btn
                  icon="skip_next"
                  round
                  color="secondary"
                  size="sm"
                  @click="simWorker.postMessage('stepGeneration')"
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
                  @click="simWorker.postMessage('runGeneration')"
                ></q-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col">nnet here</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';
import { SimState } from 'src/lib/models';
import { params } from 'src/lib/params'

let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
const simWorker = new Worker(new URL('src/lib/simulator', import.meta.url))
const simStep = ref(0);
const generation = ref(0);

simWorker.onmessage = (msg) => {
  console.log('Index.vue simWorker.onmessage', msg)
  const simState = msg.data as SimState;
  simStep.value = simState.simStep;
  generation.value = simState.generation;
  drawGrid(simState);
}

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
      enter.append('rect').attr('width', 10).attr('height', 10).attr('fill', 'lightgrey').attr('y', (d, i) => i * 11)
    )
  cols
    .join(
      enter => enter
        .append('circle')
        .attr('r', 3)
        .attr('cx', 5)
        .attr('cy', (d, i) => (i) * 11 + 5),
      update => update.attr('fill', d => d == 0 ? 'lightgrey' : 'red')
    )
    .attr('fill', (d) => d == 0 ? 'lightgrey' : 'red')
}

onMounted(() => {
  svg = d3.select('#grid')
    .append('svg')
    .attr('width', 500)
    .attr('height', 500);
  simWorker.postMessage('init')
})
</script>

<style>
#grid {
  border: 1px solid black;
}
</style>