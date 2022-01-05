<template>
  <q-page padding>
    <div class="row q-gutter-xl justify-center">
      <div class="col-auto">
        <div class="column q-gutter-lg">
          <div class="col-auto">
            <div id="grid"></div>
          </div>
          <div class="col">
            <q-card>
              <q-card-section>
                <div class="column q-gutter-md">
                  <div class="row q-gutter-sm items-center">
                    <span style="width:70px; text-align:right">SimStep</span>
                    <q-btn
                      icon="skip_next"
                      round
                      color="primary"
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
                      color="primary"
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
                      color="secondary"
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
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      <div class="col-auto">
        <div class="column q-gutter-lg">
          <q-card>
            <q-card-section>Neural Network for {{ selectedIndividualIndex }}</q-card-section>
            <q-separator></q-separator>
            <q-card-section>
              <div id="nnet"></div>
            </q-card-section>
          </q-card>
          <q-card>
            <q-card-section>Generation {{ generation }}</q-card-section>
            <q-separator></q-separator>
            <q-card-section>
              <div class="row">
                <span class="col">Survivor Count</span>
                <span class="col text-right">{{ survivorCount }}</span>
              </div>
              <div id="survival"></div>
            </q-card-section>
            <q-card-section>
              <div class="row">
                <span class="col">Genetic Diversity</span>
                <span class="col text-right">{{ Math.round(diversityScore * 100) }}</span>
              </div>
              <div id="diversity"></div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">

import { ref, onMounted } from 'vue';
import { InitState, SimState } from 'src/lib/models';
import { params } from 'src/lib/params'
import { simWorker } from 'src/lib/worker';
import { svgInitGrid, svgDrawBarriers, svgDrawGrid, svgDrawSignals } from 'src/lib/d3/drawGrid'
import { svgDrawPeeps, svgNewPeeps, svgInitPeeps } from 'src/lib/d3/drawPeeps';
import { svgInitNeuralNet } from 'src/lib/d3/drawNeuralNet';
import { Graph, svgDrawGraph, svgInitGraph } from 'src/lib/d3/drawGraph'

const simStep = ref(0);
const generation = ref(0);
const survivorCount = ref(0);
const diversityScore = ref(0);
const selectedIndividualIndex = ref(-1);

let survivalGraph: Graph;
let diversityGraph: Graph;

simWorker.onmessage = (msg: MessageEvent) => {
  // console.log('Index.vue simWorker.onmessage', msg.data)
  const e = msg.data as { msg: string; payload: unknown };
  let simState: SimState;
  switch (e.msg) {
    case 'endInit':
      const initState = e.payload as InitState;
      simStep.value = 0;
      generation.value = 0;
      survivorCount.value = 0;
      diversityScore.value = 0;
      svgDrawGrid(initState.grid);
      svgDrawBarriers(initState.grid);
      svgNewPeeps();
      svgDrawPeeps(initState.peeps, 0);
      svgDrawGraph(survivalGraph, []);
      svgDrawGraph(diversityGraph, []);
      break;
    case 'endStep':
      simState = e.payload as SimState;
      simStep.value = simState.simStep;
      generation.value = simState.generation;
      svgDrawSignals(simState.signals);
      svgDrawPeeps(simState.peeps, simState.simStep);
      break;
    case 'newBarrier':
      simState = e.payload as SimState;
      console.log(simState.grid)
      svgDrawBarriers(simState.grid);
      break;
    case 'endGeneration':
      simState = e.payload as SimState;
      simStep.value = simState.simStep;
      generation.value = simState.generation;
      survivorCount.value = simState.peeps.survivorCounts[simState.peeps.survivorCounts.length - 1];
      diversityScore.value = simState.peeps.diversityScores[simState.peeps.diversityScores.length - 1];
      svgNewPeeps();
      svgDrawPeeps(simState.peeps, simState.simStep);
      svgDrawGraph(survivalGraph, simState.peeps.survivorCounts);
      const mutationColor = (mutation: string) => {
        switch (mutation) {
          case 'point': return 'green';
          case 'insertion': return 'blue';
          case 'deletion': return 'red'
        }
        return 'black'
      }
      svgDrawGraph(diversityGraph, simState.peeps.diversityScores, simState.peeps.mutations.map(m => ({
        xVal: m.generation,
        yVal: m.num,
        color: mutationColor(m.mutation)
      })));
      break;
    default:
      console.log('received unknown message: ', e.msg)
      throw new Error();
  }
}

onMounted(() => {
  // one time setup of d3 svgs
  svgInitGrid();
  svgInitPeeps((index) => selectedIndividualIndex.value = index);
  survivalGraph = svgInitGraph({ id: 'survival', maxX: params.maxGenerations, maxY: params.population * 1.1 });
  diversityGraph = svgInitGraph({ id: 'diversity', maxX: params.maxGenerations, maxY: 1.1 });
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