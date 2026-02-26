import mongoose, { Schema, Document } from 'mongoose';
import { Session, SessionStatus } from '../schemas/session.schema';

export interface SessionDocument extends Omit<Session, '_id'>, Document {}

const SessionHistoryStepSchema = new Schema({
  nodeId: { type: String, required: true },
  nodeType: { type: String, required: true },
  enteredAt: { type: Date, required: true },
  exitedAt: { type: Date },
  branchTaken: { type: String },
  userInput: { type: String },
}, { _id: false });

const WaitingForSchema = new Schema({
  type: { type: String, enum: ['user_input'], required: true },
  variableName: { type: String, required: true },
  variableScope: { type: String, enum: ['session', 'contact'], required: true },
  since: { type: Date, required: true },
  timeoutAt: { type: Date, required: true },
}, { _id: false });

const SessionSchema = new Schema<SessionDocument>({
  flowId: { type: String, required: true, index: true },
  flowVersion: { type: Number, required: true },
  contactId: { type: String, required: true, index: true },
  waId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ['active', 'waiting', 'completed', 'timed_out', 'error'], 
    required: true,
    default: 'active',
  },
  currentNodeId: { type: String, required: true },
  variables: { type: Schema.Types.Mixed, default: {} },
  history: { type: [SessionHistoryStepSchema], default: [] },
  waitingFor: { type: WaitingForSchema },
}, {
  timestamps: true,
});

SessionSchema.index({ waId: 1, status: 1 });
SessionSchema.index({ flowId: 1, status: 1 });
SessionSchema.index({ 'waitingFor.timeoutAt': 1 }, { sparse: true });

export const SessionModel = mongoose.model<SessionDocument>('Session', SessionSchema);
