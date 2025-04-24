import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, streamText } from "ai";

export enum ModelProvider {
  OPENAI = "openai",
}

export const isValidProvider = (value: string): value is ModelProvider => {
  return (<any>Object).values(ModelProvider).includes(value);
};

// right now there is a problem in supporting reasoning model
// we can't correctly write the stream to the stdout for those models
export const Models = Object.freeze({
  [ModelProvider.OPENAI]: ["gpt-4.1", "gpt-4o", "gpt-4.5"],
});

export interface ModelSettings {
  readonly provider: ModelProvider;
  readonly name: string;
  readonly temperature: number;
  readonly maxInputTokens: number;
  readonly maxOutputTokens: number;
  readonly presencePenalty: number;
  readonly frequencyPenalty: number;
}

export const defaultConfig = Object.freeze({
  temperature: 0.7,
  maxInputTokens: 200 * 1000,
  maxOutputTokens: 8 * 1000,
  presencePenalty: 0.01,
  frequencyPenalty: 0.01,
});

export interface GenerateTextResult {
  readonly success: boolean;
  readonly message: string | null;
  readonly text: string | null;
}

export interface GenerateObjectResult {
  readonly success: boolean;
  readonly message: string | null;
  readonly object: any | null;
}

export interface Model {
  readonly settings: ModelSettings;

  generateObject(prompt: string): Promise<GenerateObjectResult>;

  generateText(
    prompt: string,
    onText: ((texPart: string) => any) | null,
  ): Promise<GenerateTextResult>;
}

export interface CreateModelResult {
  readonly success: boolean;
  readonly message: string | null;
  readonly model: Model | null;
}

export const createModel = ({
  provider,
  name,
  temperature,
  maxInputTokens,
  maxOutputTokens,
  presencePenalty,
  frequencyPenalty,
}: ModelSettings): CreateModelResult => {
  if (!isValidProvider(provider)) {
    return {
      success: false,
      message: `Unsupported provider: ${provider}`,
      model: null,
    };
  }

  if (!Models[provider].includes(name)) {
    return {
      success: false,
      message: `Unsupported model name ${name} for provider ${provider}, currently supported models: ${JSON.stringify(Models[provider])}`,
      model: null,
    };
  }

  // { .... } TODO: add checks for other parameters

  const model: Model = Object.freeze({
    settings: {
      provider,
      name,
      temperature,
      maxInputTokens,
      maxOutputTokens,
      presencePenalty,
      frequencyPenalty,
    },

    generateObject: async (prompt: string) => {
      try {
        switch (provider) {
          case ModelProvider.OPENAI:
            if (!process.env.OPENAI_API_KEY) {
              return {
                success: false,
                message: "OPENAI_API_KEY is not set",
                object: null,
              };
            }
            const openai = createOpenAI({
              apiKey: process.env.OPENAI_API_KEY,
              compatibility: "strict",
            });

            const { object } = await generateObject({
              model: openai(name),
              output: "no-schema",
              prompt: prompt,
              temperature,
              maxTokens: maxOutputTokens,
              presencePenalty,
              frequencyPenalty,
            });

            return {
              success: true,
              message: null,
              object: object,
            };

          default:
            return {
              success: false,
              message: `Unsupported provider: ${provider}`,
              object: null,
            };
        }
      } catch (error: any) {
        return {
          success: false,
          message: `Error: ${error}`,
          object: null,
        };
      }
    },

    generateText: async (
      prompt: string,
      onText: ((textPart: string) => any) | null,
    ) => {
      try {
        switch (provider) {
          case ModelProvider.OPENAI:
            if (!process.env.OPENAI_API_KEY) {
              return {
                success: false,
                message: "OPENAI_API_KEY is not set",
                text: null,
              };
            }

            const openai = createOpenAI({
              apiKey: process.env.OPENAI_API_KEY,
              compatibility: "strict",
            });

            const result = streamText({
              model: openai(name),
              prompt: prompt,
              temperature,
              maxTokens: maxOutputTokens,
              presencePenalty,
              frequencyPenalty,
            });

            for await (const textPart of result.textStream) {
              // if onText is null we don't call it
              if (onText) {
                onText(textPart);
              }
            }

            return {
              success: true,
              message: null,
              text: await result.text,
            };
          default:
            return {
              success: false,
              message: `Unsupported provider: ${provider}`,
              text: null,
            };
        }
      } catch (error: any) {
        return {
          success: false,
          message: `Error: ${error}`,
          text: null,
        };
      }
    },
  });

  return {
    success: true,
    message: null,
    model: model,
  };
};
