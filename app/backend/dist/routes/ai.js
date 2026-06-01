"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = aiRoutes;
const db_1 = __importDefault(require("../db"));
async function aiRoutes(fastify) {
    // Geração de rascunho de POP via IA
    fastify.post('/ai/generate-pop', async (request, reply) => {
        const { titulo, setor, palavrasChave, provider } = request.body;
        // Simulação robusta para MVP / Demonstração
        const prompt = `Gerar POP para o título "${titulo}" no setor "${setor}". Palavras-chave: ${palavrasChave}`;
        fastify.log.info(`[IA Prompt]: ${prompt}`);
        const conteudoGerado = `1. OBJETIVO
Garantir a execução padronizada e segura do procedimento de ${titulo} no setor de ${setor}, alinhado aos padrões de qualidade ONA.

2. APLICAÇÃO
Aplica-se a todos os profissionais atuantes no setor de ${setor} e equipes multidisciplinares de apoio.

3. RESPONSABILIDADES
- Gestor do Setor: Supervisionar a adesão ao protocolo.
- Equipe Assistencial/Operacional: Executar rigorosamente as etapas descritas.

4. DESCRIÇÃO DO PROCEDIMENTO
4.1. Preparação: Higienizar as mãos e reunir todos os EPIs e materiais necessários (${palavrasChave || 'conforme padrão'}).
4.2. Execução: Realizar a conferência de identificação (dupla checagem) antes de iniciar.
4.3. Conclusão: Descartar resíduos conforme PGRSS e registrar a ação no prontuário ou sistema de gestão.

5. REFERÊNCIAS
- Manual ONA Nível 1 e 2 (Segurança e Gestão Integrada).
- Normas Regulamentadoras e Boas Práticas Hospitalares.`;
        // Log de auditoria
        const client = await db_1.default.connect();
        try {
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, ip)
        VALUES ('Admin / IA', 'AI_POP_GENERATE', 'AI_ASSISTANT', $1)
      `, [request.ip]);
        }
        finally {
            client.release();
        }
        return {
            titulo: titulo || 'Procedimento Operacional Padrão',
            setor: setor || 'Geral',
            conteudo: conteudoGerado,
            provider_utilizado: provider || 'QualitaAI (Simulação Nativa)'
        };
    });
    // Resumo e análise de causa raiz de incidentes via IA
    fastify.post('/ai/summarize-incidents', async (request, reply) => {
        const { incidentes } = request.body;
        const resumo = `Análise de IA baseada em ${incidentes?.length || 0} incidentes recentes:
Identificou-se uma correlação pontual entre falhas na identificação de pacientes e trocas de medicação durante os horários de transição de turno (18h-20h).

Recomendações do Assistente de IA:
1. Implementar barreira de dupla checagem obrigatória no prontuário eletrônico.
2. Promover micro-treinamentos de 15 minutos sobre metas internacionais de segurança do paciente.
3. Revisar o layout de armazenamento de medicamentos LASA (Look-alike, sound-alike).`;
        return {
            resumo_executivo: resumo,
            acoes_sugeridas: [
                { acao: 'Revisão de POP de Dupla Checagem', setor: 'Enfermagem', prioridade: 'Alta' },
                { acao: 'Sinalização visual de medicamentos LASA', setor: 'Farmácia', prioridade: 'Média' }
            ]
        };
    });
}
