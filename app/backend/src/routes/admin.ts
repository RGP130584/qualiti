import { FastifyInstance } from 'fastify';
import pool from '../db';
import { authenticate } from '../utils/auth';

export default async function adminRoutes(fastify: FastifyInstance) {
  // Aplica autenticação global para todas as rotas de administração neste arquivo
  fastify.addHook('preHandler', authenticate);

  // ==========================================
  // GERENCIAMENTO DE SETORES DINÂMICOS
  // ==========================================
  fastify.get('/admin/setores', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    try {
      const res = await pool.query('SELECT * FROM setores_config WHERE tenant_id = $1 ORDER BY nome ASC', [tenantId]);
      return reply.send(res.rows);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao buscar setores configurados' });
    }
  });

  fastify.post('/admin/setores', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const { nome, departamento_pai, descricao, categorias_customizadas } = request.body;
    try {
      const res = await pool.query(`
        INSERT INTO setores_config (tenant_id, nome, departamento_pai, descricao, categorias_customizadas)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [tenantId, nome, departamento_pai, descricao, JSON.stringify(categorias_customizadas || [])]);
      return reply.status(201).send(res.rows[0]);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar setor dinâmico (nome pode já existir para esta instituição)' });
    }
  });

  fastify.put('/admin/setores/:id', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const { id } = request.params;
    const { nome, departamento_pai, descricao, categorias_customizadas, ativo } = request.body;
    try {
      const res = await pool.query(`
        UPDATE setores_config 
        SET nome = $1, departamento_pai = $2, descricao = $3, categorias_customizadas = $4, ativo = $5
        WHERE id = $6 AND tenant_id = $7
        RETURNING *;
      `, [nome, departamento_pai, descricao, JSON.stringify(categorias_customizadas || []), ativo, id, tenantId]);
      
      if (res.rows.length === 0) {
        return reply.status(404).send({ error: 'Setor não encontrado nesta instituição' });
      }
      return reply.send(res.rows[0]);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao atualizar setor dinâmico' });
    }
  });

  fastify.delete('/admin/setores/:id', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const { id } = request.params;
    try {
      const res = await pool.query('DELETE FROM setores_config WHERE id = $1 AND tenant_id = $2 RETURNING id', [id, tenantId]);
      if (res.rows.length === 0) {
        return reply.status(404).send({ error: 'Setor não encontrado nesta instituição' });
      }
      return reply.send({ success: true, message: 'Setor removido com sucesso' });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao remover setor dinâmico' });
    }
  });

  // ==========================================
  // GERENCIAMENTO DE CARGOS DINÂMICOS
  // ==========================================
  fastify.get('/admin/cargos', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    try {
      const res = await pool.query('SELECT * FROM cargos_config WHERE tenant_id = $1 ORDER BY nome ASC', [tenantId]);
      return reply.send(res.rows);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao buscar cargos configurados' });
    }
  });

  fastify.post('/admin/cargos', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const { nome, setor_nome, rbac_role, permissoes_customizadas } = request.body;
    try {
      const res = await pool.query(`
        INSERT INTO cargos_config (tenant_id, nome, setor_nome, rbac_role, permissoes_customizadas)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [tenantId, nome, setor_nome, rbac_role, JSON.stringify(permissoes_customizadas || {})]);
      return reply.status(201).send(res.rows[0]);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar cargo dinâmico' });
    }
  });

  // ==========================================
  // GERENCIAMENTO DE TIPOS DOCUMENTAIS DINÂMICOS
  // ==========================================
  fastify.get('/admin/tipos-documentais', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    try {
      const res = await pool.query('SELECT * FROM tipos_documentais_config WHERE tenant_id = $1 ORDER BY nome ASC', [tenantId]);
      return reply.send(res.rows);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao buscar tipos documentais' });
    }
  });

  fastify.post('/admin/tipos-documentais', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const { nome, categoria, nivel_acesso_padrao } = request.body;
    try {
      const res = await pool.query(`
        INSERT INTO tipos_documentais_config (tenant_id, nome, categoria, nivel_acesso_padrao)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [tenantId, nome, categoria, nivel_acesso_padrao]);
      return reply.status(201).send(res.rows[0]);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar tipo documental (nome já existe para esta instituição)' });
    }
  });

  // ==========================================
  // GERENCIAMENTO DE DASHBOARDS CONTEXTUAIS
  // ==========================================
  fastify.get('/admin/dashboards-config', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const { perfil_ou_setor } = request.query;
    try {
      let query = 'SELECT * FROM dashboards_config WHERE (tenant_id = $1 OR is_global = TRUE)';
      const params: any[] = [tenantId];
      if (perfil_ou_setor) {
        query += ' AND perfil_ou_setor = $2';
        params.push(perfil_ou_setor);
      }
      const res = await pool.query(query, params);
      return reply.send(res.rows);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao buscar configurações de dashboards' });
    }
  });

  fastify.post('/admin/dashboards-config', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const { perfil_ou_setor, nome_visao, widgets_json, layout_json, is_global } = request.body;
    try {
      const res = await pool.query(`
        INSERT INTO dashboards_config (tenant_id, perfil_ou_setor, nome_visao, widgets_json, layout_json, is_global)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `, [tenantId, perfil_ou_setor, nome_visao, JSON.stringify(widgets_json || []), JSON.stringify(layout_json || {}), is_global || false]);
      return reply.status(201).send(res.rows[0]);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao salvar configuração de dashboard' });
    }
  });

  // ==========================================
  // GERENCIAMENTO DE MENUS DINÂMICOS
  // ==========================================
  fastify.get('/admin/menus-config', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const { perfil_ou_setor } = request.query;
    try {
      let query = 'SELECT * FROM menus_config WHERE tenant_id = $1';
      const params: any[] = [tenantId];
      if (perfil_ou_setor) {
        query += ' AND perfil_ou_setor = $2';
        params.push(perfil_ou_setor);
      }
      const res = await pool.query(query, params);
      return reply.send(res.rows);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao buscar menus configurados' });
    }
  });

  fastify.post('/admin/menus-config', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const { perfil_ou_setor, itens_json } = request.body;
    try {
      // Upsert baseado em tenant_id e perfil_ou_setor
      const res = await pool.query(`
        INSERT INTO menus_config (tenant_id, perfil_ou_setor, itens_json)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id, perfil_ou_setor) DO UPDATE 
        SET itens_json = EXCLUDED.itens_json, data_criacao = NOW()
        RETURNING *;
      `, [tenantId, perfil_ou_setor, JSON.stringify(itens_json || [])]);
      return reply.send(res.rows[0]);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao salvar menu dinâmico' });
    }
  });

  // ==========================================
  // FEEDBACK DO PROGRAMA BETA
  // ==========================================
  fastify.post('/beta/feedback', async (request: any, reply) => {
    const { tipo, comentario } = request.body;
    const tenantId = request.user?.unidade || 'Unidade Central';
    const usuarioEmail = request.user?.email || 'anonimo@beta.com';
    
    if (!tipo || !comentario) {
      return reply.status(400).send({ error: 'Tipo e comentário são obrigatórios.' });
    }

    try {
      const res = await pool.query(`
        INSERT INTO beta_feedbacks (tenant_id, usuario_email, tipo, comentario)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [tenantId, usuarioEmail, tipo, comentario]);
      
      return reply.status(201).send({ success: true, feedback: res.rows[0] });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao salvar feedback do beta' });
    }
  });
}
