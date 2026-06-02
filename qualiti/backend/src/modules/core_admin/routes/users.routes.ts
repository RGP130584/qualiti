import { FastifyInstance } from 'fastify';
import { UsersController } from '../controllers/users.controller';

export async function usersRoutesV2(fastify: FastifyInstance) {
  const controller = new UsersController();

  // Função helper de autenticação (Middleware local)
  const authOpts = {
    onRequest: [async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: 'Não autorizado' });
      }
    }]
  };

  // Rotas de Usuários
  fastify.get('/users', controller.getAllUsers);
  fastify.post('/users', authOpts, controller.createUser);
  fastify.put('/users/:id', authOpts, controller.updateUser);
  fastify.delete('/users/:id', authOpts, controller.deleteUser);

  // Rotas de Funções/Roles (Menu Editável)
  fastify.get('/funcoes', controller.getAllRoles);
  fastify.post('/funcoes', controller.createRole);
  fastify.delete('/funcoes/:id', controller.deleteRole);
}
