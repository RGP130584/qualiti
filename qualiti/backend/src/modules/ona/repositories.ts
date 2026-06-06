import pool from '../../db';
import { 
  OnaDiagnostico, OnaEvidencia, OnaChecklist, 
  OnaAuditoria, OnaPlanoAcao, OnaKpi 
} from './models';

// ==========================================
// REPOSITORIES (CLEAN ARCHITECTURE)
// ==========================================

export class OnaDiagnosticoRepository {
  async findAll(setor?: string, nivel?: number) {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM ona_diagnosticos WHERE deleted_at IS NULL';
      const params: any[] = [];
      
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

  async findById(id: number) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_diagnosticos WHERE id = $1 AND deleted_at IS NULL', [id]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async create(data: OnaDiagnostico, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO ona_diagnosticos (requisito, categoria, nivel_ona, setor, status, criticidade, evidencias, responsavel, prazo, gap_analysis, score_conformidade)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `, [
        data.requisito, data.categoria, data.nivel_ona, data.setor, 
        data.status || 'Parcial', data.criticidade || 'Média', 
        JSON.stringify(data.evidencias || []), data.responsavel, 
        data.prazo ? new Date(data.prazo) : new Date(), 
        data.gap_analysis || '', data.score_conformidade || 50.00
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

  async update(id: number, data: Partial<OnaDiagnostico>, usuario: string) {
    const client = await pool.connect();
    try {
      const current = await this.findById(id);
      if (!current) throw new Error('Diagnóstico não encontrado');

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
        WHERE id = $12 AND deleted_at IS NULL
        RETURNING *;
      `, [
        data.requisito, data.categoria, data.nivel_ona, data.setor,
        data.status, data.criticidade, data.evidencias ? JSON.stringify(data.evidencias) : null,
        data.responsavel, data.prazo ? new Date(data.prazo) : null,
        data.gap_analysis, data.score_conformidade, id
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

  async softDelete(id: number, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_diagnosticos 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE id = $1 AND deleted_at IS NULL 
        RETURNING *;
      `, [id]);

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
  async findAll(requisito_id?: number) {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM ona_evidencias WHERE deleted_at IS NULL';
      const params: any[] = [];
      if (requisito_id) {
        params.push(requisito_id);
        query += ' AND requisito_id = $1';
      }
      query += ' ORDER BY id DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async create(data: OnaEvidencia, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO ona_evidencias (requisito_id, nome_arquivo, tipo_arquivo, versao, status_aprovacao, autor, ocr_texto, embeddings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `, [
        data.requisito_id, data.nome_arquivo, data.tipo_arquivo, 
        data.versao || '1.0', data.status_aprovacao || 'Pendente', 
        data.autor, data.ocr_texto || '', JSON.stringify(data.embeddings || [])
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

  async updateStatus(id: number, status_aprovacao: 'Aprovado' | 'Rejeitado', usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_evidencias
        SET status_aprovacao = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *;
      `, [status_aprovacao, id]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'ONA_EVIDENCE_STATUS_UPDATE', 'ONA_EVIDENCIAS', $2, '127.0.0.1')
      `, [usuario || 'Admin', id]);

      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async softDelete(id: number, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_evidencias SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *;
      `, [id]);
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
  async findAll(nivel_ona?: number) {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM ona_checklists WHERE deleted_at IS NULL';
      const params: any[] = [];
      if (nivel_ona) {
        params.push(nivel_ona);
        query += ' AND nivel_ona = $1';
      }
      query += ' ORDER BY id ASC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findById(id: number) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_checklists WHERE id = $1 AND deleted_at IS NULL', [id]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateConformidade(id: number, conformidade: 'Conforme' | 'Parcial' | 'Não Conforme', pontuacao: number, observacoes: string, evidencias: string[], usuario: string) {
    const client = await pool.connect();
    try {
      const current = await this.findById(id);
      if (!current) throw new Error('Checklist não encontrado');

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
        WHERE id = $6 AND deleted_at IS NULL
        RETURNING *;
      `, [conformidade, pontuacao, observacoes, JSON.stringify(evidencias || []), JSON.stringify(newAuditTrail), id]);

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
  async findAll(setor?: string) {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM ona_auditorias WHERE deleted_at IS NULL';
      const params: any[] = [];
      if (setor && setor !== 'Todos') {
        params.push(setor);
        query += ' AND setor = $1';
      }
      query += ' ORDER BY data_auditoria DESC';
      const res = await client.query(query, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findById(id: number) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_auditorias WHERE id = $1 AND deleted_at IS NULL', [id]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async create(data: OnaAuditoria, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO ona_auditorias (titulo, setor, tipo_auditoria, data_auditoria, auditor_responsavel, score_geral, status, evidencias_registradas, nao_conformidades, plano_corretivo_capa)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `, [
        data.titulo, data.setor, data.tipo_auditoria || 'Interna', 
        data.data_auditoria ? new Date(data.data_auditoria) : new Date(), 
        data.auditor_responsavel, data.score_geral || 0.00, 
        data.status || 'Agendada', JSON.stringify(data.evidencias_registradas || []), 
        JSON.stringify(data.nao_conformidades || []), JSON.stringify(data.plano_corretivo_capa || [])
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

  async updateStatus(id: number, status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada', score_geral: number, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_auditorias
        SET status = $1, score_geral = COALESCE($2, score_geral), updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *;
      `, [status, score_geral, id]);

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
  async findAll() {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_planos_acao WHERE deleted_at IS NULL ORDER BY data_limite ASC');
      return res.rows;
    } finally {
      client.release();
    }
  }

  async create(data: OnaPlanoAcao, usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO ona_planos_acao (nao_conformidade_origem, plano_corretivo, responsavel, sla_horas, prioridade, workflow_status, data_limite)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `, [
        data.nao_conformidade_origem, data.plano_corretivo, data.responsavel, 
        data.sla_horas || 24, data.prioridade || 'Média', 
        data.workflow_status || 'Pendente', data.data_limite ? new Date(data.data_limite) : new Date(Date.now() + 24*3600*1000)
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

  async updateWorkflowStatus(id: number, status: 'Pendente' | 'Em Execução' | 'Em Validação' | 'Concluído', usuario: string) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_planos_acao
        SET workflow_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *;
      `, [status, id]);

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
  async findAll() {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_kpis ORDER BY id ASC');
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findByCodigo(codigo: string) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_kpis WHERE codigo = $1', [codigo]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateKpi(codigo: string, valor_atual: number, tendencia: 'Subindo' | 'Estável' | 'Descendo') {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE ona_kpis
        SET valor_atual = $1, tendencia = $2, updated_at = CURRENT_TIMESTAMP
        WHERE codigo = $3
        RETURNING *;
      `, [valor_atual, tendencia, codigo]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }
}

export class OnaAiLogRepository {
  async createLog(usuario: string, pergunta: string, resposta: string, requisitos: any[]) {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO ona_ai_logs (usuario, pergunta, resposta, requisitos_referenciados)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [usuario, pergunta, resposta, JSON.stringify(requisitos || [])]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async getRecentLogs(limit = 20) {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM ona_ai_logs ORDER BY created_at DESC LIMIT $1', [limit]);
      return res.rows;
    } finally {
      client.release();
    }
  }
}
