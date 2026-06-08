import { FastifyInstance } from 'fastify';
import pool from '../db';
import { authenticate } from '../utils/auth';
import { requireFeature } from '../utils/feature-guard';

export default async function auditRoutes(fastify: FastifyInstance) {
  // Aplica autenticação e feature flag para todas as rotas de auditoria neste arquivo
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireFeature('feature:audit:core'));

  // Lista logs de auditoria (Event Sourcing / LGPD) do mesmo tenant
  fastify.get('/audit/logs', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM auditoria_logs WHERE tenant_id = $1 ORDER BY id DESC LIMIT 200', [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Registra log manual/externo sob o mesmo tenant
  fastify.post('/audit/logs', async (request: any, reply) => {
    const { usuario, acao, entidade, entidade_id } = request.body as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `, [usuario || 'Sistema', acao, entidade, entidade_id, request.ip, tenantId]);

      return res.rows[0];
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao registrar log de auditoria' });
    } finally {
      client.release();
    }
  });
}
