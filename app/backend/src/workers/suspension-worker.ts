import pool from '../db';
import { tenantLicenseManager } from '../utils/feature-guard';

export function startSuspensionWorker() {
  console.log('[Suspension Worker] Background invoice suspension monitor started (checking every 30s).');

  setInterval(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Encontrar todas as faturas vencidas a mais de 5 dias
      const overdueInvoices = await client.query(`
        SELECT DISTINCT tenant_id FROM pal_faturas
        WHERE status = 'PENDING' AND data_vencimento < CURRENT_TIMESTAMP - INTERVAL '5 days'
      `);

      for (const inv of overdueInvoices.rows) {
        const tenantId = inv.tenant_id;

        // Atualizar assinatura do tenant para SUSPENDED
        const updateRes = await client.query(`
          UPDATE pal_assinaturas
          SET status = 'SUSPENDED'
          WHERE tenant_id = $1 AND status != 'SUSPENDED'
          RETURNING *;
        `, [tenantId]);

        if ((updateRes.rowCount ?? 0) > 0) {
          console.warn(`[Suspension Worker] Tenant "${tenantId}" suspenso por faturas em aberto a mais de 5 dias.`);
          
          // Registrar logs de auditoria
          await client.query(`
            INSERT INTO auditoria_logs (usuario, acao, entidade, ip)
            VALUES ('SYSTEM/PAL', 'TENANT_AUTO_SUSPENDED', 'TENANT', '127.0.0.1')
          `);

          // Invalidar cache de licenças/features para esse tenant
          tenantLicenseManager.invalidateCache(tenantId);
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Suspension Worker] Erro executando worker de suspensão de inadimplentes:', err);
    } finally {
      client.release();
    }
  }, 30000);
}
