<script setup>
import Uploader from './components/Uploader.vue';
</script>

<template>
  <div class="app">
    <uploader url="http://localhost:8888/uploader" merge-url="http://localhost:8888/uploader/merge"></uploader>
  </div>
</template>

<style scoped>
</style>
