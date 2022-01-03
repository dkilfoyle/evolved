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
        <div id="nnet"></div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">

import { ref, onMounted } from 'vue';
import { InitState, SimState } from 'src/lib/models';
import { params } from 'src/lib/params'
import { simWorker } from 'src/lib/worker';
import { svgInitGrid, svgDrawBarriers, svgDrawGrid } from 'src/lib/d3/drawGrid'
import { svgDrawPeeps, svgNewPeeps } from 'src/lib/d3/drawPeeps';
import { svgInitNeuralNet } from 'src/lib/d3/drawNeuralNet';
import { svgDrawSurvivalGraph, svgInitSurvivalGraph } from 'src/lib/d3/drawSurvGraph';

const simStep = ref(0);
const generation = ref(0);

// const paramsRef = reactive(params as Record<string, number | boolean>);

simWorker.onmessage = (msg: MessageEvent) => {
  // console.log('Index.vue simWorker.onmessage', msg.data)
  const e = msg.data as { msg: string; payload: unknown };
  let simState: SimState;
  switch (e.msg) {
    case 'endInit':
      const initState = e.payload as InitState;
      simStep.value = 0;
      generation.value = 0;
      svgDrawGrid(initState.grid);
      svgDrawBarriers(initState.grid);
      svgNewPeeps();
      svgDrawPeeps(initState.peeps, 0);
      svgDrawSurvivalGraph(initState.peeps);
      break;
    case 'endStep':
      simState = e.payload as SimState;
      simStep.value = simState.simStep;
      generation.value = simState.generation;
      svgDrawPeeps(simState.peeps, simState.simStep);
      break;
    case 'endGeneration':
      simState = e.payload as SimState;
      simStep.value = simState.simStep;
      generation.value = simState.generation;
      svgNewPeeps();
      svgDrawPeeps(simState.peeps, simState.simStep);
      svgDrawSurvivalGraph(simState.peeps);
      break;
    default:
      console.log('received unknown message: ', e.msg)
      throw new Error();
  }
}

onMounted(() => {
  // one time setup of d3 svgs
  svgInitGrid();
  svgInitSurvivalGraph();
  svgInitNeuralNet();
  simWorker.postMessage({ msg: 'init' })
})

</script>

<style>
#grid {
  border: 1px solid black;
}

.selected {
}
</style>