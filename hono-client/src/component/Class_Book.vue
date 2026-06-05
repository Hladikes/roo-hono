<script setup>
import { ref, computed, onMounted, watch } from "vue";

const lessons = ref([]);

const currentDate = ref(new Date());

const changeDay = (days) => {
  const newDate = new Date(currentDate.value);
  newDate.setDate(newDate.getDate() + days);
  currentDate.value = newDate;
};

const formattedDate = computed(() =>
  currentDate.value.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })
);

async function loadTimetable() {
  const day = currentDate.value.getDay();

  const res = await fetch(
    `http://localhost:3000/timetable/1/${day}`
  );

  lessons.value = await res.json();
}
onMounted(loadTimetable);

watch(currentDate, () => {
  loadTimetable();
});
</script>

<template>
  <div class="h-full bg-[var(--color-secondary)] flex flex-col">

    <!-- Header -->
    <div class="bg-[var(--color-background)] shadow px-4 py-3 sticky top-0 z-10">
      <div class="flex items-center justify-between">

        <button
          @click="changeDay(-1)"
          class="w-10 h-10 rounded-full hover:bg-gray-100 text-xl"
        >
          ←
        </button>

        <h1 class="text-xl font-bold text-green-600">
          {{ formattedDate }}
        </h1>

        <button
          @click="changeDay(1)"
          class="w-10 h-10 rounded-full hover:bg-gray-100 text-xl"
        >
          →
        </button>

      </div>
    </div>

    <!-- Scroll -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">

      <div
        v-for="lesson in lessons"
        :key="lesson.period"
        class="bg-[var(--color-background)] rounded-xl shadow p-4 border-l-4 border-primary"
      >
        <div class="flex justify-between">
          <div>
            <div class="text-sm text-[var(--color-text)]">
              Lesson {{ lesson.period }}
            </div>

            <h2 class="text-lg font-bold text-[var(--color-text)]">
              {{ lesson.subject }}
            </h2>
          </div>

          <div class="text-sm">
            {{ lesson.start_time }} - {{ lesson.end_time }}
          </div>
        </div>

        <div class="mt-3 space-y-1 text-sm">
          <p><b>Teacher:</b> {{ lesson.teacher }}</p>
          <p><b>Classroom:</b> {{ lesson.classroom }}</p>
          <p><b>Group:</b> {{ lesson.lesson_group }}</p>
        </div>

        <textarea
          v-model="lesson.note"
          rows="2"
          placeholder="My note..."
          class="w-full mt-3 border rounded-lg p-2"
        />
      </div>

    </div>

  </div>
</template>