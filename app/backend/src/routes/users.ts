import { FastifyInstance } from 'fastify';
import pool from '../db';
import { hashPassword } from '../utils/crypto';
import { authenticate } from '../utils/auth';

export default async function usersRoutes(fastify: FastifyInstance) {
  // Aplica autenticação global para todas as rotas neste arquivo
  fastify.addHook('preHandler', authenticate);

  // Lista usuários do mesmo tenant
  fastify.get('/users', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT id, nome, email, rbac_role, departamento, unidade, mfa_enabled, data_criacao FROM usuarios WHERE unidade = $1 ORDER BY id ASC',
        [tenantId]
      );
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Cria usuário sob o mesmo tenant e verifica cota contratada
  fastify.post('/users', async (request: any, reply) => {
    const { nome, email, senha, rbac_role, departamento, mfa_enabled } = request.body as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      // 1. Validar cota contratada de usuários
      const quotaRes = await client.query(`
        SELECT p.cota_usuarios 
        FROM pal_assinaturas a
        JOIN pal_planos p ON a.plano_id = p.id
        WHERE a.tenant_id = $1
      `, [tenantId]);
      const quota = quotaRes.rows.length > 0 ? quotaRes.rows[0].cota_usuarios : 10;

      const countRes = await client.query(`
        SELECT COUNT(*) FROM usuarios WHERE unidade = $1 AND ativo = TRUE
      `, [tenantId]);
      const activeUsersCount = parseInt(countRes.rows[0].count);

      if (activeUsersCount >= quota) {
        return reply.status(400).send({ error: `Limite de usuários esgotado para esta instituição. (Cota contratada: ${quota} usuários)` });
      }

      // 2. Proceder com a inserção
      const hashedPassword = hashPassword(senha || 'senha123');
      const res = await client.query(`
        INSERT INTO usuarios (nome, email, senha_hash, rbac_role, departamento, unidade, mfa_enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, nome, email, rbac_role, departamento, unidade, mfa_enabled, data_criacao;
      `, [nome, email, hashedPassword, rbac_role || 'Gestor da Qualidade', departamento || 'Geral', tenantId, mfa_enabled || false]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip, tenant_id)
        VALUES ($1, 'USER_CREATE', 'USERS', $2, $3, $4)
      `, [request.user.email, email, request.ip, tenantId]);

      return res.rows[0];
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar usuário (email pode já existir)' });
    } finally {
      client.release();
    }
  });

  // Atualiza usuário se pertencer ao mesmo tenant
  fastify.put('/users/:id', async (request: any, reply) => {
    const { id } = request.params as any;
    const { nome, rbac_role, departamento, mfa_enabled } = request.body as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE usuarios 
        SET nome = $1, rbac_role = $2, departamento = $3, mfa_enabled = $4 
        WHERE id = $5 AND unidade = $6
        RETURNING id, nome, email, rbac_role, departamento, unidade, mfa_enabled;
      `, [nome, rbac_role, departamento, mfa_enabled, id, tenantId]);

      if (res.rows.length === 0) {
        return reply.status(404).send({ error: 'Usuário não encontrado nesta instituição' });
      }

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip, tenant_id)
        VALUES ($1, 'USER_UPDATE', 'USERS', $2, $3, $4)
      `, [request.user.email, res.rows[0].email, request.ip, tenantId]);

      return res.rows[0];
    } finally {
      client.release();
    }
  });

  // Remove usuário do mesmo tenant
  fastify.delete('/users/:id', async (request: any, reply) => {
    const { id } = request.params as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      const resUser = await client.query('SELECT email FROM usuarios WHERE id = $1 AND unidade = $2', [id, tenantId]);
      if (resUser.rows.length === 0) {
        return reply.status(404).send({ error: 'Usuário não encontrado nesta instituição' });
      }

      await client.query('DELETE FROM usuarios WHERE id = $1 AND unidade = $2', [id, tenantId]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip, tenant_id)
        VALUES ($1, 'USER_DELETE', 'USERS', $2, $3, $4)
      `, [request.user.email, resUser.rows[0].email, request.ip, tenantId]);

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
      return reply.status(500).send({ error: 'Erro ao cadastrar função (nome pode já existir)' });
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
