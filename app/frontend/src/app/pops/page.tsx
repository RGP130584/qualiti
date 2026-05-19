'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, Plus, Edit, Trash2, QrCode, 
  History, CheckCircle, Clock, X, Save, AlertTriangle, Send, RefreshCw, Mail,
  BarChart2, UserCheck, Filter, Award, Shield
} from 'lucide-react';

export default function PopsPage() {
  const [pops, setPops] = useState<any[]>([]);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [selectedPop, setSelectedPop] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPainelSetor, setShowPainelSetor] = useState(false);
  const [viewingPendingContent, setViewingPendingContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [setoresConfig, setSetoresConfig] = useState<any[]>([]);
  const [tiposDocConfig, setTiposDocConfig] = useState<any[]>([]);

  // Simulador de Usuário Ativo (para demonstrar o filtro por setor/cargo)
  const [activeUser, setActiveUser] = useState({
    nome: 'Enf. Maria Souza',
    role: 'Enfermeiro',
    departamento: 'Enfermagem',
    email: 'maria.souza@qualitaos.com'
  });

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    codigo: '',
    versao: '1.0',
    setor: 'Enfermagem',
    status: 'Em Revisão',
    conteudo: '',
    autor: 'Gestor da Qualidade',
    aprovador: 'Coordenador / RT (Responsável Técnico)'
  });

  useEffect(() => {
    fetchPops();
    fetchNotificacoes();
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const sRes = await fetch('/api/admin/setores');
      if (sRes.ok) setSetoresConfig(await sRes.json());
      const tRes = await fetch('/api/admin/tipos-documentais');
      if (tRes.ok) setTiposDocConfig(await tRes.json());
    } catch (err) { console.error('Erro ao buscar configs dinamicas', err); }
  }

  async function fetchPops() {
    setLoading(true);
    try {
      const res = await fetch('/api/pops');
      const data = await res.json();
      setPops(data);
    } catch (err) {
      console.error('Erro ao buscar POPs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotificacoes() {
    try {
      const res = await fetch('/api/notificacoes');
      const data = await res.json();
      setNotificacoes(data);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    }
  }

  async function handleIngestVerse() {
    setIngesting(true);
    try {
      const res = await fetch('/api/pops/ingest', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await fetchPops();
        await fetchNotificacoes();
      } else {
        alert(data.error || 'Erro ao sincronizar workspace Rede Verse');
      }
    } catch (err) {
      alert('Erro de conexão ao sincronizar workspace');
    } finally {
      setIngesting(false);
    }
  }

  async function handleResendNotif(id: number) {
    try {
      const res = await fetch(`/api/notificacoes/${id}/resend`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await fetchNotificacoes();
      } else {
        alert('Erro ao reenviar notificação');
      }
    } catch (err) {
      alert('Erro de conexão ao reenviar notificação');
    }
  }

  async function handleViewDetails(id: number) {
    try {
      const res = await fetch(`/api/pops/${id}`);
      const data = await res.json();
      setSelectedPop(data);
      setFormData({
        titulo: data.titulo_pendente || data.titulo,
        codigo: data.codigo,
        versao: data.versao_pendente || (parseFloat(data.versao) + 0.1).toFixed(1), // Prepara próxima versão
        setor: data.setor,
        status: data.status,
        conteudo: data.conteudo_pendente || data.conteudo,
        autor: data.autor,
        aprovador: data.aprovador
      });
      setViewingPendingContent(data.status_edicao === 'Aguardando Aprovação');
    } catch (err) {
      console.error('Erro ao buscar detalhes do POP:', err);
    }
  }

  async function handleSavePop(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = isCreating ? '/api/pops' : `/api/pops/${selectedPop.id}`;
      const method = isCreating ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(isCreating ? 'POP criado com sucesso!' : 'Edição registrada com sucesso! O documento ficará com status PENDENTE de aprovação até ser validado pela Diretoria ou RT.');
        await fetchPops();
        await fetchNotificacoes();
        setIsCreating(false);
        setIsEditing(false);
        if (selectedPop) {
          await handleViewDetails(selectedPop.id);
        } else {
          setSelectedPop(null);
        }
      } else {
        alert('Erro ao salvar POP. Verifique se o código já existe.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar POP');
    }
  }

  async function handleApproveEdit(id: number) {
    try {
      const res = await fetch(`/api/pops/${id}/approve-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprovador_nome: activeUser.nome })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await fetchPops();
        await fetchNotificacoes();
        if (selectedPop?.id === id) {
          await handleViewDetails(id);
        }
      } else {
        alert(data.error || 'Erro ao aprovar edição');
      }
    } catch (err) {
      alert('Erro de conexão ao aprovar edição');
    }
  }

  async function handleRejectEdit(id: number) {
    const motivo = prompt('Informe o motivo da rejeição da edição:');
    if (motivo === null) return;
    try {
      const res = await fetch(`/api/pops/${id}/reject-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprovador_nome: activeUser.nome, motivo })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await fetchPops();
        await fetchNotificacoes();
        if (selectedPop?.id === id) {
          await handleViewDetails(id);
        }
      } else {
        alert(data.error || 'Erro ao rejeitar edição');
      }
    } catch (err) {
      alert('Erro de conexão ao rejeitar edição');
    }
  }

  async function handleDeletePop(id: number) {
    if (!confirm('Tem certeza que deseja remover este Procedimento Operacional Padrão?')) return;
    try {
      const res = await fetch(`/api/pops/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPops();
        await fetchNotificacoes();
        if (selectedPop?.id === id) setSelectedPop(null);
      }
    } catch (err) {
      alert('Erro ao remover POP');
    }
  }

  function startCreate() {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedPop(null);
    setFormData({
      titulo: '',
      codigo: `POP-${activeUser.departamento.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      versao: '1.0',
      setor: activeUser.departamento === 'Diretoria' ? 'Enfermagem' : activeUser.departamento,
      status: 'Em Revisão',
      conteudo: `1. CABEÇALHO INSTITUCIONAL: POP Padrão ONA | Setor: ${activeUser.departamento} | Prazo Limite SLA: 24 Horas.\n\n2. RESPONSABILIDADES: Elaborador: ${activeUser.nome} | Revisor: Coordenador / RT | Aprovador: Diretoria.\n\n3. OBJETIVO:\n\n4. ABRANGÊNCIA:\n\n5. DESCRIÇÃO DO PROCEDIMENTO:\n\n6. RISCOS E METAS ONA:`,
      autor: activeUser.nome,
      aprovador: 'Coordenador / RT (Responsável Técnico)'
    });
  }

  // Lógica de Filtro por Usuário/Setor Ativo
  const isAdminOrAuditor = activeUser.role === 'Admin' || activeUser.role.includes('Auditor') || activeUser.departamento === 'Diretoria';

  const filteredPops = pops.filter(pop => {
    if (isAdminOrAuditor) return true;
    return pop.setor.toLowerCase().includes(activeUser.departamento.toLowerCase()) || 
           activeUser.departamento.toLowerCase().includes(pop.setor.toLowerCase());
  });

  const filteredNotificacoes = notificacoes.filter(n => {
    if (isAdminOrAuditor) return true;
    return n.destinatario_papel.toLowerCase().includes(activeUser.role.toLowerCase()) || 
           n.destinatario_email.toLowerCase().includes(activeUser.email.toLowerCase()) ||
           n.pop_titulo.toLowerCase().includes(activeUser.departamento.toLowerCase());
  });

  // Cálculos para o Painel de Vigência e Aprovação do Setor
  const vigentes = filteredPops.filter(p => p.status === 'Aprovado' && new Date(p.data_limite || Date.now()) >= new Date());
  const aVencer = filteredPops.filter(p => p.status !== 'Aprovado' || new Date(p.data_limite || 0) < new Date());
  const aprovadores = Array.from(new Set(filteredPops.map(p => `${p.aprovador} (Autor: ${p.autor})`)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* BARRA DE SIMULAÇÃO DE PERFIL / SETOR */}
      <div style={{ padding: '1rem 1.5rem', background: 'var(--paper)', border: '2px solid var(--sage)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Filter size={24} style={{ color: 'var(--sage)' }} />
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--muted)', display: 'block' }}>
              Filtro de Visibilidade por Usuário / Setor Ativo
            </span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--ink)' }}>
              {activeUser.nome} ({activeUser.role} · Setor: <span style={{ color: 'var(--sage)' }}>{activeUser.departamento}</span>)
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>Simular Perfil:</label>
          <select 
            value={activeUser.email} 
            onChange={e => {
              const val = e.target.value;
              if (val === 'maria') setActiveUser({ nome: 'Enf. Maria Souza', role: 'Enfermeiro', departamento: 'Enfermagem', email: 'maria.souza@qualitaos.com' });
              if (val === 'carlos') setActiveUser({ nome: 'Dr. Carlos Mendes', role: 'Médico', departamento: 'Psiquiatria', email: 'carlos.mendes@qualitaos.com' });
              if (val === 'rt') setActiveUser({ nome: 'Dr. Roberto Rocha', role: 'Farmacêutico RT', departamento: 'Farmácia', email: 'roberto.rt@qualitaos.com' });
              if (val === 'ana') setActiveUser({ nome: 'Auditora Ana Lima', role: 'Auditor ONA', departamento: 'Qualidade e ONA', email: 'ana.lima@qualitaos.com' });
              if (val === 'admin') setActiveUser({ nome: 'Administrador Geral', role: 'Admin', departamento: 'Diretoria', email: 'admin@qualitaos.com' });
            }}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', fontWeight: 600, background: 'white' }}
          >
            <option value="maria">Enfermeiro (Setor: Enfermagem)</option>
            <option value="carlos">Médico (Setor: Psiquiatria)</option>
            <option value="rt">Farmacêutico RT (Setor: Farmácia)</option>
            <option value="ana">Auditor ONA (Acesso Total)</option>
            <option value="admin">Administrador Geral (Acesso Total)</option>
          </select>
        </div>
      </div>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Gestão de Documentos ({activeUser.departamento})</h1>
          <p style={{ color: 'var(--muted)' }}>
            {isAdminOrAuditor ? 'Visualizando todos os documentos da instituição (Modo Auditoria/Admin).' : `Visualizando exclusivamente os documentos e protocolos do setor de ${activeUser.departamento}.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowPainelSetor(true)} className="btn btn-primary" style={{ backgroundColor: 'var(--amber)', color: 'var(--ink)', borderColor: 'var(--amber)' }}>
            <BarChart2 size={18} /> Vigência e Aprovação ({activeUser.departamento})
          </button>
          <button onClick={handleIngestVerse} disabled={ingesting} className="btn btn-primary" style={{ backgroundColor: 'var(--sage)' }}>
            {ingesting ? <RefreshCw className="spin" size={18} /> : <Clock size={18} />} 
            {ingesting ? 'Sincronizando Workspace...' : 'Sincronizar Workspace Rede Verse (SLA 24h)'}
          </button>
          <button onClick={startCreate} className="btn btn-primary">
            <Plus size={18} /> Criar Novo POP
          </button>
        </div>
      </div>

      {/* MODAL / PAINEL DE VIGÊNCIA E APROVAÇÃO DO SETOR */}
      {showPainelSetor && (
        <div className="card" style={{ borderTop: '4px solid var(--amber)', background: 'var(--surface)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-warning" style={{ marginBottom: '0.4rem' }}>Relatório ONA em Tempo Real</span>
              <h2 className="card-title" style={{ fontSize: '1.5rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={24} style={{ color: 'var(--amber)' }} /> Painel de Vigência e Aprovação — Setor: {activeUser.departamento}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                Acompanhamento completo de quem aprovou os documentos, quais estão vigentes e quais exigem revisão imediata.
              </p>
            </div>
            <button onClick={() => setShowPainelSetor(false)} className="btn btn-secondary"><X size={18} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', padding: '1.5rem 0 0.5rem' }}>
            {/* COLUNA 1: VIGENTES */}
            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--sage)', fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>
                <CheckCircle size={20} /> POPs Vigentes e Ativos ({vigentes.length})
              </div>
              {vigentes.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Nenhum POP vigente encontrado para este setor.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {vigentes.map(p => (
                    <div key={p.id} style={{ background: 'white', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}>
                      <strong style={{ color: 'var(--ink)', display: 'block' }}>{p.codigo}: {p.titulo}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Versão {p.versao} · Aprovado por {p.aprovador}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COLUNA 2: A VENCER / VENCIDOS */}
            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--red)', fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>
                <AlertTriangle size={20} /> POPs a Vencer / Vencidos ({aVencer.length})
              </div>
              {aVencer.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Todos os POPs deste setor estão dentro da validade.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {aVencer.map(p => (
                    <div key={p.id} style={{ background: 'white', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ffdcd8', fontSize: '0.9rem' }}>
                      <strong style={{ color: 'var(--red)', display: 'block' }}>{p.codigo}: {p.titulo}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Status: {p.status} · Prazo SLA: {p.data_limite ? new Date(p.data_limite).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Crítico'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COLUNA 3: QUEM APROVOU */}
            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--amber)', fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>
                <UserCheck size={20} /> Histórico de Quem Aprovou
              </div>
              {aprovadores.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Nenhum registro de aprovação encontrado.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {aprovadores.map((aprovador, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{aprovador}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO */}
      {(isCreating || isEditing) ? (
        <div className="card" style={{ borderTop: '4px solid var(--sage)' }}>
          <div className="card-header">
            <h2 className="card-title">{isCreating ? `Novo Procedimento Operacional Padrão (${activeUser.departamento})` : `Editar POP: ${selectedPop?.codigo}`}</h2>
            <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="btn btn-secondary"><X size={18} /></button>
          </div>

          <form onSubmit={handleSavePop} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Título do POP</label>
                <input type="text" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Código Único</label>
                <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} disabled={isEditing} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Versão</label>
                <input type="text" value={formData.versao} onChange={e => setFormData({...formData, versao: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Setor / Especialidade</label>
                <select value={formData.setor} onChange={e => setFormData({...formData, setor: e.target.value})} disabled={!isAdminOrAuditor}>
                  {setoresConfig.length === 0 ? (
                    <>
                      <option value="Enfermagem">Enfermagem</option>
                      <option value="Psiquiatria">Psiquiatria</option>
                      <option value="Psicologia">Psicologia</option>
                      <option value="Farmácia">Farmácia</option>
                      <option value="Qualidade e ONA">Qualidade e ONA</option>
                      <option value="Diretoria">Diretoria</option>
                      <option value="Administrativo">Administrativo</option>
                      <option value="Cozinha e Nutrição">Cozinha e Nutrição</option>
                      <option value="Compras e Logística">Compras e Logística</option>
                      <option value="Financeiro">Financeiro</option>
                      <option value="Monitoria e CCIH">Monitoria e CCIH</option>
                    </>
                  ) : (
                    setoresConfig.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)
                  )}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Status de Aprovação</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Em Revisão">Em Revisão</option>
                  <option value="Rascunho">Rascunho</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Revisor / Autor Responsável</label>
                <input type="text" value={formData.autor} onChange={e => setFormData({...formData, autor: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Aprovador Responsável</label>
                <input type="text" value={formData.aprovador} onChange={e => setFormData({...formData, aprovador: e.target.value})} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Conteúdo do Procedimento (Editor Rico Padrão ONA)</label>
              <div style={{ border: '1px solid var(--border)', borderRadius: '6px 6px 0 0', padding: '0.6rem 1rem', background: 'var(--paper)', display: 'flex', gap: '1rem', borderBottom: 'none' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--muted)' }}>Barra de Formatação:</span>
                <button type="button" onClick={() => setFormData({...formData, conteudo: formData.conteudo + '\n**Negrito**'})} style={{ fontSize: '0.85rem', fontWeight: 700 }}>B</button>
                <button type="button" onClick={() => setFormData({...formData, conteudo: formData.conteudo + '\n*Itálico*'})} style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>I</button>
                <button type="button" onClick={() => setFormData({...formData, conteudo: formData.conteudo + '\n- Item de Lista'})} style={{ fontSize: '0.85rem' }}>• Lista</button>
                <button type="button" onClick={() => setFormData({...formData, conteudo: formData.conteudo + '\n### Subtítulo'})} style={{ fontSize: '0.85rem', fontWeight: 600 }}>H3</button>
              </div>
              <textarea 
                rows={14} 
                value={formData.conteudo} 
                onChange={e => setFormData({...formData, conteudo: e.target.value})} 
                style={{ borderRadius: '0 0 6px 6px', fontFamily: 'Georgia, serif', lineHeight: 1.6 }}
                required 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => { setIsCreating(false); setIsEditing(false); }} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary"><Save size={18} /> Salvar Edição (Aguardar Aprovação RT)</button>
            </div>
          </form>
        </div>
      ) : null}

      {/* LISTA DE POPS FILTRADOS */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Título do Procedimento</th>
              <th>Setor</th>
              <th>Versão</th>
              <th>Status</th>
              <th>Revisor / Autor</th>
              <th>Aprovador</th>
              <th>Prazo SLA 24h</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && pops.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Carregando POPs...</td></tr>
            ) : filteredPops.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum POP encontrado para o setor de {activeUser.departamento}.</td></tr>
            ) : filteredPops.map(pop => {
              const isOverdue = new Date(pop.data_limite) < new Date();
              return (
                <tr key={pop.id}>
                  <td style={{ fontWeight: 700, color: 'var(--sage)' }}>{pop.codigo}</td>
                  <td style={{ fontWeight: 600 }}>{pop.titulo}</td>
                  <td><span className="badge badge-info">{pop.setor}</span></td>
                  <td>v{pop.versao}</td>
                  <td>
                    <span className={`badge ${pop.status === 'Aprovado' ? 'badge-success' : pop.status === 'Em Revisão' ? 'badge-warning' : 'badge-danger'}`}>
                      {pop.status}
                    </span>
                    {pop.status_edicao === 'Aguardando Aprovação' && (
                      <span className="badge badge-warning" style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.75rem' }}>
                        🟡 Edição v{pop.versao_pendente} Pendente
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{pop.autor}</td>
                  <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{pop.aprovador}</td>
                  <td>
                    {pop.data_limite ? (
                      <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                        <Clock size={12} /> {new Date(pop.data_limite).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({isOverdue ? 'Prazo Crítico' : 'SLA Ativo'})
                      </span>
                    ) : (
                      <span className="badge badge-secondary">Sem Prazo</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => handleViewDetails(pop.id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}>
                        Detalhes
                      </button>
                      <button onClick={() => { handleViewDetails(pop.id).then(() => setIsEditing(true)); }} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} title="Editar">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDeletePop(pop.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }} title="Remover">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAINEL DE NOTIFICAÇÕES E ALERTAS SLA DO SETOR */}
      <div className="card" style={{ borderTop: '4px solid var(--red)', marginTop: '1rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={22} style={{ color: 'var(--red)' }} /> Notificações e Alertas SLA ({activeUser.departamento})
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              {isAdminOrAuditor ? 'Exibindo todos os disparos de e-mail e alertas de SLA da instituição.' : `Exibindo apenas os alertas e pendências direcionados ao setor de ${activeUser.departamento} ou ao cargo de ${activeUser.role}.`}
            </p>
          </div>
          <button onClick={fetchNotificacoes} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
            <RefreshCw size={16} /> Atualizar Alertas
          </button>
        </div>

        <div className="table-container" style={{ marginTop: '1.5rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Procedimento / Protocolo</th>
                <th>Destinatário</th>
                <th>Papel / Cargo</th>
                <th>Mensagem do Alerta</th>
                <th>Prazo SLA</th>
                <th>Status do Envio</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotificacoes.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Nenhuma notificação pendente ou registrada para o setor de {activeUser.departamento}.</td></tr>
              ) : filteredNotificacoes.map(n => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 700 }}>#{n.id}</td>
                  <td style={{ fontWeight: 600 }}>{n.pop_titulo}</td>
                  <td style={{ color: 'var(--sage)', fontWeight: 600 }}>{n.destinatario_email}</td>
                  <td><span className="badge badge-info">{n.destinatario_papel}</span></td>
                  <td style={{ fontSize: '0.85rem', maxWidth: '300px' }}>{n.mensagem}</td>
                  <td>
                    <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> {n.prazo_horas}h
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${n.status.includes('Reenviado') ? 'badge-danger' : 'badge-success'}`}>
                      {n.status}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleResendNotif(n.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--red)' }}>
                      <Send size={14} /> Reenviar Alerta SLA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETALHES DO POP SELECIONADO */}
      {selectedPop && !isEditing && (
        <div className="card" style={{ borderTop: '4px solid var(--ink)' }}>
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>{selectedPop.codigo} · v{selectedPop.versao} (Vigente)</span>
              {selectedPop.status_edicao === 'Aguardando Aprovação' && (
                <span className="badge badge-warning" style={{ marginLeft: '0.5rem', marginBottom: '0.5rem' }}>🟡 Edição v{selectedPop.versao_pendente} Pendente</span>
              )}
              <h2 className="card-title" style={{ fontSize: '1.6rem' }}>
                {viewingPendingContent ? selectedPop.titulo_pendente : selectedPop.titulo}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                Setor: <strong>{selectedPop.setor}</strong> · Autor: {selectedPop.autor} · Aprovador: {selectedPop.aprovador}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              {selectedPop.status_edicao === 'Aguardando Aprovação' && (
                <button 
                  onClick={() => setViewingPendingContent(!viewingPendingContent)} 
                  className="btn btn-secondary" 
                  style={{ borderColor: 'var(--amber)', color: 'var(--amber)', fontWeight: 600 }}
                >
                  {viewingPendingContent ? '👁️ Ver Versão Vigente' : '👁️ Ver Edição Pendente'}
                </button>
              )}
              <button onClick={() => setShowQrModal(true)} className="btn btn-secondary"><QrCode size={18} /> QR Code</button>
              <button onClick={() => setShowHistoryModal(true)} className="btn btn-secondary"><History size={18} /> Histórico</button>
              <button onClick={() => setIsEditing(true)} className="btn btn-primary"><Edit size={18} /> Editar</button>
              <button onClick={() => setSelectedPop(null)} className="btn btn-secondary"><X size={18} /></button>
            </div>
          </div>

          {selectedPop.status_edicao === 'Aguardando Aprovação' && (
            <div style={{ margin: '1.5rem 2rem 0', padding: '1.2rem 1.5rem', background: '#fffbeb', border: '2px solid var(--amber)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <AlertTriangle size={24} style={{ color: 'var(--amber)' }} />
                <div>
                  <h4 style={{ margin: 0, color: '#92400e', fontSize: '1.1rem', fontWeight: 700 }}>Aprovação de Edição Pendente (v{selectedPop.versao_pendente})</h4>
                  <p style={{ margin: 0, color: '#b45309', fontSize: '0.85rem' }}>
                    O autor solicitou alterações neste documento. A versão vigente (v{selectedPop.versao}) continuará ativa até que a edição seja aprovada.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button onClick={() => handleApproveEdit(selectedPop.id)} className="btn btn-primary" style={{ backgroundColor: 'var(--sage)', borderColor: 'var(--sage)' }}>
                  <CheckCircle size={16} /> Aprovar e Publicar Edição
                </button>
                <button onClick={() => handleRejectEdit(selectedPop.id)} className="btn btn-danger">
                  <X size={16} /> Rejeitar Edição
                </button>
              </div>
            </div>
          )}

          <div style={{ padding: '2rem', background: viewingPendingContent ? '#fafbf9' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', lineHeight: 1.8, marginTop: '1.5rem' }}>
            {viewingPendingContent ? selectedPop.conteudo_pendente : selectedPop.conteudo}
          </div>
        </div>
      )}

      {/* MODAL DE QR CODE */}
      {showQrModal && selectedPop && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Acesso Mobile via QR Code</h3>
              <button onClick={() => setShowQrModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: 'white', border: '2px solid var(--border)', borderRadius: '12px', display: 'inline-block' }}>
                <QrCode size={180} style={{ color: 'var(--ink)' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>{selectedPop.codigo}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Aponte a câmera do celular ou tablet para acessar este POP diretamente no leito do paciente (PWA Offline).</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO DE VERSÕES */}
      {showHistoryModal && selectedPop && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title">Histórico de Versões do POP</h3>
              <button onClick={() => setShowHistoryModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {selectedPop.historico_versoes?.map((v: any) => (
                <div key={v.id} style={{ padding: '1.2rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                    <span className="badge badge-success">Versão {v.versao}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{new Date(v.data_modificacao).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.8rem' }}>Autor da Modificação: <strong>{v.autor}</strong></div>
                  <div style={{ padding: '1rem', background: 'var(--paper)', borderRadius: '6px', fontSize: '0.9rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {v.conteudo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
