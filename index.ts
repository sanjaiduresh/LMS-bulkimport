import * as Hapi from '@hapi/hapi';
import { Server } from '@hapi/hapi';
import dotenv from 'dotenv';
import { dataSource } from './db/connection';
import { userRoute } from './src/userModule/userController'; 

dotenv.config();

/**
 * Bootstraps the Hapi server and connects to MongoDB.
 */
async function init() {
  const server: Server = Hapi.server({
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
    port: parseInt(process.env.PORT || '3000', 10),
    routes: {
      cors: {
        origin: [
          // 'http://localhost:3001',
          // 'https://leave-management-system-frontend.vercel.app',
          // 'https://leave-management-system-frontend-r480vqbxp-harishmugis-projects.vercel.app',
          // 'https://leave-management-system-frontend-psi.vercel.app',
          // 'https://leave-management-system-frontend-mznds8m7u-harishmugis-projects.vercel.app',
          '*'
        ],
        credentials: true,
      },
    },
  });

  /* ------------------------  Database connection  ------------------------ */
  try {
    await dataSource.initialize();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }

  /* ------------------------------  Routes  ------------------------------- */
  server.route(userRoute); // only employee-creation routes

  /* ------------------------------  Start  -------------------------------- */
  await server.start();
  console.log(`🚀 Server running at: ${server.info.uri}`);
}

/* --------------------  Global unhandled rejection hook  ------------------ */
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});

init();
