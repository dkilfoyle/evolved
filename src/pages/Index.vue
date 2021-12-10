<template>
  <div id="grid"></div>
</template>

<script setup lang="ts">

import { ref, onMounted } from 'vue';
import * as d3 from 'd3';
import { Simulator } from 'src/lib/simulator';

onMounted(() => {

  const sim = new Simulator();
  sim.grid.init();
  sim.peeps.init(); // make individuals of size population
  sim.peeps.initializeGeneration0(sim.grid); // make random genome for each individual

  var svg = d3.select('#grid')
    .append('svg')
    .attr('width', 500)
    .attr('height', 500);

  const mydata = [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15]]

  svg.selectAll('g')
    .data(mydata)

    // each row
    .enter().append('g')
    .attr('transform', (d, i) => { return `translate(${i * 10})` })

    // each col
    .selectAll('circle')
    .data((d) => { console.log(d); return d })
    .enter().append('circle')
    .attr('r', 5)
    .attr('cx', 5)
    .attr('cy', (d, i) => (5 + i) * 10)
    .attr('fill', 'red')

})


</script>
