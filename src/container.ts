import { FlowRepository, IFlowRepository } from './repositories/flow.repository';
import { SessionRepository, ISessionRepository } from './repositories/session.repository';
import { ContactRepository, IContactRepository } from './repositories/contact.repository';
import { FlowService, IFlowService } from './services/flow.service';
import { ContactService, IContactService } from './services/contact.service';
import { FlowController } from './controllers/flow.controller';
import { ContactController } from './controllers/contact.controller';
import { NodeTypesController } from './controllers/node-types.controller';
import { VariableResolver } from './engine/variable-resolver';
import { ConditionEvaluator } from './engine/condition-evaluator';

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

  public readonly variableResolver: VariableResolver;
  public readonly conditionEvaluator: ConditionEvaluator;

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
