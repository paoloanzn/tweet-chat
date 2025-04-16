import { getCredentials, login } from "./twitter/login";
import { distill } from "./twitter/distill";
import { getScraper } from "./twitter/scraper";
import { parseArgs } from "util";
import { getLogger } from "./utils/logger";
import type { Profile } from "agent-twitter-client";

const logger = getLogger();

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    tweets: {
      type: "string",
    },
    username: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

if (!values.username) {
  logger.error("username required.");
  process.exit(1);
}

const username = values.username;
const maxTweets = values.tweets ? parseInt(values.tweets) : 10;

const credentials = getCredentials();

if (!credentials) {
  logger.error("Error: Unable to load credentials.");
  process.exit(1);
}

const result = await login(credentials);

if (!result.success) {
  logger.error(`Error during login: ${result.message}`);
  process.exit(1);
}

(async () => {
  const profile: Profile | undefined = await getScraper().me();
  switch (profile) {
    case undefined:
      logger.warn("Unable to load logged-in user profile information.");
      break;
    default:
      const { username, name, userId } = profile;
      logger.info(
        `Successfully logged in as ${JSON.stringify({ username, name, userId }, null, 2)}`,
      );
      break;
  }
})();

const { success, message, file } = await distill({
  username,
  maxTweets,
});

if (!success) {
  logger.error(`Error: ${message}`);
  process.exit(1);
}

logger.info(`Distilled profile of @${username} saved to ${file}`);
process.exit(0);
