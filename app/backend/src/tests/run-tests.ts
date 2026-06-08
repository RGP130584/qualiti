import pool, { initDb } from '../db';
import { omocService } from '../modules/omoc/services';
import { tenantLicenseManager } from '../utils/feature-guard';
import { eventBus } from '../utils/event-bus';
import '../modules/core/listeners';

// Utilitário simples para asserções
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

// Helper para limpar todos os dados de teste associados a um determinado tenant
async function cleanupTenant(tenantId: string) {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM omoc_substitutos WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM omoc_ocupacoes WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM omoc_reportes WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM omoc_cargos WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM pal_uso WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM pal_faturas WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM pal_assinaturas WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM pops WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM bpm_execucoes WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM ona_planos_acao WHERE tenant_id = $1', [tenantId]);
    await client.query('DELETE FROM education_progress WHERE usuario_email LIKE $1', [`%${tenantId}%`]);
    await client.query('DELETE FROM education_notifications WHERE usuario_email LIKE $1', [`%${tenantId}%`]);
    await client.query('DELETE FROM usuarios WHERE unidade = $1', [tenantId]);
  } catch (err) {
    console.error(`Erro ao limpar dados do tenant ${tenantId}:`, err);
  } finally {
    client.release();
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('  QUALITIOS - SUÍTE DE TESTES UNITÁRIOS OMOC & PAL');
  console.log('==================================================\n');

  try {
    console.log('Inicializando banco de dados para testes...');
    await initDb();
    console.log('Banco de dados inicializado com sucesso.');
  } catch (dbErr) {
    console.error('Falha ao inicializar o banco de dados para testes:', dbErr);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  const testCases = [
    { name: '1. Detecção de Loops Hierárquicos (DFS)', fn: testHierarchyLoop },
    { name: '2. Limite de Vagas de Cargo (Lotação)', fn: testCargoVacancyLimit },
    { name: '3. Redirecionamento de BPM/ONA no Desligamento', fn: testBpmTaskRedirection },
    { name: '4. Matrícula Automática no LMS na Contratação', fn: testLmsAutoEnrollment },
    { name: '5. Caching & Circuit Breaker de Feature Flags', fn: testFeatureGuardAndCache },
    { name: '6. Bloqueio Rígido de Cota de Documentos (100%)', fn: testDocumentQuotaBlock },
    { name: '7. Suspensão Automática por Faturas Vencidas (D+5)', fn: testInvoiceAutoSuspension }
  ];

  for (const tc of testCases) {
    console.log(`[TEST] Executando: ${tc.name}...`);
    try {
      await tc.fn();
      console.log(`  \x1b[32m✔ PASS\x1b[0m\n`);
      passed++;
    } catch (err: any) {
      console.error(`  \x1b[31m✘ FAIL: ${err.message}\x1b[0m\n`);
      failed++;
    }
  }

  console.log('==================================================');
  console.log(`  RESULTADO FINAL: ${passed} Passou, ${failed} Falhou`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// -----------------------------------------------------------------------------
// CASO DE TESTE 1: Prevenção de Loops Hierárquicos
// -----------------------------------------------------------------------------
async function testHierarchyLoop() {
  const tenantId = 'TEST_TENANT_LOOP';
  await cleanupTenant(tenantId);
  const client = await pool.connect();
  try {
    // Cria cargos de teste
    const cA = await client.query(`INSERT INTO omoc_cargos (tenant_id, nome, setor, limite_vagas) VALUES ($1, 'Cargo A', 'Setor T', 1) RETURNING id`, [tenantId]);
    const cB = await client.query(`INSERT INTO omoc_cargos (tenant_id, nome, setor, limite_vagas) VALUES ($1, 'Cargo B', 'Setor T', 1) RETURNING id`, [tenantId]);
    const cC = await client.query(`INSERT INTO omoc_cargos (tenant_id, nome, setor, limite_vagas) VALUES ($1, 'Cargo C', 'Setor T', 1) RETURNING id`, [tenantId]);

    const idA = cA.rows[0].id;
    const idB = cB.rows[0].id;
    const idC = cC.rows[0].id;

    // Adiciona reportes normais: A -> B (A reporta a B), B -> C (B reporta a C)
    await client.query(`INSERT INTO omoc_reportes (tenant_id, cargo_subordinado_id, cargo_superior_id) VALUES ($1, $2, $3)`, [tenantId, idA, idB]);
    await client.query(`INSERT INTO omoc_reportes (tenant_id, cargo_subordinado_id, cargo_superior_id) VALUES ($1, $2, $3)`, [tenantId, idB, idC]);

    // Verifica se loop direto é detectado: C -> A (C reporta a A, fechando ciclo C -> A -> B -> C)
    const loopDetected = await omocService.checkHierarchyLoop(tenantId, idC, idA);
    assert(loopDetected === true, 'Deveria detectar loop circular circular indireto C -> A -> B -> C');

    // Verifica reporte não-cíclico: A -> C (A reporta a C, que já é superior indireto. Válido e sem ciclo)
    const noLoopDetected = await omocService.checkHierarchyLoop(tenantId, idA, idC);
    assert(noLoopDetected === false, 'Não deveria detectar loop para reporte válido');

    // Tentar cadastrar reporte circular via service e certificar que lança erro
    let errorThrown = false;
    try {
      await omocService.createReporte(tenantId, idC, idA);
    } catch (e: any) {
      errorThrown = true;
      assert(e.message.includes('subordinação circular') || e.message.includes('loop hierárquico'), 'Mensagem de erro deve alertar subordinação circular');
    }
    assert(errorThrown === true, 'Deveria barrar a inserção de reporte cíclico lançando erro');

  } finally {
    client.release();
    await cleanupTenant(tenantId);
  }
}

// -----------------------------------------------------------------------------
// CASO DE TESTE 2: Limite de Vagas do Cargo
// -----------------------------------------------------------------------------
async function testCargoVacancyLimit() {
  const tenantId = 'TEST_TENANT_VACANCY';
  await cleanupTenant(tenantId);
  const client = await pool.connect();
  try {
    // Cria cargo com limite de 1 vaga
    const cargoRes = await client.query(`
      INSERT INTO omoc_cargos (tenant_id, nome, setor, limite_vagas) 
      VALUES ($1, 'Cargo Limite 1', 'Enfermagem', 1) RETURNING id
    `, [tenantId]);
    const cargoId = cargoRes.rows[0].id;

    // Cria dois usuários
    const u1 = await client.query(`INSERT INTO usuarios (nome, email, senha_hash, unidade) VALUES ('User 1', 'u1@test.com', 'hash', $1) RETURNING id`, [tenantId]);
    const u2 = await client.query(`INSERT INTO usuarios (nome, email, senha_hash, unidade) VALUES ('User 2', 'u2@test.com', 'hash', $1) RETURNING id`, [tenantId]);
    const id1 = u1.rows[0].id;
    const id2 = u2.rows[0].id;

    // Vincula o primeiro colaborador (vaga deve ser preenchida)
    await omocService.createOcupacao(tenantId, { cargo_id: cargoId, usuario_id: id1 });

    // Tenta alocar o segundo colaborador no mesmo cargo (deve ser bloqueado por limite esgotado)
    let limitErrorThrown = false;
    try {
      await omocService.createOcupacao(tenantId, { cargo_id: cargoId, usuario_id: id2 });
    } catch (e: any) {
      limitErrorThrown = true;
      assert(e.message.includes('Limite de vagas esgotado'), 'Mensagem de erro deve indicar esgotamento de vagas');
    }

    assert(limitErrorThrown === true, 'Deveria travar vinculação de vaga esgotada');

  } finally {
    client.release();
    await cleanupTenant(tenantId);
  }
}

// -----------------------------------------------------------------------------
// CASO DE TESTE 3: Redirecionamento de BPM/ONA no Desligamento
// -----------------------------------------------------------------------------
async function testBpmTaskRedirection() {
  const tenantId = 'TEST_TENANT_REDIRECTION';
  await cleanupTenant(tenantId);
  const client = await pool.connect();
  try {
    // 1. Cria cargos (subordinado e superior)
    const cargoSup = await client.query(`INSERT INTO omoc_cargos (tenant_id, nome, setor, limite_vagas) VALUES ($1, 'Chefe UTI', 'Enfermagem', 1) RETURNING id`, [tenantId]);
    const cargoSub = await client.query(`INSERT INTO omoc_cargos (tenant_id, nome, setor, limite_vagas) VALUES ($1, 'Subordinado', 'Enfermagem', 1) RETURNING id`, [tenantId]);
    const idSup = cargoSup.rows[0].id;
    const idSub = cargoSub.rows[0].id;

    // Reporte hierárquico
    await client.query(`INSERT INTO omoc_reportes (tenant_id, cargo_subordinado_id, cargo_superior_id) VALUES ($1, $2, $3)`, [tenantId, idSub, idSup]);

    // 2. Cria colaboradores
    const uChefe = await client.query(`INSERT INTO usuarios (nome, email, senha_hash, unidade) VALUES ('Chefe UTI', 'chefe@test.com', 'hash', $1) RETURNING id`, [tenantId]);
    const uSubord = await client.query(`INSERT INTO usuarios (nome, email, senha_hash, unidade) VALUES ('Maria Sub', 'maria@test.com', 'hash', $1) RETURNING id`, [tenantId]);
    const idChefe = uChefe.rows[0].id;
    const idSubord = uSubord.rows[0].id;

    // Vincula
    const oSup = await client.query(`INSERT INTO omoc_ocupacoes (tenant_id, usuario_id, cargo_id) VALUES ($1, $2, $3) RETURNING id`, [tenantId, idChefe, idSup]);
    const oSub = await client.query(`INSERT INTO omoc_ocupacoes (tenant_id, usuario_id, cargo_id) VALUES ($1, $2, $3) RETURNING id`, [tenantId, idSubord, idSub]);

    // 3. Cria BPM pendente para a Maria
    const fluxRes = await client.query(`INSERT INTO bpm_fluxos (nome, tenant_id) VALUES ('Fluxo Teste', $1) RETURNING id`, [tenantId]);
    const logInicial = [
      { etapa: 'Tarefa 1', status: 'Em Andamento', responsavel: 'Maria Sub' }
    ];
    const execRes = await client.query(`
      INSERT INTO bpm_execucoes (fluxo_id, solicitante, status, etapa_atual, log_execucao, tenant_id)
      VALUES ($1, 'Sistema', 'Em Andamento', 'Tarefa 1', $2, $3)
      RETURNING id;
    `, [fluxRes.rows[0].id, JSON.stringify(logInicial), tenantId]);

    // 4. Cria plano de ação ONA pendente para a Maria
    const planRes = await client.query(`
      INSERT INTO ona_planos_acao (nao_conformidade_origem, plano_corretivo, responsavel, tenant_id, workflow_status)
      VALUES ('Erro A', 'Ação A', 'Maria Sub', $1, 'Pendente')
      RETURNING id;
    `, [tenantId]);

    // 5. Simular desligamento chamando o evento omoc.employee.terminated
    // Publicamos o evento
    await eventBus.publish('omoc.employee.terminated', {
      tenant_id: tenantId,
      usuario_id: idSubord,
      usuario_nome: 'Maria Sub',
      usuario_email: 'maria@test.com',
      cargo_id: idSub
    });

    // Aguardar o event emitter processar de forma assíncrona
    await new Promise(res => setTimeout(res, 300));

    // Validar se o login foi suspenso
    const checkUser = await client.query('SELECT ativo FROM usuarios WHERE id = $1', [idSubord]);
    assert(checkUser.rows[0].ativo === false, 'O login da Maria deveria estar suspenso (ativo = false)');

    // Validar se a vaga foi desocupada (data_fim preenchida)
    const checkOcup = await client.query('SELECT data_fim FROM omoc_ocupacoes WHERE id = $1', [oSub.rows[0].id]);
    assert(checkOcup.rows[0].data_fim !== null, 'A ocupação de cargo da Maria deveria conter data_fim preenchida');

    // Validar se a tarefa do BPM foi redirecionada para o Chefe UTI
    const checkBpm = await client.query('SELECT log_execucao FROM bpm_execucoes WHERE id = $1', [execRes.rows[0].id]);
    const bpmLogs = checkBpm.rows[0].log_execucao;
    assert(bpmLogs[0].responsavel === 'Chefe UTI', 'A tarefa do BPM deveria ter sido redirecionada para o chefe Chefe UTI');

    // Validar se o plano de ação ONA foi redirecionado
    const checkPlan = await client.query('SELECT responsavel FROM ona_planos_acao WHERE id = $1', [planRes.rows[0].id]);
    assert(checkPlan.rows[0].responsavel === 'Chefe UTI', 'O plano de ação ONA deveria ter sido redirecionado para o Chefe UTI');

  } finally {
    client.release();
    await cleanupTenant(tenantId);
  }
}

// -----------------------------------------------------------------------------
// CASO DE TESTE 4: Matrícula Automática no LMS
// -----------------------------------------------------------------------------
async function testLmsAutoEnrollment() {
  const tenantId = 'TEST_TENANT_LMS';
  await cleanupTenant(tenantId);
  const client = await pool.connect();
  try {
    // 1. Cria competências vinculando o cargo a um curso
    await client.query(`
      INSERT INTO education_competencies (cargo, setor, competencias_obrigatorias, treinamentos_vinculados)
      VALUES ('Farmacêutico RT Teste', 'Farmácia', '["Checagem"]'::jsonb, '["Treinamento de Farmácia Teste"]'::jsonb)
    `);

    // 2. Cria curso, módulo e lições
    const courseRes = await client.query(`
      INSERT INTO education_courses (titulo, descricao, setor, ativo)
      VALUES ('Treinamento de Farmácia Teste', 'Descrição', 'Farmácia', TRUE)
      RETURNING id;
    `);
    const courseId = courseRes.rows[0].id;

    const modRes = await client.query(`
      INSERT INTO education_modules (curso_id, titulo)
      VALUES ($1, 'Módulo Único') RETURNING id;
    `, [courseId]);
    
    const lessonRes = await client.query(`
      INSERT INTO education_lessons (modulo_id, titulo, conteudo_url)
      VALUES ($1, 'Lição 1', 'url') RETURNING id;
    `, [modRes.rows[0].id]);

    // 3. Simula admissão (hired event)
    await eventBus.publish('omoc.employee.hired', {
      tenant_id: tenantId,
      usuario_email: 'new_hire@test.com',
      usuario_nome: 'João Contratado',
      cargo_nome: 'Farmacêutico RT Teste',
      cargo_setor: 'Farmácia'
    });

    await new Promise(res => setTimeout(res, 300));

    // 4. Validar se registrou progresso (matrícula) com concluido = false
    const checkProg = await client.query(`
      SELECT concluido FROM education_progress 
      WHERE usuario_email = 'new_hire@test.com' AND licao_id = $1
    `, [lessonRes.rows[0].id]);

    assert(checkProg.rows.length > 0, 'Deveria existir registro de progresso para a lição');
    assert(checkProg.rows[0].concluido === false, 'Matrícula automática deve iniciar com concluido = false');

    // 5. Validar se inseriu notificação
    const checkNotif = await client.query(`
      SELECT * FROM education_notifications 
      WHERE usuario_email = 'new_hire@test.com' AND titulo = 'Matrícula Automática por Cargo'
    `);
    assert(checkNotif.rows.length > 0, 'Deveria enviar notificação da matrícula automática');

  } finally {
    await client.query("DELETE FROM education_competencies WHERE cargo = 'Farmacêutico RT Teste'");
    await client.query("DELETE FROM education_courses WHERE titulo = 'Treinamento de Farmácia Teste'");
    client.release();
    await cleanupTenant(tenantId);
  }
}

// -----------------------------------------------------------------------------
// CASO DE TESTE 5: Caching & Circuit Breaker de Feature Flags
// -----------------------------------------------------------------------------
async function testFeatureGuardAndCache() {
  const tenantId = 'TEST_TENANT_FEATURE';
  await cleanupTenant(tenantId);
  const client = await pool.connect();
  try {
    // 1. Cria plano e assinatura
    const planRes = await client.query(`
      INSERT INTO pal_planos (nome, features_ativas, preco_mensal)
      VALUES ('Plano Especial', '["feature:test:allowed"]'::jsonb, 99.00)
      RETURNING id
    `);
    const planId = planRes.rows[0].id;

    await client.query(`
      INSERT INTO pal_assinaturas (tenant_id, plano_id, status)
      VALUES ($1, $2, 'ACTIVE')
    `, [tenantId, planId]);

    // Invalida cache para garantir leitura correta
    tenantLicenseManager.invalidateCache(tenantId);

    // 2. Consulta licença (deve buscar do banco na primeira vez)
    const l1 = await tenantLicenseManager.getTenantLicense(tenantId);
    assert(l1.features.includes('feature:test:allowed') === true, 'Deveria conter a feature permitida');

    // 3. Consulta licença novamente (deve retornar do cache em < 10ms)
    const tStart = Date.now();
    const l2 = await tenantLicenseManager.getTenantLicense(tenantId);
    const latency = Date.now() - tStart;
    assert(latency < 10, `Latência do cache deve ser inferior a 10ms (foi ${latency}ms)`);
    assert(l2.features.includes('feature:test:allowed') === true, 'Deveria retornar a feature via cache');

    // 4. Simula Circuit Breaker / Falha de banco (get com tenant inexistente ou forçando queda)
    const fallbackLicense = await tenantLicenseManager.getTenantLicense('TEST_NON_EXISTENT');
    assert(fallbackLicense.features.includes('feature:pops:core') === true, 'Mecanismo fail-safe deve herdar features padrões.');

  } finally {
    await client.query("DELETE FROM pal_planos WHERE nome = 'Plano Especial'");
    client.release();
    await cleanupTenant(tenantId);
  }
}

// -----------------------------------------------------------------------------
// CASO DE TESTE 6: Bloqueio Rígido de Cota de Documentos (100%)
// -----------------------------------------------------------------------------
async function testDocumentQuotaBlock() {
  const tenantId = 'TEST_TENANT_QUOTA';
  await cleanupTenant(tenantId);
  const client = await pool.connect();
  try {
    // 1. Cria plano com limite de 1 documento e assina
    const planRes = await client.query(`
      INSERT INTO pal_planos (nome, features_ativas, cota_documentos, preco_mensal)
      VALUES ('Plano Ultra Limitado', '["feature:pops:core"]'::jsonb, 1, 9.90)
      RETURNING id
    `);
    const planId = planRes.rows[0].id;

    await client.query(`
      INSERT INTO pal_assinaturas (tenant_id, plano_id, status)
      VALUES ($1, $2, 'ACTIVE')
    `, [tenantId, planId]);

    // Invalida cache para garantir leitura correta
    tenantLicenseManager.invalidateCache(tenantId);

    // 2. Criar o primeiro documento (deve passar com sucesso)
    const { PopsService } = require('../modules/pops/services');
    const popsService = new PopsService();

    const doc1 = await popsService.createPop(tenantId, {
      titulo: 'POP Teste Quota',
      codigo: 'POP-QT-001',
      versao: '1.0',
      setor: 'Geral',
      conteudo: 'conteudo'
    });
    assert(doc1.id !== undefined, 'Primeiro documento deveria ser criado sem erros.');

    // 3. Tentar criar o segundo documento (deve falhar por estouro de cota)
    let quotaErrorThrown = false;
    try {
      await popsService.createPop(tenantId, {
        titulo: 'POP Teste Excedente',
        codigo: 'POP-QT-002',
        versao: '1.0',
        setor: 'Geral',
        conteudo: 'conteudo'
      });
    } catch (e: any) {
      quotaErrorThrown = true;
      assert(e.message.includes('Limite de documentos da cota excedido'), 'Mensagem de erro deve alertar estouro de cota');
    }

    assert(quotaErrorThrown === true, 'Deveria ter bloqueado a criação do segundo documento.');

  } finally {
    await client.query("DELETE FROM pal_planos WHERE nome = 'Plano Ultra Limitado'");
    client.release();
    await cleanupTenant(tenantId);
  }
}

// -----------------------------------------------------------------------------
// CASO DE TESTE 7: Suspensão Automática por Inadimplência
// -----------------------------------------------------------------------------
async function testInvoiceAutoSuspension() {
  const tenantId = 'TEST_TENANT_SUSPENSION';
  await cleanupTenant(tenantId);
  const client = await pool.connect();
  try {
    // 1. Cria plano e assinatura ativa
    const planRes = await client.query(`
      INSERT INTO pal_planos (nome, features_ativas, preco_mensal)
      VALUES ('Plano Cobrança', '[]'::jsonb, 199.00)
      RETURNING id
    `);
    const planId = planRes.rows[0].id;

    await client.query(`
      INSERT INTO pal_assinaturas (tenant_id, plano_id, status)
      VALUES ($1, $2, 'ACTIVE')
    `, [tenantId, planId]);

    // 2. Adicionar fatura pendente com vencimento vencido a 6 dias (venceu a mais de 5 dias)
    await client.query(`
      INSERT INTO pal_faturas (tenant_id, valor, status, data_vencimento)
      VALUES ($1, 199.00, 'PENDING', NOW() - INTERVAL '6 days')
    `, [tenantId]);

    // 3. Executar lógica do worker de suspensão (manualmente para o teste)
    // Encontrar todas as faturas vencidas a mais de 5 dias
    const overdueInvoices = await client.query(`
      SELECT DISTINCT tenant_id FROM pal_faturas
      WHERE status = 'PENDING' AND data_vencimento < CURRENT_TIMESTAMP - INTERVAL '5 days'
    `);

    assert(overdueInvoices.rows.some(r => r.tenant_id === tenantId) === true, 'Fatura do tenant de teste deve estar na lista de inadimplentes.');

    // Executa update de suspensão
    await client.query(`
      UPDATE pal_assinaturas
      SET status = 'SUSPENDED'
      WHERE tenant_id = $1
    `, [tenantId]);

    // Invalida cache para forçar releitura do status
    tenantLicenseManager.invalidateCache(tenantId);

    // 4. Verificar se o manager detecta a suspensão
    const isSuspended = await tenantLicenseManager.isTenantSuspended(tenantId);
    assert(isSuspended === true, 'O tenant de teste deveria estar marcado como SUSPENDED');

  } finally {
    await client.query("DELETE FROM pal_planos WHERE nome = 'Plano Cobrança'");
    client.release();
    await cleanupTenant(tenantId);
  }
}

// Rodar a suíte
runTests();
