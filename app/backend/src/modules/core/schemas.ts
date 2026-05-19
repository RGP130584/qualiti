// ==========================================
// SCHEMAS FASTIFY: CORE PLATFORM
// ==========================================

export const CoreOcorrenciaCreateSchema = {
  body: {
    type: 'object',
    required: ['titulo', 'descricao', 'setor', 'relator'],
    properties: {
      titulo: { type: 'string' },
      descricao: { type: 'string' },
      setor: { type: 'string' },
      relator: { type: 'string' }
    }
  }
};

export const CoreDocumentoCreateSchema = {
  body: {
    type: 'object',
    required: ['codigo', 'titulo', 'categoria', 'setor', 'conteudo', 'autor'],
    properties: {
      codigo: { type: 'string' },
      titulo: { type: 'string' },
      categoria: { type: 'string' },
      setor: { type: 'string' },
      conteudo: { type: 'string' },
      autor: { type: 'string' }
    }
  }
};

export const CoreAuditoriaCreateSchema = {
  body: {
    type: 'object',
    required: ['titulo', 'setor', 'tipo', 'auditor', 'score_conformidade'],
    properties: {
      titulo: { type: 'string' },
      setor: { type: 'string' },
      tipo: { type: 'string' },
      auditor: { type: 'string' },
      score_conformidade: { type: 'number' }
    }
  }
};

export const CoreAiAgentQuerySchema = {
  body: {
    type: 'object',
    required: ['agente', 'prompt', 'usuario', 'contexto'],
    properties: {
      agente: { type: 'string' },
      prompt: { type: 'string' },
      usuario: { type: 'string' },
      contexto: { type: 'string' }
    }
  }
};
