import { FastifyInstance } from 'fastify';
import { 
  OnaDiagnosticoService, OnaEvidenciaService, 
  OnaChecklistService, OnaAuditoriaService, 
  OnaPlanoAcaoService, OnaKpiService, OnaAiService 
} from './services';
import { authenticate } from '../../utils/auth';
import { 
  OnaDiagnosticoCreateSchema, OnaEvidenciaCreateSchema, 
  OnaChecklistUpdateSchema, OnaAuditoriaCreateSchema, 
  OnaPlanoAcaoCreateSchema, OnaAiQuerySchema 
} from './schemas';

// ==========================================
// CONTROLLERS / ROTAS (CLEAN ARCHITECTURE)
// ==========================================

export async function onaV2Routes(fastify: FastifyInstance) {
  const diagService = new OnaDiagnosticoService();
  const evidService = new OnaEvidenciaService();
  const checkService = new OnaChecklistService();
  const audService = new OnaAuditoriaService();
  const planoService = new OnaPlanoAcaoService();
  const kpiService = new OnaKpiService();
  const aiService = new OnaAiService();

  // Helper helper to get tenant_id from request
  const getTenantId = (request: any): string => {
    return request.user?.unidade || 'Unidade Central';
  };

  // ----------------------------------------
  // 1. SUBMÓDULO: DIAGNÓSTICO ONA
  // ----------------------------------------

  fastify.get('/ona/v2/diagnosticos/gap-analysis', { preHandler: [authenticate] }, async (request, reply) => {
    const { setor, nivel } = request.query as any;
    const tenantId = getTenantId(request);
    return await diagService.getGapAnalysis(tenantId, setor, nivel ? Number(nivel) : undefined);
  });

  fastify.post('/ona/v2/diagnosticos', { 
    preHandler: [authenticate],
    schema: OnaDiagnosticoCreateSchema 
  }, async (request, reply) => {
    const data = request.body as any;
    const tenantId = getTenantId(request);
    return await diagService.createDiagnostico(tenantId, data, data.responsavel || request.user?.nome || 'Admin');
  });

  fastify.put('/ona/v2/diagnosticos/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const data = request.body as any;
    const tenantId = getTenantId(request);
    return await diagService.updateDiagnostico(tenantId, Number(id), data, data.responsavel || request.user?.nome || 'Admin');
  });

  fastify.delete('/ona/v2/diagnosticos/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { usuario } = request.query as any;
    const tenantId = getTenantId(request);
    return await diagService.deleteDiagnostico(tenantId, Number(id), usuario || request.user?.nome || 'Admin');
  });

  // ----------------------------------------
  // 2. SUBMÓDULO: GESTÃO DE EVIDÊNCIAS
  // ----------------------------------------

  fastify.get('/ona/v2/evidencias', { preHandler: [authenticate] }, async (request, reply) => {
    const { requisito_id } = request.query as any;
    const tenantId = getTenantId(request);
    return await evidService.listEvidencias(tenantId, requisito_id ? Number(requisito_id) : undefined);
  });

  fastify.post('/ona/v2/evidencias', { 
    preHandler: [authenticate],
    schema: OnaEvidenciaCreateSchema 
  }, async (request, reply) => {
    const data = request.body as any;
    const tenantId = getTenantId(request);
    return await evidService.processEvidenceUpload(tenantId, data, data.autor || request.user?.nome || 'Admin');
  });

  fastify.put('/ona/v2/evidencias/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { status, usuario } = request.body as any;
    const tenantId = getTenantId(request);
    return await evidService.evaluateEvidence(tenantId, Number(id), status, usuario || request.user?.nome || 'Admin');
  });

  fastify.delete('/ona/v2/evidencias/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { usuario } = request.query as any;
    const tenantId = getTenantId(request);
    return await evidService.deleteEvidence(tenantId, Number(id), usuario || request.user?.nome || 'Admin');
  });

  // ----------------------------------------
  // 3. SUBMÓDULO: CHECKLIST ONA
  // ----------------------------------------

  fastify.get('/ona/v2/checklists', { preHandler: [authenticate] }, async (request, reply) => {
    const { nivel } = request.query as any;
    const tenantId = getTenantId(request);
    return await checkService.listChecklists(tenantId, nivel ? Number(nivel) : undefined);
  });

  fastify.put('/ona/v2/checklists/:id', { 
    preHandler: [authenticate],
    schema: OnaChecklistUpdateSchema 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { conformidade, pontuacao, observacoes, evidencias_vinculadas, usuario } = request.body as any;
    const tenantId = getTenantId(request);
    return await checkService.executeChecklistValuation(tenantId, Number(id), conformidade, pontuacao, observacoes, evidencias_vinculadas, usuario || request.user?.nome || 'Admin');
  });

  // ----------------------------------------
  // 4. SUBMÓDULO: AUDITORIA ONA
  // ----------------------------------------

  fastify.get('/ona/v2/auditorias', { preHandler: [authenticate] }, async (request, reply) => {
    const { setor } = request.query as any;
    const tenantId = getTenantId(request);
    return await audService.listAuditorias(tenantId, setor);
  });

  fastify.post('/ona/v2/auditorias', { 
    preHandler: [authenticate],
    schema: OnaAuditoriaCreateSchema 
  }, async (request, reply) => {
    const data = request.body as any;
    const tenantId = getTenantId(request);
    return await audService.createAuditoriaWithCapas(tenantId, data, data.auditor_responsavel || request.user?.nome || 'Admin');
  });

  fastify.put('/ona/v2/auditorias/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { status, score_geral, usuario } = request.body as any;
    const tenantId = getTenantId(request);
    return await audService.updateAuditoriaStatus(tenantId, Number(id), status, score_geral, usuario || request.user?.nome || 'Admin');
  });

  // ----------------------------------------
  // 5. SUBMÓDULO: PLANO DE AÇÃO (CAPA)
  // ----------------------------------------

  fastify.get('/ona/v2/planos-acao', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    return await planoService.listPlanos(tenantId);
  });

  fastify.post('/ona/v2/planos-acao', { 
    preHandler: [authenticate],
    schema: OnaPlanoAcaoCreateSchema 
  }, async (request, reply) => {
    const data = request.body as any;
    const tenantId = getTenantId(request);
    return await planoService.createPlano(tenantId, data, data.responsavel || request.user?.nome || 'Admin');
  });

  fastify.put('/ona/v2/planos-acao/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { workflow_status, usuario } = request.body as any;
    const tenantId = getTenantId(request);
    return await planoService.updateStatus(tenantId, Number(id), workflow_status, usuario || request.user?.nome || 'Admin');
  });

  // ----------------------------------------
  // 6. SUBMÓDULO: INDICADORES E BI ONA
  // ----------------------------------------

  fastify.get('/ona/v2/dashboard-executivo', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    return await kpiService.getExecutiveDashboard(tenantId);
  });

  // ----------------------------------------
  // 7. SUBMÓDULO: IA ONA (COPILOTO RAG)
  // ----------------------------------------

  fastify.post('/ona/v2/ai/copilot', { 
    preHandler: [authenticate],
    schema: OnaAiQuerySchema 
  }, async (request, reply) => {
    const { pergunta, usuario, setor_contexto } = request.body as any;
    const tenantId = getTenantId(request);
    return await aiService.askCopilot(tenantId, pergunta, usuario || request.user?.nome || 'Admin', setor_contexto);
  });

  fastify.get('/ona/v2/ai/history', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    return await aiService.getAiHistory(tenantId);
  });
}
