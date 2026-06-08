import { eventBus } from '../../utils/event-bus';
import pool from '../../db';

// ----------------------------------------
// 1. LISTENER: IncidenteRegistrado
// ----------------------------------------
eventBus.on('IncidenteRegistrado', async (payload: any) => {
  console.log(`[Listener] Received event IncidenteRegistrado:`, payload);
  const client = await pool.connect();
  try {
    const { id, tenant_id, titulo, descricao, setor, relator } = payload;
    
    // A. Start BPM Process instance of "Notificação de Evento Adverso Grave"
    const flowRes = await client.query(
      "SELECT id, bpmn_json FROM bpm_fluxos WHERE nome = $1 AND tenant_id = $2",
      ['Notificação de Evento Adverso Grave', tenant_id || 'Unidade Central']
    );

    if (flowRes.rows.length > 0) {
      const flow = flowRes.rows[0];
      const bpmn = flow.bpmn_json;
      let primeiraEtapa = 'Investigação Ishikawa';

      // Parse nodes to check if we can read dynamically
      if (bpmn && bpmn.nodes && bpmn.nodes.length > 1) {
        const startNode = bpmn.nodes.find((n: any) => n.type === 'start');
        if (startNode) {
          const edge = bpmn.edges.find((e: any) => e.from === startNode.id);
          if (edge) {
            const nextNode = bpmn.nodes.find((n: any) => n.id === edge.to);
            if (nextNode) primeiraEtapa = nextNode.label;
          }
        }
      }

      const logInicial = [
        {
          etapa: 'Início',
          status: 'Concluído',
          data: new Date().toISOString().replace('T', ' ').substring(0, 16)
        },
        {
          etapa: primeiraEtapa,
          status: 'Em Andamento',
          data: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ];

      const execRes = await client.query(`
        INSERT INTO bpm_execucoes (fluxo_id, solicitante, status, etapa_atual, log_execucao, tenant_id)
        VALUES ($1, $2, 'Em Andamento', $3, $4, $5)
        RETURNING id;
      `, [flow.id, relator || 'Anônimo', primeiraEtapa, JSON.stringify(logInicial), tenant_id || 'Unidade Central']);
      
      console.log(`[Listener] Started BPM Execution #${execRes.rows[0].id} for incident #${id}`);
    } else {
      console.warn(`[Listener] No BPM flow named 'Notificação de Evento Adverso Grave' found for tenant ${tenant_id}`);
    }

    // B. Deferred AI Triage Simulation (Wave 6 disabled)
    // Run asynchronous simulation representing LLM/Ollama processing
    setImmediate(async () => {
      const updateClient = await pool.connect();
      try {
        const queryText = `${titulo} ${descricao}`.toLowerCase();
        let iaClassificacao = 'Evento Adverso Assistencial';
        let iaCriticidade = 'Média';
        
        if (queryText.includes('queda') || queryText.includes('medicação')) {
          iaClassificacao = 'Evento Adverso Assistencial';
        }
        if (queryText.includes('grave') || queryText.includes('sentinela')) {
          iaCriticidade = 'Crítica (Evento Sentinela)';
        }

        // Update core_ocorrencias
        await updateClient.query(`
          UPDATE core_ocorrencias
          SET ia_classificacao = $1, ia_criticidade = $2, status = 'Em Investigação IA'
          WHERE id = $3 AND tenant_id = $4
        `, [iaClassificacao, iaCriticidade, id, tenant_id || 'Unidade Central']);

        // Log AI Audit
        await updateClient.query(`
          INSERT INTO core_ai_logs (agente, usuario, contexto, prompt, resposta, tenant_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'Agente Qualidade', relator || 'Sistema', 'Classificação de Incidentes',
          `Análise de incidente: ${titulo}`, `Classificação preliminar: ${iaClassificacao} com criticidade ${iaCriticidade}`,
          tenant_id || 'Unidade Central'
        ]);

        console.log(`[Listener] Completed AI background triage simulation for incident #${id}`);
      } catch (updateErr) {
        console.error(`[Listener] Error in background AI triage simulation:`, updateErr);
      } finally {
        updateClient.release();
      }
    });

  } catch (err: any) {
    console.error(`[Listener] Error in IncidenteRegistrado handler:`, err);
    await eventBus.sendToDlq('IncidenteRegistrado', payload, err.message);
  } finally {
    client.release();
  }
});

// ----------------------------------------
// 2. LISTENER: NovaVersaoDocumentoVigente
// ----------------------------------------
eventBus.on('NovaVersaoDocumentoVigente', async (payload: any) => {
  console.log(`[Listener] Received event NovaVersaoDocumentoVigente:`, payload);
  const client = await pool.connect();
  try {
    const { pop_id, tenant_id, codigo, titulo, setor } = payload;

    // Find all users in the same sector & tenant to notify them
    const usersRes = await client.query(
      "SELECT email, nome FROM usuarios WHERE unidade = $1 AND departamento = $2",
      [tenant_id || 'Unidade Central', setor]
    );

    for (const user of usersRes.rows) {
      await client.query(`
        INSERT INTO education_notifications (usuario_email, titulo, mensagem, tipo, lida)
        VALUES ($1, $2, $3, 'SLA_ALERTA', FALSE)
      `, [
        user.email,
        `Reciclagem Obrigatória: POP ${codigo}`,
        `Olá ${user.nome}, uma nova versão do POP "${titulo}" (${codigo}) foi publicada para o setor ${setor}. Por favor, revise a documentação correspondente.`
      ]);
    }
    console.log(`[Listener] Dispatched ${usersRes.rows.length} notifications for new POP ${codigo}`);

  } catch (err: any) {
    console.error(`[Listener] Error in NovaVersaoDocumentoVigente handler:`, err);
    await eventBus.sendToDlq('NovaVersaoDocumentoVigente', payload, err.message);
  } finally {
    client.release();
  }
});

// ----------------------------------------
// 3. LISTENER: CertificadoEmitido
// ----------------------------------------
eventBus.on('CertificadoEmitido', async (payload: any) => {
  console.log(`[Listener] Received event CertificadoEmitido:`, payload);
  const client = await pool.connect();
  try {
    const { email, curso_titulo, codigo_certificado, tenant_id } = payload;

    // Fetch user details to get department/sector
    const userRes = await client.query(
      "SELECT departamento FROM usuarios WHERE email = $1 AND unidade = $2",
      [email, tenant_id || 'Unidade Central']
    );

    if (userRes.rows.length > 0) {
      const userSetor = userRes.rows[0].departamento;

      // Find an ONA requirement (diagnostico) that needs training evidence (under category 'Recursos Humanos' / 'Capacitação')
      const diagRes = await client.query(`
        SELECT id, evidencias 
        FROM ona_diagnosticos 
        WHERE tenant_id = $1 AND (setor = $2 OR setor = 'Geral') AND categoria = 'Recursos Humanos' 
        ORDER BY id ASC LIMIT 1
      `, [tenant_id || 'Unidade Central', userSetor]);

      if (diagRes.rows.length > 0) {
        const diag = diagRes.rows[0];
        const currentEvidences = Array.isArray(diag.evidencias) ? diag.evidencias : [];
        const evidenceName = `Certificado LMS: ${curso_titulo} (${codigo_certificado})`;

        if (!currentEvidences.includes(evidenceName)) {
          const updatedEvidences = [...currentEvidences, evidenceName];
          await client.query(`
            UPDATE ona_diagnosticos 
            SET evidencias = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2
          `, [JSON.stringify(updatedEvidences), diag.id]);
          
          console.log(`[Listener] Attached certificate ${codigo_certificado} as ONA evidence for Diagnóstico #${diag.id}`);
        }
      } else {
        console.warn(`[Listener] No ONA Diagnóstico found for category 'Recursos Humanos' in sector ${userSetor}`);
      }
    }

  } catch (err: any) {
    console.error(`[Listener] Error in CertificadoEmitido handler:`, err);
    await eventBus.sendToDlq('CertificadoEmitido', payload, err.message);
  } finally {
    client.release();
  }
});

// ----------------------------------------
// 4. LISTENER: omoc.employee.terminated
// ----------------------------------------
eventBus.on('omoc.employee.terminated', async (payload: any) => {
  console.log('[Listener] Received event omoc.employee.terminated:', payload);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { tenant_id, usuario_id, usuario_nome, usuario_email, cargo_id } = payload;

    // 1. Suspender login do usuário
    await client.query('UPDATE usuarios SET ativo = FALSE WHERE id = $1', [usuario_id]);
    console.log(`[Listener] Suspended login for user ID ${usuario_id}`);

    // 2. Vagar cargo na ocupações
    await client.query(`
      UPDATE omoc_ocupacoes 
      SET data_fim = CURRENT_TIMESTAMP 
      WHERE usuario_id = $1 AND tenant_id = $2 AND (data_fim IS NULL OR data_fim > CURRENT_TIMESTAMP)
    `, [usuario_id, tenant_id]);
    console.log(`[Listener] Vacated position assignments for user ID ${usuario_id}`);

    // 3. Encontrar chefe imediato (superior direto)
    let superiorName = 'Administrador Geral';
    let superiorEmail = 'admin@qualitaos.com';

    let finalCargoId = cargo_id;
    if (!finalCargoId) {
      const cargoRes = await client.query(`
        SELECT cargo_id FROM omoc_ocupacoes 
        WHERE usuario_id = $1 AND tenant_id = $2 
        ORDER BY id DESC LIMIT 1
      `, [usuario_id, tenant_id]);
      if (cargoRes.rows.length > 0) {
        finalCargoId = cargoRes.rows[0].cargo_id;
      }
    }

    if (finalCargoId) {
      // Busca superior na reporting line
      const repRes = await client.query(`
        SELECT cargo_superior_id FROM omoc_reportes 
        WHERE cargo_subordinado_id = $1 AND tenant_id = $2 LIMIT 1
      `, [finalCargoId, tenant_id]);

      if (repRes.rows.length > 0) {
        const superiorCargoId = repRes.rows[0].cargo_superior_id;

        // Busca ocupante ativo do superior
        const occRes = await client.query(`
          SELECT u.nome, u.email FROM omoc_ocupacoes o
          JOIN usuarios u ON o.usuario_id = u.id
          WHERE o.cargo_id = $1 AND o.tenant_id = $2 AND (o.data_fim IS NULL OR o.data_fim > CURRENT_TIMESTAMP)
          LIMIT 1
        `, [superiorCargoId, tenant_id]);

        if (occRes.rows.length > 0) {
          superiorName = occRes.rows[0].nome;
          superiorEmail = occRes.rows[0].email;
        } else {
          // Fallback para nome do cargo superior
          const cargoRes = await client.query('SELECT nome FROM omoc_cargos WHERE id = $1', [superiorCargoId]);
          if (cargoRes.rows.length > 0) {
            superiorName = cargoRes.rows[0].nome;
          }
        }
      }
    }

    console.log(`[Listener] Chefe direto resolvido para: ${superiorName} (${superiorEmail})`);

    // 4. Transferir checklists/tarefas do BPM pendentes
    const bpmRes = await client.query(`
      SELECT id, log_execucao FROM bpm_execucoes 
      WHERE tenant_id = $1 AND status = 'Em Andamento'
    `, [tenant_id]);

    for (const exec of bpmRes.rows) {
      let logs = exec.log_execucao || [];
      let modified = false;
      if (Array.isArray(logs) && logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        if (lastLog.status === 'Em Andamento' && (lastLog.responsavel === usuario_nome || lastLog.responsavel === usuario_email)) {
          lastLog.responsavel = superiorName;
          modified = true;
        }
      }
      if (modified) {
        await client.query(`
          UPDATE bpm_execucoes 
          SET log_execucao = $1 
          WHERE id = $2
        `, [JSON.stringify(logs), exec.id]);
        console.log(`[Listener] Redirecionou checklist BPM #${exec.id} para superior ${superiorName}`);
      }
    }

    // 5. Transferir planos de ação ONA (ona_planos_acao)
    const planRes = await client.query(`
      UPDATE ona_planos_acao 
      SET responsavel = $1 
      WHERE tenant_id = $2 
        AND (responsavel = $3 OR responsavel = $4) 
        AND workflow_status != 'Concluído'
      RETURNING id
    `, [superiorName, tenant_id, usuario_nome, usuario_email]);
    console.log(`[Listener] Redirecionou ${planRes.rowCount} planos de ação ONA para chefe direto ${superiorName}`);

    // 6. Transferir notificações pendentes
    const notRes = await client.query(`
      UPDATE notificacoes 
      SET destinatario_email = $1 
      WHERE destinatario_email = $2 AND status = 'Pendente'
      RETURNING id
    `, [superiorEmail, usuario_email]);
    console.log(`[Listener] Redirecionou ${notRes.rowCount} notificações de SLA para chefe direto ${superiorEmail}`);

    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(`[Listener] Erro no listener omoc.employee.terminated:`, err);
    await eventBus.sendToDlq('omoc.employee.terminated', payload, err.message);
  } finally {
    client.release();
  }
});

// ----------------------------------------
// 5. LISTENER: omoc.employee.hired
// ----------------------------------------
eventBus.on('omoc.employee.hired', async (payload: any) => {
  console.log('[Listener] Received event omoc.employee.hired:', payload);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { tenant_id, usuario_email, usuario_nome, cargo_nome, cargo_setor } = payload;

    if (!usuario_email) {
      throw new Error('Email do usuário é obrigatório para matrícula automática no LMS.');
    }

    // Busca matriz de competências do cargo
    const compRes = await client.query(`
      SELECT competencias_obrigatorias, treinamentos_vinculados FROM education_competencies 
      WHERE cargo = $1 AND (setor = $2 OR setor = 'Geral')
      LIMIT 1
    `, [cargo_nome, cargo_setor]);

    if (compRes.rows.length > 0) {
      const courses = compRes.rows[0].treinamentos_vinculados || [];
      
      if (Array.isArray(courses) && courses.length > 0) {
        for (const courseTitle of courses) {
          const courseRes = await client.query(
            "SELECT id FROM education_courses WHERE titulo = $1 AND ativo = TRUE",
            [courseTitle]
          );

          if (courseRes.rows.length > 0) {
            const courseId = courseRes.rows[0].id;

            const lessonsRes = await client.query(`
              SELECT l.id FROM education_lessons l
              JOIN education_modules m ON l.modulo_id = m.id
              WHERE m.curso_id = $1
            `, [courseId]);

            // Matricula nas lições do curso
            for (const lesson of lessonsRes.rows) {
              await client.query(`
                INSERT INTO education_progress (usuario_email, licao_id, concluido)
                VALUES ($1, $2, FALSE)
                ON CONFLICT (usuario_email, licao_id) DO NOTHING
              `, [usuario_email, lesson.id]);
            }

            // Envia alerta de notificação LMS
            await client.query(`
              INSERT INTO education_notifications (usuario_email, titulo, mensagem, tipo, lida)
              VALUES ($1, 'Matrícula Automática por Cargo', $2, 'SLA_ALERTA', FALSE)
            `, [
              usuario_email,
              `Olá ${usuario_nome}, você foi matriculado automaticamente no curso "${courseTitle}" associado ao cargo de "${cargo_nome}". Complete o quanto antes!`
            ]);

            console.log(`[Listener] Matrícula automática de ${usuario_email} efetuada no curso "${courseTitle}" (${lessonsRes.rows.length} lições).`);
          }
        }
      }
    }

    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(`[Listener] Erro no listener omoc.employee.hired:`, err);
    await eventBus.sendToDlq('omoc.employee.hired', payload, err.message);
  } finally {
    client.release();
  }
});

export function initListeners() {
  console.log('[EventBus] Event listeners registered.');
}
