import { PopsRepository } from './repositories';
import { Pop, PopVersao, Notificacao } from './models';
import { TODOS_DOCUMENTOS_69 } from '../core/documentosData';
import pool from '../../db';
import { eventBus } from '../../utils/event-bus';

export class PopsService {
  private repo = new PopsRepository();

  async listPops(tenantId: string): Promise<Pop[]> {
    return await this.repo.findAll(tenantId);
  }

  async getPopDetails(tenantId: string, id: number) {
    const pop = await this.repo.findById(tenantId, id);
    if (!pop) return null;

    const hist = await this.repo.listVersoes(id);
    const notifications = await this.repo.listNotificacoes(tenantId);
    const popNotifications = notifications.filter(n => n.pop_id === id);

    return {
      ...pop,
      historico_versoes: hist,
      notificacoes: popNotifications
    };
  }

  async createPop(tenantId: string, data: Pop, ipAddress = '127.0.0.1'): Promise<Pop> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Validação de cota de documentos (100% de limite de uso)
      const planRes = await client.query(`
        SELECT p.cota_documentos
        FROM pal_assinaturas a
        JOIN pal_planos p ON a.plano_id = p.id
        WHERE a.tenant_id = $1
      `, [tenantId]);

      if (planRes.rows.length > 0) {
        const limitDocs = planRes.rows[0].cota_documentos;
        const docCountRes = await client.query(
          'SELECT COUNT(*) FROM pops WHERE tenant_id = $1 AND deleted_at IS NULL',
          [tenantId]
        );
        const docCount = parseInt(docCountRes.rows[0].count);

        if (docCount >= limitDocs) {
          throw new Error('Limite de documentos da cota excedido. Por favor, faça um upgrade de seu plano no marketplace.');
        }
      }

      const createdPop = await this.repo.create(tenantId, data);
      
      // Initial version creation
      await this.repo.createVersao(createdPop.id!, createdPop.versao, createdPop.conteudo, createdPop.autor);
      
      // Generate default notifications (revisor, approved, direct team)
      await this.repo.createNotificacao(
        createdPop.id!,
        createdPop.titulo,
        'revisor.rt@redeverse.com',
        'Coordenador / RT (Responsável Técnico)',
        'Notificação de Revisão Técnica Obrigatória (SLA 24 Horas). Ação imediata requerida.',
        24
      );

      await this.repo.createNotificacao(
        createdPop.id!,
        createdPop.titulo,
        'aprovador.diretoria@redeverse.com',
        'Diretoria ONA',
        'Notificação de Aprovação Institucional (SLA 24 Horas). Aguardando validação final.',
        24
      );

      await this.repo.createNotificacao(
        createdPop.id!,
        createdPop.titulo,
        'equipe.direta@redeverse.com',
        'Responsáveis Diretos',
        'Alerta de Novo Procedimento / Protocolo para ciência e cumprimento imediato.',
        24
      );

      // Audit log entry
      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'POP_CREATE_WITH_SLA', 'POPs', $2, $3)
      `, [createdPop.autor, createdPop.codigo, ipAddress]);

      await client.query('COMMIT');

      // Publish event asynchronously to notify users and auto-enroll in LMS courses
      eventBus.publish('NovaVersaoDocumentoVigente', {
        pop_id: createdPop.id,
        tenant_id: tenantId,
        codigo: createdPop.codigo,
        titulo: createdPop.titulo,
        setor: createdPop.setor,
        versao: createdPop.versao,
        autor: createdPop.autor
      });

      return createdPop;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async requestPopEdit(tenantId: string, id: number, data: Partial<Pop>, ipAddress = '127.0.0.1'): Promise<Pop | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const pop = await this.repo.findById(tenantId, id);
      if (!pop) {
        await client.query('ROLLBACK');
        return null;
      }

      const updatedPop = await this.repo.updatePendingEdit(tenantId, id, data);

      // Generate notifications for editing request
      await this.repo.createNotificacao(
        updatedPop.id!,
        updatedPop.titulo,
        'revisor.rt@redeverse.com',
        'Coordenador / RT (Responsável Técnico)',
        'Edição de POP/Protocolo solicitada. Revisão Técnica Obrigatória (SLA 24 Horas).',
        24
      );

      await this.repo.createNotificacao(
        updatedPop.id!,
        updatedPop.titulo,
        'aprovador.diretoria@redeverse.com',
        'Diretoria ONA',
        'Edição de POP/Protocolo solicitada. Aguardando Validação e Aprovação para publicação (SLA 24 Horas).',
        24
      );

      // Audit log entry
      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'POP_EDIT_REQUESTED', 'POPs', $2, $3)
      `, [updatedPop.autor, updatedPop.codigo, ipAddress]);

      await client.query('COMMIT');
      return updatedPop;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async approvePopEdit(tenantId: string, id: number, aprovadorNome: string, ipAddress = '127.0.0.1'): Promise<Pop | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const pop = await this.repo.findById(tenantId, id);
      if (!pop || pop.status_edicao !== 'Aguardando Aprovação') {
        await client.query('ROLLBACK');
        return null;
      }

      const approvedPop = await this.repo.approveEdit(tenantId, id, aprovadorNome);

      // Add version history entry
      await this.repo.createVersao(approvedPop.id!, approvedPop.versao, approvedPop.conteudo, aprovadorNome);

      // Generate notification to author
      await this.repo.createNotificacao(
        approvedPop.id!,
        approvedPop.titulo,
        'autor.elaborador@redeverse.com',
        'Elaborador / Autor',
        'Sua edição do POP/Protocolo foi APROVADA e publicada oficialmente na instituição.',
        24,
        'Enviado'
      );

      // Audit log entry
      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'POP_EDIT_APPROVED', 'POPs', $2, $3)
      `, [aprovadorNome, approvedPop.codigo, ipAddress]);

      await client.query('COMMIT');

      // Publish event asynchronously to notify users and auto-enroll in LMS courses
      eventBus.publish('NovaVersaoDocumentoVigente', {
        pop_id: approvedPop.id,
        tenant_id: tenantId,
        codigo: approvedPop.codigo,
        titulo: approvedPop.titulo,
        setor: approvedPop.setor,
        versao: approvedPop.versao,
        autor: approvedPop.autor
      });

      return approvedPop;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async rejectPopEdit(tenantId: string, id: number, aprovadorNome: string, motivo: string, ipAddress = '127.0.0.1'): Promise<Pop | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const pop = await this.repo.findById(tenantId, id);
      if (!pop || pop.status_edicao !== 'Aguardando Aprovação') {
        await client.query('ROLLBACK');
        return null;
      }

      const rejectedPop = await this.repo.rejectEdit(tenantId, id);

      // Generate notification to author
      await this.repo.createNotificacao(
        rejectedPop.id!,
        rejectedPop.titulo,
        'autor.elaborador@redeverse.com',
        'Elaborador / Autor',
        `Sua edição do POP/Protocolo foi REJEITADA. Motivo: ${motivo || 'Não conformidade com padrões ONA'}`,
        24,
        'Enviado'
      );

      // Audit log
      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'POP_EDIT_REJECTED', 'POPs', $2, $3)
      `, [aprovadorNome, rejectedPop.codigo, ipAddress]);

      await client.query('COMMIT');
      return rejectedPop;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deletePop(tenantId: string, id: number, ipAddress = '127.0.0.1'): Promise<boolean> {
    const client = await pool.connect();
    try {
      const pop = await this.repo.findById(tenantId, id);
      if (!pop) return false;

      await this.repo.hardDelete(tenantId, id);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ('Admin', 'POP_DELETE', 'POPs', $1, $2)
      `, [pop.codigo, ipAddress]);

      return true;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // NOTIFICAÇÕES & SLAs
  // ----------------------------------------
  async listNotificacoes(tenantId: string): Promise<Notificacao[]> {
    return await this.repo.listNotificacoes(tenantId);
  }

  async resendNotificacao(tenantId: string, id: number): Promise<Notificacao | null> {
    return await this.repo.resendNotificacao(tenantId, id);
  }

  // ----------------------------------------
  // INGESTÃO AUTOMATIZADA REDE VERSE
  // ----------------------------------------
  async ingestDefaultDocs(tenantId: string): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obter cota de documentos contratada
      const planRes = await client.query(`
        SELECT p.cota_documentos
        FROM pal_assinaturas a
        JOIN pal_planos p ON a.plano_id = p.id
        WHERE a.tenant_id = $1
      `, [tenantId]);
      const limitDocs = planRes.rows.length > 0 ? planRes.rows[0].cota_documentos : 50;

      let count = 0;
      for (const doc of TODOS_DOCUMENTOS_69) {
        const popCheck = await this.repo.findByCodigo(tenantId, doc.codigo);
        if (!popCheck) {
          // Verificar quantidade atual de documentos
          const docCountRes = await client.query(
            'SELECT COUNT(*) FROM pops WHERE tenant_id = $1 AND deleted_at IS NULL',
            [tenantId]
          );
          const docCount = parseInt(docCountRes.rows[0].count);
          if (docCount >= limitDocs) {
            throw new Error(`Limite de documentos da cota excedido (${limitDocs}). Ingestão cancelada.`);
          }

          const popObj: Pop = {
            titulo: doc.documento,
            codigo: doc.codigo,
            versao: '1.0',
            setor: doc.area,
            status: 'Em Revisão',
            conteudo: `1. CABEÇALHO INSTITUCIONAL: ${doc.documento} | Código: ${doc.codigo} | Tipo: ${doc.tipoDocumento} | Área: ${doc.area} | Prazo Limite SLA: 24 Horas.\n\n2. RESPONSABILIDADES: Responsável Técnico: ${doc.responsavel || 'Coordenador da Qualidade'} | Revisor: Coordenador / RT | Aprovador: Diretoria da Qualidade.\n\n3. OBJETIVO E DESCRIÇÃO:\n${doc.descricao}\n\n4. RASTREABILIDADE E CONFORMIDADE:\nAtende aos requisitos da acreditação ONA (Níveis 1, 2 e 3), gestão de riscos e segurança do paciente.`,
            autor: doc.responsavel || 'Coordenador da Qualidade',
            aprovador: 'Coordenador / RT (Responsável Técnico)'
          };

          const created = await this.repo.create(tenantId, popObj);
          
          await this.repo.createVersao(created.id!, created.versao, created.conteudo, created.autor);

          await this.repo.createNotificacao(
            created.id!,
            created.titulo,
            'revisor.rt@redeverse.com',
            'Coordenador / RT (Responsável Técnico)',
            'Notificação de Revisão Técnica Obrigatória (SLA 24 Horas). Ação imediata requerida.',
            24
          );

          await this.repo.createNotificacao(
            created.id!,
            created.titulo,
            'aprovador.diretoria@redeverse.com',
            'Diretoria ONA',
            'Notificação de Aprovação Institucional (SLA 24 Horas). Aguardando validação final.',
            24
          );

          await this.repo.createNotificacao(
            created.id!,
            created.titulo,
            'equipe.direta@redeverse.com',
            'Responsáveis Diretos',
            'Alerta de Novo Procedimento / Protocolo para ciência e cumprimento imediato.',
            24
          );

          count++;
        }
      }
      await client.query('COMMIT');
      return count;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // LOOKUP CONFIGS FORWARDERS
  // ----------------------------------------
  async listTypes() { return await this.repo.listTypes(); }
  async createType(nome: string, categoria: string, descricao: string, workflowId: number | null, templateId: number | null) {
    return await this.repo.createType(nome, categoria, descricao, workflowId, templateId);
  }
  async updateType(id: number, nome: string, categoria: string, descricao: string, workflowId: number | null, templateId: number | null) {
    return await this.repo.updateType(id, nome, categoria, descricao, workflowId, templateId);
  }
  async deactivateType(id: number) { return await this.repo.deactivateType(id); }

  async listCategories() { return await this.repo.listCategories(); }
  async createCategory(nome: string, setorAlvo: string, subcategoriasJson: any[]) {
    return await this.repo.createCategory(nome, setorAlvo, subcategoriasJson);
  }

  async listWorkflows() { return await this.repo.listWorkflows(); }
  async createWorkflow(nome: string, descricao: string, etapasJson: string[], slaHorasPadrao: number) {
    return await this.repo.createWorkflow(nome, descricao, etapasJson, slaHorasPadrao);
  }

  async listTemplates() { return await this.repo.listTemplates(); }
  async createTemplate(nome: string, tipoDocumental: string, conteudoRichText: string, placeholdersJson: string[]) {
    return await this.repo.createTemplate(nome, tipoDocumental, conteudoRichText, placeholdersJson);
  }

  async listForms() { return await this.repo.listForms(); }
  async createForm(nome: string, tipoDocumental: string, setor: string, campos: any[]) {
    return await this.repo.createForm(nome, tipoDocumental, setor, campos);
  }

  async listSlas(tenantId: string) { return await this.repo.listSlas(tenantId); }

  async searchPops(tenantId: string, query?: string, setor?: string) {
    return await this.repo.searchPops(tenantId, query, setor);
  }
}
