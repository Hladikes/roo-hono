<!-- Messages.vue -->

<script setup>
import { ref, onMounted } from "vue";
import LoadingSpinner from "./LoadingSpinner.vue";
import EmptyState from "./EmptyState.vue";

const messages = ref([]);
const selected = ref(null);
const favorites = ref([]);
const comments = ref({});
const attachments = ref({});
const uploading = ref(false);
const uploadError = ref("");
const loading = ref(true);

const showCompose = ref(false);
const allUsers = ref([]);
const composeForm = ref({ title: "", content: "", recipient_ids: [] });
const composeError = ref("");

onMounted(async () => {
  const [msgsRes, usersRes, favsRes] = await Promise.all([
    fetch("http://localhost:3000/messages", { credentials: "include" }),
    fetch("http://localhost:3000/users", { credentials: "include" }),
    fetch("http://localhost:3000/favorites", { credentials: "include" }),
  ]);

  messages.value = await msgsRes.json();
  allUsers.value = await usersRes.json();
  favorites.value = await favsRes.json();
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

async function toggleFav(id) {
  const res = await fetch(`http://localhost:3000/favorites/${id}`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (data.favorited) {
    favorites.value.push(id);
  } else {
    favorites.value = favorites.value.filter((f) => f !== id);
  }
}

async function loadComments(messageId) {
  const res = await fetch(
    `http://localhost:3000/messages/${messageId}/comments`,
    {
      credentials: "include",
    },
  );
  comments.value[messageId] = await res.json();
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
  const res = await fetch(
    `http://localhost:3000/messages/${messageId}/attachments`,
    {
      credentials: "include",
    },
  );
  attachments.value[messageId] = await res.json();
}

async function uploadFile(event, messageId) {
  const file = event.target.files[0];
  if (!file) return;

  uploadError.value = "";
  uploading.value = true;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `http://localhost:3000/messages/${messageId}/attachments`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );

  const data = await res.json();
  uploading.value = false;

  if (!res.ok) {
    uploadError.value = data.message;
    return;
  }

  await loadAttachments(messageId);
  event.target.value = "";
}

async function sendMessage() {
  composeError.value = "";

  if (!composeForm.value.title || !composeForm.value.content) {
    composeError.value = "Title and content are required.";
    return;
  }

  if (composeForm.value.recipient_ids.length === 0) {
    composeError.value = "Select at least one recipient.";
    return;
  }

  const res = await fetch("http://localhost:3000/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(composeForm.value),
  });

  if (res.ok) {
    showCompose.value = false;
    composeForm.value = { title: "", content: "", recipient_ids: [] };
    const msgsRes = await fetch("http://localhost:3000/messages", {
      credentials: "include",
    });
    messages.value = await msgsRes.json();
  }
}

function toggleRecipient(id) {
  if (composeForm.value.recipient_ids.includes(id)) {
    composeForm.value.recipient_ids = composeForm.value.recipient_ids.filter(
      (r) => r !== id,
    );
  } else {
    composeForm.value.recipient_ids.push(id);
  }
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
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold text-[var(--color-text)]">Messages</h1>
      <button
        @click="showCompose = !showCompose"
        class="bg-[var(--color-primary)] text-[var(--color-text)] px-4 py-2 rounded-lg text-sm"
      >
        {{ showCompose ? "Cancel" : "✉️ New Message" }}
      </button>
    </div>

    <!-- COMPOSE FORM -->
    <div
      v-if="showCompose"
      class="bg-[var(--color-background)] rounded-xl p-4 mb-6 space-y-3"
    >
      <h2 class="font-semibold text-[var(--color-text)]">New Message</h2>
      <input
        v-model="composeForm.title"
        placeholder="Title"
        class="w-full border rounded p-2 text-sm"
      />
      <textarea
        v-model="composeForm.content"
        placeholder="Content"
        rows="3"
        class="w-full border rounded p-2 text-sm"
      />
      <div>
        <p class="text-sm font-semibold text-[var(--color-text)] mb-2">
          Recipients:
        </p>
        <div class="space-y-1">
          <label
            v-for="user in allUsers"
            :key="user.id"
            class="flex items-center gap-2 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              :value="user.id"
              :checked="composeForm.recipient_ids.includes(user.id)"
              @change="toggleRecipient(user.id)"
            />
            {{ user.email }} ({{ user.role }})
          </label>
        </div>
      </div>
      <p v-if="composeError" class="text-red-500 text-xs">{{ composeError }}</p>
      <button
        @click="sendMessage"
        class="w-full bg-[var(--color-primary)] text-[var(--color-text)] py-2 rounded-lg text-sm"
      >
        Send
      </button>
    </div>

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
          <div class="text-xs text-[var(--color-text)] opacity-60 mb-1">
            From: {{ msg.sender_email }}
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
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">{{ selected.title }}</h2>
          <button @click="close" class="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <p class="text-xs text-gray-400 mb-3">
          From: {{ selected.sender_email }}
        </p>

        <p class="mb-4 text-sm text-[var(--color-text)] whitespace-pre-line">
          {{ selected.content }}
        </p>

        <button
          class="mb-4 text-sm px-3 py-1 bg-[var(--color-secondary)] rounded"
          @click="toggleFav(selected.id)"
        >
          {{ favorites.includes(selected.id) ? "Remove ⭐" : "Add ⭐" }}
        </button>

        <!-- ATTACHMENTS -->
        <div class="border-t pt-4 mb-4">
          <h3 class="font-semibold mb-3">Attachments</h3>

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

          <div
            v-if="
              !attachments[selected.id] || attachments[selected.id].length === 0
            "
            class="text-sm text-gray-400 italic"
          >
            No attachments yet.
          </div>

          <div v-else class="space-y-2">
            <a
              v-for="att in attachments[selected.id]" :key="att.id"
              :href="downloadUrl(att.filename)" target="_blank" class="flex
              items-center gap-3 p-2 rounded-lg bg-[var(--color-secondary)]
              hover:bg-[var(--color-ascent)] transition" >
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
