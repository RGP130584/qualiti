"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedOnaModule = seedOnaModule;
// ==========================================
// SEEDS INICIAIS (MÓDULO ONA)
// ==========================================
async function seedOnaModule(pool) {
    const client = await pool.connect();
    try {
        const check = await client.query('SELECT COUNT(*) FROM ona_diagnosticos');
        if (parseInt(check.rows[0].count) > 0) {
            console.log('Módulo ONA já populado com seeds iniciais.');
            return;
        }
        console.log('Realizando seed inicial do Módulo ONA (Submódulos 1 a 7)...');
        // 1. Inserir Diagnósticos ONA (Níveis 1, 2 e 3)
        const resDiag = await client.query(`
      INSERT INTO ona_diagnosticos (requisito, categoria, nivel_ona, setor, status, criticidade, evidencias, responsavel, prazo, gap_analysis, score_conformidade)
      VALUES
      ('ONA-1.1: Identificação do Paciente', 'Segurança do Paciente', 1, 'Enfermagem', 'Conforme', 'Crítica', '["POP-ENF-001", "Auditoria de Pulseiras"]'::jsonb, 'Enf. Maria Souza', '2026-06-01', 'Processo maduro, dupla checagem implementada em 100% dos leitos.', 95.00),
      ('ONA-1.2: Cirurgia Segura e Protocolo Tríplice', 'Segurança do Paciente', 1, 'Centro Cirúrgico', 'Conforme', 'Crítica', '["Checklist Cirurgia Segura", "Ata Comissão"]'::jsonb, 'Dr. Carlos Mendes', '2026-06-01', 'Adesão de 98% ao checklist da OMS.', 98.00),
      ('ONA-1.3: Gestão de Medicamentos LASA e Alta Vigilância', 'Segurança do Paciente', 1, 'Farmácia', 'Parcial', 'Alta', '["POP-FAR-004"]'::jsonb, 'Farm. Ricardo Silva', '2026-05-30', 'Falta sinalização em armários de psicotrópicos no posto do 3º andar.', 65.00),
      ('ONA-1.4: Controle e Prevenção de IRAS (Infecção Hospitalar)', 'Segurança do Paciente', 1, 'CCIH', 'Conforme', 'Crítica', '["Relatório Mensal CCIH", "POP Higienização das Mãos"]'::jsonb, 'Dra. Ana Lima', '2026-06-15', 'Taxas de infecção de corrente sanguínea abaixo da meta nacional.', 92.00),

      ('ONA-2.1: Integração de Processos Assistenciais e Suprimentos', 'Gestão Integrada', 2, 'Compras', 'Parcial', 'Média', '["Fluxograma de Compras"]'::jsonb, 'Carla Ferreira', '2026-06-10', 'Comunicação entre almoxarifado e enfermagem ainda depende de planilhas manuais.', 70.00),
      ('ONA-2.2: Gestão de Riscos e Notificação de Quase Falhas (Near Miss)', 'Gestão Integrada', 2, 'Qualidade', 'Conforme', 'Alta', '["Painel de Incidentes QualitaOS"]'::jsonb, 'Eng. Marcos Peixoto', '2026-06-20', 'Cultura de notificação consolidada com mais de 50 registros no último trimestre.', 90.00),
      ('ONA-2.3: Painel de Gestão à Vista e Indicadores Setoriais', 'Gestão Integrada', 2, 'Diretoria', 'Conforme', 'Média', '["Dashboard Executivo"]'::jsonb, 'Dr. Roberto Santos', '2026-06-30', '100% das coordenações acompanham metas mensais no QualitaOS.', 88.00),

      ('ONA-3.1: Inteligência Preditiva de Ocupação e Fluxo de Leitos', 'Excelência e Inovação', 3, 'TI & Analytics', 'Parcial', 'Média', '["Projeto BI Prontuário"]'::jsonb, 'Lucas Almeida', '2026-07-15', 'Algoritmo de predição em fase de testes na UTI, aguardando validação médica.', 55.00),
      ('ONA-3.2: Sustentabilidade e Governança Clínica (ESG em Saúde)', 'Excelência e Inovação', 3, 'Diretoria', 'Conforme', 'Alta', '["Relatório de Sustentabilidade ESG"]'::jsonb, 'Dra. Helena Martins', '2026-08-01', 'Redução de 30% no consumo de papel e descarte correto certificado.', 91.00),
      ('ONA-3.3: Experiência do Paciente e NPS Hospitalar Contínuo', 'Excelência e Inovação', 3, 'Ouvidoria', 'Conforme', 'Média', '["Relatório NPS Mensal"]'::jsonb, 'Patrícia Gomes', '2026-07-20', 'NPS atual na zona de excelência (85 pontos).', 94.00)
      RETURNING id;
    `);
        const reqIds = resDiag.rows.map(r => r.id);
        // 2. Inserir Gestão de Evidências (com OCR e Embeddings de RAG mockados)
        await client.query(`
      INSERT INTO ona_evidencias (requisito_id, nome_arquivo, tipo_arquivo, versao, status_aprovacao, autor, ocr_texto, embeddings)
      VALUES
      ($1, 'POP-ENF-001_Identificacao_Leito.pdf', 'PDF', '2.1', 'Aprovado', 'Enf. Maria Souza', '[OCR] Procedimento Operacional Padrão para identificação do paciente com pulseira branca (dados civis) e pulseira vermelha (alergias). Dupla checagem obrigatória antes de qualquer procedimento invasivo.', '[-0.012, 0.045, -0.078, 0.112, 0.034, -0.056, 0.089, -0.023, 0.067, -0.011]'::jsonb),
      ($2, 'Checklist_Cirurgia_Segura_OMS.docx', 'DOCX', '1.4', 'Aprovado', 'Dr. Carlos Mendes', '[OCR] Protocolo Tríplice: Sign-in (antes da anestesia), Time-out (antes da incisão) e Sign-out (antes da saída da sala). Todos os membros da equipe cirúrgica devem assinar a ficha.', '[0.023, -0.034, 0.056, -0.067, 0.012, 0.089, -0.045, 0.078, -0.012, 0.034]'::jsonb),
      ($3, 'Relatorio_Auditoria_Farmacia_LASA.xlsx', 'XLSX', '1.0', 'Pendente', 'Farm. Ricardo Silva', '[OCR] Relatório de vistoria nas gavetas de medicamentos de alta vigilância. Identificada necessidade de fixação de etiquetas amarelas padronizadas nas ampolas de eletrólitos concentrados.', '[-0.045, 0.012, -0.089, 0.034, -0.067, 0.023, -0.012, 0.056, -0.078, 0.090]'::jsonb);
    `, [reqIds[0], reqIds[1], reqIds[2]]);
        // 3. Inserir Checklists ONA
        await client.query(`
      INSERT INTO ona_checklists (nivel_ona, secao, requisito_codigo, pergunta, conformidade, pontuacao, observacoes, evidencias_vinculadas)
      VALUES
      (1, '1.1 Segurança do Paciente', 'REQ-1.1.01', 'A instituição possui protocolo formalizado de identificação do paciente em todas as portas de entrada?', 'Conforme', 100.00, 'Verificado no PS, Ambulatório e Internação.', '["POP-ENF-001"]'::jsonb),
      (1, '1.1 Segurança do Paciente', 'REQ-1.1.02', 'Há checagem sistemática de alergias registrada na capa do prontuário e pulseira de identificação?', 'Conforme', 100.00, 'Auditoria de prontuários confirmou 100% de conformidade.', '["Auditoria de Pulseiras"]'::jsonb),
      (1, '1.3 Gestão de Medicamentos', 'REQ-1.3.01', 'Os medicamentos de alta vigilância estão segregados e identificados com etiquetas de alerta?', 'Parcial', 50.00, 'Postos de enfermagem necessitam de reforço na sinalização de ampolas LASA.', '["POP-FAR-004"]'::jsonb),
      (2, '2.1 Gestão de Processos', 'REQ-2.1.01', 'Os líderes setoriais analisam criticamente os indicadores assistenciais mensalmente?', 'Conforme', 100.00, 'Atas de reunião de diretoria comprovam análise e planos de ação.', '["Dashboard Executivo"]'::jsonb),
      (3, '3.2 Sustentabilidade', 'REQ-3.2.01', 'A instituição promove práticas de inovação e governança ambiental comprovadas?', 'Conforme', 100.00, 'Certificação de destinação de resíduos anexada.', '["Relatório de Sustentabilidade ESG"]'::jsonb);
    `);
        // 4. Inserir Auditorias ONA
        await client.query(`
      INSERT INTO ona_auditorias (titulo, setor, tipo_auditoria, data_auditoria, auditor_responsavel, score_geral, status, evidencias_registradas, nao_conformidades, plano_corretivo_capa)
      VALUES
      ('Auditoria de Conformidade ONA 1 - Enfermagem', 'Enfermagem', 'Interna', '2026-04-10', 'Dra. Ana Lima', 92.50, 'Concluída', '["Foto Pulseiras Leito 204", "Relatório Checagem"]'::jsonb, '[]'::jsonb, '[]'::jsonb),
      ('Auditoria de Processos Integrados - Farmácia e Almoxarifado', 'Farmácia', 'Interna', '2026-05-02', 'Eng. Marcos Peixoto', 74.00, 'Concluída', '["Planilha Controle Estoque"]'::jsonb, '[{"descricao": "Armazenamento inadequado de caixas no piso do almoxarifado secundário", "criticidade": "Média", "acao_recomendada": "Instalar estrados plásticos de 15cm", "responsavel": "Carla Ferreira"}]'::jsonb, '[{"acao": "Compra de estrados plásticos", "prazo": "2026-05-25", "status": "Em Execução"}]'::jsonb),
      ('Auditoria Externa de Manutenção de Certificado ONA', 'Diretoria', 'Externa', '2026-05-15', 'Avaliador IBES / ONA', 89.00, 'Em Andamento', '["Apresentação Institucional ONA"]'::jsonb, '[]'::jsonb, '[]'::jsonb);
    `);
        // 5. Inserir Planos de Ação (CAPA / SLAs)
        await client.query(`
      INSERT INTO ona_planos_acao (nao_conformidade_origem, plano_corretivo, responsavel, sla_horas, prioridade, workflow_status, data_limite)
      VALUES
      ('Auditoria #2: Armazenamento inadequado de caixas no piso do almoxarifado secundário', 'Instalar estrados plásticos de 15cm e revisar POP de estocagem', 'Carla Ferreira', 48, 'Média', 'Em Execução', '2026-05-25 18:00:00'),
      ('Ronda de Segurança: Falta de sinalização em armários de psicotrópicos (3º andar)', 'Afixar cartazes de alerta vermelho e revisar tranca do armário com a manutenção', 'Farm. Ricardo Silva', 24, 'Alta', 'Pendente', '2026-05-20 12:00:00'),
      ('Notificação CCIH: Descarte incorreto de perfurocortantes na sala de sutura', 'Realizar treinamento in loco com a equipe técnica do plantão noturno', 'Enf. Maria Souza', 24, 'Crítica', 'Concluído', '2026-05-10 17:00:00');
    `);
        // 6. Inserir Indicadores e KPIs ONA
        await client.query(`
      INSERT INTO ona_kpis (codigo, nome, categoria, valor_atual, meta, tendencia, historico_mensal, heatmap_data)
      VALUES
      ('KPI-ONA-001', 'Conformidade Geral de Requisitos ONA', 'Conformidade', 86.40, 90.00, 'Subindo', '[{"mes": "Jan", "valor": 78.0}, {"mes": "Fev", "valor": 81.2}, {"mes": "Mar", "valor": 84.5}, {"mes": "Abr", "valor": 86.4}]'::jsonb, '[{"setor": "Enfermagem", "conformidade": 95}, {"setor": "Centro Cirúrgico", "conformidade": 98}, {"setor": "Farmácia", "conformidade": 65}, {"setor": "CCIH", "conformidade": 92}, {"setor": "Compras", "conformidade": 70}, {"setor": "Qualidade", "conformidade": 90}, {"setor": "Diretoria", "conformidade": 88}]'::jsonb),
      ('KPI-ONA-002', 'Adesão ao Protocolo de Cirurgia Segura', 'Segurança do Paciente', 98.20, 95.00, 'Estável', '[{"mes": "Jan", "valor": 97.5}, {"mes": "Fev", "valor": 98.0}, {"mes": "Mar", "valor": 98.1}, {"mes": "Abr", "valor": 98.2}]'::jsonb, '[]'::jsonb),
      ('KPI-ONA-003', 'Índice de Resolução de CAPAs no Prazo (SLA)', 'Gestão da Qualidade', 91.50, 95.00, 'Subindo', '[{"mes": "Jan", "valor": 85.0}, {"mes": "Fev", "valor": 88.4}, {"mes": "Mar", "valor": 90.0}, {"mes": "Abr", "valor": 91.5}]'::jsonb, '[]'::jsonb),
      ('KPI-ONA-004', 'Maturidade Institucional ONA (Score Geral)', 'Governança', 88.00, 85.00, 'Subindo', '[{"mes": "Jan", "valor": 82.0}, {"mes": "Fev", "valor": 85.0}, {"mes": "Mar", "valor": 87.5}, {"mes": "Abr", "valor": 88.0}]'::jsonb, '[]'::jsonb);
    `);
        // 7. Inserir Logs de IA ONA
        await client.query(`
      INSERT INTO ona_ai_logs (usuario, pergunta, resposta, requisitos_referenciados)
      VALUES
      ('maria.souza@qualitaos.com', 'Quais são as evidências necessárias para o requisito ONA 1.1?', 'Para comprovar conformidade com a ONA 1.1, você deve anexar o POP de Identificação do Paciente, registros de dupla checagem em prontuário e relatórios de auditoria de pulseiras na aba de Gestão de Evidências.', '[{"codigo": "ONA-1.1", "setor": "Enfermagem", "status": "Conforme"}]'::jsonb),
      ('ricardo.silva@qualitaos.com', 'Como elaborar um Plano de Ação CAPA para a farmácia?', 'Para abrir um Plano de Ação (CAPA) eficaz, utilize a metodologia 5W2H, defina o farmacêutico responsável e estabeleça um SLA de resolução inferior a 72 horas para mitigar riscos de troca de medicamentos LASA.', '[{"codigo": "ONA-1.3", "setor": "Farmácia", "status": "Parcial"}]'::jsonb);
    `);
        console.log('Seeds iniciais do Módulo ONA inseridos com sucesso!');
    }
    catch (err) {
        console.error('Erro ao inserir seeds do Módulo ONA:', err);
        throw err;
    }
    finally {
        client.release();
    }
}
