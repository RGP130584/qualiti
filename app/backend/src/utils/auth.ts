import { FastifyRequest, FastifyReply } from 'fastify';
import { tenantLicenseManager } from './feature-guard';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
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
      return reply.status(401).send({ error: 'Não autorizado: Nenhum token fornecido' });
    }

    // Decodifica o token usando o decorator do fastify-jwt
    const decoded = request.server.jwt.verify(token) as any;
    request.user = decoded;

    // Verificar se o tenant está suspenso (ignorar nas rotas de faturamento/marketplace para permitir pagamento)
    const isBillingRoute = request.url.startsWith('/api/pal/') || request.url.includes('/pal/');
    if (!isBillingRoute) {
      const tenantId = decoded.unidade || 'Unidade Central';
      const isSuspended = await tenantLicenseManager.isTenantSuspended(tenantId);
      if (isSuspended) {
        return reply.status(403).send({
          error: 'Assinatura suspensa por pendência financeira. Entre em contato com o administrador',
          suspended: true
        });
      }
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Não autorizado: Token inválido ou expirado' });
  }
}
