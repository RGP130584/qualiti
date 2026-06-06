'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, Plus, Edit, CheckCircle, Clock, X, Save, FileText, 
  ArrowRight, Zap, Shield, Target, Activity, Search, Filter, RefreshCw,
  TrendingUp, Bot, Layers, CheckSquare, Award, AlertCircle
} from 'lucide-react';

export default function IncidentsPage() {
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [selectedInc, setSelectedInc] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingCapa, setIsEditingCapa] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroSetor, setFiltroSetor] = useState('Todos');

  // Form states (Relatar Ocorrência)
  const [novaOcorrencia, setNovaOcorrencia] = useState({
    titulo: '',
    descricao: '',
    setor: 'Enfermagem',
    relator: 'Enf. Maria Souza'
  });

  // Simulação de IA Realtime ao digitar a descrição da ocorrência
  const [iaSimulada, setIaSimulada] = useState<any>(null);

  // Form state para Gestão CAPA e Causa Raiz
  const [capaForm, setCapaForm] = useState({
    status: 'Em Investigação IA',
    ishikawa_metodo: '',
    ishikawa_material: '',
    ishikawa_mao_obra: '',
    ishikawa_meio_ambiente: '',
    capa_acao: '',
    capa_responsavel: '',
    capa_prazo: new Date().toISOString().split('T')[0],
    capa_status: 'Pendente',
    planoAcaoList: [] as any[]
  });

  useEffect(() => {
    fetchOcorrencias();
  }, [filtroSetor]);

  async function fetchOcorrencias() {
    setLoading(true);
    try {
      let url = '/api/core/v2/ocorrencias';
      if (filtroSetor !== 'Todos') url += `?setor=${filtroSetor}`;
      const res = await fetch(url);
      const data = await res.json();
      setOcorrencias(data);
    } catch (err) {
      console.error('Erro ao buscar ocorrências da Core Platform:', err);
    } finally {
      setLoading(false);
    }
  }

  // Efeito para prever IA em tempo real ao digitar a descrição
  useEffect(() => {
    if (!novaOcorrencia.descricao || novaOcorrencia.descricao.length < 10) {
      setIaSimulada(null);
      return;
    }

    const texto = `${novaOcorrencia.titulo} ${novaOcorrencia.descricao}`.toLowerCase();

    // 1. Classificação IA Automática
    let ia_classificacao = 'Incidente Operacional';
    if (texto.includes('queda') || texto.includes('paciente') || texto.includes('medicação') || texto.includes('potássio') || texto.includes('insulina')) {
      ia_classificacao = 'Evento Adverso Assistencial';
    } else if (texto.includes('quase') || texto.includes('quase falha') || texto.includes('near miss') || texto.includes('percebeu')) {
      ia_classificacao = 'Quase Falha (Near Miss)';
    } else if (texto.includes('sistema') || texto.includes('servidor') || texto.includes('banco') || texto.includes('prontuário')) {
      ia_classificacao = 'Incidente de TI / Segurança Operacional';
    }

    // 2. Identificação de Criticidade
    let ia_criticidade = 'Média';
    if (texto.includes('óbito') || texto.includes('grave') || texto.includes('sentinela') || texto.includes('parada')) {
      ia_criticidade = 'Crítica (Evento Sentinela)';
    } else if (texto.includes('lesão') || texto.includes('erro') || texto.includes('troca') || texto.includes('potássio')) {
      ia_criticidade = 'Alta';
    } else if (texto.includes('leve') || texto.includes('escoriações') || texto.includes('atraso')) {
      ia_criticidade = 'Baixa';
    }

    // 3. Causa Raiz Automática
    const ia_causa_raiz = `Análise Preditiva IA: Provável falha no fator Mão de Obra (comunicação/treinamento) e Método (ausência de barreira física ou dupla checagem visual).`;

    // 4. Previsão de Riscos
    const ia_previsao_risco = ia_criticidade.includes('Crítica') || ia_criticidade === 'Alta' 
      ? 'Risco iminente de reincidência. Recomendada intervenção imediata da gestão da qualidade.'
      : 'Risco moderado controlado pelos protocolos vigentes.';

    // 5. Identificação de Impacto Normativo
    let ia_impacto_normativo = 'ONA Nível 1 (Segurança do Paciente) · ISO 9001';
    if (texto.includes('dados') || texto.includes('vazamento') || texto.includes('prontuário')) {
      ia_impacto_normativo += ' · LGPD (Privacidade de Dados)';
    }

    setIaSimulada({
      ia_classificacao,
      ia_criticidade,
      ia_causa_raiz,
      ia_previsao_risco,
      ia_impacto_normativo,
      ia_acoes_recomendadas: [
        { acao: 'Afastamento temporário ou revisão do lote/insumo envolvido', responsavel: novaOcorrencia.setor, prazo: 'Imediato (2h)', status: 'Pendente' },
        { acao: 'Revisão extraordinária do POP assistencial da área', responsavel: 'Gestor da Qualidade', prazo: '24h', status: 'Pendente' },
        { acao: 'Notificação compulsória no painel de gestão de riscos', responsavel: novaOcorrencia.relator, prazo: '12h', status: 'Concluído' }
      ]
    });
  }, [novaOcorrencia.titulo, novaOcorrencia.descricao]);

  async function handleSaveOcorrencia(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        ...novaOcorrencia,
        ia_classificacao: iaSimulada?.ia_classificacao,
        ia_criticidade: iaSimulada?.ia_criticidade,
        ia_causa_raiz: iaSimulada?.ia_causa_raiz,
        ia_previsao_risco: iaSimulada?.ia_previsao_risco,
        ia_impacto_normativo: iaSimulada?.ia_impacto_normativo,
        ia_acoes_recomendadas: iaSimulada?.ia_acoes_recomendadas || []
      };

      const res = await fetch('/api/core/v2/ocorrencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchOcorrencias();
        setIsCreating(false);
        setNovaOcorrencia({ titulo: '', descricao: '', setor: 'Enfermagem', relator: 'Enf. Maria Souza' });
        setIaSimulada(null);
        alert('Ocorrência relatada com sucesso! IA realizou a classificação e gerou o plano CAPA inicial.');
      }
    } catch (err) {
      alert('Erro de conexão ao relatar ocorrência');
    }
  }

  function startEditCapa(inc: any) {
    setSelectedInc(inc);
    setIsEditingCapa(true);
    setIsCreating(false);

    setCapaForm({
      status: inc.status || 'Em Investigação IA',
      ishikawa_metodo: inc.ia_causa_raiz || '',
      ishikawa_material: '',
      ishikawa_mao_obra: 'Falha na comunicação ou adesão ao POP',
      ishikawa_meio_ambiente: 'Fator ambiental ou layout inadequado',
      capa_acao: '',
      capa_responsavel: '',
      capa_prazo: new Date().toISOString().split('T')[0],
      capa_status: 'Pendente',
      planoAcaoList: inc.plano_capa || inc.ia_acoes_recomendadas || []
    });
  }

  function handleAddAcaoCapa() {
    if (!capaForm.capa_acao.trim() || !capaForm.capa_responsavel.trim()) return;
    const novaAcao = {
      acao: capaForm.capa_acao.trim(),
      responsavel: capaForm.capa_responsavel.trim(),
      prazo: capaForm.capa_prazo,
      status: capaForm.capa_status
    };
    setCapaForm({
      ...capaForm,
      planoAcaoList: [...capaForm.planoAcaoList, novaAcao],
      capa_acao: '',
      capa_responsavel: ''
    });
  }

  function handleRemoveAcaoCapa(idx: number) {
    setCapaForm({
      ...capaForm,
      planoAcaoList: capaForm.planoAcaoList.filter((_, i) => i !== idx)
    });
  }

  async function handleSaveCapaFinal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInc) return;

    try {
      const res = await fetch(`/api/core/v2/ocorrencias/${selectedInc.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: capaForm.status,
          plano_capa: capaForm.planoAcaoList,
          usuario: 'Gestor da Qualidade'
        })
      });

      if (res.ok) {
        await fetchOcorrencias();
        setIsEditingCapa(false);
        setSelectedInc(null);
        alert('Investigação e Plano CAPA atualizados com sucesso na Core Platform!');
      }
    } catch (err) {
      alert('Erro ao salvar plano CAPA');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* CABEÇALHO DO MÓDULO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '2.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            <Zap size={44} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>CORE PLATFORM · INTELIGÊNCIA OPERACIONAL</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.85rem' }}>IA-First & Automação CAPA</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Central Inteligente de Ocorrências e Melhoria Contínua</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: '0.4rem 0 0 0', maxWidth: '85ch' }}>
              Esqueça o burocrático “Cadastrar Não Conformidade”. Aqui você apenas <strong>Relata a Ocorrência</strong> e a Inteligência Artificial classifica automaticamente, identifica criticidade, correlaciona eventos e sugere o Plano de Ação CAPA em tempo real.
            </p>
          </div>
        </div>

        {/* AÇÕES NO CABEÇALHO */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => { setIsCreating(true); setIsEditingCapa(false); }} className="btn btn-primary" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800, padding: '1rem 1.8rem', borderRadius: '12px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(56,189,248,0.3)' }}>
            <Plus size={20} /> Relatar Ocorrência (IA-First)
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'white', padding: '1.2rem 1.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>
            <Filter size={18} /> Filtrar por Setor:
          </div>
          <select value={filtroSetor} onChange={e => setFiltroSetor(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', background: '#f8fafc' }}>
            <option value="Todos">Todos os Setores</option>
            <option value="Enfermagem">Enfermagem</option>
            <option value="Centro Cirúrgico">Centro Cirúrgico</option>
            <option value="Farmácia">Farmácia</option>
            <option value="UTI">UTI</option>
            <option value="CCIH">CCIH</option>
            <option value="Compras">Compras</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={fetchOcorrencias} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} /> Atualizar Lista
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* FORMULÁRIO 1: RELATAR OCORRÊNCIA (IA-FIRST) */}
      {/* ========================================== */}
      {isCreating && (
        <div className="card" style={{ borderTop: '4px solid #38bdf8', background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.8rem', borderRadius: '12px' }}>
                <Zap size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Relatar Ocorrência / Quase Falha (Near Miss)</h2>
                <p style={{ color: '#64748b', margin: '0.2rem 0 0 0', fontSize: '0.95rem' }}>Descreva o evento com suas próprias palavras. A IA assumirá a classificação e predição de riscos.</p>
              </div>
            </div>
            <button onClick={() => setIsCreating(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><X size={20} /></button>
          </div>

          <form onSubmit={handleSaveOcorrencia} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem' }}>
            {/* COLUNA ESQUERDA: INPUT DO USUÁRIO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Título / Resumo do Evento</label>
                  <input type="text" value={novaOcorrencia.titulo} onChange={e => setNovaOcorrencia({...novaOcorrencia, titulo: e.target.value})} placeholder="ex: Quase falha na administração de eletrólitos..." required style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Setor / Localização</label>
                  <select value={novaOcorrencia.setor} onChange={e => setNovaOcorrencia({...novaOcorrencia, setor: e.target.value})} style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1rem' }}>
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Centro Cirúrgico">Centro Cirúrgico</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="UTI">UTI</option>
                    <option value="CCIH">CCIH</option>
                    <option value="Compras">Compras</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Relator</label>
                  <input type="text" value={novaOcorrencia.relator} onChange={e => setNovaOcorrencia({...novaOcorrencia, relator: e.target.value})} required style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Descrição Detalhada (A IA analisa em tempo real ao digitar)</label>
                <textarea rows={6} value={novaOcorrencia.descricao} onChange={e => setNovaOcorrencia({...novaOcorrencia, descricao: e.target.value})} placeholder="Descreva o que aconteceu, horários, insumos envolvidos e o contexto operacional. Quanto mais detalhes, mais precisa será a predição da IA..." required style={{ width: '100%', padding: '1rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1rem', lineHeight: 1.6 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsCreating(false)} className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem', fontWeight: 700 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontWeight: 800, background: '#0ea5e9', borderColor: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={18} /> Confirmar Relato & Automação IA
                </button>
              </div>
            </div>

            {/* COLUNA DIREITA: PREVIEW DA IA EM TEMPO REAL (NOTION + LINEAR STYLE) */}
            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <Bot size={24} style={{ color: '#0ea5e9' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Motor de IA Assistiva (Realtime Preview)</h3>
              </div>

              {!iaSimulada ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
                  <Activity size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem', maxWidth: '30ch' }}>Comece a digitar uma descrição detalhada ao lado para ativar a classificação automática da IA.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.5s ease' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Classificação IA:</span>
                      <strong style={{ color: '#0ea5e9', fontSize: '1.05rem', display: 'block' }}>{iaSimulada.ia_classificacao}</strong>
                    </div>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Criticidade IA:</span>
                      <strong style={{ color: iaSimulada.ia_criticidade.includes('Crítica') ? '#ef4444' : '#f59e0b', fontSize: '1.05rem', display: 'block' }}>{iaSimulada.ia_criticidade}</strong>
                    </div>
                  </div>

                  <div style={{ background: 'white', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Causa Raiz Automática (Ishikawa):</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>{iaSimulada.ia_causa_raiz}</p>
                  </div>

                  <div style={{ background: 'white', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Previsão de Risco Preditivo:</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: iaSimulada.ia_criticidade.includes('Crítica') ? '#ef4444' : '#334155', lineHeight: 1.5, fontWeight: iaSimulada.ia_criticidade.includes('Crítica') ? 600 : 400 }}>{iaSimulada.ia_previsao_risco}</p>
                  </div>

                  <div style={{ background: 'white', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Impacto Normativo Identificado:</span>
                    <span className="badge" style={{ background: '#e2e8f0', color: '#0f172a', fontWeight: 700 }}>{iaSimulada.ia_impacto_normativo}</span>
                  </div>

                  <div style={{ background: 'white', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.6rem' }}>Recomendação Inicial de CAPA:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {iaSimulada.ia_acoes_recomendadas.map((acao: any, idx: number) => (
                        <div key={idx} style={{ fontSize: '0.85rem', background: '#f1f5f9', padding: '0.6rem 0.8rem', borderRadius: '6px', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{acao.acao}</span>
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{acao.prazo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* FORMULÁRIO 2: INVESTIGAÇÃO E CAPA (CORE PLATFORM) */}
      {/* ========================================== */}
      {isEditingCapa && selectedInc && (
        <div className="card" style={{ borderTop: '4px solid #f59e0b', background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.8rem', borderRadius: '12px' }}>
                <CheckSquare size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.2rem' }}>
                  <span className="badge badge-danger">Ocorrência #{selectedInc.id}</span>
                  <span className="badge" style={{ background: '#0ea5e9', color: 'white' }}>{selectedInc.ia_classificacao}</span>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Plano de Ação CAPA & Investigação de Causa Raiz</h2>
                <p style={{ color: '#64748b', margin: '0.2rem 0 0 0', fontSize: '0.95rem' }}>Acompanhe as predições da IA e gerencie as ações corretivas/preventivas com seus respectivos SLAs.</p>
              </div>
            </div>
            <button onClick={() => setIsEditingCapa(false)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><X size={20} /></button>
          </div>

          <form onSubmit={handleSaveCapaFinal} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* RESUMO DO EVENTO E PREDIÇÃO IA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', background: '#f8fafc', padding: '1.8rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <strong style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Resumo do Relato:</strong>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', color: '#0f172a' }}>{selectedInc.titulo}</h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>{selectedInc.descricao}</p>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Análise de Causa Raiz (IA Preditiva):</strong>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#0ea5e9', fontWeight: 600, background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>{selectedInc.ia_causa_raiz || 'Causa raiz em processamento pela IA...'}</p>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Status do Workflow:</strong>
                <select value={capaForm.status} onChange={e => setCapaForm({...capaForm, status: e.target.value})} style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1rem', fontWeight: 700 }}>
                  <option value="Em Investigação IA">Em Investigação IA</option>
                  <option value="Aguardando Validação CAPA">Aguardando Validação CAPA</option>
                  <option value="Em Execução">Em Execução</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
              </div>
            </div>

            {/* PLANO DE AÇÃO CAPA (AÇÕES CORRETIVAS E PREVENTIVAS) */}
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle size={22} style={{ color: '#10b981' }} /> Plano de Ação CAPA (Ações Práticas e SLAs)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {capaForm.planoAcaoList.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', fontStyle: 'italic', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
                    Nenhuma ação prática cadastrada no plano CAPA.
                  </div>
                ) : capaForm.planoAcaoList.map((acao, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.8rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', flexWrap: 'wrap', gap: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ flexGrow: 1 }}>
                      <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.3rem' }}>{acao.acao}</strong>
                      <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span>Responsável: <strong>{acao.responsavel}</strong></span>
                        <span>·</span>
                        <span>Prazo Limite: <strong>{acao.prazo ? new Date(acao.prazo).toLocaleDateString() : 'Imediato'}</strong></span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                      <span className={`badge ${acao.status === 'Concluído' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>{acao.status}</span>
                      <button type="button" onClick={() => handleRemoveAcaoCapa(idx)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#ef4444', borderColor: '#fca5a5' }}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* INCLUIR NOVA AÇÃO NO PLANO CAPA */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', background: '#f1f5f9', padding: '1.8rem', borderRadius: '12px', alignItems: 'end', border: '1px solid #cbd5e1' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nova Ação Corretiva / Preventiva</label>
                  <input type="text" value={capaForm.capa_acao} onChange={e => setCapaForm({...capaForm, capa_acao: e.target.value})} placeholder="Descreva a ação prática..." style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Responsável</label>
                  <input type="text" value={capaForm.capa_responsavel} onChange={e => setCapaForm({...capaForm, capa_responsavel: e.target.value})} placeholder="ex: Farmácia / RH" style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Prazo Limite</label>
                  <input type="date" value={capaForm.capa_prazo} onChange={e => setCapaForm({...capaForm, capa_prazo: e.target.value})} style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Status</label>
                  <select value={capaForm.capa_status} onChange={e => setCapaForm({...capaForm, capa_status: e.target.value})} style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '0.95rem' }}>
                    <option value="Pendente">Pendente</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
                <button type="button" onClick={handleAddAcaoCapa} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', height: '45px', fontWeight: 800, background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Plus size={18} /> Incluir Ação
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.2rem' }}>
              <button type="button" onClick={() => setIsEditingCapa(false)} className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem', fontWeight: 700 }}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> Salvar Plano CAPA na Core Platform
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* LISTA GERAL DE OCORRÊNCIAS (TABLE CONTAINER) */}
      {/* ========================================== */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div className="card-header" style={{ padding: '1.8rem 2.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="card-title" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Ocorrências Relatadas & Acompanhamento de Melhoria Contínua</h3>
          <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            {ocorrencias.length} Ocorrências Ativas
          </span>
        </div>
        <div className="table-container">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#334155', fontWeight: 700, fontSize: '0.9rem', textAlign: 'left' }}>
                <th style={{ padding: '1.2rem 1.8rem' }}>ID</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Título / Resumo</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Classificação IA</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Criticidade</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Setor</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Status</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Data do Relato</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Ações de Governança</th>
              </tr>
            </thead>
            <tbody>
              {loading && ocorrencias.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>Carregando ocorrências da Core Platform...</td></tr>
              ) : ocorrencias.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>Nenhuma ocorrência encontrada para este filtro.</td></tr>
              ) : ocorrencias.map(inc => (
                <tr key={inc.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s ease' }} className="hover:bg-slate-50">
                  <td style={{ padding: '1.2rem 1.8rem', fontWeight: 800, color: '#0f172a' }}>#{inc.id}</td>
                  <td style={{ padding: '1.2rem 1.8rem', fontWeight: 700, color: '#1e293b', maxWidth: '300px' }}>{inc.titulo}</td>
                  <td style={{ padding: '1.2rem 1.8rem' }}>
                    <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                      {inc.ia_classificacao || 'Incidente Operacional'}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem 1.8rem' }}>
                    <span className={`badge ${inc.ia_criticidade?.includes('Crítica') ? 'badge-danger' : inc.ia_criticidade === 'Alta' ? 'badge-warning' : 'badge-success'}`} style={{ padding: '0.4rem 0.8rem', fontWeight: 700, borderRadius: '6px' }}>
                      {inc.ia_criticidade || 'Média'}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem 1.8rem', fontWeight: 600, color: '#475569' }}>{inc.setor}</td>
                  <td style={{ padding: '1.2rem 1.8rem' }}>
                    <span className={`badge ${inc.status === 'Encerrado' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '0.4rem 0.8rem', fontWeight: 700, borderRadius: '6px' }}>
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem 1.8rem', color: '#64748b', fontWeight: 500 }}>{new Date(inc.data_relato || inc.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1.2rem 1.8rem' }}>
                    <button onClick={() => startEditCapa(inc)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#cbd5e1', color: '#0f172a' }}>
                      Gestão CAPA & IA <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
