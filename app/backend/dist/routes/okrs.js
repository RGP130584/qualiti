"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = okrsRoutes;
const db_1 = __importDefault(require("../db"));
async function okrsRoutes(fastify) {
    // Lista todos os OKRs com seus Key Results associados
    fastify.get('/okrs', async (request, reply) => {
        const { setor } = request.query;
        const client = await db_1.default.connect();
        try {
            let queryStr = 'SELECT * FROM okrs ORDER BY id ASC';
            const params = [];
            if (setor && setor !== 'Diretoria Geral' && setor !== 'Qualidade e ONA') {
                queryStr = 'SELECT * FROM okrs WHERE setor = $1 OR visao_estrategica = \'3 Anos\' ORDER BY id ASC';
                params.push(setor);
            }
            const resOkrs = await client.query(queryStr, params);
            const krsRes = await client.query('SELECT * FROM key_results ORDER BY id ASC');
            const krsMap = {};
            for (const kr of krsRes.rows) {
                if (!krsMap[kr.okr_id])
                    krsMap[kr.okr_id] = [];
                krsMap[kr.okr_id].push(kr);
            }
            return resOkrs.rows.map(okr => ({
                ...okr,
                key_results: krsMap[okr.id] || []
            }));
        }
        finally {
            client.release();
        }
    });
    // Cria um novo OKR Estratégico ou Tático
    fastify.post('/okrs', async (request, reply) => {
        const { titulo, descricao, visao_estrategica, periodo, prioridade, responsavel, setor, indicadores_vinculados } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        INSERT INTO okrs (titulo, descricao, visao_estrategica, periodo, prioridade, responsavel, setor, indicadores_vinculados)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `, [
                titulo, descricao, visao_estrategica || '1 Ano', periodo || '2026', prioridade || 'Alta',
                responsavel || 'Gestor', setor || 'Geral', JSON.stringify(indicadores_vinculados || [])
            ]);
            return res.rows[0];
        }
        finally {
            client.release();
        }
    });
    // Cria um novo Key Result (KR) para um OKR
    fastify.post('/okrs/:okrId/krs', async (request, reply) => {
        const { okrId } = request.params;
        const { titulo, meta, valor_alvo, unidade, responsavel, setor, prazo, peso } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        INSERT INTO key_results (okr_id, titulo, meta, valor_alvo, unidade, responsavel, setor, prazo, peso)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `, [
                okrId, titulo, meta, valor_alvo, unidade || '%', responsavel || 'Gestor',
                setor || 'Geral', prazo || '2026-12-31', peso || 1
            ]);
            return res.rows[0];
        }
        finally {
            client.release();
        }
    });
    // Atualiza o progresso de um Key Result (KR) e recalcula o OKR pai
    fastify.post('/krs/:id/progress', async (request, reply) => {
        const { id } = request.params;
        const { valor, nota, responsavel } = request.body;
        const client = await db_1.default.connect();
        try {
            await client.query('BEGIN');
            // 1. Registra o histórico de progresso
            await client.query(`
        INSERT INTO okr_progress (kr_id, valor, nota, responsavel)
        VALUES ($1, $2, $3, $4)
      `, [id, valor, nota || 'Atualização de rotina', responsavel || 'Gestor']);
            // 2. Atualiza o KR atual
            const resKr = await client.query(`
        UPDATE key_results
        SET valor_atual = $1,
            progresso = LEAST(ROUND(($1 / valor_alvo) * 100, 2), 100.00),
            data_atualizacao = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *;
      `, [valor, id]);
            if (resKr.rows.length === 0) {
                await client.query('ROLLBACK');
                return reply.status(404).send({ error: 'Key Result não encontrado' });
            }
            const kr = resKr.rows[0];
            // 3. Recalcula o progresso e score do OKR pai com base na média ponderada dos KRs
            const resKrsPai = await client.query('SELECT progresso, peso FROM key_results WHERE okr_id = $1', [kr.okr_id]);
            let somaProgressoPeso = 0;
            let somaPesos = 0;
            for (const k of resKrsPai.rows) {
                somaProgressoPeso += parseFloat(k.progresso) * parseInt(k.peso);
                somaPesos += parseInt(k.peso);
            }
            const progressoOkr = somaPesos > 0 ? (somaProgressoPeso / somaPesos).toFixed(2) : 0.00;
            const scoreOkr = (parseFloat(progressoOkr) / 100).toFixed(2);
            await client.query(`
        UPDATE okrs
        SET progresso = $1, score = $2
        WHERE id = $3
      `, [progressoOkr, scoreOkr, kr.okr_id]);
            await client.query('COMMIT');
            return { success: true, kr, okr_progresso: progressoOkr, okr_score: scoreOkr };
        }
        catch (err) {
            await client.query('ROLLBACK');
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao atualizar progresso do KR' });
        }
        finally {
            client.release();
        }
    });
    // Lista os ciclos ativos de OKRs
    fastify.get('/okr-cycles', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT * FROM okr_cycles ORDER BY data_inicio DESC');
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    // Cria um novo ciclo de OKR
    fastify.post('/okr-cycles', async (request, reply) => {
        const { nome, tipo, data_inicio, data_fim } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        INSERT INTO okr_cycles (nome, tipo, data_inicio, data_fim, ativo)
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING *;
      `, [nome, tipo || 'Trimestral', data_inicio, data_fim]);
            return res.rows[0];
        }
        finally {
            client.release();
        }
    });
}
