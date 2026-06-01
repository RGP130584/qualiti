"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = usersRoutes;
const db_1 = __importDefault(require("../db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function usersRoutes(fastify) {
    // Lista usuários
    fastify.get('/users', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT id, nome, email, rbac_role, departamento, unidade, mfa_enabled, data_criacao FROM usuarios ORDER BY id ASC');
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    // Cria usuário
    fastify.post('/users', {
        onRequest: [async (request, reply) => {
                try {
                    await request.jwtVerify();
                }
                catch (err) {
                    reply.status(401).send({ error: 'Não autorizado' });
                }
            }]
    }, async (request, reply) => {
        const authUser = request.user;
        if (authUser.role !== 'Admin' && authUser.role !== 'Gestor da Qualidade') {
            return reply.status(403).send({ error: 'Proibido. Permissões insuficientes.' });
        }
        const { nome, email, senha, rbac_role, departamento, unidade, mfa_enabled } = request.body;
        const client = await db_1.default.connect();
        try {
            const hash = await bcryptjs_1.default.hash(senha || 'senha123', 12);
            const res = await client.query(`
        INSERT INTO usuarios (nome, email, senha_hash, rbac_role, departamento, unidade, mfa_enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, nome, email, rbac_role, departamento, unidade, mfa_enabled, data_criacao;
      `, [nome, email, hash, rbac_role || 'Gestor da Qualidade', departamento || 'Geral', unidade || 'Unidade Central', mfa_enabled || false]);
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'USER_CREATE', 'USERS', $2, $3)
      `, [authUser.nome || authUser.email, email, request.ip]);
            return res.rows[0];
        }
        catch (err) {
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao criar usuário (email pode já existir)' });
        }
        finally {
            client.release();
        }
    });
    // Atualiza usuário
    fastify.put('/users/:id', {
        onRequest: [async (request, reply) => {
                try {
                    await request.jwtVerify();
                }
                catch (err) {
                    reply.status(401).send({ error: 'Não autorizado' });
                }
            }]
    }, async (request, reply) => {
        const authUser = request.user;
        if (authUser.role !== 'Admin' && authUser.role !== 'Gestor da Qualidade') {
            return reply.status(403).send({ error: 'Proibido. Permissões insuficientes.' });
        }
        const { id } = request.params;
        const { nome, rbac_role, departamento, unidade, mfa_enabled } = request.body;
        const client = await db_1.default.connect();
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
        VALUES ($1, 'USER_UPDATE', 'USERS', $2, $3)
      `, [authUser.nome || authUser.email, res.rows[0].email, request.ip]);
            return res.rows[0];
        }
        finally {
            client.release();
        }
    });
    // Remove usuário
    fastify.delete('/users/:id', {
        onRequest: [async (request, reply) => {
                try {
                    await request.jwtVerify();
                }
                catch (err) {
                    reply.status(401).send({ error: 'Não autorizado' });
                }
            }]
    }, async (request, reply) => {
        const authUser = request.user;
        if (authUser.role !== 'Admin' && authUser.role !== 'Gestor da Qualidade') {
            return reply.status(403).send({ error: 'Proibido. Permissões insuficientes.' });
        }
        const { id } = request.params;
        const client = await db_1.default.connect();
        try {
            const resUser = await client.query('SELECT email FROM usuarios WHERE id = $1', [id]);
            if (resUser.rows.length === 0) {
                return reply.status(404).send({ error: 'Usuário não encontrado' });
            }
            await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'USER_DELETE', 'USERS', $2, $3)
      `, [authUser.nome || authUser.email, resUser.rows[0].email, request.ip]);
            return { success: true, message: 'Usuário removido com sucesso' };
        }
        finally {
            client.release();
        }
    });
    // ==========================================
    // ROTAS DE FUNÇÕES CADASTRADAS (MENU EDITÁVEL)
    // ==========================================
    // Lista funções cadastradas
    fastify.get('/funcoes', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT * FROM funcoes_cadastradas ORDER BY id ASC');
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    // Cria nova função/cargo no menu editável
    fastify.post('/funcoes', async (request, reply) => {
        const { nome, is_rt, descricao } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        INSERT INTO funcoes_cadastradas (nome, is_rt, descricao)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [nome, is_rt || false, descricao || '']);
            return res.rows[0];
        }
        catch (err) {
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao cadastrar função (nome pode já existir)' });
        }
        finally {
            client.release();
        }
    });
    // Remove função cadastrada
    fastify.delete('/funcoes/:id', async (request, reply) => {
        const { id } = request.params;
        const client = await db_1.default.connect();
        try {
            await client.query('DELETE FROM funcoes_cadastradas WHERE id = $1', [id]);
            return { success: true, message: 'Função removida com sucesso' };
        }
        finally {
            client.release();
        }
    });
}
