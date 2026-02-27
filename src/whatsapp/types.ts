export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: WhatsAppWebhookValue;
    }>;
  }>;
}

export interface WhatsAppWebhookValue {
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: Array<{
    profile?: { name?: string };
    wa_id?: string;
  }>;
  messages?: WhatsAppMessage[];
}

export interface WhatsAppMessage {
  from?: string;
  id: string;
  timestamp?: string;
  type: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: {
    type?: string;
    button_reply?: { title?: string; id?: string };
    list_reply?: { title?: string; id?: string };
  };
}

export interface NormalizedInboundMessage {
  orgId: string;
  messageId: string;
  waId: string;
  waBusinessNumber: string;
  text: string;
  type: string;
  timestamp: number;
  contactName?: string | undefined;
}

export interface InboundJobData {
  orgId: string;
  message: NormalizedInboundMessage;
}
