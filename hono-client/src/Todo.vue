<template>
  <main
    class="max-w-md mx-auto border space-y-1 border-gray-200 p-3 m-5 flex flex-col"
  >
    <div v-for="item in items" class="p-3 border bg-gray-100 text-xl">
      {{ item }}
    </div>

    <div>
      <input
        v-model="currentItem"
        type="text"
        class="p-3 text-xl border"
        placeholder="Nazov polozky"
      />
      <button class="p-3 bg-blue-500 text-white" @click="sendItem()">
        Pridat
      </button>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const items = ref([])
const currentItem = ref('')

function sendItem() {
  fetch('http://localhost:3000/item', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item: currentItem.value,
    }),
  })
  currentItem.value = ''
}

onMounted(() => {
  const eventSource = new EventSource('http://localhost:3000/event-stream')
  eventSource.onmessage = (event) => {
    const newItems = JSON.parse(event.data)
    for (const newItem of newItems) {
      items.value.push(newItem)
    }
  }
})
</script>
