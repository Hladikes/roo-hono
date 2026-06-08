<!-- Introduction.vue -->

<script setup>
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  TrophyIcon,
  CurrencyEuroIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/vue/24/outline";

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const messages = ref([]);
const cards = ref([]);
const events = ref([]);
const router = useRouter();
const loading = ref(true);

const iconMap = {
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  TrophyIcon,
  CurrencyEuroIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
};

function openCard(card) {
  switch (card.title) {
    case "Grades":
      router.push("/homepage/grades");
      break;
    case "Homework":
      router.push("/homepage/homework");
      break;
    case "Tests":
      router.push("/homepage/test");
      break;
    case "Messages":
      router.push("/homepage/messages");
      break;
    case "Class Book":
      router.push("/homepage/Class_Book");
      break;
    case "Subjects":
      router.push("/homepage/subjects");
      break;
    default:
      console.log("No route for:", card.title);
  }
}

onMounted(async () => {
  try {
    const [cardsRes, eventsRes] = await Promise.all([
      axios.get("http://localhost:3000/cards", { withCredentials: true }),
      axios.get("http://localhost:3000/events", { withCredentials: true }),
    ]);

    cards.value = cardsRes.data;
    events.value = eventsRes.data;
  } catch (error) {
    console.error("cards/events error:", error);
  }

  try {
    const messagesRes = await axios.get("http://localhost:3000/messages", {
      withCredentials: true,
    });
    messages.value = messagesRes.data;
  } catch (error) {
    console.error("messages error:", error);
    messages.value = [];
  }

  loading.value = false;
});
</script>

<template>
  <div class="h-full overflow-y-auto bg-[var(--color-background)] text-[var(--color-text)]">
    <!-- Messages -->
    <div class="grid grid-cols-3 gap-px bg-[var(--color-secondary)] border-b border-[var(--color-ascent)]">
      <div
        class="col-span-2 bg-[var(--color-background)] p-4 min-h-32 cursor-pointer hover:bg-[var(--color-ascent)] transition"
        @click="router.push('/homepage/messages')"
      >
        <h2 class="font-bold text-lg mb-2">Messages</h2>

        <div class="space-y-2 text-sm h-[75px] overflow-hidden">
          <p v-for="message in messages" :key="message.id">
            <span class="font-semibold"> {{ message.title }}: </span>
            {{ message.content }}
          </p>
        </div>
      </div>

      <div
        class="bg-[var(--color-background)] flex items-center gap-4 cursor-pointer hover:bg-[var(--color-ascent)] transition active:scale-[0.98]"
        @click="router.push('/homepage/Class_Book')"
      >
        <BookOpenIcon class="w-10 h-10 text-primary shrink-0" />

        <div>
          <h3 class="font-semibold text-lg">Class Book</h3>
          <p class="text-sm text-[var(--color-text)]">View lesson records</p>
        </div>
      </div>
    </div>

    <!-- Cards -->
    <div class="grid grid-cols-3 gap-px bg-[var(--color-secondary)]">
      <div
        v-for="card in cards"
        :key="card.id"
        @click="openCard(card)"
        class="bg-[var(--color-background)] p-4 min-h-[100px] flex items-center gap-4 cursor-pointer hover:bg-[var(--color-ascent)] transition active:scale-[0.98]"
      >
        <component
          :is="iconMap[card.icon]"
          class="w-10 h-10 text-primary shrink-0"
        />

        <div>
          <div class="font-semibold">{{ card.title }}</div>
          <div class="text-sm text-[var(--color-text)]">{{ card.subtitle }}</div>
        </div>
      </div>
    </div>

    <!-- Events -->
    <div class="p-4">
      <h2 class="text-2xl font-semibold mb-4">Upcoming Events</h2>

      <div class="grid grid-cols-7 bg-[var(--color-secondary)] border">
        <div v-for="day in 14" :key="day" class="border h-32 p-2 text-sm">
          <div class="font-semibold mb-2">Day {{ day }}</div>

          <div
            v-for="event in events.filter((e) => e.day === day)"
            :key="event.id"
            class="bg-[var(--color-primary)] text-[var(--color-text)] rounded px-2 py-1 text-xs mb-1"
          >
            {{ event.title }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 