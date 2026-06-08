// src/router/index.js

import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../views/LoginView.vue";
import LoginForm from "../views/LoginForm.vue";
import HomePage from "../views/HomePage.vue";
import Intro from "../component/Introduction.vue";
import Grades from "../component/Grades.vue";
import Class_Book from "../component/Class_Book.vue";
import Homework from "../component/Homework.vue";
import Test from "../component/Test.vue";
import Messages from "../component/Messages.vue";
import Help from "../component/Help.vue";
import Subjects from "../component/Subjects.vue";
import Admin from "../views/Admin.vue";
import NotFound from "../views/NotFound.vue";
import AdminRegister from "../component/AdminRegister.vue";
import AdminSettings from "../component/AdminSettings.vue";
import AdminDashboard from "../component/AdminDashboard.vue";
import LiveChat from "../component/LiveChat.vue";
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      component: LoginView,
    },
    {
      path: "/loginform",
      component: LoginForm,
    },
    {
      path: "/homepage",
      component: HomePage,
      children: [
        {
          path: "",
          redirect: "/homepage/introduction",
        },
        {
          path: "introduction",
          component: Intro,
        },
        {
          path: "grades",
          component: Grades,
        },
        {
          path: "Class_Book",
          component: Class_Book,
        },
        {
          path: "homework",
          component: Homework,
        },
        {
          path: "test",
          component: Test,
        },
        {
          path: "messages",
          component: Messages,
        },
        {
          path: "help",
          component: Help,
        },
        {
          path: "subjects",
          component: Subjects,
        },
        {
          path: "chat",
          component: LiveChat,
        },
      ],
    },
    {
      path: "/admin",
      component: Admin,
      children: [
        {
          path: "",
          redirect: "/admin/dashboard",
        },
        {
          path: "register",
          component: AdminRegister,
        },
        {
          path: "settings",
          component: AdminSettings,
        },
        {
          path: "dashboard",
          component: AdminDashboard,
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      component: NotFound,
    },
  ],
});

router.beforeEach(async (to) => {
  if (to.path === "/login" || to.path === "/loginform") return true;

  const auth = useAuthStore()
  await auth.fetchUser()

  if (!auth.user) return "/login"

  if (to.path.startsWith("/admin") && auth.user.role !== "admin") {
    return "/homepage"
  }

  return true
});

export default router;
