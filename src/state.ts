import { reactive, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import type {
  ConversationModel,
  MessageModel,
  PersonaModel,
} from "./electron/services/store/models";

const store = window.electronAPI.store;

export interface AppState {
  // --- Reactive State ---
  activePersonaId: string | null;
  activeConversationId: string | null;
  personas: PersonaModel[];
  conversations: ConversationModel[];
  isLoadingPersonas: boolean;
  isLoadingConversations: boolean;
  activePersona: PersonaModel | null;
  activeConversation: ConversationModel | null;

  // --- Actions ---
  fetchAllPersonas: () => Promise<void>;
  fetchAllConversations: () => Promise<void>;
  setActivePersona: (personaId: string | null) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => Promise<void>;
  createConversation: (personaId: string) => Promise<ConversationModel | null>;
  addMessageToActiveConversation: (
    message: MessageModel,
    options?: { persist?: boolean },
  ) => Promise<void>;
  updateLastMessageInActiveConversation: (streamedText: string) => void;
  getPersonaById: (id: string) => PersonaModel | undefined;
  getConversationsForPersona: (personaId: string) => ConversationModel[];
}

export const state = reactive<AppState>({
  // --- State ---
  activePersonaId: null,
  activeConversationId: null,
  personas: [],
  conversations: [],
  isLoadingPersonas: false,
  isLoadingConversations: false,
  activePersona: null,
  activeConversation: null,

  // --- Actions ---
  async fetchAllPersonas() {
    this.isLoadingPersonas = true;
    try {
      const { success, result } = await store.getAllPersona();
      if (success && result) {
        this.personas = result;
        // If no active persona or the active one is no longer valid, select the first one
        if (
          (!this.activePersonaId ||
            !this.personas.find((p) => p.id === this.activePersonaId)) &&
          this.personas.length > 0
        ) {
          await this.setActivePersona(this.personas[0].id);
        } else if (this.personas.length === 0) {
          await this.setActivePersona(null);
        }
      } else {
        this.personas = [];
        await this.setActivePersona(null);
        console.error("Failed to fetch personas");
      }
    } catch (error) {
      console.error("Error fetching personas:", error);
      this.personas = [];
      await this.setActivePersona(null);
    } finally {
      this.isLoadingPersonas = false;
    }
  },

  async fetchAllConversations() {
    this.isLoadingConversations = true;
    try {
      const { success, result } = await store.getAllConversations();
      if (success && result) {
        this.conversations = result;
        // If no active conversation or the active one is no longer valid for the current persona, select the most recent one for this persona
        const currentPersonaConversations = this.getConversationsForPersona(
          this.activePersonaId ?? "",
        );
        if (
          (!this.activeConversationId ||
            !currentPersonaConversations.find(
              (c) => c.id === this.activeConversationId,
            )) &&
          currentPersonaConversations.length > 0
        ) {
          // Sort by updatedAt descending to get the most recent
          currentPersonaConversations.sort((a, b) => b.updatedAt - a.updatedAt);
          await this.setActiveConversation(currentPersonaConversations[0].id);
        } else if (currentPersonaConversations.length === 0) {
          await this.setActiveConversation(null);
        }
      } else {
        this.conversations = [];
        await this.setActiveConversation(null);
        console.error("Failed to fetch conversations");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      this.conversations = [];
      await this.setActiveConversation(null);
    } finally {
      this.isLoadingConversations = false;
    }
  },

  async setActivePersona(personaId: string | null) {
    if (this.activePersonaId === personaId) return;
    this.activePersonaId = personaId;
    this.activePersona = this.personas.find((p) => p.id === personaId) ?? null;
    // When persona changes, reset active conversation and fetch relevant conversations
    await this.setActiveConversation(null);
    await this.fetchAllConversations(); // Re-fetch or re-filter conversations for the new persona
  },

  async setActiveConversation(conversationId: string | null) {
    if (this.activeConversationId === conversationId) return;
    this.activeConversationId = conversationId;
    this.activeConversation =
      this.conversations.find((c) => c.id === conversationId) ?? null;
  },

  async createConversation(
    personaId: string,
  ): Promise<ConversationModel | null> {
    const newConversation: ConversationModel = {
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      personaId: personaId,
    };
    const { success, message } = await store.addConversation(newConversation);
    if (!success) {
      console.error("Failed to create conversation:", message);
      return null;
    }
    this.conversations.push(newConversation);
    await this.setActiveConversation(newConversation.id);
    return newConversation;
  },

  async addMessageToActiveConversation(
    message: MessageModel,
    options: { persist?: boolean } = { persist: true }, // Default persist to true
  ) {
    const persistMessage = options.persist ?? true; // Get persist flag

    if (!this.activeConversation) return;

    const conversationIndex = this.conversations.findIndex(
      (c) => c.id === this.activeConversationId,
    );
    if (conversationIndex === -1) return;

    // Optimistically add message to local state
    const updatedMessages = [...this.conversations[conversationIndex].messages];

    if (updatedMessages.length >= 30) {
      // MESSAGE_LIMIT
      updatedMessages.shift(); // Remove the oldest message
    }
    updatedMessages.push(message);

    // Update local state immediately
    this.conversations[conversationIndex].messages = updatedMessages;
    this.conversations[conversationIndex].updatedAt = Date.now(); //
    if (
      this.activeConversation.id === this.conversations[conversationIndex].id
    ) {
      this.activeConversation = { ...this.conversations[conversationIndex] };
    }

    // --- Only persist if the flag is true ---
    if (persistMessage) {
      console.log(
        `Persisting message (ID: ${message.id}, Sender: ${message.sender}) to store.`,
      );
      // Persist change in the backend store
      const { success, message: errMsg } = await store.addMessageToConversation(
        message,
        this.activeConversationId!,
      ); //
      if (!success) {
        console.error("Failed to add message to store:", errMsg);
        // Optionally revert the optimistic update here if needed
      }
    } else {
      console.log(
        `Adding message (ID: ${message.id}, Sender: ${message.sender}) to local state only (placeholder).`,
      );
    }
  },

  // Method to handle streamed text updates for the last message
  updateLastMessageInActiveConversation(streamedText: string) {
    if (!this.activeConversation) return;

    const conversationIndex = this.conversations.findIndex(
      (c) => c.id === this.activeConversationId,
    );
    if (conversationIndex === -1) return;

    const messages = this.conversations[conversationIndex].messages;
    if (
      messages.length === 0 ||
      messages[messages.length - 1].sender !== "assistant"
    ) {
      // This case shouldn't normally happen if addMessageToActiveConversation was called first for the assistant
      console.warn(
        "Trying to update last message, but it's not from the assistant or doesn't exist.",
      );
      // Optionally create a new assistant message shell here if needed
      const assistantMessage: MessageModel = {
        id: uuidv4(), //
        sender: "assistant", //
        text: streamedText, //
        timestamp: Date.now(), //
      };
      this.addMessageToActiveConversation(assistantMessage); // Add it using the existing method
      return;
    }

    // Update the text of the last message (which should be the assistant's)
    messages[messages.length - 1] = {
      ...messages[messages.length - 1],
      text: messages[messages.length - 1].text + streamedText, // Append streamed part
    };

    // Update local state
    this.conversations[conversationIndex].messages = [...messages]; // Ensure reactivity
    this.conversations[conversationIndex].updatedAt = Date.now();
    // Ensure the activeConversation reference is updated
    if (
      this.activeConversation.id === this.conversations[conversationIndex].id
    ) {
      this.activeConversation = { ...this.conversations[conversationIndex] };
    }
  },

  // --- Getters (Computed properties essentially) ---
  getPersonaById(id: string): PersonaModel | undefined {
    return this.personas.find((p) => p.id === id);
  },

  getConversationsForPersona(personaId: string): ConversationModel[] {
    if (!personaId) return [];
    return this.conversations
      .filter((c) => c.personaId === personaId)
      .sort((a, b) => b.updatedAt - a.updatedAt); // Sort by most recent first
  },
});

// Initial data fetch
state.fetchAllPersonas();
// fetchAllConversations will be called automatically when activePersonaId changes

// Watchers to keep activePersona and activeConversation objects updated
watch(
  () => state.activePersonaId,
  (newId) => {
    state.activePersona = state.personas.find((p) => p.id === newId) ?? null;
  },
);

watch(
  () => state.activeConversationId,
  (newId) => {
    state.activeConversation =
      state.conversations.find((c) => c.id === newId) ?? null;
  },
);
