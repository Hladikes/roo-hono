<!-- AdminRegister.vue -->

<script setup>
import { ref } from "vue";

const email = ref("");
const password = ref("");
const role = ref("student");
const message = ref("");

async function registerUser() {
  message.value = "";

  const res = await fetch("http://localhost:3000/admin/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email: email.value,
      password: password.value,
      role: role.value,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    message.value = data.message;
    return;
  }

  message.value = "User created successfully!";
  email.value = "";
  password.value = "";
}
</script>

<template>
  <div class="p-10 max-w-md">
    <h1 class="text-3xl font-bold mb-6">Admin - Register user</h1>

    <input
      v-model="email"
      placeholder="Email"
      class="border p-2 w-full mb-3"
    />

    <input
      v-model="password"
      type="password"
      placeholder="Password"
      class="border p-2 w-full mb-3"
    />

    <select v-model="role" class="border p-2 w-full mb-3">
      <option value="student">Student</option>
      <option value="teacher">Teacher</option>
      <option value="admin">Admin</option>
    </select>

    <button
      @click="registerUser"
      class="bg-blue-600 text-white px-4 py-2 w-full"
    >
      Create user
    </button>

    <p v-if="message" class="mt-4 text-sm">
      {{ message }}
    </p>
  </div>
</template>