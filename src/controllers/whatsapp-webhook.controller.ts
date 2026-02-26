import { Request, Response, NextFunction } from 'express';
import { WhatsAppWebhookService } from '../services/whatsapp-webhook.service';
import { ValidationError } from '../utils/errors';

export class WhatsAppWebhookController {
  constructor(private readonly webhookService: WhatsAppWebhookService) {}

  verify = async (req: Request, res: Response): Promise<void> => {
    const mode = req.query['hub.mode'];
    const challenge = req.query['hub.challenge'];
    const token = req.query['hub.verify_token'];
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken && typeof challenge === 'string') {
      res.status(200).send(challenge);
      return;
    }

    res.status(403).send('Forbidden');
  };

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = String(req.params['orgId']);
      if (!orgId) {
        throw new ValidationError('orgId param is required');
      }

      const result = await this.webhookService.handleIncomingMessage(orgId, req.body);
      if (!result) {
        res.status(204).send();
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
