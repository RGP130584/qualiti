import { OmocRepository } from './repositories';
import { OmocCargo, OmocOcupacao, OmocReporte, OmocSubstituto } from './models';
import pool from '../../db';
import { eventBus } from '../../utils/event-bus';
import { hashPassword } from '../../utils/crypto';

export class OmocService {
  private repo = new OmocRepository();

  // ----------------------------------------
  // CARGOS
  // ----------------------------------------
  async listCargos(tenantId: string): Promise<OmocCargo[]> {
    return await this.repo.listCargos(tenantId);
  }

  async createCargo(tenantId: string, data: Partial<OmocCargo>): Promise<OmocCargo> {
    if (!data.nome || !data.setor) {
      throw new Error('Nome e setor são obrigatórios para criar um cargo.');
    }
    const exist = await this.repo.findCargoByNomeAndSetor(tenantId, data.nome, data.setor);
    if (exist) {
      throw new Error(`O cargo "${data.nome}" já existe no setor "${data.setor}".`);
    }
    return await this.repo.createCargo(tenantId, data);
  }

  async deleteCargo(tenantId: string, id: number): Promise<boolean> {
    // Verificar se há ocupações ativas para o cargo
    const active = await this.repo.findActiveOcupacoesByCargo(tenantId, id);
    if (active.length > 0) {
      throw new Error('Não é possível excluir um cargo que possui colaboradores ativos vinculados.');
    }
    return await this.repo.deleteCargo(tenantId, id);
  }

  // ----------------------------------------
  // OCUPAÇÕES (VAGAS COM VALIDAÇÃO E EVENTOS)
  // ----------------------------------------
  async listOcupacoes(tenantId: string): Promise<OmocOcupacao[]> {
    return await this.repo.listOcupacoes(tenantId);
  }

  async createOcupacao(tenantId: string, data: { cargo_id: number; usuario_id?: number; nome?: string; email?: string; role?: string }): Promise<OmocOcupacao> {
    const cargo = await this.repo.findCargoById(tenantId, data.cargo_id);
    if (!cargo) {
      throw new Error('Cargo não encontrado.');
    }

    // 1. Validar limite de vagas
    const activeOcups = await this.repo.findActiveOcupacoesByCargo(tenantId, data.cargo_id);
    if (activeOcups.length >= cargo.limite_vagas) {
      throw new Error(`Limite de vagas esgotado para o cargo "${cargo.nome}". (Máximo: ${cargo.limite_vagas})`);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let finalUserId = data.usuario_id;

      // 2. Se não foi fornecido usuario_id, mas nome/email foram, criamos o usuário no IAM/RBAC
      if (!finalUserId && data.email && data.nome) {
        // Verifica se já existe
        const userCheck = await client.query('SELECT id FROM usuarios WHERE email = $1', [data.email]);
        if (userCheck.rows.length > 0) {
          finalUserId = userCheck.rows[0].id;
        } else {
          // Verificar cota de usuários
          const quotaRes = await client.query(`
            SELECT p.cota_usuarios 
            FROM pal_assinaturas a
            JOIN pal_planos p ON a.plano_id = p.id
            WHERE a.tenant_id = $1
          `, [tenantId]);
          const quota = quotaRes.rows.length > 0 ? quotaRes.rows[0].cota_usuarios : 10;

          const countRes = await client.query(`
            SELECT COUNT(*) FROM usuarios WHERE unidade = $1 AND ativo = TRUE
          `, [tenantId]);
          const activeUsersCount = parseInt(countRes.rows[0].count);

          if (activeUsersCount >= quota) {
            throw new Error(`Limite de usuários esgotado para esta instituição. (Cota contratada: ${quota} usuários)`);
          }

          // Cria usuário
          const pwdHash = hashPassword('qualita123'); // Senha inicial padrão
          const userRes = await client.query(`
            INSERT INTO usuarios (nome, email, senha_hash, rbac_role, departamento, unidade)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
          `, [data.nome, data.email, pwdHash, data.role || 'Gestor da Qualidade', cargo.setor, tenantId]);
          finalUserId = userRes.rows[0].id;

          // Grava auditoria de criação de usuário
          await client.query(`
            INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
            VALUES ('SYSTEM/OMOC', 'USER_CREATE_AUTO', 'USERS', $1, '127.0.0.1')
          `, [data.email]);
        }
      }

      if (!finalUserId) {
        throw new Error('Identificação ou dados do colaborador são obrigatórios.');
      }

      // 3. Registrar a ocupação
      const ocupacao = await this.repo.createOcupacao(tenantId, finalUserId, data.cargo_id);

      // 4. Buscar dados completos para o log e evento
      const userRes = await client.query('SELECT nome, email FROM usuarios WHERE id = $1', [finalUserId]);
      const user = userRes.rows[0];

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ('SYSTEM/OMOC', 'POSITION_ASSIGN', 'OMOC_OCUPACAO', $1, '127.0.0.1')
      `, [ocupacao.id?.toString() || '']);

      await client.query('COMMIT');

      // 5. Disparar evento omoc.employee.hired de forma assíncrona no EventBus
      await eventBus.publish('omoc.employee.hired', {
        tenant_id: tenantId,
        usuario_id: finalUserId,
        usuario_nome: user?.nome,
        usuario_email: user?.email,
        cargo_id: cargo.id,
        cargo_nome: cargo.nome,
        cargo_setor: cargo.setor
      });

      return ocupacao;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async terminateOcupacao(tenantId: string, id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Buscar dados da ocupação para disparar evento
      const oRes = await client.query(`
        SELECT o.*, u.nome as usuario_nome, u.email as usuario_email, c.nome as cargo_nome
        FROM omoc_ocupacoes o
        JOIN usuarios u ON o.usuario_id = u.id
        JOIN omoc_cargos c ON o.cargo_id = c.id
        WHERE o.id = $1 AND o.tenant_id = $2
      `, [id, tenantId]);

      if (oRes.rows.length === 0) {
        throw new Error('Ocupação não encontrada.');
      }

      const ocupacao = oRes.rows[0];
      await this.repo.terminateOcupacao(tenantId, id);

      await client.query(`
        INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
        VALUES ('SYSTEM/OMOC', 'POSITION_TERMINATE', 'OMOC_OCUPACAO', $1, '127.0.0.1')
      `, [id.toString()]);

      await client.query('COMMIT');

      // Disparar evento de demissão/desligamento no EventBus
      await eventBus.publish('omoc.employee.terminated', {
        tenant_id: tenantId,
        usuario_id: ocupacao.usuario_id,
        usuario_nome: ocupacao.usuario_nome,
        usuario_email: ocupacao.usuario_email,
        cargo_id: ocupacao.cargo_id,
        cargo_nome: ocupacao.cargo_nome
      });

      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // REPORTES (HIERARQUIA COM PREVENÇÃO DE LOOP)
  // ----------------------------------------
  async listReportes(tenantId: string): Promise<OmocReporte[]> {
    return await this.repo.listReportes(tenantId);
  }

  async createReporte(tenantId: string, subordinateCargoId: number, superiorCargoId: number, tipo = 'direto'): Promise<OmocReporte> {
    if (subordinateCargoId === superiorCargoId) {
      throw new Error('Um cargo não pode reportar a si mesmo.');
    }

    // Validação estática de loops hierárquicos em grafo direcionado
    const hasLoop = await this.checkHierarchyLoop(tenantId, subordinateCargoId, superiorCargoId);
    if (hasLoop) {
      throw new Error('Erro de validação hierárquica: Esta relação criaria uma subordinação circular (loop hierárquico).');
    }

    return await this.repo.createReporte(tenantId, subordinateCargoId, superiorCargoId, tipo);
  }

  async deleteReporte(tenantId: string, subordinateCargoId: number, superiorCargoId: number): Promise<boolean> {
    return await this.repo.deleteReporte(tenantId, subordinateCargoId, superiorCargoId);
  }

  async checkHierarchyLoop(tenantId: string, cargoSubordinadoId: number, cargoSuperiorId: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      // 1. Obter todas as linhas de reporte do tenant
      const res = await client.query(
        'SELECT cargo_subordinado_id, cargo_superior_id FROM omoc_reportes WHERE tenant_id = $1',
        [tenantId]
      );
      
      const edges = res.rows;
      
      // 2. Construir o grafo
      const graph = new Map<number, number[]>();
      for (const edge of edges) {
        if (!graph.has(edge.cargo_subordinado_id)) {
          graph.set(edge.cargo_subordinado_id, []);
        }
        graph.get(edge.cargo_subordinado_id)!.push(edge.cargo_superior_id);
      }

      // 3. Executar DFS/BFS a partir do superior proposto (cargoSuperiorId)
      // Queremos ver se conseguimos chegar até o cargoSubordinadoId (o que indicaria subordinação reversa/loop)
      const visited = new Set<number>();
      const queue = [cargoSuperiorId];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === cargoSubordinadoId) {
          return true; // Loop detectado!
        }
        if (!visited.has(current)) {
          visited.add(current);
          const superiors = graph.get(current) || [];
          for (const sup of superiors) {
            queue.push(sup);
          }
        }
      }
      return false;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // SUBSTITUTOS TEMPORÁRIOS
  // ----------------------------------------
  async listSubstitutos(tenantId: string): Promise<OmocSubstituto[]> {
    return await this.repo.listSubstitutos(tenantId);
  }

  async createSubstituto(tenantId: string, data: Partial<OmocSubstituto>): Promise<OmocSubstituto> {
    if (!data.usuario_titular_id || !data.usuario_substituto_id || !data.data_inicio || !data.data_fim) {
      throw new Error('Todos os campos (titular, substituto, data início e data fim) são obrigatórios.');
    }
    if (data.usuario_titular_id === data.usuario_substituto_id) {
      throw new Error('O colaborador titular não pode ser seu próprio substituto.');
    }

    const start = new Date(data.data_inicio);
    const end = new Date(data.data_fim);
    if (start >= end) {
      throw new Error('A data de término deve ser posterior à data de início.');
    }

    // Define status com base na data atual
    const now = new Date();
    let status = 'PENDENTE';
    if (now >= start && now <= end) {
      status = 'ATIVA';
    } else if (now > end) {
      status = 'INATIVA';
    }

    return await this.repo.createSubstituto(tenantId, {
      ...data,
      status
    });
  }

  async deleteSubstituto(tenantId: string, id: number): Promise<boolean> {
    return await this.repo.deleteSubstituto(tenantId, id);
  }

  // Rotina executada periodicamente para atualizar status de substituições no relógio do sistema
  async runSubstitutesScheduler(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Ativa substituições programadas que entraram no range de datas
      const activateRes = await client.query(`
        UPDATE omoc_substitutos
        SET status = 'ATIVA'
        WHERE status = 'PENDENTE' AND data_inicio <= CURRENT_TIMESTAMP AND data_fim >= CURRENT_TIMESTAMP
        RETURNING tenant_id;
      `);

      // 2. Desativa substituições expiradas
      const deactivateRes = await client.query(`
        UPDATE omoc_substitutos
        SET status = 'INATIVA'
        WHERE status IN ('ATIVA', 'PENDENTE') AND data_fim < CURRENT_TIMESTAMP
        RETURNING tenant_id;
      `);

      await client.query('COMMIT');

      // Invalidar cache de licenças/features para inquilinos afetados caso haja impacto, 
      // mas como substitutos não alteram feature flags diretamente, apenas registramos
      const totalUpdated = (activateRes.rowCount ?? 0) + (deactivateRes.rowCount ?? 0);
      if (totalUpdated > 0) {
        console.log(`[OmocService] Scheduler de substitutos executado: ${totalUpdated} registros atualizados.`);
      }
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[OmocService] Erro no Scheduler de substitutos:', err);
    } finally {
      client.release();
    }
  }
}
export const omocService = new OmocService();
