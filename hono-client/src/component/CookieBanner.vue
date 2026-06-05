<script setup>
import { ref, onMounted } from "vue";

const visible = ref(false);
const user = ref(null);

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="))
    ?.split("=")[1];
}

function setCookie(name, value) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000`;
}

async function loadUser() {
  const res = await fetch("http://localhost:3000/me", {
    credentials: "include",
  });

  if (!res.ok) return null;

  return await res.json();
}

onMounted(async () => {
  user.value = await loadUser();

  if (!user.value) return;

  const cookieKey = `cookiesAccepted_${user.value.email}`;
  const accepted = getCookie(cookieKey) === "true";

  if (!accepted) {
    visible.value = true;
  }
});

function acceptCookies() {
  if (!user.value) return;

  const cookieKey = `cookiesAccepted_${user.value.email}`;
  setCookie(cookieKey, "true");

  visible.value = false;
}

function declineCookies() {
  if (!user.value) return;

  const cookieKey = `cookiesAccepted_${user.value.email}`;
  setCookie(cookieKey, "false");

  visible.value = false;
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed bottom-5 left-1/2 -translate-x-1/2 w-[600px] bg-[var(--color-background)] shadow-2xl rounded-xl p-6 z-50"
  >
    <h2 class="text-xl text-[var(--color-text)] font-bold mb-2">Cookie Settings</h2>

    <p class="mb-4 text-[var(--color-text)]">
      This website uses cookies to improve user experience.
    </p>

    <div class="flex gap-3 justify-end">
      <button @click="declineCookies" class="px-4 py-2 border rounded text-[var(--color-text)]">
        Decline
      </button>

      <button
        @click="acceptCookies"
        class="px-4 py-2 bg-[var(--color-ascent)] text-[var(--color-text)] rounded"
      >
        Accept
      </button>
    </div>
  </div>
</template>
