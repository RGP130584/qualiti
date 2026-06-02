import { FastifyInstance } from 'fastify';
import { PopsController } from '../controllers/pops.controller';

export async function popsRoutesV2(fastify: FastifyInstance) {
  const controller = new PopsController();

  const authOpts = {
    onRequest: [async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: 'Não autorizado' });
      }
    }]
  };

  // POPs Principais
  fastify.get('/pops', controller.getAllPops);
  fastify.get('/pops/:id', controller.getPopById);
  fastify.post('/pops', controller.createPop); // Sem auth no legado mas ideal seria com
  fastify.put('/pops/:id', authOpts, controller.updatePop);
  fastify.delete('/pops/:id', authOpts, controller.deletePop);

  // Workflow Aprovações
  fastify.post('/pops/:id/approve-edit', controller.approveEdit);
  fastify.post('/pops/:id/reject-edit', controller.rejectEdit);

  // Integração / Seed Manual
  fastify.post('/pops/ingest', controller.ingestWorkspace);

  // Notificações / SLAs
  fastify.get('/notificacoes', controller.getNotifications);
  fastify.post('/notificacoes/:id/resend', controller.resendNotification);
  fastify.get('/documents/slas', controller.processSlas);

  // Documentos Dinâmicos e Low-Code
  fastify.get('/documents/types', controller.getDocTypes);
  fastify.post('/documents/types', controller.createDocType);
  fastify.put('/documents/types/:id', controller.updateDocType);
  fastify.delete('/documents/types/:id', controller.deleteDocType);

  fastify.get('/documents/categories', controller.getCategories);
  fastify.post('/documents/categories', controller.createCategory);

  fastify.get('/documents/workflows', controller.getWorkflows);
  fastify.post('/documents/workflows', controller.createWorkflow);

  fastify.get('/documents/templates', controller.getTemplates);
  fastify.post('/documents/templates', controller.createTemplate);

  fastify.get('/documents/forms', controller.getForms);
  fastify.post('/documents/forms', controller.createForm);

  fastify.post('/documents/ai-analysis', controller.aiAnalysis);
}
