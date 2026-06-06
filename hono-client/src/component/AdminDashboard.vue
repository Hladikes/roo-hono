<!-- AdminDashboard.vue -->

<script setup>
import { ref, onMounted } from "vue";

const users = ref([]);

async function loadUsers() {
  const res = await fetch("http://localhost:3000/users");
  users.value = await res.json();
}

async function deleteUser(id) {
  const confirmed = confirm(
    "Naozaj chceš zmazať používateľa?"
  );

  if (!confirmed) return;

  const res = await fetch(
    `http://localhost:3000/admin/users/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  const data = await res.json();

  alert(data.message);

  loadUsers();
}

function deleteCookie(name) {
  document.cookie =
    `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
}

async function resetAllCookies() {
  const res = await fetch(
    "http://localhost:3000/users"
  );

  const users = await res.json();

  users.forEach((user) => {
    deleteCookie(
      `cookiesAccepted_${user.email}`
    );
  });

  alert("All cookies reset.");
}

onMounted(loadUsers);
</script>

<template>
  <div class="p-10">

    <div class="flex justify-between mb-6">
      <h1 class="text-3xl font-bold">
        Admin Dashboard
      </h1>

      <button
        @click="resetAllCookies"
        class="px-4 py-2 rounded bg-orange-500 text-white"
      >
        Reset Cookies
      </button>
    </div>

    <div
      class="bg-[var(--color-background)]
      rounded-xl shadow p-6"
    >
      <h2 class="text-xl font-bold mb-4">
        Users
      </h2>

      <table class="w-full">
        <thead>
          <tr class="border-b">
            <th class="text-left py-2">ID</th>
            <th class="text-left py-2">Email</th>
            <th class="text-left py-2">Role</th>
            <th class="text-left py-2">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            class="border-b"
          >
            <td class="py-2">
              {{ user.id }}
            </td>

            <td class="py-2">
              {{ user.email }}
            </td>

            <td class="py-2">
              {{ user.role }}
            </td>

            <td class="py-2">
              <button
                @click="deleteUser(user.id)"
                class="px-3 py-1 rounded bg-red-600 text-white"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

    </div>

  </div>
</template>