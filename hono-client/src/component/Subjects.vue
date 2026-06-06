<!-- Subjects.vue -->

<script setup>
import { ref, onMounted } from "vue";

const subjects = ref([]);
const loading = ref(true);

onMounted(async () => {
  const res = await fetch(`http://localhost:3000/users/${userId.value}/subjects`, {
  credentials: "include",
});
  subjects.value = await res.json();
  loading.value = false;
});

const userId = ref(null);

onMounted(async () => {
  const res = await fetch("http://localhost:3000/me", { credentials: "include" });
  const user = await res.json();
  userId.value = user.id;
});
</script>

<template>
  <div class="h-full bg-[var(--color-secondary)] p-6 overflow-y-auto">

    <h1 class="text-2xl font-semibold text-[var(--color-text)] mb-6">
      My Subjects
    </h1>

    <!-- LOADING -->
    <div v-if="loading" class="text-[var(--color-text)] text-sm">
      Loading...
    </div>

    <!-- EMPTY -->
    <div v-else-if="subjects.length === 0" class="text-[var(--color-text)] text-sm">
      No subjects found.
    </div>

    <!-- LIST -->
    <div v-else class="grid grid-cols-3 gap-4">
      <div
        v-for="subject in subjects"
        :key="subject.id"
        class="bg-[var(--color-background)] rounded-xl shadow p-5 flex items-center gap-4 hover:shadow-md transition"
      >
        <div class="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center font-bold text-[var(--color-text)]">
          {{ subject.name.charAt(0) }}
        </div>

        <div>
          <div class="font-semibold text-[var(--color-text)]">{{ subject.name }}</div>
          <div class="text-xs text-[var(--color-text)] opacity-60">Subject</div>
        </div>
      </div>
    </div>

  </div>
</template>