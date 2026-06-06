<!-- Homework.vue -->

<script setup>
import { ref, onMounted } from "vue";
import HomeworkCard from "./HomeworkCard.vue";
import LoadingSpinner from "./LoadingSpinner.vue";
import EmptyState from "./EmptyState.vue";

const homework = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editingItem = ref(null);

const form = ref({
  date_label: "",
  type: "homework",
  teacher: "",
  subject: "",
  text: "",
  time: "",
  color: "blue",
});

async function loadHomework() {
  const res = await fetch("http://localhost:3000/homework", { credentials: "include" });
  homework.value = await res.json();
  loading.value = false;
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
  };
}

function cancelForm() {
  showForm.value = false;
  editingItem.value = null;
  form.value = { date_label: "", type: "homework", teacher: "", subject: "", text: "", time: "", color: "blue" };
}

async function deleteHomework(id) {
  if (!confirm("Delete this homework?")) return;
  await fetch(`http://localhost:3000/homework/${id}`, { method: "DELETE", credentials: "include" });
  await loadHomework();
}

onMounted(loadHomework);
</script>

<template>
  <div class="h-full bg-[var(--color-secondary)] p-6 overflow-y-auto">

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl text-[var(--color-text)] font-semibold">Homework</h1>
      <button
        @click="showForm ? cancelForm() : (showForm = true)"
        class="bg-[var(--color-primary)] text-[var(--color-text)] px-4 py-2 rounded-lg text-sm"
      >
        {{ showForm ? "Cancel" : "+ Add" }}
      </button>
    </div>

    <!-- FORM -->
    <div v-if="showForm" class="bg-[var(--color-background)] rounded-xl p-4 mb-6 space-y-3">
      <h2 class="font-semibold text-[var(--color-text)]">
        {{ editingItem ? "Edit homework" : "New homework" }}
      </h2>
      <input v-model="form.date_label" placeholder="Date (e.g. Štv 04.06.)" class="w-full border rounded p-2 text-sm" />
      <input v-model="form.subject" placeholder="Subject" class="w-full border rounded p-2 text-sm" />
      <input v-model="form.teacher" placeholder="Teacher" class="w-full border rounded p-2 text-sm" />
      <textarea v-model="form.text" placeholder="Description" class="w-full border rounded p-2 text-sm" rows="2" />
      <input v-model="form.time" placeholder="Time (optional)" class="w-full border rounded p-2 text-sm" />
      <select v-model="form.color" class="w-full border rounded p-2 text-sm">
        <option value="blue">Blue</option>
        <option value="green">Green</option>
        <option value="orange">Orange</option>
        <option value="yellow">Yellow</option>
      </select>
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
            :showActions="true"
            @edit="startEdit"
            @delete="deleteHomework"
          />
        </div>
      </div>
    </div>

  </div>
</template>