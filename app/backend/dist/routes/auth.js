"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const db_1 = __importDefault(require("../db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function authRoutes(fastify) {
    fastify.post('/auth/login', async (request, reply) => {
        const { email, password } = request.body;
        const client = await db_1.default.connect();
        try {
            const res = await client.query('SELECT id, nome, email, senha_hash, rbac_role, departamento, unidade, mfa_enabled FROM usuarios WHERE email = $1', [email]);
            if (res.rows.length === 0) {
                return reply.status(401).send({ error: 'Credenciais inválidas' });
            }
            const user = res.rows[0];
            const isValid = await bcryptjs_1.default.compare(password, user.senha_hash);
            if (!isValid) {
                return reply.status(401).send({ error: 'Credenciais inválidas' });
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
            // Registra log de auditoria
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, ip)
        VALUES ($1, 'LOGIN_SUCCESS', 'AUTH', $2)
      `, [user.email, request.ip]);
            return {
                token,
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
        }
        finally {
            client.release();
        }
    });
    fastify.get('/auth/me', {
        onRequest: [async (request, reply) => {
                try {
                    await request.jwtVerify();
                }
                catch (err) {
                    reply.status(401).send({ error: 'Não autorizado' });
                }
            }]
    }, async (request, reply) => {
        return request.user;
    });
}
