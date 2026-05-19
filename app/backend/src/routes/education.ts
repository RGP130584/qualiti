import { FastifyInstance } from 'fastify';
import pool from '../db';

export default async function educationRoutes(fastify: FastifyInstance) {
  // Lista todos os cursos com seus módulos e lições associadas
  fastify.get('/education/courses', async (request, reply) => {
    const { setor } = request.query as any;
    const client = await pool.connect();
    try {
      let queryStr = 'SELECT * FROM education_courses WHERE ativo = TRUE ORDER BY id ASC';
      const params: any[] = [];
      if (setor && setor !== 'Diretoria Geral' && setor !== 'Qualidade e ONA') {
        queryStr = 'SELECT * FROM education_courses WHERE (setor = $1 OR setor = \'Geral\') AND ativo = TRUE ORDER BY id ASC';
        params.push(setor);
      }
      const resCourses = await client.query(queryStr, params);

      const resMods = await client.query('SELECT * FROM education_modules ORDER BY ordem ASC');
      const resLessons = await client.query('SELECT * FROM education_lessons ORDER BY ordem ASC');
      const resQuizzes = await client.query('SELECT * FROM education_quizzes ORDER BY id ASC');

      const quizMap: Record<number, any[]> = {};
      for (const q of resQuizzes.rows) {
        if (!quizMap[q.licao_id]) quizMap[q.licao_id] = [];
        quizMap[q.licao_id].push(q);
      }

      const lessonMap: Record<number, any[]> = {};
      for (const l of resLessons.rows) {
        if (!lessonMap[l.modulo_id]) lessonMap[l.modulo_id] = [];
        lessonMap[l.modulo_id].push({ ...l, quizzes: quizMap[l.id] || [] });
      }

      const modMap: Record<number, any[]> = {};
      for (const m of resMods.rows) {
        if (!modMap[m.curso_id]) modMap[m.curso_id] = [];
        modMap[m.curso_id].push({ ...m, lessons: lessonMap[m.id] || [] });
      }

      return resCourses.rows.map(c => ({
        ...c,
        modules: modMap[c.id] || []
      }));
    } finally {
      client.release();
    }
  });

  // Cria um novo curso no LMS
  fastify.post('/education/courses', async (request, reply) => {
    const { titulo, descricao, setor, trilha, obrigatorio, sla_horas, carga_horaria, capa_url } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO education_courses (titulo, descricao, setor, trilha, obrigatorio, sla_horas, carga_horaria, capa_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `, [
        titulo, descricao, setor || 'Geral', trilha || 'Geral', obrigatorio || false, 
        sla_horas || 72, carga_horaria || 4, capa_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'
      ]);
      return res.rows[0];
    } finally {
      client.release();
    }
  });

  // Cria um novo módulo para um curso
  fastify.post('/education/courses/:cursoId/modules', async (request, reply) => {
    const { cursoId } = request.params as any;
    const { titulo, ordem, descricao } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO education_modules (curso_id, titulo, ordem, descricao)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [cursoId, titulo, ordem || 1, descricao]);
      return res.rows[0];
    } finally {
      client.release();
    }
  });

  // Cria uma nova lição para um módulo
  fastify.post('/education/modules/:moduloId/lessons', async (request, reply) => {
    const { moduloId } = request.params as any;
    const { titulo, tipo, conteudo_url, duracao_minutos, ordem } = request.body as any;
    const client = await pool.connect();
    try {
      const res = await client.query(`
        INSERT INTO education_lessons (modulo_id, titulo, tipo, conteudo_url, duracao_minutos, ordem)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `, [moduloId, titulo, tipo || 'video', conteudo_url, duracao_minutos || 15, ordem || 1]);
      return res.rows[0];
    } finally {
      client.release();
    }
  });

  // Obtém o progresso de um usuário específico
  fastify.get('/education/progress/:email', async (request, reply) => {
    const { email } = request.params as any;
    const client = await pool.connect();
    try {
      const resProg = await client.query('SELECT licao_id, concluido, data_conclusao FROM education_progress WHERE usuario_email = $1', [email]);
      const resCert = await client.query('SELECT curso_id, codigo_certificado, data_emissao FROM education_certificates WHERE usuario_email = $1', [email]);
      
      const progressMap: Record<number, boolean> = {};
      for (const p of resProg.rows) {
        progressMap[p.licao_id] = p.concluido;
      }

      const certMap: Record<number, any> = {};
      for (const c of resCert.rows) {
        certMap[c.curso_id] = c;
      }

      return { progresso_licoes: progressMap, certificados: certMap };
    } finally {
      client.release();
    }
  });

  // Registra a conclusão de uma lição por um usuário
  fastify.post('/education/lessons/:licaoId/complete', async (request, reply) => {
    const { licaoId } = request.params as any;
    const { email, curso_id } = request.body as any;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Marca a lição como concluída
      await client.query(`
        INSERT INTO education_progress (usuario_email, licao_id, concluido, data_conclusao)
        VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP)
        ON CONFLICT (usuario_email, licao_id) 
        DO UPDATE SET concluido = TRUE, data_conclusao = CURRENT_TIMESTAMP;
      `, [email, licaoId]);

      // 2. Verifica se todas as lições do curso foram concluídas
      const resTotal = await client.query(`
        SELECT l.id FROM education_lessons l
        JOIN education_modules m ON l.modulo_id = m.id
        WHERE m.curso_id = $1
      `, [curso_id]);

      const resConc = await client.query(`
        SELECT p.licao_id FROM education_progress p
        JOIN education_lessons l ON p.licao_id = l.id
        JOIN education_modules m ON l.modulo_id = m.id
        WHERE m.curso_id = $1 AND p.usuario_email = $2 AND p.concluido = TRUE
      `, [curso_id, email]);

      let certificadoGerado = null;

      // Se o total de lições concluídas for igual ao total de lições do curso, emite certificado
      if (resTotal.rows.length > 0 && resConc.rows.length === resTotal.rows.length) {
        const codigoCert = `CERT_${curso_id}_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const resCert = await client.query(`
          INSERT INTO education_certificates (usuario_email, curso_id, codigo_certificado)
          VALUES ($1, $2, $3)
          ON CONFLICT (codigo_certificado) DO NOTHING
          RETURNING *;
        `, [email, curso_id, codigoCert]);

        if (resCert.rows.length > 0) {
          certificadoGerado = resCert.rows[0];
        }
      }

      await client.query('COMMIT');
      return { success: true, message: 'Lição concluída com sucesso', certificado: certificadoGerado };
    } catch (err) {
      await client.query('ROLLBACK');
      fastify.log.error(err);
      reply.status(500).send({ error: 'Erro ao registrar progresso da lição' });
    } finally {
      client.release();
    }
  });
}
