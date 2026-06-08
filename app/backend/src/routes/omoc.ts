import { FastifyInstance } from 'fastify';
import { omocService } from '../modules/omoc/services';
import { authenticate } from '../utils/auth';
import { requireFeature } from '../utils/feature-guard';

export default async function omocRoutes(fastify: FastifyInstance) {
  const getTenantId = (request: any): string => {
    return request.user?.unidade || 'Unidade Central';
  };

  // Aplica autenticação e feature flag para todas as rotas de organograma
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireFeature('feature:omoc:core'));

  // ----------------------------------------
  // 1. CARGOS ENDPOINTS
  // ----------------------------------------
  fastify.get('/omoc/cargos', async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      return await omocService.listCargos(tenantId);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar cargos' });
    }
  });

  fastify.post('/omoc/cargos', async (request, reply) => {
    const tenantId = getTenantId(request);
    const data = request.body as any;
    try {
      const cargo = await omocService.createCargo(tenantId, data);
      return cargo;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao criar cargo' });
    }
  });

  fastify.delete('/omoc/cargos/:id', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as any;
    try {
      const deleted = await omocService.deleteCargo(tenantId, Number(id));
      if (!deleted) {
        return reply.status(404).send({ error: 'Cargo não encontrado.' });
      }
      return { success: true, message: 'Cargo excluído com sucesso.' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao deletar cargo' });
    }
  });

  // ----------------------------------------
  // 2. OCUPAÇÕES (VAGAS) ENDPOINTS
  // ----------------------------------------
  fastify.get('/omoc/ocupacoes', async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      return await omocService.listOcupacoes(tenantId);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar ocupações' });
    }
  });

  fastify.post('/omoc/ocupacoes', async (request, reply) => {
    const tenantId = getTenantId(request);
    const data = request.body as any;
    try {
      const ocupacao = await omocService.createOcupacao(tenantId, data);
      return ocupacao;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao vincular colaborador ao cargo' });
    }
  });

  // Desligamento/Terminação de Ocupação de Vaga (Dispara reatribuição BPM)
  fastify.post('/omoc/ocupacoes/:id/terminate', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as any;
    try {
      const terminated = await omocService.terminateOcupacao(tenantId, Number(id));
      return { success: terminated, message: 'Vínculo do colaborador finalizado e vaga liberada.' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao finalizar vínculo de cargo.' });
    }
  });

  fastify.delete('/omoc/ocupacoes/:id', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as any;
    try {
      const deleted = await omocService.terminateOcupacao(tenantId, Number(id));
      return { success: deleted, message: 'Ocupação deletada com sucesso.' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao deletar ocupação.' });
    }
  });

  // ----------------------------------------
  // 3. REPORTES (HIERARQUIA) ENDPOINTS
  // ----------------------------------------
  fastify.get('/omoc/reportes', async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      return await omocService.listReportes(tenantId);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar reportes hierárquicos' });
    }
  });

  fastify.post('/omoc/reportes', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { subordinate_cargo_id, superior_cargo_id, tipo } = request.body as any;
    try {
      const reporte = await omocService.createReporte(
        tenantId,
        Number(subordinate_cargo_id),
        Number(superior_cargo_id),
        tipo
      );
      return reporte;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao criar reporte hierárquico' });
    }
  });

  fastify.delete('/omoc/reportes', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { subordinate_cargo_id, superior_cargo_id } = request.query as any;
    try {
      const deleted = await omocService.deleteReporte(
        tenantId,
        Number(subordinate_cargo_id),
        Number(superior_cargo_id)
      );
      return { success: deleted, message: 'Relação hierárquica removida com sucesso.' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao remover reporte.' });
    }
  });

  // ----------------------------------------
  // 4. SUBSTITUTOS ENDPOINTS
  // ----------------------------------------
  fastify.get('/omoc/substitutos', async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      return await omocService.listSubstitutos(tenantId);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar substituições temporárias' });
    }
  });

  fastify.post('/omoc/substitutos', async (request, reply) => {
    const tenantId = getTenantId(request);
    const data = request.body as any;
    try {
      const substituto = await omocService.createSubstituto(tenantId, data);
      return substituto;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao cadastrar substituto' });
    }
  });

  fastify.delete('/omoc/substitutos/:id', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = request.params as any;
    try {
      const deleted = await omocService.deleteSubstituto(tenantId, Number(id));
      return { success: deleted, message: 'Substituição removida com sucesso.' };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao deletar substituição.' });
    }
  });
}
