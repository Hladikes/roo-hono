<!-- src/component/HomeworkCard.vue -->
<script setup>
import { ClipboardDocumentListIcon, AcademicCapIcon, BookOpenIcon } from "@heroicons/vue/24/outline";

const iconMap = {
  homework: ClipboardDocumentListIcon,
  test: AcademicCapIcon,
  exam: BookOpenIcon,
};

const colorMap = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  yellow: "bg-yellow-100 text-yellow-700",
};

defineProps({
  item: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
});

defineEmits(["edit", "delete"]);
</script>

<template>
  <div class="bg-[var(--color-background)] rounded-xl shadow-sm p-4 flex gap-4 items-start hover:shadow-md transition">
    
    <div :class="colorMap[item.color] ?? 'bg-[var(--color-primary)] text-[var(--color-text)]'" class="p-3 rounded-full">
      <component :is="iconMap[item.type] ?? iconMap.homework" class="w-6 h-6" />
    </div>

    <div class="flex-1">
      <div class="text-xs text-[var(--color-text)]">
        {{ item.type.toUpperCase() }} • {{ item.teacher }}
      </div>
      <div class="font-semibold text-[var(--color-text)]">
        {{ item.subject }}: {{ item.text }}
      </div>
      <div v-if="item.time" class="text-xs text-[var(--color-text)] mt-1">
        {{ item.time }}
      </div>
    </div>

    <div v-if="showActions" class="flex gap-2">
      <button @click="$emit('edit', item)" class="text-blue-400 hover:text-blue-600 text-sm px-2">✎</button>
      <button @click="$emit('delete', item.id)" class="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
    </div>

  </div>
</template>