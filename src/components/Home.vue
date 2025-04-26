<script setup lang="ts">
defineProps<{ msg: string }>();
import Chat from "./Chat.vue";
import Menu from "./Menu.vue";
import ExamplePrompts from "./ExamplePrompts.vue";

const prompts = [
  "What is the meaning of life?",
  "Tell me a joke.",
  "What is your favorite color?",
];
</script>

<template>
  <div class="flex flex-col justify-between items-center h-screen bg-neutral-800">
    <Menu />
    <div class="flex flex-row">
        <ExamplePrompts v-for="(prompt, index) in prompts" :key="index" :content="prompt" />
    </div>
    <Chat />
  </div>
</template>
