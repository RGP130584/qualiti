'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Hospital, Activity, FileText, CheckSquare, Users, 
  TrendingUp, AlertTriangle, Cpu, ShieldCheck, Link2, LogOut,
  Layers, Compass, Award, Shield, FileCheck, Target, Zap, BarChart2,
  Lock, Globe, GraduationCap
} from 'lucide-react';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customMenuItems, setCustomMenuItems] = useState<any[]>([]);

  const isAuthPage = pathname === '/login' || pathname === '/wizard';

  useEffect(() => {
    async function checkInitialState() {
      try {
        const wizardRes = await fetch('/api/wizard/status');
        const wizardData = await wizardRes.json();
        
        if (!wizardData.configurado && pathname !== '/wizard') {
          router.push('/wizard');
          return;
        }

        const token = localStorage.getItem('qualita_token');
        if (!token && !isAuthPage) {
          router.push('/login');
          return;
        }

        if (token) {
          const authRes = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (authRes.ok) {
            const userData = await authRes.json();
            setUser(userData);
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
            localStorage.removeItem('qualita_token');
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
      } finally {
        setLoading(false);
      }
    }

    checkInitialState();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('qualita_token');
    setUser(null);
    router.push('/login');
  };

  // Grupos de Navegação: CORE PLATFORM e MODULES (Estilo Notion + Linear + Stripe)
  const coreNavItems = [
    { name: 'Dashboard Engine', path: '/', icon: Activity },
    { name: 'Governança & Acessos', path: '/users', icon: Users },
    { name: 'Gestão de Documentos', path: '/pops', icon: FileText },
    { name: 'Workflow Engine', path: '/bpm', icon: CheckSquare },
    { name: 'Ocorrências & IA', path: '/incidents', icon: Zap },
    { name: 'IA Corporativa', path: '/ai', icon: Cpu },
    { name: 'Auditoria Inteligente', path: '/audit', icon: ShieldCheck },
    { name: 'Indicadores & Analytics', path: '/indicators', icon: TrendingUp },
    { name: 'Estratégia & OKRs', path: '/okrs', icon: Target },
    { name: 'Educação Corporativa', path: '/education', icon: GraduationCap },
    { name: 'Interoperabilidade FHIR', path: '/fhir', icon: Link2 },
    { name: 'Painel Administrativo', path: '/admin/estrutura', icon: Layers },
  ];

  const modulesNavItems = [
    { name: 'Módulo ONA', path: '/ona', icon: Hospital },
    { name: 'ISO 9001 / ESG', path: '/ona?tab=indicadores', icon: Award },
    { name: 'Gestão CAPA', path: '/incidents?tab=capa', icon: AlertTriangle },
    { name: 'Segurança do Paciente', path: '/incidents?tab=seguranca', icon: Shield },
    { name: 'Auditoria Avançada', path: '/audit?tab=avancada', icon: FileCheck },
    { name: 'Gestão Estratégica', path: '/indicators?tab=estrategia', icon: Target },
    { name: 'Inteligência Operacional', path: '/ai?tab=agentes', icon: BarChart2 },
  ];

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
        <div className="app-container">
          {/* BARRA LATERAL (ESTILO NOTION + LINEAR + STRIPE) */}
          <aside className="sidebar" style={{ width: '280px', background: '#111827', borderRight: '1px solid #1f2937', color: '#e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* BRANDING */}
              <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', borderBottom: '1px solid #1f2937' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--sage), #3b82f6)', padding: '0.6rem', borderRadius: '10px', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                  <Zap size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'white' }}>Qualiti<em>OS</em></div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Inteligência Operacional</div>
                </div>
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

              {/* CORE PLATFORM */}
              <div style={{ padding: '1.5rem 1rem 0.5rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.8rem', paddingLeft: '0.5rem' }}>Core Platform</div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {coreNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    return (
                      <a 
                        key={item.path} 
                        href={item.path} 
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
                        <Icon size={18} style={{ color: isActive ? 'var(--sage-light)' : '#6b7280' }} />
                        <span>{item.name}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>

              {/* MODULES */}
              <div style={{ padding: '1.5rem 1rem 1rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.8rem', paddingLeft: '0.5rem' }}>Módulos Especializados</div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {modulesNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path.split('?')[0] && pathname !== '/';
                    return (
                      <a 
                        key={item.name} 
                        href={item.path} 
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
                        <Icon size={18} style={{ color: isActive ? '#3b82f6' : '#6b7280' }} />
                        <span>{item.name}</span>
                      </a>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                  {coreNavItems.concat(modulesNavItems).find(i => pathname === i.path.split('?')[0])?.name || 'Central de Governança'}
                </h2>
                <span style={{ color: '#cbd5e1' }}>/</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Plataforma Viva Orientada por Dados</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                  IA Corporativa Realtime Ativa
                </div>
                <span className="badge" style={{ background: '#1e293b', color: 'white', fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem' }}>
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
      </body>
    </html>
  );
}
