import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  async function fetchUser() {
    const res = await fetch('http://localhost:3000/me', { credentials: 'include' })
    if (res.ok) {
      user.value = await res.json()
    } else {
      user.value = null
    }
  }

  function clearUser() {
    user.value = null
  }

  return { user, fetchUser, clearUser }
})