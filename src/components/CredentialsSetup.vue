<script setup lang="ts">
import { ref, onMounted, watch, onUpdated } from "vue";
import { motion } from "motion-v";
import type { RefSymbol } from "@vue/reactivity";
import { state } from "../state";

const electronAPI = window.electronAPI;

const transition = {
  duration: 0.5,
  ease: "easeInOut",
};

// Reactive variables
const currentStage = ref(1);
const username = ref("");
const email = ref("");
const password = ref("");
const apiKey = ref("");
const loading = ref(false); // New reactive variable for loading state

// Function to handle input and update stage
const handleInput = async (stage: number, event: KeyboardEvent) => {
  if (event.key === "Enter" && stage === currentStage.value) {
    if (stage < 4) {
      currentStage.value++;
    } else {
      await submitForm();
    }
  }
};

// Function to go back to the previous stage
const goBack = () => {
  if (currentStage.value > 1) {
    currentStage.value--;
  }
};

// Automatically focus on the input box of the current stage
const focusInput = () => {
  const input = document.querySelector<HTMLInputElement>(
    `#stage-${currentStage.value}`,
  );
  input?.focus();
};

// Function to submit the form
const submitForm = async () => {
  loading.value = true; // Set loading to true
  try {
    // Simulate an API call or some async operation
    await electronAPI.secrets.set("twitter-username", username.value);
    await electronAPI.secrets.set("twitter-email", email.value);
    await electronAPI.secrets.set("twitter-password", password.value);
    await electronAPI.secrets.set("OPENAI_API_KEY", apiKey.value);
    console.log("Attempting login...");

    const result = await electronAPI.core.attemptLogin();
    if (!result) {
      throw Error("Unable to login.");
    }

    state.showCredentialsSetup = false;
    location.reload(); // Reload the page after successful submission
  } catch (error) {
    console.error("Error during form submission:", error);
  } finally {
    loading.value = false; // Set loading to false
  }
};

// Watch for stage changes to refocus the input
watch(currentStage, focusInput);

// Focus the input on initial mount
onMounted(focusInput);

// Refocus the input whenever the DOM updates
onUpdated(focusInput);
</script>

<template>
  <div class="flex h-screen items-center justify-center text-neutral-600">
    <motion.div
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="transition"
    >
      <div class="w-full max-w-md">
        <!-- Show spinner if loading, otherwise show form -->
        <div v-if="loading" class="flex justify-center items-center h-96">
          <div class="loader"></div>
          <!-- Add your spinner here -->
        </div>
        <form v-else class="space-y-4 mt-6">
          <motion.div
            :initial="{ opacity: 0 }"
            :animate="{ opacity: currentStage === 1 ? 1 : 0 }"
            :exit="{ opacity: 0 }"
            :transition="transition"
            v-if="currentStage === 1"
            @animationend="focusInput"
          >
            <label for="username" class="block text-xl font-medium"
              >Twitter Username</label
            >
            <input
              id="stage-1"
              type="text"
              class="mt-6 block w-full rounded-lg p-2 px-4 bg-neutral-100 focus:outline-none placeholder:italic"
              placeholder="username"
              v-model="username"
              @keydown="handleInput(1, $event)"
            />
          </motion.div>
          <motion.div
            :initial="{ opacity: 0 }"
            :animate="{ opacity: currentStage === 2 ? 1 : 0 }"
            :exit="{ opacity: 0 }"
            :transition="transition"
            v-if="currentStage === 2"
            @animationend="focusInput"
          >
            <label for="email" class="block text-xl font-medium"
              >Twitter Email</label
            >
            <input
              id="stage-2"
              type="email"
              class="mt-6 block w-full rounded-lg p-2 px-4 bg-neutral-100 focus:outline-none placeholder:italic"
              placeholder="email"
              v-model="email"
              @keydown="handleInput(2, $event)"
            />
          </motion.div>
          <motion.div
            :initial="{ opacity: 0 }"
            :animate="{ opacity: currentStage === 3 ? 1 : 0 }"
            :exit="{ opacity: 0 }"
            :transition="transition"
            v-if="currentStage === 3"
            @animationend="focusInput"
          >
            <label for="password" class="block text-xl font-medium"
              >Twitter Password</label
            >
            <input
              id="stage-3"
              type="password"
              class="mt-6 block w-full rounded-lg p-2 px-4 bg-neutral-100 focus:outline-none placeholder:italic"
              placeholder="password"
              v-model="password"
              @keydown="handleInput(3, $event)"
            />
          </motion.div>
          <motion.div
            :initial="{ opacity: 0 }"
            :animate="{ opacity: currentStage === 4 ? 1 : 0 }"
            :exit="{ opacity: 0 }"
            :transition="transition"
            v-if="currentStage === 4"
            @animationend="focusInput"
          >
            <label for="apiKey" class="block text-xl font-medium"
              >OpenAI API Key</label
            >
            <input
              id="stage-4"
              type="password"
              class="mt-6 block w-full rounded-lg p-2 px-4 bg-neutral-100 focus:outline-none placeholder:italic"
              placeholder=""
              v-model="apiKey"
              @keydown="handleInput(4, $event)"
            />
          </motion.div>
        </form>
        <button
          v-if="currentStage != 1 && !loading"
          @click="goBack"
          class="cursor-pointer bg-white mt-4 py-1 px-2 rounded-full text-neutral-500 hover:bg-neutral-300 transition delay-50 ease-in-out"
        >
          <span class="pi pi-arrow-left"></span>
        </button>
      </div>
    </motion.div>
  </div>
</template>

<style>
/* Add a simple spinner style */
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
