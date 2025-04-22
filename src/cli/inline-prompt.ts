import { TextPrompt } from "@clack/core";
import color from "picocolors";

export interface InlineTextOptions {
	placeholder?: string;
}

export const inlineText = (opts?: InlineTextOptions) => {
  return new TextPrompt({
    placeholder: opts?.placeholder,
    render() {
      const placeholder = opts?.placeholder
        ? color.inverse(opts.placeholder[0]) +
          color.dim(opts.placeholder.slice(1))
        : color.inverse(color.hidden("_"));
      const value = !this.value ? placeholder : this.valueWithCursor;
      
      switch (this.state) {
        case 'cancel':
            return color.red(`✖ ${value}`);
        default:
            return `> ${value}`;
      }
    },
  }).prompt() as Promise<string | symbol>;
};
