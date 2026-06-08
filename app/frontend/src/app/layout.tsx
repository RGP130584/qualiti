'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Hospital, Activity, FileText, CheckSquare, Users, 
  TrendingUp, AlertTriangle, Cpu, ShieldCheck, Link2, LogOut,
  Layers, Compass, Award, Shield, FileCheck, Target, Zap, BarChart2,
  Lock, Globe, GraduationCap, Menu, X, ChevronDown, ChevronUp,
  MessageSquare, CheckCircle
} from 'lucide-react';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customMenuItems, setCustomMenuItems] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Feedback states
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('sugestao');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    governanca: false,
    estrategia: false,
    compliance: false,
    documentos: false,
    riscos: false,
    educacao: false,
    auditoria: false,
    ia: false,
  });

  const isAuthPage = pathname === '/login' || pathname === '/wizard';

  const getAccordionKeyForPath = (path: string) => {
    if (path === '/' || path === '/users' || path.startsWith('/admin')) return 'governanca';
    if (path === '/okrs' || path.startsWith('/indicators')) return 'estrategia';
    if (path.startsWith('/ona')) return 'compliance';
    if (path === '/pops' || path === '/bpm') return 'documentos';
    if (path.startsWith('/incidents')) return 'riscos';
    if (path.startsWith('/education')) return 'educacao';
    if (path.startsWith('/audit')) return 'auditoria';
    if (path === '/ai' || path === '/fhir') return 'ia';
    return '';
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setSidebarOpen(false);
    const key = getAccordionKeyForPath(pathname);
    if (key) {
      setOpenAccordions(prev => ({ ...prev, [key]: true }));
    }
  }, [pathname]);

  useEffect(() => {
    async function checkInitialState() {
      try {
        const wizardRes = await fetch('/api/wizard/status');
        const wizardData = await wizardRes.json();
        
        if (!wizardData.configurado && pathname !== '/wizard') {
          router.push('/wizard');
          return;
        }

        // Faremos a requisição direta para /api/auth/me.
        // O navegador enviará o cookie HttpOnly de forma automática nas requisições.
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const userData = await authRes.json();
          setUser(userData);
          if (userData?.email) {
            setFeedbackEmail(userData.email);
          }
          try {
            const menuRes = await fetch(`/api/menus-config?perfil_ou_setor=${userData.role || 'Admin'}`);
            if (menuRes.ok) {
              const menuData = await menuRes.json();
              if (menuData.length > 0 && menuData[0].itens_json) {
                setCustomMenuItems(menuData[0].itens_json);
              }
            }
          } catch (mErr) { console.error('Erro ao buscar menu dinâmico', mErr); }
        } else if (!isAuthPage) {
          router.push('/login');
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
        if (!isAuthPage) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    }

    checkInitialState();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Erro ao deslogar no servidor:', err);
    }
    setUser(null);
    router.push('/login');
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) {
      setFeedbackError('Por favor, descreva seu feedback.');
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackError('');
    try {
      const res = await fetch('/api/beta/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: feedbackType,
          comentario: feedbackComment,
          email: feedbackEmail
        })
      });
      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackComment('');
        setTimeout(() => {
          setFeedbackOpen(false);
          setFeedbackSuccess(false);
        }, 2500);
      } else {
        const data = await res.json();
        setFeedbackError(data.error || 'Erro ao enviar feedback');
      }
    } catch (err) {
      setFeedbackError('Erro de conexão ao enviar feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Grupos de Navegação: CORE PLATFORM e MODULES (Estilo Notion + Linear + Stripe)
  const menuGroups = [
    {
      key: 'governanca',
      name: 'Governança & IAM',
      icon: Users,
      items: [
        { name: 'Dashboard Central', path: '/', icon: Activity },
        { name: 'Colaboradores & Acessos', path: '/users', icon: Users },
        { name: 'Organograma & Estrutura', path: '/admin/estrutura', icon: Layers, requiredFeature: 'feature:omoc:core' },
        { name: 'Faturamento & Planos', path: '/admin/billing', icon: FileCheck },
      ]
    },
    {
      key: 'estrategia',
      name: 'Estratégia & Desempenho',
      icon: Target,
      items: [
        { name: 'Planejamento OKRs', path: '/okrs', icon: Target, requiredFeature: 'feature:okr:core' },
        { name: 'Painel de KPIs', path: '/indicators', icon: TrendingUp, requiredFeature: 'feature:okr:core' },
        { name: 'Gestão Estratégica', path: '/indicators?tab=estrategia', icon: Target, requiredFeature: 'feature:okr:core' },
      ]
    },
    {
      key: 'compliance',
      name: 'Compliance & Acreditação',
      icon: Hospital,
      items: [
        { name: 'Módulo ONA', path: '/ona', icon: Hospital, requiredFeature: 'feature:ona:core' },
        { name: 'ISO 9001 / ESG', path: '/ona?tab=indicadores', icon: Award, requiredFeature: 'feature:ona:core' },
      ]
    },
    {
      key: 'documentos',
      name: 'Documentos & Processos',
      icon: FileText,
      items: [
        { name: 'Gestão de POPs', path: '/pops', icon: FileText, requiredFeature: 'feature:pops:core' },
        { name: 'Workflow Engine BPM', path: '/bpm', icon: CheckSquare, requiredFeature: 'feature:bpm:core' },
      ]
    },
    {
      key: 'riscos',
      name: 'Riscos & Segurança',
      icon: AlertTriangle,
      items: [
        { name: 'Ocorrências & IA', path: '/incidents', icon: Zap, requiredFeature: 'feature:riscos:core' },
        { name: 'Gestão CAPA', path: '/incidents?tab=capa', icon: AlertTriangle, requiredFeature: 'feature:riscos:core' },
        { name: 'Segurança do Paciente', path: '/incidents?tab=seguranca', icon: Shield, requiredFeature: 'feature:riscos:core' },
      ]
    },
    {
      key: 'educacao',
      name: 'Universidade Corporativa',
      icon: GraduationCap,
      items: [
        { name: 'Universidade LMS', path: '/education', icon: GraduationCap, requiredFeature: 'feature:lms:core' },
      ]
    },
    {
      key: 'auditoria',
      name: 'Auditoria & Controle',
      icon: ShieldCheck,
      items: [
        { name: 'Auditoria Inteligente', path: '/audit', icon: ShieldCheck, requiredFeature: 'feature:audit:core' },
        { name: 'Auditoria Avançada', path: '/audit?tab=avancada', icon: FileCheck, requiredFeature: 'feature:audit:core' },
      ]
    },
    {
      key: 'ia',
      name: 'Integrações & IA',
      icon: Cpu,
      items: [
        { name: 'IA Corporativa', path: '/ai', icon: Cpu, requiredFeature: 'feature:ai:ishikawa' },
        { name: 'Inteligência Operacional', path: '/ai?tab=agentes', icon: BarChart2, requiredFeature: 'feature:ai:ishikawa' },
        { name: 'Interoperabilidade FHIR', path: '/fhir', icon: Link2, requiredFeature: 'feature:ai:ishikawa' },
      ]
    }
  ];

  // Filtra grupos de menu baseado nas features ativas do usuário logado
  const activeFeatures = user?.features_ativas || [];
  const filteredMenuGroups = menuGroups.map(group => {
    const filteredItems = group.items.filter(item => {
      if (!item.requiredFeature) return true;
      if (!user) return true; // Mostra tudo durante o loading inicial para evitar flash
      return activeFeatures.includes(item.requiredFeature);
    });
    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);

  const getActiveItemName = () => {
    for (const group of menuGroups) {
      const found = group.items.find(i => pathname === i.path.split('?')[0]);
      if (found) return found.name;
    }
    return 'Central de Governança';
  };

  if (loading) {
    return (
      <html lang="pt-BR">
        <body>
          <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', color: 'var(--ink)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--sage-light)', borderTopColor: 'var(--sage)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Inicializando Plataforma Inteligente de Governança...</div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  if (isAuthPage) {
    return (
      <html lang="pt-BR">
        <head>
          <title>Qualiti OS — Plataforma Inteligente de Governança e Excelência Operacional</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="pt-BR">
      <head>
        <title>Qualiti OS — Plataforma Inteligente de Governança e Excelência Operacional</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0f1a0e" />
      </head>
      <body>
        {/* BANNER BETA */}
        <div style={{
          background: 'linear-gradient(90deg, #d97706, #b45309)',
          color: 'white',
          padding: '0.6rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 700,
          zIndex: 100,
          position: 'relative',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ background: 'white', color: '#b45309', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>BETA</span>
          <span>QualitiOS Beta Program — Limites de Teste Ativos (Máximo de 50 Documentos e 10 Usuários)</span>
        </div>

        <div className="app-container">
          {/* OVERLAY PARA CELULAR */}
          {sidebarOpen && (
            <div 
              className="sidebar-overlay" 
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 45,
              }}
            />
          )}

          {/* BARRA LATERAL (ESTILO NOTION + LINEAR + STRIPE) */}
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ background: '#111827', borderRight: '1px solid #1f2937', color: '#e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* BRANDING */}
              <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', borderBottom: '1px solid #1f2937' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--sage), #3b82f6)', padding: '0.6rem', borderRadius: '10px', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                  <Zap size={24} />
                </div>
                <div className="branding-text">
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'white' }}>Qualiti<em>OS</em></div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Inteligência Operacional</div>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="mobile-close-btn"
                  style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', marginLeft: 'auto' }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* NAVEGAÇÃO DINÂMICA (RBAC / SETOR) */}
              {customMenuItems.length > 0 && (
                <div style={{ padding: '1.5rem 1rem 0.5rem 1rem', borderBottom: '1px solid #1f2937' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sage-light)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.8rem', paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={14} /> Menu Dinâmico ({user?.role || 'Custom'})
                  </div>
                  <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {customMenuItems.map((item: any, idx: number) => {
                      const isActive = pathname === item.url;
                      return (
                        <a 
                          key={idx} 
                          href={item.url} 
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0.8rem', borderRadius: '8px',
                            color: isActive ? 'white' : '#9ca3af',
                            background: isActive ? '#1f2937' : 'transparent',
                            fontWeight: isActive ? 700 : 500,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease'
                          }}
                          className="hover:bg-gray-800 hover:text-white"
                        >
                          <FileText size={18} style={{ color: isActive ? 'var(--sage-light)' : '#6b7280' }} />
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
              )}

              {/* NAVEGAÇÃO POR GRUPOS SANFONADOS (DDD Contexts) */}
              <div style={{ padding: '1.5rem 1rem 1rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.8rem', paddingLeft: '0.5rem' }}>Central de Governança</div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {filteredMenuGroups.map((group) => {
                    const GroupIcon = group.icon;
                    const isOpen = openAccordions[group.key];
                    const isGroupActive = group.items.some(item => pathname === item.path.split('?')[0]);
                    
                    return (
                      <div key={group.key} style={{ display: 'flex', flexDirection: 'column' }}>
                        <button
                          onClick={() => toggleAccordion(group.key)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.8rem',
                            borderRadius: '8px',
                            color: isGroupActive ? 'white' : '#9ca3af',
                            background: isGroupActive ? '#1f2937' : 'transparent',
                            fontWeight: isGroupActive ? 700 : 500,
                            fontSize: '0.9rem',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          className="hover:bg-gray-800 hover:text-white"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <GroupIcon size={18} style={{ color: isGroupActive ? '#3b82f6' : '#6b7280' }} />
                            <span>{group.name}</span>
                          </div>
                          {isOpen ? <ChevronUp size={16} style={{ color: '#9ca3af' }} /> : <ChevronDown size={16} style={{ color: '#9ca3af' }} />}
                        </button>

                        {isOpen && (
                          <div style={{
                            borderLeft: '1px solid #374151',
                            marginLeft: '1.25rem',
                            paddingLeft: '0.8rem',
                            marginTop: '0.2rem',
                            marginBottom: '0.2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem'
                          }}>
                            {group.items.map((item) => {
                              const ItemIcon = item.icon;
                              const isActive = pathname === item.path.split('?')[0] && 
                                (item.path.includes('tab') 
                                  ? (typeof window !== 'undefined' && window.location.search.includes(item.path.split('?')[1])) 
                                  : (typeof window !== 'undefined' && !window.location.search));
                              return (
                                <a 
                                  key={item.name} 
                                  href={item.path} 
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0.8rem', borderRadius: '6px',
                                    color: isActive ? 'white' : '#9ca3af',
                                    background: isActive ? '#374151' : 'transparent',
                                    fontWeight: isActive ? 700 : 500,
                                    fontSize: '0.85rem',
                                    transition: 'all 0.2s ease'
                                  }}
                                  className="hover:bg-gray-800 hover:text-white"
                                >
                                  <ItemIcon size={16} style={{ color: isActive ? '#3b82f6' : '#6b7280' }} />
                                  <span>{item.name}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* FOOTER DA SIDEBAR */}
            <div style={{ padding: '1.5rem', background: '#0b0f19', borderTop: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--sage)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
                  {user ? user.nome.charAt(0) : 'U'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user ? user.nome : 'Dr. Carlos Mendes'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user ? `${user.role} · ${user.unidade}` : 'Diretoria de Governança'}</div>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s ease' }}
                className="hover:bg-red-600"
              >
                <LogOut size={16} /> Fazer Logoff
              </button>
            </div>
          </aside>

          {/* CONTEÚDO PRINCIPAL */}
          <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* TOPBAR */}
            <header className="topbar" style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  onClick={() => setSidebarOpen(true)} 
                  className="mobile-menu-btn"
                  style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: '#0f172a', outline: 'none' }}
                >
                  <Menu size={24} />
                </button>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px', display: 'inline-flex', alignItems: 'center' }}>
                  {getActiveItemName()}
                </h2>
                <span className="topbar-subtitle" style={{ color: '#cbd5e1' }}>/</span>
                <span className="topbar-subtitle" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Plataforma Viva Orientada por Dados</span>
              </div>
              
              <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <div className="badge-ia" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                  IA Corporativa Realtime Ativa
                </div>
                <span className="badge badge-version" style={{ background: '#1e293b', color: 'white', fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                  Enterprise Premium v6.0
                </span>
              </div>
            </header>
            
            {/* WRAPPER DA PÁGINA */}
            <div className="page-wrapper" style={{ padding: '2.5rem', flexGrow: 1, maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
              {children}
            </div>
          </main>
        </div>

        {/* BOTAO FLUTUANTE DE FEEDBACK */}
        <button
          onClick={() => setFeedbackOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'linear-gradient(135deg, var(--sage), #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            fontSize: '0.88rem',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 90,
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(37, 99, 235, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(37, 99, 235, 0.3)';
          }}
        >
          <MessageSquare size={18} />
          <span>Feedback Beta</span>
        </button>

        {/* MODAL DE FEEDBACK */}
        {feedbackOpen && (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)' }}>Enviar Feedback do Programa Beta</h3>
                <button onClick={() => setFeedbackOpen(false)} style={{ color: 'var(--muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleFeedbackSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {feedbackSuccess ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                      <CheckCircle size={44} style={{ color: '#10b981' }} />
                      <div style={{ fontWeight: 700, color: '#166534', fontSize: '1.05rem' }}>Feedback Enviado com Sucesso!</div>
                      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>Agradecemos sua colaboração para tornar o QualitiOS ainda melhor.</p>
                    </div>
                  ) : (
                    <>
                      {feedbackError && (
                        <div style={{ padding: '0.8rem', background: '#ffdcd8', color: 'var(--red)', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {feedbackError}
                        </div>
                      )}
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>Seu E-mail</label>
                        <input
                          type="email"
                          value={feedbackEmail}
                          onChange={(e) => setFeedbackEmail(e.target.value)}
                          placeholder="seu.email@exemplo.com"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>Tipo de Feedback</label>
                        <select
                          value={feedbackType}
                          onChange={(e) => setFeedbackType(e.target.value)}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                        >
                          <option value="bug">Bug / Problema Técnico</option>
                          <option value="sugestao">Sugestão / Melhoria</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>Mensagem / Detalhes</label>
                        <textarea
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="Descreva o problema ou sugestão com o máximo de detalhes possível..."
                          rows={4}
                          required
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.8rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
                {!feedbackSuccess && (
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setFeedbackOpen(false)} disabled={feedbackSubmitting}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={feedbackSubmitting}>
                      {feedbackSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
