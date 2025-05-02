declare interface Window {
  electronAPI: {
    store: {
      addMessageToConversation: (
        message: MessageModel,
        conversationId: string,
      ) => Promise<SafeStoreOpResult<void>>;
      getMessagesFromConversation: (
        conversationId: string,
      ) => Promise<SafeStoreOpResult<MessageModel[] | null>>;
      addPersona: (persona: PersonaModel) => Promise<SafeStoreOpResult<void>>;
      getPersona: (
        personaId: string,
      ) => Promise<SafeStoreOpResult<PersonaModel | null>>;
      getAllPersona: () => Promise<SafeStoreOpResult<PersonaModel[] | null>>;
      deletePersona: (personaId: string) => Promise<SafeStoreOpResult<void>>;
      addConversation: (
        conversationModel: ConversationModel,
      ) => Promise<SafeStoreOpResult<void>>;
      getConversation: (
        conversationId: string,
      ) => Promise<SafeStoreOpResult<ConversationModel | null>>;
      getAllConversations: () => Promise<
        SafeStoreOpResult<ConversationModel[] | null>
      >;
    };
    core: {
      generateNextMessage: (conversationId: string) => Promise<void>;
      createPersona: (
        twitterHandle: string,
        maxTweets: number,
      ) => Promise<boolean>;
      attemptLogin: () => Promise<boolean>;
      handleMessageChunk: (
        callback: (conversationId: string, textPart: string) => void,
      ) => void;
    };
    secrets: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string) => Promise<void>;
    };
    isDev: () => Promise<boolean>;
    close: () => Promise<void>;
  };
}

declare interface SafeStoreOpResult<T> {
  readonly success: boolean;
  readonly message: string | null;
  readonly result: T;
}
