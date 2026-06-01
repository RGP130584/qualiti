"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = popsRoutes;
const db_1 = __importDefault(require("../db"));
const documentosData_1 = require("../modules/core/documentosData");
async function popsRoutes(fastify) {
    // Lista todos os POPs com SLA e status de notificação
    fastify.get('/pops', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT id, titulo, codigo, versao, setor, status, autor, aprovador, data_criacao, data_revisao, data_limite, notificacao_enviada FROM pops ORDER BY id DESC');
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    // Obtém detalhes de um POP específico com histórico de versões e notificações associadas
    fastify.get('/pops/:id', async (request, reply) => {
        const { id } = request.params;
        const client = await db_1.default.connect();
        try {
            const resPop = await client.query('SELECT * FROM pops WHERE id = $1', [id]);
            if (resPop.rows.length === 0) {
                return reply.status(404).send({ error: 'POP não encontrado' });
            }
            const resVersoes = await client.query('SELECT * FROM pop_versoes WHERE pop_id = $1 ORDER BY id DESC', [id]);
            const resNotifs = await client.query('SELECT * FROM notificacoes WHERE pop_id = $1 ORDER BY id DESC', [id]);
            return {
                ...resPop.rows[0],
                historico_versoes: resVersoes.rows,
                notificacoes: resNotifs.rows
            };
        }
        finally {
            client.release();
        }
    });
    // Cria um novo POP com cálculo de SLA 24 Horas e disparo de notificações
    fastify.post('/pops', async (request, reply) => {
        const { titulo, codigo, versao, setor, status, conteudo, autor, aprovador } = request.body;
        const client = await db_1.default.connect();
        try {
            await client.query('BEGIN');
            const qrcode = `QR_QUALITA_${codigo}`;
            const res = await client.query(`
        INSERT INTO pops (titulo, codigo, versao, setor, status, conteudo, autor, aprovador, qrcode, data_limite, notificacao_enviada)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '24 hours', TRUE)
        RETURNING *;
      `, [titulo, codigo, versao || '1.0', setor, status || 'Em Revisão', conteudo, autor || 'Admin', aprovador || 'Coordenador / RT (Responsável Técnico)', qrcode]);
            const novoPop = res.rows[0];
            // Insere na tabela de versões
            await client.query(`
        INSERT INTO pop_versoes (pop_id, versao, conteudo, autor)
        VALUES ($1, $2, $3, $4)
      `, [novoPop.id, novoPop.versao, novoPop.conteudo, novoPop.autor]);
            // Dispara notificações automáticas de SLA 24h para Revisor, Aprovador e Responsáveis Diretos
            await client.query(`
        INSERT INTO notificacoes (pop_id, pop_titulo, destinatario_email, destinatario_papel, mensagem, prazo_horas, data_limite, status)
        VALUES
        ($1, $2, 'revisor.rt@redeverse.com', 'Coordenador / RT (Responsável Técnico)', 'Notificação de Revisão Técnica Obrigatória (SLA 24 Horas). Ação imediata requerida.', 24, NOW() + INTERVAL '24 hours', 'Pendente'),
        ($1, $2, 'aprovador.diretoria@redeverse.com', 'Diretoria ONA', 'Notificação de Aprovação Institucional (SLA 24 Horas). Aguardando validação final.', 24, NOW() + INTERVAL '24 hours', 'Pendente'),
        ($1, $2, 'equipe.direta@redeverse.com', 'Responsáveis Diretos', 'Alerta de Novo Procedimento / Protocolo para ciência e cumprimento imediato.', 24, NOW() + INTERVAL '24 hours', 'Pendente');
      `, [novoPop.id, novoPop.titulo]);
            // Log de auditoria
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'POP_CREATE_WITH_SLA', 'POPs', $2, $3)
      `, [autor || 'Admin', codigo, request.ip]);
            await client.query('COMMIT');
            return novoPop;
        }
        catch (err) {
            await client.query('ROLLBACK');
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao criar POP' });
        }
        finally {
            client.release();
        }
    });
    // Atualiza um POP existente (Salva a edição como PENDENTE aguardando aprovação institucional)
    fastify.put('/pops/:id', {
        onRequest: [async (request, reply) => {
                try {
                    await request.jwtVerify();
                }
                catch (err) {
                    reply.status(401).send({ error: 'Não autorizado' });
                }
            }]
    }, async (request, reply) => {
        const authUser = request.user;
        if (authUser.role !== 'Admin' && authUser.role !== 'Gestor da Qualidade') {
            return reply.status(403).send({ error: 'Proibido. Permissões insuficientes.' });
        }
        const { id } = request.params;
        const { titulo, versao, setor, status, conteudo, autor, aprovador } = request.body;
        const client = await db_1.default.connect();
        try {
            await client.query('BEGIN');
            // Em vez de substituir o conteúdo vigente, armazena nas colunas de edição pendente
            const res = await client.query(`
        UPDATE pops
        SET titulo_pendente = $1, versao_pendente = $2, setor = $3, conteudo_pendente = $5, autor = $6, aprovador = $7, status_edicao = 'Aguardando Aprovação', data_revisao = CURRENT_TIMESTAMP, data_limite = NOW() + INTERVAL '24 hours', notificacao_enviada = TRUE
        WHERE id = $8
        RETURNING *;
      `, [titulo, versao, setor, status, conteudo, autor, aprovador, id]);
            if (res.rows.length === 0) {
                await client.query('ROLLBACK');
                return reply.status(404).send({ error: 'POP não encontrado' });
            }
            const popAtualizado = res.rows[0];
            // Dispara notificações de revisão/aprovação da edição pendente
            await client.query(`
        INSERT INTO notificacoes (pop_id, pop_titulo, destinatario_email, destinatario_papel, mensagem, prazo_horas, data_limite, status)
        VALUES
        ($1, $2, 'revisor.rt@redeverse.com', 'Coordenador / RT (Responsável Técnico)', 'Edição de POP/Protocolo solicitada. Revisão Técnica Obrigatória (SLA 24 Horas).', 24, NOW() + INTERVAL '24 hours', 'Pendente'),
        ($1, $2, 'aprovador.diretoria@redeverse.com', 'Diretoria ONA', 'Edição de POP/Protocolo solicitada. Aguardando Validação e Aprovação para publicação (SLA 24 Horas).', 24, NOW() + INTERVAL '24 hours', 'Pendente');
      `, [popAtualizado.id, popAtualizado.titulo]);
            // Log de auditoria
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'POP_EDIT_REQUESTED', 'POPs', $2, $3)
      `, [authUser.nome || authUser.email, popAtualizado.codigo, request.ip]);
            await client.query('COMMIT');
            return popAtualizado;
        }
        catch (err) {
            await client.query('ROLLBACK');
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao registrar edição do POP' });
        }
        finally {
            client.release();
        }
    });
    // Aprova e Publica uma edição pendente
    fastify.post('/pops/:id/approve-edit', async (request, reply) => {
        const { id } = request.params;
        const { aprovador_nome } = request.body;
        const client = await db_1.default.connect();
        try {
            await client.query('BEGIN');
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
        WHERE id = $1 AND status_edicao = 'Aguardando Aprovação'
        RETURNING *;
      `, [id]);
            if (res.rows.length === 0) {
                await client.query('ROLLBACK');
                return reply.status(404).send({ error: 'Nenhuma edição pendente encontrada para este POP' });
            }
            const popAprovado = res.rows[0];
            // Insere no histórico de versões
            await client.query(`
        INSERT INTO pop_versoes (pop_id, versao, conteudo, autor)
        VALUES ($1, $2, $3, $4)
      `, [popAprovado.id, popAprovado.versao, popAprovado.conteudo, aprovador_nome || 'Aprovador Institucional']);
            // Dispara notificação informando que a edição foi aprovada e publicada
            await client.query(`
        INSERT INTO notificacoes (pop_id, pop_titulo, destinatario_email, destinatario_papel, mensagem, prazo_horas, data_limite, status)
        VALUES
        ($1, $2, 'autor.elaborador@redeverse.com', 'Elaborador / Autor', 'Sua edição do POP/Protocolo foi APROVADA e publicada oficialmente na instituição.', 24, NOW() + INTERVAL '24 hours', 'Enviado');
      `, [popAprovado.id, popAprovado.titulo]);
            // Log de auditoria
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'POP_EDIT_APPROVED', 'POPs', $2, $3)
      `, [aprovador_nome || 'Admin', popAprovado.codigo, request.ip]);
            await client.query('COMMIT');
            return { success: true, message: 'Edição aprovada e publicada com sucesso!', pop: popAprovado };
        }
        catch (err) {
            await client.query('ROLLBACK');
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao aprovar edição do POP' });
        }
        finally {
            client.release();
        }
    });
    // Rejeita uma edição pendente
    fastify.post('/pops/:id/reject-edit', async (request, reply) => {
        const { id } = request.params;
        const { aprovador_nome, motivo } = request.body;
        const client = await db_1.default.connect();
        try {
            await client.query('BEGIN');
            const res = await client.query(`
        UPDATE pops
        SET status_edicao = 'Rejeitada',
            titulo_pendente = NULL,
            versao_pendente = NULL,
            conteudo_pendente = NULL
        WHERE id = $1 AND status_edicao = 'Aguardando Aprovação'
        RETURNING *;
      `, [id]);
            if (res.rows.length === 0) {
                await client.query('ROLLBACK');
                return reply.status(404).send({ error: 'Nenhuma edição pendente encontrada para este POP' });
            }
            const popRejeitado = res.rows[0];
            // Dispara notificação informando que a edição foi rejeitada
            await client.query(`
        INSERT INTO notificacoes (pop_id, pop_titulo, destinatario_email, destinatario_papel, mensagem, prazo_horas, data_limite, status)
        VALUES
        ($1, $2, 'autor.elaborador@redeverse.com', 'Elaborador / Autor', $3, 24, NOW() + INTERVAL '24 hours', 'Enviado');
      `, [popRejeitado.id, popRejeitado.titulo, `Sua edição do POP/Protocolo foi REJEITADA. Motivo: ${motivo || 'Não conformidade com padrões ONA'}`]);
            // Log de auditoria
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'POP_EDIT_REJECTED', 'POPs', $2, $3)
      `, [aprovador_nome || 'Admin', popRejeitado.codigo, request.ip]);
            await client.query('COMMIT');
            return { success: true, message: 'Edição rejeitada e descartada com sucesso!', pop: popRejeitado };
        }
        catch (err) {
            await client.query('ROLLBACK');
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao rejeitar edição do POP' });
        }
        finally {
            client.release();
        }
    });
    // Remove um POP
    fastify.delete('/pops/:id', {
        onRequest: [async (request, reply) => {
                try {
                    await request.jwtVerify();
                }
                catch (err) {
                    reply.status(401).send({ error: 'Não autorizado' });
                }
            }]
    }, async (request, reply) => {
        const user = request.user;
        if (user.role !== 'Admin' && user.role !== 'Gestor da Qualidade') {
            return reply.status(403).send({ error: 'Proibido. Permissões insuficientes.' });
        }
        const { id } = request.params;
        const client = await db_1.default.connect();
        try {
            const resPop = await client.query('SELECT codigo FROM pops WHERE id = $1', [id]);
            if (resPop.rows.length === 0) {
                return reply.status(404).send({ error: 'POP não encontrado' });
            }
            await client.query('DELETE FROM pops WHERE id = $1', [id]);
            // Log de auditoria
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ($1, 'POP_DELETE', 'POPs', $2, $3)
      `, [user.nome || user.email, resPop.rows[0].codigo, request.ip]);
            return { success: true, message: 'POP removido com sucesso' };
        }
        finally {
            client.release();
        }
    });
    // ==========================================
    // ROTAS DE NOTIFICAÇÕES E SLA 24 HORAS
    // ==========================================
    // Lista todas as notificações de SLA
    fastify.get('/notificacoes', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT * FROM notificacoes ORDER BY id DESC');
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    // Simula o reenvio de notificação/e-mail de cobrança de SLA
    fastify.post('/notificacoes/:id/resend', async (request, reply) => {
        const { id } = request.params;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        UPDATE notificacoes
        SET data_envio = CURRENT_TIMESTAMP, status = 'Reenviado (Alerta SLA)'
        WHERE id = $1
        RETURNING *;
      `, [id]);
            if (res.rows.length === 0) {
                return reply.status(404).send({ error: 'Notificação não encontrada' });
            }
            return { success: true, message: 'E-mail de cobrança reenviado com sucesso ao responsável!', notificacao: res.rows[0] };
        }
        finally {
            client.release();
        }
    });
    // ==========================================
    // INGESTÃO AUTOMATIZADA DOS 69 DOCUMENTOS
    // ==========================================
    fastify.post('/pops/ingest', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            await client.query('BEGIN');
            let count = 0;
            for (const doc of documentosData_1.TODOS_DOCUMENTOS_69) {
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
                    // Inserir notificações automáticas de SLA 24h
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
            return { success: true, message: `Sincronização concluída! ${count} documentos e POPs da Rede Verse foram importados com sucesso com SLA de 24h e notificações enviadas.` };
        }
        catch (err) {
            await client.query('ROLLBACK');
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao sincronizar workspace' });
        }
        finally {
            client.release();
        }
    });
    // ==========================================
    // ROTAS DA GESTÃO DE DOCUMENTOS DINÂMICA (LOW-CODE & BPM)
    // ==========================================
    // CRUD de Tipos Documentais Dinâmicos
    fastify.get('/documents/types', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT t.*, w.nome as workflow_nome, tp.nome as template_nome FROM document_types t LEFT JOIN document_workflows w ON t.workflow_id = w.id LEFT JOIN document_templates tp ON t.template_id = tp.id WHERE t.ativo = TRUE ORDER BY t.id ASC');
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    fastify.post('/documents/types', async (request, reply) => {
        const { nome, categoria, descricao, workflow_id, template_id } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        INSERT INTO document_types (nome, categoria, descricao, workflow_id, template_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [nome, categoria, descricao, workflow_id || null, template_id || null]);
            return res.rows[0];
        }
        finally {
            client.release();
        }
    });
    fastify.put('/documents/types/:id', async (request, reply) => {
        const { id } = request.params;
        const { nome, categoria, descricao, workflow_id, template_id } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        UPDATE document_types
        SET nome = $1, categoria = $2, descricao = $3, workflow_id = $4, template_id = $5
        WHERE id = $6
        RETURNING *;
      `, [nome, categoria, descricao, workflow_id || null, template_id || null, id]);
            return res.rows[0];
        }
        finally {
            client.release();
        }
    });
    fastify.delete('/documents/types/:id', async (request, reply) => {
        const { id } = request.params;
        const client = await db_1.default.connect();
        try {
            await client.query('UPDATE document_types SET ativo = FALSE WHERE id = $1', [id]);
            return { success: true, message: 'Tipo documental desativado com sucesso' };
        }
        finally {
            client.release();
        }
    });
    // CRUD de Categorias e Subcategorias
    fastify.get('/documents/categories', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT * FROM document_categories WHERE ativo = TRUE ORDER BY id ASC');
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    fastify.post('/documents/categories', async (request, reply) => {
        const { nome, setor_alvo, subcategorias_json } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        INSERT INTO document_categories (nome, setor_alvo, subcategorias_json)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [nome, setor_alvo || 'Geral', subcategorias_json || []]);
            return res.rows[0];
        }
        finally {
            client.release();
        }
    });
    // CRUD de Workflows BPM
    fastify.get('/documents/workflows', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT * FROM document_workflows WHERE ativo = TRUE ORDER BY id ASC');
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    fastify.post('/documents/workflows', async (request, reply) => {
        const { nome, descricao, etapas_json, sla_horas_padrao } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        INSERT INTO document_workflows (nome, descricao, etapas_json, sla_horas_padrao)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [nome, descricao, etapas_json || ['rascunho', 'revisão', 'aprovação', 'publicado'], sla_horas_padrao || 48]);
            return res.rows[0];
        }
        finally {
            client.release();
        }
    });
    // CRUD de Templates Dinâmicos
    fastify.get('/documents/templates', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT * FROM document_templates WHERE ativo = TRUE ORDER BY id ASC');
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    fastify.post('/documents/templates', async (request, reply) => {
        const { nome, tipo_documental, conteudo_rich_text, placeholders_json } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query(`
        INSERT INTO document_templates (nome, tipo_documental, conteudo_rich_text, placeholders_json)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [nome, tipo_documental, conteudo_rich_text, placeholders_json || ['nome', 'setor', 'responsavel', 'data']]);
            return res.rows[0];
        }
        finally {
            client.release();
        }
    });
    // Formulários Dinâmicos e Campos
    fastify.get('/documents/forms', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            const resForms = await client.query('SELECT * FROM document_forms WHERE ativo = TRUE ORDER BY id ASC');
            const resFields = await client.query('SELECT * FROM document_fields ORDER BY id ASC');
            const fieldMap = {};
            for (const f of resFields.rows) {
                if (!fieldMap[f.form_id])
                    fieldMap[f.form_id] = [];
                fieldMap[f.form_id].push(f);
            }
            return resForms.rows.map(form => ({
                ...form,
                campos: fieldMap[form.id] || []
            }));
        }
        finally {
            client.release();
        }
    });
    fastify.post('/documents/forms', async (request, reply) => {
        const { nome, tipo_documental, setor, campos } = request.body;
        const client = await db_1.default.connect();
        try {
            await client.query('BEGIN');
            const resForm = await client.query(`
        INSERT INTO document_forms (nome, tipo_documental, setor)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [nome, tipo_documental, setor || 'Geral']);
            const novoForm = resForm.rows[0];
            if (campos && Array.isArray(campos)) {
                for (const c of campos) {
                    await client.query(`
            INSERT INTO document_fields (form_id, nome_campo, tipo_campo, opcoes_json, obrigatorio)
            VALUES ($1, $2, $3, $4, $5)
          `, [novoForm.id, c.nome_campo, c.tipo_campo || 'texto', c.opcoes_json || [], c.obrigatorio || false]);
                }
            }
            await client.query('COMMIT');
            return novoForm;
        }
        catch (err) {
            await client.query('ROLLBACK');
            fastify.log.error(err);
            reply.status(500).send({ error: 'Erro ao criar formulário dinâmico' });
        }
        finally {
            client.release();
        }
    });
    // SLA Assíncrono (Simulação de Worker e Filas)
    fastify.get('/documents/slas', async (request, reply) => {
        const client = await db_1.default.connect();
        try {
            // Simula a passagem do worker assíncrono que verifica filas e dispara escalonamento
            await client.query(`
        UPDATE document_slas
        SET status_worker = 'escalonado'
        WHERE id IN (
          SELECT id FROM document_slas
          WHERE data_limite < CURRENT_TIMESTAMP AND status_worker = 'pendente'
          FOR UPDATE SKIP LOCKED
        );
      `);
            const res = await client.query(`
        SELECT s.*, p.titulo as documento_titulo, p.codigo, p.setor
        FROM document_slas s
        JOIN pops p ON s.documento_id = p.id
        ORDER BY s.data_limite ASC;
      `);
            return res.rows;
        }
        finally {
            client.release();
        }
    });
    // IA Documental Contextual (Busca Semântica, Recomendação, Análise de Impacto e Gaps)
    fastify.post('/documents/ai-analysis', async (request, reply) => {
        const { documento_id, setor, acao, query } = request.body;
        const client = await db_1.default.connect();
        try {
            if (acao === 'busca_semantica') {
                let queryStr = 'SELECT id, titulo, codigo, setor, status, conteudo FROM pops WHERE 1=1';
                const params = [];
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
                const res = await client.query(queryStr, params);
                return { tipo: 'busca_semantica', resultados: res.rows };
            }
            if (acao === 'analise_impacto' && documento_id) {
                const resDoc = await client.query('SELECT titulo, codigo, setor, conteudo FROM pops WHERE id = $1', [documento_id]);
                if (resDoc.rows.length === 0)
                    return reply.status(404).send({ error: 'Documento não encontrado' });
                const doc = resDoc.rows[0];
                // Análise de impacto simulada pela IA
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
        }
        finally {
            client.release();
        }
    });
}
