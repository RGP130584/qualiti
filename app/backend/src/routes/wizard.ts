import { FastifyInstance } from 'fastify';
import pool from '../db';

export default async function wizardRoutes(fastify: FastifyInstance) {
  fastify.get('/wizard/status', async (request, reply) => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT nome, logo, configurado, modulos_ativos FROM instituicao LIMIT 1');
      if (res.rows.length === 0) {
        return { configurado: false };
      }
      return res.rows[0];
    } finally {
      client.release();
    }
  });

  fastify.post('/wizard/setup', async (request, reply) => {
    const { nome, logo, adminNome, adminEmail, adminSenha, modulosAtivos } = request.body as any;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Atualiza instituição
      await client.query(`
        UPDATE instituicao 
        SET nome = $1, logo = $2, configurado = TRUE, modulos_ativos = $3
      `, [nome, logo, JSON.stringify(modulosAtivos || [])]);

      // Atualiza ou insere admin
      const checkAdmin = await client.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);
      if (checkAdmin.rows.length > 0) {
        await client.query(`
          UPDATE usuarios 
          SET nome = $1, senha_hash = $2, rbac_role = 'Admin' 
          WHERE email = $3
        `, [adminNome, adminSenha, adminEmail]);
      } else {
        await client.query(`
          INSERT INTO usuarios (nome, email, senha_hash, rbac_role, departamento, unidade, mfa_enabled)
          VALUES ($1, $2, $3, 'Admin', 'Diretoria', 'Unidade Central', TRUE)
        `, [adminNome, adminEmail, adminSenha]);
      }

      await client.query('COMMIT');
      return { success: true, message: 'QualitaOS configurado com sucesso!' };
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao configurar instituição' });
    } finally {
      client.release();
    }
  });
}
