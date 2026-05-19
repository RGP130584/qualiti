import { Pool } from 'pg';
import dotenv from 'dotenv';
import { initOnaTables } from './modules/ona/models';
import { seedOnaModule } from './modules/ona/seeds';
import { initCoreTables } from './modules/core/models';
import { seedCoreModule } from './modules/core/seeds';
import { TODOS_DOCUMENTOS_69 } from './modules/core/documentosData';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://qualita:qualita_secure_pw@localhost:5432/qualitaos',
});

export async function initDb() {
  let client: any = null;
  let retries = 10;
  while (retries > 0) {
    try {
      client = await pool.connect();
      break;
    } catch (err) {
      console.log(`Aguardando banco de dados iniciar... (${retries} tentativas restantes)`);
      retries--;
      if (retries === 0) throw err;
      await new Promise(res => setTimeout(res, 2000));
    }
  }
  if (!client) return;
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
    // SEED DE DADOS INICIAIS (Caso esteja vazio)
    // ==========================================

    const checkInst = await client.query('SELECT COUNT(*) FROM instituicao');
    if (parseInt(checkInst.rows[0].count) === 0) {
      console.log('Realizando seed inicial de Instituição...');
      await client.query(`
        INSERT INTO instituicao (nome, logo, configurado, modulos_ativos)
        VALUES ('Instituição de Internação QualitaOS', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=200&q=80', TRUE, '["ona", "pops", "kpis", "incidentes", "bpm", "ia", "auditoria"]'::jsonb);
      `);
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

      // Seed Inicial de Menus Dinâmicos
      await client.query(`
        INSERT INTO menus_config (perfil_ou_setor, itens_json)
        VALUES 
        ('Admin', '[{"label":"Dashboard Executivo","url":"/","icon":"Hospital"},{"label":"Gestão de Documentos","url":"/pops","icon":"FileText"},{"label":"Indicadores ONA","url":"/indicators","icon":"BarChart2"},{"label":"Incidentes & CAPA","url":"/incidents","icon":"AlertTriangle"},{"label":"Módulo ONA","url":"/ona","icon":"Award"},{"label":"Fluxos BPM","url":"/bpm","icon":"Cpu"},{"label":"Painel Administrativo","url":"/admin/estrutura","icon":"Layers"}]'::jsonb),
        ('Enfermagem', '[{"label":"Dashboard Enfermagem","url":"/","icon":"Hospital"},{"label":"Meus Documentos (Enfermagem)","url":"/pops","icon":"FileText"},{"label":"Indicadores Assistenciais","url":"/indicators","icon":"BarChart2"},{"label":"Notificar Ocorrência","url":"/incidents","icon":"AlertTriangle"}]'::jsonb),
        ('Farmácia', '[{"label":"Dashboard Farmácia","url":"/","icon":"Hospital"},{"label":"Meus Documentos (Farmácia)","url":"/pops","icon":"FileText"},{"label":"Indicadores Farmácia","url":"/indicators","icon":"BarChart2"},{"label":"Ocorrências Farmácia","url":"/incidents","icon":"AlertTriangle"}]'::jsonb);
      `);
    }

    const checkUsers = await client.query('SELECT COUNT(*) FROM usuarios');
    if (parseInt(checkUsers.rows[0].count) === 0) {
      console.log('Realizando seed inicial de Usuários (RBAC / Acesso)...');
      await client.query(`
        INSERT INTO usuarios (nome, email, senha_hash, rbac_role, departamento, unidade)
        VALUES 
        ('Administrador Geral', 'admin@qualitaos.com', 'hashed_secure_password_123', 'Admin', 'Diretoria', 'Unidade Central'),
        ('Enf. Maria Souza', 'maria.souza@qualitaos.com', 'hashed_secure_password_123', 'Enfermeiro', 'Enfermagem', 'Unidade Central'),
        ('Dr. Carlos Mendes', 'carlos.mendes@qualitaos.com', 'hashed_secure_password_123', 'Médico', 'Psiquiatria', 'Unidade Central'),
        ('Dr. Roberto Rocha', 'roberto.rt@qualitaos.com', 'hashed_secure_password_123', 'Farmacêutico RT', 'Farmácia', 'Unidade Central'),
        ('Auditora Ana Lima', 'ana.lima@qualitaos.com', 'hashed_secure_password_123', 'Auditor ONA', 'Qualidade e ONA', 'Unidade Central');
      `);
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
      for (const doc of TODOS_DOCUMENTOS_69) {
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
    await initOnaTables(pool);
    await seedOnaModule(pool);

    // Inicializa Core Platform (Governança e Inteligência Operacional)
    await initCoreTables(pool);
    await seedCoreModule(pool);

    console.log('Banco de dados inicializado com sucesso!');
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
  } finally {
    client.release();
  }
}

export default pool;
