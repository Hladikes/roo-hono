<!-- NotFound.vue -->

<script setup>
import { useRouter } from "vue-router";
import { onMounted } from "vue";

const router = useRouter();

async function getUser() {
  const res = await fetch("http://localhost:3000/me", {
    credentials: "include",
  });

  if (!res.ok) return null;

  return await res.json();
}

onMounted(async () => {
  const user = await getUser();

  if (!user) {
    router.push("/login");
    return;
  }

  if (user.role === "admin") {
    setTimeout(() => router.push("/admin"), 800);
  } else {
    setTimeout(() => router.push("/homepage"), 800);
  }
});
</script>

<template>
  <div
    class="flex items-center justify-center h-screen bg-[var(--color-background)] text-[var(--color-text)]"
  >
    <div class="text-center">
      <h1 class="text-6xl font-bold mb-4">404</h1>
      <p class="text-xl mb-8">Page Not Found</p>
    </div>
  </div>
</template>