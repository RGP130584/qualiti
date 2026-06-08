import pool from '../db';

export function startSlaWorker() {
  console.log('[SLA Worker] Background SLA monitor started (checking every 30s).');

  setInterval(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Verify pops table SLA expiration
      // Mark as 'Vencido' if data_limite is exceeded and status is not finalized/already expired
      const popRes = await client.query(`
        UPDATE pops 
        SET status = 'Vencido', status_edicao = 'Expirada'
        WHERE data_limite < CURRENT_TIMESTAMP 
          AND status != 'Aprovado' 
          AND status != 'Publicado' 
          AND status != 'Vencido'
        RETURNING id, titulo, codigo, autor;
      `);

      for (const pop of popRes.rows) {
        console.warn(`[SLA Worker] POP ${pop.codigo} has expired. Transitioning status to Vencido.`);
        
        // Notify quality management
        await client.query(`
          INSERT INTO notificacoes (pop_id, pop_titulo, destinatario_email, destinatario_papel, mensagem, status, data_limite)
          VALUES ($1, $2, 'qualidade.gestao@redeverse.com', 'Gestor da Qualidade', $3, 'Atrasado (Alerta SLA)', CURRENT_TIMESTAMP);
        `, [
          pop.id, pop.titulo, 
          `Alerta SLA: O documento ${pop.codigo} (${pop.titulo}) estourou o prazo limite de 24h sem aprovação final.`
        ]);
      }

      // 2. Verify ONA action plans (ona_planos_acao) SLA expiration
      // Mark workflow_status as 'Vencido' if data_limite has passed and status is not 'Concluído' or 'Vencido'
      const planRes = await client.query(`
        UPDATE ona_planos_acao
        SET workflow_status = 'Vencido', alertas_enviados = TRUE
        WHERE data_limite < CURRENT_TIMESTAMP
          AND workflow_status != 'Concluído'
          AND workflow_status != 'Vencido'
        RETURNING id, nao_conformidade_origem, responsavel;
      `);

      for (const plan of planRes.rows) {
        console.warn(`[SLA Worker] Action Plan #${plan.id} has expired.`);
        
        // Insert alert into education/alerts panel for quality managers
        await client.query(`
          INSERT INTO education_notifications (usuario_email, titulo, mensagem, tipo, lida)
          VALUES ($1, 'Estouro de SLA: Plano de Ação', $2, 'SLA_ALERTA', FALSE);
        `, [
          'qualidade.gestao@redeverse.com',
          `O plano de ação para a não-conformidade "${plan.nao_conformidade_origem}" sob responsabilidade de ${plan.responsavel} estourou o SLA.`
        ]);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[SLA Worker] Error running SLA check batch:', err);
    } finally {
      client.release();
    }
  }, 30000); // 30 seconds
}
