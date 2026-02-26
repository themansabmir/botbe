import dotenv from 'dotenv';
import { createApp } from './app';
import { validateEnv } from './config/env';
import { connectDatabase } from './config/database';

dotenv.config();

async function startServer() {
  const env = validateEnv();

  await connectDatabase(env.MONGODB_URI);

  const app = createApp();
  const PORT = parseInt(env.PORT, 10);

  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${env.NODE_ENV}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log(`✓ API endpoints:`);
    console.log(`  - POST   /api/flows`);
    console.log(`  - GET    /api/flows`);
    console.log(`  - GET    /api/flows/:id`);
    console.log(`  - PUT    /api/flows/:id`);
    console.log(`  - POST   /api/flows/:id/publish`);
    console.log(`  - POST   /api/flows/:id/archive`);
    console.log(`  - DELETE /api/flows/:id`);
    console.log(`  - GET    /api/node-types`);
    console.log(`  - GET    /api/contacts`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
