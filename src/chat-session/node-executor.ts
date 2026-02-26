import { VariableResolver, VariableContext } from '../engine/variable-resolver';
import { ConditionEvaluator } from '../engine/condition-evaluator';
import { GraphTraverser } from '../engine/graph-traverser';
import { NodeType } from '../schemas/node-types.enum';
import { Node } from '../schemas/node.schema';
import { FlowExecutionError } from '../utils/errors';
import {
  ExecutionInput,
  ExecutionResult,
  OutboundMessage,
  VariableMutation,
} from './types';

const LOGIC_NODE_TYPES = new Set<NodeType>([
  NodeType.CONDITION,
  NodeType.SET_VARIABLE,
  NodeType.RANDOM_SPLIT,
  NodeType.START,
  NodeType.JUMP_TO_FLOW,
]);

export class NodeExecutor {
  constructor(
    private readonly variableResolver: VariableResolver,
    private readonly conditionEvaluator: ConditionEvaluator,
  ) {}

  execute(input: ExecutionInput, traverser: GraphTraverser): ExecutionResult {
    const { session, contact, flow, currentNode, userInput } = input;
    const context: VariableContext = { session, contact, flow };
    const enteredAt = new Date();

    switch (currentNode.type) {
      case NodeType.START:
        return this.handleDefault(currentNode, 'default', enteredAt, traverser);

      case NodeType.END:
        return this.handleEnd(currentNode, enteredAt);

      case NodeType.SEND_TEXT:
        return this.handleSendText(currentNode, context, enteredAt, traverser);

      case NodeType.SEND_IMAGE:
      case NodeType.SEND_VIDEO:
      case NodeType.SEND_AUDIO:
      case NodeType.SEND_DOCUMENT:
        return this.handleSendMedia(currentNode, context, enteredAt, traverser);

      case NodeType.SEND_LOCATION:
        return this.handleSendLocation(currentNode, context, enteredAt, traverser);

      case NodeType.SEND_BUTTONS:
        return this.handleSendButtons(currentNode, context, enteredAt, traverser);

      case NodeType.SEND_LIST:
        return this.handleSendList(currentNode, context, enteredAt, traverser);

      case NodeType.SEND_TEMPLATE:
        return this.handleSendTemplate(currentNode, context, enteredAt, traverser);

      case NodeType.ASK_QUESTION:
        return this.handleAskQuestion(currentNode, context, enteredAt, userInput);

      case NodeType.CONDITION:
        return this.handleCondition(currentNode, context, enteredAt, traverser);

      case NodeType.SET_VARIABLE:
        return this.handleSetVariable(currentNode, context, enteredAt, traverser);

      case NodeType.RANDOM_SPLIT:
        return this.handleRandomSplit(currentNode, enteredAt, traverser);

      case NodeType.JUMP_TO_FLOW:
        return this.handleJumpToFlow(currentNode, enteredAt);

      case NodeType.HUMAN_HANDOFF:
        return this.handleHumanHandoff(currentNode, context, enteredAt);

      case NodeType.WEBHOOK:
      case NodeType.GOOGLE_SHEETS:
      case NodeType.NOCODB:
        return this.handleIntegration(currentNode, enteredAt, traverser);

      default:
        throw new FlowExecutionError(
          `Unsupported node type: ${(currentNode as Node).type}`,
          currentNode.id,
        );
    }
  }

  isLogicNode(nodeType: NodeType): boolean {
    return LOGIC_NODE_TYPES.has(nodeType);
  }

  private resolveText(template: string, context: VariableContext): string {
    return this.variableResolver.resolve(template, context);
  }

  private buildResult(
    currentNode: Node,
    branchKey: string,
    enteredAt: Date,
    traverser: GraphTraverser,
    outboundMessages: OutboundMessage[],
    variableMutations: VariableMutation[],
    isTerminal = false,
  ): ExecutionResult {
    const nextNode = traverser.getNextNode(currentNode.id, branchKey);
    return {
      nextNodeId: nextNode?.id ?? null,
      outboundMessages,
      variableMutations,
      isTerminal,
      historyStep: {
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        enteredAt,
        exitedAt: new Date(),
        branchTaken: branchKey,
      },
    };
  }

  private handleDefault(
    node: Node,
    branchKey: string,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    return this.buildResult(node, branchKey, enteredAt, traverser, [], []);
  }

  private handleEnd(node: Node, enteredAt: Date): ExecutionResult {
    return {
      nextNodeId: null,
      outboundMessages: [],
      variableMutations: [],
      isTerminal: true,
      historyStep: {
        nodeId: node.id,
        nodeType: node.type,
        enteredAt,
        exitedAt: new Date(),
      },
    };
  }

  private handleSendText(
    node: Node,
    context: VariableContext,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    const message = this.resolveText(node.data.message, context);
    return this.buildResult(node, 'default', enteredAt, traverser, [
      { type: node.type, payload: { message } },
    ], []);
  }

  private handleSendMedia(
    node: Node,
    context: VariableContext,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    const url = this.resolveText(node.data.url, context);
    const caption = node.data.caption ? this.resolveText(node.data.caption, context) : undefined;
    return this.buildResult(node, 'default', enteredAt, traverser, [
      { type: node.type, payload: { url, caption } },
    ], []);
  }

  private handleSendLocation(
    node: Node,
    _context: VariableContext,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    const { latitude, longitude, name, address } = node.data;
    return this.buildResult(node, 'default', enteredAt, traverser, [
      { type: node.type, payload: { latitude, longitude, name, address } },
    ], []);
  }

  private handleSendButtons(
    node: Node,
    context: VariableContext,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    const body = this.resolveText(node.data.body, context);
    const footer = node.data.footer ? this.resolveText(node.data.footer, context) : undefined;
    return this.buildResult(node, 'default', enteredAt, traverser, [
      { type: node.type, payload: { body, footer, buttons: node.data.buttons } },
    ], []);
  }

  private handleSendList(
    node: Node,
    context: VariableContext,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    const body = this.resolveText(node.data.body, context);
    return this.buildResult(node, 'default', enteredAt, traverser, [
      { type: node.type, payload: { body, buttonTitle: node.data.buttonTitle, sections: node.data.sections } },
    ], []);
  }

  private handleSendTemplate(
    node: Node,
    _context: VariableContext,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    const { templateName, languageCode, components } = node.data;
    return this.buildResult(node, 'default', enteredAt, traverser, [
      { type: node.type, payload: { templateName, languageCode, components } },
    ], []);
  }

  private handleAskQuestion(
    node: Node,
    context: VariableContext,
    enteredAt: Date,
    userInput?: string,
  ): ExecutionResult {
    const { variableName, variableScope, timeoutSeconds, message } = node.data;
    const resolvedMessage = this.resolveText(message, context);

    if (userInput === undefined) {
      const since = new Date();
      const timeoutAt = new Date(since.getTime() + timeoutSeconds * 1000);
      return {
        nextNodeId: node.id,
        outboundMessages: [{ type: node.type, payload: { message: resolvedMessage } }],
        variableMutations: [],
        isTerminal: false,
        waitForInput: {
          type: 'user_input',
          variableName,
          variableScope,
          since,
          timeoutAt,
        },
        historyStep: {
          nodeId: node.id,
          nodeType: node.type,
          enteredAt,
        },
      };
    }

    return {
      nextNodeId: node.id,
      outboundMessages: [],
      variableMutations: [{ scope: variableScope, key: variableName, value: userInput }],
      isTerminal: false,
      historyStep: {
        nodeId: node.id,
        nodeType: node.type,
        enteredAt,
        exitedAt: new Date(),
        userInput,
      },
    };
  }

  private handleCondition(
    node: Node,
    context: VariableContext,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    const expression = node.data.expression;
    if (!expression) {
      throw new FlowExecutionError('Condition node missing expression', node.id);
    }
    const result = this.conditionEvaluator.evaluate(expression, context);
    const branchKey = result ? 'yes' : 'no';
    return this.buildResult(node, branchKey, enteredAt, traverser, [], []);
  }

  private handleSetVariable(
    node: Node,
    context: VariableContext,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    const assignments: Array<{ variable: string; value: string; scope: 'session' | 'contact' }> =
      node.data.assignments ?? [];

    const mutations: VariableMutation[] = assignments.map(a => ({
      scope: a.scope,
      key: a.variable,
      value: this.resolveText(a.value, context),
    }));

    return this.buildResult(node, 'default', enteredAt, traverser, [], mutations);
  }

  private handleRandomSplit(
    node: Node,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    const branches: Array<{ key: string; percentage: number }> = node.data.branches ?? [];
    const rand = Math.random() * 100;
    let cumulative = 0;
    let selectedKey = branches[0]?.key ?? 'default';

    for (const branch of branches) {
      cumulative += branch.percentage;
      if (rand < cumulative) {
        selectedKey = branch.key;
        break;
      }
    }

    return this.buildResult(node, selectedKey, enteredAt, traverser, [], []);
  }

  private handleJumpToFlow(node: Node, enteredAt: Date): ExecutionResult {
    const { targetFlowId } = node.data;
    return {
      nextNodeId: null,
      outboundMessages: [],
      variableMutations: [],
      isTerminal: true,
      historyStep: {
        nodeId: node.id,
        nodeType: node.type,
        enteredAt,
        exitedAt: new Date(),
        branchTaken: targetFlowId,
      },
    };
  }

  private handleHumanHandoff(
    node: Node,
    context: VariableContext,
    enteredAt: Date,
  ): ExecutionResult {
    const message = node.data.message
      ? this.resolveText(node.data.message, context)
      : undefined;
    return {
      nextNodeId: null,
      outboundMessages: message
        ? [{ type: node.type, payload: { message, tag: node.data.tag } }]
        : [],
      variableMutations: [],
      isTerminal: true,
      historyStep: {
        nodeId: node.id,
        nodeType: node.type,
        enteredAt,
        exitedAt: new Date(),
      },
    };
  }

  private handleIntegration(
    node: Node,
    enteredAt: Date,
    traverser: GraphTraverser,
  ): ExecutionResult {
    return this.buildResult(node, 'default', enteredAt, traverser, [
      { type: node.type, payload: node.data },
    ], []);
  }
}
