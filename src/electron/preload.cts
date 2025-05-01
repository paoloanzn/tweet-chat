const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  store: {
    getMessagesFromConversation: (conversationId: string) =>
      electron.ipcRenderer.invoke(
        "store:getMessagesFromConversation",
        conversationId,
      ),
    addMessageToConversation: (message: any, conversationId: string) =>
      electron.ipcRenderer.invoke(
        "store:addMessageToConversation",
        message,
        conversationId,
      ),
    addPersona: (persona: any) =>
      electron.ipcRenderer.invoke("store:addPersona", persona),
    getPersona: (personaId: string) =>
      electron.ipcRenderer.invoke("store:getPersona", personaId),
    getAllPersona: () => electron.ipcRenderer.invoke("store:getAllPersona"),
    deletePersona: (personaId: string) =>
      electron.ipcRenderer.invoke("store:deletePersona", personaId),
    addConversation: (conversationModel: any) =>
      electron.ipcRenderer.invoke("store:addConversation", conversationModel),
    getConversation: (conversationId: string) =>
      electron.ipcRenderer.invoke("store:getConversation", conversationId),
    getAllConversations: () =>
      electron.ipcRenderer.invoke("store:getAllConversations"),
  },
  core: {
    createPersona: (twitterHandle: string, maxTweets: number) =>
      electron.ipcRenderer.invoke(
        "core:createPersona",
        twitterHandle,
        maxTweets,
      ),
    generateNextMessage: (conversationId: string) =>
      electron.ipcRenderer.invoke("core:generateNextMessage", conversationId),
    attemptLogin: () => electron.ipcRenderer.invoke("core:attemptLogin"),
    handleMessageChunk: (
      callback: (conversationId: string, textPart: string) => void,
    ) => {
      const listener = (
        _event: Event,
        conversationId: string,
        textPart: string,
      ) => {
        callback(conversationId, textPart);
      };
      // Add the listener for the specific channel
      electron.ipcRenderer.on("message-stream-chunk", listener);

      // Return a function to remove the listener (important for cleanup)
      return () => {
        electron.ipcRenderer.removeListener("message-stream-chunk", listener);
      };
    },
  },
  secrets: {
    get: (key: string) => electron.ipcRenderer.invoke("secrets:get", key),
    set: (key: string, value: string) =>
      electron.ipcRenderer.invoke("secrets:set", key, value),
  },
  isDev: () => electron.ipcRenderer.invoke("is-dev"),
  close: () => electron.ipcRenderer.invoke("app:close"),
});
