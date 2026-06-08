import pool from '../../db';
import { Pop, PopVersao, Notificacao } from './models';

export class PopsRepository {
  // ----------------------------------------
  // POPs CRUD
  // ----------------------------------------
  async findAll(tenantId: string): Promise<Pop[]> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT id, titulo, codigo, versao, setor, status, autor, aprovador, data_criacao, data_revisao, data_limite, notificacao_enviada, status_edicao, categoria, tipo_documental, nivel_acesso, ocr_texto, documentos_impactados, rastreabilidade_normas FROM pops WHERE deleted_at IS NULL AND tenant_id = $1 ORDER BY id DESC',
        [tenantId]
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findById(tenantId: string, id: number): Promise<Pop | null> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM pops WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL', [id, tenantId]);
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async findByCodigo(tenantId: string, codigo: string): Promise<Pop | null> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM pops WHERE codigo = $1 AND tenant_id = $2 AND deleted_at IS NULL', [codigo, tenantId]);
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async create(tenantId: string, data: Pop): Promise<Pop> {
    const client = await pool.connect();
    try {
      const qrcode = data.qrcode || `QR_QUALITA_${data.codigo}`;
      const res = await client.query(`
        INSERT INTO pops (
          titulo, codigo, versao, setor, status, conteudo, autor, aprovador, qrcode, 
          data_limite, notificacao_enviada, categoria, tipo_documental, nivel_acesso,
          ocr_texto, embeddings, documentos_impactados, rastreabilidade_normas, tenant_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '24 hours', TRUE, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *;
      `, [
        data.titulo, data.codigo, data.versao || '1.0', data.setor, data.status || 'Em Revisão',
        data.conteudo, data.autor || 'Admin', data.aprovador || 'Coordenador / RT (Responsável Técnico)',
        qrcode, data.categoria || 'Procedimento', data.tipo_documental || 'POP', data.nivel_acesso || 'Geral',
        data.ocr_texto || `[OCR] ${data.conteudo}`, JSON.stringify(data.embeddings || []),
        JSON.stringify(data.documentos_impactados || []), JSON.stringify(data.rastreabilidade_normas || []),
        tenantId
      ]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updatePendingEdit(tenantId: string, id: number, data: Partial<Pop>): Promise<Pop> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE pops 
        SET titulo_pendente = $1, 
            versao_pendente = $2, 
            setor = COALESCE($3, setor), 
            conteudo_pendente = $4, 
            autor = COALESCE($5, autor), 
            aprovador = COALESCE($6, aprovador), 
            status_edicao = 'Aguardando Aprovação', 
            data_revisao = CURRENT_TIMESTAMP, 
            data_limite = NOW() + INTERVAL '24 hours', 
            notificacao_enviada = TRUE
        WHERE id = $7 AND tenant_id = $8 AND deleted_at IS NULL
        RETURNING *;
      `, [
        data.titulo, data.versao, data.setor, data.conteudo, 
        data.autor, data.aprovador, id, tenantId
      ]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async approveEdit(tenantId: string, id: number, aprovadorNome: string): Promise<Pop> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
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
        WHERE id = $1 AND tenant_id = $2 AND status_edicao = 'Aguardando Aprovação' AND deleted_at IS NULL
        RETURNING *;
      `, [id, tenantId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async rejectEdit(tenantId: string, id: number): Promise<Pop> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE pops 
        SET status_edicao = 'Rejeitada',
            titulo_pendente = NULL,
            versao_pendente = NULL,
            conteudo_pendente = NULL
        WHERE id = $1 AND tenant_id = $2 AND status_edicao = 'Aguardando Aprovação' AND deleted_at IS NULL
        RETURNING *;
      `, [id, tenantId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async hardDelete(tenantId: string, id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query('DELETE FROM pops WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
      return (res.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // VERSÕES DE POPs
  // ----------------------------------------
  async createVersao(popId: number, versao: string, conteudo: string, autor: string): Promise<PopVersao> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO pop_versoes (pop_id, versao, conteudo, autor)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [popId, versao, conteudo, autor]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async listVersoes(popId: number): Promise<PopVersao[]> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM pop_versoes WHERE pop_id = $1 ORDER BY id DESC', [popId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // NOTIFICAÇÕES & SLAs
  // ----------------------------------------
  async createNotificacao(popId: number, popTitulo: string, email: string, papel: string, mensagem: string, prazoHoras = 24, status = 'Pendente'): Promise<Notificacao> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO notificacoes (pop_id, pop_titulo, destinatario_email, destinatario_papel, mensagem, prazo_horas, data_limite, status)
        VALUES ($1, $2, $3, $4, $5, $6, NOW() + ($6::integer * INTERVAL '1 hour'), $7)
        RETURNING *;
      `, [popId, popTitulo, email, papel, mensagem, prazoHoras, status]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async listNotificacoes(tenantId: string): Promise<Notificacao[]> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT n.* 
        FROM notificacoes n 
        JOIN pops p ON n.pop_id = p.id 
        WHERE p.tenant_id = $1 AND p.deleted_at IS NULL
        ORDER BY n.id DESC
      `, [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async resendNotificacao(tenantId: string, id: number): Promise<Notificacao | null> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE notificacoes n
        SET data_envio = CURRENT_TIMESTAMP, status = 'Reenviado (Alerta SLA)'
        FROM pops p
        WHERE n.pop_id = p.id AND n.id = $1 AND p.tenant_id = $2
        RETURNING n.*;
      `, [id, tenantId]);
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // DOCUMENT TYPES CONFIG (GLOBAL)
  // ----------------------------------------
  async listTypes(): Promise<any[]> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT t.*, w.nome as workflow_nome, tp.nome as template_nome 
        FROM document_types t 
        LEFT JOIN document_workflows w ON t.workflow_id = w.id 
        LEFT JOIN document_templates tp ON t.template_id = tp.id 
        WHERE t.ativo = TRUE 
        ORDER BY t.id ASC
      `);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createType(nome: string, categoria: string, descricao: string, workflowId: number | null, templateId: number | null): Promise<any> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO document_types (nome, categoria, descricao, workflow_id, template_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [nome, categoria, descricao, workflowId, templateId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateType(id: number, nome: string, categoria: string, descricao: string, workflowId: number | null, templateId: number | null): Promise<any> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        UPDATE document_types 
        SET nome = $1, categoria = $2, descricao = $3, workflow_id = $4, template_id = $5
        WHERE id = $6
        RETURNING *;
      `, [nome, categoria, descricao, workflowId, templateId, id]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async deactivateType(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('UPDATE document_types SET ativo = FALSE WHERE id = $1', [id]);
      return true;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // CATEGORIES CONFIG (GLOBAL)
  // ----------------------------------------
  async listCategories(): Promise<any[]> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM document_categories WHERE ativo = TRUE ORDER BY id ASC');
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createCategory(nome: string, setorAlvo: string, subcategoriasJson: any[]): Promise<any> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO document_categories (nome, setor_alvo, subcategorias_json)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [nome, setorAlvo, JSON.stringify(subcategoriasJson)]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // WORKFLOWS CONFIG (GLOBAL)
  // ----------------------------------------
  async listWorkflows(): Promise<any[]> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM document_workflows WHERE ativo = TRUE ORDER BY id ASC');
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createWorkflow(nome: string, descricao: string, etapasJson: string[], slaHorasPadrao: number): Promise<any> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO document_workflows (nome, descricao, etapas_json, sla_horas_padrao)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [nome, descricao, JSON.stringify(etapasJson), slaHorasPadrao]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // TEMPLATES CONFIG (GLOBAL)
  // ----------------------------------------
  async listTemplates(): Promise<any[]> {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM document_templates WHERE ativo = TRUE ORDER BY id ASC');
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createTemplate(nome: string, tipoDocumental: string, conteudoRichText: string, placeholdersJson: string[]): Promise<any> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO document_templates (nome, tipo_documental, conteudo_rich_text, placeholders_json)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [nome, tipoDocumental, conteudoRichText, JSON.stringify(placeholdersJson)]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // FORMS CONFIG (GLOBAL)
  // ----------------------------------------
  async listForms(): Promise<any[]> {
    const client = await pool.connect();
    try {
      const resForms = await client.query('SELECT * FROM document_forms WHERE ativo = TRUE ORDER BY id ASC');
      const resFields = await client.query('SELECT * FROM document_fields ORDER BY id ASC');
      
      const fieldMap: Record<number, any[]> = {};
      for (const f of resFields.rows) {
        if (!fieldMap[f.form_id]) fieldMap[f.form_id] = [];
        fieldMap[f.form_id].push(f);
      }

      return resForms.rows.map(form => ({
        ...form,
        campos: fieldMap[form.id] || []
      }));
    } finally {
      client.release();
    }
  }

  async createForm(nome: string, tipoDocumental: string, setor: string, campos: any[]): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const resForm = await client.query(`
        INSERT INTO document_forms (nome, tipo_documental, setor)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [nome, tipoDocumental, setor]);
      const form = resForm.rows[0];

      if (campos && Array.isArray(campos)) {
        for (const c of campos) {
          await client.query(`
            INSERT INTO document_fields (form_id, nome_campo, tipo_campo, opcoes_json, obrigatorio)
            VALUES ($1, $2, $3, $4, $5)
          `, [form.id, c.nome_campo, c.tipo_campo || 'texto', JSON.stringify(c.opcoes_json || []), c.obrigatorio || false]);
        }
      }

      await client.query('COMMIT');
      return form;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // SLAs (TENANT FILTERED ON POP RELATIONSHIP)
  // ----------------------------------------
  async listSlas(tenantId: string): Promise<any[]> {
    const client = await pool.connect();
    try {
      // Run escalation simulation worker first
      await client.query(`
        UPDATE document_slas s
        SET status_worker = 'escalonado'
        FROM pops p
        WHERE s.documento_id = p.id AND s.data_limite < CURRENT_TIMESTAMP AND s.status_worker = 'pendente' AND p.tenant_id = $1
      `, [tenantId]);

      const res = await client.query(`
        SELECT s.*, p.titulo as documento_titulo, p.codigo, p.setor 
        FROM document_slas s 
        JOIN pops p ON s.documento_id = p.id 
        WHERE p.tenant_id = $1 AND p.deleted_at IS NULL
        ORDER BY s.data_limite ASC
      `, [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // AI SEARCH (TENANT FILTERED ON POP RELATIONSHIP)
  // ----------------------------------------
  async searchPops(tenantId: string, query?: string, setor?: string): Promise<any[]> {
    const client = await pool.connect();
    try {
      let queryStr = 'SELECT id, titulo, codigo, setor, status, conteudo FROM pops WHERE tenant_id = $1 AND deleted_at IS NULL';
      const params: any[] = [tenantId];
      let paramIdx = 2;

      if (setor && setor !== 'Diretoria Geral' && setor !== 'Qualidade e ONA') {
        queryStr += ` AND setor = $${paramIdx}`;
        params.push(setor);
        paramIdx++;
      }

      if (query) {
        queryStr += ` AND (titulo ILIKE $${paramIdx} OR conteudo ILIKE $${paramIdx} OR codigo ILIKE $${paramIdx})`;
        params.push(`%${query}%`);
        paramIdx++;
      }

      queryStr += ' ORDER BY id DESC LIMIT 10';
      const res = await client.query(queryStr, params);
      return res.rows;
    } finally {
      client.release();
    }
  }
}
