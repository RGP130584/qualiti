import { FastifyInstance } from 'fastify';
import { BpmService } from '../modules/bpm/services';
import { authenticate } from '../utils/auth';
import { requireFeature } from '../utils/feature-guard';

export default async function bpmRoutes(fastify: FastifyInstance) {
  const service = new BpmService();

  // Aplica autenticação e feature flag para todas as rotas deste arquivo
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireFeature('feature:bpm:core'));

  const getTenantId = (request: any): string => {
    return request.user?.unidade || 'Unidade Central';
  };

  // Lista fluxos configurados
  fastify.get('/bpm/fluxos', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      return await service.listFluxos(tenantId);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar fluxos BPM' });
    }
  });

  // Cria ou atualiza um fluxo BPM
  fastify.post('/bpm/fluxos', { preHandler: [authenticate] }, async (request, reply) => {
    const { nome, descricao, bpmn_json, sla_horas } = request.body as any;
    const tenantId = getTenantId(request);
    try {
      const flow = await service.createFluxo(tenantId, {
        nome,
        descricao,
        bpmn_json,
        sla_horas
      });
      return flow;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao criar fluxo BPM' });
    }
  });

  // Lista execuções em andamento
  fastify.get('/bpm/execucoes', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      return await service.listExecucoes(tenantId);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar execuções BPM' });
    }
  });

  // Inicia uma nova execução de processo
  fastify.post('/bpm/execucoes', { preHandler: [authenticate] }, async (request, reply) => {
    const { fluxo_id, solicitante } = request.body as any;
    const tenantId = getTenantId(request);
    try {
      const execution = await service.startExecucao(
        tenantId,
        Number(fluxo_id),
        solicitante || request.user?.nome || 'Usuário Sistema'
      );
      return execution;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao iniciar execução' });
    }
  });

  // Avança uma execução para a próxima etapa
  fastify.post('/bpm/execucoes/:id/avancar', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { usuario, proxima_etapa, status_final } = request.body as any;
    const tenantId = getTenantId(request);
    try {
      const execution = await service.avancarExecucao(
        tenantId,
        Number(id),
        usuario || request.user?.nome || 'Admin',
        proxima_etapa,
        status_final
      );
      return execution;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao avançar execução do fluxo' });
    }
  });
}
