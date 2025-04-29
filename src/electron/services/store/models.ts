export interface MessageModel {
  readonly sender: "user" | "assistant";
  readonly text: string;
  readonly timestamp: string;
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
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly messages: MessageModel[];
  readonly personaId: string;
}
