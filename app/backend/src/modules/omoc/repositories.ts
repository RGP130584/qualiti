import pool from '../../db';
import { OmocCargo, OmocOcupacao, OmocReporte, OmocSubstituto } from './models';

export class OmocRepository {
  // ----------------------------------------
  // 1. CARGOS
  // ----------------------------------------
  async listCargos(tenantId: string): Promise<OmocCargo[]> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT * FROM omoc_cargos WHERE tenant_id = $1 ORDER BY nome ASC',
        [tenantId]
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findCargoById(tenantId: string, id: number): Promise<OmocCargo | null> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT * FROM omoc_cargos WHERE id = $1 AND tenant_id = $2',
        [id, tenantId]
      );
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async findCargoByNomeAndSetor(tenantId: string, nome: string, setor: string): Promise<OmocCargo | null> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT * FROM omoc_cargos WHERE nome = $1 AND setor = $2 AND tenant_id = $3',
        [nome, setor, tenantId]
      );
      return res.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async createCargo(tenantId: string, data: Partial<OmocCargo>): Promise<OmocCargo> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO omoc_cargos (tenant_id, nome, descricao, setor, limite_vagas)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [tenantId, data.nome, data.descricao || '', data.setor, data.limite_vagas || 1]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteCargo(tenantId: string, id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'DELETE FROM omoc_cargos WHERE id = $1 AND tenant_id = $2',
        [id, tenantId]
      );
      return (res.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // 2. OCUPAÇÕES (VAGAS)
  // ----------------------------------------
  async listOcupacoes(tenantId: string): Promise<OmocOcupacao[]> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT o.*, u.nome as usuario_nome, u.email as usuario_email, c.nome as cargo_nome, c.setor as cargo_setor
        FROM omoc_ocupacoes o
        JOIN usuarios u ON o.usuario_id = u.id
        JOIN omoc_cargos c ON o.cargo_id = c.id
        WHERE o.tenant_id = $1
        ORDER BY o.id DESC
      `, [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findActiveOcupacoesByCargo(tenantId: string, cargoId: number): Promise<OmocOcupacao[]> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT * FROM omoc_ocupacoes WHERE cargo_id = $1 AND tenant_id = $2 AND (data_fim IS NULL OR data_fim > CURRENT_TIMESTAMP)',
        [cargoId, tenantId]
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async findActiveOcupacoesByUser(tenantId: string, userId: number): Promise<OmocOcupacao[]> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT o.*, c.nome as cargo_nome, c.setor as cargo_setor FROM omoc_ocupacoes o JOIN omoc_cargos c ON o.cargo_id = c.id WHERE o.usuario_id = $1 AND o.tenant_id = $2 AND (o.data_fim IS NULL OR o.data_fim > CURRENT_TIMESTAMP)',
        [userId, tenantId]
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createOcupacao(tenantId: string, userId: number, cargoId: number): Promise<OmocOcupacao> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO omoc_ocupacoes (tenant_id, usuario_id, cargo_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id, usuario_id, cargo_id)
        DO UPDATE SET data_fim = NULL, data_inicio = CURRENT_TIMESTAMP
        RETURNING *;
      `, [tenantId, userId, cargoId]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async terminateOcupacao(tenantId: string, id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'UPDATE omoc_ocupacoes SET data_fim = CURRENT_TIMESTAMP WHERE id = $1 AND tenant_id = $2',
        [id, tenantId]
      );
      return (res.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  async deleteOcupacao(tenantId: string, id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'DELETE FROM omoc_ocupacoes WHERE id = $1 AND tenant_id = $2',
        [id, tenantId]
      );
      return (res.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // 3. REPORTES (HIERARQUIA)
  // ----------------------------------------
  async listReportes(tenantId: string): Promise<OmocReporte[]> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT r.*, c_sub.nome as cargo_subordinado_nome, c_sup.nome as cargo_superior_nome
        FROM omoc_reportes r
        JOIN omoc_cargos c_sub ON r.cargo_subordinado_id = c_sub.id
        JOIN omoc_cargos c_sup ON r.cargo_superior_id = c_sup.id
        WHERE r.tenant_id = $1
      `, [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createReporte(tenantId: string, subordinateCargoId: number, superiorCargoId: number, tipo = 'direto'): Promise<OmocReporte> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO omoc_reportes (tenant_id, cargo_subordinado_id, cargo_superior_id, tipo)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id, cargo_subordinado_id, cargo_superior_id)
        DO UPDATE SET tipo = EXCLUDED.tipo
        RETURNING *;
      `, [tenantId, subordinateCargoId, superiorCargoId, tipo]);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteReporte(tenantId: string, subordinateCargoId: number, superiorCargoId: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'DELETE FROM omoc_reportes WHERE cargo_subordinado_id = $1 AND cargo_superior_id = $2 AND tenant_id = $3',
        [subordinateCargoId, superiorCargoId, tenantId]
      );
      return (res.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  // ----------------------------------------
  // 4. SUBSTITUTOS
  // ----------------------------------------
  async listSubstitutos(tenantId: string): Promise<OmocSubstituto[]> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT s.*, u_tit.nome as usuario_titular_nome, u_sub.nome as usuario_substituto_nome
        FROM omoc_substitutos s
        JOIN usuarios u_tit ON s.usuario_titular_id = u_tit.id
        JOIN usuarios u_sub ON s.usuario_substituto_id = u_sub.id
        WHERE s.tenant_id = $1
        ORDER BY s.id DESC
      `, [tenantId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async createSubstituto(tenantId: string, data: Partial<OmocSubstituto>): Promise<OmocSubstituto> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO omoc_substitutos (tenant_id, usuario_titular_id, usuario_substituto_id, data_inicio, data_fim, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `, [tenantId, data.usuario_titular_id, data.usuario_substituto_id, data.data_inicio, data.data_fim, data.status || 'PENDENTE']);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async updateSubstitutoStatus(tenantId: string, id: number, status: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'UPDATE omoc_substitutos SET status = $1 WHERE id = $2 AND tenant_id = $3',
        [status, id, tenantId]
      );
      return (res.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  async deleteSubstituto(tenantId: string, id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'DELETE FROM omoc_substitutos WHERE id = $1 AND tenant_id = $2',
        [id, tenantId]
      );
      return (res.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  async findActiveSubstitutesForUser(tenantId: string, userId: number): Promise<OmocSubstituto[]> {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT * FROM omoc_substitutos 
        WHERE tenant_id = $1 
          AND usuario_titular_id = $2 
          AND status = 'ATIVA' 
          AND data_inicio <= CURRENT_TIMESTAMP 
          AND data_fim >= CURRENT_TIMESTAMP
      `, [tenantId, userId]);
      return res.rows;
    } finally {
      client.release();
    }
  }
}
