import { FastifyInstance } from 'fastify';
import pool from '../db';

export default async function indicatorsRoutes(fastify: FastifyInstance) {
  // Lista indicadores com suas coletas recentes
  fastify.get('/indicators', async (request, reply) => {
    const client = await pool.connect();
    try {
      const resInd = await client.query('SELECT * FROM indicadores ORDER BY id ASC');
      const resColetas = await client.query('SELECT * FROM indicador_coletas ORDER BY data_coleta DESC');

      const indicadores = resInd.rows.map(ind => ({
        ...ind,
        coletas: resColetas.rows.filter(c => c.indicador_id === ind.id)
      }));

      return indicadores;
    } finally {
      client.release();
    }
  });

  // Cria indicador
  fastify.post('/indicators', async (request, reply) => {
    const { codigo, nome, setor, meta, periodicidade } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO indicadores (codigo, nome, setor, meta, periodicidade)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [codigo, nome, setor, meta, periodicidade || 'Mensal']);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ('Admin', 'INDICATOR_CREATE', 'INDICATORS', $1, $2)
      `, [codigo, request.ip]);

      return res.rows[0];
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao criar indicador' });
    } finally {
      client.release();
    }
  });

  // Registra nova coleta de indicador
  fastify.post('/indicators/:id/coletas', async (request, reply) => {
    const { id } = request.params as any;
    const { data_coleta, valor, responsavel, observacao } = request.body as any;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const resColeta = await client.query(`
        INSERT INTO indicador_coletas (indicador_id, data_coleta, valor, responsavel, observacao)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [id, data_coleta, valor, responsavel || 'Usuário Sistema', observacao]);

      // Atualiza o valor_atual e tendência no indicador principal
      const resInd = await client.query('SELECT meta, valor_atual FROM indicadores WHERE id = $1', [id]);
      if (resInd.rows.length > 0) {
        const ind = resInd.rows[0];
        const valorAntigo = parseFloat(ind.valor_atual);
        const novoValor = parseFloat(valor);
        let tendencia = 'Estável';
        if (novoValor > valorAntigo) tendencia = 'Subindo';
        else if (novoValor < valorAntigo) tendencia = 'Descendo';

        await client.query(`
          UPDATE indicadores 
          SET valor_atual = $1, tendencia = $2 
          WHERE id = $3
        `, [novoValor, tendencia, id]);
      }

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'INDICATOR_COLLECT', 'INDICATORS', $2, $3)
      `, [responsavel || 'Usuário Sistema', id.toString(), request.ip]);

      await client.query('COMMIT');
      return resColeta.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao registrar coleta' });
    } finally {
      client.release();
    }
  });
}
