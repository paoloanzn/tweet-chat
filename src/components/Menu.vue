<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from "vue";
import type {
  ConversationModel,
  PersonaModel,
} from "../electron/services/store/models"; //
import { state } from "../state"; //
import { format } from "date-fns"; // Using date-fns for better date formatting

const electronAPI = window.electronAPI; //
const isDropdownOpen = ref(false);
const isAddNewOpen = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchText = ref("");
const highlightedIndex = ref(0);
const isHistoryOpen = ref(false);

// --- Computed properties deriving from global state ---

const menuEntries = computed(() => state.personas); //
const selectedEntry = computed(() => state.activePersona); //

const filteredEntries = computed(() => {
  if (!searchText.value) return menuEntries.value;
  return menuEntries.value.filter(
    (entry) =>
      entry.twitterHandle
        ?.toLowerCase()
        .includes(searchText.value.toLowerCase()), //
  );
});

const historyItems = computed(
  () => state.getConversationsForPersona(state.activePersonaId ?? ""), //
);

// --- Methods ---

const toggleDropdown = async () => {
  isDropdownOpen.value = !isDropdownOpen.value;
  if (isDropdownOpen.value) {
    searchText.value = "";
    highlightedIndex.value = 0;
    await nextTick();
    searchInputRef.value?.focus();
  }
};

const toggleAddNew = async () => {
  isAddNewOpen.value = !isAddNewOpen.value;
  // Close dropdown if opening add new
  if (isAddNewOpen.value) {
    isDropdownOpen.value = false;
  }
};

const selectEntry = async (entry: PersonaModel) => {
  await state.setActivePersona(entry.id); // Use state action
  isDropdownOpen.value = false;
  searchText.value = "";
};

const selectConversation = async (conversationId: string) => {
  await state.setActiveConversation(conversationId); //
  isHistoryOpen.value = false; // Close history menu after selection
};

const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      if (highlightedIndex.value < filteredEntries.value.length - 1) {
        highlightedIndex.value++;
      }
      break;
    case "ArrowUp":
      e.preventDefault();
      if (highlightedIndex.value > 0) {
        highlightedIndex.value--;
      }
      break;
    case "Enter":
      e.preventDefault();
      if (filteredEntries.value.length > 0 && highlightedIndex.value >= 0) {
        selectEntry(filteredEntries.value[highlightedIndex.value]);
      }
      break;
    case "Escape":
      e.preventDefault();
      isDropdownOpen.value = false;
      break;
  }
};

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.metaKey && e.key === "p") {
    //
    e.preventDefault();
    toggleDropdown();
  }
  if (e.metaKey && e.key === "n") {
    //
    e.preventDefault();
    toggleAddNew();
  }
  if (e.metaKey && e.key === "h") {
    //
    e.preventDefault();
    toggleHistory();
  }
};

const closeDropdownOnClickOutside = (e: MouseEvent) => {
  const dropdown = document.getElementById("dropdown-menu");
  const button = document.getElementById("dropdown-button");
  if (
    isDropdownOpen.value &&
    dropdown &&
    button &&
    !dropdown.contains(e.target as Node) &&
    !button.contains(e.target as Node)
  ) {
    isDropdownOpen.value = false;
  }
};

const newTwitterHandle = ref("");
const maxTweets = ref<number>(30); //
const isNewPersonaLoading = ref<boolean>(false);

const submitNewPersona = async () => {
  if (!newTwitterHandle.value) return;
  isNewPersonaLoading.value = true;
  try {
    const success = await window.electronAPI.core.createPersona(
      //
      newTwitterHandle.value,
      maxTweets.value,
    );
    if (success) {
      // Re-fetch personas which will automatically update the active one if needed
      await state.fetchAllPersonas(); //
      // Find the newly added persona and set it active
      const newPersona = state.personas.find(
        (p) => p.twitterHandle === newTwitterHandle.value,
      );
      if (newPersona) {
        await state.setActivePersona(newPersona.id);
      }
    } else {
      console.error("Failed to create persona");
      // Handle error display to user
    }
  } catch (error) {
    console.error("Error creating persona:", error);
  } finally {
    newTwitterHandle.value = "";
    maxTweets.value = 30;
    isAddNewOpen.value = false;
    isNewPersonaLoading.value = false;
  }
};

const closeApp = async () => {
  await electronAPI.close(); //
};

const toggleHistory = () => {
  isHistoryOpen.value = !isHistoryOpen.value;
};

const closeHistoryOnClickOutside = (e: MouseEvent) => {
  const historyMenu = document.getElementById("history-menu");
  const historyButton = document.getElementById("history-button");
  if (
    isHistoryOpen.value &&
    historyMenu &&
    historyButton &&
    !historyMenu.contains(e.target as Node) &&
    !historyButton.contains(e.target as Node)
  ) {
    isHistoryOpen.value = false;
  }
};

const formatTimestamp = (timestamp: number): string => {
  return format(new Date(timestamp), "MMM d, HH:mm"); // Example format: May 1, 10:35
};

const getConversationTitle = (conversation: ConversationModel): string => {
  // Use the first user message as title, or a default if none exists
  const firstUserMessage = conversation.messages.find(
    (m) => m.sender === "user",
  ); //
  if (firstUserMessage && firstUserMessage.text) {
    return (
      firstUserMessage.text.substring(0, 30) +
      (firstUserMessage.text.length > 30 ? "..." : "")
    );
  }
  return `Conversation ${formatTimestamp(conversation.createdAt)}`; //
};

const resetCredentials = () => {
  state.requestCredentialsReset();
};

const createNewConversation = async () => {
  if (state.activePersonaId) {
    console.log(
      "Creating new conversation for persona:",
      state.activePersonaId,
    );
    await state.createConversation(state.activePersonaId);
    // Close history if open, as a new conversation is now active
    if (isHistoryOpen.value) {
      isHistoryOpen.value = false;
    }
  } else {
    console.warn("Cannot create new conversation: No active persona.");
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeydown);
  document.addEventListener("click", closeDropdownOnClickOutside);
  document.addEventListener("click", closeHistoryOnClickOutside);
  // Initial fetch if needed (though state.ts handles it now)
  // state.fetchAllPersonas();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
  document.removeEventListener("click", closeDropdownOnClickOutside);
  document.removeEventListener("click", closeHistoryOnClickOutside);
});

// Watch for changes in personas list to reset highlighted index if needed
watch(filteredEntries, () => {
  highlightedIndex.value = 0;
});
</script>

<template>
  <div class="flex w-full items-center py-6 drag-region">
    <div class="basis-1/10">
      <button @click="closeApp()">
        <span
          class="pi pi-times text-neutral-500 cursor-pointer hover:text-red-700"
        ></span>
      </button>
    </div>
    <div class="basis-8/10 relative flex justify-center">
      <div class="relative w-[80%]">
        <button
          id="dropdown-button"
          @click="toggleDropdown"
          :disabled="state.isLoadingPersonas"
          class="cursor-pointer flex flex-row justify-between items-center p-1 bg-neutral-200 w-full border-1 border-neutral-300 rounded-xl hover:bg-neutral-200"
        >
          <span
            v-if="state.isLoadingPersonas"
            class="pi pi-spin pi-spinner-dotted text-neutral-500 mr-2"
          ></span>
          <img
            v-if="selectedEntry && !state.isLoadingPersonas"
            :src="selectedEntry.twitterImgUrl"
            :alt="selectedEntry.twitterHandle"
            class="w-6 h-6 rounded-full mr-2 flex-shrink-0"
          />
          <div
            v-if="selectedEntry && !state.isLoadingPersonas"
            class="text-neutral-600 truncate"
          >
            <b>@{{ selectedEntry.twitterHandle }}</b>
          </div>
          <div
            v-else-if="!state.isLoadingPersonas"
            class="text-neutral-500 italic px-3"
          >
            No Persona Selected
          </div>

          <div
            class="text-neutral-400 text-xs border-1 border-neutral-300 bg-white rounded-lg p-1 ml-2 flex-shrink-0"
          >
            ⌘P
          </div>
        </button>

        <div
          id="dropdown-menu"
          v-if="isDropdownOpen"
          class="absolute left-0 right-0 mt-1 w-full bg-white border border-neutral-300 rounded-xl shadow-lg z-10"
        >
          <div class="p-2 border-b text-neutral-500 border-neutral-200">
            <input
              ref="searchInputRef"
              v-model="searchText"
              @keydown="handleKeyDown"
              type="text"
              placeholder="Search personas..."
              class="w-full p-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />
          </div>
          <ul class="flex-grow overflow-y-auto py-1">
            <li
              v-for="(entry, index) in filteredEntries"
              :key="entry.id"
              @click="selectEntry(entry)"
              class="flex items-center p-2 mx-1 rounded-lg cursor-pointer hover:bg-neutral-100"
              :class="{
                'bg-neutral-200 font-semibold': index === highlightedIndex,
              }"
            >
              <img
                :src="entry.twitterImgUrl"
                :alt="entry.twitterHandle"
                class="w-6 h-6 rounded-full mr-3"
              />
              <div class="text-neutral-600 truncate">
                <b>@{{ entry.twitterHandle }}</b>
              </div>
            </li>
            <li
              v-if="filteredEntries.length === 0 && !state.isLoadingPersonas"
              class="p-3 text-center text-neutral-500 italic"
            >
              No results found
            </li>
            <li
              v-if="state.isLoadingPersonas"
              class="p-3 text-center text-neutral-500 italic"
            >
              Loading...
            </li>
            <li
              @click="toggleAddNew()"
              class="flex items-center p-2 mx-1 rounded-lg cursor-pointer hover:bg-neutral-100 border-t border-neutral-200 mt-1 sticky bottom-0 bg-white"
            >
              <div
                class="w-6 h-6 rounded-full mr-3 flex items-center justify-center bg-neutral-200 text-neutral-600"
              >
                <span class="pi pi-plus text-sm"></span>
              </div>
              <div class="text-neutral-600"><b>Add new</b></div>
            </li>
            <li
              @click="resetCredentials"
              class="flex items-center p-2 mx-1 rounded-lg cursor-pointer hover:bg-neutral-100 border-neutral-200 sticky bottom-0 bg-white"
            >
              <div
                class="w-6 h-6 rounded-full mr-3 flex items-center justify-center bg-neutral-200 text-neutral-600"
              >
                <span class="pi pi-undo text-sm"></span>
              </div>
              <div class="text-neutral-600"><b>Reset Credentials</b></div>
            </li>
          </ul>
        </div>
        <div
          v-if="isAddNewOpen"
          class="absolute left-0 right-0 mt-1 w-full bg-white border border-neutral-300 text-neutral-500 rounded-xl shadow-lg z-10 p-4"
        >
          <!-- <h3 class="text-lg font-semibold mb-3 text-neutral-700">Add New Persona</h3> -->
          <form @submit.prevent="submitNewPersona" class="space-y-3">
            <div>
              <label
                for="new-handle"
                class="block text-sm font-medium text-neutral-600 mb-1"
                >Twitter Handle (@)</label
              >
              <input
                id="new-handle"
                v-model="newTwitterHandle"
                type="text"
                required
                placeholder="e.g., elonmusk"
                class="w-full p-2 border border-neutral-300 bg-neutral-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
              />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                @click="toggleAddNew()"
                class="px-4 py-1.5 bg-neutral-100 text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                v-if="!isNewPersonaLoading"
                type="submit"
                class="px-4 py-1.5 bg-neutral-500 text-white border border-neutral-600 rounded-lg hover:bg-neutral-600 transition-colors text-sm font-medium"
              >
                Create
              </button>
              <button
                v-else
                type="button"
                disabled
                class="px-4 py-1.5 bg-neutral-300 text-white border border-neutral-400 rounded-lg cursor-not-allowed text-sm font-medium inline-flex items-center"
              >
                <span class="pi pi-spin pi-spinner-dotted mr-2"></span>
                Creating...
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="basis-1/10 relative flex justify-end pr-4">
      <button
        class="flex flex-row items-center space-x-2 p-2 rounded-full hover:bg-neutral-200"
        id="new-convo-button"
        @click="createNewConversation"
        :disabled="!state.activePersonaId"
        :class="{ 'opacity-50 cursor-not-allowed': !state.activePersonaId }"
      >
        <span
          class="pi pi-plus text-neutral-500 cursor-pointer"
          :class="{ 'hover:text-emerald-500': state.activePersona }"
        ></span>
      </button>
      <button
        class="flex flex-row items-center space-x-2 p-2 rounded-full hover:bg-neutral-200"
        id="history-button"
        @click="toggleHistory"
        :disabled="!selectedEntry"
        :class="{ 'opacity-50 cursor-not-allowed': !selectedEntry }"
      >
        <span
          class="pi pi-history text-neutral-500 cursor-pointer"
          :class="{ 'hover:text-emerald-500': selectedEntry }"
        ></span>
        <div
          class="text-neutral-400 text-xs border-1 border-neutral-300 rounded-xl p-1 bg-white"
        >
          ⌘H
        </div>
      </button>
      <div
        id="history-menu"
        v-if="isHistoryOpen"
        class="absolute top-full right-1 mt-2 w-64 bg-white border border-neutral-300 rounded-xl shadow-lg z-50 max-h-[70vh] flex flex-col"
      >
        <h3
          class="text-md font-semibold p-3 border-b border-neutral-200 text-neutral-700 rounded-xl sticky top-0 bg-white"
        >
          History for @{{ selectedEntry?.twitterHandle }}
        </h3>
        <ul class="flex-grow overflow-y-auto p-1">
          <li
            v-if="state.isLoadingConversations"
            class="p-3 text-center text-neutral-500 italic"
          >
            Loading history...
          </li>
          <li
            v-else-if="historyItems.length === 0"
            class="p-3 text-center text-neutral-500 italic"
          >
            No conversations yet.
          </li>
          <li
            v-else
            v-for="item in historyItems"
            :key="item.id"
            @click="selectConversation(item.id)"
            class="p-2 mx-1 rounded-lg cursor-pointer hover:bg-neutral-100 text-left text-sm text-neutral-600 truncate"
            :class="{
              'bg-emerald-100 font-medium':
                item.id === state.activeConversationId,
            }"
            :title="getConversationTitle(item)"
          >
            {{ getConversationTitle(item) }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
