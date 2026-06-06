<!-- Grades.vue -->

<script setup>
import { ref, onMounted } from "vue";
import LoadingSpinner from "./LoadingSpinner.vue";
import EmptyState from "./EmptyState.vue";

const grades = ref([]);
const loading = ref(true);

const average = (arr) =>
  (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);

onMounted(async () => {
  const res = await fetch("http://localhost:3000/grades/1", { credentials: "include" });
  const data = await res.json();

  // zgruupuj podla subject
  const grouped = {};
  for (const row of data) {
    if (!grouped[row.subject]) grouped[row.subject] = [];
    grouped[row.subject].push(row.grade);
  }

  grades.value = Object.entries(grouped).map(([subject, gradeList]) => ({
    subject,
    grades: gradeList,
  }));

  loading.value = false;
});
</script>

<template>
  <div class="h-full overflow-y-auto bg-[var(--color-background)] p-4">

    <h1 class="text-2xl font-semibold text-[var(--color-text)] mb-6">Grades</h1>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="grades.length === 0" message="No grades found." />

    <div v-else class="bg-[var(--color-background)] rounded shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-[var(--color-secondary)] text-[var(--color-text)]">
          <tr>
            <th class="text-left p-4">Subject</th>
            <th class="text-left p-4">Grades</th>
            <th class="text-left p-4">Average</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="grade in grades" :key="grade.subject" class="border-b">
            <td class="p-4 font-semibold">{{ grade.subject }}</td>
            <td class="p-4">
              <span
                v-for="(mark, index) in grade.grades"
                :key="index"
                class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-primary)] text-[var(--color-text)] mr-2"
              >
                {{ mark }}
              </span>
            </td>
            <td class="p-4">{{ average(grade.grades) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>