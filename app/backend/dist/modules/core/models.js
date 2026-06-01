"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCoreTables = initCoreTables;
async function initCoreTables(pool) {
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS core_documentos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        versao VARCHAR(20) DEFAULT '1.0',
        conteudo TEXT NOT NULL,
        autor VARCHAR(100) NOT NULL,
        status_aprovacao VARCHAR(50) DEFAULT 'Pendente',
        ocr_texto TEXT,
        embeddings JSONB,
        documentos_impactados JSONB DEFAULT '[]'::jsonb,
        rastreabilidade_normas JSONB DEFAULT '[]'::jsonb,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS core_analytics (
        id SERIAL PRIMARY KEY,
        score_institucional NUMERIC(5,2) DEFAULT 85.00,
        tendencia_geral VARCHAR(50) DEFAULT 'Estável',
        benchmarking_mercado NUMERIC(5,2) DEFAULT 80.00,
        alertas_inteligentes JSONB DEFAULT '[]'::jsonb,
        bi_operacional_data JSONB DEFAULT '{}'::jsonb,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Tabelas da Core Platform (Governança e Inteligência Operacional) inicializadas com sucesso.');
    }
    catch (err) {
        console.error('Erro ao inicializar tabelas da Core Platform:', err);
        throw err;
    }
    finally {
        client.release();
    }
}
