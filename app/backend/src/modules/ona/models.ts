import { Pool } from 'pg';

// ==========================================
// INTERFACES TYPESCRIPT (CLEAN ARCHITECTURE)
// ==========================================

export interface OnaDiagnostico {
  id?: number;
  requisito: string;
  categoria: string;
  nivel_ona: number;
  setor: string;
  status: 'Conforme' | 'Parcial' | 'Não Conforme';
  criticidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  evidencias: string[];
  responsavel: string;
  prazo: Date | string;
  gap_analysis: string;
  score_conformidade: number; // 0 a 100
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface OnaEvidencia {
  id?: number;
  requisito_id: number;
  nome_arquivo: string;
  tipo_arquivo: 'PDF' | 'DOCX' | 'XLSX' | 'OUTRO';
  versao: string;
  status_aprovacao: 'Pendente' | 'Aprovado' | 'Rejeitado';
  autor: string;
  ocr_texto?: string;
  embeddings?: number[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface OnaChecklist {
  id?: number;
  nivel_ona: number; // 1, 2, 3
  secao: string;
  requisito_codigo: string;
  pergunta: string;
  conformidade: 'Conforme' | 'Parcial' | 'Não Conforme';
  pontuacao: number; // 0, 50, 100
  observacoes?: string;
  evidencias_vinculadas: string[];
  audit_trail: any[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface OnaAuditoria {
  id?: number;
  titulo: string;
  setor: string;
  tipo_auditoria: 'Interna' | 'Externa';
  data_auditoria: Date | string;
  auditor_responsavel: string;
  score_geral: number; // 0 a 100
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada';
  evidencias_registradas: string[];
  nao_conformidades: any[];
  plano_corretivo_capa: any[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface OnaPlanoAcao {
  id?: number;
  nao_conformidade_origem: string;
  plano_corretivo: string;
  responsavel: string;
  sla_horas: number;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  workflow_status: 'Pendente' | 'Em Execução' | 'Em Validação' | 'Concluído';
  data_limite: Date | string;
  alertas_enviados: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface OnaKpi {
  id?: number;
  codigo: string;
  nome: string;
  categoria: string;
  valor_atual: number;
  meta: number;
  tendencia: 'Subindo' | 'Estável' | 'Descendo';
  historico_mensal: { mes: string; valor: number }[];
  heatmap_data: { setor: string; conformidade: number }[];
  created_at?: Date;
  updated_at?: Date;
}

// ==========================================
// FUNÇÃO DE INICIALIZAÇÃO DE TABELAS (DDL)
// ==========================================

export async function initOnaTables(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('Inicializando tabelas do Módulo ONA (Clean Architecture)...');

    // 1. Tabela de Diagnóstico ONA
    await client.query(`
      CREATE TABLE IF NOT EXISTS ona_diagnosticos (
        id SERIAL PRIMARY KEY,
        requisito VARCHAR(255) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        nivel_ona INTEGER NOT NULL,
        setor VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Parcial',
        criticidade VARCHAR(50) DEFAULT 'Média',
        evidencias JSONB DEFAULT '[]'::jsonb,
        responsavel VARCHAR(255) NOT NULL,
        prazo TIMESTAMP,
        gap_analysis TEXT,
        score_conformidade NUMERIC(5,2) DEFAULT 50.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
      );
    `);

    // 2. Tabela de Gestão de Evidências (com suporte a OCR e Embeddings de RAG)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ona_evidencias (
        id SERIAL PRIMARY KEY,
        requisito_id INTEGER REFERENCES ona_diagnosticos(id) ON DELETE CASCADE,
        nome_arquivo VARCHAR(255) NOT NULL,
        tipo_arquivo VARCHAR(20) NOT NULL,
        versao VARCHAR(20) DEFAULT '1.0',
        status_aprovacao VARCHAR(50) DEFAULT 'Pendente',
        autor VARCHAR(255) NOT NULL,
        ocr_texto TEXT,
        embeddings JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
      );
    `);

    // 3. Tabela de Checklist ONA
    await client.query(`
      CREATE TABLE IF NOT EXISTS ona_checklists (
        id SERIAL PRIMARY KEY,
        nivel_ona INTEGER NOT NULL,
        secao VARCHAR(100) NOT NULL,
        requisito_codigo VARCHAR(50) NOT NULL,
        pergunta TEXT NOT NULL,
        conformidade VARCHAR(50) DEFAULT 'Parcial',
        pontuacao NUMERIC(5,2) DEFAULT 50.00,
        observacoes TEXT,
        evidencias_vinculadas JSONB DEFAULT '[]'::jsonb,
        audit_trail JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
      );
    `);

    // 4. Tabela de Auditoria ONA
    await client.query(`
      CREATE TABLE IF NOT EXISTS ona_auditorias (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        tipo_auditoria VARCHAR(50) DEFAULT 'Interna',
        data_auditoria TIMESTAMP NOT NULL,
        auditor_responsavel VARCHAR(255) NOT NULL,
        score_geral NUMERIC(5,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Agendada',
        evidencias_registradas JSONB DEFAULT '[]'::jsonb,
        nao_conformidades JSONB DEFAULT '[]'::jsonb,
        plano_corretivo_capa JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
      );
    `);

    // 5. Tabela de Plano de Ação (CAPA / SLAs)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ona_planos_acao (
        id SERIAL PRIMARY KEY,
        nao_conformidade_origem TEXT NOT NULL,
        plano_corretivo TEXT NOT NULL,
        responsavel VARCHAR(255) NOT NULL,
        sla_horas INTEGER DEFAULT 24,
        prioridade VARCHAR(50) DEFAULT 'Média',
        workflow_status VARCHAR(50) DEFAULT 'Pendente',
        data_limite TIMESTAMP,
        alertas_enviados BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
      );
    `);

    // 6. Tabela de Indicadores e KPIs ONA
    await client.query(`
      CREATE TABLE IF NOT EXISTS ona_kpis (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        valor_atual NUMERIC(10,2) DEFAULT 0.00,
        meta NUMERIC(10,2) DEFAULT 100.00,
        tendencia VARCHAR(50) DEFAULT 'Estável',
        historico_mensal JSONB DEFAULT '[]'::jsonb,
        heatmap_data JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Tabela de Logs de IA ONA (Trilha de auditoria do Copiloto)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ona_ai_logs (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(255) NOT NULL,
        pergunta TEXT NOT NULL,
        resposta TEXT NOT NULL,
        requisitos_referenciados JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tabelas do Módulo ONA criadas com sucesso!');
  } catch (err) {
    console.error('Erro ao inicializar tabelas do Módulo ONA:', err);
    throw err;
  } finally {
    client.release();
  }
}
