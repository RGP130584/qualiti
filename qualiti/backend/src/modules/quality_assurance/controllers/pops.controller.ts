import { FastifyRequest, FastifyReply } from 'fastify';
import { PopsService } from '../services/pops.service';

export class PopsController {
  private service: PopsService;

  constructor() {
    this.service = new PopsService();
  }

  getAllPops = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const pops = await this.service.getAllPops();
      return reply.send(pops);
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro interno' });
    }
  }

  getPopById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const pop = await this.service.getPopById(id);
      return reply.send(pop);
    } catch (err: any) {
      if (err.message === 'POP não encontrado') return reply.status(404).send({ error: err.message });
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro interno' });
    }
  }

  createPop = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authUser = (request as any).user;
      const pop = await this.service.createPop(request.body, authUser, request.ip);
      return reply.status(201).send(pop);
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro ao criar POP' });
    }
  }

  updatePop = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const authUser = (request as any).user;
      const pop = await this.service.updatePop(id, request.body, authUser, request.ip);
      return reply.send(pop);
    } catch (err: any) {
      if (err.message.includes('Proibido')) return reply.status(403).send({ error: err.message });
      if (err.message === 'POP não encontrado') return reply.status(404).send({ error: err.message });
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro ao atualizar POP' });
    }
  }

  deletePop = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const authUser = (request as any).user;
      await this.service.deletePop(id, authUser, request.ip);
      return reply.send({ success: true, message: 'POP removido com sucesso' });
    } catch (err: any) {
      if (err.message.includes('Proibido')) return reply.status(403).send({ error: err.message });
      if (err.message === 'POP não encontrado') return reply.status(404).send({ error: err.message });
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro interno' });
    }
  }

  approveEdit = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { aprovador_nome } = request.body as any;
      const pop = await this.service.approveEdit(id, aprovador_nome, request.ip);
      return reply.send({ success: true, message: 'Edição aprovada e publicada com sucesso!', pop });
    } catch (err: any) {
      if (err.message.includes('Nenhuma edição')) return reply.status(404).send({ error: err.message });
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro ao aprovar edição do POP' });
    }
  }

  rejectEdit = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { aprovador_nome, motivo } = request.body as any;
      const pop = await this.service.rejectEdit(id, aprovador_nome, motivo, request.ip);
      return reply.send({ success: true, message: 'Edição rejeitada e descartada com sucesso!', pop });
    } catch (err: any) {
      if (err.message.includes('Nenhuma edição')) return reply.status(404).send({ error: err.message });
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro ao rejeitar edição do POP' });
    }
  }

  ingestWorkspace = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const count = await this.service.ingestBulkWorkspace();
      return reply.send({ success: true, message: `Sincronização concluída! ${count} documentos importados com sucesso com SLA de 24h.` });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro ao sincronizar workspace' });
    }
  }

  getNotifications = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.getNotifications());
  resendNotification = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const n = await this.service.resendNotification(id);
      return reply.send({ success: true, message: 'E-mail reenviado!', notificacao: n });
    } catch (e: any) {
      return reply.status(404).send({ error: e.message });
    }
  }

  processSlas = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.processSlas());

  getDocTypes = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.getDocTypes());
  createDocType = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.createDocType(request.body));
  updateDocType = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.updateDocType((request.params as any).id, request.body));
  deleteDocType = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.service.deleteDocType((request.params as any).id);
    return reply.send({ success: true, message: 'Tipo documental desativado' });
  }

  getCategories = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.getCategories());
  createCategory = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.createCategory(request.body));

  getWorkflows = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.getWorkflows());
  createWorkflow = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.createWorkflow(request.body));

  getTemplates = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.getTemplates());
  createTemplate = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.createTemplate(request.body));

  getForms = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.getForms());
  createForm = async (request: FastifyRequest, reply: FastifyReply) => reply.send(await this.service.createForm(request.body));

  aiAnalysis = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { documento_id, setor, acao, query } = request.body as any;
      const res = await this.service.runAiAnalysis(documento_id, setor, acao, query);
      return reply.send(res);
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  }
}
