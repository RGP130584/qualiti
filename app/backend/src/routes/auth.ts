import { FastifyInstance } from 'fastify';
import pool from '../db';
import bcrypt from 'bcryptjs';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT id, nome, email, senha_hash, rbac_role, departamento, unidade, mfa_enabled FROM usuarios WHERE email = $1', [email]);
      if (res.rows.length === 0) {
        return reply.status(401).send({ error: 'Credenciais inválidas' });
      }

      const user = res.rows[0];
      const isValid = await bcrypt.compare(password, user.senha_hash);
      if (!isValid) {
        return reply.status(401).send({ error: 'Credenciais inválidas' });
      }

      // Gera JWT
      const token = fastify.jwt.sign({
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.rbac_role,
        departamento: user.departamento,
        unidade: user.unidade
      });

      // Registra log de auditoria
      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, ip) 
        VALUES ($1, 'LOGIN_SUCCESS', 'AUTH', $2)
      `, [user.email, request.ip]);

      return {
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.rbac_role,
          departamento: user.departamento,
          unidade: user.unidade,
          mfa_enabled: user.mfa_enabled
        }
      };
    } finally {
      client.release();
    }
  });

  fastify.get('/auth/me', {
    onRequest: [async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: 'Não autorizado' });
      }
    }]
  }, async (request, reply) => {
    return request.user;
  });
}
