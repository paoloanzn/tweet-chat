<script setup lang="ts">
import { computed, watch, nextTick, ref } from "vue";
import { state } from "../state";
import type { MessageModel } from "../electron/services/store/models";
import { format } from "date-fns"; // Using date-fns for better date formatting

const messagesContainer = ref<HTMLElement | null>(null);

// Computed property to get messages from the active conversation in the global state
const messages = computed<MessageModel[]>(() => {
  return state.activeConversation?.messages ?? [];
});

const activePersona = computed(() => state.activePersona);

const formatTimestamp = (timestamp: number): string => {
  // Example format: 10:35 AM
  return format(new Date(timestamp), "p");
};

// Scroll to the bottom when messages change or component updates
const scrollToBottom = async () => {
  await nextTick(); // Wait for the DOM to update
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// Watch for changes in messages and scroll down
watch(messages, scrollToBottom, { deep: true });
// Also scroll down when the active conversation changes
watch(() => state.activeConversationId, scrollToBottom);
</script>

<template>
  <div
    ref="messagesContainer"
    class="flex-grow w-full flex justify-center overflow-y-auto px-4 pb-2 no-scrollbar"
  >
    <div class="flex flex-col w-[95%] max-w-4xl">
      <div
        v-if="messages.length === 0 && activePersona"
        class="text-center text-neutral-500 mt-10 italic"
      >
        Start a conversation with @{{ activePersona?.twitterHandle }}!
      </div>
      <div
        v-else-if="messages.length === 0 && !activePersona"
        class="text-center text-neutral-500 mt-10 italic"
      >
        Select or create a Persona (⌘P or ⌘N) to begin.
      </div>
      <div
        v-for="message in messages"
        :key="message.id"
        class="flex mb-4"
        :class="{
          'justify-end': message.sender === 'user',
          'justify-start': message.sender === 'assistant',
        }"
      >
        <div
          class="flex max-w-[75%]"
          :class="{
            'flex-row-reverse': message.sender === 'user',
            'flex-row': message.sender === 'assistant',
          }"
        >
          <img
            v-if="
              message.sender === 'assistant' && activePersona?.twitterImgUrl
            "
            :src="activePersona.twitterImgUrl"
            :alt="activePersona.twitterHandle"
            class="w-8 h-8 rounded-full flex-shrink-0"
            :class="{ 'mr-3': message.sender === 'assistant' }"
          />
          <div
            v-else-if="message.sender === 'user'"
            class="w-8 h-8 rounded-full bg-neutral-400 flex items-center justify-center text-white font-semibold flex-shrink-0"
            :class="{ 'ml-3': message.sender === 'user' }"
            title="You"
          >
            Y
          </div>

          <div class="flex flex-col min-w-0">
            <div
              class="flex items-center"
              :class="{
                'justify-end': message.sender === 'user',
                'justify-start': message.sender === 'assistant',
              }"
            >
              <span class="text-neutral-600 font-semibold text-sm">{{
                message.sender === "assistant"
                  ? `@${activePersona?.twitterHandle}`
                  : "You"
              }}</span>
              <span class="text-neutral-400 text-xs mx-2">{{
                formatTimestamp(message.timestamp)
              }}</span>
            </div>
            <div
              class="p-3 rounded-lg shadow-sm mt-1 break-words text-left"
              :class="{
                'bg-sky-100 text-sky-900': message.sender === 'user',
                'bg-white text-neutral-700': message.sender === 'assistant',
              }"
            >
              <p class="text-base whitespace-pre-wrap">{{ message.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
