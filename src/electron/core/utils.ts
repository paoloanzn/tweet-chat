import {
  getCredentials,
  login,
  TwitterCredentials,
} from "../services/twitter/login.js";
import { getLogger } from "../services/utils/logger.js";

const logger = getLogger();

export const attemptLogin = async (): Promise<boolean> => {
  const credentials: TwitterCredentials | null = await getCredentials();
  if (!credentials) {
    return false;
  }

  const loginResult = await login(credentials);
  if (!loginResult.success) {
    logger.error(`Error during login: ${loginResult.message}`);
    return false;
  }

  return true;
};
