import { FastifyInstance } from 'fastify';
import pool from '../db';
import { authenticate } from '../utils/auth';
import { requireFeature } from '../utils/feature-guard';

export default async function indicatorsRoutes(fastify: FastifyInstance) {
  // Aplica autenticação e feature flag para todas as rotas deste arquivo
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireFeature('feature:okr:core'));

  // Lista indicadores com suas coletas recentes do mesmo tenant
  fastify.get('/indicators', async (request: any, reply) => {
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      const resInd = await client.query('SELECT * FROM indicadores WHERE tenant_id = $1 ORDER BY id ASC', [tenantId]);
      const resColetas = await client.query(`
        SELECT c.* FROM indicador_coletas c
        JOIN indicadores i ON c.indicador_id = i.id
        WHERE i.tenant_id = $1
        ORDER BY c.data_coleta DESC
      `, [tenantId]);

      const indicadores = resInd.rows.map(ind => ({
        ...ind,
        coletas: resColetas.rows.filter(c => c.indicador_id === ind.id)
      }));

      return indicadores;
    } finally {
      client.release();
    }
  });

  // Cria indicador associado ao tenant
  fastify.post('/indicators', async (request: any, reply) => {
    const { codigo, nome, setor, meta, periodicidade } = request.body as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO indicadores (codigo, nome, setor, meta, periodicidade, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `, [codigo, nome, setor, meta, periodicidade || 'Mensal', tenantId]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip, tenant_id)
        VALUES ($1, 'INDICATOR_CREATE', 'INDICATORS', $2, $3, $4)
      `, ['Admin', codigo, request.ip, tenantId]);

      return res.rows[0];
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar indicador' });
    } finally {
      client.release();
    }
  });

  // Registra nova coleta de indicador se pertencer ao tenant
  fastify.post('/indicators/:id/coletas', async (request: any, reply) => {
    const { id } = request.params as any;
    const { data_coleta, valor, responsavel, observacao } = request.body as any;
    const tenantId = request.user.unidade || 'Unidade Central';
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const indCheck = await client.query('SELECT id, meta, valor_atual FROM indicadores WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
      if (indCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ error: 'Indicador não encontrado' });
      }

      const resColeta = await client.query(`
        INSERT INTO indicador_coletas (indicador_id, data_coleta, valor, responsavel, observacao)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [id, data_coleta, valor, responsavel || 'Usuário Sistema', observacao]);

      // Atualiza o valor_atual e tendência no indicador principal
      const ind = indCheck.rows[0];
      const valorAntigo = parseFloat(ind.valor_atual);
      const novoValor = parseFloat(valor);
      let tendencia = 'Estável';
      if (novoValor > valorAntigo) tendencia = 'Subindo';
      else if (novoValor < valorAntigo) tendencia = 'Descendo';

      await client.query(`
        UPDATE indicadores 
        SET valor_atual = $1, tendencia = $2 
        WHERE id = $3 AND tenant_id = $4
      `, [novoValor, tendencia, id, tenantId]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip, tenant_id)
        VALUES ($1, 'INDICATOR_COLLECT', 'INDICATORS', $2, $3, $4)
      `, [responsavel || 'Usuário Sistema', id.toString(), request.ip, tenantId]);

      await client.query('COMMIT');
      return resColeta.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao registrar coleta' });
    } finally {
      client.release();
    }
  });
}
