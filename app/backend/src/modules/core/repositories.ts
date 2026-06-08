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
  async listOcorrencias(tenantId: string, setor?: string): Promise<CoreOcorrencia[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_ocorrencias WHERE deleted_at IS NULL AND tenant_id = $1';
      const params: any[] = [tenantId];
      if (setor && setor !== 'Todos') {
        query += ' AND setor = $2';
        params.push(setor);
      }
      query += ' ORDER BY id DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createOcorrencia(tenantId: string, data: CoreOcorrencia): Promise<CoreOcorrencia> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO core_ocorrencias (
          titulo, descricao, setor, relator, ia_classificacao, 
          ia_criticidade, ia_causa_raiz, ia_previsao_risco, 
          ia_impacto_normativo, ia_acoes_recomendadas, 
          eventos_correlacionados, plano_capa, status,
          tipo, severidade, causa_raiz_ishikawa, plano_acao_capa, tenant_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
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
        data.status || 'Pendente',
        data.tipo || null,
        data.severidade || null,
        JSON.stringify(data.causa_raiz_ishikawa || {}),
        JSON.stringify(data.plano_acao_capa || []),
        tenantId
      ]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'CORE_OCORRENCIA_CREATE', 'CORE_OCORRENCIAS', $2, '127.0.0.1')
      `, [data.relator, res.rows[0].id.toString()]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateOcorrenciaStatus(
    tenantId: string, 
    id: number, 
    status: string, 
    planoCapa: any, 
    usuario: string, 
    causaRaizIshikawa?: any, 
    planoAcaoCapa?: any
  ): Promise<CoreOcorrencia> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE core_ocorrencias 
        SET status = $1, 
            plano_capa = COALESCE($2, plano_capa),
            causa_raiz_ishikawa = COALESCE($3, causa_raiz_ishikawa),
            plano_acao_capa = COALESCE($4, plano_acao_capa),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 AND tenant_id = $6 AND deleted_at IS NULL
        RETURNING *;
      `, [
        status, 
        planoCapa ? JSON.stringify(planoCapa) : null, 
        causaRaizIshikawa ? JSON.stringify(causaRaizIshikawa) : null,
        planoAcaoCapa ? JSON.stringify(planoAcaoCapa) : null,
        id, 
        tenantId
      ]);

      if (res.rows.length > 0) {
        await client.query(`
          INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
          VALUES ($1, 'CORE_OCORRENCIA_UPDATE', 'CORE_OCORRENCIAS', $2, '127.0.0.1')
        `, [usuario, id.toString()]);
      }

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // GESTÃO DOCUMENTAL INTELIGENTE (POPS CONSOLIDADO)
  // ----------------------------------------
  async listDocumentos(tenantId: string, setor?: string): Promise<CoreDocumento[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM pops WHERE deleted_at IS NULL AND tenant_id = $1';
      const params: any[] = [tenantId];
      if (setor && setor !== 'Todos') {
        query += ' AND setor = $2';
        params.push(setor);
      }
      query += ' ORDER BY id DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createDocumento(tenantId: string, data: CoreDocumento): Promise<CoreDocumento> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO pops (
          codigo, titulo, categoria, setor, versao, conteudo, autor,
          status, ocr_texto, embeddings, documentos_impactados, rastreabilidade_normas, tenant_id, qrcode
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING *;
      `, [
        data.codigo, data.titulo, data.categoria, data.setor,
        data.versao || '1.0', data.conteudo, data.autor,
        data.status_aprovacao || 'Pendente',
        data.ocr_texto || `[OCR] ${data.conteudo}`,
        JSON.stringify(data.embeddings || [0.01, -0.02, 0.05, 0.08]),
        JSON.stringify(data.documentos_impactados || []),
        JSON.stringify(data.rastreabilidade_normas || []),
        tenantId,
        `QR_CORE_${data.codigo}`
      ]);

      // Insere na tabela de pop_versoes
      await client.query(`
        INSERT INTO pop_versoes (pop_id, versao, conteudo, autor)
        VALUES ($1, $2, $3, $4)
      `, [res.rows[0].id, res.rows[0].versao, res.rows[0].conteudo, res.rows[0].autor]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'CORE_DOCUMENTO_CREATE', 'POPs', $2, '127.0.0.1')
      `, [data.autor, res.rows[0].id.toString()]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // AUDITORIA INTELIGENTE
  // ----------------------------------------
  async listAuditorias(tenantId: string, setor?: string): Promise<CoreAuditoria[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_auditorias WHERE tenant_id = $1';
      const params: any[] = [tenantId];
      if (setor && setor !== 'Todos') {
        query += ' AND setor = $2';
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
  async listRiscos(tenantId: string, setor?: string): Promise<CoreRisco[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_riscos WHERE tenant_id = $1';
      const params: any[] = [tenantId];
      if (setor && setor !== 'Todos') {
        query += ' AND setor = $2';
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
  async listSeguranca(tenantId: string, setor?: string): Promise<CoreSeguranca[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_seguranca WHERE tenant_id = $1';
      const params: any[] = [tenantId];
      if (setor && setor !== 'Todos') {
        query += ' AND setor = $2';
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
  async getAnalytics(tenantId: string): Promise<CoreAnalytics> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM core_analytics WHERE tenant_id = $1 ORDER BY id DESC LIMIT 1', [tenantId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // LOG DE AGENTES DE IA
  // ----------------------------------------
  async logAiAgentAction(tenantId: string, data: CoreAiAgentLog): Promise<CoreAiAgentLog> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO core_ai_logs (agente, usuario, contexto, prompt, resposta, acoes_recomendadas, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `, [
        data.agente, data.usuario, data.contexto, data.prompt, data.resposta,
        JSON.stringify(data.acoes_recomendadas || []),
        tenantId
      ]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async listAiLogs(tenantId: string, agente?: string): Promise<CoreAiAgentLog[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM core_ai_logs WHERE tenant_id = $1';
      const params: any[] = [tenantId];
      if (agente && agente !== 'Todos') {
        query += ' AND agente = $2';
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
