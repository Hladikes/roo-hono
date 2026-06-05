<script setup>
import { ref, onMounted } from "vue";

import {
  ClipboardDocumentListIcon,
} from "@heroicons/vue/24/outline";

const iconMap = {
  homework: ClipboardDocumentListIcon,
};

const colorMap = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  yellow: "bg-yellow-100 text-yellow-700",
};

const homework = ref([]);

onMounted(async () => {
  const res = await fetch("http://localhost:3000/homework");
  homework.value = await res.json();
});
</script>

<template>
  <div class="h-full bg-[var(--color-secondary)] p-6 overflow-y-auto">

    <h1 class="text-2xl text-[var(--color-text)] font-semibold mb-6">
      Homework
    </h1>

    <div class="space-y-6">

      <div v-for="group in homework" :key="group.dateLabel">

        <!-- DATE -->
        <div class="text-sm text-[var(--color-text)] mb-3">
          {{ group.dateLabel }}
        </div>

        <!-- ITEMS -->
        <div class="space-y-3">

          <div
            v-for="item in group.items"
            :key="item.id"
            class="bg-[var(--color-background)] rounded-xl shadow-sm p-4 flex gap-4 items-start hover:shadow-md transition"
          >

            <!-- ICON -->
            <div
              :class="colorMap[item.color]"
              class="p-3 rounded-full"
            >
              <component
                :is="iconMap[item.type]"
                class="w-6 h-6"
              />
            </div>

            <!-- CONTENT -->
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

          </div>

        </div>

      </div>

    </div>
  </div>
</template>