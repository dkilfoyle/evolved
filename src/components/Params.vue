<template>
  <q-list bordered v-for="paramGroup in paramGroups" :key="paramGroup.group">
    <q-expansion-item
      :default-opened="paramGroup.name == 'Simulation'"
      :icon="paramGroup.icon"
      :label="paramGroup.name"
    >
      <q-item>
        <q-item-section>
          <div v-for="param in paramGroup.params" :key="param[0]">
            <q-input
              v-if="typeof paramsRef[param[0]] == 'number'"
              v-model.number="paramsRef[param[0]]"
              type="number"
              dense
            >
              <template v-slot:before>
                <div class="label">{{ param[0] }}</div>
              </template>
            </q-input>
            <div v-if="typeof paramsRef[param[0]] == 'boolean'" class="row q-py-sm">
              <div class="label">{{ param[0] }}</div>
              <q-toggle v-model="paramsRef[param[0]]" dense></q-toggle>
            </div>
          </div>
        </q-item-section>
      </q-item>
    </q-expansion-item>
  </q-list>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { params } from 'src/lib/params'
import { simWorker } from 'src/lib/worker';

// const stepsPerGeneration: WritableComputedRef<number> = computed({
//   get(): number { return params.stepsPerGeneration; },
//   set(newValue: number) { params.stepsPerGeneration = newValue; }
// })


const paramsRef = reactive(params as Record<string, number | boolean>);
const paramGroups = [
  {
    name: 'Simulation',
    icon: 'apps',
    params: [['sizeX', 'number'], ['sizeY', 'number'], ['population', 'number'], ['maxGenerations', 'number'], ['stepsPerGeneration', 'number']]
  },
  {
    name: 'Display',
    icon: 'monitor',
    params: [['displayPerSteps'], ['displayPerGenerations']]
  },
  {
    name: 'Genetics',
    icon: 'people',
    params: [
      ['genomeMaxLength'],
      ['pointMutationRate'],
      ['geneInsertionDeletionRate'],
      ['sexualReproduction'],
      ['chooseParentsByFitness']]
  },
  {
    name: 'Senses',
    icon: 'visibility',
    params: [
      ['populationSensorRadius'],
      ['signalSensorRadius'],
      ['longProbeDistance'],
      ['shortProbeBarrierDistance']]
  }
];
watch(() => ({ ...paramsRef }), (newval: Record<string, number | boolean>, oldval) => {
  Object.keys(newval).forEach(key => {
    if (newval[key] != oldval[key]) {
      simWorker.postMessage({ msg: 'setParam', payload: { param: key, value: newval[key] } })
      if (['sizeX', 'sizeY', 'population'].includes(key)) simWorker.postMessage({ msg: 'init' })
    }
  })
})


</script>

<style>
.label {
  font-size: 10px;
  width: 150px;
  color: rgba(0, 0, 0, 0.54);
}
</style>