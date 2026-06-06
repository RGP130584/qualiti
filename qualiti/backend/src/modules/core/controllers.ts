import { FastifyInstance } from 'fastify';
import { CoreService } from './services';
import { 
  CoreOcorrenciaCreateSchema, CoreDocumentoCreateSchema, 
  CoreAuditoriaCreateSchema, CoreAiAgentQuerySchema 
} from './schemas';

// ==========================================
// CONTROLLERS / ROTAS: CORE PLATFORM (CLEAN ARCHITECTURE)
// ==========================================

export async function coreV2Routes(fastify: FastifyInstance) {
  const service = new CoreService();

  // ----------------------------------------
  // 1. OCORRÊNCIAS INTELIGENTES (RELATAR OCORRÊNCIA)
  // ----------------------------------------
  fastify.get('/core/v2/ocorrencias', async (request, reply) => {
    const { setor } = request.query as any;
    return await service.listOcorrencias(setor);
  });

  fastify.post('/core/v2/ocorrencias', { schema: CoreOcorrenciaCreateSchema }, async (request, reply) => {
    const data = request.body as any;
    return await service.processRelatarOcorrencia(data);
  });

  fastify.put('/core/v2/ocorrencias/:id/status', async (request, reply) => {
    const { id } = request.params as any;
    const { status, plano_capa, usuario } = request.body as any;
    return await service.updateOcorrenciaStatus(Number(id), status, plano_capa, usuario || 'Gestor da Qualidade');
  });

  // ----------------------------------------
  // 2. GESTÃO DOCUMENTAL INTELIGENTE
  // ----------------------------------------
  fastify.get('/core/v2/documentos', async (request, reply) => {
    const { setor } = request.query as any;
    return await service.listDocumentos(setor);
  });

  fastify.post('/core/v2/documentos', { schema: CoreDocumentoCreateSchema }, async (request, reply) => {
    const data = request.body as any;
    return await service.createDocumento(data);
  });

  // ----------------------------------------
  // 3. AUDITORIA INTELIGENTE
  // ----------------------------------------
  fastify.get('/core/v2/auditorias', async (request, reply) => {
    const { setor } = request.query as any;
    return await service.listAuditorias(setor);
  });

  // ----------------------------------------
  // 4. GESTÃO DE RISCOS
  // ----------------------------------------
  fastify.get('/core/v2/riscos', async (request, reply) => {
    const { setor } = request.query as any;
    return await service.listRiscos(setor);
  });

  // ----------------------------------------
  // 5. SEGURANÇA OPERACIONAL
  // ----------------------------------------
  fastify.get('/core/v2/seguranca', async (request, reply) => {
    const { setor } = request.query as any;
    return await service.listSeguranca(setor);
  });

  // ----------------------------------------
  // 6. INDICADORES & ANALYTICS
  // ----------------------------------------
  fastify.get('/core/v2/analytics', async (request, reply) => {
    return await service.getAnalytics();
  });

  // ----------------------------------------
  // 7. IA CORPORATIVA (6 AGENTES)
  // ----------------------------------------
  fastify.post('/core/v2/ai/agent', { schema: CoreAiAgentQuerySchema }, async (request, reply) => {
    const { agente, prompt, usuario, contexto } = request.body as any;
    return await service.askAiAgent(agente, prompt, usuario, contexto);
  });

  fastify.get('/core/v2/ai/logs', async (request, reply) => {
    const { agente } = request.query as any;
    return await service.listAiLogs(agente);
  });
}
