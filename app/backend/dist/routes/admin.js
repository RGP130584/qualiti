"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = adminRoutes;
const db_1 = __importDefault(require("../db"));
async function adminRoutes(fastify) {
    // ==========================================
    // GERENCIAMENTO DE SETORES DINÂMICOS
    // ==========================================
    fastify.get('/admin/setores', async (request, reply) => {
        try {
            const res = await db_1.default.query('SELECT * FROM setores_config ORDER BY nome ASC');
            return reply.send(res.rows);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao buscar setores configurados' });
        }
    });
    fastify.post('/admin/setores', async (request, reply) => {
        const { nome, departamento_pai, descricao, categorias_customizadas } = request.body;
        try {
            const res = await db_1.default.query(`
        INSERT INTO setores_config (nome, departamento_pai, descricao, categorias_customizadas)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [nome, departamento_pai, descricao, JSON.stringify(categorias_customizadas || [])]);
            return reply.status(201).send(res.rows[0]);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao criar setor dinâmico' });
        }
    });
    fastify.put('/admin/setores/:id', async (request, reply) => {
        const { id } = request.params;
        const { nome, departamento_pai, descricao, categorias_customizadas, ativo } = request.body;
        try {
            const res = await db_1.default.query(`
        UPDATE setores_config
        SET nome = $1, departamento_pai = $2, descricao = $3, categorias_customizadas = $4, ativo = $5
        WHERE id = $6
        RETURNING *;
      `, [nome, departamento_pai, descricao, JSON.stringify(categorias_customizadas || []), ativo, id]);
            return reply.send(res.rows[0]);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao atualizar setor dinâmico' });
        }
    });
    fastify.delete('/admin/setores/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            await db_1.default.query('DELETE FROM setores_config WHERE id = $1', [id]);
            return reply.send({ success: true, message: 'Setor removido com sucesso' });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao remover setor dinâmico' });
        }
    });
    // ==========================================
    // GERENCIAMENTO DE CARGOS DINÂMICOS
    // ==========================================
    fastify.get('/admin/cargos', async (request, reply) => {
        try {
            const res = await db_1.default.query('SELECT * FROM cargos_config ORDER BY nome ASC');
            return reply.send(res.rows);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao buscar cargos configurados' });
        }
    });
    fastify.post('/admin/cargos', async (request, reply) => {
        const { nome, setor_nome, rbac_role, permissoes_customizadas } = request.body;
        try {
            const res = await db_1.default.query(`
        INSERT INTO cargos_config (nome, setor_nome, rbac_role, permissoes_customizadas)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [nome, setor_nome, rbac_role, JSON.stringify(permissoes_customizadas || {})]);
            return reply.status(201).send(res.rows[0]);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao criar cargo dinâmico' });
        }
    });
    // ==========================================
    // GERENCIAMENTO DE TIPOS DOCUMENTAIS DINÂMICOS
    // ==========================================
    fastify.get('/admin/tipos-documentais', async (request, reply) => {
        try {
            const res = await db_1.default.query('SELECT * FROM tipos_documentais_config ORDER BY nome ASC');
            return reply.send(res.rows);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao buscar tipos documentais' });
        }
    });
    fastify.post('/admin/tipos-documentais', async (request, reply) => {
        const { nome, categoria, nivel_acesso_padrao } = request.body;
        try {
            const res = await db_1.default.query(`
        INSERT INTO tipos_documentais_config (nome, categoria, nivel_acesso_padrao)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [nome, categoria, nivel_acesso_padrao]);
            return reply.status(201).send(res.rows[0]);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao criar tipo documental' });
        }
    });
    // ==========================================
    // GERENCIAMENTO DE DASHBOARDS CONTEXTUAIS
    // ==========================================
    fastify.get('/admin/dashboards-config', async (request, reply) => {
        const { perfil_ou_setor } = request.query;
        try {
            let query = 'SELECT * FROM dashboards_config';
            const params = [];
            if (perfil_ou_setor) {
                query += ' WHERE perfil_ou_setor = $1';
                params.push(perfil_ou_setor);
            }
            const res = await db_1.default.query(query, params);
            return reply.send(res.rows);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao buscar configurações de dashboards' });
        }
    });
    fastify.post('/admin/dashboards-config', async (request, reply) => {
        const { perfil_ou_setor, nome_visao, widgets_json, layout_json, is_global } = request.body;
        try {
            const res = await db_1.default.query(`
        INSERT INTO dashboards_config (perfil_ou_setor, nome_visao, widgets_json, layout_json, is_global)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [perfil_ou_setor, nome_visao, JSON.stringify(widgets_json || []), JSON.stringify(layout_json || {}), is_global || false]);
            return reply.status(201).send(res.rows[0]);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao salvar configuração de dashboard' });
        }
    });
    // ==========================================
    // GERENCIAMENTO DE MENUS DINÂMICOS
    // ==========================================
    fastify.get('/admin/menus-config', async (request, reply) => {
        const { perfil_ou_setor } = request.query;
        try {
            let query = 'SELECT * FROM menus_config';
            const params = [];
            if (perfil_ou_setor) {
                query += ' WHERE perfil_ou_setor = $1';
                params.push(perfil_ou_setor);
            }
            const res = await db_1.default.query(query, params);
            return reply.send(res.rows);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao buscar menus configurados' });
        }
    });
    fastify.post('/admin/menus-config', async (request, reply) => {
        const { perfil_ou_setor, itens_json } = request.body;
        try {
            // Upsert para garantir que atualiza se já existir
            const res = await db_1.default.query(`
        INSERT INTO menus_config (perfil_ou_setor, itens_json)
        VALUES ($1, $2)
        ON CONFLICT (perfil_ou_setor) DO UPDATE
        SET itens_json = EXCLUDED.itens_json, data_criacao = NOW()
        RETURNING *;
      `, [perfil_ou_setor, JSON.stringify(itens_json || [])]);
            return reply.send(res.rows[0]);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Erro ao salvar menu dinâmico' });
        }
    });
}
