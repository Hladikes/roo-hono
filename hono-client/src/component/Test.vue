<!-- Test.vue -->

<script setup>
import { ref, onMounted } from "vue";
import HomeworkCard from "./HomeworkCard.vue";
import LoadingSpinner from "./LoadingSpinner.vue";
import EmptyState from "./EmptyState.vue";

const test = ref([]);
const loading = ref(true);

onMounted(async () => {
  const res = await fetch("http://localhost:3000/homework/test", { credentials: "include" });
  test.value = await res.json();
  loading.value = false;
});
</script>

<template>
  <div class="h-full bg-[var(--color-secondary)] p-6 overflow-y-auto">
    <h1 class="text-2xl text-[var(--color-text)] font-semibold mb-6">Tests / Exams</h1>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="test.length === 0" message="No tests found." />

    <div v-else class="space-y-6">
      <div v-for="group in test" :key="group.dateLabel">
        <div class="text-sm text-[var(--color-text)] mb-3">{{ group.dateLabel }}</div>
        <div class="space-y-3">
          <HomeworkCard
            v-for="item in group.items"
            :key="item.id"
            :item="item"
          />
        </div>
      </div>
    </div>
  </div>
</template>