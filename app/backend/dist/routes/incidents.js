"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = incidentsRoutes;
const db_1 = __importDefault(require("../db"));
async function incidentsRoutes(fastify) {
    // Lista incidentes
    fastify.get('/incidents', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT * FROM incidentes ORDER BY id DESC');
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    // Cria incidente
    fastify.post('/incidents', async (request, reply) => {
        const { titulo, descricao, tipo, severidade, setor, relator } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        INSERT INTO incidentes (titulo, descricao, tipo, severidade, setor, relator)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `, [titulo, descricao, tipo, severidade, setor, relator || 'Anônimo / Usuário']);
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'INCIDENT_CREATE', 'INCIDENTS', $2, $3)
      `, [relator || 'Anônimo / Usuário', res.rows[0].id.toString(), request.ip]);
            return res.rows[0];
        }
        catch (err) {
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao registrar incidente' });
        }
        finally {
            client.release();
        }
    });
    // Atualiza incidente (Ishikawa / CAPA)
    fastify.put('/incidents/:id', async (request, reply) => {
        const { id } = request.params;
        const { status, causa_raiz_ishikawa, plano_acao_capa, usuario } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        UPDATE incidentes
        SET status = $1, causa_raiz_ishikawa = $2, plano_acao_capa = $3
        WHERE id = $4
        RETURNING *;
      `, [status, JSON.stringify(causa_raiz_ishikawa || {}), JSON.stringify(plano_acao_capa || []), id]);
            if (res.rows.length === 0) {
                return reply.status(404).send({ error: 'Incidente não encontrado' });
            }
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'INCIDENT_UPDATE', 'INCIDENTS', $2, $3)
      `, [usuario || 'Admin', id.toString(), request.ip]);
            return res.rows[0];
        }
        catch (err) {
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao atualizar incidente' });
        }
        finally {
            client.release();
        }
    });
}
