import { FastifyRequest, FastifyReply } from 'fastify';
import pool from '../db';

interface TenantLicense {
  features: string[];
  status: string;
  expiresAt: number;
}

class TenantLicenseManager {
  private cache = new Map<string, TenantLicense>();
  private cacheTTL = 60 * 1000; // 60 segundos

  // Recursos padrão caso o banco de dados falhe ou o tenant não possua assinatura cadastrada
  private defaultFeatures = [
    'feature:omoc:core',
    'feature:pops:core',
    'feature:bpm:core',
    'feature:riscos:core',
    'feature:audit:core',
    'feature:okr:core',
    'feature:lms:core',
    'feature:ai:ishikawa',
    'feature:billing:core'
  ];

  async getTenantLicense(tenantId: string): Promise<{ features: string[]; status: string }> {
    const now = Date.now();
    const cached = this.cache.get(tenantId);

    if (cached && cached.expiresAt > now) {
      return { features: cached.features, status: cached.status };
    }

    let client: any = null;
    try {
      client = await pool.connect();
      const res = await client.query(`
        SELECT p.features_ativas, a.status 
        FROM pal_assinaturas a
        JOIN pal_planos p ON a.plano_id = p.id
        WHERE a.tenant_id = $1
      `, [tenantId]);

      let features = this.defaultFeatures;
      let status = 'ACTIVE';

      if (res.rows.length > 0) {
        features = res.rows[0].features_ativas || [];
        status = res.rows[0].status || 'ACTIVE';
      } else {
        // Tenants sem assinatura configurada (ou o default Unidade Central) herdam o Premium
        if (tenantId === 'Unidade Central') {
          features = this.defaultFeatures;
        } else {
          // Outros novos tenants padrão herdam o essencial inicialmente
          features = ['feature:omoc:core', 'feature:pops:core'];
        }
      }

      // Buscar trials ativos do tenant
      const trialsRes = await client.query(`
        SELECT modulo FROM pal_trial_modulos
        WHERE tenant_id = $1 AND data_expiracao > CURRENT_TIMESTAMP
      `, [tenantId]);

      // Cria cópia rasa para evitar alteração direta de planos globais
      features = [...features];

      const trialFeatureMap: Record<string, string> = {
        'pops': 'feature:pops:core',
        'bpm': 'feature:bpm:core',
        'ona': 'feature:ona:core',
        'users': 'feature:omoc:core',
        'indicators': 'feature:okr:core',
        'incidents': 'feature:riscos:core',
        'ai': 'feature:ai:ishikawa',
        'fhir': 'feature:fhir:core'
      };

      for (const row of trialsRes.rows) {
        const feat = trialFeatureMap[row.modulo];
        if (feat && !features.includes(feat)) {
          features.push(feat);
        }
      }

      this.cache.set(tenantId, {
        features,
        status,
        expiresAt: now + this.cacheTTL
      });

      return { features, status };
    } catch (err) {
      // CIRCUIT BREAKER / FAIL-SAFE
      console.error(`[TenantLicenseManager] Erro ao buscar licenças do banco de dados para tenant ${tenantId}. Revertendo para padrão de segurança.`, err);
      
      // Logs de auditoria interna se a query falhar
      try {
        if (client) {
          await client.query(`
            INSERT INTO auditoria_logs (usuario, acao, entidade, ip)
            VALUES ('SYSTEM', 'LICENSE_CIRCUIT_BREAKER_TRIGGERED', 'LICENSING', '127.0.0.1')
          `);
        }
      } catch (logErr) {
        console.error('[TenantLicenseManager] Falha ao registrar log de circuit breaker', logErr);
      }

      // Retorna as features default de segurança
      return { features: this.defaultFeatures, status: 'ACTIVE' };
    } finally {
      if (client) client.release();
    }
  }

  async isTenantSuspended(tenantId: string): Promise<boolean> {
    const license = await this.getTenantLicense(tenantId);
    return license.status === 'SUSPENDED';
  }

  async hasFeature(tenantId: string, featureName: string): Promise<boolean> {
    const license = await this.getTenantLicense(tenantId);
    return license.features.includes(featureName);
  }

  invalidateCache(tenantId: string): void {
    this.cache.delete(tenantId);
  }
}

export const tenantLicenseManager = new TenantLicenseManager();

// Middleware de rota Fastify
export function requireFeature(featureName: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = (request.user as any)?.unidade || 'Unidade Central';
    const license = await tenantLicenseManager.getTenantLicense(tenantId);
    
    if (license.status === 'SUSPENDED') {
      return reply.status(403).send({
        error: 'Assinatura suspensa por pendência financeira. Entre em contato com o administrador',
        suspended: true
      });
    }

    if (!license.features.includes(featureName)) {
      return reply.status(403).send({
        error: `Acesso Negado: Recurso Não Contratado (${featureName})`
      });
    }
  };
}

// Middleware de travamento de suspensão global
export async function checkSuspended(request: FastifyRequest, reply: FastifyReply) {
  const tenantId = (request.user as any)?.unidade || 'Unidade Central';
  const isSuspended = await tenantLicenseManager.isTenantSuspended(tenantId);
  if (isSuspended) {
    return reply.status(403).send({
      error: 'Assinatura suspensa por pendência financeira. Entre em contato com o administrador',
      suspended: true
    });
  }
}
