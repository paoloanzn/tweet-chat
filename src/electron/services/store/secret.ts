import * as packagejson from "../../../../package.json" with { type: "json" };
import { safeStorage } from "electron";
import Store from "electron-store";

const SERVICE = packagejson.default.name ?? "tweet-chat";

export interface SecretStore {
  get(identifier: string): Promise<string | null>;
  set(identifier: string, value: string): Promise<void>;
}

const secureStore = new Store({
  name: SERVICE,
  encryptionKey: "dummy-key", // Actual encryption handled by safeStorage
});

const newSecretStore = (): SecretStore => {
  return Object.freeze({
    async get(identifier: string): Promise<string | null> {
      const encryptedValue = secureStore.get(identifier) as string;
      if (!encryptedValue) return null;

      try {
        return safeStorage.decryptString(Buffer.from(encryptedValue, "base64"));
      } catch (error) {
        console.error("Decryption failed:", error);
        return null;
      }
    },

    async set(identifier: string, value: string): Promise<void> {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error("Secure storage is not available on this system");
      }

      const encryptedBuffer = safeStorage.encryptString(value);
      secureStore.set(identifier, encryptedBuffer.toString("base64"));
    },
  });
};

let secretStore: SecretStore | null = null;

export const getSecretStore = (): SecretStore => {
  if (!secretStore) {
    secretStore = newSecretStore();
  }
  return secretStore;
};
