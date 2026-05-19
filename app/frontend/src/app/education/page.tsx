'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Video, FileText, CheckCircle2, Award, Clock, AlertCircle, Plus, Play, CheckSquare } from 'lucide-react';

export default function EducationPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any>({ progresso_licoes: {}, certificados: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'integracao' | 'setor' | 'certificados'>('integracao');
  const [user, setUser] = useState<any>({ nome: 'Enf. Maria Souza', email: 'maria.souza@qualitaos.com', role: 'Enfermeiro', departamento: 'Enfermagem', isGlobalAdmin: false });

  // Modal de Aula / Vídeo / Quiz
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});

  // Modal de Novo Curso / Módulo / Aula
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ titulo: '', descricao: '', setor: 'Geral', trilha: 'Integração Institucional', obrigatorio: true, sla_horas: 72, carga_horaria: 4, capa_url: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const token = localStorage.getItem('qualita_token');
      let currentUserEmail = 'maria.souza@qualitaos.com';
      if (token) {
        const authRes = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (authRes.ok) {
          const userData = await authRes.json();
          currentUserEmail = userData.email || currentUserEmail;
          setUser({ ...userData, email: currentUserEmail, isGlobalAdmin: userData.role === 'Admin' || userData.departamento === 'Diretoria' });
        }
      }

      const [coursesRes, progRes] = await Promise.all([
        fetch('/api/education/courses'),
        fetch(`/api/education/progress/${currentUserEmail}`)
      ]);

      if (coursesRes.ok) setCourses(await coursesRes.json());
      if (progRes.ok) setProgressData(await progRes.json());
    } catch (err) {
      console.error('Erro ao buscar dados do LMS', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/education/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseForm)
    });
    if (res.ok) {
      setShowCourseModal(false);
      setCourseForm({ titulo: '', descricao: '', setor: 'Geral', trilha: 'Integração Institucional', obrigatorio: true, sla_horas: 72, carga_horaria: 4, capa_url: '' });
      fetchInitialData();
    }
  }

  async function handleCompleteLesson(lessonId: number, cursoId: number) {
    const res = await fetch(`/api/education/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, curso_id: cursoId })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.certificado) {
        alert(`Parabéns! Você concluiu todas as etapas e obteve o certificado: ${data.certificado.codigo_certificado}`);
      }
      fetchInitialData();
      setActiveLesson(null);
    }
  }

  function handleQuizSelection(quizId: number, optionIdx: number) {
    setQuizAnswers({ ...quizAnswers, [quizId]: optionIdx });
  }

  function handleVerifyQuiz(quiz: any, lessonId: number, cursoId: number) {
    const userAnswer = quizAnswers[quiz.id];
    if (userAnswer === undefined) return alert('Selecione uma opção antes de verificar.');
    setQuizSubmitted({ ...quizSubmitted, [quiz.id]: true });

    if (userAnswer === quiz.resposta_correta) {
      alert('Resposta Correta! Avançando progresso da lição.');
      handleCompleteLesson(lessonId, cursoId);
    } else {
      alert('Resposta Incorreta. Revise o material da integração e tente novamente.');
    }
  }

  const integrationCourses = courses.filter(c => c.trilha === 'Integração Institucional' || c.obrigatorio);
  const sectorCourses = courses.filter(c => c.setor === user.departamento || c.setor === 'Geral');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '4rem' }}>
      {/* CABEÇALHO DO LMS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '2.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            <GraduationCap size={44} style={{ color: '#818cf8' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: '#818cf8', color: '#1e1b4b', fontWeight: 700, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>LMS ENTERPRISE</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.85rem' }}>SLA 72 Horas Obrigatório</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Educação Corporativa & Integração ONA</h1>
            <p style={{ color: '#e0e7ff', fontSize: '1.05rem', margin: '0.4rem 0 0 0', maxWidth: '85ch' }}>
              Trilhas de capacitação contínua, vídeos institucionais, avaliação de conformidade e certificação digital com controle de vigência.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user.isGlobalAdmin && (
            <button onClick={() => setShowCourseModal(true)} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: 700, background: '#818cf8', color: '#1e1b4b' }}>
              <Plus size={16} /> Criar Novo Curso / Trilha
            </button>
          )}
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO DO LMS */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'integracao', label: '1. Trilha de Integração (SLA 72h)', icon: Clock },
          { id: 'setor', label: `2. Treinamentos do Setor (${user.departamento})`, icon: BookOpen },
          { id: 'certificados', label: '3. Meus Certificados & Conquistas', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.8rem 1.5rem',
                fontSize: '1rem',
                fontWeight: isActive ? 700 : 600,
                background: isActive ? 'var(--ink)' : 'transparent',
                color: isActive ? 'white' : 'var(--ink)',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>Carregando trilhas de aprendizagem do LMS...</div>
      ) : (
        <>
          {/* ABA 1: TRILHA DE INTEGRAÇÃO */}
          {activeTab === 'integracao' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <AlertCircle size={28} style={{ color: '#d97706', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, color: '#92400e', fontSize: '1.1rem', fontWeight: 800 }}>Aviso de SLA de Integração Institucional</h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#b45309', fontSize: '0.95rem' }}>
                    Todos os novos colaboradores possuem um prazo estrito de <strong>72 horas</strong> a partir da admissão para concluir os módulos e quizzes desta trilha obrigatória. O não cumprimento gera pendência no painel de governança ONA.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                {integrationCourses.map(curso => {
                  const isCertGerado = !!progressData.certificados[curso.id];
                  return (
                    <div key={curso.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: '180px', background: `url(${curso.capa_url}) center/cover no-repeat`, position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                        <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <span className="badge badge-warning" style={{ fontWeight: 700 }}>SLA {curso.sla_horas} Horas</span>
                          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', background: 'rgba(0,0,0,0.5)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>{curso.carga_horaria}h de Carga Horária</span>
                        </div>
                      </div>

                      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexGrow: 1 }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }}>{curso.titulo}</h3>
                          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: '0.5rem 0 0 0' }}>{curso.descricao}</p>
                        </div>

                        {/* MÓDULOS E LIÇÕES */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Estrutura Curricular</h5>
                          {curso.modules?.map((mod: any) => (
                            <div key={mod.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                              <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--ink)', marginBottom: '0.6rem' }}>{mod.titulo}</strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {mod.lessons?.map((les: any) => {
                                  const isConc = !!progressData.progresso_licoes[les.id];
                                  return (
                                    <div key={les.id} style={{ display: 'flex', items: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'var(--paper)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        {les.tipo === 'video' && <Video size={16} style={{ color: '#6366f1' }} />}
                                        {les.tipo === 'pdf' && <FileText size={16} style={{ color: '#f59e0b' }} />}
                                        {les.tipo === 'quiz' && <CheckSquare size={16} style={{ color: '#10b981' }} />}
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isConc ? 'var(--muted)' : 'var(--ink)', textDecoration: isConc ? 'line-through' : 'none' }}>{les.titulo}</span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{les.duracao_minutos} min</span>
                                        {isConc ? (
                                          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={12} /> Concluído</span>
                                        ) : (
                                          <button 
                                            onClick={() => { setActiveLesson(les); setSelectedCourse(curso); }} 
                                            className="btn btn-secondary" 
                                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: 700, background: '#6366f1', color: 'white' }}
                                          >
                                            <Play size={12} /> Iniciar
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {isCertGerado ? (
                          <div style={{ background: '#ecfdf5', border: '1px solid #10b981', padding: '1rem', borderRadius: '8px', textAlign: 'center', color: '#065f46', fontWeight: 700 }}>
                            🎉 Certificado Emitido: {progressData.certificados[curso.id].codigo_certificado}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>Conclua todas as lições e quizzes para liberar sua certificação.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 2: TREINAMENTOS DO SETOR */}
          {activeTab === 'setor' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
              {sectorCourses.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Nenhum treinamento específico encontrado para o setor {user.departamento}.</div>
              ) : sectorCourses.map(curso => (
                <div key={curso.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '180px', background: `url(${curso.capa_url}) center/cover no-repeat`, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                    <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>Setor: {curso.setor}</span>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', background: 'rgba(0,0,0,0.5)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>{curso.carga_horaria}h de Carga Horária</span>
                    </div>
                  </div>

                  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexGrow: 1 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }}>{curso.titulo}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: '0.5rem 0 0 0' }}>{curso.descricao}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {curso.modules?.map((mod: any) => (
                        <div key={mod.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                          <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--ink)', marginBottom: '0.6rem' }}>{mod.titulo}</strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {mod.lessons?.map((les: any) => {
                              const isConc = !!progressData.progresso_licoes[les.id];
                              return (
                                <div key={les.id} style={{ display: 'flex', items: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'var(--paper)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    {les.tipo === 'video' && <Video size={16} style={{ color: '#6366f1' }} />}
                                    {les.tipo === 'pdf' && <FileText size={16} style={{ color: '#f59e0b' }} />}
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isConc ? 'var(--muted)' : 'var(--ink)' }}>{les.titulo}</span>
                                  </div>
                                  {isConc ? (
                                    <span className="badge badge-success">Concluído</span>
                                  ) : (
                                    <button onClick={() => { setActiveLesson(les); setSelectedCourse(curso); }} className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>Iniciar</button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ABA 3: CERTIFICADOS */}
          {activeTab === 'certificados' && (
            <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={24} style={{ color: '#10b981' }} /> Meus Certificados de Conclusão & Histórico de Treinamento
              </h3>

              {Object.keys(progressData.certificados).length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Você ainda não possui certificados emitidos. Conclua as trilhas de capacitação para gerar seus diplomas digitais.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {Object.values(progressData.certificados).map((cert: any) => {
                    const curso = courses.find(c => c.id === cert.curso_id);
                    return (
                      <div key={cert.codigo_certificado} style={{ padding: '2rem', background: 'linear-gradient(135deg, #065f46, #047857)', color: 'white', borderRadius: '16px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)', border: '2px solid #34d399', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <Award size={36} style={{ color: '#a7f3d0' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>VERIFICADO ONA</span>
                          </div>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>{curso?.titulo || 'Capacitação ONA'}</h4>
                          <p style={{ color: '#d1fae5', fontSize: '0.85rem', margin: 0 }}>Carga Horária: {curso?.carga_horaria || 4} Horas</p>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                          <div>
                            <span style={{ display: 'block', color: '#a7f3d0', fontWeight: 700 }}>Código de Autenticidade</span>
                            <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{cert.codigo_certificado}</strong>
                          </div>
                          <div>
                            <span style={{ display: 'block', color: '#a7f3d0', fontWeight: 700 }}>Data de Emissão</span>
                            <strong>{new Date(cert.data_emissao).toLocaleDateString()}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL DE AULA / VÍDEO / QUIZ */}
      {activeLesson && selectedCourse && (
        <div className="modal-overlay" onClick={() => setActiveLesson(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', padding: '2.5rem' }}>
            <div className="modal-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {activeLesson.tipo === 'video' && <Video size={20} style={{ color: '#6366f1' }} />}
                {activeLesson.tipo === 'pdf' && <FileText size={20} style={{ color: '#f59e0b' }} />}
                {activeLesson.tipo === 'quiz' && <CheckSquare size={20} style={{ color: '#10b981' }} />}
                {activeLesson.titulo}
              </h3>
              <button onClick={() => setActiveLesson(null)} className="btn btn-secondary" style={{ padding: '0.3rem' }}>X</button>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* VÍDEO PLAYER */}
              {activeLesson.tipo === 'video' && (
                <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
                  <video controls src={activeLesson.conteudo_url} style={{ width: '100%', maxHeight: '450px', display: 'block' }} autoPlay />
                </div>
              )}

              {/* PDF VIEWER SIMULADO */}
              {activeLesson.tipo === 'pdf' && (
                <div style={{ background: 'var(--surface)', border: '2px dashed var(--border)', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center' }}>
                  <FileText size={64} style={{ color: '#f59e0b', margin: '0 auto 1rem auto' }} />
                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>Documento de Leitura Obrigatória</h4>
                  <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: '0.5rem 0 1.5rem 0' }}>Revise o manual técnico completo para garantir o cumprimento das diretrizes de governança.</p>
                  <a href={activeLesson.conteudo_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', fontWeight: 700 }}>
                    <BookOpen size={16} /> Abrir Material em Nova Aba
                  </a>
                </div>
              )}

              {/* QUIZ DE AVALIAÇÃO */}
              {activeLesson.tipo === 'quiz' && activeLesson.quizzes?.map((quiz: any, idx: number) => (
                <div key={quiz.id} style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem' }}>
                  <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)' }}>Questão {idx + 1}: {quiz.pergunta}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {quiz.opcoes.map((op: string, opIdx: number) => {
                      const isSelected = quizAnswers[quiz.id] === opIdx;
                      return (
                        <div 
                          key={opIdx} 
                          onClick={() => handleQuizSelection(quiz.id, opIdx)}
                          style={{ 
                            padding: '1rem', background: isSelected ? '#e0e7ff' : 'var(--surface)', 
                            border: `2px solid ${isSelected ? '#6366f1' : 'var(--border)'}`, 
                            borderRadius: '8px', cursor: 'pointer', fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? '#1e1b4b' : 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.8rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isSelected ? '#6366f1' : 'var(--border)', color: isSelected ? 'white' : 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                            {String.fromCharCode(65 + opIdx)}
                          </span>
                          {op}
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => handleVerifyQuiz(quiz, activeLesson.id, selectedCourse.id)} 
                    className="btn btn-primary" 
                    style={{ marginTop: '1.5rem', width: '100%', padding: '0.8rem', justifyContent: 'center', fontWeight: 700, background: '#10b981' }}
                  >
                    Verificar Resposta & Registrar Progresso
                  </button>
                </div>
              ))}

              {/* BOTAO DE CONCLUIR AULA (PARA VIDEO E PDF) */}
              {activeLesson.tipo !== 'quiz' && (
                <button 
                  onClick={() => handleCompleteLesson(activeLesson.id, selectedCourse.id)} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '1rem', justifyContent: 'center', fontWeight: 800, fontSize: '1.05rem', background: '#10b981', color: 'white', marginTop: '1rem' }}
                >
                  <CheckCircle2 size={20} /> Marcar Lição como Concluída
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOVO CURSO / TRILHA */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="card-title">Criar Nova Trilha de Educação Corporativa</h3>
              <button onClick={() => setShowCourseModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}>X</button>
            </div>
            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Título do Curso / Trilha</label>
                <input type="text" value={courseForm.titulo} onChange={e => setCourseForm({...courseForm, titulo: e.target.value})} required placeholder="Ex: Protocolos de Segurança do Paciente..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Descrição Descritiva</label>
                <textarea value={courseForm.descricao} onChange={e => setCourseForm({...courseForm, descricao: e.target.value})} rows={3} required placeholder="Descreva os objetivos de aprendizagem e competências..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Setor Alvo</label>
                  <select value={courseForm.setor} onChange={e => setCourseForm({...courseForm, setor: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="Geral">Geral (Integração)</option>
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Medicina Clínica">Medicina Clínica</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Trilha Curricular</label>
                  <input type="text" value={courseForm.trilha} onChange={e => setCourseForm({...courseForm, trilha: e.target.value})} required placeholder="Ex: Integração Institucional" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Obrigatório?</label>
                  <select value={courseForm.obrigatorio ? 'true' : 'false'} onChange={e => setCourseForm({...courseForm, obrigatorio: e.target.value === 'true'})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="true">Sim (SLA Ativo)</option>
                    <option value="false">Não (Eletivo)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Prazo SLA (Horas)</label>
                  <input type="number" value={courseForm.sla_horas} onChange={e => setCourseForm({...courseForm, sla_horas: parseInt(e.target.value)})} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Carga Horária (h)</label>
                  <input type="number" value={courseForm.carga_horaria} onChange={e => setCourseForm({...courseForm, carga_horaria: parseInt(e.target.value)})} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>URL da Imagem de Capa</label>
                <input type="text" value={courseForm.capa_url} onChange={e => setCourseForm({...courseForm, capa_url: e.target.value})} placeholder="https://images.unsplash.com/..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700, background: '#818cf8', color: '#1e1b4b' }}>Confirmar Criação do Curso</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
