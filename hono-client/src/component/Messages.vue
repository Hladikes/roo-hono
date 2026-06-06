<!-- Messages.vue -->

<script setup>
import { ref, onMounted } from "vue";
import LoadingSpinner from "./LoadingSpinner.vue";
import EmptyState from "./EmptyState.vue";

const messages = ref([]);
const selected = ref(null);
const favorites = ref(JSON.parse(localStorage.getItem("favMsgs") || "[]"));
const comments = ref({});
const attachments = ref({});
const uploading = ref(false);
const uploadError = ref("");
const loading = ref(true);

onMounted(async () => {
  const res = await fetch("http://localhost:3000/messages", { credentials: "include" });
  messages.value = await res.json();
  loading.value = false;
});

function openMessage(msg) {
  selected.value = msg;
  loadAttachments(msg.id);
  loadComments(msg.id);
}

function close() {
  selected.value = null;
  uploadError.value = "";
}

function toggleFav(id) {
  if (favorites.value.includes(id)) {
    favorites.value = favorites.value.filter((f) => f !== id);
  } else {
    favorites.value.push(id);
  }
  localStorage.setItem("favMsgs", JSON.stringify(favorites.value));
}

async function loadComments(messageId) {
  const res = await fetch(`http://localhost:3000/messages/${messageId}/comments`, {
    credentials: "include",
  });
  const data = await res.json();
  comments.value[messageId] = data;
}

async function addComment(id, text) {
  if (!text) return;
  await fetch(`http://localhost:3000/messages/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text }),
  });
  await loadComments(id);
}

async function loadAttachments(messageId) {
  const res = await fetch(`http://localhost:3000/messages/${messageId}/attachments`, {
    credentials: "include",
  });
  const data = await res.json();
  attachments.value[messageId] = data;
}

async function uploadFile(event, messageId) {
  const file = event.target.files[0];
  if (!file) return;

  uploadError.value = "";
  uploading.value = true;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`http://localhost:3000/messages/${messageId}/attachments`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await res.json();
  uploading.value = false;

  if (!res.ok) {
    uploadError.value = data.message;
    return;
  }

  await loadAttachments(messageId);
  event.target.value = "";
}

function downloadUrl(filename) {
  return `http://localhost:3000/attachments/${filename}`;
}

function fileIcon(mimetype) {
  if (mimetype.startsWith("image/")) return "🖼️";
  if (mimetype === "application/pdf") return "📄";
  return "📎";
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
</script>

<template>
  <div class="h-full bg-[var(--color-secondary)] p-6 overflow-y-auto">
    <h1 class="text-2xl font-semibold text-[var(--color-text)] mb-6">
      Messages
    </h1>

    <LoadingSpinner v-if="loading" />
    <EmptyState
      v-else-if="messages.length === 0"
      message="No messages found."
    />

    <!-- LIST -->
    <div v-else class="space-y-3">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="bg-[var(--color-background)] p-4 rounded-xl shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md transition"
      >
        <div class="flex-1" @click="openMessage(msg)">
          <div class="font-semibold flex items-center gap-2">
            {{ msg.title }}
            <span v-if="favorites.includes(msg.id)">⭐</span>
          </div>
          <div class="text-sm text-[var(--color-text)] line-clamp-1">
            {{ msg.content }}
          </div>
        </div>
        <button @click.stop="toggleFav(msg.id)" class="text-xl px-2">
          {{ favorites.includes(msg.id) ? "⭐" : "☆" }}
        </button>
      </div>
    </div>

    <!-- MODAL -->
    <div
      v-if="selected"
      class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      @click="close"
    >
      <div
        class="bg-[var(--color-background)] w-full max-w-2xl rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <!-- HEADER -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">{{ selected.title }}</h2>
          <button @click="close" class="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <!-- CONTENT -->
        <p class="mb-4 text-sm text-[var(--color-text)] whitespace-pre-line">
          {{ selected.content }}
        </p>

        <!-- STAR -->
        <button
          class="mb-4 text-sm px-3 py-1 bg-[var(--color-secondary)] rounded"
          @click="toggleFav(selected.id)"
        >
          {{ favorites.includes(selected.id) ? "Remove ⭐" : "Add ⭐" }}
        </button>

        <!-- ATTACHMENTS -->
        <div class="border-t pt-4 mb-4">
          <h3 class="font-semibold mb-3">Attachments</h3>

          <!-- UPLOAD -->
          <label class="flex items-center gap-2 cursor-pointer mb-3">
            <span
              class="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-text)] rounded text-sm"
            >
              {{ uploading ? "Uploading..." : "📎 Attach file" }}
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.pdf"
              class="hidden"
              :disabled="uploading"
              @change="uploadFile($event, selected.id)"
            />
            <span class="text-xs text-gray-400"
              >Max 5MB — jpg, png, gif, pdf</span
            >
          </label>

          <p v-if="uploadError" class="text-red-500 text-xs mb-2">
            {{ uploadError }}
          </p>

          <!-- ATTACHMENT LIST -->
          <div
            v-if="
              !attachments[selected.id] || attachments[selected.id].length === 0
            "
            class="text-sm text-gray-400 italic"
          >
            No attachments yet.
          </div>

          <div v-else class="space-y-2">
            v-for="att in attachments[selected.id]" :key="att.id"
            :href="downloadUrl(att.filename)" target="_blank" class="flex
            items-center gap-3 p-2 rounded-lg bg-[var(--color-secondary)]
            hover:bg-[var(--color-ascent)] transition" ><a>
              <span class="text-2xl">{{ fileIcon(att.mimetype) }}</span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">
                  {{ att.original_name }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ formatSize(att.size) }}
                </div>
              </div>
              <span class="text-xs text-gray-400">↓</span>
            </a>
          </div>
        </div>

        <!-- COMMENTS -->
        <div class="border-t pt-4">
          <h3 class="font-semibold mb-2">Comments</h3>
          <div class="space-y-2 mb-3">
            <div
              v-for="comment in comments[selected.id] || []"
              :key="comment.id"
              class="text-sm text-[var(--color-text)] bg-[var(--color-secondary)] p-2 rounded"
            >
              <span class="font-semibold text-xs opacity-60"
                >{{ comment.email }}:
              </span>
              {{ comment.text }}
            </div>
          </div>
          <input
            type="text"
            placeholder="Add comment..."
            class="w-full border p-2 rounded text-sm"
            @keyup.enter="
              addComment(selected.id, $event.target.value);
              $event.target.value = '';
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>
