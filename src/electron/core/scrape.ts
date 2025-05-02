import { distill, type DistilledProfile } from "../services/twitter/distill.js";
import {
  getCredentials,
  login,
  type TwitterCredentials,
} from "../services/twitter/login.js";
import { getLogger } from "../services/utils/logger.js";

const logger = getLogger();

export const scrapeTwitterProfile = async (
  twitterHandle: string,
  maxTweets: number,
): Promise<DistilledProfile | null> => {
  const credentials: TwitterCredentials | null = await getCredentials();
  if (!credentials) {
    return null;
  }

  const loginResult = await login(credentials);
  if (!loginResult.success) {
    logger.error(`Error during login: ${loginResult.message}`);
    return null;
  }

  const distillResult = await distill({ username: twitterHandle, maxTweets });
  if (!distillResult.success) {
    logger.error(`Error during distillation: ${distillResult.message}`);
    return null;
  }

  logger.info(`Distilled profile of @${twitterHandle}`);
  return distillResult.profile;
};
