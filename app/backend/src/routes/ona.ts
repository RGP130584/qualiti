import { FastifyInstance } from 'fastify';
import { OnaDiagnosticoService } from '../modules/ona/services';
import { authenticate } from '../utils/auth';
import { requireFeature } from '../utils/feature-guard';

export default async function onaRoutes(fastify: FastifyInstance) {
  const diagService = new OnaDiagnosticoService();

  // Aplica autenticação e feature flag para todas as rotas deste arquivo
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireFeature('feature:ona:core'));

  const getTenantId = (request: any): string => {
    return request.user?.unidade || 'Unidade Central';
  };

  // Lista requisitos ONA (Legacy V1 endpoint pointing to V2 data)
  fastify.get('/ona/requisitos', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      const result = await diagService.getGapAnalysis(tenantId);
      
      // Fetch the raw list from the repository to map properly to V1 format
      const rawDiagnosticos = await diagService['repo'].findAll(tenantId);
      
      // Map to V1 property naming conventions (codigo -> requisito, conformidade -> status)
      const mapped = rawDiagnosticos.map(row => ({
        id: row.id,
        codigo: row.requisito,
        requisito: row.requisito,
        categoria: row.categoria,
        nivel_ona: row.nivel_ona,
        setor: row.setor,
        conformidade: row.status,
        status: row.status,
        criticidade: row.criticidade,
        evidencias: row.evidencias,
        responsavel: row.responsavel,
        prazo: row.prazo,
        score_conformidade: row.score_conformidade
      }));
      
      return mapped;
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao buscar requisitos ONA' });
    }
  });

  // Atualiza conformidade e vincula evidências (Legacy V1 endpoint pointing to V2 data)
  fastify.put('/ona/requisitos/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { conformidade, evidencias, usuario } = request.body as any;
    const tenantId = getTenantId(request);
    try {
      // Map status in V2 to conformidade in V1
      const updateData = {
        status: conformidade,
        evidencias: evidencias
      };

      const updated = await diagService.updateDiagnostico(
        tenantId,
        Number(id),
        updateData as any,
        usuario || request.user?.nome || 'Admin'
      );

      if (!updated) {
        return reply.status(404).send({ error: 'Requisito ONA não encontrado ou não pertence a esta unidade' });
      }

      // Map back to V1 structure
      return {
        id: updated.id,
        codigo: updated.requisito,
        requisito: updated.requisito,
        conformidade: updated.status,
        status: updated.status,
        evidencias: updated.evidencias
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao atualizar requisito ONA' });
    }
  });
}
