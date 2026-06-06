import { PopsRepository } from '../repositories/pops.repository';
import { TODOS_DOCUMENTOS_69 } from '../../core/documentosData';

export class PopsService {
  private repo: PopsRepository;

  constructor() {
    this.repo = new PopsRepository();
  }

  async getAllPops() {
    return await this.repo.findAllPops();
  }

  async getPopById(id: number) {
    const pop = await this.repo.findPopById(id);
    if (!pop) throw new Error('POP não encontrado');

    const versoes = await this.repo.getPopVersions(id);
    const notificacoes = await this.repo.getPopNotifications(id);

    return { ...pop, historico_versoes: versoes, notificacoes };
  }

  async createPop(data: any, authUser: any, ip: string) {
    const autor = authUser?.nome || authUser?.email || 'Admin';
    const qrcode = `QR_QUALITA_${data.codigo}`;

    // Fallback manual de transaction handling, pois Notification e POP são transacionais juntos no legado
    const pool = this.repo.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const resPop = await client.query(`
        INSERT INTO pops (titulo, codigo, versao, setor, status, conteudo, autor, aprovador, qrcode, data_limite, notificacao_enviada)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '24 hours', TRUE)
        RETURNING *;
      `, [data.titulo, data.codigo, data.versao || '1.0', data.setor, data.status || 'Em Revisão', data.conteudo, autor, data.aprovador || 'Coordenador / RT (Responsável Técnico)', qrcode]);
      const novoPop = resPop.rows[0];

      await client.query(`
        INSERT INTO pop_versoes (pop_id, versao, conteudo, autor)
        VALUES ($1, $2, $3, $4)
      `, [novoPop.id, novoPop.versao, novoPop.conteudo, novoPop.autor]);

      await client.query(`
        INSERT INTO notificacoes (pop_id, pop_titulo, destinatario_email, destinatario_papel, mensagem, prazo_horas, data_limite, status)
        VALUES
        ($1, $2, 'revisor.rt@redeverse.com', 'Coordenador / RT (Responsável Técnico)', 'Notificação de Revisão Técnica Obrigatória (SLA 24 Horas). Ação imediata requerida.', 24, NOW() + INTERVAL '24 hours', 'Pendente'),
        ($1, $2, 'aprovador.diretoria@redeverse.com', 'Diretoria ONA', 'Notificação de Aprovação Institucional (SLA 24 Horas). Aguardando validação final.', 24, NOW() + INTERVAL '24 hours', 'Pendente'),
        ($1, $2, 'equipe.direta@redeverse.com', 'Responsáveis Diretos', 'Alerta de Novo Procedimento / Protocolo para ciência e cumprimento imediato.', 24, NOW() + INTERVAL '24 hours', 'Pendente');
      `, [novoPop.id, novoPop.titulo]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'POP_CREATE_WITH_SLA', 'POPs', $2, $3)
      `, [autor, data.codigo, ip]);

      await client.query('COMMIT');
      return novoPop;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updatePop(id: number, data: any, authUser: any, ip: string) {
    this.checkPermission(authUser);

    data.autor = authUser?.nome || authUser?.email || 'Admin';
    const popAtualizado = await this.repo.updatePopPending(id, data);

    if (!popAtualizado) throw new Error('POP não encontrado');

    await this.repo.createNotifications(id, popAtualizado.titulo, [
      { email: 'revisor.rt@redeverse.com', role: 'Coordenador / RT (Responsável Técnico)', message: 'Edição de POP/Protocolo solicitada. Revisão Técnica Obrigatória (SLA 24 Horas).', sla: 24, status: 'Pendente' },
      { email: 'aprovador.diretoria@redeverse.com', role: 'Diretoria ONA', message: 'Edição de POP/Protocolo solicitada. Aguardando Validação e Aprovação para publicação (SLA 24 Horas).', sla: 24, status: 'Pendente' }
    ]);
    await this.repo.logAudit(data.autor, 'POP_EDIT_REQUESTED', 'POPs', popAtualizado.codigo, ip);
    return popAtualizado;
  }

  async approveEdit(id: number, aprovadorNome: string, ip: string) {
    const pop = await this.repo.approvePopEdit(id);
    if (!pop) throw new Error('Nenhuma edição pendente encontrada para este POP');

    await this.repo.savePopVersion(pop.id, pop.versao, pop.conteudo, aprovadorNome);

    await this.repo.createNotifications(pop.id, pop.titulo, [
      { email: 'autor.elaborador@redeverse.com', role: 'Elaborador / Autor', message: 'Sua edição do POP/Protocolo foi APROVADA e publicada oficialmente na instituição.', sla: 24, status: 'Enviado' }
    ]);
    await this.repo.logAudit(aprovadorNome, 'POP_EDIT_APPROVED', 'POPs', pop.codigo, ip);
    return pop;
  }

  async rejectEdit(id: number, aprovadorNome: string, motivo: string, ip: string) {
    const pop = await this.repo.rejectPopEdit(id);
    if (!pop) throw new Error('Nenhuma edição pendente encontrada para este POP');

    await this.repo.createNotifications(pop.id, pop.titulo, [
      { email: 'autor.elaborador@redeverse.com', role: 'Elaborador / Autor', message: `Sua edição do POP/Protocolo foi REJEITADA. Motivo: ${motivo || 'Não conformidade com padrões ONA'}`, sla: 24, status: 'Enviado' }
    ]);
    await this.repo.logAudit(aprovadorNome, 'POP_EDIT_REJECTED', 'POPs', pop.codigo, ip);
    return pop;
  }

  async deletePop(id: number, authUser: any, ip: string) {
    this.checkPermission(authUser);
    const pop = await this.repo.findPopById(id);
    if (!pop) throw new Error('POP não encontrado');

    await this.repo.deletePop(id);
    await this.repo.logAudit(authUser.nome || authUser.email, 'POP_DELETE', 'POPs', pop.codigo, ip);
  }

  async ingestBulkWorkspace() {
    const pool = this.repo.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let count = 0;
      for (const doc of TODOS_DOCUMENTOS_69) {
        const checkExist = await client.query('SELECT id FROM pops WHERE codigo = $1', [doc.codigo]);
        if (checkExist.rows.length === 0) {
          const resIns = await client.query(`
            INSERT INTO pops (titulo, codigo, versao, setor, status, conteudo, autor, aprovador, qrcode, data_limite, notificacao_enviada)
            VALUES ($1, $2, '1.0', $3, 'Em Revisão', $4, $5, $6, $7, NOW() + INTERVAL '24 hours', TRUE)
            RETURNING id, titulo;
          `, [
            doc.documento,
            doc.codigo,
            doc.area,
            `1. CABEÇALHO INSTITUCIONAL: ${doc.documento} | Código: ${doc.codigo} | Tipo: ${doc.tipoDocumento} | Área: ${doc.area} | Prazo Limite SLA: 24 Horas.\n\n2. RESPONSABILIDADES: Responsável Técnico: ${doc.responsavel || 'Coordenador da Qualidade'} | Revisor: Coordenador / RT | Aprovador: Diretoria da Qualidade.\n\n3. OBJETIVO E DESCRIÇÃO:\n${doc.descricao}\n\n4. RASTREABILIDADE E CONFORMIDADE:\nAtende aos requisitos da acreditação ONA (Níveis 1, 2 e 3), gestão de riscos e segurança do paciente.`,
            doc.responsavel || 'Coordenador da Qualidade',
            'Coordenador / RT (Responsável Técnico)',
            `QR_VERSE_${doc.codigo}`
          ]);
          const newId = resIns.rows[0].id;
          await client.query(`
            INSERT INTO notificacoes (pop_id, pop_titulo, destinatario_email, destinatario_papel, mensagem, prazo_horas, data_limite, status)
            VALUES
            ($1, $2, 'revisor.rt@redeverse.com', 'Coordenador / RT (Responsável Técnico)', 'Notificação de Revisão Técnica Obrigatória (SLA 24 Horas). Ação imediata requerida.', 24, NOW() + INTERVAL '24 hours', 'Pendente'),
            ($1, $2, 'aprovador.diretoria@redeverse.com', 'Diretoria ONA', 'Notificação de Aprovação Institucional (SLA 24 Horas). Aguardando validação final.', 24, NOW() + INTERVAL '24 hours', 'Pendente'),
            ($1, $2, 'equipe.direta@redeverse.com', 'Responsáveis Diretos', 'Alerta de Novo Procedimento / Protocolo para ciência e cumprimento imediato.', 24, NOW() + INTERVAL '24 hours', 'Pendente');
          `, [newId, doc.documento]);
          count++;
        }
      }
      await client.query('COMMIT');
      return count;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // Notificações e SLAs
  async getNotifications() { return await this.repo.getAllNotifications(); }
  async resendNotification(id: number) {
    const n = await this.repo.resendNotification(id);
    if (!n) throw new Error('Notificação não encontrada');
    return n;
  }
  async processSlas() { return await this.repo.processSlas(); }

  // Low-Code
  async getDocTypes() { return await this.repo.getDocumentTypes(); }
  async createDocType(data: any) { return await this.repo.createDocumentType(data); }
  async updateDocType(id: number, data: any) { return await this.repo.updateDocumentType(id, data); }
  async deleteDocType(id: number) { return await this.repo.deleteDocumentType(id); }

  async getCategories() { return await this.repo.getCategories(); }
  async createCategory(data: any) { return await this.repo.createCategory(data); }

  async getWorkflows() { return await this.repo.getWorkflows(); }
  async createWorkflow(data: any) { return await this.repo.createWorkflow(data); }

  async getTemplates() { return await this.repo.getTemplates(); }
  async createTemplate(data: any) { return await this.repo.createTemplate(data); }

  async getForms() { return await this.repo.getForms(); }
  async createForm(data: any) { return await this.repo.createForm(data); }

  async runAiAnalysis(docId: number, setor: string, acao: string, query: string) {
    if (acao === 'busca_semantica') {
      const pool = this.repo.getPool();
      let queryStr = 'SELECT id, titulo, codigo, setor, status, conteudo FROM pops WHERE 1=1';
      const params: any[] = [];
      let paramIdx = 1;
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
      const res = await pool.query(queryStr, params);
      return { tipo: 'busca_semantica', resultados: res.rows };
    }
    if (acao === 'analise_impacto' && docId) {
      const doc = await this.repo.findPopById(docId);
      if (!doc) throw new Error('Documento não encontrado');
      return {
        tipo: 'analise_impacto', documento: doc.titulo, codigo: doc.codigo, setor: doc.setor,
        impacto_operacional: 'Alto Impacto',
        setores_afetados: [doc.setor, 'Qualidade e ONA', 'Farmácia', 'Internação'],
        riscos_identificados: ['Possível divergência na dupla checagem medicamentosa se o fluxo não for atualizado nos totens.', 'Necessidade de reciclagem obrigatória da equipe assistencial em até 72 horas pós-publicação.'],
        recomendacao_ia: 'A IA sugere emitir um adendo informativo no painel de incidentes e vincular este protocolo à Trilha de Integração do LMS.'
      };
    }
    if (acao === 'identificacao_gaps') {
      return {
        tipo: 'identificacao_gaps', setor_analisado: setor || 'Geral',
        gaps_encontrados: [
          { tipo_documental: 'Protocolo Assistencial', gap: 'Ausência de diretriz atualizada para contenção mecânica segura em leitos de psiquiatria.', criticidade: 'Alta' },
          { tipo_documental: 'Checklist Operacional', gap: 'Falta de formulário dinâmico para validação do carrinho de emergência no turno noturno.', criticidade: 'Crítica' },
          { tipo_documental: 'Contrato Jurídico', gap: 'SLA de renovação de contratos de lavanderia e desinfecção sem alerta prévio de 30 dias.', criticidade: 'Média' }
        ],
        sugestao_workflow: 'Criar imediatamente os tipos documentais faltantes via painel Low-Code e atribuir SLA de 48 horas para elaboração.'
      };
    }
    throw new Error('Ação de IA desconhecida ou parâmetros inválidos');
  }

  private checkPermission(authUser: any) {
    if (authUser.role !== 'Admin' && authUser.role !== 'Gestor da Qualidade') {
      throw new Error('Proibido. Permissões insuficientes.');
    }
  }
}
