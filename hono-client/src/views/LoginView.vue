<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router"

const router = useRouter()

function goToLoginForm() {
  router.push("/loginform")
}
</script>

<template>
  <div class="h-screen w-screen bg-secondary flex flex-col items-center">
    <div class="h-[350px] bg-primary w-full flex items-center justify-center">
      <img src="./Images/logo.png" alt="Logo" class="h-[200px]" />
    </div>

    <div class="flex-1 flex items-center justify-center -mt-32">
      <div
        class="bg-white w-[500px] rounded-3xl shadow-2xl p-10 text-center position-absolute top-1/2 left-1/2 transform -translatex-1/2 -translate-y-1/3">
        <h1 class="text-4xl font-semibold mb-8">Login</h1>

          <button @click="goToLoginForm" class="w-full bg-gray-300 hover:bg-gray-400 transition rounded-full py-3 text-lg font-medium">
            Login to StudyGrid
          </button>
      </div>
    </div>
  </div>
</template>
