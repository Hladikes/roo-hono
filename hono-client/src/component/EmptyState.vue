<!-- src/component/EmptyState.vue -->
<script setup>
defineProps({ message: { type: String, default: "No data found." } });
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-[var(--color-text)] opacity-50">
    <div class="text-4xl mb-2">📭</div>
    <p class="text-sm">{{ message }}</p>
  </div>
</template>