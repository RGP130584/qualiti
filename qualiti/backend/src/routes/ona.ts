import { FastifyInstance } from 'fastify';
import pool from '../db';

export default async function onaRoutes(fastify: FastifyInstance) {
  // Lista requisitos ONA
  fastify.get('/ona/requisitos', async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_requisitos ORDER BY codigo ASC');
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Atualiza conformidade e vincula evidências
  fastify.put('/ona/requisitos/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { conformidade, evidencias, usuario } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_requisitos 
        SET conformidade = $1, evidencias = $2, data_atualizacao = CURRENT_TIMESTAMP 
        WHERE id = $3 
        RETURNING *;
      `, [conformidade, JSON.stringify(evidencias || []), id]);

      if (res.rows.length === 0) {
        return reply.status(404).send({ error: 'Requisito ONA não encontrado' });
      }

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_REQUIREMENT_UPDATE', 'ONA', $2, $3)
      `, [usuario || 'Admin', res.rows[0].codigo, request.ip]);

      return res.rows[0];
    } finally {
      client.release();
    }
  });
}
