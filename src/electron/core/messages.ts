// src/electron/core/messages.ts
import { v4 } from "uuid";
import { chatTemplate } from "../services/ai/prompts.js";
import {
  createModel,
  defaultConfig,
  type Model,
  ModelProvider,
  type ModelSettings,
} from "../services/ai/provider.js";
import { type Context, newContext } from "../services/ai/template.js";
import { type MessageModel } from "../services/store/models.js";
import { getSafeStore } from "../services/store/store.js";
import { getLogger } from "../services/utils/logger.js";

const logger = getLogger();

//  fixed model options
//  TODO: let the user set/modify these.
const modelOptions = {
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

// Ensure the function signature still expects the object
export const generateNextMessage = async (
  options: CreateMessageOptions, // Receive the whole options object
): Promise<void> => {
  // Destructure here OR access directly via options.conversationId / options.onText
  const { conversationId, onText } = options;
  const store = getSafeStore();

  // *** FIX: Explicitly use the conversationId string ***
  const {
    success: convSuccess,
    message: convMessage,
    result: conversation,
  } = store.getConversation(conversationId); // Use the destructured string ID

  if (!convSuccess || !conversation) {
    // Log the string ID for clarity
    logger.error(
      `Error while retrieving conversation ID "${conversationId}": ${convMessage}`,
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
    // Use personaId string in log
    logger.error(
      `Error retrieving persona ID "${personaId}": ${personaMessage}`,
    );
    return;
  }

  const settings: ModelSettings = {
    provider: modelOptions.provider as ModelProvider, // Assuming modelOptions comes from elsewhere or should be part of CreateMessageOptions
    name: modelOptions.model, // Assuming options comes from elsewhere or should be part of CreateMessageOptions
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
    onText, // Pass the destructured onText callback
  );
  if (!generateTextResult.success || !generateTextResult.text) {
    logger.error(`Error while generating text: ${generateTextResult.message}`);
    return;
  }

  const newMessage: MessageModel = {
    id: v4(),
    sender: "assistant",
    text: generateTextResult.text,
    timestamp: Date.now(),
  };

  // Use the string conversationId here too
  const { success: addMsgSuccess, message: addMsgMessage } =
    store.addMessageToConversation(newMessage, conversationId);
  if (!addMsgSuccess) {
    logger.error(`Error adding message to conversation: ${addMsgMessage}`);
  }
  return;
};
