<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { state } from "../state";
import { v4 as uuidv4 } from "uuid";
import type { MessageModel } from "../electron/services/store/models";

const inputValue = ref("");
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const isSending = ref(false);

// Auto-resize logic
const adjustHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = "auto"; // Reset height
    // Set height based on scroll height, capped at max-height (e.g., 192px for max-h-48)
    const maxHeight = 192;
    const scrollHeight = textareaRef.value.scrollHeight;
    textareaRef.value.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    // Enable scrollbar if content exceeds max height
    textareaRef.value.style.overflowY =
      scrollHeight > maxHeight ? "auto" : "hidden";
  }
};

// Watch input value to adjust height dynamically
watch(inputValue, adjustHeight);

// Keyboard shortcut handler
const handleGlobalKeydown = (e: KeyboardEvent) => {
  // Focus input on Ctrl/Cmd + I
  if ((e.metaKey || e.ctrlKey) && e.key === "i") {
    //
    e.preventDefault();
    textareaRef.value?.focus();
  }
  // Send message on Enter (if not Shift+Enter)
  if (
    e.key === "Enter" &&
    !e.shiftKey &&
    !isSending.value &&
    inputValue.value.trim()
  ) {
    e.preventDefault();
    sendMessage();
  }
};

const sendMessage = async () => {
  const textToSend = inputValue.value.trim();
  if (!textToSend || isSending.value || !state.activePersonaId) {
    if (!state.activePersonaId) {
      console.warn("Cannot send message: No active persona selected.");
      // Optionally provide user feedback here
    }
    return;
  }

  isSending.value = true;
  const currentInputValue = inputValue.value; // Store current value
  inputValue.value = ""; // Clear input immediately
  adjustHeight(); // Reset height after clearing

  let targetConversationId = state.activeConversationId;

  // 1. Create a new conversation if none is active for the current persona
  if (!targetConversationId) {
    console.log("No active conversation, creating a new one...");
    const newConversation = await state.createConversation(
      state.activePersonaId,
    );
    if (!newConversation) {
      console.error("Failed to create a new conversation.");
      inputValue.value = currentInputValue; // Restore input value on failure
      adjustHeight();
      isSending.value = false;
      return;
    }
    targetConversationId = newConversation.id;
    console.log("Created and set active conversation:", targetConversationId);
  }

  if (!targetConversationId) {
    console.error(
      "Error: targetConversationId is still null after check/create.",
    );
    inputValue.value = currentInputValue; // Restore
    adjustHeight();
    isSending.value = false;
    return;
  }

  // 2. Add the user message to the state/UI
  const userMessage: MessageModel = {
    id: uuidv4(),
    sender: "user",
    text: textToSend,
    timestamp: Date.now(),
  };
  await state.addMessageToActiveConversation(userMessage);

  // 3. Prepare for assistant's response (add placeholder)
  const assistantMessagePlaceholder: MessageModel = {
    id: uuidv4(), // Give it a temporary ID
    sender: "assistant",
    text: "", // Start with empty text for streaming
    timestamp: Date.now(),
  };
  await state.addMessageToActiveConversation(assistantMessagePlaceholder, {
    persist: false,
  });

  // 4. Call backend to generate the assistant's message with streaming
  try {
    console.log("Generating response for conversation:", targetConversationId);
    await window.electronAPI.core.generateNextMessage(targetConversationId);
    console.log("Finished generating response.");
    // The final message text is implicitly saved by the last onText update + the backend's final save.
  } catch (error) {
    console.error("Error generating message:", error);
    // Handle error: maybe add an error message to the chat?
    const errorMessage: MessageModel = {
      id: uuidv4(),
      sender: "assistant",
      text: "Sorry, I encountered an error trying to respond.",
      timestamp: Date.now(),
    };
    await state.addMessageToActiveConversation(errorMessage);
  } finally {
    isSending.value = false;
    // Refocus input after sending, unless the user clicked away
    // Check if the textarea still has focus or if the document body has focus (common after button click)
    if (
      document.activeElement === textareaRef.value ||
      document.activeElement === document.body
    ) {
      textareaRef.value?.focus();
    }
  }
};

// Lifecycle hooks
onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeydown); //
  adjustHeight(); // Initial adjustment
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown); //
});
</script>

<template>
  <div class="flex w-full justify-center pb-6">
    <div
      class="flex w-[95%] place-content-between p-4 bg-neutral-200 rounded-xl border-1 border-neutral-300 items-start"
    >
      <textarea
        ref="textareaRef"
        v-model="inputValue"
        @input="adjustHeight"
        :disabled="isSending || !state.activePersonaId"
        :placeholder="
          state.activePersonaId
            ? 'Ask something (⌘I)'
            : 'Select a Persona (⌘P) first'
        "
        class="focus:outline-none text-lg text-neutral-500 w-full resize-none overflow-y-auto max-h-48 transition-all duration-200 min-h-[40px] no-scrollbar"
        rows="1"
        style="
          min-height: 2.5rem;
          max-height: 12rem; /* ~ max-h-48 */
          overflow-y: hidden;
        "
      ></textarea>
      <button
        @click="sendMessage"
        :disabled="isSending || !inputValue.trim() || !state.activePersonaId"
        class="cursor-pointer bg-white py-1 px-2 rounded-full text-neutral-500 hover:bg-neutral-300 transition delay-50 ease-in-out"
        :class="{
          'opacity-50 cursor-not-allowed':
            isSending || !inputValue.trim() || !state.activePersonaId,
        }"
        title="Send Message (Enter)"
      >
        <span v-if="!isSending" class="pi pi-arrow-right"></span>
        <span v-else class="pi pi-spin pi-spinner-dotted"></span>
      </button>
    </div>
  </div>
</template>
