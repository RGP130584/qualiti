'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cpu, Sparkles, CheckCircle, Save, FileText, AlertTriangle, ArrowRight, X, 
  Bot, ShieldCheck, Award, Target, BarChart2, MessageSquare, Send, RefreshCw, 
  Layers, Compass, UserCheck, Search, Filter, History
} from 'lucide-react';

export default function AiPage() {
  const [activeAgent, setActiveAgent] = useState('Agente Governança');
  const [promptInput, setPromptInput] = useState('');
  const [contextoInput, setContextoInput] = useState('Diretoria');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Provedor de IA
  const [provider, setProvider] = useState('mock'); // 'mock' | 'openai' | 'anthropic' | 'ollama'
  const [apiKey, setApiKey] = useState('mock_secure_key_for_simulation');
  const [configSaved, setConfigSaved] = useState(false);

  // Geração de POP (Legado preservado)
  const [popForm, setPopForm] = useState({ titulo: '', setor: 'Enfermagem', palavrasChave: '' });
  const [popGerado, setPopGerado] = useState<any>(null);

  // Resumo de Incidentes (Legado preservado)
  const [resumoIncidentes, setResumoIncidentes] = useState<any>(null);

  const agentesList = [
    { nome: 'Agente Governança', icone: UserCheck, desc: 'Alinhamento estratégico, organograma, regimento interno e blindagem de responsabilidade técnica.', cor: '#3b82f6', bg: '#eff6ff', promptEx: 'Analisar alinhamento estratégico da governança clínica com as metas de ESG 2026' },
    { nome: 'Agente Qualidade', icone: Sparkles, desc: 'Análise de reincidência, transição PDCA para Seis Sigma, conformidade de POPs e melhoria contínua.', cor: '#10b981', bg: '#ecfdf5', promptEx: 'Sugira um plano de ação para reduzir reincidência de quedas no 3º andar' },
    { nome: 'Agente ONA', icone: Award, desc: 'Copiloto de acreditação, verificação de requisitos Nível 1, 2 e 3, e atas de análise crítica.', cor: '#8b5cf6', bg: '#f5f3ff', promptEx: 'Avaliar prontidão do setor de UTI para a certificação ONA Nível 3 (Excelência)' },
    { nome: 'Agente Auditoria', icone: ShieldCheck, desc: 'Auditor virtual IA em tempo real, varredura de prontuários, aprazamento e checagem de alergias.', cor: '#f59e0b', bg: '#fffbeb', promptEx: 'Executar varredura contínua de conformidade nos prontuários da Enfermagem' },
    { nome: 'Agente Estratégico', icone: Target, desc: 'Benchmarking de mercado, score institucional, inteligência operacional e giro de leito.', cor: '#ef4444', bg: '#fef2f2', promptEx: 'Comparar nosso Score Institucional com a média nacional de hospitais premium' },
    { nome: 'Agente Compliance', icone: Layers, desc: 'Conformidade legal, alvarás sanitários, proteção de dados (LGPD) e termos de consentimento.', cor: '#6366f1', bg: '#eef2ff', promptEx: 'Verificar status de assinaturas do Termo de Consentimento LGPD entre os colaboradores' },
  ];

  useEffect(() => {
    fetchAiLogs();
  }, [activeAgent]);

  async function fetchAiLogs() {
    try {
      const res = await fetch(`/api/core/v2/ai/logs?agente=${activeAgent}`);
      const data = await res.json();
      setAiLogs(data);
    } catch (err) {
      console.error('Erro ao buscar logs do Agente IA:', err);
    }
  }

  async function handleAskAgent(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!promptInput.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/core/v2/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agente: activeAgent,
          prompt: promptInput,
          usuario: 'gestor.qualidade@qualitaos.com',
          contexto: contextoInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponse(data);
        await fetchAiLogs();
      }
    } catch (err) {
      alert('Erro de comunicação com o Agente de IA');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickPrompt(promptText: string) {
    setPromptInput(promptText);
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  }

  async function handleGeneratePop(e: React.FormEvent) {
    e.preventDefault();
    if (!popForm.titulo.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-pop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...popForm, provider })
      });
      if (res.ok) {
        const data = await res.json();
        setPopGerado(data);
      }
    } catch (err) {
      alert('Erro ao gerar POP via IA');
    } finally {
      setLoading(false);
    }
  }

  async function handleSummarizeIncidents() {
    setLoading(true);
    try {
      const resInc = await fetch('/api/incidents');
      const incidentes = await resInc.json();
      const res = await fetch('/api/ai/summarize-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentes, provider })
      });
      if (res.ok) {
        const data = await res.json();
        setResumoIncidentes(data);
      }
    } catch (err) {
      alert('Erro ao resumir incidentes via IA');
    } finally {
      setLoading(false);
    }
  }

  const currAgentObj = agentesList.find(a => a.nome === activeAgent) || agentesList[0];
  const AgentIcon = currAgentObj.icone;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* CABEÇALHO DO MÓDULO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '2.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            <Cpu size={44} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>IA CORPORATIVA · COPILOTO INSTITUCIONAL</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.85rem' }}>6 Agentes Especializados</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Central de Agentes de Inteligência Artificial</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: '0.4rem 0 0 0', maxWidth: '85ch' }}>
              Consulte nossos 6 Agentes de IA dedicados para busca semântica, geração de relatórios, análise documental, recomendação de ações CAPA, insights operacionais e comparação normativa em tempo real.
            </p>
          </div>
        </div>

        {/* STATUS NO CABEÇALHO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.06)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>LLM Pluggable Engine Ativo</span>
        </div>
      </div>

      {/* CONFIGURAÇÃO DA API PLUGÁVEL (NOTION + LINEAR STYLE) */}
      <div className="card" style={{ borderTop: '4px solid #3b82f6', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.5rem 0' }}>Configuração de Provedor LLM (Pluggable API / Ollama Local)</h2>

        {configSaved && (
          <div style={{ padding: '1rem', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} /> Configurações de IA atualizadas com sucesso!
          </div>
        )}

        <form onSubmit={handleSaveConfig} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Provedor de IA Ativo</label>
            <select value={provider} onChange={e => setProvider(e.target.value)} style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1rem', fontWeight: 600 }}>
              <option value="mock">QualitaAI (Simulação Nativa embutida - Recomendado)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4-turbo)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
              <option value="ollama">Ollama (LLM Local / Llama 3 / Mistral)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Chave de API (API Key / Endpoint Local)</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." required style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1rem' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', height: '45px', fontWeight: 800, background: '#3b82f6', borderColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={18} /> Salvar Configurações
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.9rem', color: '#64748b', border: '1px solid #cbd5e1' }}>
          <strong>Nota de Arquitetura:</strong> A filosofia do Qualiti OS permite rodar 100% offline via Ollama local ou utilizar a simulação nativa sem custos adicionais de infraestrutura ou tokens.
        </div>
      </div>

      {/* ========================================== */}
      {/* SEÇÃO DOS 6 AGENTES INSTITUCIONAIS (TABS / CARDS) */}
      {/* ========================================== */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Bot size={28} style={{ color: '#3b82f6' }} /> Selecione o Agente Institucional de IA
        </h2>

        {/* GRID DE SELEÇÃO DOS 6 AGENTES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {agentesList.map((ag) => {
            const Icon = ag.icone;
            const isSelected = activeAgent === ag.nome;
            return (
              <div 
                key={ag.nome}
                onClick={() => { setActiveAgent(ag.nome); setPromptInput(''); setAiResponse(null); }}
                style={{
                  background: isSelected ? ag.bg : 'white',
                  border: `2px solid ${isSelected ? ag.cor : '#e2e8f0'}`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 10px 20px -5px ${ag.cor}33` : '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
                className="hover:border-blue-500 hover:shadow-md"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ background: isSelected ? ag.cor : '#f1f5f9', color: isSelected ? 'white' : '#64748b', padding: '0.8rem', borderRadius: '12px', transition: 'all 0.2s ease' }}>
                    <Icon size={24} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: isSelected ? '#0f172a' : '#334155' }}>{ag.nome}</h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, flexGrow: 1 }}>{ag.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${isSelected ? ag.cor + '33' : '#e2e8f0'}`, paddingTop: '0.8rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? ag.cor : '#94a3b8', textTransform: 'uppercase' }}>
                    {isSelected ? 'Agente Ativo' : 'Clique para Ativar'}
                  </span>
                  <ArrowRight size={16} style={{ color: isSelected ? ag.cor : '#cbd5e1' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* INTERFACE DO AGENTE ATIVO */}
        <div className="card" style={{ borderTop: `4px solid ${currAgentObj.cor}`, background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <div style={{ background: currAgentObj.bg, color: currAgentObj.cor, padding: '1rem', borderRadius: '14px' }}>
                <AgentIcon size={32} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.2rem' }}>
                  <span className="badge" style={{ background: currAgentObj.cor, color: 'white', fontWeight: 800, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>{currAgentObj.nome}</span>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Copiloto Institucional Ativo</span>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Interação & Busca Semântica Contextual</h2>
              </div>
            </div>

            {/* SELETOR DE CONTEXTO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#f8fafc', padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Contexto do Agente:</span>
              <select value={contextoInput} onChange={e => setContextoInput(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}>
                <option value="Diretoria">Diretoria</option>
                <option value="Enfermagem">Enfermagem</option>
                <option value="Centro Cirúrgico">Centro Cirúrgico</option>
                <option value="Farmácia">Farmácia</option>
                <option value="UTI">UTI</option>
                <option value="CCIH">CCIH</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
            {/* COLUNA ESQUERDA: PROMPT E PERGUNTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* PROMPT DE EXEMPLO RÁPIDO */}
              <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Sugestão de Prompt para o {currAgentObj.nome}:</span>
                <button 
                  type="button" 
                  onClick={() => handleQuickPrompt(currAgentObj.promptEx)} 
                  style={{ width: '100%', padding: '0.8rem', background: 'white', border: `1px solid ${currAgentObj.cor}`, borderRadius: '8px', color: currAgentObj.cor, fontWeight: 700, fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  className="hover:bg-slate-50"
                >
                  <span>{currAgentObj.promptEx}</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* CAIXA DE PROMPT LIVRE */}
              <form onSubmit={handleAskAgent} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flexGrow: 1 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Prompt / Pergunta para o Agente</label>
                  <textarea rows={5} value={promptInput} onChange={e => setPromptInput(e.target.value)} placeholder={`Faça uma pergunta sobre normas, solicite uma análise de causa raiz ou peça a geração de um relatório para o setor de ${contextoInput}...`} required style={{ width: '100%', padding: '1rem 1.2rem', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '1rem', lineHeight: 1.6 }} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontWeight: 800, background: currAgentObj.cor, borderColor: currAgentObj.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '1.05rem', borderRadius: '12px', boxShadow: `0 4px 15px ${currAgentObj.cor}44` }} disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: '20px', height: '20px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span> : <Send size={20} />}
                  {loading ? 'Processando IA com Busca Semântica...' : `Enviar para o ${currAgentObj.nome}`}
                </button>
              </form>
            </div>

            {/* COLUNA DIREITA: RESPOSTA DA IA E RECOMENDAÇÕES */}
            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <Bot size={24} style={{ color: currAgentObj.cor }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Resposta do Copiloto Institucional</h3>
              </div>

              {!aiResponse ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
                  <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem', maxWidth: '30ch' }}>Envie um prompt ao lado para receber a análise contextual e as recomendações de ação do agente.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', animation: 'fadeIn 0.5s ease' }}>
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: `6px solid ${currAgentObj.cor}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.6rem' }}>Análise Semântica / Parecer Técnico:</span>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {aiResponse.resposta}
                    </p>
                  </div>

                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.8rem' }}>Ações Recomendadas (CAPA / SLAs):</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {aiResponse.acoes_recomendadas?.map((acao: any, idx: number) => (
                        <div key={idx} style={{ background: '#f1f5f9', padding: '1rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: '1rem', color: '#0f172a', marginBottom: '0.2rem' }}>{acao.acao}</strong>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Prazo Sugerido: <strong>{acao.prazo}</strong></span>
                          </div>
                          <span className={`badge ${acao.prioridade === 'Crítica' || acao.prioridade === 'Alta' ? 'badge-danger' : 'badge-warning'}`} style={{ fontWeight: 800, padding: '0.4rem 0.8rem' }}>
                            {acao.prioridade}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* HISTÓRICO DE LOGS DO AGENTE ATIVO */}
      {/* ========================================== */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div className="card-header" style={{ padding: '1.8rem 2.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <History size={22} style={{ color: '#64748b' }} />
            <h3 className="card-title" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Histórico de Consultas & Trilha de Auditoria ({activeAgent})</h3>
          </div>
          <span className="badge" style={{ background: '#e2e8f0', color: '#0f172a', fontWeight: 700, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            {aiLogs.length} Consultas Registradas
          </span>
        </div>
        <div className="table-container">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#334155', fontWeight: 700, fontSize: '0.9rem', textAlign: 'left' }}>
                <th style={{ padding: '1.2rem 1.8rem' }}>ID</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Usuário / Solicitante</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Contexto</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Prompt / Pergunta</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Resposta Resumida</th>
                <th style={{ padding: '1.2rem 1.8rem' }}>Data da Consulta</th>
              </tr>
            </thead>
            <tbody>
              {aiLogs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>Nenhum log de consulta encontrado para este agente.</td></tr>
              ) : aiLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s ease' }} className="hover:bg-slate-50">
                  <td style={{ padding: '1.2rem 1.8rem', fontWeight: 800, color: '#0f172a' }}>#{log.id}</td>
                  <td style={{ padding: '1.2rem 1.8rem', fontWeight: 700, color: '#1e293b' }}>{log.usuario}</td>
                  <td style={{ padding: '1.2rem 1.8rem' }}>
                    <span className="badge badge-warning" style={{ fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '6px' }}>{log.contexto}</span>
                  </td>
                  <td style={{ padding: '1.2rem 1.8rem', color: '#334155', maxWidth: '300px', fontWeight: 500 }}>{log.prompt}</td>
                  <td style={{ padding: '1.2rem 1.8rem', color: '#64748b', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.resposta}</td>
                  <td style={{ padding: '1.2rem 1.8rem', color: '#64748b', fontWeight: 500 }}>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MÓDULOS LEGADOS PRESERVADOS (GERADOR DE POP E RESUMO INCIDENTES) */}
      {/* ========================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
        {/* GERADOR DE POPS VIA IA */}
        <div className="card" style={{ borderTop: '4px solid #10b981', background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              <FileText size={24} style={{ color: '#10b981' }} /> Gerador Automático de POPs (Legado)
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>A IA redige um rascunho completo de Procedimento Operacional Padrão alinhado às exigências da ONA.</p>
          </div>

          <form onSubmit={handleGeneratePop} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Título do Procedimento</label>
              <input type="text" value={popForm.titulo} onChange={e => setPopForm({...popForm, titulo: e.target.value})} placeholder="ex: Protocolo de Prevenção de Lesão por Pressão" required style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '0.95rem' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Setor</label>
                <input type="text" value={popForm.setor} onChange={e => setPopForm({...popForm, setor: e.target.value})} required style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Palavras-chave</label>
                <input type="text" value={popForm.palavrasChave} onChange={e => setPopForm({...popForm, palavrasChave: e.target.value})} placeholder="ex: Braden, Mudança de decúbito..." style={{ width: '100%', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 800, background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
              <Sparkles size={18} /> {loading ? 'Gerando Procedimento...' : 'Gerar Rascunho de POP'}
            </button>
          </form>

          {popGerado && (
            <div style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className="badge badge-success" style={{ fontWeight: 800 }}>Rascunho Gerado via IA ({popGerado.provider_utilizado})</span>
                <button onClick={() => setPopGerado(null)} className="btn btn-secondary" style={{ padding: '0.2rem' }}><X size={16} /></button>
              </div>

              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', fontSize: '0.95rem', lineHeight: 1.8, maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem', color: '#334155' }}>
                {popGerado.conteudo}
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end' }}>
                <a href="/pops" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', fontWeight: 800, background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Levar para o Editor de POPs <ArrowRight size={16} />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* RESUMO E ANÁLISE DE INCIDENTES VIA IA */}
        <div className="card" style={{ borderTop: '4px solid #f59e0b', background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              <AlertTriangle size={24} style={{ color: '#f59e0b' }} /> Análise Preditiva de Não Conformidades (Legado)
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>O assistente analisa o histórico de incidentes e identifica padrões de risco e sugestões de melhoria contínua.</p>
          </div>

          <button type="button" onClick={handleSummarizeIncidents} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 800, background: '#f59e0b', borderColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
            <Sparkles size={18} /> {loading ? 'Analisando Histórico...' : 'Analisar Incidentes e Quase Falhas'}
          </button>

          {resumoIncidentes && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '6px solid #f59e0b', border: '1px solid #cbd5e1' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>Resumo Executivo de Riscos</h3>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: '#334155', lineHeight: 1.6 }}>{resumoIncidentes.resumo_executivo}</p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Planos de Ação Recomendados pela IA</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {resumoIncidentes.acoes_sugeridas?.map((acao: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1rem', color: '#0f172a', marginBottom: '0.2rem' }}>{acao.acao}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Setor Sugerido: <strong>{acao.setor}</strong></div>
                      </div>
                      <span className={`badge ${acao.prioridade === 'Alta' ? 'badge-danger' : 'badge-warning'}`} style={{ fontWeight: 800, padding: '0.4rem 0.8rem' }}>{acao.prioridade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
