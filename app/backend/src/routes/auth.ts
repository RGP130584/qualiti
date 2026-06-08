import { FastifyInstance } from 'fastify';
import pool from '../db';
import { verifyPassword } from '../utils/crypto';
import { tenantLicenseManager } from '../utils/feature-guard';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
        keyGenerator: (request: any) => {
          const email = (request.body as any)?.email || 'anonymous';
          return `${request.ip}-${email}`;
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT id, nome, email, senha_hash, rbac_role, departamento, unidade, mfa_enabled, ativo FROM usuarios WHERE email = $1', [email]);
      if (res.rows.length === 0) {
        // Registra tentativa falha de login
        await client.query(`
          INSERT INTO auditoria_logs (usuario, acao, entidade, ip) 
          VALUES ($1, 'LOGIN_FAILED', 'AUTH', $2)
        `, [email || 'Desconhecido', request.ip]);

        return reply.status(401).send({ error: 'Credenciais inválidas' });
      }

      const user = res.rows[0];
      if (user.ativo === false) {
        return reply.status(403).send({ error: 'Conta de usuário inativa. Contate o administrador.' });
      }

      if (!verifyPassword(password, user.senha_hash)) {
        // Registra tentativa falha de login
        await client.query(`
          INSERT INTO auditoria_logs (usuario, acao, entidade, ip) 
          VALUES ($1, 'LOGIN_FAILED', 'AUTH', $2)
        `, [user.email, request.ip]);

        return reply.status(401).send({ error: 'Credenciais inválidas' });
      }

      // Verificar suspensão de faturamento do tenant
      const isSuspended = await tenantLicenseManager.isTenantSuspended(user.unidade || 'Unidade Central');
      if (isSuspended) {
        return reply.status(403).send({ 
          error: 'Assinatura suspensa por pendência financeira. Entre em contato com o administrador',
          suspended: true
        });
      }

      // Gera JWT
      const token = fastify.jwt.sign({
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.rbac_role,
        departamento: user.departamento,
        unidade: user.unidade
      });

      // Define cookie seguro com token
      reply.setCookie('qualita_token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 dias
      });

      // Registra log de auditoria de sucesso
      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, ip) 
        VALUES ($1, 'LOGIN_SUCCESS', 'AUTH', $2)
      `, [user.email, request.ip]);

      return {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.rbac_role,
          departamento: user.departamento,
          unidade: user.unidade,
          mfa_enabled: user.mfa_enabled
        }
      };
    } finally {
      client.release();
    }
  });

  fastify.post('/auth/logout', async (request, reply) => {
    reply.clearCookie('qualita_token', { path: '/' });
    return { success: true };
  });

  fastify.get('/auth/me', {
    onRequest: [async (request, reply) => {
      try {
        let token = request.cookies.qualita_token;
        if (!token) {
          // Fallback para Header de Autorização Bearer (Swagger / Testes)
          const authHeader = request.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          }
        }

        if (!token) {
          throw new Error('Nenhum token fornecido');
        }

        const decoded = fastify.jwt.verify(token) as any;
        request.user = decoded;
      } catch (err) {
        reply.status(401).send({ error: 'Não autorizado' });
      }
    }]
  }, async (request, reply) => {
    const tenantId = (request.user as any)?.unidade || 'Unidade Central';
    const license = await tenantLicenseManager.getTenantLicense(tenantId);
    
    return {
      ...(request.user as any),
      features_ativas: license.features,
      suspended: license.status === 'SUSPENDED'
    };
  });
}
