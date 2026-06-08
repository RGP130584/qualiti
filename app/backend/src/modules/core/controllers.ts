import { FastifyInstance } from 'fastify';
import { CoreService } from './services';
import { authenticate } from '../../utils/auth';
import { 
  CoreOcorrenciaCreateSchema, CoreDocumentoCreateSchema, 
  CoreAuditoriaCreateSchema, CoreAiAgentQuerySchema 
} from './schemas';

// ==========================================
// CONTROLLERS / ROTAS: CORE PLATFORM (CLEAN ARCHITECTURE)
// ==========================================

export async function coreV2Routes(fastify: FastifyInstance) {
  const service = new CoreService();

  // Helper helper to get tenant_id from request
  const getTenantId = (request: any): string => {
    return request.user?.unidade || 'Unidade Central';
  };

  // ----------------------------------------
  // 1. OCORRÊNCIAS INTELIGENTES (RELATAR OCORRÊNCIA)
  // ----------------------------------------
  fastify.get('/core/v2/ocorrencias', { preHandler: [authenticate] }, async (request, reply) => {
    const { setor } = request.query as any;
    const tenantId = getTenantId(request);
    return await service.listOcorrencias(tenantId, setor);
  });

  fastify.post('/core/v2/ocorrencias', { 
    preHandler: [authenticate],
    schema: CoreOcorrenciaCreateSchema 
  }, async (request, reply) => {
    const data = request.body as any;
    const tenantId = getTenantId(request);
    return await service.processRelatarOcorrencia(tenantId, data);
  });

  fastify.put('/core/v2/ocorrencias/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { status, plano_capa, usuario } = request.body as any;
    const tenantId = getTenantId(request);
    return await service.updateOcorrenciaStatus(tenantId, Number(id), status, plano_capa, usuario || request.user?.nome || 'Gestor da Qualidade');
  });

  // ----------------------------------------
  // 2. GESTÃO DOCUMENTAL INTELIGENTE (POPS CONSOLIDADO)
  // ----------------------------------------
  fastify.get('/core/v2/documentos', { preHandler: [authenticate] }, async (request, reply) => {
    const { setor } = request.query as any;
    const tenantId = getTenantId(request);
    return await service.listDocumentos(tenantId, setor);
  });

  fastify.post('/core/v2/documentos', { 
    preHandler: [authenticate],
    schema: CoreDocumentoCreateSchema 
  }, async (request, reply) => {
    const data = request.body as any;
    const tenantId = getTenantId(request);
    return await service.createDocumento(tenantId, data);
  });

  // ----------------------------------------
  // 3. AUDITORIA INTELIGENTE
  // ----------------------------------------
  fastify.get('/core/v2/auditorias', { preHandler: [authenticate] }, async (request, reply) => {
    const { setor } = request.query as any;
    const tenantId = getTenantId(request);
    return await service.listAuditorias(tenantId, setor);
  });

  // ----------------------------------------
  // 4. GESTÃO DE RISCOS
  // ----------------------------------------
  fastify.get('/core/v2/riscos', { preHandler: [authenticate] }, async (request, reply) => {
    const { setor } = request.query as any;
    const tenantId = getTenantId(request);
    return await service.listRiscos(tenantId, setor);
  });

  // ----------------------------------------
  // 5. SEGURANÇA OPERACIONAL
  // ----------------------------------------
  fastify.get('/core/v2/seguranca', { preHandler: [authenticate] }, async (request, reply) => {
    const { setor } = request.query as any;
    const tenantId = getTenantId(request);
    return await service.listSeguranca(tenantId, setor);
  });

  // ----------------------------------------
  // 6. INDICADORES & ANALYTICS
  // ----------------------------------------
  fastify.get('/core/v2/analytics', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    return await service.getAnalytics(tenantId);
  });

  // ----------------------------------------
  // 7. IA CORPORATIVA (6 AGENTES)
  // ----------------------------------------
  fastify.post('/core/v2/ai/agent', { 
    preHandler: [authenticate],
    schema: CoreAiAgentQuerySchema 
  }, async (request, reply) => {
    const { agente, prompt, usuario, contexto } = request.body as any;
    const tenantId = getTenantId(request);
    return await service.askAiAgent(tenantId, agente, prompt, usuario || request.user?.nome || 'Usuário', contexto);
  });

  fastify.get('/core/v2/ai/logs', { preHandler: [authenticate] }, async (request, reply) => {
    const { agente } = request.query as any;
    const tenantId = getTenantId(request);
    return await service.listAiLogs(tenantId, agente);
  });
}
