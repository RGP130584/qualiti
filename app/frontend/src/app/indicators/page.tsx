'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Plus, CheckCircle, AlertTriangle, 
  XCircle, Clock, X, Save 
} from 'lucide-react';

export default function IndicatorsPage() {
  const [indicadores, setIndicadores] = useState<any[]>([]);
  const [selectedInd, setSelectedInd] = useState<any>(null);
  const [isCreatingInd, setIsCreatingInd] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtroSetor, setFiltroSetor] = useState('Todos');

  // Form states
  const [novoInd, setNovoInd] = useState({
    codigo: '',
    nome: '',
    setor: 'Administrativo',
    meta: 0,
    meta_trimestral: 0,
    meta_anual: 0,
    periodicidade: 'Mensal'
  });

  const [novaColeta, setNovaColeta] = useState({
    indicador_id: '',
    data_coleta: new Date().toISOString().split('T')[0],
    valor: 0,
    responsavel: 'Enf. Maria Souza',
    observacao: ''
  });

  useEffect(() => {
    fetchIndicators();
  }, []);

  async function fetchIndicators() {
    setLoading(true);
    try {
      const res = await fetch('/api/indicators');
      const data = await res.json();
      setIndicadores(data);
      if (data.length > 0) {
        setNovaColeta(prev => ({ ...prev, indicador_id: data[0].id }));
      }
    } catch (err) {
      console.error('Erro ao buscar indicadores:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveIndicator(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoInd)
      });

      if (res.ok) {
        await fetchIndicators();
        setIsCreatingInd(false);
        setNovoInd({ codigo: '', nome: '', setor: 'CCIH', meta: 0, periodicidade: 'Mensal' });
      } else {
        alert('Erro ao criar indicador. Verifique se o código já existe.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar indicador');
    }
  }

  async function handleSaveColeta(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/indicators/${novaColeta.indicador_id}/coletas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaColeta)
      });

      if (res.ok) {
        await fetchIndicators();
        setIsCollecting(false);
        setNovaColeta(prev => ({ ...prev, valor: 0, observacao: '' }));
      }
    } catch (err) {
      alert('Erro ao registrar coleta');
    }
  }

  function startCreate() {
    setIsCreatingInd(true);
    setIsCollecting(false);
    setNovoInd({
      codigo: `KPI-${Math.floor(100 + Math.random() * 900)}`,
      nome: '',
      setor: 'Administrativo',
      meta: 90.0,
      meta_trimestral: 92.0,
      meta_anual: 95.0,
      periodicidade: 'Mensal'
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Indicadores e Metas ONA</h1>
          <p style={{ color: 'var(--muted)' }}>Biblioteca pré-configurada de indicadores hospitalares com semáforo de conformidade</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={startCreate} className="btn btn-secondary">
            <Plus size={18} /> Novo Indicador
          </button>
          <button onClick={() => { setIsCollecting(true); setIsCreatingInd(false); }} className="btn btn-primary">
            <TrendingUp size={18} /> Registrar Coleta
          </button>
        </div>
      </div>

      {/* DASHBOARD EXECUTIVO DE ACOMPANHAMENTO DE INDICADORES E METAS */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--ink), #1e2a1e)', color: 'var(--paper)', border: 'none', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span className="badge" style={{ background: 'var(--amber)', color: 'var(--ink)', marginBottom: '0.8rem', fontWeight: 700 }}>Dashboard Executivo · Metas ONA 2026</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.5rem' }}>
              Monitoramento Estratégico por Área Hospitalar
            </h2>
            <p style={{ color: '#c4bfae', maxWidth: '70ch', margin: 0, fontSize: '0.95rem' }}>
              Acompanhamento em tempo real do atingimento das metas mensais, trimestrais e anuais para as áreas-chave da instituição.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.06)', padding: '1.2rem 1.8rem', borderRadius: '12px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--sage-light)' }}>
                {indicadores.filter(ind => {
                  const isTaxa = ind.nome.toLowerCase().includes('taxa') || ind.nome.toLowerCase().includes('queda') || ind.nome.toLowerCase().includes('infecção') || ind.nome.toLowerCase().includes('rotatividade') || ind.nome.toLowerCase().includes('lesão') || ind.nome.toLowerCase().includes('desperdício') || ind.nome.toLowerCase().includes('prazo') || ind.nome.toLowerCase().includes('glosa');
                  const v = parseFloat(ind.valor_atual);
                  const m = parseFloat(ind.meta);
                  return isTaxa ? v <= m : v >= m;
                }).length} / {indicadores.length}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#c4bfae' }}>Metas Mensais Atingidas</div>
            </div>
            <div style={{ width: '1px', height: '45px', background: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--amber)' }}>
                {indicadores.filter(ind => {
                  const isTaxa = ind.nome.toLowerCase().includes('taxa') || ind.nome.toLowerCase().includes('queda') || ind.nome.toLowerCase().includes('infecção') || ind.nome.toLowerCase().includes('rotatividade') || ind.nome.toLowerCase().includes('lesão') || ind.nome.toLowerCase().includes('desperdício') || ind.nome.toLowerCase().includes('prazo') || ind.nome.toLowerCase().includes('glosa');
                  const v = parseFloat(ind.valor_atual);
                  const m = parseFloat(ind.meta_trimestral || ind.meta);
                  return isTaxa ? v <= m : v >= m;
                }).length} / {indicadores.length}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#c4bfae' }}>Metas Trimestrais Atingidas</div>
            </div>
            <div style={{ width: '1px', height: '45px', background: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#6fb3d2' }}>
                {indicadores.filter(ind => {
                  const isTaxa = ind.nome.toLowerCase().includes('taxa') || ind.nome.toLowerCase().includes('queda') || ind.nome.toLowerCase().includes('infecção') || ind.nome.toLowerCase().includes('rotatividade') || ind.nome.toLowerCase().includes('lesão') || ind.nome.toLowerCase().includes('desperdício') || ind.nome.toLowerCase().includes('prazo') || ind.nome.toLowerCase().includes('glosa');
                  const v = parseFloat(ind.valor_atual);
                  const m = parseFloat(ind.meta_anual || ind.meta);
                  return isTaxa ? v <= m : v >= m;
                }).length} / {indicadores.length}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#c4bfae' }}>Metas Anuais Atingidas</div>
            </div>
          </div>
        </div>

        {/* BARRAS DE PROGRESSO DO ATINGIMENTO ANUAL POR SETOR */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--paper)', marginBottom: '1.2rem' }}>Progresso de Atingimento da Meta Anual por Área</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {indicadores.map(ind => {
              const isTaxa = ind.nome.toLowerCase().includes('taxa') || ind.nome.toLowerCase().includes('queda') || ind.nome.toLowerCase().includes('infecção') || ind.nome.toLowerCase().includes('rotatividade') || ind.nome.toLowerCase().includes('lesão') || ind.nome.toLowerCase().includes('desperdício') || ind.nome.toLowerCase().includes('prazo') || ind.nome.toLowerCase().includes('glosa');
              const v = parseFloat(ind.valor_atual);
              const mA = parseFloat(ind.meta_anual || ind.meta);
              
              let progresso = 0;
              if (isTaxa) {
                progresso = v <= mA ? 100 : Math.max(0, Math.round((mA / v) * 100));
              } else {
                progresso = v >= mA ? 100 : Math.min(100, Math.round((v / mA) * 100));
              }

              let barColor = 'var(--sage-light)';
              if (progresso < 80) barColor = 'var(--red)';
              else if (progresso < 100) barColor = 'var(--amber)';

              return (
                <div key={`prog-${ind.id}`} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--paper)' }}>{ind.setor}</strong>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: barColor }}>{progresso}%</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#b0a898', marginBottom: '0.6rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ind.nome} (Atual: {ind.valor_atual} / Anual: {mA})
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progresso}%`, height: '100%', background: barColor, transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BARRA DE FILTRO POR SETOR */}
        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#c4bfae', fontWeight: 600, marginRight: '0.5rem' }}>Filtrar Cards por Área:</span>
          {['Todos', 'Administrativo', 'RH', 'Enfermagem', 'Monitoria', 'Psicologia', 'Psiquiatria', 'Cozinha', 'Compras', 'Financeiro', 'Farmácia', 'CCIH', 'Qualidade'].map(setor => (
            <button
              key={`filt-${setor}`}
              onClick={() => setFiltroSetor(setor)}
              style={{
                padding: '0.3rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: filtroSetor === setor ? 700 : 500,
                background: filtroSetor === setor ? 'var(--sage)' : 'rgba(255,255,255,0.08)',
                color: filtroSetor === setor ? '#fff' : '#c4bfae',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {setor}
            </button>
          ))}
        </div>
      </div>

      {/* FORM DE NOVO INDICADOR */}
      {isCreatingInd && (
        <div className="card" style={{ borderTop: '4px solid var(--sage)' }}>
          <div className="card-header">
            <h2 className="card-title">Cadastrar Novo Indicador Hospitalar</h2>
            <button onClick={() => setIsCreatingInd(false)} className="btn btn-secondary"><X size={18} /></button>
          </div>

          <form onSubmit={handleSaveIndicator} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Código Único</label>
                <input type="text" value={novoInd.codigo} onChange={e => setNovoInd({...novoInd, codigo: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nome do Indicador</label>
                <input type="text" value={novoInd.nome} onChange={e => setNovoInd({...novoInd, nome: e.target.value})} placeholder="ex: Taxa de Infecção Hospitalar" required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Setor Responsável</label>
                <select value={novoInd.setor} onChange={e => setNovoInd({...novoInd, setor: e.target.value})}>
                  <option value="Administrativo">Administrativo</option>
                  <option value="RH">RH</option>
                  <option value="Enfermagem">Enfermagem</option>
                  <option value="Monitoria">Monitoria</option>
                  <option value="Psicologia">Psicologia</option>
                  <option value="Psiquiatria">Psiquiatria</option>
                  <option value="Cozinha">Cozinha</option>
                  <option value="Compras">Compras</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Farmácia">Farmácia</option>
                  <option value="CCIH">CCIH</option>
                  <option value="Qualidade">Qualidade</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Meta ONA Padrão (Mensal)</label>
                <input type="number" step="0.01" value={novoInd.meta} onChange={e => setNovoInd({...novoInd, meta: parseFloat(e.target.value)})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Meta Trimestral</label>
                <input type="number" step="0.01" value={novoInd.meta_trimestral} onChange={e => setNovoInd({...novoInd, meta_trimestral: parseFloat(e.target.value)})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Meta Anual</label>
                <input type="number" step="0.01" value={novoInd.meta_anual} onChange={e => setNovoInd({...novoInd, meta_anual: parseFloat(e.target.value)})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Periodicidade</label>
                <select value={novoInd.periodicidade} onChange={e => setNovoInd({...novoInd, periodicidade: e.target.value})}>
                  <option value="Diário">Diário</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => setIsCreatingInd(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary"><Save size={18} /> Salvar Indicador</button>
            </div>
          </form>
        </div>
      )}

      {/* FORM DE REGISTRO DE COLETA */}
      {isCollecting && (
        <div className="card" style={{ borderTop: '4px solid var(--amber)' }}>
          <div className="card-header">
            <h2 className="card-title">Registrar Nova Coleta de Indicador</h2>
            <button onClick={() => setIsCollecting(false)} className="btn btn-secondary"><X size={18} /></button>
          </div>

          <form onSubmit={handleSaveColeta} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Selecione o Indicador</label>
                <select value={novaColeta.indicador_id} onChange={e => setNovaColeta({...novaColeta, indicador_id: e.target.value})} required>
                  {indicadores.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.codigo} - {ind.nome} (Meta: {ind.meta})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Data da Coleta</label>
                <input type="date" value={novaColeta.data_coleta} onChange={e => setNovaColeta({...novaColeta, data_coleta: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Valor Apurado</label>
                <input type="number" step="0.01" value={novaColeta.valor} onChange={e => setNovaColeta({...novaColeta, valor: parseFloat(e.target.value)})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Responsável pela Coleta</label>
                <input type="text" value={novaColeta.responsavel} onChange={e => setNovaColeta({...novaColeta, responsavel: e.target.value})} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Observações / Contexto da Coleta</label>
              <textarea rows={2} value={novaColeta.observacao} onChange={e => setNovaColeta({...novaColeta, observacao: e.target.value})} placeholder="Adicione justificativas para variações no indicador..." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => setIsCollecting(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary"><TrendingUp size={18} /> Registrar Coleta</button>
            </div>
          </form>
        </div>
      )}

      {/* CARDS DE INDICADORES (GRID VIBRANTE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {loading && indicadores.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando biblioteca de indicadores...</div>
        ) : indicadores.filter(ind => filtroSetor === 'Todos' || ind.setor === filtroSetor).map(ind => {
          // Determina semáforo (Verde se valor atual estiver dentro ou melhor que a meta, Amarelo se próximo, Vermelho se distante)
          // Nota: Para taxas de infecção/quedas, menor é melhor. Para satisfação, maior é melhor.
          const isTaxa = ind.nome.toLowerCase().includes('taxa') || ind.nome.toLowerCase().includes('queda') || ind.nome.toLowerCase().includes('infecção');
          const valor = parseFloat(ind.valor_atual);
          const meta = parseFloat(ind.meta);
          
          let statusColor = 'var(--sage)';
          let statusBg = 'var(--sage-pale)';
          let statusText = 'Conforme';

          if (isTaxa) {
            if (valor > meta * 1.2) { statusColor = 'var(--red)'; statusBg = '#ffdcd8'; statusText = 'Crítico'; }
            else if (valor > meta) { statusColor = 'var(--amber)'; statusBg = 'var(--amber-pale)'; statusText = 'Atenção'; }
          } else {
            if (valor < meta * 0.8) { statusColor = 'var(--red)'; statusBg = '#ffdcd8'; statusText = 'Crítico'; }
            else if (valor < meta) { statusColor = 'var(--amber)'; statusBg = 'var(--amber-pale)'; statusText = 'Atenção'; }
          }

          return (
            <div key={ind.id} className="card" style={{ borderTop: `4px solid ${statusColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <span className="badge badge-info">{ind.codigo}</span>
                  <span className="badge" style={{ background: statusBg, color: statusColor }}>{statusText}</span>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>{ind.nome}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.2rem' }}>Setor: <strong>{ind.setor}</strong> · Periodicidade: {ind.periodicidade}</div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem', background: 'var(--paper)', padding: '1rem', borderRadius: '8px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Valor Atual:</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 700, color: statusColor }}>{ind.valor_atual}</span>
                  </div>
                  <div style={{ width: '1px', height: '35px', background: 'var(--border)' }}></div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Meta Mensal:</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--ink)' }}>{ind.meta}</span>
                  </div>
                  <div style={{ width: '1px', height: '35px', background: 'var(--border)' }}></div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Meta Trimestral:</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--ink)' }}>{ind.meta_trimestral || ind.meta}</span>
                  </div>
                  <div style={{ width: '1px', height: '35px', background: 'var(--border)' }}></div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Meta Anual:</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--ink)' }}>{ind.meta_anual || ind.meta}</span>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Tendência:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: ind.tendencia === 'Melhorando' ? 'var(--sage)' : ind.tendencia === 'Piorando' ? 'var(--red)' : 'var(--amber)' }}>
                      {ind.tendencia}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Histórico de Coletas</h4>
                  <button onClick={() => setSelectedInd(ind)} className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>Detalhes</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {ind.coletas?.slice(0, 2).map((c: any) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--muted)' }}>{new Date(c.data_coleta).toLocaleDateString()}</span>
                      <strong style={{ color: 'var(--ink)' }}>{c.valor}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c.responsavel}</span>
                    </div>
                  ))}
                  {(!ind.coletas || ind.coletas.length === 0) && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>Nenhuma coleta registrada.</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE DETALHES E HISTÓRICO COMPLETO */}
      {selectedInd && (
        <div className="modal-overlay" onClick={() => setSelectedInd(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-info">{selectedInd.codigo}</span>
                <h3 className="card-title" style={{ marginTop: '0.3rem' }}>{selectedInd.nome}</h3>
              </div>
              <button onClick={() => setSelectedInd(null)} className="btn btn-secondary" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem', background: 'var(--paper)', borderRadius: '8px', flexWrap: 'wrap' }}>
                <div><strong style={{ display: 'block' }}>Setor:</strong> {selectedInd.setor}</div>
                <div><strong style={{ display: 'block' }}>Meta Mensal:</strong> {selectedInd.meta}</div>
                <div><strong style={{ display: 'block' }}>Meta Trimestral:</strong> {selectedInd.meta_trimestral || selectedInd.meta}</div>
                <div><strong style={{ display: 'block' }}>Meta Anual:</strong> {selectedInd.meta_anual || selectedInd.meta}</div>
                <div><strong style={{ display: 'block' }}>Periodicidade:</strong> {selectedInd.periodicidade}</div>
                <div><strong style={{ display: 'block' }}>Tendência:</strong> {selectedInd.tendencia}</div>
              </div>

              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Todas as Coletas Registradas</h4>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Valor Apurado</th>
                        <th>Responsável</th>
                        <th>Observação / Justificativa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInd.coletas?.map((c: any) => (
                        <tr key={c.id}>
                          <td>{new Date(c.data_coleta).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 700 }}>{c.valor}</td>
                          <td>{c.responsavel}</td>
                          <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.observacao || '-'}</td>
                        </tr>
                      ))}
                      {(!selectedInd.coletas || selectedInd.coletas.length === 0) && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem' }}>Nenhum histórico disponível.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
