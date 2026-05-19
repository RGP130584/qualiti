import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
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
import { onaV2Routes } from './modules/ona/controllers';
import { coreV2Routes } from './modules/core/controllers';

dotenv.config();

const server = fastify({
  logger: true,
});

async function main() {
  // Inicializa Banco de Dados e Seed
  await initDb();

  // Registra CORS
  await server.register(cors, {
    origin: '*',
  });

  // Registra JWT
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'super_secret_qualita_jwt_key_2026_secure',
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
  server.register(onaV2Routes, { prefix: '/api' });
  server.register(coreV2Routes, { prefix: '/api' });

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
