<script setup>
const emit = defineEmits(['changePage'])

const menu = [
  'Introduction',
  'Grades',
  'Results'
]

const lessons = [
  { name: 'MAT', time: '8:00 - 8:45' },
  { name: 'ANJ', time: '8:50 - 9:35' },
  { name: 'PCV', time: '9:45 - 10:30' },
  { name: 'PCV', time: '10:40 - 11:25' },
  { name: 'SJL', time: '11:30 - 12:15' },
  { name: 'OBE', time: '12:20 - 13:05' },
  { name: 'ROO', time: '13:10 - 13:55' },
  { name: 'ROO', time: '14:00 - 14:45' }
]

</script>


<template>
  <div class="flex h-screen bg-blue-500">
    <!-- Sidebar -->
    <aside class="w-64 bg-secondary text-white flex flex-col">
      <div class="p-4 text-xl font-bold border-b bg-primary">
        StudyGrid
      </div>
      <nav class="flex-1 p-2 space-y-2">
        <button v-for="item in menu" :key="item" @click="emit('changePage', item)" class="w-full text-left px-3 py-2 cursor-pointer rounded hover:bg-ascent">
          {{ item }}
        </button>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- Navbar -->
      <header class="bg-primary text-white px-6 py-3 flex justify-between items-center h-[61px] font-bold border-b">
        <div></div>
        <div class="flex items-center gap-4">
          <span>🔔</span>
          <span>✉️</span>
          <span>Help</span>
          <div class="bg-ascent px-3 py-1 rounded">User</div>
        </div>
      </header>

      <!-- Rozvrh -->
      <div class="bg-secondary text-white p-4">
        <div class="mb-2 font-semibold m-4">Timetable today 31.03.</div>
        <div class="grid grid-cols-8 gap-2 text-center">
          <div v-for="lesson in lessons" :key="lesson.name" class="bg-ascent p-2 rounded gap-4">
            <div class="font-bold">{{ lesson.name }}</div>
            <div class="text-sm">{{ lesson.time }}</div>
          </div>
        </div>
      </div>

      <!-- Slot content -->
      <main class="flex-1 p-4">
        <slot />
      </main>
    </div>
  </div>
</template>
