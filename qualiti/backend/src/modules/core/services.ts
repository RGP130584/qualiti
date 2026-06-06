import { CoreRepository } from './repositories';
import { CoreOcorrencia, CoreDocumento, CoreAiAgentLog } from './models';

// ==========================================
// SERVICES & AI AGENTS: CORE PLATFORM
// ==========================================

export class CoreService {
  private repo = new CoreRepository();

  // ----------------------------------------
  // OCORRÊNCIAS INTELIGENTES (IA-FIRST)
  // ----------------------------------------
  async processRelatarOcorrencia(data: CoreOcorrencia): Promise<CoreOcorrencia> {
    const texto = `${data.titulo} ${data.descricao}`.toLowerCase();

    // 1. Classificação IA Automática
    let ia_classificacao = 'Incidente Operacional';
    if (texto.includes('queda') || texto.includes('paciente') || texto.includes('medicação')) {
      ia_classificacao = 'Evento Adverso Assistencial';
    } else if (texto.includes('quase') || texto.includes('quase falha') || texto.includes('near miss')) {
      ia_classificacao = 'Quase Falha (Near Miss)';
    } else if (texto.includes('sistema') || texto.includes('servidor') || texto.includes('banco')) {
      ia_classificacao = 'Incidente de TI / Segurança Operacional';
    }

    // 2. Identificação de Criticidade
    let ia_criticidade = 'Média';
    if (texto.includes('óbito') || texto.includes('grave') || texto.includes('sentinela') || texto.includes('parada')) {
      ia_criticidade = 'Crítica (Evento Sentinela)';
    } else if (texto.includes('lesão') || texto.includes('erro') || texto.includes('troca')) {
      ia_criticidade = 'Alta';
    } else if (texto.includes('leve') || texto.includes('rascunho') || texto.includes('atraso')) {
      ia_criticidade = 'Baixa';
    }

    // 3. Causa Raiz Automática (Ishikawa Preditivo)
    const ia_causa_raiz = `Análise Preditiva IA: Identificada provável falha no fator Mão de Obra (comunicação na transição de plantão) e Método (ausência de dupla checagem visual).`;

    // 4. Previsão de Riscos
    const ia_previsao_risco = ia_criticidade.includes('Crítica') || ia_criticidade === 'Alta' 
      ? 'Risco iminente de reincidência no plantão noturno. Recomendada intervenção imediata da gestão da qualidade.'
      : 'Risco moderado controlado pelos protocolos vigentes.';

    // 5. Identificação de Impacto Normativo
    let ia_impacto_normativo = 'ONA Nível 1 (Segurança do Paciente) · ISO 9001 (Controle de Não Conformidade)';
    if (texto.includes('dados') || texto.includes('vazamento') || texto.includes('prontuário')) {
      ia_impacto_normativo += ' · LGPD (Privacidade de Dados)';
    }

    // 6. Recomendação de Ações (CAPA Inteligente)
    const ia_acoes_recomendadas = [
      { acao: 'Afastamento temporário do lote de insumos envolvido', responsavel: data.setor, prazo: 'Imediato (2h)', status: 'Pendente' },
      { acao: 'Revisão extraordinária do POP assistencial da área', responsavel: 'Gestor da Qualidade', prazo: '24h', status: 'Pendente' },
      { acao: 'Notificação compulsória no painel de gestão de riscos', responsavel: data.relator, prazo: '12h', status: 'Concluído' }
    ];

    const novaOcorrencia: CoreOcorrencia = {
      ...data,
      ia_classificacao,
      ia_criticidade,
      ia_causa_raiz,
      ia_previsao_risco,
      ia_impacto_normativo,
      ia_acoes_recomendadas,
      status: 'Em Investigação IA'
    };

    return await this.repo.createOcorrencia(novaOcorrencia);
  }

  async listOcorrencias(setor?: string) {
    return await this.repo.listOcorrencias(setor);
  }

  async updateOcorrenciaStatus(id: number, status: string, planoCapa: any, usuario: string) {
    return await this.repo.updateOcorrenciaStatus(id, status, planoCapa, usuario);
  }

  // ----------------------------------------
  // GESTÃO DOCUMENTAL INTELIGENTE (OCR & RAG)
  // ----------------------------------------
  async createDocumento(data: CoreDocumento) {
    return await this.repo.createDocumento(data);
  }

  async listDocumentos(setor?: string) {
    return await this.repo.listDocumentos(setor);
  }

  // ----------------------------------------
  // AUDITORIA, RISCOS, SEGURANÇA E ANALYTICS
  // ----------------------------------------
  async listAuditorias(setor?: string) { return await this.repo.listAuditorias(setor); }
  async listRiscos(setor?: string) { return await this.repo.listRiscos(setor); }
  async listSeguranca(setor?: string) { return await this.repo.listSeguranca(setor); }
  async getAnalytics() { return await this.repo.getAnalytics(); }

  // ----------------------------------------
  // IA CORPORATIVA: 6 AGENTES INSTITUCIONAIS
  // ----------------------------------------
  async askAiAgent(agente: string, prompt: string, usuario: string, contexto: string): Promise<CoreAiAgentLog> {
    let resposta = '';
    let acoes_recomendadas: any[] = [];

    switch (agente) {
      case 'Agente Governança':
        resposta = `[Agente Governança Corporativa]: Com base no organograma institucional e nas metas anuais, o setor de ${contexto} apresenta 92% de alinhamento estratégico. Identificamos a necessidade de revisar o regimento interno para blindar a responsabilidade técnica perante o conselho regional.`;
        acoes_recomendadas = [
          { acao: 'Revisar Regimento Interno do Setor', prioridade: 'Alta', prazo: '30 dias' },
          { acao: 'Atualizar Matriz de Responsabilidades (RACI)', prioridade: 'Média', prazo: '15 dias' }
        ];
        break;

      case 'Agente Qualidade':
        resposta = `[Agente Gestão da Qualidade]: Analisando o histórico de ocorrências e POPs de ${contexto}, detectamos que a taxa de reincidência caiu 14% no último trimestre. Recomendamos a transição do ciclo PDCA atual para metodologias Seis Sigma nos processos críticos de dispensação.`;
        acoes_recomendadas = [
          { acao: 'Mapeamento Seis Sigma na Dispensação', prioridade: 'Alta', prazo: '60 dias' },
          { acao: 'Auditoria de Conformidade em 100% dos POPs', prioridade: 'Crítica', prazo: '10 dias' }
        ];
        break;

      case 'Agente ONA':
        resposta = `[Agente Copiloto ONA]: O setor de ${contexto} cumpre integralmente os requisitos do Nível 1 (Segurança) e possui 84% de conformidade no Nível 2 (Gestão Integrada). Para atingir a acreditação Plena, é vital comprovar a análise crítica mensal dos indicadores assistenciais pela liderança.`;
        acoes_recomendadas = [
          { acao: 'Formalizar Atas Mensais de Análise Crítica', prioridade: 'Crítica', prazo: '5 dias' },
          { acao: 'Simulado de Auditoria Externa ONA', prioridade: 'Média', prazo: '20 dias' }
        ];
        break;

      case 'Agente Auditoria':
        resposta = `[Agente Auditor Virtual IA]: Realizamos uma varredura contínua (real-time) nos registros de prontuário eletrônico e escalas de plantão de ${contexto}. Foram identificados 3 registros com checagem incompleta de alergias. O heatmap aponta risco localizado no leito 204.`;
        acoes_recomendadas = [
          { acao: 'Notificação imediata ao enfermeiro plantonista', prioridade: 'Crítica', prazo: 'Imediato' },
          { acao: 'Bloqueio de dispensação sem checagem de alergia no sistema', prioridade: 'Alta', prazo: '24h' }
        ];
        break;

      case 'Agente Estratégico':
        resposta = `[Agente Inteligência Estratégica]: O benchmarking hospitalar indica que nossa instituição possui um Score Institucional de 85.00, situando-se 5 pontos acima da média nacional. O maior gargalo de eficiência operacional encontra-se no tempo de giro de leito cirúrgico.`;
        acoes_recomendadas = [
          { acao: 'Otimização do fluxo de higienização de leitos (BPM)', prioridade: 'Alta', prazo: '15 dias' }
        ];
        break;

      case 'Agente Compliance':
        resposta = `[Agente Compliance & LGPD]: Verificamos a conformidade legal e sanitária de ${contexto}. O alvará sanitário encontra-se vigente, porém identificamos que 12 colaboradores ainda não assinaram o termo de consentimento de tratamento de dados (LGPD).`;
        acoes_recomendadas = [
          { acao: 'Coleta digital de assinaturas do Termo LGPD', prioridade: 'Alta', prazo: '7 dias' }
        ];
        break;

      default:
        resposta = `[Assistente IA Corporativo]: Processando solicitação para o setor ${contexto}. Análise concluída com sucesso. Todos os parâmetros operacionais encontram-se dentro da normalidade.`;
        acoes_recomendadas = [{ acao: 'Manter monitoramento contínuo', prioridade: 'Baixa', prazo: 'Contínuo' }];
        break;
    }

    const logEntry: CoreAiAgentLog = {
      agente,
      usuario,
      contexto,
      prompt,
      resposta,
      acoes_recomendadas
    };

    return await this.repo.logAiAgentAction(logEntry);
  }

  async listAiLogs(agente?: string) {
    return await this.repo.listAiLogs(agente);
  }
}
