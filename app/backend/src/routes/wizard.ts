import { FastifyInstance } from 'fastify';
import pool from '../db';
import { hashPassword } from '../utils/crypto';

export default async function wizardRoutes(fastify: FastifyInstance) {
  fastify.get('/wizard/status', async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT nome, logo, configurado, modulos_ativos FROM instituicao LIMIT 1');
      if (res.rows.length === 0) {
        return { configurado: false };
      }
      return res.rows[0];
    } finally {
      client.release();
    }
  });

  fastify.post('/wizard/setup', async (request, reply) => {
    const { 
      nome, logo, adminNome, adminEmail, adminSenha, modulosAtivos,
      razaoSocial, nomeFantasia, cnpj, segmento, responsavel,
      primeiroSetor, primeiroCargo, vagasCargo, colaboradoresAdicionais
    } = request.body as any;

    const tenantId = nomeFantasia || nome || 'Unidade Central';
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Limite Beta do Programa (Máximo 20 Tenants)
      const countRes = await client.query('SELECT COUNT(*) FROM instituicao WHERE configurado = TRUE');
      const currentConfiguredCount = parseInt(countRes.rows[0].count);
      
      // Verifica se o tenant já existe para permitir re-configuração
      const checkThisTenant = await client.query('SELECT id FROM instituicao WHERE nome = $1 OR nome_fantasia = $2', [tenantId, tenantId]);
      if (currentConfiguredCount >= 20 && checkThisTenant.rows.length === 0) {
        throw new Error('O limite de 20 clientes/tenants do Programa Beta foi atingido. Novos cadastros estão desabilitados.');
      }

      // 2. Atualizar ou inserir Perfil da Instituição
      if (checkThisTenant.rows.length > 0) {
        await client.query(`
          UPDATE instituicao 
          SET nome = $1, logo = $2, configurado = TRUE, modulos_ativos = $3,
              razao_social = $4, nome_fantasia = $5, cnpj = $6, segmento = $7, responsavel = $8
          WHERE id = $9
        `, [tenantId, logo || '🏥', JSON.stringify(modulosAtivos || []), razaoSocial, nomeFantasia, cnpj, segmento, responsavel, checkThisTenant.rows[0].id]);
      } else {
        await client.query(`
          INSERT INTO instituicao (nome, logo, configurado, modulos_ativos, razao_social, nome_fantasia, cnpj, segmento, responsavel)
          VALUES ($1, $2, TRUE, $3, $4, $5, $6, $7, $8)
        `, [tenantId, logo || '🏥', JSON.stringify(modulosAtivos || []), razaoSocial, nomeFantasia, cnpj, segmento, responsavel]);
      }

      // 3. Criar primeiro Setor no organograma (OMOC)
      const setorNome = primeiroSetor || 'Enfermagem';
      const checkSetor = await client.query('SELECT id FROM setores_config WHERE tenant_id = $1 AND nome = $2', [tenantId, setorNome]);
      if (checkSetor.rows.length === 0) {
        await client.query(`
          INSERT INTO setores_config (tenant_id, nome, departamento_pai, descricao, ativo)
          VALUES ($1, $2, 'Diretoria Geral', 'Setor inicial criado durante o onboarding.', TRUE)
        `, [tenantId, setorNome]);
      }

      // 4. Criar primeiro Cargo no organograma (OMOC)
      const cargoNome = primeiroCargo || 'Coordenador / RT';
      const limitVagas = Number(vagasCargo || 1);
      
      const checkCargo = await client.query('SELECT id FROM omoc_cargos WHERE tenant_id = $1 AND nome = $2 AND setor = $3', [tenantId, cargoNome, setorNome]);
      let cargoId: number;
      if (checkCargo.rows.length === 0) {
        const resCargo = await client.query(`
          INSERT INTO omoc_cargos (tenant_id, nome, descricao, setor, limite_vagas)
          VALUES ($1, $2, 'Cargo inicial de chefia do setor.', $3, $4)
          RETURNING id
        `, [tenantId, cargoNome, setorNome, limitVagas]);
        cargoId = resCargo.rows[0].id;
      } else {
        cargoId = checkCargo.rows[0].id;
      }

      // 5. Criptografar senha do administrador
      const hashedAdminSenha = hashPassword(adminSenha || 'admin123');

      // 6. Atualizar ou inserir conta de Administrador Geral
      let adminUserId: number;
      const checkAdmin = await client.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);
      if (checkAdmin.rows.length > 0) {
        const resUser = await client.query(`
          UPDATE usuarios 
          SET nome = $1, senha_hash = $2, rbac_role = 'Admin', departamento = $3, unidade = $4, ativo = TRUE
          WHERE email = $5
          RETURNING id
        `, [adminNome, hashedAdminSenha, setorNome, tenantId, adminEmail]);
        adminUserId = resUser.rows[0].id;
      } else {
        const resUser = await client.query(`
          INSERT INTO usuarios (nome, email, senha_hash, rbac_role, departamento, unidade, mfa_enabled, ativo)
          VALUES ($1, $2, $3, 'Admin', $4, $5, TRUE, TRUE)
          RETURNING id
        `, [adminNome, adminEmail, hashedAdminSenha, setorNome, tenantId]);
        adminUserId = resUser.rows[0].id;
      }

      // 7. Ocupar vaga de cargo pelo administrador
      await client.query(`
        INSERT INTO omoc_ocupacoes (tenant_id, usuario_id, cargo_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id, usuario_id, cargo_id) DO NOTHING
      `, [tenantId, adminUserId, cargoId]);

      // 8. Cadastrar colaboradores adicionais indicados no Onboarding
      if (Array.isArray(colaboradoresAdicionais)) {
        for (const colab of colaboradoresAdicionais) {
          if (colab.nome && colab.email && colab.cargo) {
            // Cria cargo para o colaborador se não existir
            let colabCargoId: number;
            const checkColabCargo = await client.query('SELECT id FROM omoc_cargos WHERE tenant_id = $1 AND nome = $2 AND setor = $3', [tenantId, colab.cargo, setorNome]);
            if (checkColabCargo.rows.length === 0) {
              const resColabCargo = await client.query(`
                INSERT INTO omoc_cargos (tenant_id, nome, descricao, setor, limite_vagas)
                VALUES ($1, $2, 'Cargo de apoio do setor.', $3, 2)
                RETURNING id
              `, [tenantId, colab.cargo, setorNome]);
              colabCargoId = resColabCargo.rows[0].id;
            } else {
              colabCargoId = checkColabCargo.rows[0].id;
            }

            // Cria usuário de colaborador
            const hashedColabPassword = hashPassword('colab123');
            let colabUserId: number;
            const checkColabUser = await client.query('SELECT id FROM usuarios WHERE email = $1', [colab.email]);
            if (checkColabUser.rows.length > 0) {
              const resColabUser = await client.query(`
                UPDATE usuarios 
                SET nome = $1, departamento = $2, unidade = $3, ativo = TRUE
                WHERE email = $4
                RETURNING id
              `, [colab.nome, setorNome, tenantId, colab.email]);
              colabUserId = resColabUser.rows[0].id;
            } else {
              const resColabUser = await client.query(`
                INSERT INTO usuarios (nome, email, senha_hash, rbac_role, departamento, unidade, ativo)
                VALUES ($1, $2, $3, 'Colaborador', $4, $5, TRUE)
                RETURNING id
              `, [colab.nome, colab.email, hashedColabPassword, setorNome, tenantId]);
              colabUserId = resColabUser.rows[0].id;
            }

            // Vincula ao cargo
            await client.query(`
              INSERT INTO omoc_ocupacoes (tenant_id, usuario_id, cargo_id)
              VALUES ($1, $2, $3)
              ON CONFLICT (tenant_id, usuario_id, cargo_id) DO NOTHING
            `, [tenantId, colabUserId, colabCargoId]);
          }
        }
      }

      // 9. Registrar e ativar a assinatura com plano comercial básico
      // Garante cota máxima do programa Beta na Assinatura (10 colaboradores e 50 documentos)
      const checkPlano = await client.query('SELECT id FROM pal_planos WHERE nome = $1', ['Essencial']);
      let planoId = 1;
      if (checkPlano.rows.length > 0) {
        planoId = checkPlano.rows[0].id;
        await client.query(`
          UPDATE pal_planos
          SET cota_documentos = 50, cota_usuarios = 10
          WHERE id = $1
        `, [planoId]);
      } else {
        const resPlano = await client.query(`
          INSERT INTO pal_planos (nome, features_ativas, cota_documentos, cota_usuarios, preco_mensal)
          VALUES ('Essencial', '["feature:omoc:core", "feature:pops:core"]'::jsonb, 50, 10, 199.00)
          RETURNING id;
        `);
        planoId = resPlano.rows[0].id;
      }

      await client.query(`
        INSERT INTO pal_assinaturas (tenant_id, plano_id, status)
        VALUES ($1, $2, 'ACTIVE')
        ON CONFLICT (tenant_id)
        DO UPDATE SET plano_id = EXCLUDED.plano_id, status = 'ACTIVE';
      `, [tenantId, planoId]);

      // 10. Atualiza os contadores no pal_uso para garantir inicialização de quotas
      await client.query(`
        INSERT INTO pal_uso (tenant_id, recurso, quantidade)
        VALUES ($1, 'documentos', 0)
        ON CONFLICT DO NOTHING;
      `, [tenantId]);

      await client.query(`
        INSERT INTO pal_uso (tenant_id, recurso, quantidade)
        VALUES ($1, 'usuarios', 1)
        ON CONFLICT DO NOTHING;
      `, [tenantId]);

      await client.query('COMMIT');
      return { success: true, message: 'QualitiOS configurado com sucesso no Programa Beta!' };
    } catch (err: any) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      reply.status(400).send({ error: err.message || 'Erro ao configurar instituição' });
    } finally {
      client.release();
    }
  });
}
