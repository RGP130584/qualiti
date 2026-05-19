import { FastifyInstance } from 'fastify';
import pool from '../db';
import fs from 'fs';
import path from 'path';
import { TODOS_DOCUMENTOS_69 } from '../modules/core/documentosData';

export default async function popsRoutes(fastify: FastifyInstance) {
  // Lista todos os POPs com SLA e status de notificação
  fastify.get('/pops', async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT id, titulo, codigo, versao, setor, status, autor, aprovador, data_criacao, data_revisao, data_limite, notificacao_enviada FROM pops ORDER BY id DESC');
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Obtém detalhes de um POP específico com histórico de versões e notificações associadas
  fastify.get('/pops/:id', async (request, reply) => {
    const { id } = request.params as any;
    const client = await pool.connect();
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
    } finally {
      client.release();
    }
  });

  // Cria um novo POP com cálculo de SLA 24 Horas e disparo de notificações
  fastify.post('/pops', async (request, reply) => {
    const { titulo, codigo, versao, setor, status, conteudo, autor, aprovador } = request.body as any;
    const client = await pool.connect();
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
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao criar POP' });
    } finally {
      client.release();
    }
  });

  // Atualiza um POP existente (Salva a edição como PENDENTE aguardando aprovação institucional)
  fastify.put('/pops/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { titulo, versao, setor, status, conteudo, autor, aprovador } = request.body as any;
    const client = await pool.connect();
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
      `, [autor || 'Admin', popAtualizado.codigo, request.ip]);

      await client.query('COMMIT');
      return popAtualizado;
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao registrar edição do POP' });
    } finally {
      client.release();
    }
  });

  // Aprova e Publica uma edição pendente
  fastify.post('/pops/:id/approve-edit', async (request, reply) => {
    const { id } = request.params as any;
    const { aprovador_nome } = request.body as any;
    const client = await pool.connect();
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
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao aprovar edição do POP' });
    } finally {
      client.release();
    }
  });

  // Rejeita uma edição pendente
  fastify.post('/pops/:id/reject-edit', async (request, reply) => {
    const { id } = request.params as any;
    const { aprovador_nome, motivo } = request.body as any;
    const client = await pool.connect();
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
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao rejeitar edição do POP' });
    } finally {
      client.release();
    }
  });

  // Remove um POP
  fastify.delete('/pops/:id', async (request, reply) => {
    const { id } = request.params as any;
    const client = await pool.connect();
    try {
      const resPop = await client.query('SELECT codigo FROM pops WHERE id = $1', [id]);
      if (resPop.rows.length === 0) {
        return reply.status(404).send({ error: 'POP não encontrado' });
      }

      await client.query('DELETE FROM pops WHERE id = $1', [id]);

      // Log de auditoria
      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ('Admin', 'POP_DELETE', 'POPs', $1, $2)
      `, [resPop.rows[0].codigo, request.ip]);

      return { success: true, message: 'POP removido com sucesso' };
    } finally {
      client.release();
    }
  });

  // ==========================================
  // ROTAS DE NOTIFICAÇÕES E SLA 24 HORAS
  // ==========================================

  // Lista todas as notificações de SLA
  fastify.get('/notificacoes', async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT * FROM notificacoes ORDER BY id DESC');
      return res.rows;
    } finally {
      client.release();
    }
  });

  // Simula o reenvio de notificação/e-mail de cobrança de SLA
  fastify.post('/notificacoes/:id/resend', async (request, reply) => {
    const { id } = request.params as any;
    const client = await pool.connect();
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
    } finally {
      client.release();
    }
  });

  // ==========================================
  // INGESTÃO AUTOMATIZADA DOS 69 DOCUMENTOS
  // ==========================================
  fastify.post('/pops/ingest', async (request, reply) => {
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
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao sincronizar workspace' });
    } finally {
      client.release();
    }
  });
}
