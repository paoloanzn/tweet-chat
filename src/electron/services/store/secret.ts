import * as keytar from "keytar";
import * as packagejson from "../../../../package.json" with { type: "json" };

const SERVICE = packagejson.default.name ?? "tweet-chat";

export interface SecretStore {
  get(identifier: string): Promise<string | null>;
  set(identifier: string, value: string): Promise<void>;
}

const newSecretStore = (): SecretStore => {
  return Object.freeze({
    async get(identifier: string): Promise<string | null> {
      return await keytar.getPassword(SERVICE, identifier);
    },
    async set(identifier: string, value: string): Promise<void> {
      await keytar.setPassword(SERVICE, identifier, value);
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
