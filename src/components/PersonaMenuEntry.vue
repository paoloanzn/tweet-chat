<script setup lang="ts">
defineProps<{
  img: string;
  name: string;
}>();
</script>

<template>
  <div class="flex items-center">
    <img
      :src="img"
      :alt="name"
      class="w-12 h-12 rounded-full mr-4 border-1 border-neutral-600"
    />
    <div>@{{ name }}</div>
  </div>
</template>
