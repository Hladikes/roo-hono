// src/main.js

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles.css'

function initTheme() {
  const isDark = localStorage.getItem("dark") === "1"
  document.documentElement.classList.toggle("dark", isDark)
}

initTheme()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')