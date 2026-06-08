import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import { initDb } from './db';

import wizardRoutes from './routes/wizard';
import authRoutes from './routes/auth';
import popsRoutes from './routes/pops';
import bpmRoutes from './routes/bpm';
import onaRoutes from './routes/ona';
import usersRoutes from './routes/users';
import indicatorsRoutes from './routes/indicators';
import incidentsRoutes from './routes/incidents';
import aiRoutes from './routes/ai';
import fhirRoutes from './routes/fhir';
import auditRoutes from './routes/audit';
import adminRoutes from './routes/admin';
import okrsRoutes from './routes/okrs';
import educationRoutes from './routes/education';
import eventRoutes from './routes/events';
import palRoutes from './routes/pal';
import omocRoutes from './routes/omoc';
import { onaV2Routes } from './modules/ona/controllers';
import { coreV2Routes } from './modules/core/controllers';
import { initListeners } from './modules/core/listeners';
import { startSlaWorker } from './workers/sla-worker';
import { startUsageWorker } from './workers/usage-worker';
import { startSuspensionWorker } from './workers/suspension-worker';

dotenv.config();

const server = fastify({
  logger: true,
});

async function main() {
  if (!process.env.JWT_SECRET) {
    throw new Error('CRITICAL CONFIGURATION ERROR: JWT_SECRET environment variable is not defined!');
  }

  // Inicializa Banco de Dados e Seed
  await initDb();

  // Inicializa Listeners de Eventos
  initListeners();

  // Inicializa Worker de SLA em Background
  startSlaWorker();

  // Inicializa Workers de Uso e Suspensão em Background
  startUsageWorker();
  startSuspensionWorker();

  // Registra CORS
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(o => o.trim());
  await server.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('CORS Error: Origin not allowed'), false);
      }
    },
    credentials: true,
  });

  // Registra Cookie
  await server.register(cookie, {
    secret: process.env.JWT_SECRET,
  });

  // Registra Rate Limit (global: false, ativo sob demanda nas rotas críticas)
  await server.register(rateLimit, {
    global: false,
  });

  // Registra JWT
  await server.register(jwt, {
    secret: process.env.JWT_SECRET,
  });

  // Registra Swagger (OpenAPI 3.0)
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'QualitaOS API',
        description: 'Especificação OpenAPI 3.0 para o QualitaOS (Sistema Operacional da Qualidade de Internação)',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost/api',
          description: 'Caddy Gateway Proxy',
        },
        {
          url: 'http://localhost:3001/api',
          description: 'Fastify Backend Direto',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Registra Rotas com prefixo /api
  server.register(wizardRoutes, { prefix: '/api' });
  server.register(authRoutes, { prefix: '/api' });
  server.register(popsRoutes, { prefix: '/api' });
  server.register(bpmRoutes, { prefix: '/api' });
  server.register(onaRoutes, { prefix: '/api' });
  server.register(usersRoutes, { prefix: '/api' });
  server.register(indicatorsRoutes, { prefix: '/api' });
  server.register(incidentsRoutes, { prefix: '/api' });
  server.register(aiRoutes, { prefix: '/api' });
  server.register(fhirRoutes, { prefix: '/api' });
  server.register(auditRoutes, { prefix: '/api' });
  server.register(adminRoutes, { prefix: '/api' });
  server.register(okrsRoutes, { prefix: '/api' });
  server.register(educationRoutes, { prefix: '/api' });
  server.register(onaV2Routes, { prefix: '/api' });
  server.register(coreV2Routes, { prefix: '/api' });
  server.register(eventRoutes, { prefix: '/api' });
  server.register(palRoutes, { prefix: '/api' });
  server.register(omocRoutes, { prefix: '/api' });

  // Rota de status geral
  server.get('/api/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date(), service: 'QualitaOS Backend Fastify' };
  });

  const port = parseInt(process.env.PORT || '3001', 10);

  try {
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Servidor backend rodando em http://0.0.0.0:${port}`);
    server.log.info(`Documentação Swagger disponível em http://localhost/api/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
