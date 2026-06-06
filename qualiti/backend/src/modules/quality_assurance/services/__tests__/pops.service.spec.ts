import { PopsService } from '../pops.service';
import { PopsRepository } from '../../repositories/pops.repository';

jest.mock('../../repositories/pops.repository');

describe('PopsService', () => {
  let service: PopsService;
  let mockRepo: jest.Mocked<PopsRepository>;

  beforeEach(() => {
    (PopsRepository as jest.Mock).mockClear();
    mockRepo = new PopsRepository() as jest.Mocked<PopsRepository>;
    service = new PopsService();
    (service as any).repo = mockRepo;
  });

  describe('updatePop', () => {
    it('deve lançar erro se o usuário tentar editar sem permissão', async () => {
      const authUser = { role: 'Enfermeiro' };
      await expect(service.updatePop(1, {}, authUser, '1.2.3.4')).rejects.toThrow('Proibido. Permissões insuficientes.');
    });

    it('deve permitir update e notificar se possuir permissões', async () => {
      const authUser = { role: 'Admin', nome: 'Admin Supremo' };
      mockRepo.updatePopPending.mockResolvedValue({ id: 1, titulo: 'POP 01', codigo: 'P01' });
      mockRepo.createNotifications.mockResolvedValue();
      mockRepo.logAudit.mockResolvedValue();

      const result = await service.updatePop(1, { titulo: 'Teste' }, authUser, '1.2.3.4');

      expect(mockRepo.updatePopPending).toHaveBeenCalled();
      expect(mockRepo.createNotifications).toHaveBeenCalled();
      expect(result).toHaveProperty('codigo', 'P01');
    });
  });

  describe('deletePop', () => {
     it('deve falhar de encontrar POP inexistente para exclusão', async () => {
        const authUser = { role: 'Gestor da Qualidade' };
        mockRepo.findPopById.mockResolvedValue(undefined);

        await expect(service.deletePop(999, authUser, '127.0.0.1')).rejects.toThrow('POP não encontrado');
     });
  });
});
