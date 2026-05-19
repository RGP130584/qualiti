import { FastifyInstance } from 'fastify';
import pool from '../db';

export default async function auditRoutes(fastify: FastifyInstance) {
  // Lista logs de auditoria (Event Sourcing / LGPD)
  fastify.get('/audit/logs', async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM auditoria_logs ORDER BY id DESC LIMIT 200');
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Registra log manual/externo
  fastify.post('/audit/logs', async (request, reply) => {
    const { usuario, acao, entidade, entidade_id } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [usuario || 'Sistema', acao, entidade, entidade_id, request.ip]);

      return res.rows[0];
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao registrar log de auditoria' });
    } finally {
      client.release();
    }
  });
}
