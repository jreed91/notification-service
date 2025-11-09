import Handlebars from 'handlebars';

export class TemplateEngine {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  private registerHelpers() {
    // Register custom helpers
    this.handlebars.registerHelper('uppercase', (str: string) => str.toUpperCase());
    this.handlebars.registerHelper('lowercase', (str: string) => str.toLowerCase());
    this.handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString();
    });
    this.handlebars.registerHelper('formatDateTime', (date: Date) => {
      return new Date(date).toLocaleString();
    });
  }

  render(template: string, variables: Record<string, any>): string {
    try {
      const compiled = this.handlebars.compile(template);
      return compiled(variables);
    } catch (error) {
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  extractVariables(template: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      // Extract variable name, removing helpers and whitespace
      const varName = match[1].trim().split(/\s+/)[0];
      if (varName && !varName.startsWith('#') && !varName.startsWith('/')) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }
}

export const templateEngine = new TemplateEngine();
