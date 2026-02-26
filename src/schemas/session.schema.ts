import { z } from 'zod';
import { NodeType } from './node-types.enum';

export const SessionStatusSchema = z.enum(['active', 'waiting', 'completed', 'timed_out', 'error']);

export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const SessionHistoryStepSchema = z.object({
  nodeId: z.string(),
  nodeType: z.nativeEnum(NodeType),
  enteredAt: z.date(),
  exitedAt: z.date().optional(),
  branchTaken: z.string().optional(),
  userInput: z.string().optional(),
});

export type SessionHistoryStep = z.infer<typeof SessionHistoryStepSchema>;

export const WaitingForSchema = z.object({
  type: z.literal('user_input'),
  variableName: z.string(),
  variableScope: z.enum(['session', 'contact']),
  since: z.date(),
  timeoutAt: z.date(),
});

export type WaitingFor = z.infer<typeof WaitingForSchema>;

export const SessionSchema = z.object({
  _id: z.string().optional(),
  flowId: z.string(),
  flowVersion: z.number(),
  contactId: z.string(),
  waId: z.string(),
  status: SessionStatusSchema,
  currentNodeId: z.string(),
  variables: z.record(z.any()),
  history: z.array(SessionHistoryStepSchema),
  waitingFor: WaitingForSchema.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Session = z.infer<typeof SessionSchema>;
