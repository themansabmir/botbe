import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IFlowOrchestrator } from './flow-orchestrator.interface';
import { ValidationError } from '../utils/errors';

const StartFlowBodySchema = z.object({
  orgId: z.string().min(1),
  flowId: z.string().min(1),
  contactId: z.string().min(1),
  waId: z.string().min(1),
  waBusinessNumber: z.string().min(1),
  initialVariables: z.record(z.any()).optional(),
});

const ResumeFlowBodySchema = z.object({
  userInput: z.string().min(1),
});

export class ChatSessionController {
  constructor(private readonly orchestrator: IFlowOrchestrator) {}

  startFlow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = StartFlowBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.message);
      }

      const result = await this.orchestrator.startFlow({
        ...parsed.data,
        initialVariables: parsed.data.initialVariables ?? {},
        waBusinessNumber: parsed.data.waBusinessNumber,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  resumeFlow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = String(req.params['sessionId']);
      if (!sessionId) {
        throw new ValidationError('sessionId param is required');
      }

      const parsed = ResumeFlowBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.message);
      }

      const result = await this.orchestrator.resumeFlow({
        sessionId,
        userInput: parsed.data.userInput,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = String(req.params['sessionId']);
      if (!sessionId) {
        throw new ValidationError('sessionId param is required');
      }

      const session = await this.orchestrator.getSessionById(sessionId);
      res.status(200).json(session);
    } catch (err) {
      next(err);
    }
  };
}
