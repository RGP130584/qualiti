import { Pool } from 'pg';

// ==========================================
// MODELS & DDL: CORE PLATFORM (CLEAN ARCHITECTURE)
// ==========================================

export interface CoreOcorrencia {
  id?: number;
  titulo: string;
  descricao: string;
  setor: string;
  relator: string;
  data_relato?: string;
  // Classificação IA Automática
  ia_classificacao?: string;
  ia_criticidade?: string;
  ia_causa_raiz?: string;
  ia_previsao_risco?: string;
  ia_impacto_normativo?: string;
  ia_acoes_recomendadas?: any;
  // Correlação e CAPA
  eventos_correlacionados?: any;
  plano_capa?: any;
  status: string;
  // Legacy incidents fields
  tipo?: string;
  severidade?: string;
  causa_raiz_ishikawa?: any;
  plano_acao_capa?: any;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface CoreDocumento {
  id?: number;
  codigo: string;
  titulo: string;
  categoria: string;
  setor: string;
  versao: string;
  conteudo: string;
  autor: string;
  status_aprovacao: string;
  ocr_texto?: string;
  embeddings?: any;
  documentos_impactados?: any;
  rastreabilidade_normas?: any;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface CoreAuditoria {
  id?: number;
  titulo: string;
  setor: string;
  tipo: string;
  auditor: string;
  checklist_dinamico?: any;
  score_conformidade: number;
  heatmap_data?: any;
  ia_auditor_virtual?: string;
  status: string;
  created_at?: string;
}

export interface CoreRisco {
  id?: number;
  codigo: string;
  descricao: string;
  setor: string;
  categoria: string;
  score_risco: number;
  risco_preditivo_ia?: string;
  mapa_dinamico_coords?: any;
  correlao_eventos?: any;
  status: string;
  created_at?: string;
}

export interface CoreSeguranca {
  id?: number;
  evento: string;
  protocolo_acionado: string;
  tipo_evento: string; // Evento Adverso, Near Miss
  setor: string;
  rastreabilidade_indicadores?: any;
  status: string;
  created_at?: string;
}

export interface CoreAnalytics {
  id?: number;
  score_institucional: number;
  tendencia_geral: string;
  benchmarking_mercado: number;
  alertas_inteligentes?: any;
  bi_operacional_data?: any;
  created_at?: string;
}

export interface CoreAiAgentLog {
  id?: number;
  agente: string; // Agente Governança, Agente Qualidade, Agente ONA, Agente Auditoria, Agente Estratégico, Agente Compliance
  usuario: string;
  contexto: string;
  prompt: string;
  resposta: string;
  acoes_recomendadas?: any;
  created_at?: string;
}

export async function initCoreTables(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS core_ocorrencias (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        setor VARCHAR(100) NOT NULL,
        relator VARCHAR(100) NOT NULL,
        data_relato TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ia_classificacao VARCHAR(100),
        ia_criticidade VARCHAR(50),
        ia_causa_raiz TEXT,
        ia_previsao_risco TEXT,
        ia_impacto_normativo TEXT,
        ia_acoes_recomendadas JSONB DEFAULT '[]'::jsonb,
        eventos_correlacionados JSONB DEFAULT '[]'::jsonb,
        plano_capa JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'Pendente',
        tipo VARCHAR(100),
        severidade VARCHAR(50),
        causa_raiz_ishikawa JSONB DEFAULT '{}'::jsonb,
        plano_acao_capa JSONB DEFAULT '[]'::jsonb,
        tenant_id VARCHAR(100) DEFAULT 'Unidade Central',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS core_auditorias (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        auditor VARCHAR(100) NOT NULL,
        checklist_dinamico JSONB DEFAULT '[]'::jsonb,
        score_conformidade NUMERIC(5,2) DEFAULT 0.00,
        heatmap_data JSONB DEFAULT '[]'::jsonb,
        ia_auditor_virtual TEXT,
        status VARCHAR(50) DEFAULT 'Em Andamento',
        tenant_id VARCHAR(100) DEFAULT 'Unidade Central',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS core_riscos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        descricao TEXT NOT NULL,
        setor VARCHAR(100) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        score_risco NUMERIC(5,2) DEFAULT 0.00,
        risco_preditivo_ia TEXT,
        mapa_dinamico_coords JSONB DEFAULT '{}'::jsonb,
        correlao_eventos JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'Monitorado',
        tenant_id VARCHAR(100) DEFAULT 'Unidade Central',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS core_seguranca (
        id SERIAL PRIMARY KEY,
        evento VARCHAR(255) NOT NULL,
        protocolo_acionado VARCHAR(255) NOT NULL,
        tipo_evento VARCHAR(100) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        rastreabilidade_indicadores JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'Registrado',
        tenant_id VARCHAR(100) DEFAULT 'Unidade Central',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS core_analytics (
        id SERIAL PRIMARY KEY,
        score_institucional NUMERIC(5,2) DEFAULT 85.00,
        tendencia_geral VARCHAR(50) DEFAULT 'Estável',
        benchmarking_mercado NUMERIC(5,2) DEFAULT 80.00,
        alertas_inteligentes JSONB DEFAULT '[]'::jsonb,
        bi_operacional_data JSONB DEFAULT '{}'::jsonb,
        tenant_id VARCHAR(100) DEFAULT 'Unidade Central',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS core_ai_logs (
        id SERIAL PRIMARY KEY,
        agente VARCHAR(100) NOT NULL,
        usuario VARCHAR(100) NOT NULL,
        contexto VARCHAR(100) NOT NULL,
        prompt TEXT NOT NULL,
        resposta TEXT NOT NULL,
        acoes_recomendadas JSONB DEFAULT '[]'::jsonb,
        tenant_id VARCHAR(100) DEFAULT 'Unidade Central',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabelas da Core Platform (Governança e Inteligência Operacional) inicializadas com sucesso.');
  } catch (err) {
    console.error('Erro ao inicializar tabelas da Core Platform:', err);
    throw err;
  } finally {
    client.release();
  }
}
