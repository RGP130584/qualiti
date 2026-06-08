'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, BookOpen, Video, FileText, CheckCircle2, Award, 
  Clock, AlertCircle, Plus, Play, CheckSquare, Compass, Layers, 
  Shield, TrendingUp, Cpu, BarChart2, Search, Trophy, Sparkles, User, RefreshCw 
} from 'lucide-react';

export default function EducationPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>({ progresso_licoes: {}, certificados: {} });
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Abas de Navegação Premium
  const [activeTab, setActiveTab] = useState<'onboarding' | 'trilhas' | 'competencias' | 'biblioteca' | 'gamificacao' | 'analytics' | 'ia'>('onboarding');
  const [user, setUser] = useState<any>({ nome: 'Enf. Maria Souza', email: 'maria.souza@qualitaos.com', role: 'Enfermeiro', departamento: 'Enfermagem', isGlobalAdmin: false });

  // Busca e Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Modais
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});

  // Modal de Novo Curso
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ titulo: '', descricao: '', setor: 'Geral', trilha: 'Integração Institucional', obrigatorio: true, sla_horas: 72, carga_horaria: 4, capa_url: '' });

  useEffect(() => {
    fetchInitialData();
  }, [user.email, user.departamento]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      let currentUser = { nome: 'Enf. Maria Souza', email: 'maria.souza@qualitaos.com', role: 'Enfermeiro', departamento: 'Enfermagem', isGlobalAdmin: false };
      
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const userData = await authRes.json();
        currentUser = { ...userData, email: userData.email || currentUser.email, isGlobalAdmin: userData.role === 'Admin' || userData.departamento === 'Diretoria' };
        setUser(currentUser);
      }

      const [coursesRes, progRes, tracksRes, compRes, badgesRes, libRes, anRes, aiRes] = await Promise.all([
        fetch('/api/education/courses'),
        fetch(`/api/education/progress/${currentUser.email}`),
        fetch(`/api/education/tracks?setor=${currentUser.departamento}`),
        fetch(`/api/education/competencies?setor=${currentUser.departamento}`),
        fetch('/api/education/badges'),
        fetch(`/api/education/library?setor=${currentUser.departamento}`),
        fetch('/api/education/analytics'),
        fetch('/api/education/ai-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, cargo: currentUser.role, setor: currentUser.departamento, conformidade_documental: 85 })
        })
      ]);

      if (coursesRes.ok) setCourses(await coursesRes.json());
      if (progRes.ok) setProgressData(await progRes.json());
      if (tracksRes.ok) setTracks(await tracksRes.json());
      if (compRes.ok) setCompetencies(await compRes.json());
      if (badgesRes.ok) setBadges(await badgesRes.json());
      if (libRes.ok) setLibrary(await libRes.json());
      if (anRes.ok) setAnalytics(await anRes.json());
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiRecommendations(aiData.recomendacoes || []);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da Universidade Corporativa', err);
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
        alert(`🏆 Conquista Desbloqueada! Você concluiu a trilha e obteve o certificado digital: ${data.certificado.codigo_certificado}`);
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
      alert('✅ Resposta Correta! Avançando progresso da lição.');
      handleCompleteLesson(lessonId, cursoId);
    } else {
      alert('❌ Resposta Incorreta. Revise o material da integração e tente novamente.');
    }
  }

  const integrationCourses = courses.filter(c => c.trilha === 'Integração Institucional' || c.obrigatorio);
  const filteredLibrary = library.filter(lib => {
    const matchesSearch = lib.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || lib.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'Todas' || lib.categoria === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '4rem' }}>
      {/* CABEÇALHO DA UNIVERSIDADE CORPORATIVA (NETFLIX / LINEAR VIBE) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', background: 'linear-gradient(135deg, #090d16, #111827, #1f2937)', padding: '3rem', borderRadius: '20px', color: 'white', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)', border: '1px solid #374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', borderRadius: '20px', boxShadow: '0 10px 25px rgba(99,102,241,0.4)' }}>
            <GraduationCap size={48} style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem' }}>
              <span className="badge" style={{ background: '#6366f1', color: 'white', fontWeight: 800, padding: '0.4rem 0.8rem', fontSize: '0.85rem', letterSpacing: '0.5px' }}>UNIVERSIDADE CORPORATIVA</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem' }}>✨ IA-First & Gamificada</span>
              <span className="badge" style={{ background: '#f59e0b', color: '#090d16', fontWeight: 800, fontSize: '0.85rem' }}>SLA 72h Ativo</span>
            </div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 900, margin: 0, letterSpacing: '-0.8px', background: 'linear-gradient(to right, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              QualitiOS Corporate University
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem', margin: '0.6rem 0 0 0', maxWidth: '80ch', lineHeight: 1.6 }}>
              Plataforma de streaming educacional corporativo e gestão de conhecimento institucional. Capacitação contínua, onboarding obrigatório, matriz de competências e trilhas inteligentes recomendadas por Inteligência Artificial.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={fetchInitialData} className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700 }}>
            <RefreshCw size={16} /> Atualizar Portal
          </button>
          {user.isGlobalAdmin && (
            <button onClick={() => setShowCourseModal(true)} className="btn btn-primary" style={{ padding: '0.8rem 1.8rem', fontWeight: 800, background: '#6366f1', color: 'white', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
              <Plus size={18} /> Criar Novo Curso / Trilha
            </button>
          )}
        </div>
      </div>

      {/* BARRA DE NAVEGAÇÃO PREMIUM DAS ABAS */}
      <div style={{ display: 'flex', gap: '0.8rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.8rem', flexWrap: 'wrap' }}>
        {[
          { id: 'onboarding', label: '1. Onboarding & Integração (SLA 72h)', icon: Clock, color: '#f59e0b' },
          { id: 'trilhas', label: `2. Trilhas do Setor (${user.departamento})`, icon: Compass, color: '#3b82f6' },
          { id: 'competencias', label: '3. Gestão de Competências & Gaps', icon: Layers, color: '#10b981' },
          { id: 'biblioteca', label: '4. Biblioteca Corporativa & POPs', icon: BookOpen, color: '#8b5cf6' },
          { id: 'gamificacao', label: '5. Gamificação, Badges & Ranking', icon: Trophy, color: '#ec4899' },
          { id: 'ia', label: '6. Recomendações da IA Educacional', icon: Cpu, color: '#6366f1' },
          { id: 'analytics', label: '7. Analytics & Dashboards Executivos', icon: BarChart2, color: '#06b6d4' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.8rem 1.4rem',
                fontSize: '0.95rem',
                fontWeight: isActive ? 800 : 600,
                background: isActive ? '#0f172a' : 'white',
                color: isActive ? 'white' : '#64748b',
                border: isActive ? 'none' : '1px solid #cbd5e1',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(15,23,42,0.2)' : 'none'
              }}
              className="hover:border-slate-400"
            >
              <Icon size={18} style={{ color: isActive ? tab.color : '#94a3b8' }} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {loading ? (
        <div style={{ padding: '6rem', textAlign: 'center', color: '#64748b', fontSize: '1.2rem', fontWeight: 600 }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          Carregando Universidade Corporativa Inteligente...
        </div>
      ) : (
        <>
          {/* ABA 1: ONBOARDING & INTEGRAÇÃO OBRIGATÓRIA */}
          {activeTab === 'onboarding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '2px solid #f59e0b', padding: '2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 10px 20px -5px rgba(245,158,11,0.15)' }}>
                <AlertCircle size={36} style={{ color: '#d97706', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, color: '#92400e', fontSize: '1.25rem', fontWeight: 800 }}>SLA de Integração Institucional Obrigatório (72 Horas)</h4>
                  <p style={{ margin: '0.4rem 0 0 0', color: '#b45309', fontSize: '1rem', lineHeight: 1.5 }}>
                    Conforme as diretrizes de governança da acreditação ONA, todos os novos colaboradores devem concluir os módulos, assistir aos vídeos e ser aprovados nos quizzes desta trilha dentro das primeiras <strong>72 horas de admissão</strong>. O cumprimento gera o badge <em>Mestre da Qualidade</em>.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                {integrationCourses.map(curso => {
                  const isCertGerado = !!progressData.certificados[curso.id];
                  return (
                    <div key={curso.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                      <div style={{ height: '220px', background: `url(${curso.capa_url}) center/cover no-repeat`, position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.9), rgba(15,23,42,0.2))' }}></div>
                        <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <span className="badge" style={{ background: '#f59e0b', color: '#0f172a', fontWeight: 800, padding: '0.5rem 1rem', fontSize: '0.85rem' }}>SLA {curso.sla_horas} Horas</span>
                          <span style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', background: 'rgba(15,23,42,0.7)', padding: '0.4rem 0.8rem', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>{curso.carga_horaria}h de Carga Horária</span>
                        </div>
                      </div>

                      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', flexGrow: 1, background: 'white' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{curso.titulo}</h3>
                          <p style={{ color: '#64748b', fontSize: '1rem', margin: '0.6rem 0 0 0', lineHeight: 1.5 }}>{curso.descricao}</p>
                        </div>

                        {/* MÓDULOS E LIÇÕES */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Estrutura Curricular Modular</h5>
                          {curso.modules?.map((mod: any) => (
                            <div key={mod.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                              <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem', fontWeight: 800 }}>{mod.titulo}</strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {mod.lessons?.map((les: any) => {
                                  const isConc = !!progressData.progresso_licoes[les.id];
                                  return (
                                    <div key={les.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1.2rem', background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        {les.tipo === 'video' && <Video size={18} style={{ color: '#6366f1' }} />}
                                        {les.tipo === 'pdf' && <FileText size={18} style={{ color: '#f59e0b' }} />}
                                        {les.tipo === 'quiz' && <CheckSquare size={18} style={{ color: '#10b981' }} />}
                                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isConc ? '#94a3b8' : '#0f172a', textDecoration: isConc ? 'line-through' : 'none' }}>{les.titulo}</span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{les.duracao_minutos} min</span>
                                        {isConc ? (
                                          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontWeight: 800 }}><CheckCircle2 size={14} /> Concluído</span>
                                        ) : (
                                          <button 
                                            onClick={() => { setActiveLesson(les); setSelectedCourse(curso); }} 
                                            className="btn btn-primary" 
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 800, background: '#6366f1', color: 'white', borderRadius: '6px' }}
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
                          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', fontWeight: 800, boxShadow: '0 10px 20px rgba(16,185,129,0.2)' }}>
                            🎉 Diploma Digital Emitido: {progressData.certificados[curso.id].codigo_certificado}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '1rem', borderRadius: '12px' }}>
                            Conclua todas as lições e quizzes para liberar sua certificação com selo ONA.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA 2: TRILHAS INTELIGENTES POR SETOR */}
          {activeTab === 'trilhas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Trilhas Curriculares de {user.departamento}</h3>
                  <p style={{ color: '#64748b', margin: '0.4rem 0 0 0', fontSize: '1rem' }}>Capacitações específicas, protocolos assistenciais e fluxos operacionais desenhados para a sua especialidade.</p>
                </div>
                <span className="badge" style={{ background: '#3b82f6', color: 'white', fontWeight: 800, padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>{tracks.length} Trilhas Ativas</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {tracks.length === 0 ? (
                  <div className="card" style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontSize: '1.1rem' }}>Nenhuma trilha curricular cadastrada para o setor {user.departamento}.</div>
                ) : tracks.map(tr => (
                  <div key={tr.id} className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Compass size={30} />
                      </div>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: 800, fontSize: '0.85rem' }}>{tr.carga_horaria_total}h de Carga Horária</span>
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{tr.titulo}</h4>
                      <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0.6rem 0 0 0', lineHeight: 1.5 }}>{tr.descricao}</p>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: 'auto' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.8rem', fontWeight: 800 }}>Cursos Vinculados à Trilha</strong>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {tr.cursos_ids?.map((cId: number) => {
                          const cursoObj = courses.find(c => c.id === cId);
                          return (
                            <span key={cId} className="badge" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                              📚 {cursoObj?.titulo || `Curso #${cId}`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: MATRIZ DE COMPETÊNCIAS & GAPS (MODELO QUALIEX) */}
          {activeTab === 'competencias' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Matriz de Competências & Gaps de Conhecimento</h3>
                  <p style={{ color: '#64748b', margin: '0.4rem 0 0 0', fontSize: '1rem' }}>Mapeamento de habilidades exigidas por cargo e recomendação automática de treinamentos para cobrir gaps operacionais.</p>
                </div>
                <span className="badge" style={{ background: '#10b981', color: 'white', fontWeight: 800, padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>Nível Exigido: Pleno / Avançado</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {competencies.map(comp => (
                  <div key={comp.id} className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Cargo / Função</span>
                        <h4 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>{comp.cargo}</h4>
                      </div>
                      <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #34d399', fontWeight: 800, padding: '0.5rem 1rem' }}>
                        {comp.nivel_exigido}
                      </span>
                    </div>

                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', fontWeight: 800, marginBottom: '0.8rem', textTransform: 'uppercase' }}>Competências & Habilidades Obrigatórias</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {comp.competencias_obrigatorias?.map((habilidade: string) => (
                          <div key={habilidade} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1.2rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                            <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>{habilidade}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.5rem', marginTop: 'auto' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#1e3a8a', fontWeight: 800, marginBottom: '0.6rem', textTransform: 'uppercase' }}>Treinamentos de Nivelamento Vinculados</strong>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#1e40af', fontSize: '0.9rem', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {comp.treinamentos_vinculados?.map((trein: string) => (
                          <li key={trein}>{trein}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 4: BIBLIOTECA CORPORATIVA INSTITUCIONAL */}
          {activeTab === 'biblioteca' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexGrow: 1, maxWidth: '500px' }}>
                  <Search size={20} style={{ color: '#64748b' }} />
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Buscar por título, protocolo, POP ou palavra-chave..." 
                    style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>Filtrar Categoria:</span>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ padding: '0.8rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 700 }}>
                    <option value="Todas">Todas as Categorias</option>
                    <option value="Governança">Governança</option>
                    <option value="Assistência">Assistência</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {filteredLibrary.length === 0 ? (
                  <div className="card" style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontSize: '1.1rem' }}>Nenhum material encontrado na biblioteca para a sua busca.</div>
                ) : filteredLibrary.map(lib => (
                  <div key={lib.id} className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="badge" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 800 }}>{lib.categoria}</span>
                      <span className={`badge ${lib.tipo === 'PDF' ? 'badge-warning' : 'badge-info'}`} style={{ fontWeight: 800 }}>{lib.tipo}</span>
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>{lib.titulo}</h4>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginTop: '0.4rem' }}>Setor Alvo: {lib.setor}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {lib.tags?.map((tag: string) => (
                        <span key={tag} className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: 700 }}>
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <a href={lib.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginTop: 'auto', padding: '0.8rem', justifyContent: 'center', fontWeight: 800, background: '#8b5cf6', color: 'white', borderRadius: '10px' }}>
                      <BookOpen size={16} /> Acessar Material Completo
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 5: GAMIFICAÇÃO, BADGES & RANKING DE APRENDIZAGEM */}
          {activeTab === 'gamificacao' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #831843, #be185d)', padding: '2.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 10px 20px rgba(190,24,93,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <Trophy size={48} style={{ color: '#fbcfe8' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>Ranking Institucional & Conquistas (Badges)</h3>
                    <p style={{ color: '#f9a8d4', margin: '0.4rem 0 0 0', fontSize: '1.05rem' }}>Acumule pontos concluindo trilhas no SLA e participando de reciclagens para liderar o ranking da qualidade.</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.2rem 2rem', borderRadius: '16px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbcfe8', textTransform: 'uppercase', display: 'block' }}>Sua Pontuação Atual</span>
                  <strong style={{ fontSize: '2.4rem', fontWeight: 900 }}>850 XP</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {badges.map(bg => (
                  <div key={bg.id} className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', borderRadius: '20px', border: '2px solid #fbcfe8', background: 'white', boxShadow: '0 10px 25px -5px rgba(236,72,153,0.1)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #fcc2d7, #f06595)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(240,101,149,0.3)' }}>
                      <Trophy size={40} />
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{bg.titulo}</h4>
                      <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0.6rem 0 0 0', lineHeight: 1.5 }}>{bg.descricao}</p>
                    </div>

                    <div style={{ marginTop: 'auto', background: '#fdf2f8', border: '1px solid #fbcfe8', padding: '0.6rem 1.5rem', borderRadius: '20px', color: '#be185d', fontWeight: 800, fontSize: '1rem' }}>
                      +{bg.pontos} XP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 6: IA EDUCACIONAL CONTEXTUAL */}
          {activeTab === 'ia' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, #312e81, #4338ca)', padding: '2.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 10px 20px rgba(67,56,202,0.2)' }}>
                <Cpu size={48} style={{ color: '#c7d2fe' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>Motor de IA Educacional & Recomendações Contextuais</h3>
                  <p style={{ color: '#e0e7ff', margin: '0.4rem 0 0 0', fontSize: '1.05rem' }}>A IA analisa continuamente suas taxas de conformidade documental e desempenho operacional para sugerir jornadas de reciclagem exatas.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {aiRecommendations.length === 0 ? (
                  <div className="card" style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontSize: '1.1rem' }}>Nenhuma recomendação de reciclagem pendente no momento. Sua conformidade está excelente!</div>
                ) : aiRecommendations.map((rec, idx) => (
                  <div key={idx} className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '20px', border: '2px solid #c7d2fe', background: 'white', boxShadow: '0 10px 25px -5px rgba(99,102,241,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: 800, padding: '0.4rem 0.8rem' }}>{rec.tipo}</span>
                      <span className={`badge ${rec.prioridade === 'Crítica' ? 'badge-danger' : 'badge-warning'}`} style={{ fontWeight: 800 }}>{rec.prioridade}</span>
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{rec.titulo}</h4>
                      <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0.6rem 0 0 0', lineHeight: 1.5 }}>{rec.motivo}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Carga: {rec.carga_horaria} Horas</span>
                      <a href={rec.acao_url} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontWeight: 800, background: '#6366f1', color: 'white', borderRadius: '8px' }}>
                        Iniciar Reciclagem
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 7: ANALYTICS & DASHBOARDS EXECUTIVOS */}
          {activeTab === 'analytics' && analytics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {[
                  { title: 'Total de Cursos Ativos', value: analytics.total_cursos, color: '#3b82f6' },
                  { title: 'Trilhas Curriculares', value: analytics.total_trilhas, color: '#10b981' },
                  { title: 'Certificados Emitidos', value: analytics.total_certificados, color: '#8b5cf6' },
                  { title: 'Colaboradores Ativos', value: analytics.total_colaboradores, color: '#f59e0b' },
                ].map((stat, idx) => (
                  <div key={idx} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderRadius: '16px', border: '1px solid #cbd5e1', background: 'white' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{stat.title}</span>
                    <strong style={{ fontSize: '2.4rem', fontWeight: 900, color: stat.color }}>{stat.value}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                <div className="card" style={{ padding: '2.5rem', borderRadius: '20px', border: '1px solid #cbd5e1', background: 'white' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Aderência & Conformidade Institucional</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1rem', color: '#334155' }}>
                        <span>Aderência Global de Treinamento</span>
                        <span style={{ color: '#10b981' }}>{analytics.aderencia_institucional}%</span>
                      </div>
                      <div style={{ background: '#f1f5f9', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${analytics.aderencia_institucional}%`, background: '#10b981', height: '100%', borderRadius: '6px' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1rem', color: '#334155' }}>
                        <span>Satisfação NPS (Qualidade do Conteúdo)</span>
                        <span style={{ color: '#3b82f6' }}>{analytics.satisfacao_nps}%</span>
                      </div>
                      <div style={{ background: '#f1f5f9', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${analytics.satisfacao_nps}%`, background: '#3b82f6', height: '100%', borderRadius: '6px' }}></div>
                      </div>
                    </div>

                    <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
                      <strong style={{ display: 'block', color: '#b45309', fontSize: '1.05rem', fontWeight: 800 }}>⚠️ Atenção de Governança</strong>
                      <p style={{ margin: '0.4rem 0 0 0', color: '#92400e', fontSize: '0.95rem' }}>Existem <strong>{analytics.treinamentos_vencidos} treinamentos com SLA vencido</strong> na instituição. O comitê da qualidade foi notificado para escalar os gestores diretos.</p>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '2.5rem', borderRadius: '20px', border: '1px solid #cbd5e1', background: 'white' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Cursos Mais Concluídos (Top Ranking)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {analytics.cursos_populares?.map((cp: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>
                            {idx + 1}
                          </span>
                          <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{cp.titulo}</strong>
                        </div>
                        <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>{cp.concluidos} Conclusões</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE AULA / VÍDEO / QUIZ */}
      {activeLesson && selectedCourse && (
        <div className="modal-overlay" onClick={() => setActiveLesson(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '100%', padding: '3rem', borderRadius: '24px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                {activeLesson.tipo === 'video' && <Video size={24} style={{ color: '#6366f1' }} />}
                {activeLesson.tipo === 'pdf' && <FileText size={24} style={{ color: '#f59e0b' }} />}
                {activeLesson.tipo === 'quiz' && <CheckSquare size={24} style={{ color: '#10b981' }} />}
                {activeLesson.titulo}
              </h3>
              <button onClick={() => setActiveLesson(null)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800 }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* VÍDEO PLAYER / YOUTUBE EMBED */}
              {activeLesson.tipo === 'video' && (
                <div style={{ background: '#000', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative', width: '100%', paddingTop: activeLesson.conteudo_url.includes('youtube.com') || activeLesson.conteudo_url.includes('youtu.be') ? '56.25%' : '0' }}>
                  {activeLesson.conteudo_url.includes('youtube.com') || activeLesson.conteudo_url.includes('youtu.be') ? (
                    <iframe 
                      src={activeLesson.conteudo_url} 
                      title={activeLesson.titulo}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen 
                    />
                  ) : (
                    <video controls src={activeLesson.conteudo_url} style={{ width: '100%', maxHeight: '500px', display: 'block' }} autoPlay />
                  )}
                </div>
              )}

              {/* PDF VIEWER SIMULADO */}
              {activeLesson.tipo === 'pdf' && (
                <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '20px', padding: '5rem 2rem', textAlign: 'center' }}>
                  <FileText size={72} style={{ color: '#f59e0b', margin: '0 auto 1.5rem auto' }} />
                  <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>Documento de Leitura Obrigatória</h4>
                  <p style={{ color: '#64748b', fontSize: '1rem', margin: '0.6rem 0 2rem 0', maxWidth: '50ch', marginX: 'auto', lineHeight: 1.5 }}>Revise o manual técnico completo para garantir o cumprimento das diretrizes de governança e acreditação ONA.</p>
                  <a href={activeLesson.conteudo_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 2rem', fontWeight: 800, background: '#6366f1', color: 'white', borderRadius: '10px', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
                    <BookOpen size={18} /> Abrir Material em Nova Aba
                  </a>
                </div>
              )}

              {/* QUIZ DE AVALIAÇÃO */}
              {activeLesson.tipo === 'quiz' && activeLesson.quizzes?.map((quiz: any, idx: number) => (
                <div key={quiz.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '2.5rem' }}>
                  <h4 style={{ margin: '0 0 1.8rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.4 }}>Questão {idx + 1}: {quiz.pergunta}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {quiz.opcoes.map((op: string, opIdx: number) => {
                      const isSelected = quizAnswers[quiz.id] === opIdx;
                      return (
                        <div 
                          key={opIdx} 
                          onClick={() => handleQuizSelection(quiz.id, opIdx)}
                          style={{ 
                            padding: '1.2rem 1.5rem', background: isSelected ? '#e0e7ff' : 'white', 
                            border: `2px solid ${isSelected ? '#6366f1' : '#cbd5e1'}`, 
                            borderRadius: '12px', cursor: 'pointer', fontWeight: isSelected ? 800 : 600,
                            color: isSelected ? '#1e1b4b' : '#334155', display: 'flex', alignItems: 'center', gap: '1rem',
                            transition: 'all 0.2s ease', boxShadow: isSelected ? '0 4px 12px rgba(99,102,241,0.15)' : '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? '#6366f1' : '#e2e8f0', color: isSelected ? 'white' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>
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
                    style={{ marginTop: '2rem', width: '100%', padding: '1rem', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', background: '#10b981', color: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
                  >
                    Verificar Resposta & Registrar Conquista
                  </button>
                </div>
              ))}

              {/* BOTAO DE CONCLUIR AULA (PARA VIDEO E PDF) */}
              {activeLesson.tipo !== 'quiz' && (
                <button 
                  onClick={() => handleCompleteLesson(activeLesson.id, selectedCourse.id)} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '1.2rem', justifyContent: 'center', fontWeight: 900, fontSize: '1.15rem', background: '#10b981', color: 'white', marginTop: '1rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
                >
                  <CheckCircle2 size={22} /> Marcar Lição como Concluída & Ganhar XP
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOVO CURSO / TRILHA */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', padding: '3rem', borderRadius: '24px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <h3 className="card-title" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>Criar Nova Trilha de Educação Corporativa</h3>
              <button onClick={() => setShowCourseModal(false)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800 }}>X</button>
            </div>
            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Título do Curso / Trilha</label>
                <input type="text" value={courseForm.titulo} onChange={e => setCourseForm({...courseForm, titulo: e.target.value})} required placeholder="Ex: Protocolos de Segurança do Paciente..." style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Descrição Detalhada</label>
                <textarea value={courseForm.descricao} onChange={e => setCourseForm({...courseForm, descricao: e.target.value})} rows={3} required placeholder="Descreva os objetivos de aprendizagem e competências..." style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Setor Alvo</label>
                  <select value={courseForm.setor} onChange={e => setCourseForm({...courseForm, setor: e.target.value})} style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                    <option value="Geral">Geral (Integração)</option>
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Medicina Clínica">Medicina Clínica</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Trilha Curricular</label>
                  <input type="text" value={courseForm.trilha} onChange={e => setCourseForm({...courseForm, trilha: e.target.value})} required placeholder="Ex: Integração Institucional" style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Obrigatório?</label>
                  <select value={courseForm.obrigatorio ? 'true' : 'false'} onChange={e => setCourseForm({...courseForm, obrigatorio: e.target.value === 'true'})} style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                    <option value="true">Sim (SLA Ativo)</option>
                    <option value="false">Não (Eletivo)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Prazo SLA (Horas)</label>
                  <input type="number" value={courseForm.sla_horas} onChange={e => setCourseForm({...courseForm, sla_horas: parseInt(e.target.value)})} required style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Carga Horária (h)</label>
                  <input type="number" value={courseForm.carga_horaria} onChange={e => setCourseForm({...courseForm, carga_horaria: parseInt(e.target.value)})} required style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>URL da Imagem de Capa</label>
                <input type="text" value={courseForm.capa_url} onChange={e => setCourseForm({...courseForm, capa_url: e.target.value})} placeholder="https://images.unsplash.com/..." style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '1rem', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', background: '#6366f1', color: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(99,102,241,0.4)', marginTop: '1rem' }}>Confirmar Criação do Curso</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
