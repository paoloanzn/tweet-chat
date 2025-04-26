<script setup lang="ts">
defineProps<{ msg: string }>();
import Chat from "./Chat.vue";
import Menu from "./Menu.vue";
import ExamplePrompts from "./ExamplePrompts.vue";

const prompts = [
  "Help me plan a winning content strategy",
  "What have you been up to?",
  "What's your @?",
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
