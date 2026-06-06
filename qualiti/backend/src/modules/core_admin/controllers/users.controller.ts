import { FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from '../services/users.service';

export class UsersController {
  private service: UsersService;

  constructor() {
    this.service = new UsersService();
  }

  getAllUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await this.service.getAllUsers();
      return reply.send(users);
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  createUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authUser = (request as any).user;
      const newUser = await this.service.createUser(request.body, authUser, request.ip);
      return reply.status(201).send(newUser);
    } catch (err: any) {
      request.log.error(err);
      if (err.message.includes('Proibido')) {
        return reply.status(403).send({ error: err.message });
      }
      return reply.status(400).send({ error: err.message });
    }
  }

  updateUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const authUser = (request as any).user;
      const updated = await this.service.updateUser(id, request.body, authUser, request.ip);
      return reply.send(updated);
    } catch (err: any) {
      request.log.error(err);
      if (err.message.includes('Proibido')) {
        return reply.status(403).send({ error: err.message });
      }
      if (err.message.includes('não encontrado')) {
        return reply.status(404).send({ error: err.message });
      }
      return reply.status(400).send({ error: err.message });
    }
  }

  deleteUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const authUser = (request as any).user;
      await this.service.deleteUser(id, authUser, request.ip);
      return reply.send({ success: true, message: 'Usuário removido com sucesso' });
    } catch (err: any) {
      request.log.error(err);
      if (err.message.includes('Proibido')) {
        return reply.status(403).send({ error: err.message });
      }
      if (err.message.includes('não encontrado')) {
        return reply.status(404).send({ error: err.message });
      }
      return reply.status(400).send({ error: err.message });
    }
  }

  getAllRoles = async (request: FastifyRequest, reply: FastifyReply) => {
     try {
       const roles = await this.service.getAllRoles();
       return reply.send(roles);
     } catch (err) {
       request.log.error(err);
       return reply.status(500).send({ error: 'Erro interno' });
     }
  }

  createRole = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const role = await this.service.createRole(request.body);
      return reply.status(201).send(role);
    } catch (err: any) {
      request.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  }

  deleteRole = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      await this.service.deleteRole(id);
      return reply.send({ success: true, message: 'Função removida com sucesso' });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro interno' });
    }
  }
}
