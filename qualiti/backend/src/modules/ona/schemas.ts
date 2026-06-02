// ==========================================
// SCHEMAS DE VALIDAÇÃO (FASTIFY & TYPESCRIPT)
// ==========================================

export const OnaDiagnosticoCreateSchema = {
  body: {
    type: 'object',
    required: ['requisito', 'categoria', 'nivel_ona', 'setor', 'responsavel'],
    properties: {
      requisito: { type: 'string' },
      categoria: { type: 'string' },
      nivel_ona: { type: 'integer', minimum: 1, maximum: 3 },
      setor: { type: 'string' },
      status: { type: 'string', enum: ['Conforme', 'Parcial', 'Não Conforme'] },
      criticidade: { type: 'string', enum: ['Baixa', 'Média', 'Alta', 'Crítica'] },
      evidencias: { type: 'array', items: { type: 'string' } },
      responsavel: { type: 'string' },
      prazo: { type: 'string' },
      gap_analysis: { type: 'string' },
      score_conformidade: { type: 'number', minimum: 0, maximum: 100 }
    }
  }
};

export const OnaEvidenciaCreateSchema = {
  body: {
    type: 'object',
    required: ['requisito_id', 'nome_arquivo', 'tipo_arquivo', 'autor'],
    properties: {
      requisito_id: { type: 'integer' },
      nome_arquivo: { type: 'string' },
      tipo_arquivo: { type: 'string', enum: ['PDF', 'DOCX', 'XLSX', 'OUTRO'] },
      versao: { type: 'string' },
      status_aprovacao: { type: 'string', enum: ['Pendente', 'Aprovado', 'Rejeitado'] },
      autor: { type: 'string' },
      ocr_texto: { type: 'string' }
    }
  }
};

export const OnaChecklistUpdateSchema = {
  body: {
    type: 'object',
    required: ['conformidade', 'pontuacao', 'usuario'],
    properties: {
      conformidade: { type: 'string', enum: ['Conforme', 'Parcial', 'Não Conforme'] },
      pontuacao: { type: 'number', minimum: 0, maximum: 100 },
      observacoes: { type: 'string' },
      evidencias_vinculadas: { type: 'array', items: { type: 'string' } },
      usuario: { type: 'string' }
    }
  }
};

export const OnaAuditoriaCreateSchema = {
  body: {
    type: 'object',
    required: ['titulo', 'setor', 'tipo_auditoria', 'data_auditoria', 'auditor_responsavel'],
    properties: {
      titulo: { type: 'string' },
      setor: { type: 'string' },
      tipo_auditoria: { type: 'string', enum: ['Interna', 'Externa'] },
      data_auditoria: { type: 'string' },
      auditor_responsavel: { type: 'string' },
      score_geral: { type: 'number' },
      status: { type: 'string', enum: ['Agendada', 'Em Andamento', 'Concluída', 'Cancelada'] },
      evidencias_registradas: { type: 'array', items: { type: 'string' } },
      nao_conformidades: { type: 'array', items: { type: 'object' } },
      plano_corretivo_capa: { type: 'array', items: { type: 'object' } }
    }
  }
};

export const OnaPlanoAcaoCreateSchema = {
  body: {
    type: 'object',
    required: ['nao_conformidade_origem', 'plano_corretivo', 'responsavel', 'sla_horas', 'prioridade'],
    properties: {
      nao_conformidade_origem: { type: 'string' },
      plano_corretivo: { type: 'string' },
      responsavel: { type: 'string' },
      sla_horas: { type: 'integer' },
      prioridade: { type: 'string', enum: ['Baixa', 'Média', 'Alta', 'Crítica'] },
      workflow_status: { type: 'string', enum: ['Pendente', 'Em Execução', 'Em Validação', 'Concluído'] },
      data_limite: { type: 'string' }
    }
  }
};

export const OnaAiQuerySchema = {
  body: {
    type: 'object',
    required: ['pergunta', 'usuario'],
    properties: {
      pergunta: { type: 'string' },
      usuario: { type: 'string' },
      setor_contexto: { type: 'string' }
    }
  }
};
