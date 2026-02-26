import { ConditionExpression, ConditionRule, ConditionComparator } from '../types';

export class ConditionEvaluator {
  private variableResolver: (expression: string) => unknown;

  constructor(variableResolver: (expression: string) => unknown) {
    this.variableResolver = variableResolver;
  }

  evaluate(condition: ConditionExpression): boolean {
    const { operator, rules } = condition;

    if (operator === 'AND') {
      return rules.every((rule) => this.evaluateRule(rule));
    }

    if (operator === 'OR') {
      return rules.some((rule) => this.evaluateRule(rule));
    }

    return false;
  }

  private evaluateRule(rule: ConditionRule | ConditionExpression): boolean {
    if ('operator' in rule) {
      return this.evaluate(rule as ConditionExpression);
    }

    const conditionRule = rule as ConditionRule;
    const actualValue = this.variableResolver(conditionRule.variable);
    const expectedValue = conditionRule.value;
    const comparator = conditionRule.comparator;

    return this.compare(actualValue, expectedValue, comparator);
  }

  private compare(actual: unknown, expected: unknown, comparator: ConditionComparator): boolean {
    switch (comparator) {
      case 'eq':
        return actual === expected;

      case 'neq':
        return actual !== expected;

      case 'gt':
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected;

      case 'gte':
        return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;

      case 'lt':
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected;

      case 'lte':
        return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;

      case 'contains':
        return (
          typeof actual === 'string' &&
          typeof expected === 'string' &&
          actual.includes(expected)
        );

      case 'not_contains':
        return (
          typeof actual === 'string' &&
          typeof expected === 'string' &&
          !actual.includes(expected)
        );

      case 'exists':
        return actual !== undefined && actual !== null;

      case 'not_exists':
        return actual === undefined || actual === null;

      case 'regex':
        if (typeof actual === 'string' && typeof expected === 'string') {
          try {
            const regex = new RegExp(expected);
            return regex.test(actual);
          } catch {
            return false;
          }
        }
        return false;

      default:
        return false;
    }
  }
}
