<script setup>
import { ref } from 'vue'

const users = ref([])

async function fetchUsers() {
  const response = await fetch('http://localhost:3000/users')
  const usersResponse = await response.json()

  users.value = usersResponse
}

async function deleteUser(index) {
  const response = await fetch('http://localhost:3000/users/' + index, {
    method: 'delete',
  })

  const deleteUserResponse = await response.text()

  if (deleteUserResponse === 'ok') {
    await fetchUsers()
  }
}

const text = ref('')

async function addUser() {
  const response = await fetch('http://localhost:3000/users', {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      newUsername: text.value,
    }),
  })

  const responseText = await response.text()

  if (responseText === 'ok') {
    await fetchUsers()
  }
}
</script>

<template>
  <button @click="fetchUsers()">Get all users</button>

  <ul>
    <li v-for="(user, index) in users" @click="deleteUser(index)">
      {{ user.toLowerCase() }}
    </li>
  </ul>

  <h1>{{ text }}</h1>

  <div>
    <input type="text" v-model="text" />
    <button @click="addUser()">Add</button>
  </div>
</template>
