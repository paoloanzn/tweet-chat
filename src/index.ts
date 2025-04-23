import {
  getCredentials,
  login,
  type TwitterCredentials,
} from "./twitter/login";
import { distill, type DistillResult } from "./twitter/distill";
import { getScraper } from "./twitter/scraper";
import { parseArgs } from "util";
import type { Profile } from "agent-twitter-client";
import {
  createModel,
  defaultConfig,
  ModelProvider,
  type Model,
  type ModelSettings,
} from "./ai/provider";
import { newContext, type Context } from "./ai/template";
import { Cli } from "./cli/cli";
import { log, spinner, intro, isCancel, text } from "@clack/prompts";
import { version } from "../package.json";
import chalk from "chalk";
import { inlineText } from "./cli/inline-prompt";
import { createCache, type Cache } from "./utils/cache";
import path from "path";
import os from "os";
import { addOrUpdateEnvVariable } from "./utils/env";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    tweets: {
      type: "string",
    },
    username: {
      type: "string",
    },
    scrape: {
      type: "boolean",
      default: false,
    },
    "no-cache": {
      type: "boolean",
      default: false,
    },
  },
  strict: true,
  allowPositionals: true,
});

const cliOptions = {
  username: values.username,
  maxTweets: values.tweets ? parseInt(values.tweets) : 10,
};

intro(chalk.bgCyan(`Tweet-chat-v${version}`));

const cli = await Cli.create(cliOptions);

const cachePath =
  Bun.env.NODE_ENV === "development"
    ? "."
    : path.join(os.homedir(), ".cache/tweet-chat");
const cache: Cache = createCache(cachePath);
log.success(`loaded cache from ${cache.path()}`);

await cli.exec(async () => {
  const credentials: TwitterCredentials =
    getCredentials() ||
    (await (async (): Promise<TwitterCredentials> => {
      const username = await text({
        message: "Enter your Twitter username:",
        placeholder: "e.g. elonmusk (No @ symbol)",
      });
      const password = await text({
        message: "Enter your Twitter password:",
        placeholder: "e.g. mypassword",
      });
      const email = await text({
        message: "Enter your Twitter email:",
      });
      if (isCancel(username) || isCancel(password) || isCancel(email)) {
        log.error("Operation cancelled.");
        process.exit(1);
      }

      addOrUpdateEnvVariable("TWITTER_USERNAME", String(username));
      addOrUpdateEnvVariable("TWITTER_PASSWORD", String(password));
      addOrUpdateEnvVariable("TWITTER_EMAIL", String(email));

      return {
        username: String(username),
        password: String(password),
        email: String(email),
        cookies: null,
      };
    })());

  const s = spinner();
  s.start("Logging in...");

  const result = await login(credentials);
  if (!result.success) {
    s.stop("Error during login");
    log.error(`Error during login: ${result.message}`);
    process.exit(1);
  }

  s.stop("Logged in successfully");
});

await cli.exec(async () => {
  const profile: Profile | undefined = await getScraper().me();
  if (!profile) {
    log.warn("Unable to load logged-in user profile information.");
  } else {
    const { username } = profile;
    log.success(`Successfully logged in as @${username}`);
  }
});

const { file, profile }: DistillResult = await cli.exec(async (options) => {
  const { username, maxTweets } = options;

  const s = spinner();
  s.start("Distilling tweets...");

  const result = await distill({
    username,
    maxTweets,
  });

  if (!result.success) {
    s.stop("Error during distillation");
    log.error(`Error during distillation: ${result.message}`);
    process.exit(1);
  }

  s.stop("Distillation complete");
  log.success(`Distilled profile of @${username} saved to ${result.file}`);
  return result;
});

if (values.scrape) {
  process.exit(0);
}

const persona: string = await cli.exec(async (options) => {
  const cachedPersona = cache.get("persona");
  if (cachedPersona && !values["no-cache"]) {
    try {
      const parsedPersona: any = JSON.parse(cachedPersona);
      const { username } = options;

      if (
        parsedPersona?.username &&
        parsedPersona?.username === username &&
        parsedPersona?.lastTweetId === profile?.tweets[0]?.id
      ) {
        log.success("Using cached persona.");
        return parsedPersona.data as string;
      }
    } catch (error) {
      log.error("Error while parsing cached persona.");
      log.error(`Error: ${error}`);
      log.info("Generating new persona.");
    }
  }

  const createPersonaTemplate = `
# TASK
Given this JSON file containing account information and scraped tweets from a twitter account.
Analyze the content and create a JSON file to represent which represent a persona of that account.
Keep in mind the JSON file will be use to prompt another LLM so the user will be able to "chat" with a specific twitter account.

# JSON FILE
\`\`\`
{{ profile }}
\`\`\`

# IMPORTANT:
OUTPUT ONLY THE JSON FILE, nothing else.
`;

  const settings: ModelSettings = {
    provider: options.provider as ModelProvider,
    name: options.model,
    ...defaultConfig,
  };

  const createModelResult = createModel(settings);
  if (!createModelResult.success) {
    log.error(`Error while creating Ai model: ${createModelResult.message}`);
    process.exit(1);
  }
  const model: Model = createModelResult.model!;
  const context: Context = newContext(createPersonaTemplate);
  const s = spinner();
  s.start("Generating persona...");
  const generateTextResult = await model.generateText(
    context.compileTemplate({
      profile: JSON.stringify(profile, null, 2),
    }),
    null,
  );
  if (!generateTextResult.success) {
    s.stop("Error during persona generation");
    log.error(`Error while generating text: ${generateTextResult.message}`);
    process.exit(1);
  }

  s.stop("Persona generation complete");
  log.success(`Successfully generated new Persona.`);

  cache.save(
    "persona",
    JSON.stringify({
      username: options.username,
      lastTweetId: profile?.tweets[0]?.id,
      data: generateTextResult.text,
    }),
  );

  return generateTextResult.text;
});

await cli.exec(async (options) => {
  log.info(chalk.cyanBright("Chat started!"));
  const chatTemplate = `
# You are an AI model that impersonates a Twitter account. You will be given a JSON file representing the persona of that account and a message conversation.

# TASK
Your job is to produce the next message in the conversation, strictly following the persona given to you and NEVER breaking character.
Don't overact or be too verbose, just answer the question.
Don't act as an assistant, just act as the account you are impersonating, remembering that you are a human being.

# PERSONA
\`\`\`
{{ persona }}
\`\`\`
# CONVERSATION
\`\`\`
{{ conversation }}
\`\`\`

# IMPORTANT:
OUTPUT ONLY THE NEXT MESSAGE IN PLAIN TEXT, nothing else.
`;

  const conversation = new Array<string>();

  const settings: ModelSettings = {
    provider: options.provider as ModelProvider,
    name: options.model,
    ...defaultConfig,
  };
  const createModelResult = createModel(settings);
  if (!createModelResult.success) {
    log.error(`Error while creating Ai model: ${createModelResult.message}`);
    process.exit(1);
  }
  const model: Model = createModelResult.model!;

  const context = newContext(chatTemplate);

  while (true) {
    const input = await inlineText(
      conversation.length <= 0
        ? { placeholder: "Type your message...", prompt: "you" }
        : { prompt: "you" },
    );
    if (input === "") {
      break;
    }

    if (isCancel(input)) {
      log.error("Operation cancelled.");
      process.exit(0);
    }

    conversation.push(`User: ${String(input)}`);

    process.stdout.write(chalk.cyan(`${options.username} > `));
    const generateTextResult = await model.generateText(
      context.compileTemplate({
        persona: persona,
        conversation: conversation.join("\n"),
      }),
      (textPart: string) => {
        process.stdout.write(chalk.cyan(textPart));
      },
    );
    process.stdout.write("\n");
    if (!generateTextResult.success) {
      log.error(`Error while generating text: ${generateTextResult.message}`);
      process.exit(1);
    }
    conversation.push(`@${options.username}: ${generateTextResult.text}`);
  }
});
