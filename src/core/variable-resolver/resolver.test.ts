import { describe, it, expect, beforeEach } from 'vitest';
import { VariableResolver, ResolverContext } from './resolver';
import { SessionDocument, ContactDocument, FlowDocument } from '../types';

describe('VariableResolver', () => {
  let context: ResolverContext;
  let resolver: VariableResolver;

  beforeEach(() => {
    context = {
      session: {
        _id: 'session_1',
        flowId: 'flow_1',
        flowVersion: 1,
        contactId: 'contact_1',
        waId: '+1234567890',
        currentNodeId: 'node_1',
        status: 'active',
        variables: {
          lead_name: 'John Doe',
          lead_email: 'john@example.com',
          score: 85,
          nested: {
            value: 'deep',
          },
        },
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SessionDocument,
      contact: {
        _id: 'contact_1',
        orgId: 'org_1',
        waId: '+1234567890',
        profile: {
          name: 'John Doe',
          pushName: 'John',
        },
        tags: ['lead', 'warm'],
        customFields: {
          city: 'New York',
          source: 'website',
        },
        optIn: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ContactDocument,
      flow: {
        _id: 'flow_1',
        orgId: 'org_1',
        name: 'Lead Capture Flow',
        version: 1,
        status: 'published',
        triggerType: 'keyword',
        triggerConfig: { keywords: ['hi'] },
        variables: [],
        nodes: [],
        edges: [],
        settings: {
          timeoutSeconds: 300,
          maxSteps: 100,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as FlowDocument,
    };

    resolver = new VariableResolver(context);
  });

  describe('resolve', () => {
    it('should resolve session variables', () => {
      const result = resolver.resolve('Hello {{session.lead_name}}!');
      expect(result).toBe('Hello John Doe!');
    });

    it('should resolve nested session variables', () => {
      const result = resolver.resolve('Value: {{session.nested.value}}');
      expect(result).toBe('Value: deep');
    });

    it('should resolve contact profile', () => {
      const result = resolver.resolve('Hi {{contact.profile.name}}');
      expect(result).toBe('Hi John Doe');
    });

    it('should resolve contact custom fields', () => {
      const result = resolver.resolve('City: {{contact.customFields.city}}');
      expect(result).toBe('City: New York');
    });

    it('should resolve flow properties', () => {
      const result = resolver.resolve('Flow: {{flow.name}}');
      expect(result).toBe('Flow: Lead Capture Flow');
    });

    it('should resolve system.now', () => {
      const result = resolver.resolve('Time: {{system.now}}');
      expect(result).toContain('Time: ');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should resolve system.today', () => {
      const result = resolver.resolve('Date: {{system.today}}');
      expect(result).toMatch(/Date: \d{4}-\d{2}-\d{2}/);
    });

    it('should handle multiple variables in one template', () => {
      const result = resolver.resolve(
        'Hello {{session.lead_name}}, you are from {{contact.customFields.city}}'
      );
      expect(result).toBe('Hello John Doe, you are from New York');
    });

    it('should leave unresolved variables as-is', () => {
      const result = resolver.resolve('Value: {{session.nonexistent}}');
      expect(result).toBe('Value: {{session.nonexistent}}');
    });

    it('should handle templates with no variables', () => {
      const result = resolver.resolve('Plain text');
      expect(result).toBe('Plain text');
    });

    it('should handle empty template', () => {
      const result = resolver.resolve('');
      expect(result).toBe('');
    });
  });

  describe('resolveExpression', () => {
    it('should resolve session variable expression', () => {
      const result = resolver.resolveExpression('session.lead_name');
      expect(result).toBe('John Doe');
    });

    it('should resolve contact variable expression', () => {
      const result = resolver.resolveExpression('contact.profile.name');
      expect(result).toBe('John Doe');
    });

    it('should return undefined for non-existent path', () => {
      const result = resolver.resolveExpression('session.nonexistent.path');
      expect(result).toBeUndefined();
    });

    it('should handle numeric values', () => {
      const result = resolver.resolveExpression('session.score');
      expect(result).toBe(85);
    });
  });

  describe('getValue', () => {
    it('should get value from expression', () => {
      const result = resolver.getValue('session.lead_email');
      expect(result).toBe('john@example.com');
    });

    it('should return undefined for invalid expression', () => {
      const result = resolver.getValue('invalid.path');
      expect(result).toBeUndefined();
    });
  });
});
