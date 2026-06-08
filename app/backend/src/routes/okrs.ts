import { FastifyInstance } from 'fastify';
import pool from '../db';
import { authenticate } from '../utils/auth';
import { requireFeature } from '../utils/feature-guard';

export default async function okrsRoutes(fastify: FastifyInstance) {
  // Aplica autenticação e feature flag para todas as rotas deste arquivo
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireFeature('feature:okr:core'));

  // Lista todos os OKRs com seus Key Results associados para o tenant
  fastify.get('/okrs', async (request: any, reply) => {
    const { setor } = request.query as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      let queryStr = 'SELECT * FROM okrs WHERE tenant_id = $1 ORDER BY id ASC';
      const params: any[] = [tenantId];
      if (setor && setor !== 'Diretoria Geral' && setor !== 'Qualidade e ONA') {
        queryStr = 'SELECT * FROM okrs WHERE tenant_id = $1 AND (setor = $2 OR visao_estrategica = \'3 Anos\') ORDER BY id ASC';
        params.push(setor);
      }
      const resOkrs = await client.query(queryStr, params);

      const krsRes = await client.query(`
        SELECT kr.* FROM key_results kr
        JOIN okrs o ON kr.okr_id = o.id
        WHERE o.tenant_id = $1
        ORDER BY kr.id ASC
      `, [tenantId]);

      const krsMap: Record<number, any[]> = {};
      for (const kr of krsRes.rows) {
        if (!krsMap[kr.okr_id]) krsMap[kr.okr_id] = [];
        krsMap[kr.okr_id].push(kr);
      }

      return resOkrs.rows.map(okr => ({
        ...okr,
        key_results: krsMap[okr.id] || []
      }));
    } finally {
      client.release();
    }
  });

  // Cria um novo OKR Estratégico ou Tático associado ao tenant
  fastify.post('/okrs', async (request: any, reply) => {
    const { titulo, descricao, visao_estrategica, periodo, prioridade, responsavel, setor, indicadores_vinculados } = request.body as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO okrs (titulo, descricao, visao_estrategica, periodo, prioridade, responsavel, setor, indicadores_vinculados, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `, [
        titulo, descricao, visao_estrategica || '1 Ano', periodo || '2026', prioridade || 'Alta', 
        responsavel || request.user.nome || 'Gestor', setor || 'Geral', JSON.stringify(indicadores_vinculados || []),
        tenantId
      ]);
      return res.rows[0];
    } finally {
      client.release();
    }
  });

  // Cria um novo Key Result (KR) para um OKR se pertencer ao tenant
  fastify.post('/okrs/:okrId/krs', async (request: any, reply) => {
    const { okrId } = request.params as any;
    const { titulo, meta, valor_alvo, unidade, responsavel, setor, prazo, peso } = request.body as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      // Validar propriedade do OKR
      const okrCheck = await client.query('SELECT id FROM okrs WHERE id = $1 AND tenant_id = $2', [okrId, tenantId]);
      if (okrCheck.rows.length === 0) {
        return reply.status(404).send({ error: 'OKR não encontrado ou não pertence a esta unidade' });
      }

      const res = await client.query(`
        INSERT INTO key_results (okr_id, titulo, meta, valor_alvo, unidade, responsavel, setor, prazo, peso, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `, [
        okrId, titulo, meta, valor_alvo, unidade || '%', responsavel || request.user.nome || 'Gestor', 
        setor || 'Geral', prazo || '2026-12-31', peso || 1, tenantId
      ]);
      return res.rows[0];
    } finally {
      client.release();
    }
  });

  // Atualiza o progresso de um Key Result (KR) e recalcula o OKR pai
  fastify.post('/krs/:id/progress', async (request: any, reply) => {
    const { id } = request.params as any;
    const { valor, nota, responsavel } = request.body as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar propriedade do KR e do OKR pai
      const krCheck = await client.query(`
        SELECT kr.id, kr.okr_id, kr.valor_alvo, o.tenant_id 
        FROM key_results kr
        JOIN okrs o ON kr.okr_id = o.id
        WHERE kr.id = $1 AND o.tenant_id = $2
      `, [id, tenantId]);

      if (krCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ error: 'Key Result não encontrado ou não pertence a esta unidade' });
      }

      const krInfo = krCheck.rows[0];

      // 1. Registra o histórico de progresso
      await client.query(`
        INSERT INTO okr_progress (kr_id, valor, nota, responsavel, tenant_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, valor, nota || 'Atualização de rotina', responsavel || request.user.nome || 'Gestor', tenantId]);

      // 2. Atualiza o KR atual
      const resKr = await client.query(`
        UPDATE key_results 
        SET valor_atual = $1, 
            progresso = LEAST(ROUND(($1 / valor_alvo) * 100, 2), 100.00),
            data_atualizacao = CURRENT_TIMESTAMP
        WHERE id = $2 AND tenant_id = $3
        RETURNING *;
      `, [valor, id, tenantId]);

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
      const scoreOkr = (parseFloat(progressoOkr as any) / 100).toFixed(2);

      await client.query(`
        UPDATE okrs 
        SET progresso = $1, score = $2 
        WHERE id = $3 AND tenant_id = $4
      `, [progressoOkr, scoreOkr, kr.okr_id, tenantId]);

      await client.query('COMMIT');
      return { success: true, kr, okr_progresso: progressoOkr, okr_score: scoreOkr };
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao atualizar progresso do KR' });
    } finally {
      client.release();
    }
  });

  // Lista os ciclos ativos de OKRs do tenant
  fastify.get('/okr-cycles', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM okr_cycles WHERE tenant_id = $1 ORDER BY data_inicio DESC', [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Cria um novo ciclo de OKR para o tenant
  fastify.post('/okr-cycles', async (request: any, reply) => {
    const { nome, tipo, data_inicio, data_fim } = request.body as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO okr_cycles (nome, tipo, data_inicio, data_fim, ativo, tenant_id)
        VALUES ($1, $2, $3, $4, TRUE, $5)
        RETURNING *;
      `, [nome, tipo || 'Trimestral', data_inicio, data_fim, tenantId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  });
}
