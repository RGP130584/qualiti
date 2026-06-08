import pool from '../db';
import { eventBus } from '../utils/event-bus';

export function startUsageWorker() {
  console.log('[Usage Worker] Background Usage metrics compiler started (checking every 30s).');

  setInterval(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Listar todos os tenants que possuem faturamento/assinatura configurada
      const tenantsRes = await client.query('SELECT DISTINCT tenant_id FROM pal_assinaturas');
      const tenants = tenantsRes.rows.map(r => r.tenant_id);

      // Garante que o tenant 'Unidade Central' esteja na lista
      if (!tenants.includes('Unidade Central')) {
        tenants.push('Unidade Central');
      }

      for (const tenantId of tenants) {
        // 2. Contar documentos ativos em 'pops'
        const docCountRes = await client.query(
          'SELECT COUNT(*) FROM pops WHERE tenant_id = $1 AND deleted_at IS NULL',
          [tenantId]
        );
        const docCount = parseInt(docCountRes.rows[0].count);

        // 3. Contar usuários ativos em 'usuarios'
        const userCountRes = await client.query(
          'SELECT COUNT(*) FROM usuarios WHERE unidade = $1 AND ativo = TRUE',
          [tenantId]
        );
        const userCount = parseInt(userCountRes.rows[0].count);

        // 4. Salvar/Upsert no pal_uso
        await client.query(`
          INSERT INTO pal_uso (tenant_id, recurso, quantidade, data_atualizacao)
          VALUES ($1, 'documentos', $2, CURRENT_TIMESTAMP)
          ON CONFLICT (tenant_id, recurso)
          DO UPDATE SET quantidade = EXCLUDED.quantidade, data_atualizacao = CURRENT_TIMESTAMP;
        `, [tenantId, docCount]);

        await client.query(`
          INSERT INTO pal_uso (tenant_id, recurso, quantidade, data_atualizacao)
          VALUES ($1, 'usuarios', $2, CURRENT_TIMESTAMP)
          ON CONFLICT (tenant_id, recurso)
          DO UPDATE SET quantidade = EXCLUDED.quantidade, data_atualizacao = CURRENT_TIMESTAMP;
        `, [tenantId, userCount]);

        // 5. Verificar limites de cota do plano ativo
        const planRes = await client.query(`
          SELECT p.cota_documentos, p.cota_usuarios
          FROM pal_assinaturas a
          JOIN pal_planos p ON a.plano_id = p.id
          WHERE a.tenant_id = $1
        `, [tenantId]);

        if (planRes.rows.length > 0) {
          const limitDocs = planRes.rows[0].cota_documentos;
          const limitUsers = planRes.rows[0].cota_usuarios;

          // Se atingiu 90% da cota de documentos
          if (docCount >= limitDocs * 0.9 && docCount < limitDocs) {
            await eventBus.publish('pal.usage.quota.warning', {
              tenant_id: tenantId,
              recurso: 'documentos',
              quantidade: docCount,
              limite: limitDocs
            });

            // Insere um alerta persistente para exibição no frontend
            await client.query(`
              INSERT INTO education_notifications (usuario_email, titulo, mensagem, tipo, lida)
              VALUES ($1, 'Cota de Documentos Próxima do Limite', $2, 'QUOTA_ALERTA', FALSE)
              ON CONFLICT DO NOTHING;
            `, [
              `admin@${tenantId.toLowerCase().replace(/\s+/g, '')}.com`,
              `Alerta Comercial: Seu tenant atingiu ${docCount} de ${limitDocs} documentos (mais de 90% da cota contratada). Faça um upgrade antes de bloquear!`
            ]);
          }

          // Se atingiu 90% da cota de usuários
          if (userCount >= limitUsers * 0.9 && userCount < limitUsers) {
            await eventBus.publish('pal.usage.quota.warning', {
              tenant_id: tenantId,
              recurso: 'usuarios',
              quantidade: userCount,
              limite: limitUsers
            });

            await client.query(`
              INSERT INTO education_notifications (usuario_email, titulo, mensagem, tipo, lida)
              VALUES ($1, 'Cota de Usuários Próxima do Limite', $2, 'QUOTA_ALERTA', FALSE)
              ON CONFLICT DO NOTHING;
            `, [
              `admin@${tenantId.toLowerCase().replace(/\s+/g, '')}.com`,
              `Alerta Comercial: Seu tenant atingiu ${userCount} de ${limitUsers} usuários ativos (mais de 90% da cota contratada).`
            ]);
          }
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Usage Worker] Erro compilando métricas de uso:', err);
    } finally {
      client.release();
    }
  }, 30000);
}
