import pool from '../../db';
import { BpmGraphValidator } from './graph-validator';

export class BpmService {
  // ----------------------------------------
  // 1. GESTÃO DE FLUXOS (PROCESSOS CONFIG)
  // ----------------------------------------
  async listFluxos(tenantId: string) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM bpm_fluxos WHERE tenant_id = $1 ORDER BY id ASC', [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createFluxo(tenantId: string, data: { nome: string; descricao?: string; bpmn_json: any; sla_horas?: number }) {
    // Validador Estático de Grafo BPMN
    const validation = BpmGraphValidator.validate(data.bpmn_json);
    if (!validation.valid) {
      throw new Error(`Grafo BPMN inválido: ${validation.error}`);
    }

    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO bpm_fluxos (nome, descricao, bpmn_json, status_ativo, sla_horas, tenant_id)
        VALUES ($1, $2, $3, TRUE, $4, $5)
        RETURNING *;
      `, [data.nome, data.descricao || '', JSON.stringify(data.bpmn_json), data.sla_horas || 24, tenantId]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ('Admin', 'BPM_FLOW_CREATE', 'BPM', $1, '127.0.0.1')
      `, [res.rows[0].id.toString()]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // 2. ORQUESTRAÇÃO DE EXECUÇÕES
  // ----------------------------------------
  async listExecucoes(tenantId: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT e.*, f.nome as fluxo_nome, f.sla_horas 
        FROM bpm_execucoes e 
        JOIN bpm_fluxos f ON e.fluxo_id = f.id 
        WHERE e.tenant_id = $1
        ORDER BY e.id DESC
      `, [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async startExecucao(tenantId: string, fluxoId: number, solicitante: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const resFluxo = await client.query('SELECT bpmn_json, tenant_id FROM bpm_fluxos WHERE id = $1 AND tenant_id = $2', [fluxoId, tenantId]);
      if (resFluxo.rows.length === 0) {
        throw new Error('Fluxo de processo não encontrado ou não pertence a esta unidade');
      }

      const bpmn = resFluxo.rows[0].bpmn_json;
      let primeiraEtapa = 'Tarefa Inicial';

      // Encontra a primeira tarefa real após o nó 'start'
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

      const logInicial = [
        {
          etapa: 'Início',
          status: 'Concluído',
          data: new Date().toISOString().replace('T', ' ').substring(0, 16),
          responsavel: solicitante
        },
        {
          etapa: primeiraEtapa,
          status: 'Em Andamento',
          data: new Date().toISOString().replace('T', ' ').substring(0, 16),
          responsavel: 'Fila Setorial'
        }
      ];

      const res = await client.query(`
        INSERT INTO bpm_execucoes (fluxo_id, solicitante, status, etapa_atual, log_execucao, tenant_id)
        VALUES ($1, $2, 'Em Andamento', $3, $4, $5)
        RETURNING *;
      `, [fluxoId, solicitante || 'Usuário Sistema', primeiraEtapa, JSON.stringify(logInicial), tenantId]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'BPM_EXEC_START', 'BPM_EXEC', $2, '127.0.0.1')
      `, [solicitante || 'Usuário Sistema', res.rows[0].id.toString()]);

      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async avancarExecucao(tenantId: string, execId: number, usuario: string, proximaEtapa: string, statusFinal?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const resExec = await client.query(`
        SELECT e.*, f.bpmn_json 
        FROM bpm_execucoes e
        JOIN bpm_fluxos f ON e.fluxo_id = f.id
        WHERE e.id = $1 AND e.tenant_id = $2
      `, [execId, tenantId]);

      if (resExec.rows.length === 0) {
        throw new Error('Execução de processo não encontrada ou não pertence a esta unidade');
      }

      const exec = resExec.rows[0];
      const bpmn = exec.bpmn_json;
      const logs = exec.log_execucao || [];

      // Validar caminhos de transição do BPMN para impedir alterações manuais órfãs
      if (bpmn && bpmn.nodes && bpmn.edges) {
        const nodes = bpmn.nodes as any[];
        const edges = bpmn.edges as any[];

        // Achar o nó atual da execução (que corresponde à etapa_atual)
        const nodeAtual = nodes.find(n => n.label === exec.etapa_atual);
        // Achar o nó de destino (que corresponde à proximaEtapa)
        const nodeDestino = nodes.find(n => n.label === proximaEtapa || (n.type === 'end' && (proximaEtapa === 'Encerrado' || proximaEtapa === 'Publicado' || proximaEtapa === 'Concluído')));

        if (nodeAtual && nodeDestino) {
          // Checar se há uma aresta ligando diretamente ou através de gateways
          const hasEdge = edges.some(e => e.from === nodeAtual.id && e.to === nodeDestino.id);
          
          // Se for gateway ou tomada de decisão, aceitamos transições alternativas conectadas ao gateway
          const connectsViaGateway = edges.some(e => {
            const isGateway = nodes.some(n => n.id === e.to && n.type === 'gateway');
            if (isGateway && e.from === nodeAtual.id) {
              return edges.some(e2 => e2.from === e.to && e2.to === nodeDestino.id);
            }
            return false;
          });

          if (!hasEdge && !connectsViaGateway && proximaEtapa !== 'Encerrado') {
            throw new Error(`Transição de fluxo inválida: não existe caminho no BPMN de "${exec.etapa_atual}" para "${proximaEtapa}"`);
          }
        }
      }

      // Atualiza o status da etapa anterior no log
      if (logs.length > 0) {
        logs[logs.length - 1].status = 'Concluído';
        logs[logs.length - 1].assinatura = `Assinado digitalmente por ${usuario}`;
        logs[logs.length - 1].data_conclusao = new Date().toISOString().replace('T', ' ').substring(0, 16);
      }

      const isFinished = statusFinal === 'Concluído' || proximaEtapa === 'Encerrado' || proximaEtapa === 'Publicado' || proximaEtapa === 'Concluído';

      // Adiciona nova etapa ao log de execução (Salva assinaturas, datas e metas)
      logs.push({
        etapa: proximaEtapa || 'Concluído',
        status: isFinished ? 'Concluído' : 'Em Andamento',
        data: new Date().toISOString().replace('T', ' ').substring(0, 16),
        responsavel: isFinished ? 'Sistema' : usuario,
        assinatura: isFinished ? 'Execução Encerrada' : null
      });

      const novoStatus = isFinished ? 'Concluído' : 'Em Andamento';
      const dataFim = isFinished ? new Date() : null;

      const res = await client.query(`
        UPDATE bpm_execucoes 
        SET etapa_atual = $1, status = $2, log_execucao = $3, data_fim = $4 
        WHERE id = $5 AND tenant_id = $6
        RETURNING *;
      `, [proximaEtapa || 'Concluído', novoStatus, JSON.stringify(logs), dataFim, execId, tenantId]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'BPM_EXEC_ADVANCE', 'BPM_EXEC', $2, '127.0.0.1')
      `, [usuario || 'Admin', execId.toString()]);

      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
