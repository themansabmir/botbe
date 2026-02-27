import { NormalizedInboundMessage, WhatsAppMessage, WhatsAppWebhookPayload } from './types';

export class WhatsAppNormalizer {
  normalize(orgId: string, payload: WhatsAppWebhookPayload): NormalizedInboundMessage | null {
    console.log('[Normalizer] Incoming payload:', JSON.stringify(payload));
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    if (!value) {
      console.warn('[Normalizer] Missing value in payload change');
      return null;
    }

    const message = value.messages?.[0];
    const contact = value.contacts?.[0];
    const metadata = value.metadata;

    if (!message) {
      console.warn('[Normalizer] No message found in payload value');
      return null;
    }

    const waId = contact?.wa_id ?? message.from;
    const waBusinessNumber = metadata?.phone_number_id ?? metadata?.display_phone_number;
    if (!waId || !waBusinessNumber) {
      console.warn('[Normalizer] Missing waId or waBusinessNumber', { waId, waBusinessNumber });
      return null;
    }

    const text = this.extractText(message);
    if (!text) {
      console.warn('[Normalizer] Unable to extract text from message', { messageType: message.type });
      return null;
    }

    const normalized: NormalizedInboundMessage = {
      orgId,
      messageId: message.id,
      waId,
      waBusinessNumber,
      text: text.trim(),
      type: message.type,
      timestamp: message.timestamp ? Number(message.timestamp) * 1000 : Date.now(),
      contactName: contact?.profile?.name,
    };

    console.log('[Normalizer] Normalized message:', normalized);
    return normalized;
  }

  private extractText(message: WhatsAppMessage): string | null {
    if (message.type === 'text' && message.text?.body) {
      return message.text.body;
    }

    if (message.type === 'button' && message.button?.text) {
      return message.button.text;
    }

    if (message.type === 'interactive' && message.interactive) {
      if (message.interactive.button_reply?.title) {
        return message.interactive.button_reply.title;
      }
      if (message.interactive.list_reply?.title) {
        return message.interactive.list_reply.title;
      }
    }

    return null;
  }
}
