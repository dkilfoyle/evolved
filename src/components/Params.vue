<template>
  <q-list bordered v-for="paramGroup in paramGroups" :key="paramGroup.name">
    <q-expansion-item
      :default-opened="paramGroup.name == 'Simulation'"
      :icon="paramGroup.icon"
      :label="paramGroup.name"
      header-class="bg-blue-grey-2"
    >
      <q-item>
        <q-item-section>
          <div
            v-for="param in paramGroup.params"
            :key="typeof param == 'string' ? param : param.name"
          >
            <div v-if="typeof param == 'string'">
              <q-input
                v-if="typeof paramsRef[param] == 'number'"
                v-model.number="paramsRef[param]"
                type="number"
                dense
              >
                <template v-slot:before>
                  <div class="label">{{ param }}</div>
                </template>
              </q-input>
              <div v-if="typeof paramsRef[param] == 'boolean'" class="row q-py-sm">
                <div class="label">{{ param }}</div>
                <q-toggle v-model="paramsRef[param]" dense></q-toggle>
              </div>
            </div>
            <div v-else>
              <div v-if="param.type == 'select'" class="row items-center q-py-sm">
                <div class="label">{{ param.name }}</div>
                <q-select
                  v-model="paramsRef[param.name]"
                  :options="param.options"
                  emit-value
                  map-options
                  dense
                  class="col"
                ></q-select>
              </div>
              <div v-if="param.type == 'button'" class="row q-mt-md">
                <q-btn class="col" color="primary" @click="param.fn">{{ param.name }}</q-btn>
              </div>
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
import { Barrier, Challenge } from 'src/lib/models';

// const stepsPerGeneration: WritableComputedRef<number> = computed({
//   get(): number { return params.stepsPerGeneration; },
//   set(newValue: number) { params.stepsPerGeneration = newValue; }
// })

const getEnumNames = (e: string[]) => e.filter(s => isNaN(Number(s))).map((x, i) => ({ label: x, value: i }))

const paramsRef = reactive(params as Record<string, number | boolean>);
const paramGroups = [
  {
    name: 'Simulation',
    icon: 'apps',
    params: ['sizeX', 'sizeY', 'population', 'maxGenerations', 'stepsPerGeneration', {
      name: 'challenge',
      type: 'select',
      options: getEnumNames(Object.keys(Challenge))
    },
      {
        name: 'barrierType',
        type: 'select',
        options: getEnumNames(Object.keys(Barrier))
      },

      {
        name: 'Restart',
        type: 'button',
        fn: () => simWorker.postMessage({ msg: 'init' })
      }]
  },
  {
    name: 'Display',
    icon: 'monitor',
    params: ['displayPerSteps', 'displayPerGenerations']
  },
  {
    name: 'Genetics',
    icon: 'people',
    params: [
      'genomeInitialLengthMin',
      'genomeInitialLengthMax',
      'genomeMaxLength',
      'pointMutationRate',
      'geneInsertionDeletionRate',
      'sexualReproduction',
      'chooseParentsByFitness']
  },
  {
    name: 'Senses',
    icon: 'visibility',
    params: [
      'populationSensorRadius',
      'signalSensorRadius',
      'longProbeDistance',
      'shortProbeBarrierDistance']
  }
];
watch(() => ({ ...paramsRef }), (newval: Record<string, number | boolean>, oldval) => {
  Object.keys(newval).forEach(key => {
    if (newval[key] != oldval[key]) {
      simWorker.postMessage({ msg: 'setParam', payload: { param: key, value: newval[key] } })
      if (['sizeX', 'sizeY', 'population', 'barrierType'].includes(key)) simWorker.postMessage({ msg: 'init' })
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