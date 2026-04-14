<script setup>
import { ref } from 'vue'
import HomePage from './views/HomePage.vue'

import Grades from './component/Grades.vue'
//import Results from './component/Results.vue'

const currentPage = ref('Grades')

function changePage() {
  console.log(555555);
  
}
</script>

<template>
  <router-view />
  <HomePage @change-page="changePage()">
    <p>{{ currentPage }}</p>
    <Grades v-if="currentPage === 'Grades'" />
    <!-- <Results v-else-if="currentPage === 'Results'" /> -->
    
  </HomePage>
</template>
