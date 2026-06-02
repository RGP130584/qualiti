import { FastifyRequest, FastifyReply } from 'fastify';
import pool from './db';

export class HealthController {
  check = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dbCheck = await pool.query('SELECT 1');
      if (dbCheck.rowCount === 1) {
        return reply.send({ status: 'ok', database: 'connected', timestamp: new Date() });
      }
    } catch (e: any) {
      request.log.error(e);
      return reply.status(503).send({ status: 'error', database: 'disconnected', reason: e.message });
    }
  }
}
