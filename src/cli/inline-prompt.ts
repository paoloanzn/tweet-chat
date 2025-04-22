import { TextPrompt } from "@clack/core";

export const inlineText = () => {
  return new TextPrompt({
    placeholder: "Type your message here...",
    render() {
      return `> ${this.valueWithCursor}`;
    },
  });
};
