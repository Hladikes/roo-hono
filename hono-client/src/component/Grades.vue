<script setup>
const grades = [
  {
    subject: "Mathematics",
    grades: [1, 2, 1, 1],
  },
  {
    subject: "English",
    grades: [2, 1, 2],
  },
  {
    subject: "Programming",
    grades: [1, 1, 1],
  },
  {
    subject: "Physics",
    grades: [2, 3, 2],
  },
  {
    subject: "Chemistry",
    grades: [1, 2, 1],
  },
  {
    subject: "Slovak",
    grades: [2, 3, 5],
  },
  {
    subject: "Computer Science",
    grades: [1, 5, 1],
  },
  {
    subject: "Biology",
    grades: [2, 3, 1],
  },
];

const average = (arr) =>
  (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
</script>

<template>
  <div class="h-full overflow-y-auto bg-[var(--color-background)] p-4">
    <div class="bg-[var(--color-background)] rounded shadow overflow-hidden">
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
            <td class="p-4 font-semibold">
              {{ grade.subject }}
            </td>

            <td class="p-4">
              <span
                v-for="(mark, index) in grade.grades"
                :key="index"
                class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-primary)] text-[var(--color-text)] mr-2"
              >
                {{ mark }}
              </span>
            </td>

            <td class="p-4">
              {{ average(grade.grades) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
