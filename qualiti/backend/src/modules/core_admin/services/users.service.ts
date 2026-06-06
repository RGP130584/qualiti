import bcrypt from 'bcryptjs';
import { UsersRepository } from '../repositories/users.repository';

export class UsersService {
  private repo: UsersRepository;

  constructor() {
    this.repo = new UsersRepository();
  }

  async getAllUsers() {
    return this.repo.findAll();
  }

  async createUser(userData: any, authUser: any, ip: string) {
    if (authUser.role !== 'Admin' && authUser.role !== 'Gestor da Qualidade') {
      throw new Error('Proibido. Permissões insuficientes.');
    }

    const { nome, email, senha, rbac_role, departamento, unidade, mfa_enabled } = userData;
    const hash = await bcrypt.hash(senha || 'senha123', 12);

    const userToCreate = {
      nome,
      email,
      hash,
      rbac_role: rbac_role || 'Gestor da Qualidade',
      departamento: departamento || 'Geral',
      unidade: unidade || 'Unidade Central',
      mfa_enabled: mfa_enabled || false
    };

    try {
      const newUser = await this.repo.create(userToCreate);
      const auditUserStr = authUser.nome || authUser.email || 'Admin';
      await this.repo.logAudit(auditUserStr, 'USER_CREATE', 'USERS', email, ip);
      return newUser;
    } catch (err: any) {
      if (err.code === '23505') { // unique violation
        throw new Error('Erro ao criar usuário: email já existe.');
      }
      throw err;
    }
  }

  async updateUser(id: number, userData: any, authUser: any, ip: string) {
    if (authUser.role !== 'Admin' && authUser.role !== 'Gestor da Qualidade') {
      throw new Error('Proibido. Permissões insuficientes.');
    }

    const updatedUser = await this.repo.update(id, userData);
    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }

    const auditUserStr = authUser.nome || authUser.email || 'Admin';
    await this.repo.logAudit(auditUserStr, 'USER_UPDATE', 'USERS', updatedUser.email, ip);
    return updatedUser;
  }

  async deleteUser(id: number, authUser: any, ip: string) {
    if (authUser.role !== 'Admin' && authUser.role !== 'Gestor da Qualidade') {
      throw new Error('Proibido. Permissões insuficientes.');
    }

    const user = await this.repo.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    await this.repo.delete(id);
    const auditUserStr = authUser.nome || authUser.email || 'Admin';
    await this.repo.logAudit(auditUserStr, 'USER_DELETE', 'USERS', user.email, ip);
  }

  async getAllRoles() {
    return this.repo.findAllRoles();
  }

  async createRole(roleData: any) {
    const roleToCreate = {
      nome: roleData.nome,
      is_rt: roleData.is_rt || false,
      descricao: roleData.descricao || ''
    };

    try {
       return await this.repo.createRole(roleToCreate);
    } catch (err: any) {
      if (err.code === '23505') {
         throw new Error('Erro ao cadastrar função: nome já existe.');
      }
      throw err;
    }
  }

  async deleteRole(id: number) {
     await this.repo.deleteRole(id);
  }
}
