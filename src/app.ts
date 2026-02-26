import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { Container } from './container';
import { createFlowRouter } from './routes/flows.route';
import { createContactRouter } from './routes/contacts.route';
import { createNodeTypesRouter } from './routes/node-types.route';
import { errorHandler } from './middleware/error.middleware';

export function createApp(): Application {
  const app = express();
  const container = Container.getInstance();

  app.use(helmet());
  app.use(cors());
  app.use(morgan('combined'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/flows', createFlowRouter(container.flowController));
  app.use('/api/contacts', createContactRouter(container.contactController));
  app.use('/api/node-types', createNodeTypesRouter(container.nodeTypesController));

  app.use(errorHandler);

  return app;
}
