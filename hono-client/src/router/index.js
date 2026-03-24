import { createRouter, createWebHistory } from "vue-router"

import LoginView from "../views/LoginView.vue"
import HomePage from "../views/HomePage.vue"
import LoginForm from "@/views/LoginForm.vue"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/login"
    },
    {
      path: "/login",
      component: LoginView
    },
    {
      path: "/homepage",
      component: HomePage
    },
    {
      path: "/loginform",
      component: LoginForm
    }
  ]
})

export default router