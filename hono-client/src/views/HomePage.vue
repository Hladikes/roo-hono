<!-- HomePage.vue -->

<script setup>
import { useRouter } from "vue-router";
import { ref, onMounted, computed } from "vue";
import CookieBanner from "@/component/CookieBanner.vue";
import { useAuthStore } from '@/stores/auth'

const router = useRouter();
const dropdownOpen = ref(false);
const darkMode = ref(false);
const user = ref(null);
const lessons = ref([]);
const sidebarOpen = ref(false);
const auth = useAuthStore()

const menu = computed(() => {
  const base = [
    { name: "Intro", route: "/homepage/introduction" },
    { name: "Messages", route: "/homepage/messages" },
    { name: "Chat", route: "/homepage/chat" },
  ]

  if (auth.user?.role === 'student') {
    return [
      ...base,
      { name: "Grades", route: "/homepage/grades" },
      { name: "Class book", route: "/homepage/Class_Book" },
      { name: "Subjects", route: "/homepage/subjects" },
      { name: "Homework", route: "/homepage/homework" },
      { name: "Tests", route: "/homepage/test" },
    ]
  }

  if (auth.user?.role === 'teacher') {
    return [
      ...base,
      { name: "Class book", route: "/homepage/Class_Book" },
      { name: "Homework", route: "/homepage/homework" },
      { name: "Tests", route: "/homepage/test" },
    ]
  }

  return base
})

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("dark", isDark ? "1" : "0");
  darkMode.value = isDark;
}

async function logout() {
  await fetch("http://localhost:3000/logout", {
    method: "POST",
    credentials: "include",
  }).catch(() => {})

  auth.clearUser()
  router.push("/login")
}

function close() {
  dropdownOpen.value = false;
}

function navigateTo(route) {
  router.push(route);
  sidebarOpen.value = false;
}

async function loadTimetable(userId) {
  const day = new Date().getDay();
  if (day === 0 || day === 6) {
    lessons.value = [];
    return;
  }

  const res = await fetch(`http://localhost:3000/timetable/${userId}/${day}`, {
    credentials: "include",
  });

  lessons.value = await res.json();
}

onMounted(async () => {
  const saved = localStorage.getItem("dark") === "1";
  document.documentElement.classList.toggle("dark", saved);
  darkMode.value = saved;

  window.addEventListener("click", close);

  const res = await fetch("http://localhost:3000/me", { credentials: "include" });
  if (res.ok) {
    auth.user = await res.json();
    await loadTimetable(auth.user.id);
  }
});
</script>

<template>
  <div class="flex h-[100vh] bg-[var(--color-background)] text-[var(--color-text)]">

    <!-- Overlay pre mobile -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      class="fixed md:static md:translate-x-0 z-30 w-64 h-full bg-[var(--color-secondary)] text-[var(--color-text)] flex flex-col transition-transform duration-300"
    >
      <button class="p-4 text-2xl font-bold border-b bg-[var(--color-primary)] text-[var(--color-text)] text-left">
        <a href="/homepage/introduction">StudyGrid</a>
      </button>
      <nav class="flex-1 p-2 space-y-2 font-semibold text-xl overflow-y-auto">
        <button
          v-for="item in menu"
          :key="item.name"
          @click="navigateTo(item.route)"
          class="w-full text-left px-3 py-2 cursor-pointer rounded hover:bg-[var(--color-ascent)]"
        >
          {{ item.name }}
        </button>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0">

      <!-- Navbar -->
      <header class="bg-[var(--color-primary)] text-[var(--color-text)] px-4 py-3 flex justify-between items-center h-[65px] font-bold border-b relative">

        <!-- Hamburger -->
        <button
          @click.stop="sidebarOpen = !sidebarOpen"
          class="md:hidden flex flex-col gap-1.5 p-1"
        >
          <span class="block w-6 h-0.5 bg-[var(--color-text)]"></span>
          <span class="block w-6 h-0.5 bg-[var(--color-text)]"></span>
          <span class="block w-6 h-0.5 bg-[var(--color-text)]"></span>
        </button>

        <div class="hidden md:block"></div>

        <div class="flex items-center gap-4">
          <a href="/homepage/messages" class="text-[var(--color-text)] hover:text-gray-300">
            <span>✉️</span>
          </a>
          <a href="/homepage/help" class="text-[var(--color-text)] hover:text-gray-300 hidden sm:inline">
            <span>Help</span>
          </a>
          <button
            @click.stop="dropdownOpen = !dropdownOpen"
            class="bg-[var(--color-ascent)] text-[var(--color-text)] px-3 py-1 rounded"
          >
            {{ auth.user ? auth.user.email.split("@")[0] : "User" }}
          </button>

          <!-- DROPDOWN -->
          <div
            v-if="dropdownOpen"
            class="absolute right-4 top-14 w-48 bg-[var(--color-background)] shadow-lg rounded-md overflow-hidden z-50"
          >
            <div class="px-4 py-2 text-xs text-gray-400 border-b">
              {{ auth.user?.email }}
            </div>

            <button
              @click="toggleDarkMode"
              class="w-full text-left px-4 py-2 hover:bg-[var(--color-ascent)]"
            >
              {{ darkMode ? "Light mode" : "Dark mode" }}
            </button>

            <button
              @click="logout"
              class="w-full text-left px-4 py-2 hover:bg-[var(--color-ascent)] text-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Timetable -->
      <div class="w-full bg-[var(--color-secondary)] text-[var(--color-text)] p-4 border-b border-white">
        <div class="mb-2 font-semibold text-sm md:text-base">
          Timetable today — {{ new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "numeric" }) }}
        </div>

        <div v-if="lessons.length === 0" class="text-sm text-gray-400 italic">
          No lessons today.
        </div>

        <div v-else class="flex gap-2 overflow-x-auto pb-1">
          <div
            v-for="lesson in lessons"
            :key="lesson.id"
            class="bg-[var(--color-ascent)] text-[var(--color-text)] p-2 rounded shrink-0 text-center min-w-[90px]"
          >
            <div class="font-bold text-sm">{{ lesson.subject }}</div>
            <div class="text-xs">{{ lesson.start_time }} - {{ lesson.end_time }}</div>
            <div class="text-xs opacity-70">{{ lesson.classroom }}</div>
          </div>
        </div>
      </div>

      <!-- Slot content -->
      <main class="flex-1 overflow-auto p-4">
        <router-view />
      </main>
    </div>

    <CookieBanner />
  </div>
</template>