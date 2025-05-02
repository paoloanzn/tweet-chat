export interface MessageModel {
  readonly sender: "user" | "assistant";
  readonly text: string;
  readonly timestamp: number;
  readonly id: string;
}

export interface PersonaModel {
  readonly id: string;
  readonly twitterHandle: string;
  readonly twitterImgUrl: string;
  readonly lastTweetId: string | null;
  readonly data: any;
}

export interface ConversationModel {
  readonly id: string;
  createdAt: number;
  updatedAt: number;
  messages: MessageModel[];
  readonly personaId: string;
}
