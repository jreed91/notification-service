import { templateEngine } from '../utils/templateEngine';

describe('TemplateEngine', () => {
  describe('render', () => {
    it('should render a simple template with variables', () => {
      const template = 'Hello {{name}}!';
      const variables = { name: 'John' };
      const result = templateEngine.render(template, variables);
      expect(result).toBe('Hello John!');
    });

    it('should render multiple variables', () => {
      const template = 'Hi {{name}}, your order #{{orderNumber}} is {{status}}.';
      const variables = {
        name: 'Alice',
        orderNumber: '12345',
        status: 'shipped',
      };
      const result = templateEngine.render(template, variables);
      expect(result).toBe('Hi Alice, your order #12345 is shipped.');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}!';
      const variables = {};
      const result = templateEngine.render(template, variables);
      expect(result).toBe('Hello !');
    });

    it('should apply uppercase helper', () => {
      const template = '{{uppercase name}}';
      const variables = { name: 'john' };
      const result = templateEngine.render(template, variables);
      expect(result).toBe('JOHN');
    });

    it('should apply lowercase helper', () => {
      const template = '{{lowercase name}}';
      const variables = { name: 'JOHN' };
      const result = templateEngine.render(template, variables);
      expect(result).toBe('john');
    });
  });

  describe('extractVariables', () => {
    it('should extract simple variables', () => {
      const template = 'Hello {{name}}!';
      const variables = templateEngine.extractVariables(template);
      expect(variables).toEqual(['name']);
    });

    it('should extract multiple variables', () => {
      const template = 'Hi {{name}}, your order #{{orderNumber}} is {{status}}.';
      const variables = templateEngine.extractVariables(template);
      expect(variables).toEqual(['name', 'orderNumber', 'status']);
    });

    it('should extract unique variables', () => {
      const template = 'Hello {{name}}, how are you {{name}}?';
      const variables = templateEngine.extractVariables(template);
      expect(variables).toEqual(['name']);
    });

    it('should ignore helper variables', () => {
      const template = '{{uppercase name}}';
      const variables = templateEngine.extractVariables(template);
      expect(variables).toEqual(['uppercase']);
    });
  });
});
