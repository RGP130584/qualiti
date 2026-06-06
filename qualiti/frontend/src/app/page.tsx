'use client';

import React, { useEffect, useState } from 'react';
import { 
  Activity, CheckCircle, AlertCircle, Clock, FileText, TrendingUp, 
  AlertTriangle, ArrowRight, Zap, ShieldCheck, Award, Target, Bot, 
  BarChart2, RefreshCw, Compass, Layers, Globe, Shield, FileCheck
} from 'lucide-react';

export default function DashboardPage() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [riscos, setRiscos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros rápidos do Dashboard Engine
  const [filtroSetor, setFiltroSetor] = useState('Todos');

  useEffect(() => {
    fetchDashboardData();
  }, [filtroSetor]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      let setorQuery = filtroSetor !== 'Todos' ? `?setor=${filtroSetor}` : '';
      
      const [anRes, ocRes, docRes, audRes, rskRes] = await Promise.all([
        fetch('/api/core/v2/analytics'),
        fetch(`/api/core/v2/ocorrencias${setorQuery}`),
        fetch(`/api/core/v2/documentos${setorQuery}`),
        fetch(`/api/core/v2/auditorias${setorQuery}`),
        fetch(`/api/core/v2/riscos${setorQuery}`)
      ]);

      const an = await anRes.json();
      const oc = await ocRes.json();
      const doc = await docRes.json();
      const aud = await audRes.json();
      const rsk = await rskRes.json();

      setAnalyticsData(an);
      setOcorrencias(Array.isArray(oc) ? oc : []);
      setDocumentos(Array.isArray(doc) ? doc : []);
      setAuditorias(Array.isArray(aud) ? aud : []);
      setRiscos(Array.isArray(rsk) ? rsk : []);
    } catch (err) {
      console.error('Erro ao buscar dados do Dashboard Engine:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1.5rem', color: '#64748b' }}>
        <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>Carregando Motor de Inteligência Operacional & Analytics...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* ========================================== */}
      {/* BANNER PRINCIPAL (NOTION + LINEAR + STRIPE STYLE) */}
      {/* ========================================== */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
              <span className="badge" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800, padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}>
                CENTRAL DE GOVERNANÇA INSTITUCIONAL
              </span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}>
                IA Corporativa Realtime Ativa
              </span>
            </div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'white', margin: '0 0 0.8rem 0', letterSpacing: '-1px', lineHeight: 1.1 }}>
              Plataforma de Inteligência Operacional & Motor de Melhoria Contínua
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.15rem', margin: '0 0 2rem 0', lineHeight: 1.6 }}>
              Acompanhe o Score Institucional em tempo real, predição de riscos operacionais, auditoria contínua e conformidade com múltiplas normas (ONA, ISO 9001, ESG e LGPD).
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="/incidents" className="btn btn-primary" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800, padding: '1rem 2rem', borderRadius: '12px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 4px 15px rgba(56,189,248,0.3)' }}>
                <Zap size={20} /> Relatar Ocorrência (IA-First)
              </a>
              <a href="/ai" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)', fontWeight: 700, padding: '1rem 2rem', borderRadius: '12px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }} className="hover:bg-white/20">
                <Bot size={20} /> Consultar Agentes de IA
              </a>
            </div>
          </div>

          {/* SCORE INSTITUCIONAL WIDGET */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', padding: '2.5rem', borderRadius: '20px', backdropFilter: 'blur(20px)', textAlign: 'center', minWidth: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', marginBottom: '0.5rem' }}>Score Institucional Geral</div>
            <div style={{ fontSize: '4.5rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '-2px', lineHeight: 1 }}>
              {analyticsData?.score_institucional || 88.4}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.8rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
              <TrendingUp size={16} /> Tendência {analyticsData?.tendencia_geral || 'Subindo'} (+5.4 pts)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', width: '100%' }}>
              Benchmarking de Mercado: <strong>{analyticsData?.benchmarking_mercado || 82.0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS RÁPIDOS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'white', padding: '1.2rem 2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#64748b', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={18} style={{ color: '#0ea5e9' }} /> Visão Contextual por Setor:
          </span>
          <select value={filtroSetor} onChange={e => setFiltroSetor(e.target.value)} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', background: '#f8fafc' }}>
            <option value="Todos">Visão Global (Todos os Setores)</option>
            <option value="Enfermagem">Enfermagem</option>
            <option value="Centro Cirúrgico">Centro Cirúrgico</option>
            <option value="Farmácia">Farmácia</option>
            <option value="UTI">UTI</option>
            <option value="Diretoria">Diretoria</option>
          </select>
        </div>

        <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Sincronizar Dados Realtime
        </button>
      </div>

      {/* ========================================== */}
      {/* GRID DE CARDS DE METRICAS (WIDGETS INTELIGENTES) */}
      {/* ========================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* WIDGET 1: GESTÃO DOCUMENTAL INTELIGENTE */}
        <div className="card" style={{ borderTop: '4px solid #10b981', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#64748b', margin: 0 }}>Gestão Documental (OCR/RAG)</h3>
            <div style={{ background: '#d1fae5', color: '#059669', padding: '0.6rem', borderRadius: '10px' }}>
              <FileText size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>{documentos.length}</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Aprovados e Vigentes</span>
            <span className="badge badge-success" style={{ fontWeight: 700 }}>100% Indexado IA</span>
          </div>
        </div>

        {/* WIDGET 2: OCORRÊNCIAS & CAPA */}
        <div className="card" style={{ borderTop: '4px solid #38bdf8', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#64748b', margin: 0 }}>Ocorrências & Planos CAPA</h3>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.6rem', borderRadius: '10px' }}>
              <Zap size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>{ocorrencias.length}</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Em Investigação IA</span>
            <span className="badge" style={{ background: '#0ea5e9', color: 'white', fontWeight: 700 }}>Automação Ativa</span>
          </div>
        </div>

        {/* WIDGET 3: AUDITORIA CONTÍNUA E VIRTUAL IA */}
        <div className="card" style={{ borderTop: '4px solid #f59e0b', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#64748b', margin: 0 }}>Auditoria Contínua (Realtime)</h3>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.6rem', borderRadius: '10px' }}>
              <ShieldCheck size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>
            {auditorias[0]?.score_conformidade || 88.5}%
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Conformidade Prontuários</span>
            <span className="badge badge-warning" style={{ fontWeight: 700 }}>IA Auditor Virtual</span>
          </div>
        </div>

        {/* WIDGET 4: GESTÃO DE RISCOS PREDITIVOS */}
        <div className="card" style={{ borderTop: '4px solid #ef4444', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#64748b', margin: 0 }}>Riscos Preditivos Mapeados</h3>
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.6rem', borderRadius: '10px' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>{riscos.length}</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Monitoramento de Ruptura</span>
            <span className="badge badge-danger" style={{ fontWeight: 700 }}>Alerta de Suprimentos</span>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* SEÇÃO PRINCIPAL DE WIDGETS E INSIGHTS VIVOS */}
      {/* ========================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2.5rem' }}>
        {/* COLUNA ESQUERDA: AUDITOR VIRTUAL IA E ALERTAS INTELIGENTES */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          <div className="card-header" style={{ padding: '2rem 2.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Bot size={24} style={{ color: '#0ea5e9' }} />
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Insights do Auditor Virtual IA (Realtime)</h3>
            </div>
            <span className="badge" style={{ background: '#0ea5e9', color: 'white', fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '6px' }}>Varredura Contínua</span>
          </div>
          
          <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            {auditorias.map((aud: any) => (
              <div key={aud.id} style={{ background: '#f1f5f9', padding: '1.8rem', borderRadius: '16px', borderLeft: '6px solid #0ea5e9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{aud.titulo}</strong>
                  <span className="badge" style={{ background: '#cbd5e1', color: '#0f172a', fontWeight: 700 }}>{aud.setor}</span>
                </div>
                <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.95rem', color: '#334155', lineHeight: 1.6 }}>
                  {aud.ia_auditor_virtual}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Score de Conformidade Específico:</span>
                  <strong style={{ fontSize: '1.2rem', color: '#0ea5e9', fontWeight: 800 }}>{aud.score_conformidade}%</strong>
                </div>
              </div>
            ))}

            {/* ALERTAS INTELIGENTES DO ANALYTICS */}
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} style={{ color: '#f59e0b' }} /> Alertas Inteligentes de Tendência Institucional
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analyticsData?.alertas_inteligentes?.map((alerta: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.5rem', background: alerta.tipo === 'Sucesso' ? '#ecfdf5' : '#fffbeb', border: `1px solid ${alerta.tipo === 'Sucesso' ? '#a7f3d0' : '#fde68a'}`, borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.95rem', color: alerta.tipo === 'Sucesso' ? '#065f46' : '#92400e', fontWeight: 600 }}>{alerta.alerta}</span>
                    <span className={`badge ${alerta.tipo === 'Sucesso' ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>{alerta.tipo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: GESTÃO DE RISCOS E BI OPERACIONAL */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '2rem 2.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Mapa de Riscos Preditivos & BI Operacional</h3>
            </div>
            <span className="badge badge-danger" style={{ fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '6px' }}>Correlação de Eventos Ativa</span>
          </div>

          <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', flexGrow: 1 }}>
            {/* RISCO PREDITIVO */}
            {riscos.map((rsk: any) => (
              <div key={rsk.id} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.8rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <span className="badge badge-danger" style={{ fontWeight: 800 }}>{rsk.codigo} · {rsk.categoria}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#dc2626' }}>Score: {rsk.score_risco}</span>
                </div>
                <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '1.15rem', color: '#991b1b', fontWeight: 800 }}>{rsk.descricao}</h4>
                <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.95rem', color: '#7f1d1d', lineHeight: 1.6 }}>
                  {rsk.risco_preditivo_ia}
                </p>

                <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '10px', border: '1px solid #fca5a5' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#dc2626', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Fatores de Correlação Identificados pela IA:</strong>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {rsk.correlao_eventos?.map((corr: string, cIdx: number) => (
                      <span key={cIdx} className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 700, border: '1px solid #fca5a5' }}>{corr}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* WIDGET DE BI OPERACIONAL */}
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #cbd5e1', marginTop: 'auto' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <BarChart2 size={22} style={{ color: '#3b82f6' }} /> Indicadores de Eficiência Hospitalar (BI Operacional)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '1.2rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Tempo Médio de Giro de Leito:</span>
                  <strong style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0ea5e9' }}>{analyticsData?.bi_operacional_data?.giro_leito_horas || 4.2}h</strong>
                </div>
                <div style={{ background: 'white', padding: '1.2rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>NPS Interno de Qualidade:</span>
                  <strong style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>{analyticsData?.bi_operacional_data?.nps_interno || 86}%</strong>
                </div>
                <div style={{ background: 'white', padding: '1.2rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Taxa de Infecção Cirúrgica:</span>
                  <strong style={{ fontSize: '1.6rem', fontWeight: 900, color: '#3b82f6' }}>{analyticsData?.bi_operacional_data?.taxa_infeccao_cirurgica || 0.8}%</strong>
                </div>
                <div style={{ background: 'white', padding: '1.2rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Conformidade Geral ONA:</span>
                  <strong style={{ fontSize: '1.6rem', fontWeight: 900, color: '#8b5cf6' }}>{analyticsData?.bi_operacional_data?.conformidade_geral_ona || 89.5}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
