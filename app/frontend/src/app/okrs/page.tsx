'use client';

import React, { useState, useEffect } from 'react';
import { Target, Award, Plus, Calendar, TrendingUp, Layers, CheckCircle2, User, RefreshCw, BarChart2 } from 'lucide-react';

export default function OkrsPage() {
  const [okrs, setOkrs] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'estrategico' | 'krs' | 'ciclos' | 'alinhamento'>('estrategico');
  const [user, setUser] = useState<any>({ nome: 'Enf. Maria Souza', role: 'Enfermeiro', departamento: 'Enfermagem', isGlobalAdmin: false });

  // Modais
  const [showOkrModal, setShowOkrModal] = useState(false);
  const [showKrModal, setShowKrModal] = useState(false);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [selectedOkrId, setSelectedOkrId] = useState<number | null>(null);

  // Formulários
  const [okrForm, setOkrForm] = useState({ titulo: '', descricao: '', visao_estrategica: '3 Anos', periodo: '2026-2028', prioridade: 'Alta', responsavel: '', setor: 'Geral', indicadores_vinculados: '' });
  const [krForm, setKrForm] = useState({ titulo: '', meta: '', valor_alvo: 100, unidade: '%', responsavel: '', setor: 'Geral', prazo: '2026-12-31', peso: 1 });
  const [cycleForm, setCycleForm] = useState({ nome: '', tipo: 'Trimestral', data_inicio: '', data_fim: '' });

  // Progresso KR
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedKr, setSelectedKr] = useState<any>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [progressNota, setProgressNota] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const userData = await authRes.json();
        setUser({ ...userData, isGlobalAdmin: userData.role === 'Admin' || userData.departamento === 'Diretoria' });
      }

      const [okrsRes, cyclesRes] = await Promise.all([
        fetch('/api/okrs'),
        fetch('/api/okr-cycles')
      ]);

      if (okrsRes.ok) setOkrs(await okrsRes.json());
      if (cyclesRes.ok) setCycles(await cyclesRes.json());
    } catch (err) {
      console.error('Erro ao buscar dados de OKRs', err);
    } finally {
      setLoading(false);
    }
  }

  // Submits
  async function handleCreateOkr(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/okrs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...okrForm,
        indicadores_vinculados: okrForm.indicadores_vinculados ? okrForm.indicadores_vinculados.split(',').map(s => s.trim()) : []
      })
    });
    if (res.ok) {
      setShowOkrModal(false);
      setOkrForm({ titulo: '', descricao: '', visao_estrategica: '3 Anos', periodo: '2026-2028', prioridade: 'Alta', responsavel: '', setor: 'Geral', indicadores_vinculados: '' });
      fetchInitialData();
    }
  }

  async function handleCreateKr(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOkrId) return;
    const res = await fetch(`/api/okrs/${selectedOkrId}/krs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(krForm)
    });
    if (res.ok) {
      setShowKrModal(false);
      setKrForm({ titulo: '', meta: '', valor_alvo: 100, unidade: '%', responsavel: '', setor: 'Geral', prazo: '2026-12-31', peso: 1 });
      fetchInitialData();
    }
  }

  async function handleCreateCycle(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/okr-cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cycleForm)
    });
    if (res.ok) {
      setShowCycleModal(false);
      setCycleForm({ nome: '', tipo: 'Trimestral', data_inicio: '', data_fim: '' });
      fetchInitialData();
    }
  }

  async function handleUpdateProgress(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedKr) return;
    const res = await fetch(`/api/krs/${selectedKr.id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor: progressVal, nota: progressNota, responsavel: user.nome })
    });
    if (res.ok) {
      setShowProgressModal(false);
      setSelectedKr(null);
      setProgressNota('');
      fetchInitialData();
    }
  }

  const isGlobalView = user.isGlobalAdmin;
  const filteredOkrs = isGlobalView ? okrs : okrs.filter(o => o.setor === user.departamento || o.visao_estrategica === '3 Anos');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '4rem' }}>
      {/* CABEÇALHO ESTRATÉGICO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '2.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            <Target size={44} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 700, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>STRATEGY ENGINE</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.85rem' }}>Foco Total nos Resultados (OKR 2023)</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Gestão Estratégica & OKRs Corporativos</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: '0.4rem 0 0 0', maxWidth: '85ch' }}>
              Alinhamento institucional, metas de 3 anos e acompanhamento contínuo de Key Results (KRs) integrados à governança de internação.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={fetchInitialData} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            <RefreshCw size={16} /> Atualizar
          </button>
          {isGlobalView && (
            <button onClick={() => setShowOkrModal(true)} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: 700, background: '#38bdf8', color: '#0f172a' }}>
              <Plus size={16} /> Novo OKR Estratégico
            </button>
          )}
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO ESTRATÉGICA */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'estrategico', label: '1. OKRs Estratégicos & Táticos', icon: Target },
          { id: 'krs', label: '2. Key Results (KRs) Operacionais', icon: TrendingUp },
          { id: 'ciclos', label: '3. Ciclos de Gestão OKR', icon: Calendar },
          { id: 'alinhamento', label: '4. Alinhamento com Indicadores (KPIs)', icon: BarChart2 },
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
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>Carregando estrutura estratégica de OKRs...</div>
      ) : (
        <>
          {/* ABA 1: OKRS ESTRATÉGICOS E TÁTICOS */}
          {activeTab === 'estrategico' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {filteredOkrs.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Nenhum OKR cadastrado ou visível para o seu setor.</div>
              ) : filteredOkrs.map((okr) => (
                <div key={okr.id} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '6px solid var(--sage)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>{okr.visao_estrategica}</span>
                        <span className="badge badge-secondary">{okr.periodo}</span>
                        <span className={`badge ${okr.prioridade === 'Crítica' ? 'badge-danger' : 'badge-warning'}`}>{okr.prioridade}</span>
                        <span className="badge badge-info" style={{ background: 'var(--surface)', color: 'var(--ink)' }}>Setor: {okr.setor}</span>
                      </div>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>{okr.titulo}</h2>
                      <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: '0.4rem 0 0 0' }}>{okr.descricao}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--surface)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>Score OKR</span>
                        <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)' }}>{okr.score}</strong>
                      </div>
                      <div style={{ width: '1px', height: '35px', background: 'var(--border)' }}></div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>Progresso Geral</span>
                        <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--sage)' }}>{okr.progresso}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* KEY RESULTS DO OKR */}
                  <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={18} style={{ color: 'var(--sage)' }} /> Key Results (KRs) Associados
                      </h4>
                      {isGlobalView && (
                        <button 
                          onClick={() => { setSelectedOkrId(okr.id); setShowKrModal(true); }} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <Plus size={14} /> Adicionar KR
                        </button>
                      )}
                    </div>

                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Título do Key Result (KR)</th>
                            <th>Meta Operacional</th>
                            <th>Setor</th>
                            <th>Valor Atual / Alvo</th>
                            <th>Progresso</th>
                            <th>Prazo</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {okr.key_results?.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Nenhum Key Result cadastrado para este OKR.</td></tr>
                          ) : okr.key_results?.map((kr: any) => (
                            <tr key={kr.id}>
                              <td>
                                <strong style={{ display: 'block', color: 'var(--ink)', fontSize: '1rem' }}>{kr.titulo}</strong>
                                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Responsável: {kr.responsavel} (Peso {kr.peso})</span>
                              </td>
                              <td style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{kr.meta}</td>
                              <td><span className="badge badge-info">{kr.setor}</span></td>
                              <td style={{ fontWeight: 800, fontSize: '1rem' }}>{kr.valor_atual} / {kr.valor_alvo} {kr.unidade}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                  <div style={{ flexGrow: 1, background: 'var(--surface)', height: '8px', borderRadius: '4px', overflow: 'hidden', minWidth: '100px' }}>
                                    <div style={{ width: `${kr.progresso}%`, background: 'var(--sage)', height: '100%', borderRadius: '4px' }}></div>
                                  </div>
                                  <strong style={{ fontSize: '0.9rem' }}>{kr.progresso}%</strong>
                                </div>
                              </td>
                              <td style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{new Date(kr.prazo).toLocaleDateString()}</td>
                              <td>
                                <button 
                                  onClick={() => { setSelectedKr(kr); setProgressVal(parseFloat(kr.valor_atual)); setShowProgressModal(true); }}
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                  Atualizar Progresso
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ABA 2: KRS OPERACIONAIS (LISTA DIRETA) */}
          {activeTab === 'krs' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
                <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} style={{ color: 'var(--sage)' }} /> Key Results (KRs) Operacionais de Internação
                </h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>OKR Pai</th>
                      <th>Título do KR</th>
                      <th>Setor</th>
                      <th>Progresso</th>
                      <th>Prazo</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {okrs.flatMap(o => o.key_results || []).map((kr: any) => (
                      <tr key={kr.id}>
                        <td style={{ fontWeight: 600, color: 'var(--muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {okrs.find(o => o.id === kr.okr_id)?.titulo}
                        </td>
                        <td>
                          <strong style={{ display: 'block', color: 'var(--ink)' }}>{kr.titulo}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Meta: {kr.meta}</span>
                        </td>
                        <td><span className="badge badge-info">{kr.setor}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ flexGrow: 1, background: 'var(--surface)', height: '8px', borderRadius: '4px', overflow: 'hidden', minWidth: '100px' }}>
                              <div style={{ width: `${kr.progresso}%`, background: 'var(--sage)', height: '100%', borderRadius: '4px' }}></div>
                            </div>
                            <strong style={{ fontSize: '0.9rem' }}>{kr.progresso}%</strong>
                          </div>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{new Date(kr.prazo).toLocaleDateString()}</td>
                        <td><span className="badge badge-success">{kr.status}</span></td>
                        <td>
                          <button onClick={() => { setSelectedKr(kr); setProgressVal(parseFloat(kr.valor_atual)); setShowProgressModal(true); }} className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}>
                            Atualizar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA 3: CICLOS OKR */}
          {activeTab === 'ciclos' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} style={{ color: 'var(--sage)' }} /> Ciclos de Gestão OKR (Períodos Configuráveis)
                </h3>
                {isGlobalView && (
                  <button onClick={() => setShowCycleModal(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>
                    <Plus size={16} /> Novo Ciclo
                  </button>
                )}
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nome do Ciclo</th>
                      <th>Periodicidade</th>
                      <th>Data de Início</th>
                      <th>Data de Encerramento</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map((cy) => (
                      <tr key={cy.id}>
                        <td><strong style={{ color: 'var(--ink)', fontSize: '1.05rem' }}>{cy.nome}</strong></td>
                        <td><span className="badge badge-secondary">{cy.tipo}</span></td>
                        <td style={{ fontWeight: 600 }}>{new Date(cy.data_inicio).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 600 }}>{new Date(cy.data_fim).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${cy.ativo ? 'badge-success' : 'badge-warning'}`}>
                            {cy.ativo ? 'Ciclo Ativo' : 'Encerrado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA 4: ALINHAMENTO COM INDICADORES */}
          {activeTab === 'alinhamento' && (
            <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={24} style={{ color: 'var(--sage)' }} /> Integração Estratégica com Indicadores Operacionais de Internação
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {okrs.map(okr => (
                  <div key={okr.id} style={{ padding: '1.5rem', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)' }}>{okr.titulo}</h4>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Indicadores Vinculados ao OKR</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {okr.indicadores_vinculados?.map((ind: string) => (
                        <span key={ind} className="badge badge-info" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                          📊 {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE NOVO OKR */}
      {showOkrModal && (
        <div className="modal-overlay" onClick={() => setShowOkrModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="card-title">Criar Novo OKR Estratégico</h3>
              <button onClick={() => setShowOkrModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}>X</button>
            </div>
            <form onSubmit={handleCreateOkr} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Título do OKR</label>
                <input type="text" value={okrForm.titulo} onChange={e => setOkrForm({...okrForm, titulo: e.target.value})} required placeholder="Ex: Ser referência em excelência operacional..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Descrição / Visão</label>
                <textarea value={okrForm.descricao} onChange={e => setOkrForm({...okrForm, descricao: e.target.value})} rows={3} required placeholder="Descreva o impacto institucional almejado..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Visão Estratégica</label>
                  <select value={okrForm.visao_estrategica} onChange={e => setOkrForm({...okrForm, visao_estrategica: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="3 Anos">3 Anos (Estratégico)</option>
                    <option value="1 Ano">1 Ano (Tático)</option>
                    <option value="Trimestral">Trimestral (Operacional)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Período Alvo</label>
                  <input type="text" value={okrForm.periodo} onChange={e => setOkrForm({...okrForm, periodo: e.target.value})} required placeholder="Ex: 2026-2028" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Setor Responsável</label>
                  <select value={okrForm.setor} onChange={e => setOkrForm({...okrForm, setor: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="Diretoria Geral">Diretoria Geral</option>
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Medicina Clínica">Medicina Clínica</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Prioridade</label>
                  <select value={okrForm.prioridade} onChange={e => setOkrForm({...okrForm, prioridade: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                    <option value="Média">Média</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Indicadores Vinculados (Separados por vírgula)</label>
                <input type="text" value={okrForm.indicadores_vinculados} onChange={e => setOkrForm({...okrForm, indicadores_vinculados: e.target.value})} placeholder="Ex: KPI-ADM-01, KPI-ENF-01" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>Confirmar OKR Estratégico</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOVO KR */}
      {showKrModal && (
        <div className="modal-overlay" onClick={() => setShowKrModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="card-title">Adicionar Key Result (KR) Operacional</h3>
              <button onClick={() => setShowKrModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}>X</button>
            </div>
            <form onSubmit={handleCreateKr} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Título do KR</label>
                <input type="text" value={krForm.titulo} onChange={e => setKrForm({...krForm, titulo: e.target.value})} required placeholder="Ex: Aumentar conformidade documental para 95%..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Meta Descritiva</label>
                <textarea value={krForm.meta} onChange={e => setKrForm({...krForm, meta: e.target.value})} rows={2} required placeholder="Descreva a métrica exata de verificação..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Valor Alvo</label>
                  <input type="number" value={krForm.valor_alvo} onChange={e => setKrForm({...krForm, valor_alvo: parseFloat(e.target.value)})} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Unidade</label>
                  <input type="text" value={krForm.unidade} onChange={e => setKrForm({...krForm, unidade: e.target.value})} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Peso Estratégico</label>
                  <select value={krForm.peso} onChange={e => setKrForm({...krForm, peso: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="1">Peso 1 (Normal)</option>
                    <option value="2">Peso 2 (Alto)</option>
                    <option value="3">Peso 3 (Crítico)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Responsável</label>
                  <input type="text" value={krForm.responsavel} onChange={e => setKrForm({...krForm, responsavel: e.target.value})} required placeholder="Ex: Enf. Maria Souza" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Setor</label>
                  <select value={krForm.setor} onChange={e => setKrForm({...krForm, setor: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Medicina Clínica">Medicina Clínica</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Prazo Limite</label>
                <input type="date" value={krForm.prazo} onChange={e => setKrForm({...krForm, prazo: e.target.value})} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>Confirmar Key Result</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOVO CICLO */}
      {showCycleModal && (
        <div className="modal-overlay" onClick={() => setShowCycleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="card-title">Criar Novo Ciclo OKR</h3>
              <button onClick={() => setShowCycleModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}>X</button>
            </div>
            <form onSubmit={handleCreateCycle} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nome do Ciclo</label>
                <input type="text" value={cycleForm.nome} onChange={e => setCycleForm({...cycleForm, nome: e.target.value})} required placeholder="Ex: Q3 2026 - Expansão..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Periodicidade</label>
                <select value={cycleForm.tipo} onChange={e => setCycleForm({...cycleForm, tipo: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                  <option value="Personalizado">Personalizado</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Data de Início</label>
                  <input type="date" value={cycleForm.data_inicio} onChange={e => setCycleForm({...cycleForm, data_inicio: e.target.value})} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Data de Encerramento</label>
                  <input type="date" value={cycleForm.data_fim} onChange={e => setCycleForm({...cycleForm, data_fim: e.target.value})} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>Confirmar Ciclo</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ATUALIZAÇÃO DE PROGRESSO KR */}
      {showProgressModal && selectedKr && (
        <div className="modal-overlay" onClick={() => setShowProgressModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="card-title">Atualizar Progresso do Key Result</h3>
              <button onClick={() => setShowProgressModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}>X</button>
            </div>
            <form onSubmit={handleUpdateProgress} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Key Result Alvo</label>
                <input type="text" value={selectedKr.titulo} disabled className="input" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Novo Valor Atual ({selectedKr.unidade})</label>
                  <input type="number" step="0.01" value={progressVal} onChange={e => setProgressVal(parseFloat(e.target.value))} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Valor Alvo Final</label>
                  <input type="text" value={`${selectedKr.valor_alvo} ${selectedKr.unidade}`} disabled style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nota de Acompanhamento</label>
                <textarea value={progressNota} onChange={e => setProgressNota(e.target.value)} rows={3} required placeholder="Descreva as ações realizadas para atingir este avanço..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>Registrar Avanço & Recalcular OKR</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
