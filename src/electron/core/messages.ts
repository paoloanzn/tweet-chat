import { v4 } from "uuid";
import { chatTemplate } from "../services/ai/prompts.js";
import {
  createModel,
  defaultConfig,
  Model,
  ModelProvider,
  ModelSettings,
} from "../services/ai/provider.js";
import { Context, newContext } from "../services/ai/template.js";
import { MessageModel } from "../services/store/models.js";
import { getSafeStore } from "../services/store/store.js";
import { getLogger, timestamp } from "../services/utils/logger.js";

const logger = getLogger();

//  fixed model options
//  TODO: let the user set/modify these.
const options = {
  provider: ModelProvider.OPENAI,
  model: "gpt-4.1",
};

export interface CreateMessageOptions {
  readonly conversationId: string;
  onText(textPart: string): any;
}

const formatConversation = (messages: MessageModel[]): string => {
  let formattedConversation = "";

  messages.forEach((message: MessageModel) => {
    const formattedEntry = `(${message.timestamp})[${message.sender}] ${message.text}\n`;
    formattedConversation += formattedEntry;
  });

  return formattedConversation;
};

export const generateNextMessage = async ({
  conversationId,
  onText,
}: CreateMessageOptions): Promise<void> => {
  const store = getSafeStore();

  const {
    success: convSuccess,
    message: convMessage,
    result: conversation,
  } = store.getConversation(conversationId);
  if (!convSuccess || !conversation) {
    logger.error(
      `Error while retrieving conversation ${conversationId}: ${convMessage}`,
    );
    return;
  }

  const messages = conversation.messages;

  const personaId = conversation.personaId;
  const {
    success: personaSuccess,
    message: personaMessage,
    result: persona,
  } = store.getPersona(personaId);
  if (!personaSuccess || !persona) {
    logger.error(`Error: ${personaMessage}`);
    return;
  }

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
  const context: Context = newContext(chatTemplate);

  const generateTextResult = await model.generateText(
    context.compileTemplate({
      persona: JSON.stringify(persona.data, null, 2),
      conversation: formatConversation(messages),
    }),
    onText,
  );
  if (!generateTextResult.success || !generateTextResult.text) {
    logger.error(`Error while generating text: ${generateTextResult.message}`);
    return;
  }

  const newMessage: MessageModel = {
    id: v4(),
    sender: "assistant",
    text: generateTextResult.text,
    timestamp: timestamp(),
  };

  const { success: addMsgSuccess, message: addMsgMessage } =
    store.addMessageToConversation(newMessage, conversationId);
  if (!addMsgSuccess) {
    logger.error(`Error adding message to conversation: ${addMsgMessage}`);
  }
  return;
};
