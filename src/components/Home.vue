// src/components/Home.vue
<script setup lang="ts">
import { onMounted, ref, onUnmounted } from "vue";
import ChatBox from "./ChatBox.vue";
import Menu from "./Menu.vue";
import Chat from "./Chat.vue";
import CredentialsSetup from "./CredentialsSetup.vue";
import { state } from "../state"; // Import state

defineProps<{ msg: string }>();

const isUserloggedIn = ref<Boolean>(false);
const isLoading = ref(true);
let removeMessageChunkListener: (() => void) | null = null; // To store the cleanup function

onMounted(async () => {
  isLoading.value = true; // Set loading true at the start
  try {
    isUserloggedIn.value = await window.electronAPI.core.attemptLogin();

    // *** Set up the listener for message chunks ***
    if (isUserloggedIn.value) {
      const listenerResult = window.electronAPI.core.handleMessageChunk(
        (receivedConversationId: string, textPart: string) => {
          // Only update if the chunk is for the currently active conversation
          if (state.activeConversationId === receivedConversationId) {
            state.updateLastMessageInActiveConversation(textPart);
          }
        },
      );
      removeMessageChunkListener =
        typeof listenerResult === "function" ? listenerResult : null;
    }
  } catch (error) {
    console.error("Error during login or listener setup:", error);
    isUserloggedIn.value = false; // Ensure logged out state on error
  } finally {
    isLoading.value = false;
  }
});

// Clean up the listener when the component is unmounted
onUnmounted(() => {
  if (removeMessageChunkListener) {
    removeMessageChunkListener();
    console.log("Removed message chunk listener.");
  }
});
</script>

<template>
  <div v-if="isLoading" class="flex h-screen items-center justify-center">
    <span class="pi pi-spin pi-spinner-dotted text-neutral-500 text-3xl"></span>
  </div>
  <template v-else>
    <div
      v-if="isUserloggedIn"
      class="flex flex-col items-center h-screen bg-neutral-100 overflow-hidden"
    >
      <Menu />
      <div class="flex flex-col w-full flex-grow min-h-0">
        <Chat />
        <ChatBox />
      </div>
    </div>
    <CredentialsSetup v-else />
  </template>
</template>
