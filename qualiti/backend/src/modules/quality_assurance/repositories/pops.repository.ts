import pool from '../../../db';

export class PopsRepository {
  // ==========================================
  // POPS & VERSÕES
  // ==========================================
  async findAllPops() {
    const res = await pool.query('SELECT id, titulo, codigo, versao, setor, status, autor, aprovador, data_criacao, data_revisao, data_limite, notificacao_enviada FROM pops ORDER BY id DESC');
    return res.rows;
  }

  async findPopById(id: number) {
    const res = await pool.query('SELECT * FROM pops WHERE id = $1', [id]);
    return res.rows[0];
  }

  async findPopByCodigo(codigo: string) {
    const res = await pool.query('SELECT id FROM pops WHERE codigo = $1', [codigo]);
    return res.rows[0];
  }

  async createPop(data: any, qrcode: string) {
    const res = await pool.query(`
      INSERT INTO pops (titulo, codigo, versao, setor, status, conteudo, autor, aprovador, qrcode, data_limite, notificacao_enviada)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '24 hours', TRUE)
      RETURNING *;
    `, [data.titulo, data.codigo, data.versao || '1.0', data.setor, data.status || 'Em Revisão', data.conteudo, data.autor || 'Admin', data.aprovador || 'Coordenador / RT (Responsável Técnico)', qrcode]);
    return res.rows[0];
  }

  async savePopVersion(popId: number, versao: string, conteudo: string, autor: string) {
    await pool.query(`
      INSERT INTO pop_versoes (pop_id, versao, conteudo, autor)
      VALUES ($1, $2, $3, $4)
    `, [popId, versao, conteudo, autor]);
  }

  async updatePopPending(id: number, data: any) {
    const res = await pool.query(`
      UPDATE pops
      SET titulo_pendente = $1, versao_pendente = $2, setor = $3, conteudo_pendente = $4, autor = $5, aprovador = $6, status_edicao = 'Aguardando Aprovação', data_revisao = CURRENT_TIMESTAMP, data_limite = NOW() + INTERVAL '24 hours', notificacao_enviada = TRUE
      WHERE id = $7
      RETURNING *;
    `, [data.titulo, data.versao, data.setor, data.conteudo, data.autor, data.aprovador, id]);
    return res.rows[0];
  }

  async approvePopEdit(id: number) {
    const res = await pool.query(`
      UPDATE pops
      SET titulo = COALESCE(titulo_pendente, titulo),
          versao = COALESCE(versao_pendente, versao),
          conteudo = COALESCE(conteudo_pendente, conteudo),
          status = 'Aprovado',
          status_edicao = 'Aprovada',
          titulo_pendente = NULL,
          versao_pendente = NULL,
          conteudo_pendente = NULL,
          data_revisao = CURRENT_TIMESTAMP
      WHERE id = $1 AND status_edicao = 'Aguardando Aprovação'
      RETURNING *;
    `, [id]);
    return res.rows[0];
  }

  async rejectPopEdit(id: number) {
    const res = await pool.query(`
      UPDATE pops
      SET status_edicao = 'Rejeitada',
          titulo_pendente = NULL,
          versao_pendente = NULL,
          conteudo_pendente = NULL
      WHERE id = $1 AND status_edicao = 'Aguardando Aprovação'
      RETURNING *;
    `, [id]);
    return res.rows[0];
  }

  async deletePop(id: number) {
    await pool.query('DELETE FROM pops WHERE id = $1', [id]);
  }

  async getPopVersions(popId: number) {
    const res = await pool.query('SELECT * FROM pop_versoes WHERE pop_id = $1 ORDER BY id DESC', [popId]);
    return res.rows;
  }

  // ==========================================
  // NOTIFICAÇÕES
  // ==========================================
  async getPopNotifications(popId: number) {
    const res = await pool.query('SELECT * FROM notificacoes WHERE pop_id = $1 ORDER BY id DESC', [popId]);
    return res.rows;
  }

  async getAllNotifications() {
    const res = await pool.query('SELECT * FROM notificacoes ORDER BY id DESC');
    return res.rows;
  }

  async createNotifications(popId: number, titulo: string, notifications: any[]) {
    for (const n of notifications) {
      await pool.query(`
        INSERT INTO notificacoes (pop_id, pop_titulo, destinatario_email, destinatario_papel, mensagem, prazo_horas, data_limite, status)
        VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '24 hours', $7);
      `, [popId, titulo, n.email, n.role, n.message, n.sla || 24, n.status || 'Pendente']);
    }
  }

  async resendNotification(id: number) {
    const res = await pool.query(`
      UPDATE notificacoes
      SET data_envio = CURRENT_TIMESTAMP, status = 'Reenviado (Alerta SLA)'
      WHERE id = $1
      RETURNING *;
    `, [id]);
    return res.rows[0];
  }

  // ==========================================
  // AUDITORIA E LOGS
  // ==========================================
  async logAudit(usuario: string, acao: string, entidade: string, entidade_id: string, ip: string) {
    await pool.query(`
      INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
      VALUES ($1, $2, $3, $4, $5)
    `, [usuario, acao, entidade, entidade_id, ip]);
  }

  // ==========================================
  // GESTÃO DE DOCUMENTOS DINÂMICA (LOW-CODE & BPM)
  // ==========================================
  async getDocumentTypes() {
    const res = await pool.query('SELECT t.*, w.nome as workflow_nome, tp.nome as template_nome FROM document_types t LEFT JOIN document_workflows w ON t.workflow_id = w.id LEFT JOIN document_templates tp ON t.template_id = tp.id WHERE t.ativo = TRUE ORDER BY t.id ASC');
    return res.rows;
  }

  async createDocumentType(data: any) {
    const res = await pool.query(`
      INSERT INTO document_types (nome, categoria, descricao, workflow_id, template_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [data.nome, data.categoria, data.descricao, data.workflow_id || null, data.template_id || null]);
    return res.rows[0];
  }

  async updateDocumentType(id: number, data: any) {
    const res = await pool.query(`
      UPDATE document_types
      SET nome = $1, categoria = $2, descricao = $3, workflow_id = $4, template_id = $5
      WHERE id = $6
      RETURNING *;
    `, [data.nome, data.categoria, data.descricao, data.workflow_id || null, data.template_id || null, id]);
    return res.rows[0];
  }

  async deleteDocumentType(id: number) {
    await pool.query('UPDATE document_types SET ativo = FALSE WHERE id = $1', [id]);
  }

  async getCategories() {
    const res = await pool.query('SELECT * FROM document_categories WHERE ativo = TRUE ORDER BY id ASC');
    return res.rows;
  }

  async createCategory(data: any) {
    const res = await pool.query(`
      INSERT INTO document_categories (nome, setor_alvo, subcategorias_json)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [data.nome, data.setor_alvo || 'Geral', data.subcategorias_json || []]);
    return res.rows[0];
  }

  async getWorkflows() {
    const res = await pool.query('SELECT * FROM document_workflows WHERE ativo = TRUE ORDER BY id ASC');
    return res.rows;
  }

  async createWorkflow(data: any) {
    const res = await pool.query(`
      INSERT INTO document_workflows (nome, descricao, etapas_json, sla_horas_padrao)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [data.nome, data.descricao, data.etapas_json || ['rascunho', 'revisão', 'aprovação', 'publicado'], data.sla_horas_padrao || 48]);
    return res.rows[0];
  }

  async getTemplates() {
    const res = await pool.query('SELECT * FROM document_templates WHERE ativo = TRUE ORDER BY id ASC');
    return res.rows;
  }

  async createTemplate(data: any) {
    const res = await pool.query(`
      INSERT INTO document_templates (nome, tipo_documental, conteudo_rich_text, placeholders_json)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [data.nome, data.tipo_documental, data.conteudo_rich_text, data.placeholders_json || ['nome', 'setor', 'responsavel', 'data']]);
    return res.rows[0];
  }

  async getForms() {
    const resForms = await pool.query('SELECT * FROM document_forms WHERE ativo = TRUE ORDER BY id ASC');
    const resFields = await pool.query('SELECT * FROM document_fields ORDER BY id ASC');
    const fieldMap: Record<number, any[]> = {};
    for (const f of resFields.rows) {
      if (!fieldMap[f.form_id]) fieldMap[f.form_id] = [];
      fieldMap[f.form_id].push(f);
    }
    return resForms.rows.map(form => ({
      ...form,
      campos: fieldMap[form.id] || []
    }));
  }

  async createForm(data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const resForm = await client.query(`
        INSERT INTO document_forms (nome, tipo_documental, setor)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [data.nome, data.tipo_documental, data.setor || 'Geral']);
      const novoForm = resForm.rows[0];

      if (data.campos && Array.isArray(data.campos)) {
        for (const c of data.campos) {
          await client.query(`
            INSERT INTO document_fields (form_id, nome_campo, tipo_campo, opcoes_json, obrigatorio)
            VALUES ($1, $2, $3, $4, $5)
          `, [novoForm.id, c.nome_campo, c.tipo_campo || 'texto', c.opcoes_json || [], c.obrigatorio || false]);
        }
      }
      await client.query('COMMIT');
      return novoForm;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // SLAS E FILAS (WORKER DB)
  // ==========================================
  async processSlas() {
    await pool.query(`
      UPDATE document_slas
      SET status_worker = 'escalonado'
      WHERE id IN (
        SELECT id FROM document_slas
        WHERE data_limite < CURRENT_TIMESTAMP AND status_worker = 'pendente'
        FOR UPDATE SKIP LOCKED
      );
    `);
    const res = await pool.query(`
      SELECT s.*, p.titulo as documento_titulo, p.codigo, p.setor
      FROM document_slas s
      JOIN pops p ON s.documento_id = p.id
      ORDER BY s.data_limite ASC;
    `);
    return res.rows;
  }

  // ==========================================
  // TRANSACTIONS AUX
  // ==========================================
  getPool() {
    return pool; // Fallback para bulk inserts complexos se necessário no service
  }
}
