<template>
  <q-list>
    <q-item-label header>Simulation</q-item-label>
    <q-item>
      <q-item-section>
        <div class="row items-center">
          <div class="col-8">
            <label>stepsPerGeneration</label>
          </div>
          <div class="col-4">
            <q-input v-model.number="paramsRef.stepsPerGeneration" type="number" dense></q-input>
          </div>
        </div>
      </q-item-section>
    </q-item>
    <q-item>
      <q-item-section>
        <div class="row items-center">
          <div class="col-8">
            <label>maxGenerations</label>
          </div>
          <div class="col-4">
            <q-input v-model.number="paramsRef.maxGenerations" type="number" dense></q-input>
          </div>
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { params } from 'src/lib/params'

export default defineComponent({
  name: 'EssentialLink',
  setup() {
    const paramsRef = ref(params);
    return { paramsRef }
  }
})
</script>
