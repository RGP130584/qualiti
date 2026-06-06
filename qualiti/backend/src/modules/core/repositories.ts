import pool from '../../db';
import { 
  CoreOcorrencia, CoreDocumento, CoreAuditoria, 
  CoreRisco, CoreSeguranca, CoreAnalytics, CoreAiAgentLog 
} from './models';

// ==========================================
// REPOSITORIES: CORE PLATFORM (CLEAN ARCHITECTURE)
// ==========================================

export class CoreRepository {
  // ----------------------------------------
  // OCORRÊNCIAS INTELIGENTES
  // ----------------------------------------
  async listOcorrencias(setor?: string): Promise<CoreOcorrencia[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_ocorrencias WHERE deleted_at IS NULL';
      const params: any[] = [];
      if (setor && setor !== 'Todos') {
        query += ' AND setor = $1';
        params.push(setor);
      }
      query += ' ORDER BY id DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createOcorrencia(data: CoreOcorrencia): Promise<CoreOcorrencia> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO core_ocorrencias (
          titulo, descricao, setor, relator, ia_classificacao, 
          ia_criticidade, ia_causa_raiz, ia_previsao_risco, 
          ia_impacto_normativo, ia_acoes_recomendadas, 
          eventos_correlacionados, plano_capa, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *;
      `, [
        data.titulo, data.descricao, data.setor, data.relator,
        data.ia_classificacao || 'Classificação Automática',
        data.ia_criticidade || 'Média',
        data.ia_causa_raiz || 'Análise de causa raiz gerada por IA',
        data.ia_previsao_risco || 'Risco de recorrência moderado',
        data.ia_impacto_normativo || 'ONA Nível 1 / ISO 9001',
        JSON.stringify(data.ia_acoes_recomendadas || []),
        JSON.stringify(data.eventos_correlacionados || []),
        JSON.stringify(data.plano_capa || []),
        data.status || 'Pendente'
      ]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id)
        VALUES ($1, 'CORE_OCORRENCIA_CREATE', 'CORE_OCORRENCIAS', $2)
      `, [data.relator, res.rows[0].id.toString()]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateOcorrenciaStatus(id: number, status: string, planoCapa: any, usuario: string): Promise<CoreOcorrencia> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE core_ocorrencias 
        SET status = $1, plano_capa = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *;
      `, [status, JSON.stringify(planoCapa || []), id]);

      if (res.rows.length > 0) {
        await client.query(`
          INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id)
          VALUES ($1, 'CORE_OCORRENCIA_UPDATE', 'CORE_OCORRENCIAS', $2)
        `, [usuario, id.toString()]);
      }

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // GESTÃO DOCUMENTAL INTELIGENTE
  // ----------------------------------------
  async listDocumentos(setor?: string): Promise<CoreDocumento[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_documentos WHERE deleted_at IS NULL';
      const params: any[] = [];
      if (setor && setor !== 'Todos') {
        query += ' AND setor = $1';
        params.push(setor);
      }
      query += ' ORDER BY id DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createDocumento(data: CoreDocumento): Promise<CoreDocumento> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO core_documentos (
          codigo, titulo, categoria, setor, versao, conteudo, autor,
          status_aprovacao, ocr_texto, embeddings, documentos_impactados, rastreabilidade_normas
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING *;
      `, [
        data.codigo, data.titulo, data.categoria, data.setor,
        data.versao || '1.0', data.conteudo, data.autor,
        data.status_aprovacao || 'Pendente',
        data.ocr_texto || `[OCR] ${data.conteudo}`,
        JSON.stringify(data.embeddings || [0.01, -0.02, 0.05, 0.08]),
        JSON.stringify(data.documentos_impactados || []),
        JSON.stringify(data.rastreabilidade_normas || [])
      ]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id)
        VALUES ($1, 'CORE_DOCUMENTO_CREATE', 'CORE_DOCUMENTOS', $2)
      `, [data.autor, res.rows[0].id.toString()]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // AUDITORIA INTELIGENTE
  // ----------------------------------------
  async listAuditorias(setor?: string): Promise<CoreAuditoria[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_auditorias';
      const params: any[] = [];
      if (setor && setor !== 'Todos') {
        query += ' WHERE setor = $1';
        params.push(setor);
      }
      query += ' ORDER BY id DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // GESTÃO DE RISCOS
  // ----------------------------------------
  async listRiscos(setor?: string): Promise<CoreRisco[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_riscos';
      const params: any[] = [];
      if (setor && setor !== 'Todos') {
        query += ' WHERE setor = $1';
        params.push(setor);
      }
      query += ' ORDER BY id DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // SEGURANÇA OPERACIONAL
  // ----------------------------------------
  async listSeguranca(setor?: string): Promise<CoreSeguranca[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_seguranca';
      const params: any[] = [];
      if (setor && setor !== 'Todos') {
        query += ' WHERE setor = $1';
        params.push(setor);
      }
      query += ' ORDER BY id DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // INDICADORES & ANALYTICS
  // ----------------------------------------
  async getAnalytics(): Promise<CoreAnalytics> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM core_analytics ORDER BY id DESC LIMIT 1');
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // LOG DE AGENTES DE IA
  // ----------------------------------------
  async logAiAgentAction(data: CoreAiAgentLog): Promise<CoreAiAgentLog> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO core_ai_logs (agente, usuario, contexto, prompt, resposta, acoes_recomendadas)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `, [
        data.agente, data.usuario, data.contexto, data.prompt, data.resposta,
        JSON.stringify(data.acoes_recomendadas || [])
      ]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async listAiLogs(agente?: string): Promise<CoreAiAgentLog[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_ai_logs';
      const params: any[] = [];
      if (agente && agente !== 'Todos') {
        query += ' WHERE agente = $1';
        params.push(agente);
      }
      query += ' ORDER BY id DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }
}
