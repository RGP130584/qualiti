"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreV2Routes = coreV2Routes;
const services_1 = require("./services");
const schemas_1 = require("./schemas");
// ==========================================
// CONTROLLERS / ROTAS: CORE PLATFORM (CLEAN ARCHITECTURE)
// ==========================================
async function coreV2Routes(fastify) {
    const service = new services_1.CoreService();
    // ----------------------------------------
    // 1. OCORRÊNCIAS INTELIGENTES (RELATAR OCORRÊNCIA)
    // ----------------------------------------
    fastify.get('/core/v2/ocorrencias', async (request, reply) => {
        const { setor } = request.query;
        return await service.listOcorrencias(setor);
    });
    fastify.post('/core/v2/ocorrencias', { schema: schemas_1.CoreOcorrenciaCreateSchema }, async (request, reply) => {
        const data = request.body;
        return await service.processRelatarOcorrencia(data);
    });
    fastify.put('/core/v2/ocorrencias/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { status, plano_capa, usuario } = request.body;
        return await service.updateOcorrenciaStatus(Number(id), status, plano_capa, usuario || 'Gestor da Qualidade');
    });
    // ----------------------------------------
    // 2. GESTÃO DOCUMENTAL INTELIGENTE
    // ----------------------------------------
    fastify.get('/core/v2/documentos', async (request, reply) => {
        const { setor } = request.query;
        return await service.listDocumentos(setor);
    });
    fastify.post('/core/v2/documentos', { schema: schemas_1.CoreDocumentoCreateSchema }, async (request, reply) => {
        const data = request.body;
        return await service.createDocumento(data);
    });
    // ----------------------------------------
    // 3. AUDITORIA INTELIGENTE
    // ----------------------------------------
    fastify.get('/core/v2/auditorias', async (request, reply) => {
        const { setor } = request.query;
        return await service.listAuditorias(setor);
    });
    // ----------------------------------------
    // 4. GESTÃO DE RISCOS
    // ----------------------------------------
    fastify.get('/core/v2/riscos', async (request, reply) => {
        const { setor } = request.query;
        return await service.listRiscos(setor);
    });
    // ----------------------------------------
    // 5. SEGURANÇA OPERACIONAL
    // ----------------------------------------
    fastify.get('/core/v2/seguranca', async (request, reply) => {
        const { setor } = request.query;
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
    fastify.post('/core/v2/ai/agent', { schema: schemas_1.CoreAiAgentQuerySchema }, async (request, reply) => {
        const { agente, prompt, usuario, contexto } = request.body;
        return await service.askAiAgent(agente, prompt, usuario, contexto);
    });
    fastify.get('/core/v2/ai/logs', async (request, reply) => {
        const { agente } = request.query;
        return await service.listAiLogs(agente);
    });
}
