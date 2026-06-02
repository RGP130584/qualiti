import { UsersService } from '../users.service';
import { UsersRepository } from '../../repositories/users.repository';

// Mock the repository
jest.mock('../../repositories/users.repository');

describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods
    (UsersRepository as jest.Mock).mockClear();
    mockRepo = new UsersRepository() as jest.Mocked<UsersRepository>;
    service = new UsersService();
    // Overwrite the private repo instance with our mock
    (service as any).repo = mockRepo;
  });

  describe('createUser', () => {
    it('deve falhar se o usuário criador não for Admin ou Gestor', async () => {
      const authUser = { role: 'Médico' };
      await expect(service.createUser({}, authUser, '127.0.0.1')).rejects.toThrow('Proibido. Permissões insuficientes.');
    });

    it('deve criar usuário com sucesso quando tem as permissões adequadas', async () => {
      const authUser = { role: 'Admin', nome: 'Admin Supremo' };
      const newUserData = { nome: 'João', email: 'joao@teste.com', senha: '123' };

      mockRepo.create.mockResolvedValue({ id: 1, email: 'joao@teste.com' });
      mockRepo.logAudit.mockResolvedValue();

      const result = await service.createUser(newUserData, authUser, '127.0.0.1');

      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.logAudit).toHaveBeenCalledWith('Admin Supremo', 'USER_CREATE', 'USERS', 'joao@teste.com', '127.0.0.1');
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('deleteUser', () => {
     it('deve lançar erro se o usuário a deletar não existir', async () => {
        const authUser = { role: 'Admin' };
        mockRepo.findById.mockResolvedValue(undefined);

        await expect(service.deleteUser(999, authUser, '127.0.0.1')).rejects.toThrow('Usuário não encontrado');
     });
  });
});
