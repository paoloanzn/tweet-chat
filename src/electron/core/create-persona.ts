import {
  createModel,
  defaultConfig,
  Model,
  ModelProvider,
  ModelSettings,
} from "../services/ai/provider.js";
import { Context, newContext } from "../services/ai/template.js";
import { createPersonaTemplate } from "../services/ai/prompts.js";
import { getLogger } from "../services/utils/logger.js";
import { getSafeStore } from "../services/store/store.js";
import { v4 } from "uuid";
import { scrapeTwitterProfile } from "./scrape.js";

//  fixed model options
//  TODO: let the user set/modify these.
const options = {
  provider: ModelProvider.OPENAI,
  model: "gpt-4.1",
};

export interface createPersonaOptions {
  readonly twitterHandle: string;
  readonly maxTweets: number;
}

const logger = getLogger();

export const createPersona = async ({
  twitterHandle,
  maxTweets,
}: createPersonaOptions): Promise<void> => {
  const profile = await scrapeTwitterProfile(twitterHandle, maxTweets);

  const settings: ModelSettings = {
    provider: options.provider as ModelProvider,
    name: options.model,
    ...defaultConfig,
  };

  const createModelResult = createModel(settings);
  if (!createModelResult.success) {
    logger.error(`Error while creating Ai model: ${createModelResult.message}`);
    return;
  }
  const model: Model = createModelResult.model!;
  const context: Context = newContext(createPersonaTemplate);

  const generateTextResult = await model.generateText(
    context.compileTemplate({
      profile: JSON.stringify(profile, null, 2),
    }),
    null,
  );
  if (!generateTextResult.success) {
    logger.error(`Error while generating text: ${generateTextResult.message}`);
    return;
  }

  logger.info(`Successfully generated new Persona.`);

  const store = getSafeStore();
  const storeResult = store.addPersona({
    id: v4(),
    twitterHandle: twitterHandle,
    lastTweetId: profile?.tweets[0]?.id ?? null,
    twitterImgUrl: profile?.profile.avatar ?? "",
    data: generateTextResult.text,
  });
  if (!storeResult.success) {
    logger.error(storeResult.message ?? "");
  }
};
