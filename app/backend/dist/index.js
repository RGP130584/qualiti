"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const wizard_1 = __importDefault(require("./routes/wizard"));
const auth_1 = __importDefault(require("./routes/auth"));
const pops_1 = __importDefault(require("./routes/pops"));
const bpm_1 = __importDefault(require("./routes/bpm"));
const ona_1 = __importDefault(require("./routes/ona"));
const users_1 = __importDefault(require("./routes/users"));
const indicators_1 = __importDefault(require("./routes/indicators"));
const incidents_1 = __importDefault(require("./routes/incidents"));
const ai_1 = __importDefault(require("./routes/ai"));
const fhir_1 = __importDefault(require("./routes/fhir"));
const audit_1 = __importDefault(require("./routes/audit"));
const admin_1 = __importDefault(require("./routes/admin"));
const okrs_1 = __importDefault(require("./routes/okrs"));
const education_1 = __importDefault(require("./routes/education"));
const controllers_1 = require("./modules/ona/controllers");
const controllers_2 = require("./modules/core/controllers");
dotenv_1.default.config();
const server = (0, fastify_1.default)({
    logger: true,
});
async function main() {
    // Inicializa Banco de Dados e Seed
    await (0, db_1.initDb)();
    // Registra CORS
    await server.register(cors_1.default, {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    });
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
        console.error("FATAL ERROR: JWT_SECRET is not defined.");
        process.exit(1);
    }
    // Registra JWT
    await server.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || 'super_secret_qualita_jwt_key_2026_secure',
    });
    // Registra Swagger (OpenAPI 3.0)
    await server.register(swagger_1.default, {
        openapi: {
            info: {
                title: 'QualitaOS API',
                description: 'Especificação OpenAPI 3.0 para o QualitaOS (Sistema Operacional da Qualidade de Internação)',
                version: '1.0.0',
            },
            servers: [
                {
                    url: 'http://localhost/api',
                    description: 'Caddy Gateway Proxy',
                },
                {
                    url: 'http://localhost:3001/api',
                    description: 'Fastify Backend Direto',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
    });
    await server.register(swagger_ui_1.default, {
        routePrefix: '/api/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
        },
    });
    // Registra Rotas com prefixo /api
    server.register(wizard_1.default, { prefix: '/api' });
    server.register(auth_1.default, { prefix: '/api' });
    server.register(pops_1.default, { prefix: '/api' });
    server.register(bpm_1.default, { prefix: '/api' });
    server.register(ona_1.default, { prefix: '/api' });
    server.register(users_1.default, { prefix: '/api' });
    server.register(indicators_1.default, { prefix: '/api' });
    server.register(incidents_1.default, { prefix: '/api' });
    server.register(ai_1.default, { prefix: '/api' });
    server.register(fhir_1.default, { prefix: '/api' });
    server.register(audit_1.default, { prefix: '/api' });
    server.register(admin_1.default, { prefix: '/api' });
    server.register(okrs_1.default, { prefix: '/api' });
    server.register(education_1.default, { prefix: '/api' });
    server.register(controllers_1.onaV2Routes, { prefix: '/api' });
    server.register(controllers_2.coreV2Routes, { prefix: '/api' });
    // Rota de status geral
    server.get('/api/health', async (request, reply) => {
        return { status: 'ok', timestamp: new Date(), service: 'QualitaOS Backend Fastify' };
    });
    const port = parseInt(process.env.PORT || '3001', 10);
    try {
        await server.listen({ port, host: '0.0.0.0' });
        server.log.info(`Servidor backend rodando em http://0.0.0.0:${port}`);
        server.log.info(`Documentação Swagger disponível em http://localhost/api/docs`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
main();
