<template>
  <q-list>
    <q-item-label header>Simulation</q-item-label>
    <q-item>
      <q-item-section>
        <div v-for="param in paramNames" :key="param">
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
        </div>
      </q-item-section>
    </q-item>
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
const paramNames = ['sizeX', 'sizeY', 'population', 'maxGenerations', 'stepsPerGeneration']

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
}
</style>