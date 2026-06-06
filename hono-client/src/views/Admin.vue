<!-- Admin.vue -->

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import CookieBanner from "@/component/CookieBanner.vue";

const router = useRouter();

const dropdownOpen = ref(false);
const darkMode = ref(false);

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark");

  localStorage.setItem("dark", isDark ? "1" : "0");
  darkMode.value = isDark;
}

onMounted(() => {
  const saved = localStorage.getItem("dark") === "1";

  document.documentElement.classList.toggle("dark", saved);
  darkMode.value = saved;
});

async function logout() {
  // ak máš session backend → ideálne zavolať aj API
  await fetch("http://localhost:3000/logout", {
    method: "POST",
    credentials: "include",
  }).catch(() => {});

  localStorage.removeItem("user");

  router.push("/login");
}

function closeDropdown(e) {
  dropdownOpen.value = false;
}

onMounted(() => {
  window.addEventListener("click", closeDropdown);
});
</script>

<template>
  <div
    class="flex h-screen bg-[var(--color-background)] text-[var(--color-text)]"
  >
    <!-- SIDEBAR -->
    <aside class="w-64 bg-[var(--color-secondary)] flex flex-col">
      <div class="p-4 text-2xl font-bold border-b bg-[var(--color-primary)]">
        Admin Panel
      </div>

      <nav class="flex-1 p-2 space-y-2 font-semibold text-xl">
        <button
        @click="router.push('/admin/dashboard')"
          class="w-full text-left px-3 py-2 rounded hover:bg-[var(--color-ascent)]"
        >
          Dashboard
        </button>

        <button
          @click="router.push('/admin/register')"
          class="w-full text-left px-3 py-2 rounded hover:bg-[var(--color-ascent)]"
        >
          Users
        </button>

        <button
          @click="router.push('/admin/settings')"
          class="w-full text-left px-3 py-2 rounded hover:bg-[var(--color-ascent)]"
        >
          Settings
        </button>
      </nav>
    </aside>

    <!-- MAIN -->
    <div class="flex-1 flex flex-col">
      <!-- HEADER -->
      <header
        class="bg-[var(--color-primary)] px-6 py-3 flex justify-end items-center h-[65px] font-bold relative"
      >
        <div class="flex items-center gap-4">
          <button
            @click.stop="dropdownOpen = !dropdownOpen"
            class="bg-[var(--color-ascent)] px-3 py-1 rounded"
          >
            Admin
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

      <!-- CONTENT -->
      <main class="flex-1 p-6 bg-[var(--color-secondary)]">
        <router-view />
      </main>
    </div>
    <CookieBanner />
  </div>
</template>
