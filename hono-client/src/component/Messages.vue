<script setup>
import { ref, onMounted } from "vue";

const messages = ref([]);
const selected = ref(null);
const favorites = ref(JSON.parse(localStorage.getItem("favMsgs") || "[]"));
const comments = ref({});

onMounted(async () => {
  const res = await fetch("http://localhost:3000/messages");
  messages.value = await res.json();
});

// --------------------
// OPEN / CLOSE
// --------------------
function openMessage(msg) {
  selected.value = msg;
}

function close() {
  selected.value = null;
}

// --------------------
// ⭐ FAVORITE TOGGLE
// --------------------
function toggleFav(id) {
  if (favorites.value.includes(id)) {
    favorites.value = favorites.value.filter(f => f !== id);
  } else {
    favorites.value.push(id);
  }

  localStorage.setItem("favMsgs", JSON.stringify(favorites.value));
}

// --------------------
// 💬 COMMENTS
// --------------------
function addComment(id, text) {
  if (!text) return;

  if (!comments.value[id]) {
    comments.value[id] = [];
  }

  comments.value[id].push(text);
}
</script>

<template>
  <div class="h-full bg-[var(--color-secondary)] p-6 overflow-y-auto">

    <h1 class="text-2xl font-semibold text-[var(--color-text)] mb-6">
      Messages
    </h1>

    <!-- LIST -->
    <div class="space-y-3">

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

          <div class="text-sm text-gray-500 line-clamp-1">
            {{ msg.content }}
          </div>
        </div>

        <!-- STAR BUTTON -->
        <button
          @click.stop="toggleFav(msg.id)"
          class="text-xl px-2"
        >
          {{ favorites.includes(msg.id) ? "⭐" : "☆" }}
        </button>

      </div>

    </div>

    <!-- MODAL -->
    <div
      v-if="selected"
      class="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
      @click="close"
    >
      <div
        class="bg-[var(--color-background)] w-full max-w-2xl rounded-xl p-6 shadow-xl"
        @click.stop
      >

        <!-- HEADER -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">
            {{ selected.title }}
          </h2>

          <button @click="close">✕</button>
        </div>

        <!-- CONTENT -->
        <p class="mb-4 text-sm whitespace-pre-line">
          {{ selected.content }}
        </p>

        <!-- STAR -->
        <button
          class="mb-4 text-sm"
          @click="toggleFav(selected.id)"
        >
          {{ favorites.includes(selected.id) ? "Remove ⭐" : "Add ⭐" }}
        </button>

        <!-- COMMENTS -->
        <div class="border-t pt-4">

          <h3 class="font-semibold mb-2">Comments</h3>

          <div class="space-y-2 mb-3">
            <div
              v-for="(c, i) in comments[selected.id] || []"
              :key="i"
              class="text-sm bg-gray-100 p-2 rounded"
            >
              {{ c }}
            </div>
          </div>

          <input
            type="text"
            placeholder="Add comment..."
            class="w-full border p-2 rounded"
            @keyup.enter="addComment(selected.id, $event.target.value); $event.target.value=''"
          />

        </div>

      </div>
    </div>

  </div>
</template>