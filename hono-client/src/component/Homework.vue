<!-- Homework.vue -->

<script setup>
import { ref, onMounted } from "vue";
import HomeworkCard from "./HomeworkCard.vue";
import LoadingSpinner from "./LoadingSpinner.vue";
import EmptyState from "./EmptyState.vue";
import { useAuthStore } from "@/stores/auth";

const homework = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editingItem = ref(null);
const auth = useAuthStore();
const allUsers = ref([]);

const form = ref({
  date_label: "",
  type: "homework",
  teacher: "",
  subject: "",
  text: "",
  time: "",
  color: "blue",
  recipient_ids: [],
});

async function loadHomework() {
  const res = await fetch("http://localhost:3000/homework", { credentials: "include" });
  homework.value = await res.json();
  loading.value = false;
}

async function loadUsers() {
  const res = await fetch("http://localhost:3000/users", { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    allUsers.value = data.filter(u => u.role === "student");
  }
}

async function addHomework() {
  const res = await fetch("http://localhost:3000/homework", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(form.value),
  });

  if (res.ok) {
    cancelForm();
    await loadHomework();
  }
}

async function saveEdit() {
  const res = await fetch(`http://localhost:3000/homework/${editingItem.value}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(form.value),
  });

  if (res.ok) {
    cancelForm();
    await loadHomework();
  }
}

function startEdit(item) {
  editingItem.value = item.id;
  showForm.value = true;
  form.value = {
    date_label: item.date_label,
    type: item.type,
    teacher: item.teacher ?? "",
    subject: item.subject,
    text: item.text,
    time: item.time ?? "",
    color: item.color ?? "blue",
    recipient_ids: [],
  };
}

function cancelForm() {
  showForm.value = false;
  editingItem.value = null;
  form.value = { date_label: "", type: "homework", teacher: "", subject: "", text: "", time: "", color: "blue", recipient_ids: [] };
}

async function deleteHomework(id) {
  if (!confirm("Delete this homework?")) return;
  await fetch(`http://localhost:3000/homework/${id}`, { method: "DELETE", credentials: "include" });
  await loadHomework();
}

function toggleRecipient(userId) {
  const idx = form.value.recipient_ids.indexOf(userId);
  if (idx === -1) {
    form.value.recipient_ids.push(userId);
  } else {
    form.value.recipient_ids.splice(idx, 1);
  }
}

function selectAll() {
  form.value.recipient_ids = allUsers.value.map(u => u.id);
}

function deselectAll() {
  form.value.recipient_ids = [];
}

const canEdit = () => auth.user?.role === "teacher" || auth.user?.role === "admin";

onMounted(async () => {
  await loadHomework();
  if (canEdit()) await loadUsers();
});
</script>

<template>
  <div class="h-full bg-[var(--color-secondary)] p-6 overflow-y-auto">

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl text-[var(--color-text)] font-semibold">Homework</h1>
      <button
        v-if="canEdit()"
        @click="showForm ? cancelForm() : (showForm = true)"
        class="bg-[var(--color-primary)] text-[var(--color-text)] px-4 py-2 rounded-lg text-sm"
      >
        {{ showForm ? "Cancel" : "+ Add" }}
      </button>
    </div>

    <!-- FORM -->
    <div v-if="showForm && canEdit()" class="bg-[var(--color-background)] rounded-xl p-4 mb-6 space-y-3">
      <h2 class="font-semibold text-[var(--color-text)]">
        {{ editingItem ? "Edit homework" : "New homework" }}
      </h2>
      <input v-model="form.date_label" placeholder="Date (e.g. Štv 04.06.)" class="w-full border rounded p-2 text-sm" />
      <input v-model="form.subject" placeholder="Subject" class="w-full border rounded p-2 text-sm" />
      <input v-model="form.teacher" placeholder="Teacher" class="w-full border rounded p-2 text-sm" />
      <textarea v-model="form.text" placeholder="Description" class="w-full border rounded p-2 text-sm" rows="2" />
      <input v-model="form.time" placeholder="Time (optional)" class="w-full border rounded p-2 text-sm" />
      <select v-model="form.color" class="w-full border rounded p-2 text-sm bg-[var(--color-background)] text-[var(--color-text)]">
        <option value="blue">Blue</option>
        <option value="green">Green</option>
        <option value="orange">Orange</option>
        <option value="yellow">Yellow</option>
      </select>

      <!-- Výber príjemcov -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-semibold text-[var(--color-text)]">Assign to students:</span>
          <div class="flex gap-2">
            <button @click="selectAll" class="text-xs text-blue-500 hover:underline">Select all</button>
            <span class="text-xs text-gray-400">|</span>
            <button @click="deselectAll" class="text-xs text-red-400 hover:underline">Deselect all</button>
          </div>
        </div>
        <div class="border rounded p-2 max-h-40 overflow-y-auto space-y-1 bg-[var(--color-background)]">
          <label
            v-for="user in allUsers"
            :key="user.id"
            class="flex items-center gap-2 cursor-pointer hover:bg-[var(--color-secondary)] px-2 py-1 rounded text-sm text-[var(--color-text)]"
          >
            <input
              type="checkbox"
              :checked="form.recipient_ids.includes(user.id)"
              @change="toggleRecipient(user.id)"
              class="accent-[var(--color-primary)]"
            />
            {{ user.email.split("@")[0] }}
            <span class="text-xs text-gray-400">({{ user.role }})</span>
          </label>
          <div v-if="allUsers.length === 0" class="text-xs text-gray-400 italic p-1">No students found.</div>
        </div>
        <div class="text-xs text-gray-400 mt-1">
          {{ form.recipient_ids.length === 0 ? "No students selected — only you will see this." : `${form.recipient_ids.length} student(s) selected.` }}
        </div>
      </div>

      <button
        @click="editingItem ? saveEdit() : addHomework()"
        class="w-full bg-[var(--color-primary)] text-[var(--color-text)] py-2 rounded-lg text-sm"
      >
        {{ editingItem ? "Save changes" : "Save" }}
      </button>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="homework.length === 0" message="No homework found." />

    <div v-else class="space-y-6">
      <div v-for="group in homework" :key="group.dateLabel">
        <div class="text-sm text-[var(--color-text)] mb-3">{{ group.dateLabel }}</div>
        <div class="space-y-3">
          <HomeworkCard
            v-for="item in group.items"
            :key="item.id"
            :item="item"
            :showActions="canEdit()"
            @edit="startEdit"
            @delete="deleteHomework"
          />
        </div>
      </div>
    </div>

  </div>
</template>