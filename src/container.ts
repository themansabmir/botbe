import { FlowRepository, IFlowRepository } from './repositories/flow.repository';
import { SessionRepository, ISessionRepository } from './repositories/session.repository';
import { ContactRepository, IContactRepository } from './repositories/contact.repository';
import { FlowService, IFlowService } from './services/flow.service';
import { ContactService, IContactService } from './services/contact.service';
import { FlowController } from './controllers/flow.controller';
import { ContactController } from './controllers/contact.controller';
import { NodeTypesController } from './controllers/node-types.controller';
import { WhatsAppWebhookController } from './controllers/whatsapp-webhook.controller';
import { VariableResolver } from './engine/variable-resolver';
import { ConditionEvaluator } from './engine/condition-evaluator';
import { NodeExecutor } from './chat-session/node-executor';
import { FlowOrchestrator } from './chat-session/flow-orchestrator';
import { IFlowOrchestrator } from './chat-session/flow-orchestrator.interface';
import { ChatSessionController } from './chat-session/chat-session.controller';
import { WhatsAppWebhookService } from './services/whatsapp-webhook.service';

export class Container {
  private static instance: Container;

  public readonly flowRepository: IFlowRepository;
  public readonly sessionRepository: ISessionRepository;
  public readonly contactRepository: IContactRepository;

  public readonly flowService: IFlowService;
  public readonly contactService: IContactService;

  public readonly flowController: FlowController;
  public readonly contactController: ContactController;
  public readonly nodeTypesController: NodeTypesController;
  public readonly chatSessionController: ChatSessionController;
  public readonly whatsappWebhookController: WhatsAppWebhookController;

  public readonly variableResolver: VariableResolver;
  public readonly conditionEvaluator: ConditionEvaluator;
  public readonly nodeExecutor: NodeExecutor;
  public readonly flowOrchestrator: IFlowOrchestrator;
  public readonly whatsappWebhookService: WhatsAppWebhookService;

  private constructor() {
    this.flowRepository = new FlowRepository();
    this.sessionRepository = new SessionRepository();
    this.contactRepository = new ContactRepository();

    this.flowService = new FlowService(this.flowRepository);
    this.contactService = new ContactService(this.contactRepository);

    this.flowController = new FlowController(this.flowService);
    this.contactController = new ContactController(this.contactService);
    this.nodeTypesController = new NodeTypesController();

    this.variableResolver = new VariableResolver();
    this.conditionEvaluator = new ConditionEvaluator(this.variableResolver);
    this.nodeExecutor = new NodeExecutor(this.variableResolver, this.conditionEvaluator);
    this.flowOrchestrator = new FlowOrchestrator(
      this.flowRepository,
      this.sessionRepository,
      this.contactRepository,
      this.nodeExecutor,
    );
    this.chatSessionController = new ChatSessionController(this.flowOrchestrator);
    this.whatsappWebhookService = new WhatsAppWebhookService(
      this.flowRepository,
      this.contactService,
      this.sessionRepository,
      this.flowOrchestrator,
    );
    this.whatsappWebhookController = new WhatsAppWebhookController(this.whatsappWebhookService);
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public static reset(): void {
    Container.instance = null as any;
  }
}
