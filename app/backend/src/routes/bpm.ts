import { FastifyInstance } from 'fastify';
import pool from '../db';

export default async function bpmRoutes(fastify: FastifyInstance) {
  // Lista fluxos configurados
  fastify.get('/bpm/fluxos', async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM bpm_fluxos ORDER BY id ASC');
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Cria ou atualiza um fluxo BPM
  fastify.post('/bpm/fluxos', async (request, reply) => {
    const { nome, descricao, bpmn_json, sla_horas } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO bpm_fluxos (nome, descricao, bpmn_json, sla_horas)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [nome, descricao, bpmn_json, sla_horas || 24]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ('Admin', 'BPM_FLOW_CREATE', 'BPM', $1, $2)
      `, [res.rows[0].id.toString(), request.ip]);

      return res.rows[0];
    } finally {
      client.release();
    }
  });

  // Lista execuções em andamento
  fastify.get('/bpm/execucoes', async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT e.*, f.nome as fluxo_nome, f.sla_horas 
        FROM bpm_execucoes e 
        JOIN bpm_fluxos f ON e.fluxo_id = f.id 
        ORDER BY e.id DESC
      `);
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Inicia uma nova execução de processo
  fastify.post('/bpm/execucoes', async (request, reply) => {
    const { fluxo_id, solicitante } = request.body as any;
    const client = await pool.connect();
    try {
      const resFluxo = await client.query('SELECT bpmn_json FROM bpm_fluxos WHERE id = $1', [fluxo_id]);
      if (resFluxo.rows.length === 0) {
        return reply.status(404).send({ error: 'Fluxo não encontrado' });
      }

      const bpmn = resFluxo.rows[0].bpmn_json;
      // Encontra a primeira tarefa após o start
      let primeiraEtapa = 'Tarefa Inicial';
      if (bpmn && bpmn.nodes && bpmn.nodes.length > 1) {
        const startNode = bpmn.nodes.find((n: any) => n.type === 'start');
        if (startNode) {
          const edge = bpmn.edges.find((e: any) => e.from === startNode.id);
          if (edge) {
            const nextNode = bpmn.nodes.find((n: any) => n.id === edge.to);
            if (nextNode) primeiraEtapa = nextNode.label;
          }
        }
      }

      const logInicial = [{
        etapa: 'Início',
        status: 'Concluído',
        data: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }, {
        etapa: primeiraEtapa,
        status: 'Em Andamento',
        data: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }];

      const res = await client.query(`
        INSERT INTO bpm_execucoes (fluxo_id, solicitante, status, etapa_atual, log_execucao)
        VALUES ($1, $2, 'Em Andamento', $3, $4)
        RETURNING *;
      `, [fluxo_id, solicitante || 'Usuário Sistema', primeiraEtapa, JSON.stringify(logInicial)]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'BPM_EXEC_START', 'BPM_EXEC', $2, $3)
      `, [solicitante || 'Usuário Sistema', res.rows[0].id.toString(), request.ip]);

      return res.rows[0];
    } finally {
      client.release();
    }
  });

  // Avança uma execução para a próxima etapa
  fastify.post('/bpm/execucoes/:id/avancar', async (request, reply) => {
    const { id } = request.params as any;
    const { usuario, proxima_etapa, status_final } = request.body as any;
    const client = await pool.connect();
    try {
      const resExec = await client.query('SELECT * FROM bpm_execucoes WHERE id = $1', [id]);
      if (resExec.rows.length === 0) {
        return reply.status(404).send({ error: 'Execução não encontrada' });
      }

      const exec = resExec.rows[0];
      const logs = exec.log_execucao || [];

      // Atualiza o status da etapa anterior para concluído
      if (logs.length > 0) {
        logs[logs.length - 1].status = 'Concluído';
      }

      const isFinished = status_final === 'Concluído' || proxima_etapa === 'Encerrado' || proxima_etapa === 'Publicado';

      // Adiciona nova etapa
      logs.push({
        etapa: proxima_etapa || 'Concluído',
        status: isFinished ? 'Concluído' : 'Em Andamento',
        data: new Date().toISOString().replace('T', ' ').substring(0, 16)
      });

      const novoStatus = isFinished ? 'Concluído' : 'Em Andamento';
      const dataFim = isFinished ? new Date() : null;

      const res = await client.query(`
        UPDATE bpm_execucoes 
        SET etapa_atual = $1, status = $2, log_execucao = $3, data_fim = $4 
        WHERE id = $5 
        RETURNING *;
      `, [proxima_etapa || 'Concluído', novoStatus, JSON.stringify(logs), dataFim, id]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'BPM_EXEC_ADVANCE', 'BPM_EXEC', $2, $3)
      `, [usuario || 'Admin', id.toString(), request.ip]);

      return res.rows[0];
    } finally {
      client.release();
    }
  });
}
