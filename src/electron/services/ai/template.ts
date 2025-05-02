export interface PromptTemplate {
  readonly text: string;
}

export interface TemplateData {
  [key: string]: string;
}

export interface Context {
  readonly template: PromptTemplate;

  compileTemplate(templateData: TemplateData): string;
}

export const newContext = (template: string | PromptTemplate): Context => {
  let promptTemplate: PromptTemplate;

  if (typeof template === "string") {
    promptTemplate = {
      text: template,
    };
  } else {
    promptTemplate = template;
  }

  const compileTemplate = (templateData: TemplateData) => {
    const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

    return promptTemplate.text.replace(
      regex,
      (match: string, varName: string) => {
        // If the variable exists in templateData, return its value; otherwise, keep the placeholder
        return varName in templateData ? templateData[varName]! : match;
      },
    );
  };

  return Object.freeze({
    template: promptTemplate,
    compileTemplate: compileTemplate,
  });
};
