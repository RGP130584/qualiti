"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onaV2Routes = onaV2Routes;
const services_1 = require("./services");
const schemas_1 = require("./schemas");
// ==========================================
// CONTROLLERS / ROTAS (CLEAN ARCHITECTURE)
// ==========================================
async function onaV2Routes(fastify) {
    const diagService = new services_1.OnaDiagnosticoService();
    const evidService = new services_1.OnaEvidenciaService();
    const checkService = new services_1.OnaChecklistService();
    const audService = new services_1.OnaAuditoriaService();
    const planoService = new services_1.OnaPlanoAcaoService();
    const kpiService = new services_1.OnaKpiService();
    const aiService = new services_1.OnaAiService();
    // ----------------------------------------
    // 1. SUBMÓDULO: DIAGNÓSTICO ONA
    // ----------------------------------------
    fastify.get('/ona/v2/diagnosticos/gap-analysis', async (request, reply) => {
        const { setor, nivel } = request.query;
        return await diagService.getGapAnalysis(setor, nivel ? Number(nivel) : undefined);
    });
    fastify.post('/ona/v2/diagnosticos', { schema: schemas_1.OnaDiagnosticoCreateSchema }, async (request, reply) => {
        const data = request.body;
        return await diagService.createDiagnostico(data, data.responsavel);
    });
    fastify.put('/ona/v2/diagnosticos/:id', async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
        return await diagService.updateDiagnostico(Number(id), data, data.responsavel || 'Admin');
    });
    fastify.delete('/ona/v2/diagnosticos/:id', async (request, reply) => {
        const { id } = request.params;
        const { usuario } = request.query;
        return await diagService.deleteDiagnostico(Number(id), usuario || 'Admin');
    });
    // ----------------------------------------
    // 2. SUBMÓDULO: GESTÃO DE EVIDÊNCIAS
    // ----------------------------------------
    fastify.get('/ona/v2/evidencias', async (request, reply) => {
        const { requisito_id } = request.query;
        return await evidService.listEvidencias(requisito_id ? Number(requisito_id) : undefined);
    });
    fastify.post('/ona/v2/evidencias', { schema: schemas_1.OnaEvidenciaCreateSchema }, async (request, reply) => {
        const data = request.body;
        return await evidService.processEvidenceUpload(data, data.autor);
    });
    fastify.put('/ona/v2/evidencias/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { status, usuario } = request.body;
        return await evidService.evaluateEvidence(Number(id), status, usuario || 'Admin');
    });
    fastify.delete('/ona/v2/evidencias/:id', async (request, reply) => {
        const { id } = request.params;
        const { usuario } = request.query;
        return await evidService.deleteEvidence(Number(id), usuario || 'Admin');
    });
    // ----------------------------------------
    // 3. SUBMÓDULO: CHECKLIST ONA
    // ----------------------------------------
    fastify.get('/ona/v2/checklists', async (request, reply) => {
        const { nivel } = request.query;
        return await checkService.listChecklists(nivel ? Number(nivel) : undefined);
    });
    fastify.put('/ona/v2/checklists/:id', { schema: schemas_1.OnaChecklistUpdateSchema }, async (request, reply) => {
        const { id } = request.params;
        const { conformidade, pontuacao, observacoes, evidencias_vinculadas, usuario } = request.body;
        return await checkService.executeChecklistValuation(Number(id), conformidade, pontuacao, observacoes, evidencias_vinculadas, usuario);
    });
    // ----------------------------------------
    // 4. SUBMÓDULO: AUDITORIA ONA
    // ----------------------------------------
    fastify.get('/ona/v2/auditorias', async (request, reply) => {
        const { setor } = request.query;
        return await audService.listAuditorias(setor);
    });
    fastify.post('/ona/v2/auditorias', { schema: schemas_1.OnaAuditoriaCreateSchema }, async (request, reply) => {
        const data = request.body;
        return await audService.createAuditoriaWithCapas(data, data.auditor_responsavel);
    });
    fastify.put('/ona/v2/auditorias/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { status, score_geral, usuario } = request.body;
        return await audService.updateAuditoriaStatus(Number(id), status, score_geral, usuario || 'Admin');
    });
    // ----------------------------------------
    // 5. SUBMÓDULO: PLANO DE AÇÃO (CAPA)
    // ----------------------------------------
    fastify.get('/ona/v2/planos-acao', async (request, reply) => {
        return await planoService.listPlanos();
    });
    fastify.post('/ona/v2/planos-acao', { schema: schemas_1.OnaPlanoAcaoCreateSchema }, async (request, reply) => {
        const data = request.body;
        return await planoService.createPlano(data, data.responsavel);
    });
    fastify.put('/ona/v2/planos-acao/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { workflow_status, usuario } = request.body;
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
    fastify.post('/ona/v2/ai/copilot', { schema: schemas_1.OnaAiQuerySchema }, async (request, reply) => {
        const { pergunta, usuario, setor_contexto } = request.body;
        return await aiService.askCopilot(pergunta, usuario, setor_contexto);
    });
    fastify.get('/ona/v2/ai/history', async (request, reply) => {
        return await aiService.getAiHistory();
    });
}
