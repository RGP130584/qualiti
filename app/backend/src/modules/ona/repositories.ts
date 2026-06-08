import pool from '../../db';
import { 
  OnaDiagnostico, OnaEvidencia, OnaChecklist, 
  OnaAuditoria, OnaPlanoAcao, OnaKpi 
} from './models';

// ==========================================
// REPOSITORIES (CLEAN ARCHITECTURE)
// ==========================================

export class OnaDiagnosticoRepository {
  async findAll(tenantId: string, setor?: string, nivel?: number) {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM ona_diagnosticos WHERE deleted_at IS NULL AND tenant_id = $1';
      const params: any[] = [tenantId];
      
      if (setor && setor !== 'Todos') {
        params.push(setor);
        query += ` AND setor = $${params.length}`;
      }
      if (nivel) {
        params.push(nivel);
        query += ` AND nivel_ona = $${params.length}`;
      }
      query += ' ORDER BY id ASC';
      
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findById(tenantId: string, id: number) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_diagnosticos WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL', [id, tenantId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async create(tenantId: string, data: OnaDiagnostico, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO ona_diagnosticos (
          requisito, categoria, nivel_ona, setor, status, criticidade, evidencias, responsavel, prazo, gap_analysis, score_conformidade, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `, [
        data.requisito, data.categoria, data.nivel_ona, data.setor, 
        data.status || 'Parcial', data.criticidade || 'Média', 
        JSON.stringify(data.evidencias || []), data.responsavel, 
        data.prazo ? new Date(data.prazo) : new Date(), 
        data.gap_analysis || '', data.score_conformidade || 50.00,
        tenantId
      ]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_DIAGNOSTICO_CREATE', 'ONA_DIAGNOSTICO', $2, '127.0.0.1')
      `, [usuario || 'Admin', res.rows[0].id]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async update(tenantId: string, id: number, data: Partial<OnaDiagnostico>, usuario: string) {
    const client = await pool.connect();
    try {
      const current = await this.findById(tenantId, id);
      if (!current) throw new Error('Diagnóstico não encontrado ou não pertence à sua unidade');

      const res = await client.query(`
        UPDATE ona_diagnosticos
        SET requisito = COALESCE($1, requisito),
            categoria = COALESCE($2, categoria),
            nivel_ona = COALESCE($3, nivel_ona),
            setor = COALESCE($4, setor),
            status = COALESCE($5, status),
            criticidade = COALESCE($6, criticidade),
            evidencias = COALESCE($7, evidencias),
            responsavel = COALESCE($8, responsavel),
            prazo = COALESCE($9, prazo),
            gap_analysis = COALESCE($10, gap_analysis),
            score_conformidade = COALESCE($11, score_conformidade),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $12 AND tenant_id = $13 AND deleted_at IS NULL
        RETURNING *;
      `, [
        data.requisito, data.categoria, data.nivel_ona, data.setor,
        data.status, data.criticidade, data.evidencias ? JSON.stringify(data.evidencias) : null,
        data.responsavel, data.prazo ? new Date(data.prazo) : null,
        data.gap_analysis, data.score_conformidade, id, tenantId
      ]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_DIAGNOSTICO_UPDATE', 'ONA_DIAGNOSTICO', $2, '127.0.0.1')
      `, [usuario || 'Admin', id]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async softDelete(tenantId: string, id: number, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_diagnosticos 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL 
        RETURNING *;
      `, [id, tenantId]);

      if (res.rows.length > 0) {
        await client.query(`
          INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
          VALUES ($1, 'ONA_DIAGNOSTICO_DELETE', 'ONA_DIAGNOSTICO', $2, '127.0.0.1')
        `, [usuario || 'Admin', id]);
      }
      return res.rows[0];
    } finally {
      client.release();
    }
  }
}

export class OnaEvidenciaRepository {
  async findAll(tenantId: string, requisito_id?: number) {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM ona_evidencias WHERE deleted_at IS NULL AND tenant_id = $1';
      const params: any[] = [tenantId];
      if (requisito_id) {
        params.push(requisito_id);
        query += ' AND requisito_id = $2';
      }
      query += ' ORDER BY id DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async create(tenantId: string, data: OnaEvidencia, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO ona_evidencias (requisito_id, nome_arquivo, tipo_arquivo, versao, status_aprovacao, autor, ocr_texto, embeddings, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `, [
        data.requisito_id, data.nome_arquivo, data.tipo_arquivo, 
        data.versao || '1.0', data.status_aprovacao || 'Pendente', 
        data.autor, data.ocr_texto || '', JSON.stringify(data.embeddings || []),
        tenantId
      ]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_EVIDENCE_UPLOAD', 'ONA_EVIDENCIAS', $2, '127.0.0.1')
      `, [usuario || 'Admin', res.rows[0].id]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateStatus(tenantId: string, id: number, status_aprovacao: 'Aprovado' | 'Rejeitado', usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_evidencias
        SET status_aprovacao = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
        RETURNING *;
      `, [status_aprovacao, id, tenantId]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_EVIDENCE_STATUS_UPDATE', 'ONA_EVIDENCIAS', $2, '127.0.0.1')
      `, [usuario || 'Admin', id]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async softDelete(tenantId: string, id: number, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_evidencias SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL RETURNING *;
      `, [id, tenantId]);
      if (res.rows.length > 0) {
        await client.query(`
          INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
          VALUES ($1, 'ONA_EVIDENCE_DELETE', 'ONA_EVIDENCIAS', $2, '127.0.0.1')
        `, [usuario || 'Admin', id]);
      }
      return res.rows[0];
    } finally {
      client.release();
    }
  }
}

export class OnaChecklistRepository {
  async findAll(tenantId: string, nivel_ona?: number) {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM ona_checklists WHERE deleted_at IS NULL AND tenant_id = $1';
      const params: any[] = [tenantId];
      if (nivel_ona) {
        params.push(nivel_ona);
        query += ' AND nivel_ona = $2';
      }
      query += ' ORDER BY id ASC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findById(tenantId: string, id: number) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_checklists WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL', [id, tenantId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateConformidade(tenantId: string, id: number, conformidade: 'Conforme' | 'Parcial' | 'Não Conforme', pontuacao: number, observacoes: string, evidencias: string[], usuario: string) {
    const client = await pool.connect();
    try {
      const current = await this.findById(tenantId, id);
      if (!current) throw new Error('Checklist não encontrado ou não pertence à sua unidade');

      const auditEntry = {
        data: new Date(),
        usuario,
        conformidade_anterior: current.conformidade,
        conformidade_nova: conformidade,
        observacao: observacoes
      };

      const newAuditTrail = [...(current.audit_trail || []), auditEntry];

      const res = await client.query(`
        UPDATE ona_checklists
        SET conformidade = $1, pontuacao = $2, observacoes = $3, evidencias_vinculadas = $4, audit_trail = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND tenant_id = $7 AND deleted_at IS NULL
        RETURNING *;
      `, [conformidade, pontuacao, observacoes, JSON.stringify(evidencias || []), JSON.stringify(newAuditTrail), id, tenantId]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_CHECKLIST_UPDATE', 'ONA_CHECKLISTS', $2, '127.0.0.1')
      `, [usuario || 'Admin', id]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }
}

export class OnaAuditoriaRepository {
  async findAll(tenantId: string, setor?: string) {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM ona_auditorias WHERE deleted_at IS NULL AND tenant_id = $1';
      const params: any[] = [tenantId];
      if (setor && setor !== 'Todos') {
        params.push(setor);
        query += ' AND setor = $2';
      }
      query += ' ORDER BY data_auditoria DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findById(tenantId: string, id: number) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_auditorias WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL', [id, tenantId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async create(tenantId: string, data: OnaAuditoria, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO ona_auditorias (titulo, setor, tipo_auditoria, data_auditoria, auditor_responsavel, score_geral, status, evidencias_registradas, nao_conformidades, plano_corretivo_capa, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `, [
        data.titulo, data.setor, data.tipo_auditoria || 'Interna', 
        data.data_auditoria ? new Date(data.data_auditoria) : new Date(), 
        data.auditor_responsavel, data.score_geral || 0.00, 
        data.status || 'Agendada', JSON.stringify(data.evidencias_registradas || []), 
        JSON.stringify(data.nao_conformidades || []), JSON.stringify(data.plano_corretivo_capa || []),
        tenantId
      ]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_AUDITORIA_CREATE', 'ONA_AUDITORIAS', $2, '127.0.0.1')
      `, [usuario || 'Admin', res.rows[0].id]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateStatus(tenantId: string, id: number, status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada', score_geral: number, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_auditorias
        SET status = $1, score_geral = COALESCE($2, score_geral), updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL
        RETURNING *;
      `, [status, score_geral, id, tenantId]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_AUDITORIA_STATUS_UPDATE', 'ONA_AUDITORIAS', $2, '127.0.0.1')
      `, [usuario || 'Admin', id]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }
}

export class OnaPlanoAcaoRepository {
  async findAll(tenantId: string) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_planos_acao WHERE deleted_at IS NULL AND tenant_id = $1 ORDER BY data_limite ASC', [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async create(tenantId: string, data: OnaPlanoAcao, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO ona_planos_acao (nao_conformidade_origem, plano_corretivo, responsavel, sla_horas, prioridade, workflow_status, data_limite, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `, [
        data.nao_conformidade_origem, data.plano_corretivo, data.responsavel, 
        data.sla_horas || 24, data.prioridade || 'Média', 
        data.workflow_status || 'Pendente', data.data_limite ? new Date(data.data_limite) : new Date(Date.now() + 24*3600*1000),
        tenantId
      ]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_PLANO_ACAO_CREATE', 'ONA_PLANOS_ACAO', $2, '127.0.0.1')
      `, [usuario || 'Admin', res.rows[0].id]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateWorkflowStatus(tenantId: string, id: number, status: 'Pendente' | 'Em Execução' | 'Em Validação' | 'Concluído', usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_planos_acao
        SET workflow_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
        RETURNING *;
      `, [status, id, tenantId]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_PLANO_ACAO_STATUS_UPDATE', 'ONA_PLANOS_ACAO', $2, '127.0.0.1')
      `, [usuario || 'Admin', id]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }
}

export class OnaKpiRepository {
  async findAll(tenantId: string) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_kpis WHERE tenant_id = $1 ORDER BY id ASC', [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findByCodigo(tenantId: string, codigo: string) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_kpis WHERE codigo = $1 AND tenant_id = $2', [codigo, tenantId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateKpi(tenantId: string, codigo: string, valor_atual: number, tendencia: 'Subindo' | 'Estável' | 'Descendo') {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_kpis
        SET valor_atual = $1, tendencia = $2, updated_at = CURRENT_TIMESTAMP
        WHERE codigo = $3 AND tenant_id = $4
        RETURNING *;
      `, [valor_atual, tendencia, codigo, tenantId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }
}

export class OnaAiLogRepository {
  async createLog(tenantId: string, usuario: string, pergunta: string, resposta: string, requisitos: any[]) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO ona_ai_logs (usuario, pergunta, resposta, requisitos_referenciados, tenant_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [usuario, pergunta, resposta, JSON.stringify(requisitos || []), tenantId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async getRecentLogs(tenantId: string, limit = 20) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_ai_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2', [tenantId, limit]);
      return res.rows;
    } finally {
      client.release();
    }
  }
}
