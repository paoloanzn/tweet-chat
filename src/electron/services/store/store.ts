import Store from "electron-store";
import type { ConversationModel, MessageModel, PersonaModel } from "./models.js";

const MESSAGE_LIMIT = 30;

// automatically load json store if present on disk or create if not
let store: Store | null = null;
const getStore = (): Store => {
  if (!store) {
    store = new Store();
  }
  return store;
};

export interface SafeStoreOpResult<T> {
  readonly success: boolean;
  readonly message: string | null;
  readonly result: T;
}

// defines fixed saved operations which can be performed across the application
export interface SafeStore {
  addMessageToConversation(
    message: MessageModel,
    conversationId: string,
  ): SafeStoreOpResult<void>;
  getMessagesFromConversation(
    conversationId: string,
  ): SafeStoreOpResult<MessageModel[] | null>;
  addPersona(persona: PersonaModel): SafeStoreOpResult<void>;
  getPersona(personaId: string): SafeStoreOpResult<PersonaModel | null>;
  getAllPersona(): SafeStoreOpResult<PersonaModel[] | null>;
  deletePersona(personaId: string): SafeStoreOpResult<void>;
  addConversation(
    conversationModel: ConversationModel,
  ): SafeStoreOpResult<void>;
  getConversation(
    conversationId: string,
  ): SafeStoreOpResult<ConversationModel | null>;
  getAllConversations(): SafeStoreOpResult<ConversationModel[] | null>;
}

const createSafeStore = (): SafeStore => {
  return Object.freeze({
    addMessageToConversation: (
      message: MessageModel,
      conversationId: string,
    ): SafeStoreOpResult<void> => {
      try {
        const store = getStore();
        let conversations = store.get(
          "conversations",
          [],
        ) as ConversationModel[];
        const conversation = conversations.find((c) => c.id === conversationId);

        if (!conversation) {
          return {
            success: false,
            message: "Conversation not found",
            result: undefined,
          };
        }

        // Enforce message limit before adding new message
        if (conversation.messages.length >= MESSAGE_LIMIT) {
          // Remove the oldest message (first in array)
          conversation.messages.shift();
        }

        conversation.messages.push(message);

        store.set("conversations", conversations);
        return { success: true, message: null, result: undefined };
      } catch (error) {
        return {
          success: false,
          message: `${JSON.stringify(error)}`,
          result: undefined,
        };
      }
    },

    getMessagesFromConversation: (
      conversationId: string,
    ): SafeStoreOpResult<MessageModel[] | null> => {
      try {
        const store = getStore();
        const conversations = store.get(
          "conversations",
          [],
        ) as ConversationModel[];
        const conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation) {
          return {
            success: false,
            message: "Conversation not found",
            result: null,
          };
        }
        return { success: true, message: null, result: conversation.messages };
      } catch (error) {
        return {
          success: false,
          message: `${JSON.stringify(error)}`,
          result: null,
        };
      }
    },

    addPersona: (persona: PersonaModel): SafeStoreOpResult<void> => {
      try {
        const store = getStore();
        let personas = store.get("personas", []) as PersonaModel[];
        if (personas.some((p) => p.id === persona.id)) {
          return {
            success: false,
            message: "Persona already exists",
            result: undefined,
          };
        }
        personas.push(persona);
        store.set("personas", personas);
        return { success: true, message: null, result: undefined };
      } catch (error) {
        return {
          success: false,
          message: `${JSON.stringify(error)}`,
          result: undefined,
        };
      }
    },

    getPersona: (personaId: string): SafeStoreOpResult<PersonaModel | null> => {
      try {
        const store = getStore();
        const personas = store.get("personas", []) as PersonaModel[];
        const persona = personas.find((p) => p.id === personaId);

        if (!persona) {
          return {
            success: false,
            message: `Persona ${personaId} not found`,
            result: null,
          };
        }

        return {
          success: true,
          message: null,
          result: persona,
        };
      } catch (error) {
        return {
          success: false,
          message: JSON.stringify(error),
          result: null,
        };
      }
    },

    getAllPersona: (): SafeStoreOpResult<PersonaModel[] | null> => {
      try {
        const store = getStore();
        const personas = store.get("personas", []) as PersonaModel[];
        return { success: true, message: null, result: personas };
      } catch (error) {
        return {
          success: false,
          message: `${JSON.stringify(error)}`,
          result: null,
        };
      }
    },

    deletePersona: (personaId: string): SafeStoreOpResult<void> => {
      try {
        const store = getStore();
        let personas = store.get("personas", []) as PersonaModel[];
        const index = personas.findIndex((p) => p.id === personaId);
        if (index === -1) {
          return {
            success: false,
            message: "Persona not found",
            result: undefined,
          };
        }
        personas.splice(index, 1);
        store.set("personas", personas);
        // Remove all conversations associated with this persona
        let conversations = store.get(
          "conversations",
          [],
        ) as ConversationModel[];
        conversations = conversations.filter((c) => c.personaId !== personaId);
        store.set("conversations", conversations);
        return { success: true, message: null, result: undefined };
      } catch (error) {
        return {
          success: false,
          message: `${JSON.stringify(error)}`,
          result: undefined,
        };
      }
    },

    addConversation: (
      conversationModel: ConversationModel,
    ): SafeStoreOpResult<void> => {
      try {
        const store = getStore();
        let conversations = store.get(
          "conversations",
          [],
        ) as ConversationModel[];
        if (conversations.some((c) => c.id === conversationModel.id)) {
          return {
            success: false,
            message: "Conversation already exists",
            result: undefined,
          };
        }
        conversations.push(conversationModel);
        store.set("conversations", conversations);
        return { success: true, message: null, result: undefined };
      } catch (error) {
        return {
          success: false,
          message: `${JSON.stringify(error)}`,
          result: undefined,
        };
      }
    },

    getAllConversations: (): SafeStoreOpResult<ConversationModel[] | null> => {
      try {
        const store = getStore();
        const conversations = store.get(
          "conversations",
          [],
        ) as ConversationModel[];
        return { success: true, message: null, result: conversations };
      } catch (error) {
        return {
          success: false,
          message: `${JSON.stringify(error)}`,
          result: null,
        };
      }
    },

    getConversation: (
      conversationId: string,
    ): SafeStoreOpResult<ConversationModel | null> => {
      try {
        const store = getStore();
        const conversations = store.get(
          "conversations",
          [],
        ) as ConversationModel[];
        const conversation = conversations.find((c) => c.id === conversationId);

        if (!conversation) {
          return {
            success: false,
            message: `Conversation ${conversationId} not found`,
            result: null,
          };
        }

        return {
          success: true,
          message: null,
          result: conversation,
        };
      } catch (error) {
        return {
          success: false,
          message: JSON.stringify(error),
          result: null,
        };
      }
    },
  });
};

let safeStore: SafeStore | null = null;

export const getSafeStore = (): SafeStore => {
  if (!safeStore) {
    safeStore = createSafeStore();
  }
  return safeStore;
};
