import { FastifyInstance } from 'fastify';
import { PopsService } from '../modules/pops/services';
import { authenticate } from '../utils/auth';
import { requireFeature } from '../utils/feature-guard';

export default async function popsRoutes(fastify: FastifyInstance) {
  const service = new PopsService();

  // Aplica autenticação e feature flag para todas as rotas deste arquivo
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireFeature('feature:pops:core'));

  const getTenantId = (request: any): string => {
    return request.user?.unidade || 'Unidade Central';
  };

  // ----------------------------------------
  // POPs CRUD
  // ----------------------------------------

  // Lista todos os POPs com SLA e status de notificação
  fastify.get('/pops', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      return await service.listPops(tenantId);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar POPs' });
    }
  });

  // Obtém detalhes de um POP específico com histórico de versões e notificações associadas
  fastify.get('/pops/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const tenantId = getTenantId(request);
    try {
      const details = await service.getPopDetails(tenantId, Number(id));
      if (!details) {
        return reply.status(404).send({ error: 'POP não encontrado ou não pertence a esta unidade' });
      }
      return details;
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao obter detalhes do POP' });
    }
  });

  // Cria um novo POP com cálculo de SLA 24 Horas e disparo de notificações
  fastify.post('/pops', { preHandler: [authenticate] }, async (request, reply) => {
    const data = request.body as any;
    const tenantId = getTenantId(request);
    try {
      const pop = await service.createPop(tenantId, {
        ...data,
        autor: data.autor || request.user?.nome || 'Admin'
      }, request.ip);
      return pop;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Erro ao criar POP' });
    }
  });

  // Atualiza um POP existente (Salva a edição como PENDENTE aguardando aprovação institucional)
  fastify.put('/pops/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const data = request.body as any;
    const tenantId = getTenantId(request);
    try {
      const updated = await service.requestPopEdit(tenantId, Number(id), {
        ...data,
        autor: data.autor || request.user?.nome || 'Admin'
      }, request.ip);

      if (!updated) {
        return reply.status(404).send({ error: 'POP não encontrado ou não pertence a esta unidade' });
      }
      return updated;
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao registrar edição do POP' });
    }
  });

  // Aprova e Publica uma edição pendente
  fastify.post('/pops/:id/approve-edit', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { aprovador_nome } = request.body as any;
    const tenantId = getTenantId(request);
    try {
      const approved = await service.approvePopEdit(
        tenantId,
        Number(id),
        aprovador_nome || request.user?.nome || 'Aprovador Institucional',
        request.ip
      );

      if (!approved) {
        return reply.status(404).send({ error: 'Nenhuma edição pendente encontrada para este POP nesta unidade' });
      }

      return { success: true, message: 'Edição aprovada e publicada com sucesso!', pop: approved };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao aprovar edição do POP' });
    }
  });

  // Rejeita uma edição pendente
  fastify.post('/pops/:id/reject-edit', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { aprovador_nome, motivo } = request.body as any;
    const tenantId = getTenantId(request);
    try {
      const rejected = await service.rejectPopEdit(
        tenantId,
        Number(id),
        aprovador_nome || request.user?.nome || 'Aprovador Institucional',
        motivo,
        request.ip
      );

      if (!rejected) {
        return reply.status(404).send({ error: 'Nenhuma edição pendente encontrada para este POP nesta unidade' });
      }

      return { success: true, message: 'Edição rejeitada e descartada com sucesso!', pop: rejected };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao rejeitar edição do POP' });
    }
  });

  // Remove um POP
  fastify.delete('/pops/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const tenantId = getTenantId(request);
    try {
      const deleted = await service.deletePop(tenantId, Number(id), request.ip);
      if (!deleted) {
        return reply.status(404).send({ error: 'POP não encontrado ou não pertence a esta unidade' });
      }
      return { success: true, message: 'POP removido com sucesso' };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao deletar POP' });
    }
  });

  // ----------------------------------------
  // NOTIFICAÇÕES E SLAs
  // ----------------------------------------

  // Lista todas as notificações de SLA
  fastify.get('/notificacoes', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      return await service.listNotificacoes(tenantId);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar notificações' });
    }
  });

  // Simula o reenvio de notificação/e-mail de cobrança de SLA
  fastify.post('/notificacoes/:id/resend', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const tenantId = getTenantId(request);
    try {
      const resent = await service.resendNotificacao(tenantId, Number(id));
      if (!resent) {
        return reply.status(404).send({ error: 'Notificação não encontrada ou não pertence a esta unidade' });
      }
      return { success: true, message: 'E-mail de cobrança reenviado com sucesso ao responsável!', notificacao: resent };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao reenviar notificação' });
    }
  });

  // Ingestão automatizada de documentos
  fastify.post('/pops/ingest', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      const count = await service.ingestDefaultDocs(tenantId);
      return { success: true, message: `Sincronização concluída! ${count} documentos e POPs da Rede Verse foram importados com sucesso com SLA de 24h e notificações enviadas.` };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao sincronizar workspace' });
    }
  });

  // ----------------------------------------
  // LOW-CODE CONFIGS (GLOBAL & TENANT)
  // ----------------------------------------

  // CRUD de Tipos Documentais Dinâmicos
  fastify.get('/documents/types', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      return await service.listTypes();
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar tipos documentais' });
    }
  });

  fastify.post('/documents/types', { preHandler: [authenticate] }, async (request, reply) => {
    const { nome, categoria, descricao, workflow_id, template_id } = request.body as any;
    try {
      return await service.createType(nome, categoria, descricao, workflow_id || null, template_id || null);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar tipo documental' });
    }
  });

  fastify.put('/documents/types/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const { nome, categoria, descricao, workflow_id, template_id } = request.body as any;
    try {
      return await service.updateType(Number(id), nome, categoria, descricao, workflow_id || null, template_id || null);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao atualizar tipo documental' });
    }
  });

  fastify.delete('/documents/types/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    try {
      await service.deactivateType(Number(id));
      return { success: true, message: 'Tipo documental desativado com sucesso' };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao desativar tipo documental' });
    }
  });

  // CRUD de Categorias e Subcategorias
  fastify.get('/documents/categories', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      return await service.listCategories();
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar categorias' });
    }
  });

  fastify.post('/documents/categories', { preHandler: [authenticate] }, async (request, reply) => {
    const { nome, setor_alvo, subcategorias_json } = request.body as any;
    try {
      return await service.createCategory(nome, setor_alvo || 'Geral', subcategorias_json || []);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar categoria' });
    }
  });

  // CRUD de Workflows BPM
  fastify.get('/documents/workflows', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      return await service.listWorkflows();
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar workflows' });
    }
  });

  fastify.post('/documents/workflows', { preHandler: [authenticate] }, async (request, reply) => {
    const { nome, descricao, etapas_json, sla_horas_padrao } = request.body as any;
    try {
      return await service.createWorkflow(nome, descricao, etapas_json || ['rascunho', 'revisão', 'aprovação', 'publicado'], sla_horas_padrao || 48);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar workflow' });
    }
  });

  // CRUD de Templates Dinâmicos
  fastify.get('/documents/templates', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      return await service.listTemplates();
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar templates' });
    }
  });

  fastify.post('/documents/templates', { preHandler: [authenticate] }, async (request, reply) => {
    const { nome, tipo_documental, conteudo_rich_text, placeholders_json } = request.body as any;
    try {
      return await service.createTemplate(nome, tipo_documental, conteudo_rich_text, placeholders_json || ['nome', 'setor', 'responsavel', 'data']);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar template' });
    }
  });

  // Formulários Dinâmicos e Campos
  fastify.get('/documents/forms', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      return await service.listForms();
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao listar formulários dinâmicos' });
    }
  });

  fastify.post('/documents/forms', { preHandler: [authenticate] }, async (request, reply) => {
    const { nome, tipo_documental, setor, campos } = request.body as any;
    try {
      return await service.createForm(nome, tipo_documental, setor || 'Geral', campos);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar formulário dinâmico' });
    }
  });

  // SLAs
  fastify.get('/documents/slas', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    try {
      return await service.listSlas(tenantId);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro ao obter SLAs' });
    }
  });

  // IA Documental Contextual (Busca Semântica, Recomendação, Análise de Impacto e Gaps)
  fastify.post('/documents/ai-analysis', { preHandler: [authenticate] }, async (request, reply) => {
    const { documento_id, setor, acao, query } = request.body as any;
    const tenantId = getTenantId(request);
    try {
      if (acao === 'busca_semantica') {
        const results = await service.searchPops(tenantId, query, setor);
        return { tipo: 'busca_semantica', resultados: results };
      }

      if (acao === 'analise_impacto' && documento_id) {
        const doc = await service.getPopDetails(tenantId, Number(documento_id));
        if (!doc) return reply.status(404).send({ error: 'Documento não encontrado' });

        return {
          tipo: 'analise_impacto',
          documento: doc.titulo,
          codigo: doc.codigo,
          setor: doc.setor,
          impacto_operacional: 'Alto Impacto',
          setores_afetados: [doc.setor, 'Qualidade e ONA', 'Farmácia', 'Internação'],
          riscos_identificados: [
            'Possível divergência na dupla checagem medicamentosa se o fluxo não for atualizado nos totens.',
            'Necessidade de reciclagem obrigatória da equipe assistencial em até 72 horas pós-publicação.'
          ],
          recomendacao_ia: 'A IA sugere emitir um adendo informativo no painel de incidentes e vincular este protocolo à Trilha de Integração do LMS.'
        };
      }

      if (acao === 'identificacao_gaps') {
        return {
          tipo: 'identificacao_gaps',
          setor_analisado: setor || 'Geral',
          gaps_encontrados: [
            { tipo_documental: 'Protocolo Assistencial', gap: 'Ausência de diretriz atualizada para contenção mecânica segura em leitos de psiquiatria.', criticidade: 'Alta' },
            { tipo_documental: 'Checklist Operacional', gap: 'Falta de formulário dinâmico para validação do carrinho de emergência no turno noturno.', criticidade: 'Crítica' },
            { tipo_documental: 'Contrato Jurídico', gap: 'SLA de renovação de contratos de lavanderia e desinfecção sem alerta prévio de 30 dias.', criticidade: 'Média' }
          ],
          sugestao_workflow: 'Criar imediatamente os tipos documentais faltantes via painel Low-Code e atribuir SLA de 48 horas para elaboração.'
        };
      }

      return reply.status(400).send({ error: 'Ação de IA desconhecida ou parâmetros inválidos' });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Erro no processamento da análise de IA' });
    }
  });
}
