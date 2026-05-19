import { FastifyInstance } from 'fastify';
import pool from '../db';

export default async function usersRoutes(fastify: FastifyInstance) {
  // Lista usuários
  fastify.get('/users', async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT id, nome, email, rbac_role, departamento, unidade, mfa_enabled, data_criacao FROM usuarios ORDER BY id ASC');
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Cria usuário
  fastify.post('/users', async (request, reply) => {
    const { nome, email, senha, rbac_role, departamento, unidade, mfa_enabled } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO usuarios (nome, email, senha_hash, rbac_role, departamento, unidade, mfa_enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, nome, email, rbac_role, departamento, unidade, mfa_enabled, data_criacao;
      `, [nome, email, senha || 'senha123', rbac_role || 'Gestor da Qualidade', departamento || 'Geral', unidade || 'Unidade Central', mfa_enabled || false]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ('Admin', 'USER_CREATE', 'USERS', $1, $2)
      `, [email, request.ip]);

      return res.rows[0];
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao criar usuário (email pode já existir)' });
    } finally {
      client.release();
    }
  });

  // Atualiza usuário
  fastify.put('/users/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { nome, rbac_role, departamento, unidade, mfa_enabled } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE usuarios 
        SET nome = $1, rbac_role = $2, departamento = $3, unidade = $4, mfa_enabled = $5 
        WHERE id = $6 
        RETURNING id, nome, email, rbac_role, departamento, unidade, mfa_enabled;
      `, [nome, rbac_role, departamento, unidade, mfa_enabled, id]);

      if (res.rows.length === 0) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ('Admin', 'USER_UPDATE', 'USERS', $1, $2)
      `, [res.rows[0].email, request.ip]);

      return res.rows[0];
    } finally {
      client.release();
    }
  });

  // Remove usuário
  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params as any;
    const client = await pool.connect();
    try {
      const resUser = await client.query('SELECT email FROM usuarios WHERE id = $1', [id]);
      if (resUser.rows.length === 0) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      await client.query('DELETE FROM usuarios WHERE id = $1', [id]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ('Admin', 'USER_DELETE', 'USERS', $1, $2)
      `, [resUser.rows[0].email, request.ip]);

      return { success: true, message: 'Usuário removido com sucesso' };
    } finally {
      client.release();
    }
  });

  // ==========================================
  // ROTAS DE FUNÇÕES CADASTRADAS (MENU EDITÁVEL)
  // ==========================================

  // Lista funções cadastradas
  fastify.get('/funcoes', async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM funcoes_cadastradas ORDER BY id ASC');
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Cria nova função/cargo no menu editável
  fastify.post('/funcoes', async (request, reply) => {
    const { nome, is_rt, descricao } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO funcoes_cadastradas (nome, is_rt, descricao)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [nome, is_rt || false, descricao || '']);
      return res.rows[0];
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao cadastrar função (nome pode já existir)' });
    } finally {
      client.release();
    }
  });

  // Remove função cadastrada
  fastify.delete('/funcoes/:id', async (request, reply) => {
    const { id } = request.params as any;
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM funcoes_cadastradas WHERE id = $1', [id]);
      return { success: true, message: 'Função removida com sucesso' };
    } finally {
      client.release();
    }
  });
}
