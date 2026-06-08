import { FastifyInstance } from 'fastify';
import pool from '../db';
import { authenticate } from '../utils/auth';
import { tenantLicenseManager } from '../utils/feature-guard';

export default async function palRoutes(fastify: FastifyInstance) {
  const getTenantId = (request: any): string => {
    return request.user?.unidade || 'Unidade Central';
  };

  // 1. Obter Feature Flags ativas para o tenant
  fastify.get('/pal/feature-flags', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const license = await tenantLicenseManager.getTenantLicense(tenantId);
    return license;
  });

  // 2. Listar planos disponíveis
  fastify.get('/pal/planos', { preHandler: [authenticate] }, async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM pal_planos ORDER BY preco_mensal ASC');
      return res.rows;
    } finally {
      client.release();
    }
  });

  // 3. Obter assinatura ativa do tenant
  fastify.get('/pal/assinaturas', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT a.*, p.nome as plano_nome, p.preco_mensal, p.features_ativas, p.cota_documentos, p.cota_usuarios
        FROM pal_assinaturas a
        JOIN pal_planos p ON a.plano_id = p.id
        WHERE a.tenant_id = $1
      `, [tenantId]);

      if (res.rows.length === 0) {
        // Fallback Premium virtual para Unidade Central ou se não existir registro
        return {
          tenant_id: tenantId,
          status: 'ACTIVE',
          plano_nome: 'Premium (Default)',
          preco_mensal: 0,
          cota_documentos: 10000,
          cota_usuarios: 100
        };
      }
      return res.rows[0];
    } finally {
      client.release();
    }
  });

  // 4. Alterar/Upgrade de assinatura no Marketplace
  fastify.post('/pal/assinaturas/upgrade', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { plano_id } = request.body as any;
    
    if (!plano_id) {
      return reply.status(400).send({ error: 'ID do plano é obrigatório.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verifica se o plano existe
      const planCheck = await client.query('SELECT nome FROM pal_planos WHERE id = $1', [plano_id]);
      if (planCheck.rows.length === 0) {
        throw new Error('Plano não encontrado.');
      }

      // Upsert assinatura
      const subRes = await client.query(`
        INSERT INTO pal_assinaturas (tenant_id, plano_id, status)
        VALUES ($1, $2, 'ACTIVE')
        ON CONFLICT (tenant_id)
        DO UPDATE SET plano_id = EXCLUDED.plano_id, status = 'ACTIVE', data_inicio = CURRENT_TIMESTAMP
        RETURNING *;
      `, [tenantId, plano_id]);

      // Registrar auditoria
      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'PAL_SUBSCRIPTION_UPGRADE', 'SUBSCRIPTION', $2, $3)
      `, [request.user?.email || 'Admin', subRes.rows[0].id.toString(), request.ip]);

      await client.query('COMMIT');
      
      // Invalida o cache in-memory do feature flags manager
      tenantLicenseManager.invalidateCache(tenantId);

      return { success: true, message: `Plano atualizado para ${planCheck.rows[0].nome} com sucesso!`, assinatura: subRes.rows[0] };
    } catch (err: any) {
      await client.query('ROLLBACK');
      return reply.status(400).send({ error: err.message || 'Erro ao realizar upgrade de plano.' });
    } finally {
      client.release();
    }
  });

  // 5. Listar faturas do tenant
  fastify.get('/pal/faturas', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM pal_faturas WHERE tenant_id = $1 ORDER BY id DESC', [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  });

  // 6. Pagar fatura (simulado)
  fastify.post('/pal/faturas/:id/pagar', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const tenantId = getTenantId(request);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const faturaCheck = await client.query('SELECT * FROM pal_faturas WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
      if (faturaCheck.rows.length === 0) {
        throw new Error('Fatura não encontrada.');
      }

      await client.query(`
        UPDATE pal_faturas 
        SET status = 'PAID', data_pagamento = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [id]);

      // Reativar assinatura se estiver suspensa e todas as faturas estiverem pagas
      const overdueCheck = await client.query(`
        SELECT COUNT(*) FROM pal_faturas 
        WHERE tenant_id = $1 AND status = 'PENDING' AND data_vencimento < CURRENT_TIMESTAMP - INTERVAL '5 days'
      `, [tenantId]);

      if (parseInt(overdueCheck.rows[0].count) === 0) {
        await client.query(`
          UPDATE pal_assinaturas 
          SET status = 'ACTIVE' 
          WHERE tenant_id = $1 AND status = 'SUSPENDED'
        `, [tenantId]);
      }

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'PAL_INVOICE_PAID', 'INVOICES', $2, $3)
      `, [request.user?.email || 'Admin', id.toString(), request.ip]);

      await client.query('COMMIT');
      tenantLicenseManager.invalidateCache(tenantId);

      return { success: true, message: 'Fatura paga com sucesso!' };
    } catch (err: any) {
      await client.query('ROLLBACK');
      return reply.status(400).send({ error: err.message || 'Erro ao pagar fatura.' });
    } finally {
      client.release();
    }
  });

  // 7. Obter métricas de uso (cotas)
  fastify.get('/pal/uso', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const client = await pool.connect();
    try {
      // Retornar as cotas em vigor
      const planRes = await client.query(`
        SELECT p.cota_documentos, p.cota_usuarios
        FROM pal_assinaturas a
        JOIN pal_planos p ON a.plano_id = p.id
        WHERE a.tenant_id = $1
      `, [tenantId]);

      const cota_docs = planRes.rows[0]?.cota_documentos ?? 10000;
      const cota_users = planRes.rows[0]?.cota_usuarios ?? 100;

      // Buscar os usos atuais salvos
      const usoRes = await client.query('SELECT recurso, quantidade FROM pal_uso WHERE tenant_id = $1', [tenantId]);
      
      const uso = {
        documentos: 0,
        usuarios: 0
      };

      for (const r of usoRes.rows) {
        if (r.recurso === 'documentos') uso.documentos = r.quantidade;
        if (r.recurso === 'usuarios') uso.usuarios = r.quantidade;
      }

      return {
        cotas: {
          documentos: cota_docs,
          usuarios: cota_users
        },
        uso
      };
    } finally {
      client.release();
    }
  });

  // 8. Ativar Trial de 14 dias para um módulo específico
  fastify.post('/pal/marketplace/trial', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { modulo } = request.body as any;

    if (!modulo) {
      return reply.status(400).send({ error: 'Código do módulo é obrigatório.' });
    }

    const client = await pool.connect();
    try {
      // Verificar se o trial já foi utilizado historicamente para este módulo
      const checkTrial = await client.query(`
        SELECT id FROM pal_trial_modulos 
        WHERE tenant_id = $1 AND modulo = $2
      `, [tenantId, modulo]);

      if (checkTrial.rows.length > 0) {
        return reply.status(400).send({ error: 'Você já utilizou o período de testes (trial) para este módulo anteriormente.' });
      }

      await client.query(`
        INSERT INTO pal_trial_modulos (tenant_id, modulo, data_expiracao)
        VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '14 days');
      `, [tenantId, modulo]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip, tenant_id)
        VALUES ($1, 'PAL_TRIAL_ACTIVATED', 'MARKETPLACE', $2, $3, $4)
      `, [request.user?.email || 'Admin', modulo, request.ip, tenantId]);

      tenantLicenseManager.invalidateCache(tenantId);
      return { success: true, message: `Trial de 14 dias do módulo "${modulo}" ativado com sucesso!` };
    } finally {
      client.release();
    }
  });

  // 9. Registrar solicitação comercial de ativação de módulo
  fastify.post('/pal/marketplace/solicitar', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { modulo } = request.body as any;

    if (!modulo) {
      return reply.status(400).send({ error: 'Código do módulo é obrigatório.' });
    }

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO pal_solicitacoes_modulo (tenant_id, modulo, status)
        VALUES ($1, $2, 'PENDENTE')
        ON CONFLICT DO NOTHING;
      `, [tenantId, modulo]);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'PAL_ACTIVATION_REQUESTED', 'MARKETPLACE', $2, $3)
      `, [request.user?.email || 'Admin', modulo, request.ip]);

      return { success: true, message: `Solicitação de ativação comercial do módulo "${modulo}" registrada. Entraremos em contato em breve!` };
    } finally {
      client.release();
    }
  });

  // 10. Listar todos os módulos e seus status comerciais/trials
  fastify.get('/pal/marketplace/modulos', { preHandler: [authenticate] }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const client = await pool.connect();
    try {
      // 1. Obter assinatura/plano ativo do tenant
      const planRes = await client.query(`
        SELECT p.features_ativas
        FROM pal_assinaturas a
        JOIN pal_planos p ON a.plano_id = p.id
        WHERE a.tenant_id = $1
      `, [tenantId]);

      const activeFeatures = planRes.rows[0]?.features_ativas || [];

      // 2. Obter trials ativos do tenant
      const trialsRes = await client.query(`
        SELECT modulo, data_expiracao FROM pal_trial_modulos
        WHERE tenant_id = $1 AND data_expiracao > CURRENT_TIMESTAMP
      `, [tenantId]);
      
      const trialsMap = new Map<string, string>();
      for (const t of trialsRes.rows) {
        trialsMap.set(t.modulo, t.data_expiracao);
      }

      // 3. Obter solicitações comerciais ativas
      const solicitacoesRes = await client.query(`
        SELECT modulo, status FROM pal_solicitacoes_modulo
        WHERE tenant_id = $1
      `, [tenantId]);

      const solicitacoesMap = new Map<string, string>();
      for (const s of solicitacoesRes.rows) {
        solicitacoesMap.set(s.modulo, s.status);
      }

      // 4. Mapeamento estático dos módulos do catálogo
      const modulosCatalogo = [
        { id: 'pops', nome: 'Gestão de POPs', feature: 'feature:pops:core', descricao: 'Ciclo de vida e versionamento linear de Procedimentos Operacionais Padrão.' },
        { id: 'bpm', nome: 'Fluxos e BPM', feature: 'feature:bpm:core', descricao: 'Desenho gráfico e execução ativa de fluxogramas assistenciais e SLAs.' },
        { id: 'ona', nome: 'Painel ONA & Compliance', feature: 'feature:ona:core', descricao: 'Acompanhamento de requisitos, checklists de auditoria e evidências da acreditação.' },
        { id: 'users', nome: 'Usuários & Organograma', feature: 'feature:omoc:core', descricao: 'Estruturação hierárquica, reportes diretos/matriciais e controle de férias.' },
        { id: 'indicators', nome: 'Indicadores e Metas', feature: 'feature:okr:core', descricao: 'Gerenciamento estratégico de OKRs corporativos e coleta de KPIs de desempenho.' },
        { id: 'incidents', nome: 'Incidentes & CAPA', feature: 'feature:riscos:core', descricao: 'Reporte de não conformidades, barreiras de segurança e tratamento corretivo CAPA.' },
        { id: 'ai', nome: 'Assistente de IA', feature: 'feature:ai:ishikawa', descricao: 'Investigação inteligente de causa-raiz por Ishikawa e triagem automatizada.' },
        { id: 'fhir', nome: 'Conector FHIR', feature: 'feature:fhir:core', descricao: 'Integração de prontuários eletrônicos e interoperabilidade de saúde.' }
      ];

      const result = modulosCatalogo.map(m => {
        let status = 'INACTIVE';
        let trialExpiracao: string | null = null;
        let solicitacaoStatus: string | null = null;

        // Se está incluso nas features do plano principal
        if (activeFeatures.includes(m.feature)) {
          status = 'ACTIVE';
        } else if (trialsMap.has(m.id)) {
          status = 'TRIAL';
          trialExpiracao = trialsMap.get(m.id)!;
        }

        if (solicitacoesMap.has(m.id)) {
          solicitacaoStatus = solicitacoesMap.get(m.id)!;
        }

        return {
          id: m.id,
          nome: m.nome,
          descricao: m.descricao,
          feature: m.feature,
          status,
          trialExpiracao,
          solicitacaoStatus
        };
      });

      return result;
    } finally {
      client.release();
    }
  });
}
