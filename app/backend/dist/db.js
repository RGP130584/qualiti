"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("./modules/ona/models");
const seeds_1 = require("./modules/ona/seeds");
const models_2 = require("./modules/core/models");
const seeds_2 = require("./modules/core/seeds");
const documentosData_1 = require("./modules/core/documentosData");
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://qualita:qualita_secure_pw@localhost:5432/qualitaos',
});
async function initDb() {
    let client = null;
    let retries = 10;
    while (retries > 0) {
        try {
            client = await pool.connect();
            break;
        }
        catch (err) {
            console.log(`Aguardando banco de dados iniciar... (${retries} tentativas restantes)`);
            retries--;
            if (retries === 0)
                throw err;
            await new Promise(res => setTimeout(res, 2000));
        }
    }
    if (!client)
        return;
    try {
        console.log('Verificando e inicializando tabelas do banco de dados...');
        // Tabela de Instituição (Wizard)
        await client.query(`
      CREATE TABLE IF NOT EXISTS instituicao (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        logo TEXT,
        configurado BOOLEAN DEFAULT FALSE,
        modulos_ativos JSONB DEFAULT '[]'::jsonb
      );
    `);
        // Tabela de Usuários (RBAC / Acesso)
        await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        rbac_role VARCHAR(50) DEFAULT 'Gestor da Qualidade',
        departamento VARCHAR(100) DEFAULT 'Geral',
        unidade VARCHAR(100) DEFAULT 'Unidade Central',
        mfa_enabled BOOLEAN DEFAULT FALSE,
        mfa_secret VARCHAR(255),
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de Funções Cadastradas (Menu Editável de Cargos)
        await client.query(`
      CREATE TABLE IF NOT EXISTS funcoes_cadastradas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) UNIQUE NOT NULL,
        is_rt BOOLEAN DEFAULT FALSE,
        descricao TEXT,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de POPs
        await client.query(`
      CREATE TABLE IF NOT EXISTS pops (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        versao VARCHAR(20) DEFAULT '1.0',
        setor VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Aprovado',
        conteudo TEXT NOT NULL,
        autor VARCHAR(255) DEFAULT 'Admin',
        aprovador VARCHAR(255) DEFAULT 'Diretoria',
        qrcode TEXT,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_revisao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de Histórico de Versões de POPs
        await client.query(`
      CREATE TABLE IF NOT EXISTS pop_versoes (
        id SERIAL PRIMARY KEY,
        pop_id INTEGER REFERENCES pops(id) ON DELETE CASCADE,
        versao VARCHAR(20) NOT NULL,
        conteudo TEXT NOT NULL,
        autor VARCHAR(255) NOT NULL,
        data_modificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de Fluxos BPM
        await client.query(`
      CREATE TABLE IF NOT EXISTS bpm_fluxos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        bpmn_json JSONB DEFAULT '{}'::jsonb,
        status_ativo BOOLEAN DEFAULT TRUE,
        sla_horas INTEGER DEFAULT 24,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de Execuções BPM
        await client.query(`
      CREATE TABLE IF NOT EXISTS bpm_execucoes (
        id SERIAL PRIMARY KEY,
        fluxo_id INTEGER REFERENCES bpm_fluxos(id) ON DELETE CASCADE,
        solicitante VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Em Andamento',
        etapa_atual VARCHAR(100) NOT NULL,
        log_execucao JSONB DEFAULT '[]'::jsonb,
        data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_fim TIMESTAMP
      );
    `);
        // Tabela de Requisitos ONA
        await client.query(`
      CREATE TABLE IF NOT EXISTS ona_requisitos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        nivel INTEGER NOT NULL,
        subsecao VARCHAR(100) NOT NULL,
        conformidade VARCHAR(50) DEFAULT 'Parcial',
        evidencias JSONB DEFAULT '[]'::jsonb,
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de Indicadores
        await client.query(`
      CREATE TABLE IF NOT EXISTS indicadores (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        meta NUMERIC(10,2) NOT NULL,
        meta_trimestral NUMERIC(10,2) DEFAULT 0,
        meta_anual NUMERIC(10,2) DEFAULT 0,
        valor_atual NUMERIC(10,2) DEFAULT 0,
        tendencia VARCHAR(20) DEFAULT 'Estável',
        periodicidade VARCHAR(50) DEFAULT 'Mensal'
      );
    `);
        // Adiciona colunas caso a tabela já exista de uma execução anterior
        await client.query(`
      ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS meta_trimestral NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS meta_anual NUMERIC(10,2) DEFAULT 0;
    `);
        // Tabela de Coletas de Indicadores
        await client.query(`
      CREATE TABLE IF NOT EXISTS indicador_coletas (
        id SERIAL PRIMARY KEY,
        indicador_id INTEGER REFERENCES indicadores(id) ON DELETE CASCADE,
        data_coleta DATE NOT NULL,
        valor NUMERIC(10,2) NOT NULL,
        responsavel VARCHAR(255) NOT NULL,
        observacao TEXT
      );
    `);
        // Tabela de Incidentes e CAPA
        await client.query(`
      CREATE TABLE IF NOT EXISTS incidentes (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        severidade VARCHAR(50) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Aberto',
        causa_raiz_ishikawa JSONB DEFAULT '{}'::jsonb,
        plano_acao_capa JSONB DEFAULT '[]'::jsonb,
        data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        relator VARCHAR(255) NOT NULL
      );
    `);
        // Tabela de Logs de Auditoria (LGPD / Event Sourcing)
        await client.query(`
      CREATE TABLE IF NOT EXISTS auditoria_logs (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(255) NOT NULL,
        acao VARCHAR(255) NOT NULL,
        entidade VARCHAR(100) NOT NULL,
        entidade_id VARCHAR(50),
        ip VARCHAR(50) DEFAULT '127.0.0.1',
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de Notificações
        await client.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        pop_id INTEGER REFERENCES pops(id) ON DELETE CASCADE,
        pop_titulo VARCHAR(255) NOT NULL,
        destinatario_email VARCHAR(255) NOT NULL,
        destinatario_papel VARCHAR(100) NOT NULL,
        mensagem TEXT NOT NULL,
        prazo_horas INTEGER DEFAULT 24,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_limite TIMESTAMP NOT NULL,
        data_envio TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Pendente'
      );
    `);
        // Adiciona colunas para controle do fluxo institucional de edição de POPs caso não existam
        await client.query(`
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS titulo_pendente VARCHAR(255);
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS versao_pendente VARCHAR(20);
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS conteudo_pendente TEXT;
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS status_edicao VARCHAR(50) DEFAULT 'Nenhuma';
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS data_limite TIMESTAMP;
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS notificacao_enviada BOOLEAN DEFAULT FALSE;
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS departamento VARCHAR(100) DEFAULT 'Geral';
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Procedimento';
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS tipo_documental VARCHAR(100) DEFAULT 'POP';
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS nivel_acesso VARCHAR(50) DEFAULT 'Geral';
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS instituicao_nome VARCHAR(255) DEFAULT 'Instituição de Internação QualitaOS';
      ALTER TABLE pops ADD COLUMN IF NOT EXISTS unidade_nome VARCHAR(100) DEFAULT 'Unidade Central';
    `);
        // Tabela de Configuração de Setores Dinâmicos
        await client.query(`
      CREATE TABLE IF NOT EXISTS setores_config (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) UNIQUE NOT NULL,
        departamento_pai VARCHAR(255),
        descricao TEXT,
        ativo BOOLEAN DEFAULT TRUE,
        permissoes_json JSONB DEFAULT '{}'::jsonb,
        categorias_customizadas JSONB DEFAULT '[]'::jsonb,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de Configuração de Cargos Dinâmicos
        await client.query(`
      CREATE TABLE IF NOT EXISTS cargos_config (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        setor_nome VARCHAR(255) NOT NULL,
        rbac_role VARCHAR(100) NOT NULL,
        permissoes_customizadas JSONB DEFAULT '{}'::jsonb,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de Configuração de Tipos Documentais Dinâmicos
        await client.query(`
      CREATE TABLE IF NOT EXISTS tipos_documentais_config (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) UNIQUE NOT NULL,
        categoria VARCHAR(255) NOT NULL,
        nivel_acesso_padrao VARCHAR(100) DEFAULT 'Geral',
        ativo BOOLEAN DEFAULT TRUE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS document_workflows (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        etapas_json JSONB DEFAULT '["rascunho", "revisão", "aprovação", "publicado", "revisão periódica"]'::jsonb,
        sla_horas_padrao INTEGER DEFAULT 48,
        ativo BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS document_templates (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        tipo_documental VARCHAR(100) NOT NULL,
        conteudo_rich_text TEXT NOT NULL,
        placeholders_json JSONB DEFAULT '["nome", "setor", "responsavel", "data"]'::jsonb,
        ativo BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS document_categories (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) UNIQUE NOT NULL,
        setor_alvo VARCHAR(100) DEFAULT 'Geral',
        subcategorias_json JSONB DEFAULT '[]'::jsonb,
        ativo BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS document_types (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) UNIQUE NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        descricao TEXT,
        workflow_id INTEGER REFERENCES document_workflows(id) ON DELETE SET NULL,
        template_id INTEGER REFERENCES document_templates(id) ON DELETE SET NULL,
        ativo BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS document_forms (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        tipo_documental VARCHAR(100) NOT NULL,
        setor VARCHAR(100) DEFAULT 'Geral',
        ativo BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS document_fields (
        id SERIAL PRIMARY KEY,
        form_id INTEGER REFERENCES document_forms(id) ON DELETE CASCADE,
        nome_campo VARCHAR(255) NOT NULL,
        tipo_campo VARCHAR(50) DEFAULT 'texto',
        opcoes_json JSONB DEFAULT '[]'::jsonb,
        obrigatorio BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS document_versions (
        id SERIAL PRIMARY KEY,
        documento_id INTEGER REFERENCES pops(id) ON DELETE CASCADE,
        versao VARCHAR(20) NOT NULL,
        conteudo TEXT NOT NULL,
        autor VARCHAR(255) NOT NULL,
        aprovador VARCHAR(255) DEFAULT 'Pendente',
        status VARCHAR(50) DEFAULT 'Aprovado',
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS document_permissions (
        id SERIAL PRIMARY KEY,
        tipo_documental VARCHAR(100) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        pode_criar BOOLEAN DEFAULT TRUE,
        pode_editar BOOLEAN DEFAULT TRUE,
        pode_aprovar BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS document_status (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(50) UNIQUE NOT NULL,
        cor VARCHAR(50) DEFAULT '#3b82f6'
      );

      CREATE TABLE IF NOT EXISTS document_slas (
        id SERIAL PRIMARY KEY,
        documento_id INTEGER REFERENCES pops(id) ON DELETE CASCADE,
        tipo_sla VARCHAR(50) DEFAULT 'revisão',
        prazo_horas INTEGER DEFAULT 24,
        data_limite TIMESTAMP NOT NULL,
        status_worker VARCHAR(50) DEFAULT 'pendente'
      );

      CREATE TABLE IF NOT EXISTS document_reviews (
        id SERIAL PRIMARY KEY,
        documento_id INTEGER REFERENCES pops(id) ON DELETE CASCADE,
        revisor_email VARCHAR(255) NOT NULL,
        parecer TEXT NOT NULL,
        aprovado BOOLEAN DEFAULT TRUE,
        data_revisao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de Configuração de Dashboards Contextuais Dinâmicos
        await client.query(`
      CREATE TABLE IF NOT EXISTS dashboards_config (
        id SERIAL PRIMARY KEY,
        perfil_ou_setor VARCHAR(255) NOT NULL,
        nome_visao VARCHAR(255) NOT NULL,
        widgets_json JSONB DEFAULT '[]'::jsonb,
        layout_json JSONB DEFAULT '{}'::jsonb,
        is_global BOOLEAN DEFAULT FALSE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Tabela de Configuração de Menus Dinâmicos
        await client.query(`
      CREATE TABLE IF NOT EXISTS menus_config (
        id SERIAL PRIMARY KEY,
        perfil_ou_setor VARCHAR(255) UNIQUE NOT NULL,
        itens_json JSONB DEFAULT '[]'::jsonb,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // ==========================================
        // TABELAS DE GESTÃO ESTRATÉGICA (OKRs)
        // ==========================================
        await client.query(`
      CREATE TABLE IF NOT EXISTS okrs (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        visao_estrategica VARCHAR(255) DEFAULT '3 Anos',
        periodo VARCHAR(100) DEFAULT '2026-2028',
        prioridade VARCHAR(50) DEFAULT 'Alta',
        responsavel VARCHAR(255) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Em Andamento',
        progresso NUMERIC(5,2) DEFAULT 0.00,
        score NUMERIC(3,2) DEFAULT 0.00,
        indicadores_vinculados JSONB DEFAULT '[]'::jsonb,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS key_results (
        id SERIAL PRIMARY KEY,
        okr_id INTEGER REFERENCES okrs(id) ON DELETE CASCADE,
        titulo VARCHAR(255) NOT NULL,
        meta VARCHAR(255) NOT NULL,
        valor_atual NUMERIC(10,2) DEFAULT 0.00,
        valor_alvo NUMERIC(10,2) NOT NULL,
        unidade VARCHAR(50) DEFAULT '%',
        progresso NUMERIC(5,2) DEFAULT 0.00,
        responsavel VARCHAR(255) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        prazo DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Em Andamento',
        peso INTEGER DEFAULT 1,
        data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS okr_cycles (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) DEFAULT 'Trimestral',
        data_inicio DATE NOT NULL,
        data_fim DATE NOT NULL,
        ativo BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS okr_progress (
        id SERIAL PRIMARY KEY,
        kr_id INTEGER REFERENCES key_results(id) ON DELETE CASCADE,
        valor NUMERIC(10,2) NOT NULL,
        nota TEXT,
        responsavel VARCHAR(255) NOT NULL,
        data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // ==========================================
        // TABELAS DE EDUCAÇÃO CORPORATIVA (LMS)
        // ==========================================
        await client.query(`
      CREATE TABLE IF NOT EXISTS education_courses (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        setor VARCHAR(100) NOT NULL,
        trilha VARCHAR(255) DEFAULT 'Geral',
        obrigatorio BOOLEAN DEFAULT FALSE,
        sla_horas INTEGER DEFAULT 72,
        carga_horaria INTEGER DEFAULT 4,
        capa_url TEXT,
        ativo BOOLEAN DEFAULT TRUE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS education_modules (
        id SERIAL PRIMARY KEY,
        curso_id INTEGER REFERENCES education_courses(id) ON DELETE CASCADE,
        titulo VARCHAR(255) NOT NULL,
        ordem INTEGER DEFAULT 1,
        descricao TEXT
      );

      CREATE TABLE IF NOT EXISTS education_lessons (
        id SERIAL PRIMARY KEY,
        modulo_id INTEGER REFERENCES education_modules(id) ON DELETE CASCADE,
        titulo VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) DEFAULT 'video',
        conteudo_url TEXT NOT NULL,
        duracao_minutos INTEGER DEFAULT 15,
        ordem INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS education_quizzes (
        id SERIAL PRIMARY KEY,
        licao_id INTEGER REFERENCES education_lessons(id) ON DELETE CASCADE,
        pergunta TEXT NOT NULL,
        opcoes JSONB NOT NULL,
        resposta_correta INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS education_progress (
        id SERIAL PRIMARY KEY,
        usuario_email VARCHAR(255) NOT NULL,
        licao_id INTEGER REFERENCES education_lessons(id) ON DELETE CASCADE,
        concluido BOOLEAN DEFAULT FALSE,
        data_conclusao TIMESTAMP,
        UNIQUE(usuario_email, licao_id)
      );

      CREATE TABLE IF NOT EXISTS education_certificates (
        id SERIAL PRIMARY KEY,
        usuario_email VARCHAR(255) NOT NULL,
        curso_id INTEGER REFERENCES education_courses(id) ON DELETE CASCADE,
        codigo_certificado VARCHAR(100) UNIQUE NOT NULL,
        data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS education_tracks (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        setor VARCHAR(100) NOT NULL,
        cursos_ids JSONB DEFAULT '[]'::jsonb,
        carga_horaria_total INTEGER DEFAULT 10,
        icone VARCHAR(50) DEFAULT 'Compass',
        ativo BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS education_competencies (
        id SERIAL PRIMARY KEY,
        cargo VARCHAR(255) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        competencias_obrigatorias JSONB DEFAULT '[]'::jsonb,
        treinamentos_vinculados JSONB DEFAULT '[]'::jsonb,
        nivel_exigido VARCHAR(50) DEFAULT 'Avançado'
      );

      CREATE TABLE IF NOT EXISTS education_badges (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        icone VARCHAR(50) DEFAULT 'Award',
        pontos INTEGER DEFAULT 100,
        criterio VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS education_library (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        setor VARCHAR(100) NOT NULL,
        tipo VARCHAR(50) DEFAULT 'PDF',
        url TEXT NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS education_notifications (
        id SERIAL PRIMARY KEY,
        usuario_email VARCHAR(255) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        tipo VARCHAR(50) DEFAULT 'SLA_ALERTA',
        lida BOOLEAN DEFAULT FALSE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // ==========================================
        // SEED DE DADOS INICIAIS (Caso esteja vazio)
        // ==========================================
        const checkInst = await client.query('SELECT COUNT(*) FROM instituicao');
        if (parseInt(checkInst.rows[0].count) === 0) {
            console.log('Realizando seed inicial de Instituição...');
            await client.query(`
        INSERT INTO instituicao (nome, logo, configurado, modulos_ativos)
        VALUES ('Instituição de Internação QualitaOS', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=200&q=80', TRUE, '["ona", "pops", "kpis", "incidentes", "bpm", "ia", "auditoria", "okrs", "education"]'::jsonb);
      `);
        }
        // Seed Inicial de OKRs e KRs Estratégicos
        const checkOkrs = await client.query('SELECT COUNT(*) FROM okrs');
        if (parseInt(checkOkrs.rows[0].count) === 0) {
            console.log('Realizando seed inicial de OKRs Estratégicos...');
            const resOkr1 = await client.query(`
        INSERT INTO okrs (titulo, descricao, visao_estrategica, periodo, prioridade, responsavel, setor, progresso, score, indicadores_vinculados)
        VALUES
        ('Ser referência em excelência operacional e governança institucional', 'Alcançar maturidade máxima em gestão hospitalar de internação e acreditação ONA Nível 3.', '3 Anos', '2026-2028', 'Alta', 'Administrador Geral', 'Diretoria Geral', 65.00, 0.65, '["KPI-ADM-01", "KPI-MON-01"]'::jsonb),
        ('Garantir segurança assistencial e risco zero ao paciente de internação', 'Eliminar eventos adversos graves e atingir conformidade total nos protocolos assistenciais.', '1 Ano', '2026', 'Crítica', 'Enf. Maria Souza', 'Enfermagem', 80.00, 0.80, '["KPI-ENF-01", "KPI-FAR-01"]'::jsonb)
        RETURNING id;
      `);
            // Inserir KRs para o OKR 1
            await client.query(`
        INSERT INTO key_results (okr_id, titulo, meta, valor_atual, valor_alvo, unidade, progresso, responsavel, setor, prazo, peso)
        VALUES
        ($1, 'Aumentar conformidade documental para 95%', 'Atingir 95% de conformidade de POPs e protocolos na auditoria interna', 85.00, 95.00, '%', 85.00, 'Enf. Maria Souza', 'Enfermagem', '2026-12-31', 2),
        ($1, 'Reduzir glosas de internação para menos de 3%', 'Otimizar prontuários e faturamento para mitigar perdas financeiras', 3.80, 3.00, '%', 70.00, 'Administrador Geral', 'Financeiro', '2026-09-30', 1);
      `, [resOkr1.rows[0].id]);
            // Inserir KRs para o OKR 2
            await client.query(`
        INSERT INTO key_results (okr_id, titulo, meta, valor_atual, valor_alvo, unidade, progresso, responsavel, setor, prazo, peso)
        VALUES
        ($1, 'Reduzir não conformidades e quase falhas em 30%', 'Implementar barreiras de segurança e dupla checagem medicamentosa', 15.00, 30.00, '%', 50.00, 'Dr. Carlos Mendes', 'Medicina Clínica', '2026-12-31', 2),
        ($1, 'Atingir 100% de acurácia na dispensação de psicotrópicos', 'Zero divergência no controle de estoque da farmácia de internação', 98.20, 100.00, '%', 90.00, 'Dr. Roberto Rocha', 'Farmácia', '2026-06-30', 2);
      `, [resOkr1.rows[1].id]);
            // Inserir Ciclo OKR
            await client.query(`
        INSERT INTO okr_cycles (nome, tipo, data_inicio, data_fim, ativo)
        VALUES ('Q2 2026 - Aceleração ONA', 'Trimestral', '2026-04-01', '2026-06-30', TRUE);
      `);
        }
        // Seed Inicial de Educação Corporativa (LMS)
        const checkCourses = await client.query('SELECT COUNT(*) FROM education_courses');
        if (parseInt(checkCourses.rows[0].count) === 0) {
            console.log('Realizando seed inicial de Educação Corporativa (LMS)...');
            // Curso 1: Integração Institucional (Obrigatório SLA 72h)
            const resCurso1 = await client.query(`
        INSERT INTO education_courses (titulo, descricao, setor, trilha, obrigatorio, sla_horas, carga_horaria, capa_url)
        VALUES
        ('Integração Institucional e Governança ONA', 'Treinamento obrigatório de acolhimento para novos colaboradores. Aborda cultura, segurança do paciente, LGPD, compliance e rotinas de internação.', 'Geral', 'Integração Institucional', TRUE, 72, 4, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'),
        ('Protocolos Assistenciais e Segurança do Paciente', 'Capacitação específica para equipe de enfermagem sobre prevenção de LPP, identificação correta e notificação de incidentes.', 'Enfermagem', 'Assistência Segura', TRUE, 120, 6, 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80'),
        ('Gestão de Contratos e Fluxos Administrativos', 'Treinamento voltado para analistas e gestores administrativos sobre faturamento de internação, glosas e governança de contratos.', 'Administrativo', 'Gestão Financeira', FALSE, 168, 8, 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80')
        RETURNING id;
      `);
            const c1 = resCurso1.rows[0].id;
            const c2 = resCurso1.rows[1].id;
            // Módulos e Lições do Curso de Integração
            const resMod1 = await client.query(`
        INSERT INTO education_modules (curso_id, titulo, ordem, descricao)
        VALUES
        ($1, 'Módulo 1: Cultura, Estrutura e Acreditação', 1, 'Visão geral da instituição e pilares de governança.'),
        ($1, 'Módulo 2: Segurança do Paciente e Compliance', 2, 'Diretrizes de conformidade, LGPD e notificação de eventos.')
        RETURNING id;
      `, [c1]);
            const m1 = resMod1.rows[0].id;
            const m2 = resMod1.rows[1].id;
            // Lições do Módulo 1
            const resLicao1 = await client.query(`
        INSERT INTO education_lessons (modulo_id, titulo, tipo, conteudo_url, duracao_minutos, ordem)
        VALUES
        ($1, 'Vídeo Institucional de Boas-Vindas (YouTube)', 'video', 'https://www.youtube.com/embed/5Peo-ivmupE', 15, 1),
        ($1, 'Manual da Qualidade e Estrutura ONA', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 30, 2)
        RETURNING id;
      `, [m1]);
            // Lições do Módulo 2
            const resLicao2 = await client.query(`
        INSERT INTO education_lessons (modulo_id, titulo, tipo, conteudo_url, duracao_minutos, ordem)
        VALUES
        ($1, 'Protocolos Internacionais de Segurança do Paciente (YouTube)', 'video', 'https://www.youtube.com/embed/tgbNymZ7vqY', 25, 1),
        ($1, 'Quiz de Avaliação de Integração', 'quiz', 'quiz_integration_01', 15, 2)
        RETURNING id;
      `, [m2]);
            const quizLicaoId = resLicao2.rows[1].id;
            // Inserir Quizzes
            await client.query(`
        INSERT INTO education_quizzes (licao_id, pergunta, opcoes, resposta_correta)
        VALUES
        ($1, 'Qual é o prazo limite (SLA) para notificação e investigação inicial de um Evento Sentinela na instituição?', '["12 Horas", "24 Horas", "48 Horas", "7 Dias"]'::jsonb, 1),
        ($1, 'Qual destas metas internacionais foca na eliminação de erros de medicação (LASA)?', '["Meta 1: Identificação", "Meta 3: Segurança Medicamentosa", "Meta 5: Higienização", "Meta 6: Prevenção de Quedas"]'::jsonb, 1);
      `, [quizLicaoId]);
            // Seed Inicial de Trilhas Inteligentes
            const checkTracks = await client.query('SELECT COUNT(*) FROM education_tracks');
            if (parseInt(checkTracks.rows[0].count) === 0) {
                console.log('Realizando seed de Trilhas Inteligentes...');
                await client.query(`
          INSERT INTO education_tracks (titulo, descricao, setor, cursos_ids, carga_horaria_total, icone)
          VALUES
          ('Integração Enfermagem', 'Trilha completa de acolhimento e protocolos assistenciais para novos enfermeiros.', 'Enfermagem', '[1, 2]'::jsonb, 10, 'Compass'),
          ('Gestão Administrativa & Contratos', 'Formação avançada em fluxos de faturamento, auditoria de glosas e governança.', 'Administrativo', '[1, 3]'::jsonb, 12, 'Layers'),
          ('Excelência em Farmácia & Controle LASA', 'Trilha focada na rastreabilidade medicamentosa, armazenamento e controle de psicotrópicos.', 'Farmácia', '[1]'::jsonb, 8, 'Shield')
        `);
            }
            // Seed Inicial de Matriz de Competências
            const checkComp = await client.query('SELECT COUNT(*) FROM education_competencies');
            if (parseInt(checkComp.rows[0].count) === 0) {
                console.log('Realizando seed de Matriz de Competências...');
                await client.query(`
          INSERT INTO education_competencies (cargo, setor, competencias_obrigatorias, treinamentos_vinculados, nivel_exigido)
          VALUES
          ('Enfermeiro', 'Enfermagem', '["Prevenção de LPP", "Dupla Checagem Medicamentosa", "Notificação de Incidentes", "Suporte Avançado de Vida"]'::jsonb, '["Protocolos Assistenciais e Segurança do Paciente", "Integração Institucional e Governança ONA"]'::jsonb, 'Pleno / Avançado'),
          ('Farmacêutico RT', 'Farmácia', '["Controle de Psicotrópicos", "Gestão de Estoque LASA", "Farmacovigilância", "Rastreabilidade de Insumos"]'::jsonb, '["Integração Institucional e Governança ONA", "Protocolos de Dispensação Segura"]'::jsonb, 'Avançado / Especialista'),
          ('Analista Administrativo', 'Administrativo', '["Governança de Contratos", "Faturamento de Internação", "Mitigação de Glosas", "LGPD em Saúde"]'::jsonb, '["Gestão de Contratos e Fluxos Administrativos", "Integração Institucional e Governança ONA"]'::jsonb, 'Pleno')
        `);
            }
            // Seed Inicial de Badges (Gamificação)
            const checkBadges = await client.query('SELECT COUNT(*) FROM education_badges');
            if (parseInt(checkBadges.rows[0].count) === 0) {
                console.log('Realizando seed de Badges (Gamificação)...');
                await client.query(`
          INSERT INTO education_badges (titulo, descricao, icone, pontos, criterio)
          VALUES
          ('Mestre da Qualidade', 'Concluiu a Trilha de Integração Institucional com 100% de aproveitamento nos quizzes.', 'Award', 500, 'CONCLUSAO_INTEGRACAO'),
          ('Guardião da Segurança', 'Finalizou todos os cursos obrigatórios de Segurança do Paciente dentro do SLA de 72h.', 'ShieldCheck', 300, 'SLA_CUMPRIDO_72H'),
          ('Especialista em Compliance', 'Atingiu pontuação máxima na avaliação de LGPD e Governança de Contratos.', 'CheckCircle2', 400, 'AVALIACAO_MAXIMA_LGPD')
        `);
            }
            // Seed Inicial de Biblioteca Corporativa
            const checkLib = await client.query('SELECT COUNT(*) FROM education_library');
            if (parseInt(checkLib.rows[0].count) === 0) {
                console.log('Realizando seed de Biblioteca Corporativa...');
                await client.query(`
          INSERT INTO education_library (titulo, categoria, setor, tipo, url, tags)
          VALUES
          ('Manual de Acreditação ONA v2026', 'Governança', 'Geral', 'PDF', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '["ONA", "Acreditação", "Manual"]'::jsonb),
          ('Protocolo de Prevenção de Quedas em Internação', 'Assistência', 'Enfermagem', 'PDF', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '["Quedas", "Enfermagem", "Segurança"]'::jsonb),
          ('Diretriz de Dispensação de Psicotrópicos (Portaria 344)', 'Farmácia', 'Farmácia', 'PDF', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '["Portaria 344", "Psicotrópicos", "Farmácia"]'::jsonb),
          ('Vídeo Guia de Notificação de Eventos no QualitiOS', 'Tutorial', 'Geral', 'Vídeo', 'https://www.youtube.com/embed/5Peo-ivmupE', '["Tutorial", "QualitiOS", "Incidentes"]'::jsonb)
        `);
            }
        }
        // Seed Inicial de Setores Dinâmicos Exigidos
        const checkSetores = await client.query('SELECT COUNT(*) FROM setores_config');
        if (parseInt(checkSetores.rows[0].count) === 0) {
            console.log('Realizando seed inicial de Setores Dinâmicos...');
            await client.query(`
        INSERT INTO setores_config (nome, departamento_pai, descricao, categorias_customizadas)
        VALUES
        ('Administrativo', 'Diretoria Geral', 'Setor de gestão administrativa, financeira e recursos humanos.', '["Contratos", "Financeiro", "RH"]'::jsonb),
        ('Enfermagem', 'Diretoria Assistencial', 'Setor responsável pela assistência direta, cuidados e protocolos de enfermagem.', '["Protocolo Assistencial", "Rotina de Enfermagem", "Segurança do Paciente"]'::jsonb),
        ('Monitoria', 'Qualidade e ONA', 'Setor de auditoria de prontuários, monitoria contínua e conformidade.', '["Auditoria de Prontuário", "Checklist ONA", "Monitoria Qualidade"]'::jsonb),
        ('Psicologia', 'Diretoria Assistencial', 'Setor de acolhimento psicológico, saúde mental e suporte ao paciente/família.', '["Acolhimento", "Protocolo Psicológico", "Parecer"]'::jsonb),
        ('Medicina Clínica', 'Diretoria Médica', 'Setor de atendimento médico clínico geral, evolução e prescrição.', '["Protocolo Clínico", "Diretriz Médica", "Conduta"]'::jsonb),
        ('Medicina Psiquiatria', 'Diretoria Médica', 'Setor de psiquiatria, contenção segura e manejo de crises.', '["Protocolo Psiquiátrico", "Manejo de Crise", "Contenção"]'::jsonb),
        ('Gestão', 'Diretoria Geral', 'Setor de governança estratégica, planejamento e tomada de decisão.', '["Planejamento Estratégico", "Atas de Reunião", "Governança"]'::jsonb),
        ('Farmácia', 'Suprimentos e Logística', 'Setor de dispensação medicamentosa, controle de LASA e psicotrópicos.', '["Dispensação", "Controle LASA", "Gestão de Estoque"]'::jsonb);
      `);
            // Seed Inicial de Tipos Documentais Dinâmicos
            await client.query(`
        INSERT INTO tipos_documentais_config (nome, categoria, nivel_acesso_padrao)
        VALUES
        ('POP (Procedimento Operacional Padrão)', 'Procedimento', 'Geral'),
        ('Protocolo Clínico / Assistencial', 'Assistência', 'Profissionais de Saúde'),
        ('Manual da Qualidade', 'Governança', 'Geral'),
        ('Formulário / Registro', 'Operacional', 'Geral'),
        ('Diretriz Estratégica', 'Governança', 'Gestão');
      `);
            // Seed Inicial de Workflows Documentais
            const checkWf = await client.query('SELECT COUNT(*) FROM document_workflows');
            if (parseInt(checkWf.rows[0].count) === 0) {
                console.log('Realizando seed de Workflows Documentais BPM...');
                const resWf = await client.query(`
          INSERT INTO document_workflows (nome, descricao, etapas_json, sla_horas_padrao)
          VALUES
          ('Workflow POP / Procedimento', 'Fluxo padrão ONA para aprovação de POPs.', '["rascunho", "revisão", "aprovação", "publicado", "revisão periódica"]'::jsonb, 48),
          ('Workflow Contrato Jurídico', 'Fluxo de assinatura e validação de contratos.', '["rascunho", "assinatura", "upload digitalizado", "validação", "ativo"]'::jsonb, 72),
          ('Workflow Checklist Operacional', 'Fluxo simplificado de verificação diária.', '["rascunho", "validação", "ativo"]'::jsonb, 24)
          RETURNING id;
        `);
                // Seed Inicial de Templates
                const resTpl = await client.query(`
          INSERT INTO document_templates (nome, tipo_documental, conteudo_rich_text, placeholders_json)
          VALUES
          ('Template Padrão ONA para POPs', 'POP', '# Procedimento Operacional Padrão: {{nome}}\n\n**Setor:** {{setor}}\n**Responsável:** {{responsavel}}\n**Data de Emissão:** {{data}}\n\n## 1. Objetivo\nDescrever as etapas do procedimento operacional para assegurar conformidade.\n\n## 2. Aplicação\nAplica-se a todos os profissionais do setor.\n\n## 3. Descrição das Etapas\n1. Passo inicial...\n2. Checagem de segurança...\n\n## 4. Histórico de Revisão\n- Emissão inicial.', '["nome", "setor", "responsavel", "data"]'::jsonb),
          ('Template Contrato de Prestação de Serviços', 'Contrato', '# Contrato Institucional: {{nome}}\n\n**Setor Solicitante:** {{setor}}\n**Gestor do Contrato:** {{responsavel}}\n**Data de Vigência:** {{data}}\n\n## Cláusula 1: Do Objeto\nO presente instrumento tem como objeto a prestação de serviços hospitalares...', '["nome", "setor", "responsavel", "data"]'::jsonb)
          RETURNING id;
        `);
                const wfPopId = resWf.rows[0].id;
                const wfContratoId = resWf.rows[1].id;
                const tplPopId = resTpl.rows[0].id;
                const tplContratoId = resTpl.rows[1].id;
                // Seed Inicial de Categorias
                await client.query(`
          INSERT INTO document_categories (nome, setor_alvo, subcategorias_json)
          VALUES
          ('Qualidade', 'Geral', '["Auditoria", "Acreditação", "Melhoria Contínua"]'::jsonb),
          ('RH', 'Administrativo', '["Admissão", "Treinamento", "Benefícios"]'::jsonb),
          ('Financeiro', 'Administrativo', '["Faturamento", "Contas a Pagar", "Glosas"]'::jsonb),
          ('Assistencial', 'Enfermagem', '["Protocolos Clínicos", "Segurança do Paciente", "Eventos Adversos"]'::jsonb),
          ('Segurança', 'Geral', '["Segurança do Trabalho", "PGRSS", "Radioproteção"]'::jsonb),
          ('Jurídico', 'Administrativo', '["Contratos", "LGPD", "Compliance"]'::jsonb)
        `);
                // Seed Inicial de Tipos Documentais Dinâmicos
                await client.query(`
          INSERT INTO document_types (nome, categoria, descricao, workflow_id, template_id)
          VALUES
          ('POP', 'Qualidade', 'Procedimento Operacional Padrão da Instituição.', $1, $3),
          ('Protocolo', 'Assistencial', 'Diretriz de prática clínica e segurança do paciente.', $1, $3),
          ('Contrato', 'Jurídico', 'Instrumento de acordo formal de prestação de serviços.', $2, $4),
          ('Manual', 'Qualidade', 'Guia completo de governança e estrutura hospitalar.', $1, $3),
          ('Formulário', 'Financeiro', 'Registro estruturado de dados de faturamento.', $3, $3),
          ('Checklist Operacional', 'Segurança', 'Lista de verificação diária de conformidade.', $3, $3),
          ('Plano Estratégico', 'Qualidade', 'Planejamento e metas institucionais de longo prazo.', $1, $3),
          ('Fluxo Assistencial', 'Assistencial', 'Mapeamento visual de processos de atendimento ao paciente.', $1, $3),
          ('Documento Jurídico', 'Jurídico', 'Pareceres, procurações e defesas institucionais.', $2, $4)
        `, [wfPopId, wfContratoId, tplPopId, tplContratoId]);
                // Seed Inicial de Formulários Dinâmicos
                const resForm = await client.query(`
          INSERT INTO document_forms (nome, tipo_documental, setor)
          VALUES
          ('Formulário de Emissão de POP', 'POP', 'Geral'),
          ('Formulário de Validação de Contrato', 'Contrato', 'Administrativo')
          RETURNING id;
        `);
                const formPopId = resForm.rows[0].id;
                // Seed Inicial de Campos Dinâmicos do Formulário
                await client.query(`
          INSERT INTO document_fields (form_id, nome_campo, tipo_campo, opcoes_json, obrigatorio)
          VALUES
          ($1, 'Título do POP', 'texto', '[]'::jsonb, TRUE),
          ($1, 'Setor de Aplicação', 'select', '["Enfermagem", "Farmácia", "Administrativo", "Medicina Clínica", "Psicologia"]'::jsonb, TRUE),
          ($1, 'Nível de Criticidade', 'select', '["Baixo", "Médio", "Alto", "Crítico"]'::jsonb, TRUE),
          ($1, 'Upload do Fluxograma', 'upload', '[]'::jsonb, FALSE),
          ($1, 'Data de Vigência', 'datas', '[]'::jsonb, TRUE),
          ($1, 'Assinatura do RT', 'assinaturas', '[]'::jsonb, TRUE)
        `, [formPopId]);
                // Seed Inicial de Status Documentais
                await client.query(`
          INSERT INTO document_status (nome, cor)
          VALUES
          ('Rascunho', '#64748b'),
          ('Em Revisão', '#f59e0b'),
          ('Aprovado', '#10b981'),
          ('Publicado', '#3b82f6'),
          ('Vencido', '#ef4444')
        `);
                // Seed Inicial de Permissões
                await client.query(`
          INSERT INTO document_permissions (tipo_documental, setor, pode_criar, pode_editar, pode_aprovar)
          VALUES
          ('POP', 'Enfermagem', TRUE, TRUE, FALSE),
          ('POP', 'Qualidade e ONA', TRUE, TRUE, TRUE),
          ('Contrato', 'Administrativo', TRUE, TRUE, TRUE),
          ('Protocolo', 'Medicina Clínica', TRUE, TRUE, TRUE)
        `);
            }
            // Seed Inicial de Menus Dinâmicos
            await client.query(`
        INSERT INTO menus_config (perfil_ou_setor, itens_json)
        VALUES
        ('Admin', '[{"label":"Dashboard Executivo","url":"/","icon":"Hospital"},{"label":"Gestão de Documentos","url":"/pops","icon":"FileText"},{"label":"Indicadores ONA","url":"/indicators","icon":"BarChart2"},{"label":"Incidentes & CAPA","url":"/incidents","icon":"AlertTriangle"},{"label":"Módulo ONA","url":"/ona","icon":"Award"},{"label":"Fluxos BPM","url":"/bpm","icon":"Cpu"},{"label":"Painel Administrativo","url":"/admin/estrutura","icon":"Layers"}]'::jsonb),
        ('Enfermagem', '[{"label":"Dashboard Enfermagem","url":"/","icon":"Hospital"},{"label":"Meus Documentos (Enfermagem)","url":"/pops","icon":"FileText"},{"label":"Indicadores Assistenciais","url":"/indicators","icon":"BarChart2"},{"label":"Notificar Ocorrência","url":"/incidents","icon":"AlertTriangle"}]'::jsonb),
        ('Farmácia', '[{"label":"Dashboard Farmácia","url":"/","icon":"Hospital"},{"label":"Meus Documentos (Farmácia)","url":"/pops","icon":"FileText"},{"label":"Indicadores Farmácia","url":"/indicators","icon":"BarChart2"},{"label":"Ocorrências Farmácia","url":"/incidents","icon":"AlertTriangle"}]'::jsonb);
      `);
        }
        const checkFuncoes = await client.query('SELECT COUNT(*) FROM funcoes_cadastradas');
        if (parseInt(checkFuncoes.rows[0].count) === 0) {
            console.log('Realizando seed inicial de Funções Cadastradas...');
            await client.query(`
        INSERT INTO funcoes_cadastradas (nome, is_rt, descricao)
        VALUES
        ('Coordenador / RT (Responsável Técnico)', TRUE, 'Responsável técnico legal perante conselho profissional (COREN, CRF, CRM).'),
        ('Enfermeiro Chefe', TRUE, 'Responsável técnico de enfermagem do setor.'),
        ('Farmacêutico RT', TRUE, 'Responsável técnico da farmácia hospitalar.'),
        ('Médico Auditor', FALSE, 'Responsável por auditorias de prontuários e glosas.'),
        ('Analista de Qualidade / ONA', FALSE, 'Responsável por monitorias, conformidade e planos de ação ONA.');
      `);
        }
        const checkUsers = await client.query('SELECT COUNT(*) FROM usuarios');
        if (parseInt(checkUsers.rows[0].count) === 0) {
            console.log('Realizando seed inicial de Usuários (RBAC / Acesso)...');
            const hash = await bcryptjs_1.default.hash('hashed_secure_password_123', 12);
            await client.query(`
        INSERT INTO usuarios (nome, email, senha_hash, rbac_role, departamento, unidade)
        VALUES
        ('Administrador Geral', 'admin@qualitaos.com', $1, 'Admin', 'Diretoria', 'Unidade Central'),
        ('Enf. Maria Souza', 'maria.souza@qualitaos.com', $1, 'Enfermeiro', 'Enfermagem', 'Unidade Central'),
        ('Dr. Carlos Mendes', 'carlos.mendes@qualitaos.com', $1, 'Médico', 'Psiquiatria', 'Unidade Central'),
        ('Dr. Roberto Rocha', 'roberto.rt@qualitaos.com', $1, 'Farmacêutico RT', 'Farmácia', 'Unidade Central'),
        ('Auditora Ana Lima', 'ana.lima@qualitaos.com', $1, 'Auditor ONA', 'Qualidade e ONA', 'Unidade Central');
      `, [hash]);
        }
        const checkPops = await client.query('SELECT COUNT(*) FROM pops');
        if (parseInt(checkPops.rows[0].count) === 0) {
            console.log('Realizando seed inicial de POPs...');
            const res = await client.query(`
        INSERT INTO pops (titulo, codigo, versao, setor, status, conteudo, autor, aprovador, qrcode, data_limite, notificacao_enviada)
        VALUES
        ('Higienização das Mãos no Ambiente Hospitalar', 'POP-GER-001', '1.1', 'Controle de Infecção', 'Aprovado', '1. Objetivo: Prevenir a transmissão de microrganismos. 2. Aplicação: Todos os profissionais de saúde. 3. Procedimento: Utilizar água e sabão ou preparação alcoólica a 70% antes e após contato com paciente.', 'Enf. Maria Souza', 'Diretoria Médica', 'QR_CODE_DATA_POP_001', NOW() + INTERVAL '24 hours', TRUE),
        ('Identificação Correta do Paciente', 'POP-ASS-002', '1.0', 'Enfermagem', 'Aprovado', '1. Objetivo: Garantir a identificação correta antes de qualquer procedimento. 2. Aplicação: Internação e Ambulatório. 3. Procedimento: Checar pulseira com nome completo e dias de nascimento.', 'Dr. Carlos Mendes', 'Diretoria da Qualidade', 'QR_CODE_DATA_POP_002', NOW() + INTERVAL '24 hours', TRUE),
        ('Manejo de Queda de Paciente', 'POP-ASS-003', '2.0', 'Enfermagem', 'Em Revisão', '1. Objetivo: Padronizar o atendimento imediato pós-queda. 2. Aplicação: Todas as unidades de internação. 3. Procedimento: Avaliar sinais vitais, acionar médico plantonista e registrar no sistema de incidentes.', 'Enf. Maria Souza', 'Pendente', 'QR_CODE_DATA_POP_003', NOW() + INTERVAL '24 hours', TRUE)
        RETURNING id;
      `);
            // Adiciona histórico de versões
            for (const row of res.rows) {
                await client.query(`
          INSERT INTO pop_versoes (pop_id, versao, conteudo, autor)
          VALUES ($1, '1.0', 'Conteúdo inicial do POP.', 'Enf. Maria Souza')
        `, [row.id]);
            }
        }
        // =========================================================================
        // INGESTÃO AUTOMATIZADA DOS POPS E PROTOCOLOS REDE VERSE (WORKSPACE LOCAL)
        const checkVerse = await client.query("SELECT COUNT(*) FROM pops");
        if (parseInt(checkVerse.rows[0].count) < 60) {
            console.log('Realizando ingestão automatizada dos 69 Documentos e POPs do Workspace Institucional (G:\\Meu Drive\\REDE_VERSE\\GOVERNANCA)...');
            for (const doc of documentosData_1.TODOS_DOCUMENTOS_69) {
                const checkExist = await client.query('SELECT id FROM pops WHERE codigo = $1', [doc.codigo]);
                if (checkExist.rows.length === 0) {
                    const resIns = await client.query(`
            INSERT INTO pops (titulo, codigo, versao, setor, status, conteudo, autor, aprovador, qrcode, data_limite, notificacao_enviada)
            VALUES ($1, $2, '1.0', $3, 'Em Revisão', $4, $5, $6, $7, NOW() + INTERVAL '24 hours', TRUE)
            RETURNING id, titulo;
          `, [
                        doc.documento,
                        doc.codigo,
                        doc.area,
                        `1. CABEÇALHO INSTITUCIONAL: ${doc.documento} | Código: ${doc.codigo} | Tipo: ${doc.tipoDocumento} | Área: ${doc.area} | Prazo Limite SLA: 24 Horas.\n\n2. RESPONSABILIDADES: Responsável Técnico: ${doc.responsavel || 'Coordenador da Qualidade'} | Revisor: Coordenador / RT | Aprovador: Diretoria da Qualidade.\n\n3. OBJETIVO E DESCRIÇÃO:\n${doc.descricao}\n\n4. RASTREABILIDADE E CONFORMIDADE:\nAtende aos requisitos da acreditação ONA (Níveis 1, 2 e 3), gestão de riscos e segurança do paciente.`,
                        doc.responsavel || 'Coordenador da Qualidade',
                        'Coordenador / RT (Responsável Técnico)',
                        `QR_VERSE_${doc.codigo}`
                    ]);
                    const newId = resIns.rows[0].id;
                    // Inserir notificações automáticas de SLA 24h
                    await client.query(`
            INSERT INTO notificacoes (pop_id, pop_titulo, destinatario_email, destinatario_papel, mensagem, prazo_horas, data_limite, status)
            VALUES
            ($1, $2, 'revisor.rt@redeverse.com', 'Coordenador / RT (Responsável Técnico)', 'Notificação de Revisão Técnica Obrigatória (SLA 24 Horas). Ação imediata requerida.', 24, NOW() + INTERVAL '24 hours', 'Pendente'),
            ($1, $2, 'aprovador.diretoria@redeverse.com', 'Diretoria ONA', 'Notificação de Aprovação Institucional (SLA 24 Horas). Aguardando validação final.', 24, NOW() + INTERVAL '24 hours', 'Pendente'),
            ($1, $2, 'equipe.direta@redeverse.com', 'Responsáveis Diretos', 'Alerta de Novo Procedimento / Protocolo para ciência e cumprimento imediato.', 24, NOW() + INTERVAL '24 hours', 'Pendente');
          `, [newId, doc.documento]);
                }
            }
        }
        const checkBpm = await client.query('SELECT COUNT(*) FROM bpm_fluxos');
        if (parseInt(checkBpm.rows[0].count) === 0) {
            console.log('Realizando seed inicial de BPM...');
            const resBpm = await client.query(`
        INSERT INTO bpm_fluxos (nome, descricao, bpmn_json, status_ativo, sla_horas)
        VALUES
        ('Aprovação de Novo POP', 'Fluxo padrão para revisão e aprovação de Procedimentos Operacionais Padrão.', '{"nodes":[{"id":"start","label":"Início","type":"start"},{"id":"rev","label":"Revisão Técnica","type":"task","role":"Gestor da Qualidade"},{"id":"aprov","label":"Aprovação Diretoria","type":"task","role":"Admin"},{"id":"end","label":"Publicado","type":"end"}],"edges":[{"from":"start","to":"rev"},{"from":"rev","to":"aprov"},{"from":"aprov","to":"end"}]}'::jsonb, TRUE, 48),
        ('Notificação de Evento Adverso Grave', 'Fluxo de investigação e plano de ação imediato para eventos sentinela.', '{"nodes":[{"id":"start","label":"Registro","type":"start"},{"id":"inv","label":"Investigação Ishikawa","type":"task","role":"Gestor da Qualidade"},{"id":"capa","label":"Definição CAPA","type":"task","role":"Médico"},{"id":"end","label":"Encerrado","type":"end"}],"edges":[{"from":"start","to":"inv"},{"from":"inv","to":"capa"},{"from":"capa","to":"end"}]}'::jsonb, TRUE, 24)
        RETURNING id;
      `);
            await client.query(`
        INSERT INTO bpm_execucoes (fluxo_id, solicitante, status, etapa_atual, log_execucao)
        VALUES
        ($1, 'Enf. Maria Souza', 'Em Andamento', 'Revisão Técnica', '[{"etapa":"Início","status":"Concluído","data":"2026-05-18 10:00"},{"etapa":"Revisão Técnica","status":"Em Andamento","data":"2026-05-18 10:05"}]'::jsonb),
        ($2, 'Dr. Carlos Mendes', 'Concluído', 'Encerrado', '[{"etapa":"Registro","status":"Concluído","data":"2026-05-17 14:00"},{"etapa":"Investigação Ishikawa","status":"Concluído","data":"2026-05-17 16:00"},{"etapa":"Definição CAPA","status":"Concluído","data":"2026-05-18 09:00"},{"etapa":"Encerrado","status":"Concluído","data":"2026-05-18 09:30"}]'::jsonb)
      `, [resBpm.rows[0].id, resBpm.rows[1].id]);
        }
        const checkOna = await client.query('SELECT COUNT(*) FROM ona_requisitos');
        if (parseInt(checkOna.rows[0].count) < 18) {
            console.log('Realizando seed inicial/atualização de Requisitos ONA...');
            await client.query('TRUNCATE TABLE ona_requisitos RESTART IDENTITY CASCADE');
            await client.query(`
        INSERT INTO ona_requisitos (codigo, nome, nivel, subsecao, conformidade, evidencias)
        VALUES
        ('ONA-1.1', 'Estrutura Organizacional: Organograma definido, responsabilidades formalizadas e regimentos internos.', 1, 'Governança', 'Conforme', '["Organograma 2026.pdf", "Regimento Interno v3.pdf"]'::jsonb),
        ('ONA-1.2', 'Regularização Legal: Licenças sanitárias, alvarás, RT e conformidade ANVISA/Trabalhista/Fiscal.', 1, 'Jurídico e Legal', 'Conforme', '["Alvará Sanitário 2026.pdf", "Certidão Negativa Fiscal.pdf"]'::jsonb),
        ('ONA-1.3', 'Segurança do Paciente: Protocolos de identificação, cirurgia segura, LPP e segurança medicamentosa.', 1, 'Assistência', 'Conforme', '["Protocolo Cirurgia Segura.pdf", "POP Identificação do Paciente.pdf"]'::jsonb),
        ('ONA-1.4', 'Gestão de Riscos: Mapeamento de riscos, notificação de eventos adversos e plano de ação corretiva.', 1, 'Qualidade', 'Parcial', '["Matriz de Risco Geral.xlsx"]'::jsonb),
        ('ONA-1.5', 'Padronização Operacional: POPs, protocolos clínicos, fluxos assistenciais e rotinas.', 1, 'Operações', 'Conforme', '["Manual de POPs Enfermagem.pdf"]'::jsonb),
        ('ONA-1.6', 'Capacitação: Treinamento obrigatório, integração de colaboradores e educação continuada.', 1, 'Recursos Humanos', 'Conforme', '["Plano de Educação Continuada 2026.pdf"]'::jsonb),

        ('ONA-2.1', 'Gestão Integrada: Integração entre Assistência, Farmácia, Laboratório, Suprimentos, Engenharia, Financeiro e RH.', 2, 'Governança', 'Conforme', '["Matriz de Interface de Processos.pdf"]'::jsonb),
        ('ONA-2.2', 'Gestão por Indicadores: Monitoramento de taxa de infecção, espera, ocupação, glosas, eventos e satisfação.', 2, 'Qualidade', 'Conforme', '["Dashboard Gerencial de Indicadores.pdf"]'::jsonb),
        ('ONA-2.3', 'Gestão Estratégica: Planejamento estratégico, metas institucionais, KPIs e reuniões gerenciais.', 2, 'Diretoria', 'Conforme', '["Planejamento Estratégico 2026-2030.pdf"]'::jsonb),
        ('ONA-2.4', 'Melhoria Contínua: Aplicação de PDCA, 5W2H, Ishikawa, Lean Healthcare e Six Sigma.', 2, 'Qualidade', 'Parcial', '["Projetos Lean Healthcare 2026.pdf"]'::jsonb),
        ('ONA-2.5', 'Integração da Qualidade: Auditorias internas, gestão de não conformidades e planos de ação.', 2, 'Auditoria', 'Conforme', '["Cronograma de Auditoria Interna.pdf"]'::jsonb),
        ('ONA-2.6', 'Gestão de Pessoas: Avaliação de desempenho, plano de treinamento e competências mapeadas.', 2, 'Recursos Humanos', 'Parcial', '["Mapeamento de Competências.xlsx"]'::jsonb),

        ('ONA-3.1', 'Cultura Organizacional Madura: Qualidade incorporada à cultura, liderança ativa e segurança psicológica.', 3, 'Cultura', 'Parcial', '["Pesquisa de Clima e Segurança Psicológica.pdf"]'::jsonb),
        ('ONA-3.2', 'Inteligência de Dados: Uso avançado de BI, Analytics, Big Data, Benchmarking e Indicadores preditivos.', 3, 'Tecnologia', 'Parcial', '["Relatório de BI Preditivo.pdf"]'::jsonb),
        ('ONA-3.3', 'Inovação e Transformação Digital: Automação, prontuário eletrônico maduro, IA, interoperabilidade e telemedicina.', 3, 'Inovação', 'Parcial', '["Projeto Hospital Digital 2026.pdf"]'::jsonb),
        ('ONA-3.4', 'Gestão de Desempenho: Comparativos nacionais, benchmark setorial, performance assistencial e ROI.', 3, 'Diretoria', 'Não Conforme', '[]'::jsonb),
        ('ONA-3.5', 'Experiência do Paciente: Jornada do paciente, humanização, NPS, ouvidoria estratégica e UX em saúde.', 3, 'Ouvidoria', 'Parcial', '["Relatório NPS Anual.pdf"]'::jsonb),
        ('ONA-3.6', 'Sustentabilidade Institucional: ESG, sustentabilidade financeira, eficiência operacional e governança clínica.', 3, 'ESG', 'Parcial', '["Relatório de Sustentabilidade ESG.pdf"]'::jsonb);
      `);
        }
        const checkInd = await client.query("SELECT COUNT(*) FROM indicadores WHERE codigo LIKE 'KPI-%'");
        if (parseInt(checkInd.rows[0].count) === 0) {
            console.log('Realizando seed inicial de Indicadores por Área (KPIs)...');
            const resInd = await client.query(`
        INSERT INTO indicadores (codigo, nome, setor, meta, meta_trimestral, meta_anual, valor_atual, tendencia, periodicidade)
        VALUES
        ('KPI-ADM-01', 'Eficiência Operacional Administrativa', 'Administrativo', 90.00, 92.00, 95.00, 91.50, 'Melhorando', 'Mensal'),
        ('KPI-RH-01', 'Índice de Rotatividade (Turnover Geral)', 'RH', 5.00, 4.50, 4.00, 4.80, 'Melhorando', 'Mensal'),
        ('KPI-ENF-01', 'Incidência de Lesão por Pressão (LPP)', 'Enfermagem', 1.50, 1.20, 1.00, 1.35, 'Melhorando', 'Mensal'),
        ('KPI-MON-01', 'Conformidade em Auditoria de Prontuários', 'Monitoria', 95.00, 96.00, 98.00, 95.50, 'Estável', 'Mensal'),
        ('KPI-PSI-01', 'Tempo Médio de Acolhimento Psicológico', 'Psicologia', 45.00, 42.00, 40.00, 43.00, 'Melhorando', 'Mensal'),
        ('KPI-PSIQ-01', 'Taxa de Contenção Mecânica Segura', 'Psiquiatria', 2.00, 1.50, 1.00, 1.80, 'Melhorando', 'Mensal'),
        ('KPI-COZ-01', 'Índice de Desperdício Resto-Ingesta', 'Cozinha', 5.00, 4.00, 3.00, 4.20, 'Melhorando', 'Mensal'),
        ('KPI-COM-01', 'Prazo Médio de Entrega de Insumos (Dias)', 'Compras', 5.00, 4.00, 3.00, 4.50, 'Melhorando', 'Mensal'),
        ('KPI-FIN-01', 'Índice de Glosas de Internação', 'Financeiro', 4.00, 3.50, 3.00, 3.80, 'Melhorando', 'Mensal'),
        ('KPI-FAR-01', 'Acurácia no Dispensário de Medicamentos', 'Farmácia', 98.00, 99.00, 99.50, 98.20, 'Melhorando', 'Mensal')
        RETURNING id;
      `);
            await client.query(`
        INSERT INTO indicador_coletas (indicador_id, data_coleta, valor, responsavel, observacao)
        VALUES
        ($1, '2026-03-01', 91.00, 'Enf. Maria Souza', 'Coleta padrão do mês'),
        ($1, '2026-04-01', 91.50, 'Enf. Maria Souza', 'Ajustes operacionais realizados'),
        ($2, '2026-03-01', 4.90, 'Dr. Carlos Mendes', 'Turnover sob controle'),
        ($2, '2026-04-01', 4.80, 'Dr. Carlos Mendes', 'Melhoria no clima organizacional')
      `, [resInd.rows[0].id, resInd.rows[1].id]);
        }
        const checkInc = await client.query('SELECT COUNT(*) FROM incidentes');
        if (parseInt(checkInc.rows[0].count) === 0) {
            console.log('Realizando seed inicial de Incidentes...');
            await client.query(`
        INSERT INTO incidentes (titulo, descricao, tipo, severidade, setor, status, causa_raiz_ishikawa, plano_acao_capa, relator)
        VALUES
        ('Troca de Medicação na UTI', 'Paciente recebeu 10mg de medicação X em vez de Y devido a semelhança na embalagem.', 'Evento Adverso', 'Grave', 'UTI', 'Em Investigação', '{"metodo":"Falta de dupla checagem","material":"Embalagens muito similares (LASA)","mao_de_obra":"Profissional em fim de turno (fadiga)"}'::jsonb, '[{"acao":"Notificar fabricante sobre embalagem","responsavel":"Farmácia","prazo":"2026-05-30","status":"Pendente"},{"acao":"Reforçar POP de dupla checagem","responsavel":"Enf. Maria Souza","prazo":"2026-05-20","status":"Concluído"}]'::jsonb, 'Enf. Maria Souza'),
        ('Quase Falha na Identificação no Centro Cirúrgico', 'Paciente quase foi encaminhado para sala incorreta, erro detectado na checagem da pulseira.', 'Quase Falha (Near Miss)', 'Leve', 'Centro Cirúrgico', 'Encerrado', '{"metodo":"Falha na comunicação na transferência","mao_de_obra":"Maqueiro novo sem treinamento completo"}'::jsonb, '[{"acao":"Treinamento de integração para maqueiros","responsavel":"RH","prazo":"2026-05-15","status":"Concluído"}]'::jsonb, 'Dr. Carlos Mendes');
      `);
        }
        const checkAudit = await client.query('SELECT COUNT(*) FROM auditoria_logs');
        if (parseInt(checkAudit.rows[0].count) === 0) {
            console.log('Realizando seed inicial de Logs de Auditoria...');
            await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES
        ('admin@qualitaos.com', 'LOGIN_SUCCESS', 'AUTH', null, '192.168.1.50'),
        ('maria.souza@qualitaos.com', 'POP_CREATE', 'POPs', 'POP-GER-001', '192.168.1.102'),
        ('carlos.mendes@qualitaos.com', 'INCIDENT_REGISTER', 'Incidentes', '1', '192.168.1.205'),
        ('ana.lima@qualitaos.com', 'ONA_EVIDENCE_UPLOAD', 'ONA', 'ONA-1.1', '192.168.1.88');
      `);
        }
        // Inicializa Módulo ONA (Tabelas e Seeds)
        await (0, models_1.initOnaTables)(pool);
        await (0, seeds_1.seedOnaModule)(pool);
        // Inicializa Core Platform (Governança e Inteligência Operacional)
        await (0, models_2.initCoreTables)(pool);
        await (0, seeds_2.seedCoreModule)(pool);
        console.log('Banco de dados inicializado com sucesso!');
    }
    catch (err) {
        console.error('Erro ao inicializar banco de dados:', err);
    }
    finally {
        client.release();
    }
}
exports.default = pool;
