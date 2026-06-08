import { FastifyInstance } from 'fastify';
import pool from '../db';
import { eventBus } from '../utils/event-bus';
import { authenticate } from '../utils/auth';

export default async function eventRoutes(fastify: FastifyInstance) {
  // Lista itens na DLQ
  fastify.get('/events/dlq', { preHandler: [authenticate] }, async (request, reply) => {
    // Check if the user is Admin (for security)
    if (request.user?.role !== 'Admin' && request.user?.role !== 'Gestor da Qualidade') {
      return reply.status(403).send({ error: 'Acesso negado: Requer privilégios administrativos' });
    }

    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM event_dlq ORDER BY id DESC');
      return res.rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar DLQ' });
    } finally {
      client.release();
    }
  });

  // Dispara replay manual de evento da DLQ
  fastify.post('/events/replay', { preHandler: [authenticate] }, async (request, reply) => {
    // Check if the user is Admin
    if (request.user?.role !== 'Admin' && request.user?.role !== 'Gestor da Qualidade') {
      return reply.status(403).send({ error: 'Acesso negado: Requer privilégios administrativos' });
    }

    const { dlqId } = request.body as any;
    if (!dlqId) {
      return reply.status(400).send({ error: 'ID do evento DLQ (dlqId) é obrigatório' });
    }

    try {
      const success = await eventBus.replayEvent(Number(dlqId));
      if (!success) {
        return reply.status(404).send({ error: 'Item na DLQ não encontrado, não pendente ou falhou no replay' });
      }

      return { success: true, message: `Evento #${dlqId} redisparado com sucesso!` };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao processar replay de evento' });
    }
  });
}
