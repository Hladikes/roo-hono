// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'

function initTheme() {
  const isDark = localStorage.getItem("dark") === "1"
  document.documentElement.classList.toggle("dark", isDark)
}

// spustí sa pri štarte aplikácie
initTheme()

createApp(App).use(router).mount('#app')