import pool from '../../../db';

export class UsersRepository {
  async findAll() {
    const res = await pool.query('SELECT id, nome, email, rbac_role, departamento, unidade, mfa_enabled, data_criacao FROM usuarios ORDER BY id ASC');
    return res.rows;
  }

  async findByEmail(email: string) {
    const res = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return res.rows[0];
  }

  async findById(id: number) {
    const res = await pool.query('SELECT email FROM usuarios WHERE id = $1', [id]);
    return res.rows[0];
  }

  async create(user: any) {
    const res = await pool.query(`
      INSERT INTO usuarios (nome, email, senha_hash, rbac_role, departamento, unidade, mfa_enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nome, email, rbac_role, departamento, unidade, mfa_enabled, data_criacao;
    `, [user.nome, user.email, user.hash, user.rbac_role, user.departamento, user.unidade, user.mfa_enabled]);
    return res.rows[0];
  }

  async update(id: number, user: any) {
    const res = await pool.query(`
      UPDATE usuarios
      SET nome = $1, rbac_role = $2, departamento = $3, unidade = $4, mfa_enabled = $5
      WHERE id = $6
      RETURNING id, nome, email, rbac_role, departamento, unidade, mfa_enabled;
    `, [user.nome, user.rbac_role, user.departamento, user.unidade, user.mfa_enabled, id]);
    return res.rows[0];
  }

  async delete(id: number) {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  }

  async logAudit(usuario: string, acao: string, entidade: string, entidade_id: string, ip: string) {
    await pool.query(`
      INSERT INTO auditoria_logs (usuario, acao, entidade, entidade_id, ip)
      VALUES ($1, $2, $3, $4, $5)
    `, [usuario, acao, entidade, entidade_id, ip]);
  }

  // Métodos adicionais para "funcoes_cadastradas" (já que estavam no users.ts)
  async findAllRoles() {
    const res = await pool.query('SELECT * FROM funcoes_cadastradas ORDER BY id ASC');
    return res.rows;
  }

  async createRole(role: any) {
    const res = await pool.query(`
      INSERT INTO funcoes_cadastradas (nome, is_rt, descricao)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [role.nome, role.is_rt, role.descricao]);
    return res.rows[0];
  }

  async deleteRole(id: number) {
    await pool.query('DELETE FROM funcoes_cadastradas WHERE id = $1', [id]);
  }
}
