import { FastifyInstance } from 'fastify';
import { CoreService } from '../modules/core/services';
import { authenticate } from '../utils/auth';
import { requireFeature } from '../utils/feature-guard';

export default async function incidentsRoutes(fastify: FastifyInstance) {
  const service = new CoreService();

  // Aplica autenticação e feature flag para todas as rotas deste arquivo
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireFeature('feature:riscos:core'));

  const getTenantId = (request: any): string => {
    return request.user?.unidade || 'Unidade Central';
  };

  // Lista incidentes
  fastify.get('/incidents', { preHandler: [authenticate] }, async (request, reply) => {
    const { setor } = request.query as any;
    const tenantId = getTenantId(request);
    try {
      const occurrences = await service.listOcorrencias(tenantId, setor);
      return occurrences;
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar ocorrências' });
    }
  });

  // Cria incidente
  fastify.post('/incidents', { preHandler: [authenticate] }, async (request, reply) => {
    const { titulo, descricao, tipo, severidade, setor, relator } = request.body as any;
    const tenantId = getTenantId(request);
    try {
      const occurrence = await service.processRelatarOcorrencia(tenantId, {
        titulo,
        descricao,
        tipo,
        severidade,
        setor,
        relator: relator || request.user?.nome || 'Anônimo / Usuário',
        status: 'Em Investigação IA'
      });
      return occurrence;
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao registrar ocorrência' });
    }
  });

  // Atualiza incidente (Ishikawa / CAPA)
  fastify.put('/incidents/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { status, causa_raiz_ishikawa, plano_acao_capa, usuario } = request.body as any;
    const tenantId = getTenantId(request);
    try {
      const occurrence = await service.updateOcorrenciaStatus(
        tenantId,
        Number(id),
        status,
        null, // plano_capa V2 is mapped to plano_acao_capa inside updateOcorrenciaStatus
        usuario || request.user?.nome || 'Admin',
        causa_raiz_ishikawa,
        plano_acao_capa
      );

      if (!occurrence) {
        return reply.status(404).send({ error: 'Ocorrência não encontrada' });
      }

      return occurrence;
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao atualizar ocorrência' });
    }
  });
}
