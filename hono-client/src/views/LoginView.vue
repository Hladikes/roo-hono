<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router"

const router = useRouter()

function goToLoginForm() {
  router.push("/loginform")
}
</script>

<template>
  <div class="h-screen w-screen bg-[var(--color-secondary)] text-[var(--color-text)] flex flex-col items-center">
    <div class="h-[350px] bg-[var(--color-primary)] w-full flex items-center justify-center">
      <img src="./Images/logo.png" alt="Logo" class="h-[200px]" />
    </div>

    <div class="flex-1 flex items-center justify-center -mt-32">
      <div class="bg-[var(--color-background)] text-[var(--color-text)] w-[500px] rounded-3xl shadow-2xl p-10 text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <h1 class="text-4xl font-semibold mb-8">Login</h1>

          <button type="button" @click="goToLoginForm" class="w-full bg-[var(--color-ascent)] text-[var(--color-text)] hover:bg-[var(--color-ascent-hover)] transition rounded-full py-3 text-lg font-medium">
            Login to StudyGrid
          </button>
      </div>
    </div>
  </div>
</template>
