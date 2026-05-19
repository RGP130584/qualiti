import { FastifyInstance } from 'fastify';
import { 
  OnaDiagnosticoService, OnaEvidenciaService, 
  OnaChecklistService, OnaAuditoriaService, 
  OnaPlanoAcaoService, OnaKpiService, OnaAiService 
} from './services';
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

  // ----------------------------------------
  // 1. SUBMÓDULO: DIAGNÓSTICO ONA
  // ----------------------------------------

  fastify.get('/ona/v2/diagnosticos/gap-analysis', async (request, reply) => {
    const { setor, nivel } = request.query as any;
    return await diagService.getGapAnalysis(setor, nivel ? Number(nivel) : undefined);
  });

  fastify.post('/ona/v2/diagnosticos', { schema: OnaDiagnosticoCreateSchema }, async (request, reply) => {
    const data = request.body as any;
    return await diagService.createDiagnostico(data, data.responsavel);
  });

  fastify.put('/ona/v2/diagnosticos/:id', async (request, reply) => {
    const { id } = request.params as any;
    const data = request.body as any;
    return await diagService.updateDiagnostico(Number(id), data, data.responsavel || 'Admin');
  });

  fastify.delete('/ona/v2/diagnosticos/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { usuario } = request.query as any;
    return await diagService.deleteDiagnostico(Number(id), usuario || 'Admin');
  });

  // ----------------------------------------
  // 2. SUBMÓDULO: GESTÃO DE EVIDÊNCIAS
  // ----------------------------------------

  fastify.get('/ona/v2/evidencias', async (request, reply) => {
    const { requisito_id } = request.query as any;
    return await evidService.listEvidencias(requisito_id ? Number(requisito_id) : undefined);
  });

  fastify.post('/ona/v2/evidencias', { schema: OnaEvidenciaCreateSchema }, async (request, reply) => {
    const data = request.body as any;
    return await evidService.processEvidenceUpload(data, data.autor);
  });

  fastify.put('/ona/v2/evidencias/:id/status', async (request, reply) => {
    const { id } = request.params as any;
    const { status, usuario } = request.body as any;
    return await evidService.evaluateEvidence(Number(id), status, usuario || 'Admin');
  });

  fastify.delete('/ona/v2/evidencias/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { usuario } = request.query as any;
    return await evidService.deleteEvidence(Number(id), usuario || 'Admin');
  });

  // ----------------------------------------
  // 3. SUBMÓDULO: CHECKLIST ONA
  // ----------------------------------------

  fastify.get('/ona/v2/checklists', async (request, reply) => {
    const { nivel } = request.query as any;
    return await checkService.listChecklists(nivel ? Number(nivel) : undefined);
  });

  fastify.put('/ona/v2/checklists/:id', { schema: OnaChecklistUpdateSchema }, async (request, reply) => {
    const { id } = request.params as any;
    const { conformidade, pontuacao, observacoes, evidencias_vinculadas, usuario } = request.body as any;
    return await checkService.executeChecklistValuation(Number(id), conformidade, pontuacao, observacoes, evidencias_vinculadas, usuario);
  });

  // ----------------------------------------
  // 4. SUBMÓDULO: AUDITORIA ONA
  // ----------------------------------------

  fastify.get('/ona/v2/auditorias', async (request, reply) => {
    const { setor } = request.query as any;
    return await audService.listAuditorias(setor);
  });

  fastify.post('/ona/v2/auditorias', { schema: OnaAuditoriaCreateSchema }, async (request, reply) => {
    const data = request.body as any;
    return await audService.createAuditoriaWithCapas(data, data.auditor_responsavel);
  });

  fastify.put('/ona/v2/auditorias/:id/status', async (request, reply) => {
    const { id } = request.params as any;
    const { status, score_geral, usuario } = request.body as any;
    return await audService.updateAuditoriaStatus(Number(id), status, score_geral, usuario || 'Admin');
  });

  // ----------------------------------------
  // 5. SUBMÓDULO: PLANO DE AÇÃO (CAPA)
  // ----------------------------------------

  fastify.get('/ona/v2/planos-acao', async (request, reply) => {
    return await planoService.listPlanos();
  });

  fastify.post('/ona/v2/planos-acao', { schema: OnaPlanoAcaoCreateSchema }, async (request, reply) => {
    const data = request.body as any;
    return await planoService.createPlano(data, data.responsavel);
  });

  fastify.put('/ona/v2/planos-acao/:id/status', async (request, reply) => {
    const { id } = request.params as any;
    const { workflow_status, usuario } = request.body as any;
    return await planoService.updateStatus(Number(id), workflow_status, usuario || 'Admin');
  });

  // ----------------------------------------
  // 6. SUBMÓDULO: INDICADORES E BI ONA
  // ----------------------------------------

  fastify.get('/ona/v2/dashboard-executivo', async (request, reply) => {
    return await kpiService.getExecutiveDashboard();
  });

  // ----------------------------------------
  // 7. SUBMÓDULO: IA ONA (COPILOTO RAG)
  // ----------------------------------------

  fastify.post('/ona/v2/ai/copilot', { schema: OnaAiQuerySchema }, async (request, reply) => {
    const { pergunta, usuario, setor_contexto } = request.body as any;
    return await aiService.askCopilot(pergunta, usuario, setor_contexto);
  });

  fastify.get('/ona/v2/ai/history', async (request, reply) => {
    return await aiService.getAiHistory();
  });
}
