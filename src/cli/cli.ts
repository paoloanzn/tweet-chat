import * as clack from "@clack/prompts";
import { ModelProvider, Models } from "../ai/provider";

export interface Cli {
  start(): Promise<void>;
}

export interface CliOptions {
  // Twitter settings
  readonly username: string;
  readonly maxTweets: number;

  // Ai settings
  readonly model: string;
  readonly provider: string;
}

export class Cli {
  readonly options: CliOptions;

  constructor(options: CliOptions) {
    this.options = options;
  }

  static async create(options: any): Promise<Cli> {
    const username = options?.username || String(await this.getUsername());
    const maxTweets = options?.maxTweets || (await this.getMaxTweets());
    const provider = options?.provider || String(await this.getProvider());
    const model = options?.model || String(await this.getModel(provider));
    return new Cli({
      username,
      maxTweets,
      model,
      provider,
    });
  }

  static getUsername(): Promise<string | symbol> {
    const value = clack.text({
      message: "Enter the username of the Twitter account to distill:",
      placeholder: "e.g. @elonmusk",
    });

    if (clack.isCancel(value)) {
      clack.log.error("Operation cancelled.");
      process.exit(0);
    }

    return value;
  }

  static async getMaxTweets(): Promise<number> {
    const input = await clack.text({
      message: "Enter the maximum number of tweets to distill:",
      placeholder: "e.g. 100",
    });

    if (clack.isCancel(input)) {
      clack.log.error("Operation cancelled.");
      process.exit(0);
    }

    const maxTweets = parseInt(String(input), 10);
    if (isNaN(maxTweets) || maxTweets <= 0) {
      clack.log.error(
        "Invalid number of tweets. Please enter a positive integer.",
      );
      return await this.getMaxTweets();
    }
    return Promise.resolve(maxTweets);
  }

  static getModel(provider: string): Promise<string | symbol> {
    const models = Models[provider as ModelProvider];
    const options = models.map((model: string) => ({
      value: model,
      label: model,
    }));
    const value = clack.select({
      message: "Select the AI model:",
      options,
      initialValue: models[0],
    });
    if (clack.isCancel(value)) {
      clack.log.error("Operation cancelled.");
      process.exit(0);
    }
    return value;
  }

  static getProvider(): Promise<string | symbol> {
    const options = (<any>Object)
      .values(ModelProvider)
      .map((provider: any) => ({
        value: provider,
        label: provider,
      }));
    const value = clack.select({
      message: "Select the AI model provider:",
      options,
      initialValue: ModelProvider.OPENAI,
    });
    if (clack.isCancel(value)) {
      clack.log.error("Operation cancelled.");
      process.exit(0);
    }
    return value;
  }

  async exec(callback: (options: CliOptions) => any): Promise<any> {
    return await callback(this.options);
  }
}
