import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getSafeStore } from "./services/store/store.js";
import { createPersona } from "./core/create-persona.js";
import { generateNextMessage } from "./core/messages.js";
import { getSecretStore } from "./services/store/secret.js";
import { attemptLogin } from "./core/utils.js";
import { getPreloadPath } from "./pathResolver.js";
import * as packageInfo from "../../package.json" with { type: "json" };

let mainWindow: BrowserWindow | null = null;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    // @ts-ignore
    title: packageInfo.productName,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  // hide traffic lights
  mainWindow.setWindowButtonVisibility(false);
  mainWindow.setOpacity(0.97);
  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath() + "/dist/index.html"));
  }
});

const store = getSafeStore();

ipcMain.handle("store:get-store", async (_) => {
  return store;
});

ipcMain.handle(
  "store:addMessageToConversation",
  async (_, message, conversationId) => {
    return store.addMessageToConversation(message, conversationId);
  },
);

ipcMain.handle(
  "store:getMessagesFromConversation",
  async (_, conversationId) => {
    return store.getMessagesFromConversation(conversationId);
  },
);

ipcMain.handle("store:addPersona", async (_, persona) => {
  return store.addPersona(persona);
});

ipcMain.handle("store:getPersona", async (_, personaId) => {
  return store.getPersona(personaId);
});

ipcMain.handle("store:getAllPersona", async (_) => {
  return store.getAllPersona();
});

ipcMain.handle("store:deletePersona", async (_, personaId) => {
  return store.deletePersona(personaId);
});

ipcMain.handle("store:addConversation", async (_, conversationModel) => {
  return store.addConversation(conversationModel);
});

ipcMain.handle("store:getConversation", async (_, conversationId) => {
  return store.getConversation(conversationId);
});

ipcMain.handle("store:getAllConversations", async (_) => {
  return store.getAllConversations();
});

ipcMain.handle("core:createPersona", async (_, twitterHandle, maxTweets) => {
  return await createPersona({ twitterHandle, maxTweets });
});

ipcMain.handle("core:generateNextMessage", async (_, conversationId) => {
  if (!mainWindow) {
    console.error("Main window not available");
    return;
  }
  const onTextCallback = (textPart: string) => {
    // Send the text chunk back to the renderer process
    // Include conversationId so the renderer knows which conversation this chunk belongs to
    mainWindow?.webContents.send(
      "message-stream-chunk",
      conversationId,
      textPart,
    );
  };

  try {
    await generateNextMessage({ conversationId, onText: onTextCallback });
    // Optionally send a completion event if needed
    // mainWindow.webContents.send("message-stream-end", conversationId);
  } catch (error) {
    console.error("Error in generateNextMessage core:", error);
    // Optionally send an error event
    // mainWindow.webContents.send("message-stream-error", conversationId, error.message);
    throw error; // Rethrow so the renderer's catch block is triggered
  }
});

ipcMain.handle("core:attemptLogin", async (_) => {
  return await attemptLogin();
});

ipcMain.handle("secrets:get", async (_, key) => {
  return getSecretStore().get(key);
});

ipcMain.handle("secrets:set", async (_, key, value) => {
  return getSecretStore().set(key, value);
});

ipcMain.handle("app:close", async (_) => {
  return app.quit();
});
