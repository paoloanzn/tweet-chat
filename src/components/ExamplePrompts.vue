<script setup lang="ts">
defineProps<{ 
    content: string;
}>();
</script>

<template>
  <button class="cursor-pointer border-1 border-neutral-600 bg-neutral-700 rounded-full py-2 px-4 m-2 text-white hover:bg-neutral-600 hover:border-neutral-500 transition duration-300 ease-in-out">
    {{ content }}
  </button>
</template>