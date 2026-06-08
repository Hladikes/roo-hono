<!-- Class_Book.vue -->

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import LoadingSpinner from "./LoadingSpinner.vue";
import EmptyState from "./EmptyState.vue";

const lessons = ref([]);
const currentDate = ref(new Date());
const userId = ref(null);
const loading = ref(true);

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
  }),
);

async function loadTimetable() {
  if (!userId.value) return;

  loading.value = true;
  const day = currentDate.value.getDay();

  if (day === 0 || day === 6) {
    lessons.value = [];
    loading.value = false;
    return;
  }

  const res = await fetch(
    `http://localhost:3000/timetable/${userId.value}/${day}`,
    {
      credentials: "include",
    },
  );

  const data = await res.json();

  // nacitaj notes pre kazdu hodinu
  const lessonsWithNotes = await Promise.all(
    data.map(async (lesson) => {
      const noteRes = await fetch(`http://localhost:3000/notes/${lesson.id}`, {
        credentials: "include",
      });
      const noteData = await noteRes.json();
      return { ...lesson, note: noteData.note };
    }),
  );

  lessons.value = lessonsWithNotes;
  loading.value = false;
}

async function saveNote(lesson) {
  await fetch(`http://localhost:3000/notes/${lesson.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ note: lesson.note }),
  });
}

onMounted(async () => {
  const res = await fetch("http://localhost:3000/me", {
    credentials: "include",
  });
  const user = await res.json();
  userId.value = user.id;
  await loadTimetable();
});

watch(currentDate, loadTimetable);
</script>

<template>
  <div class="h-full bg-[var(--color-secondary)] flex flex-col">
    <!-- Header -->
    <div
      class="bg-[var(--color-background)] shadow px-4 py-3 sticky top-0 z-10"
    >
      <div class="flex items-center justify-between">
        <button
          @click="changeDay(-1)"
          class="w-10 h-10 rounded-full hover:bg-[var(--color-ascent)] text-xl"
        >
          ←
        </button>
        <h1 class="text-xl font-bold text-[var(--color-text)]">
          {{ formattedDate }}
        </h1>
        <button
          @click="changeDay(1)"
          class="w-10 h-10 rounded-full hover:bg-[var(--color-ascent)] text-xl"
        >
          →
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <LoadingSpinner v-if="loading" />

      <EmptyState
        v-else-if="lessons.length === 0"
        message="No lessons this day."
      />

      <div
        v-else
        v-for="lesson in lessons"
        :key="lesson.id"
        class="bg-[var(--color-background)] rounded-xl shadow p-4 border-l-4 border-[var(--color-primary)]"
      >
        <div class="flex justify-between items-start">
          <div>
            <div class="text-xs text-[var(--color-text)] opacity-60">
              Lesson {{ lesson.lesson_number }}
            </div>
            <h2 class="text-lg font-bold text-[var(--color-text)]">
              {{ lesson.subject }}
            </h2>
            <div class="text-xs text-[var(--color-text)] opacity-60 mt-1">
              {{ lesson.lesson_group }}
            </div>
          </div>

          <div class="text-sm font-semibold text-[var(--color-text)]">
            {{ lesson.start_time }} - {{ lesson.end_time }}
          </div>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-1 text-sm">
          <p><b>Teacher:</b> {{ lesson.teacher }}</p>
          <p><b>Classroom:</b> {{ lesson.classroom }}</p>
        </div>

        <textarea
          v-model="lesson.note"
          rows="2"
          placeholder="My note..."
          class="w-full mt-3 border rounded-lg p-2 text-sm bg-[var(--color-secondary)] text-[var(--color-text)]"
          @blur="saveNote(lesson)"
        />
      </div>
    </div>
  </div>
</template>
