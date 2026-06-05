<script setup>
import { useRouter } from "vue-router";
import { ref } from "vue";
import { onMounted } from "vue";
import CookieBanner from "@/component/CookieBanner.vue";

const router = useRouter();
const dropdownOpen = ref(false);
const darkMode = ref(false);

const menu = [
  { name: "Intro", route: "/homepage/introduction" },
  { name: "Grades", route: "/homepage/grades" },
  { name: "Class book", route: "/homepage/Class_Book" },
];

const lessons = [
  { name: "MAT", time: "8:00 - 8:45" },
  { name: "ANJ", time: "8:50 - 9:35" },
  { name: "PCV", time: "9:45 - 10:30" },
  { name: "PCV", time: "10:40 - 11:25" },
  { name: "SJL", time: "11:30 - 12:15" },
  { name: "OBE", time: "12:20 - 13:05" },
  { name: "ROO", time: "13:10 - 13:55" },
  { name: "ROO", time: "14:00 - 14:45" },
];

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark")

  localStorage.setItem("dark", isDark ? "1" : "0")
  darkMode.value = isDark
}

onMounted(() => {
  const saved = localStorage.getItem("dark") === "1"

  document.documentElement.classList.toggle("dark", saved)
  darkMode.value = saved
})

function logout() {
  localStorage.removeItem("user")

  router.push("/login")
}

function close(e) {
  dropdownOpen.value = false;
}

onMounted(() => {
  window.addEventListener("click", close);
});
</script>

<template>
  <div class="flex h-[100vh] bg-[var(--color-background)] text-[var(--color-text)]">
    <!-- slot -->
    <!-- Sidebar -->
    <aside class="w-64 bg-[var(--color-secondary)] text-[var(--color-text)] flex flex-col">
      <button class="p-4 text-2xl font-bold border-b bg-[var(--color-primary)] text-[var(--color-text)]">
        <a href="/homepage/introduction">StudyGrid</a>
      </button>
      <nav class="flex-1 p-2 space-y-2 font-semibold text-xl">
        <button
          v-for="item in menu"
          :key="item.name"
          @click="router.push(item.route)"
          class="w-full text-left px-3 py-2 cursor-pointer rounded hover:bg-[var(--color-ascent)]"
        >
          {{ item.name }}
        </button>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Navbar -->
      <header
        class="bg-[var(--color-primary)] text-[var(--color-text)] px-6 py-3 flex justify-between items-center h-[65px] font-bold border-b"
      >
        <div></div> <!-- velmi dolezite nechat tam -->
        <div class="flex items-center gap-4">
          <a href="/homepage/messages" class="text-[var(--color-text)] hover:text-gray-300">
            <span>✉️</span>
          </a>
          <a href="/homepage/help" class="text-[var(--color-text)] hover:text-gray-300">
            <span>Help</span>
          </a>
          <button
            @click.stop="dropdownOpen = !dropdownOpen"
            class="bg-[var(--color-ascent)] text-[var(--color-text)] px-3 py-1 rounded"
          >
            User
          </button>

          <!-- DROPDOWN -->
          <div
            v-if="dropdownOpen"
            class="absolute right-4 top-14 w-48 bg-[var(--color-background)] shadow-lg rounded-md overflow-hidden z-50"
          >
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

      <!-- Rozvrh -->
      <div class="bg-[var(--color-secondary)] text-[var(--color-text)] p-4 border-b border-l border-white">
        <div class="mb-2 font-semibold">Timetable today 31.03.</div>

        <div class="grid grid-cols-8 gap-2 text-center">
          <div
            v-for="lesson in lessons"
            :key="lesson.name"
            class="bg-[var(--color-ascent)] text-[var(--color-text)] p-2 rounded gap-4"
          >
            <div class="font-bold">{{ lesson.name }}</div>
            <div class="text-sm">{{ lesson.time }}</div>
          </div>
        </div>
      </div>

      <!-- Slot content -->
      <main class="flex-1 overflow-hidden p-4">
        <router-view />
      </main>
    </div>
    <CookieBanner />
  </div>
</template>
