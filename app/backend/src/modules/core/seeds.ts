import { Pool } from 'pg';

// ==========================================
// SEEDS INICIAIS: CORE PLATFORM
// ==========================================

export async function seedCoreModule(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    const check = await client.query('SELECT COUNT(*) FROM core_ocorrencias');
    if (parseInt(check.rows[0].count) > 0) {
      console.log('Core Platform já populada com seeds iniciais.');
      return;
    }

    console.log('Realizando seed inicial da Core Platform (Governança, IA Corporativa e Inteligência Operacional)...');

    // 1. Ocorrências Inteligentes
    await client.query(`
      INSERT INTO core_ocorrencias (
        titulo, descricao, setor, relator, ia_classificacao, 
        ia_criticidade, ia_causa_raiz, ia_previsao_risco, 
        ia_impacto_normativo, ia_acoes_recomendadas, plano_capa, status
      ) VALUES 
      (
        'Quase falha na administração de potássio na UTI', 
        'Ampola de cloreto de potássio estava armazenada na gaveta de água destilada. O enfermeiro percebeu antes de aspirar.', 
        'UTI', 'Enf. Roberto Carlos', 'Quase Falha (Near Miss)', 'Alta', 
        'Análise Preditiva IA: Falha no processo de estocagem da farmácia satélite (Fator Meio Ambiente/Método) e ausência de barreira física para eletrólitos concentrados.',
        'Risco elevado de erro fatal caso o layout das gavetas não seja padronizado imediatamente com cores de alerta.',
        'ONA Nível 1 (Segurança do Paciente - Protocolo LASA) · ISO 9001 (Controle de Insumos)',
        '[{"acao": "Afixar etiquetas amarelas de alerta em 100% das ampolas de eletrólitos", "responsavel": "Farmácia", "prazo": "Imediato (2h)", "status": "Concluído"}, {"acao": "Revisar rotina de abastecimento das farmácias satélites", "responsavel": "Coordenação Farmacêutica", "prazo": "24h", "status": "Pendente"}]'::jsonb,
        '[{"acao": "Treinamento de checagem visual para técnicos da UTI", "responsavel": "Enf. Roberto Carlos", "prazo": "2026-05-25", "status": "Em Andamento"}]'::jsonb,
        'Em Investigação IA'
      ),
      (
        'Queda de paciente no banheiro do quarto 302', 
        'Paciente idoso escorregou durante o banho noturno. Apresentou escoriações leves no cotovelo, sem fraturas aparentes.', 
        'Enfermagem', 'Enf. Maria Souza', 'Evento Adverso Assistencial', 'Média', 
        'Análise Preditiva IA: Ausência de barra de apoio lateral suplementar no box (Fator Meio Ambiente) combinada com piso úmido sem tapete antiderrapante.',
        'Risco recorrente em enfermarias geriátricas. Ação de engenharia clínica e manutenção predial requerida.',
        'ONA Nível 1 (Prevenção de Quedas) · ESG (Segurança e Bem-Estar do Paciente)',
        '[{"acao": "Instalação de tapetes de sucção antiderrapantes em todos os boxes do 3º andar", "responsavel": "Manutenção", "prazo": "12h", "status": "Concluído"}]'::jsonb,
        '[]'::jsonb,
        'Pendente'
      );
    `);

    // 2. Gestão Documental Inteligente (com OCR e Embeddings RAG)
    await client.query(`
      INSERT INTO core_documentos (
        codigo, titulo, categoria, setor, versao, conteudo, autor,
        status_aprovacao, ocr_texto, embeddings, documentos_impactados, rastreabilidade_normas
      ) VALUES 
      (
        'DOC-CORE-001', 'Política Institucional de Governança Clínica e Compliance', 'Governança', 'Diretoria', '3.0',
        'A presente política estabelece as diretrizes de integridade, transparência e gestão de riscos para todo o corpo clínico e assistencial da instituição, assegurando conformidade com as normas ONA, ISO 9001 e LGPD.',
        'Dr. Roberto Santos', 'Aprovado',
        '[OCR] A presente política estabelece as diretrizes de integridade, transparência e gestão de riscos para todo o corpo clínico e assistencial da instituição, assegurando conformidade com as normas ONA, ISO 9001 e LGPD. Requisitos mandatórios: dupla checagem, notificação de near miss e proteção de dados do prontuário.',
        '[-0.012, 0.045, -0.078, 0.112, 0.034, -0.056, 0.089, -0.023, 0.067, -0.011]'::jsonb,
        '["POP-ENF-001", "POP-FAR-004"]'::jsonb,
        '["ONA Nível 3", "ISO 9001:2015", "LGPD - Lei 13.709/2018"]'::jsonb
      ),
      (
        'DOC-CORE-002', 'Protocolo de Segurança e Rastreabilidade do Prontuário Eletrônico', 'Segurança da Informação', 'TI & Analytics', '2.1',
        'Define as regras de controle de acesso (RBAC), criptografia de repouso e trilhas de auditoria imutáveis para garantir a privacidade dos pacientes e o atendimento estrito à LGPD.',
        'Lucas Almeida', 'Aprovado',
        '[OCR] Define as regras de controle de acesso (RBAC), criptografia de repouso e trilhas de auditoria imutáveis para garantir a privacidade dos pacientes e o atendimento estrito à LGPD. Compartilhamento de senhas é considerado infração gravíssima.',
        '[0.023, -0.034, 0.056, -0.067, 0.012, 0.089, -0.045, 0.078, -0.012, 0.034]'::jsonb,
        '["Manual de Integração FHIR"]'::jsonb,
        '["LGPD", "HIPAA", "ONA Nível 2"]'::jsonb
      );
    `);

    // 3. Auditoria Inteligente
    await client.query(`
      INSERT INTO core_auditorias (titulo, setor, tipo, auditor, checklist_dinamico, score_conformidade, heatmap_data, ia_auditor_virtual, status)
      VALUES 
      (
        'Auditoria Contínua de Prontuários (Real-time AI)', 'Enfermagem', 'Auditoria IA Contínua', 'IA Auditor Virtual',
        '[{"item": "Registro de Alergias na Capa", "status": "Conforme", "peso": 30}, {"item": "Evolução Médica Diária", "status": "Conforme", "peso": 40}, {"item": "Checagem de Aprazamento no Horário Exato", "status": "Parcial", "peso": 30}]'::jsonb,
        88.50,
        '[{"leito": "201", "risco": "Baixo"}, {"leito": "202", "risco": "Baixo"}, {"leito": "204", "risco": "Alto - Alergia Pendente"}]'::jsonb,
        'O motor de IA detectou inconformidade de checagem de aprazamento no plantão das 14h (Almoxarifado/Enfermagem). Alerta enviado via push para a supervisão.',
        'Em Andamento'
      );
    `);

    // 4. Gestão de Riscos
    await client.query(`
      INSERT INTO core_riscos (codigo, descricao, setor, categoria, score_risco, risco_preditivo_ia, mapa_dinamico_coords, correlao_eventos)
      VALUES 
      (
        'RSK-INST-001', 'Risco Preditivo de Desabastecimento de Fentanil e Relaxantes Musculares', 'Compras', 'Suprimentos / Assistencial', 72.00,
        'O algoritmo preditivo projeta ruptura de estoque em 14 dias devido ao aumento não programado de cirurgias ortopédicas de urgência e atraso na entrega do distribuidor principal.',
        '{"lat": -23.5505, "lng": -46.6333, "criticidade": "Alta", "zona": "Almoxarifado Central"}'::jsonb,
        '["Aumento 25% Cirurgias Ortopédicas", "Atraso Fornecedor XPTO"]'::jsonb
      );
    `);

    // 5. Segurança Operacional
    await client.query(`
      INSERT INTO core_seguranca (evento, protocolo_acionado, tipo_evento, setor, rastreabilidade_indicadores)
      VALUES 
      (
        'Identificação de frasco de insulina sem data de abertura no posto', 'Protocolo de Descarte Imediato de Multidoses', 'Quase Falha (Near Miss)', 'Enfermagem',
        '["KPI-ONA-003: Conformidade de Armazenamento"]'::jsonb
      );
    `);

    // 6. Indicadores & Analytics
    await client.query(`
      INSERT INTO core_analytics (score_institucional, tendencia_geral, benchmarking_mercado, alertas_inteligentes, bi_operacional_data)
      VALUES 
      (
        88.40, 'Subindo', 82.00,
        '[{"alerta": "Score de Segurança do Paciente atingiu o patamar de Excelência (94%)", "tipo": "Sucesso"}, {"alerta": "Atenção ao SLA médio de resolução de CAPAs na Farmácia (>48h)", "tipo": "Alerta"}]'::jsonb,
        '{"giro_leito_horas": 4.2, "nps_interno": 86, "taxa_infeccao_cirurgica": 0.8, "conformidade_geral_ona": 89.5}'::jsonb
      );
    `);

    // 7. IA Corporativa (Logs dos 6 Agentes)
    await client.query(`
      INSERT INTO core_ai_logs (agente, usuario, contexto, prompt, resposta, acoes_recomendadas)
      VALUES 
      (
        'Agente Governança', 'dr.roberto@qualitaos.com', 'Diretoria', 
        'Analisar alinhamento estratégico da governança clínica com as metas de ESG 2026', 
        '[Agente Governança Corporativa]: Com base no organograma institucional e nas metas anuais, o setor de Diretoria apresenta 92% de alinhamento estratégico. Identificamos a necessidade de revisar o regimento interno para blindar a responsabilidade técnica perante o conselho regional.',
        '[{"acao": "Revisar Regimento Interno do Setor", "prioridade": "Alta", "prazo": "30 dias"}]'::jsonb
      ),
      (
        'Agente Qualidade', 'maria.souza@qualitaos.com', 'Enfermagem', 
        'Sugira um plano de ação para reduzir reincidência de quedas no 3º andar', 
        '[Agente Gestão da Qualidade]: Analisando o histórico de ocorrências e POPs de Enfermagem, detectamos que a taxa de reincidência caiu 14% no último trimestre. Recomendamos a transição do ciclo PDCA atual para metodologias Seis Sigma nos processos críticos.',
        '[{"acao": "Mapeamento Seis Sigma na Dispensação", "prioridade": "Alta", "prazo": "60 dias"}]'::jsonb
      );
    `);

    console.log('Seeds da Core Platform inseridos com sucesso!');
  } catch (err) {
    console.error('Erro ao inserir seeds da Core Platform:', err);
    throw err;
  } finally {
    client.release();
  }
}
