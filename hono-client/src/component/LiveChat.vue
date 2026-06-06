<!-- LiveChat.vue -->

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import EmptyState from "./EmptyState.vue";

const messages = ref([]);
const input = ref("");
let ws = null;

onMounted(() => {
  ws = new WebSocket("ws://localhost:3000/ws");

  ws.onopen = () => {
    messages.value.push({ text: "Connected to server", system: true });
  };

  ws.onmessage = (evt) => {
    messages.value.push({ text: evt.data, system: false });
  };

  ws.onclose = () => {
    messages.value.push({ text: "Disconnected", system: true });
  };
});

onUnmounted(() => {
  if (ws) ws.close();
});

function send() {
  if (!input.value.trim() || !ws) return;
  ws.send(input.value);
  messages.value.push({ text: input.value, own: true });
  input.value = "";
}
</script>

<template>
  <div class="h-full bg-[var(--color-secondary)] p-6 flex flex-col gap-4">

    <h1 class="text-2xl font-semibold text-[var(--color-text)]">Live Chat</h1>

    <!-- MESSAGES -->
    <div class="flex-1 overflow-y-auto bg-[var(--color-background)] rounded-xl p-4 space-y-2 min-h-0">

      <div v-if="messages.length === 0" class="text-sm text-center text-gray-400 italic">
        No messages yet.
      </div>

      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="[
          'text-sm px-3 py-2 rounded-lg max-w-xs',
          msg.system ? 'bg-gray-100 text-gray-500 italic mx-auto text-center' :
          msg.own ? 'bg-[var(--color-primary)] text-[var(--color-text)] ml-auto' :
          'bg-[var(--color-secondary)] text-[var(--color-text)]'
        ]"
      >
        {{ msg.text }}
      </div>

    </div>

    <!-- INPUT -->
    <div class="flex gap-2 shrink-0">
      <input
        v-model="input"
        @keyup.enter="send"
        placeholder="Type a message..."
        class="flex-1 border rounded-lg px-4 py-2 text-sm bg-[var(--color-background)] text-[var(--color-text)]"
      />
      <button
        @click="send"
        class="bg-[var(--color-primary)] text-[var(--color-text)] px-4 py-2 rounded-lg text-sm"
      >
        Send
      </button>
    </div>

  </div>
</template>