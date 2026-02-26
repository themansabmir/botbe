import { SessionDocument, ContactDocument, FlowDocument } from '../types';

export interface ResolverContext {
  session: SessionDocument;
  contact: ContactDocument;
  flow: FlowDocument;
}

export class VariableResolver {
  private context: ResolverContext;

  constructor(context: ResolverContext) {
    this.context = context;
  }

  resolve(template: string): string {
    if (typeof template !== 'string') {
      return String(template);
    }

    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      const value = this.resolveExpression(expression.trim());
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  resolveExpression(expression: string): unknown {
    const parts = expression.split('.');
    const scope = parts[0];

    if (scope === 'session') {
      return this.resolveFromObject(this.context.session.variables, parts.slice(1));
    }

    if (scope === 'contact') {
      return this.resolveFromObject(this.context.contact, parts.slice(1));
    }

    if (scope === 'flow') {
      return this.resolveFromObject(this.context.flow, parts.slice(1));
    }

    if (scope === 'system') {
      return this.resolveSystemVariable(parts[1]);
    }

    return undefined;
  }

  private resolveFromObject(obj: any, path: string[]): unknown {
    let current = obj;

    for (const key of path) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private resolveSystemVariable(variable?: string): unknown {
    if (!variable) {
      return undefined;
    }

    switch (variable) {
      case 'now':
        return new Date().toISOString();
      case 'today':
        return new Date().toISOString().split('T')[0];
      case 'timestamp':
        return Date.now();
      default:
        return undefined;
    }
  }

  getValue(expression: string): unknown {
    return this.resolveExpression(expression);
  }
}
