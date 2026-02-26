import { describe, it, expect, beforeEach } from 'vitest';
import { ConditionEvaluator } from './evaluator';
import { ConditionExpression } from '../types';

describe('ConditionEvaluator', () => {
  let evaluator: ConditionEvaluator;
  let mockVariables: Record<string, unknown>;

  beforeEach(() => {
    mockVariables = {
      'session.name': 'John Doe',
      'session.age': 25,
      'session.city': 'New York',
      'session.score': 85,
      'session.status': 'active',
      'session.email': 'john@example.com',
    };

    const resolver = (expression: string) => mockVariables[expression];
    evaluator = new ConditionEvaluator(resolver);
  });

  describe('Simple comparisons', () => {
    it('should evaluate eq (equal) correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.name',
            comparator: 'eq',
            value: 'John Doe',
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate neq (not equal) correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.name',
            comparator: 'neq',
            value: 'Jane Doe',
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate gt (greater than) correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.age',
            comparator: 'gt',
            value: 20,
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate gte (greater than or equal) correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.age',
            comparator: 'gte',
            value: 25,
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate lt (less than) correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.age',
            comparator: 'lt',
            value: 30,
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate lte (less than or equal) correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.age',
            comparator: 'lte',
            value: 25,
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate contains correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.city',
            comparator: 'contains',
            value: 'York',
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate not_contains correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.city',
            comparator: 'not_contains',
            value: 'London',
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate exists correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.name',
            comparator: 'exists',
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate not_exists correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.nonexistent',
            comparator: 'not_exists',
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should evaluate regex correctly', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.email',
            comparator: 'regex',
            value: '^[a-z]+@example\\.com$',
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });
  });

  describe('AND operator', () => {
    it('should return true when all rules pass', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.name',
            comparator: 'eq',
            value: 'John Doe',
          },
          {
            variable: 'session.age',
            comparator: 'gte',
            value: 18,
          },
          {
            variable: 'session.status',
            comparator: 'eq',
            value: 'active',
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should return false when any rule fails', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.name',
            comparator: 'eq',
            value: 'John Doe',
          },
          {
            variable: 'session.age',
            comparator: 'gt',
            value: 30,
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(false);
    });
  });

  describe('OR operator', () => {
    it('should return true when at least one rule passes', () => {
      const condition: ConditionExpression = {
        operator: 'OR',
        rules: [
          {
            variable: 'session.name',
            comparator: 'eq',
            value: 'Jane Doe',
          },
          {
            variable: 'session.age',
            comparator: 'gte',
            value: 18,
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should return false when all rules fail', () => {
      const condition: ConditionExpression = {
        operator: 'OR',
        rules: [
          {
            variable: 'session.name',
            comparator: 'eq',
            value: 'Jane Doe',
          },
          {
            variable: 'session.age',
            comparator: 'gt',
            value: 30,
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(false);
    });
  });

  describe('Nested conditions', () => {
    it('should evaluate nested AND/OR conditions', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.status',
            comparator: 'eq',
            value: 'active',
          },
          {
            operator: 'OR',
            rules: [
              {
                variable: 'session.score',
                comparator: 'gte',
                value: 80,
              },
              {
                variable: 'session.city',
                comparator: 'eq',
                value: 'New York',
              },
            ],
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });

    it('should handle deeply nested conditions', () => {
      const condition: ConditionExpression = {
        operator: 'OR',
        rules: [
          {
            operator: 'AND',
            rules: [
              {
                variable: 'session.age',
                comparator: 'gte',
                value: 18,
              },
              {
                variable: 'session.score',
                comparator: 'gte',
                value: 80,
              },
            ],
          },
          {
            operator: 'AND',
            rules: [
              {
                variable: 'session.status',
                comparator: 'eq',
                value: 'premium',
              },
              {
                variable: 'session.city',
                comparator: 'eq',
                value: 'London',
              },
            ],
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid regex gracefully', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.email',
            comparator: 'regex',
            value: '[invalid(regex',
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(false);
    });

    it('should handle type mismatches in comparisons', () => {
      const condition: ConditionExpression = {
        operator: 'AND',
        rules: [
          {
            variable: 'session.name',
            comparator: 'gt',
            value: 10,
          },
        ],
      };

      expect(evaluator.evaluate(condition)).toBe(false);
    });
  });
});
