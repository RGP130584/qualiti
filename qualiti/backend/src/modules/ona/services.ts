import { 
  OnaDiagnosticoRepository, OnaEvidenciaRepository, 
  OnaChecklistRepository, OnaAuditoriaRepository, 
  OnaPlanoAcaoRepository, OnaKpiRepository, OnaAiLogRepository 
} from './repositories';
import { OnaDiagnostico, OnaEvidencia, OnaAuditoria, OnaPlanoAcao } from './models';

// ==========================================
// SERVICES (CLEAN ARCHITECTURE LAYER)
// ==========================================

export class OnaDiagnosticoService {
  private repo = new OnaDiagnosticoRepository();

  async getGapAnalysis(setor?: string, nivel?: number) {
    const list = await this.repo.findAll(setor, nivel);
    
    const total = list.length;
    if (total === 0) return { total: 0, score_geral: 0, gaps: [], conformidade_dist: { Conforme: 0, Parcial: 0, NaoConforme: 0 } };

    let sumScore = 0;
    let conforme = 0;
    let parcial = 0;
    let naoConforme = 0;
    const gaps: any[] = [];

    for (const item of list) {
      sumScore += Number(item.score_conformidade);
      if (item.status === 'Conforme') conforme++;
      else if (item.status === 'Parcial') {
        parcial++;
        gaps.push({ id: item.id, requisito: item.requisito, setor: item.setor, criticidade: item.criticidade, gap: item.gap_analysis, prazo: item.prazo });
      } else {
        naoConforme++;
        gaps.push({ id: item.id, requisito: item.requisito, setor: item.setor, criticidade: item.criticidade, gap: item.gap_analysis, prazo: item.prazo });
      }
    }

    const score_geral = Number((sumScore / total).toFixed(2));

    return {
      total,
      score_geral,
      conformidade_dist: { Conforme: conforme, Parcial: parcial, NaoConforme: naoConforme },
      gaps
    };
  }

  async createDiagnostico(data: OnaDiagnostico, usuario: string) {
    return await this.repo.create(data, usuario);
  }

  async updateDiagnostico(id: number, data: Partial<OnaDiagnostico>, usuario: string) {
    return await this.repo.update(id, data, usuario);
  }

  async deleteDiagnostico(id: number, usuario: string) {
    return await this.repo.softDelete(id, usuario);
  }
}

export class OnaEvidenciaService {
  private repo = new OnaEvidenciaRepository();

  async listEvidencias(requisito_id?: number) {
    return await this.repo.findAll(requisito_id);
  }

  async processEvidenceUpload(data: OnaEvidencia, usuario: string) {
    // Simulação avançada de OCR e Geração de Embeddings (RAG / Vector DB)
    const ocrSimulado = `[OCR AUTOMÁTICO - INSTITUIÇÃO QUALITAOS]\nDocumento: ${data.nome_arquivo}\nConteúdo extraído referente ao requisito normativo. O processo atende às exigências de segurança do paciente, rastreabilidade de insumos e padronização operacional descrita no manual ONA.`;
    
    // Simulação de Vetor de Embeddings (384 dimensões mockado para busca semântica)
    const embeddingsMock = Array.from({ length: 10 }, () => Number((Math.random() * 2 - 1).toFixed(4)));

    const evidenciaCompleta: OnaEvidencia = {
      ...data,
      ocr_texto: ocrSimulado,
      embeddings: embeddingsMock,
      status_aprovacao: 'Pendente'
    };

    return await this.repo.create(evidenciaCompleta, usuario);
  }

  async evaluateEvidence(id: number, status: 'Aprovado' | 'Rejeitado', usuario: string) {
    return await this.repo.updateStatus(id, status, usuario);
  }

  async deleteEvidence(id: number, usuario: string) {
    return await this.repo.softDelete(id, usuario);
  }
}

export class OnaChecklistService {
  private repo = new OnaChecklistRepository();

  async listChecklists(nivel?: number) {
    return await this.repo.findAll(nivel);
  }

  async executeChecklistValuation(id: number, conformidade: 'Conforme' | 'Parcial' | 'Não Conforme', pontuacao: number, observacoes: string, evidencias: string[], usuario: string) {
    return await this.repo.updateConformidade(id, conformidade, pontuacao, observacoes, evidencias, usuario);
  }
}

export class OnaAuditoriaService {
  private repoAuditoria = new OnaAuditoriaRepository();
  private repoPlano = new OnaPlanoAcaoRepository();

  async listAuditorias(setor?: string) {
    return await this.repoAuditoria.findAll(setor);
  }

  async createAuditoriaWithCapas(data: OnaAuditoria, usuario: string) {
    const auditoria = await this.repoAuditoria.create(data, usuario);

    // Automação: Criar Planos de Ação (CAPA) automaticamente para cada Não Conformidade registrada
    if (data.nao_conformidades && data.nao_conformidades.length > 0) {
      for (const nc of data.nao_conformidades) {
        const plano: OnaPlanoAcao = {
          nao_conformidade_origem: `Auditoria #${auditoria.id}: ${nc.descricao || 'Não Conformidade identificada'}`,
          plano_corretivo: nc.acao_recomendada || 'Elaborar procedimento corretivo imediato',
          responsavel: nc.responsavel || data.auditor_responsavel,
          sla_horas: nc.criticidade === 'Crítica' ? 24 : 72,
          prioridade: nc.criticidade || 'Média',
          workflow_status: 'Pendente',
          data_limite: new Date(Date.now() + (nc.criticidade === 'Crítica' ? 24 : 72) * 3600 * 1000),
          alertas_enviados: false
        };
        await this.repoPlano.create(plano, usuario);
      }
    }

    return auditoria;
  }

  async updateAuditoriaStatus(id: number, status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada', score: number, usuario: string) {
    return await this.repoAuditoria.updateStatus(id, status, score, usuario);
  }
}

export class OnaPlanoAcaoService {
  private repo = new OnaPlanoAcaoRepository();

  async listPlanos() {
    return await this.repo.findAll();
  }

  async createPlano(data: OnaPlanoAcao, usuario: string) {
    return await this.repo.create(data, usuario);
  }

  async updateStatus(id: number, status: 'Pendente' | 'Em Execução' | 'Em Validação' | 'Concluído', usuario: string) {
    return await this.repo.updateWorkflowStatus(id, status, usuario);
  }
}

export class OnaKpiService {
  private repoKpi = new OnaKpiRepository();
  private repoDiag = new OnaDiagnosticoRepository();
  private repoAud = new OnaAuditoriaRepository();
  private repoPlano = new OnaPlanoAcaoRepository();

  async getExecutiveDashboard() {
    const kpis = await this.repoKpi.findAll();
    const diagnosticos = await this.repoDiag.findAll();
    const auditorias = await this.repoAud.findAll();
    const planos = await this.repoPlano.findAll();

    // Cálculos dinâmicos de BI & Analytics ONA
    const totalReqs = diagnosticos.length;
    const conformes = diagnosticos.filter(d => d.status === 'Conforme').length;
    const conformidadeGeral = totalReqs > 0 ? Number(((conformes / totalReqs) * 100).toFixed(1)) : 0;

    const pendenciasCriticas = diagnosticos.filter(d => d.status !== 'Conforme' && d.criticidade === 'Crítica').length;
    const totalAuditorias = auditorias.length;
    const capasAbertas = planos.filter(p => p.workflow_status !== 'Concluído').length;

    // Distribuição por Setor
    const setorMap: Record<string, { total: number; conforme: number }> = {};
    for (const d of diagnosticos) {
      if (!setorMap[d.setor]) setorMap[d.setor] = { total: 0, conforme: 0 };
      setorMap[d.setor].total++;
      if (d.status === 'Conforme') setorMap[d.setor].conforme++;
    }

    const conformidadePorSetor = Object.entries(setorMap).map(([setor, val]) => ({
      setor,
      conformidade: Number(((val.conforme / val.total) * 100).toFixed(1))
    }));

    return {
      conformidade_geral: conformidadeGeral,
      pendencias_criticas: pendenciasCriticas,
      auditorias_realizadas: totalAuditorias,
      capas_abertas: capasAbertas,
      maturidade_institucional: conformidadeGeral > 80 ? 'Nível 3 (Excelência)' : conformidadeGeral > 60 ? 'Nível 2 (Pleno)' : 'Nível 1 (Acreditado)',
      kpis_cadastrados: kpis,
      conformidade_por_setor: conformidadePorSetor
    };
  }
}

export class OnaAiService {
  private repoLog = new OnaAiLogRepository();
  private repoDiag = new OnaDiagnosticoRepository();

  async askCopilot(pergunta: string, usuario: string, setorContexto?: string) {
    const diagnosticos = await this.repoDiag.findAll(setorContexto);
    
    // RAG Simulado (Busca Semântica na Base de Conhecimento ONA)
    const reqsRelacionados = diagnosticos.slice(0, 3).map(d => ({
      codigo: d.requisito,
      setor: d.setor,
      status: d.status,
      gap: d.gap_analysis
    }));

    let respostaIA = '';
    const pLower = pergunta.toLowerCase();

    if (pLower.includes('gap') || pLower.includes('pendência')) {
      const pendentes = diagnosticos.filter(d => d.status !== 'Conforme');
      respostaIA = `Analisando os requisitos do setor ${setorContexto || 'Geral'}, identifiquei ${pendentes.length} gaps normativos principais. Recomendo priorizar a adequação de POPs e treinar a equipe assistencial para mitigar riscos de segurança do paciente.`;
    } else if (pLower.includes('evidência') || pLower.includes('documento')) {
      respostaIA = `Para comprovar conformidade com a ONA, você deve anexar atas de comissão de segurança, POPs assinados, registros de prontuário e relatórios de indicadores assistenciais na aba de Gestão de Evidências.`;
    } else if (pLower.includes('plano') || pLower.includes('ação') || pLower.includes('capa')) {
      respostaIA = `Para abrir um Plano de Ação (CAPA) eficaz, utilize a metodologia 5W2H, defina um responsável técnico direto e estabeleça um SLA de resolução inferior a 72 horas para não conformidades moderadas/graves.`;
    } else {
      respostaIA = `Como Copiloto de Acreditação ONA da plataforma QualitaOS, analisei sua solicitação. Com base nas normas da Organização Nacional de Acreditação, a governança clínica e a gestão de riscos devem ser tratadas de forma contínua e integrada. Os requisitos vinculados mostram o status atual da sua instituição.`;
    }

    // Registra a trilha de auditoria da IA
    const log = await this.repoLog.createLog(usuario, pergunta, respostaIA, reqsRelacionados);

    return {
      pergunta,
      resposta: respostaIA,
      requisitos_contexto: reqsRelacionados,
      log_id: log.id
    };
  }

  async getAiHistory() {
    return await this.repoLog.getRecentLogs();
  }
}
