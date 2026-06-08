'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, Plus, Edit, Trash2, QrCode, History, CheckCircle, Clock, X, Save, 
  AlertTriangle, Send, RefreshCw, Mail, BarChart2, UserCheck, Filter, Award, 
  Shield, Layers, Cpu, Compass, Search, Sparkles, FileCode, Check, ChevronRight, 
  Tag, ArrowRight, FileCheck, HelpCircle, Activity
} from 'lucide-react';

export default function PopsPage() {
  // Aba ativa: central, lowcode, templates, versionamento, dashboards, ia
  const [activeTab, setActiveTab] = useState('central');
  
  // Dados do backend
  const [pops, setPops] = useState<any[]>([]);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [tiposDoc, setTiposDoc] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [slas, setSlas] = useState<any[]>([]);
  
  // Estados de UI e Modais
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [selectedPop, setSelectedPop] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [viewingPendingContent, setViewingPendingContent] = useState(false);

  // Estados do Low-Code Admin
  const [newTipo, setNewTipo] = useState({ nome: '', categoria: 'Qualidade', descricao: '', workflow_id: '', template_id: '' });
  const [newCat, setNewCat] = useState({ nome: '', setor_alvo: 'Geral', subcategorias: '' });
  const [newWf, setNewWf] = useState({ nome: '', descricao: '', etapas: 'rascunho, revisão, aprovação, publicado', sla_horas: 48 });
  const [newTpl, setNewTpl] = useState({ nome: '', tipo_documental: 'POP', conteudo: '# Título: {{nome}}\n\n**Setor:** {{setor}}\n**Responsável:** {{responsavel}}\n**Data:** {{data}}\n\n## Conteúdo', placeholders: 'nome, setor, responsavel, data' });
  const [newForm, setNewForm] = useState({ nome: '', tipo_documental: 'POP', setor: 'Geral', campoNome: '', campoTipo: 'texto', campoObrig: false });

  // Estados de IA Documental
  const [iaAcao, setIaAcao] = useState('busca_semantica');
  const [iaQuery, setIaQuery] = useState('');
  const [iaResult, setIaResult] = useState<any>(null);
  const [iaLoading, setIaLoading] = useState(false);

  // Simulador de Usuário Ativo (RBAC & Segregação por Setor)
  const [activeUser, setActiveUser] = useState({
    nome: 'Enf. Maria Souza',
    role: 'Enfermeiro',
    departamento: 'Enfermagem',
    email: 'maria.souza@qualitaos.com'
  });

  // Form de Documento (POP/Protocolo/Contrato)
  const [formData, setFormData] = useState({
    titulo: '',
    codigo: '',
    versao: '1.0',
    setor: 'Enfermagem',
    status: 'Em Revisão',
    conteudo: '',
    autor: 'Gestor da Qualidade',
    aprovador: 'Coordenador / RT (Responsável Técnico)',
    tipo_documental: 'POP',
    categoria: 'Qualidade'
  });

  // Simulador de Placeholders do Template
  const [tplSimulacao, setTplSimulacao] = useState<any>(null);

  useEffect(() => {
    fetchAllData();
  }, [activeUser]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [resPops, resNotifs, resTypes, resCats, resWfs, resTpls, resForms, resSlas] = await Promise.all([
        fetch('/api/pops').then(r => r.json()),
        fetch('/api/notificacoes').then(r => r.json()),
        fetch('/api/documents/types').then(r => r.json()),
        fetch('/api/documents/categories').then(r => r.json()),
        fetch('/api/documents/workflows').then(r => r.json()),
        fetch('/api/documents/templates').then(r => r.json()),
        fetch('/api/documents/forms').then(r => r.json()),
        fetch('/api/documents/slas').then(r => r.json())
      ]);

      setPops(Array.isArray(resPops) ? resPops : []);
      setNotificacoes(Array.isArray(resNotifs) ? resNotifs : []);
      setTiposDoc(Array.isArray(resTypes) ? resTypes : []);
      setCategorias(Array.isArray(resCats) ? resCats : []);
      setWorkflows(Array.isArray(resWfs) ? resWfs : []);
      setTemplates(Array.isArray(resTpls) ? resTpls : []);
      setForms(Array.isArray(resForms) ? resForms : []);
      setSlas(Array.isArray(resSlas) ? resSlas : []);
    } catch (err) {
      console.error('Erro ao carregar dados da Gestão de Documentos:', err);
    } finally {
      setLoading(false);
    }
  }

  // Sincronização Rede Verse
  async function handleIngestVerse() {
    setIngesting(true);
    try {
      const res = await fetch('/api/pops/ingest', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await fetchAllData();
      } else {
        alert(data.error || 'Erro ao sincronizar workspace Rede Verse');
      }
    } catch (err) {
      alert('Erro de conexão ao sincronizar workspace');
    } finally {
      setIngesting(false);
    }
  }

  // Ações de Documentos (CRUD)
  async function handleViewDetails(id: number) {
    try {
      const res = await fetch(`/api/pops/${id}`);
      const data = await res.json();
      setSelectedPop(data);
      setFormData({
        titulo: data.titulo_pendente || data.titulo,
        codigo: data.codigo,
        versao: data.versao_pendente || (parseFloat(data.versao) + 0.1).toFixed(1),
        setor: data.setor,
        status: data.status,
        conteudo: data.conteudo_pendente || data.conteudo,
        autor: data.autor,
        aprovador: data.aprovador,
        tipo_documental: data.tipo_documental || 'POP',
        categoria: data.categoria || 'Qualidade'
      });
      setViewingPendingContent(data.status_edicao === 'Aguardando Aprovação');
    } catch (err) {
      console.error('Erro ao buscar detalhes do documento:', err);
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
        alert(isCreating ? 'Documento criado com sucesso com workflow BPM e SLA ativo!' : 'Edição registrada com sucesso! O documento ficará PENDENTE de aprovação versionada.');
        await fetchAllData();
        setIsCreating(false);
        setIsEditing(false);
        if (selectedPop) await handleViewDetails(selectedPop.id);
      } else {
        alert('Erro ao salvar documento. Verifique os dados.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar documento');
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
        await fetchAllData();
        if (selectedPop?.id === id) await handleViewDetails(id);
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
        await fetchAllData();
        if (selectedPop?.id === id) await handleViewDetails(id);
      } else {
        alert(data.error || 'Erro ao rejeitar edição');
      }
    } catch (err) {
      alert('Erro de conexão ao rejeitar edição');
    }
  }

  async function handleDeletePop(id: number) {
    if (!confirm('Tem certeza que deseja remover este documento institucional?')) return;
    try {
      const res = await fetch(`/api/pops/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAllData();
        if (selectedPop?.id === id) setSelectedPop(null);
      }
    } catch (err) {
      alert('Erro ao remover documento');
    }
  }

  function startCreate() {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedPop(null);
    setFormData({
      titulo: '',
      codigo: `DOC-${activeUser.departamento.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      versao: '1.0',
      setor: activeUser.departamento === 'Diretoria' ? 'Enfermagem' : activeUser.departamento,
      status: 'Rascunho',
      conteudo: `1. CABEÇALHO INSTITUCIONAL: Documento Padrão ONA | Setor: ${activeUser.departamento} | Prazo SLA: 48 Horas.\n\n2. RESPONSABILIDADES: Elaborador: ${activeUser.nome} | Revisor: Coordenador / RT | Aprovador: Diretoria.\n\n3. OBJETIVO:\n\n4. ABRANGÊNCIA:\n\n5. DESCRIÇÃO DO FLUXO OPERACIONAL:\n\n6. RISCOS E COMPLIANCE:`,
      autor: activeUser.nome,
      aprovador: 'Coordenador / RT (Responsável Técnico)',
      tipo_documental: 'POP',
      categoria: 'Qualidade'
    });
  }

  // Ações Low-Code Admin
  async function handleCreateTipo(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/documents/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newTipo.nome,
          categoria: newTipo.categoria,
          descricao: newTipo.descricao,
          workflow_id: newTipo.workflow_id ? parseInt(newTipo.workflow_id) : null,
          template_id: newTipo.template_id ? parseInt(newTipo.template_id) : null
        })
      });
      if (res.ok) {
        alert('Novo Tipo Documental criado com sucesso!');
        setNewTipo({ nome: '', categoria: 'Qualidade', descricao: '', workflow_id: '', template_id: '' });
        await fetchAllData();
      }
    } catch (err) { alert('Erro ao criar tipo documental'); }
  }

  async function handleCreateCat(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/documents/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newCat.nome,
          setor_alvo: newCat.setor_alvo,
          subcategorias_json: newCat.subcategorias.split(',').map(s => s.trim())
        })
      });
      if (res.ok) {
        alert('Nova Categoria criada com sucesso!');
        setNewCat({ nome: '', setor_alvo: 'Geral', subcategorias: '' });
        await fetchAllData();
      }
    } catch (err) { alert('Erro ao criar categoria'); }
  }

  async function handleCreateWf(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/documents/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newWf.nome,
          descricao: newWf.descricao,
          etapas_json: newWf.etapas.split(',').map(s => s.trim()),
          sla_horas_padrao: newWf.sla_horas
        })
      });
      if (res.ok) {
        alert('Workflow BPM criado com sucesso!');
        setNewWf({ nome: '', descricao: '', etapas: 'rascunho, revisão, aprovação, publicado', sla_horas: 48 });
        await fetchAllData();
      }
    } catch (err) { alert('Erro ao criar workflow'); }
  }

  async function handleCreateTpl(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/documents/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newTpl.nome,
          tipo_documental: newTpl.tipo_documental,
          conteudo_rich_text: newTpl.conteudo,
          placeholders_json: newTpl.placeholders.split(',').map(s => s.trim())
        })
      });
      if (res.ok) {
        alert('Template Rich Text criado com sucesso!');
        setNewTpl({ nome: '', tipo_documental: 'POP', conteudo: '# Título: {{nome}}\n\n**Setor:** {{setor}}\n**Responsável:** {{responsavel}}\n**Data:** {{data}}\n\n## Conteúdo', placeholders: 'nome, setor, responsavel, data' });
        await fetchAllData();
      }
    } catch (err) { alert('Erro ao criar template'); }
  }

  async function handleCreateForm(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/documents/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newForm.nome,
          tipo_documental: newForm.tipo_documental,
          setor: newForm.setor,
          campos: newForm.campoNome ? [{
            nome_campo: newForm.campoNome,
            tipo_campo: newForm.campoTipo,
            opcoes_json: [],
            obrigatorio: newForm.campoObrig
          }] : []
        })
      });
      if (res.ok) {
        alert('Formulário Dinâmico criado com sucesso!');
        setNewForm({ nome: '', tipo_documental: 'POP', setor: 'Geral', campoNome: '', campoTipo: 'texto', campoObrig: false });
        await fetchAllData();
      }
    } catch (err) { alert('Erro ao criar formulário'); }
  }

  // Execução de IA Documental
  async function handleRunIa(e: React.FormEvent) {
    e.preventDefault();
    setIaLoading(true);
    try {
      const res = await fetch('/api/documents/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: iaAcao,
          query: iaQuery,
          setor: activeUser.departamento,
          documento_id: selectedPop?.id || (pops.length > 0 ? pops[0].id : null)
        })
      });
      const data = await res.json();
      setIaResult(data);
    } catch (err) {
      alert('Erro ao executar análise de IA');
    } finally {
      setIaLoading(false);
    }
  }

  // Simulação de Placeholders
  function simularTemplate(tpl: any) {
    let texto = tpl.conteudo_rich_text;
    texto = texto.replace(/\{\{nome\}\}/g, 'Protocolo de Prevenção de Risco Sanitário');
    texto = texto.replace(/\{\{setor\}\}/g, activeUser.departamento);
    texto = texto.replace(/\{\{responsavel\}\}/g, activeUser.nome);
    texto = texto.replace(/\{\{data\}\}/g, new Date().toLocaleDateString());
    setTplSimulacao({ nome: tpl.nome, texto });
  }

  // Lógica de Filtro por Usuário/Setor Ativo
  const isAdminOrAuditor = activeUser.role === 'Admin' || activeUser.role.includes('Auditor') || activeUser.departamento === 'Diretoria';

  const filteredPops = pops.filter(pop => {
    if (isAdminOrAuditor) return true;
    return pop.setor?.toLowerCase().includes(activeUser.departamento.toLowerCase()) || 
           activeUser.departamento.toLowerCase().includes(pop.setor?.toLowerCase());
  });

  // Dashboards Contextuais do Setor Ativo
  const totalSetor = filteredPops.length;
  const emRevisao = filteredPops.filter(p => p.status === 'Em Revisão').length;
  const aprovados = filteredPops.filter(p => p.status === 'Aprovado').length;
  const rascunhos = filteredPops.filter(p => p.status === 'Rascunho').length;
  const vencidos = filteredPops.filter(p => new Date(p.data_limite || 0) < new Date()).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '4rem' }}>
      {/* BARRA DE SIMULAÇÃO DE PERFIL / SETOR */}
      <div style={{ padding: '1rem 1.5rem', background: 'var(--paper)', border: '2px solid var(--sage)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', background: '#eef2ec', borderRadius: '8px' }}>
            <Filter size={24} style={{ color: 'var(--sage)' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--muted)', display: 'block' }}>
              Segregação Contextual por Setor / Usuário Ativo
            </span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--ink)' }}>
              {activeUser.nome} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>({activeUser.role})</span> · Setor: <span style={{ color: 'var(--sage)', fontWeight: 700 }}>{activeUser.departamento}</span>
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>Alternar Visão Setorial:</label>
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
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, background: 'white', color: 'var(--ink)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="maria">Enfermagem (Enf. Maria Souza)</option>
            <option value="carlos">Medicina Psiquiatria (Dr. Carlos Mendes)</option>
            <option value="rt">Farmácia (Dr. Roberto Rocha)</option>
            <option value="ana">Qualidade e ONA (Auditora Ana Lima)</option>
            <option value="admin">Diretoria Geral (Administrador Geral)</option>
          </select>
        </div>
      </div>

      {/* HEADER DARK-MODE PREMIUM */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '16px', padding: '2.5rem', color: 'white', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <span style={{ padding: '0.3rem 0.8rem', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: '#38bdf8' }}>
                🏢 GESTÃO DOCUMENTAL DINÂMICA & BPM
              </span>
              <span style={{ padding: '0.3rem 0.8rem', background: 'rgba(52, 211, 153, 0.2)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>
                SLA Assíncrono Ativo
              </span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
              Central de Documentos & Workflows ({activeUser.departamento})
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '0.4rem', maxWidth: '800px', lineHeight: 1.6 }}>
              Ecossistema totalmente dinâmico e low-code para controle de POPs, Protocolos, Contratos e Formulários. 
              {isAdminOrAuditor ? ' Modo Administrador com acesso global a todos os fluxos e configurações da instituição.' : ` Visão operacional segregada para garantir foco e eficiência no setor de ${activeUser.departamento}.`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={handleIngestVerse} disabled={ingesting} className="btn btn-primary" style={{ backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: 700, border: 'none', padding: '0.8rem 1.5rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)' }}>
              {ingesting ? <RefreshCw className="spin" size={18} /> : <FileCheck size={18} />} 
              {ingesting ? 'Sincronizando...' : 'Sincronizar 69 POPs da Rede Verse'}
            </button>
            <button onClick={startCreate} className="btn btn-primary" style={{ backgroundColor: '#10b981', color: 'white', fontWeight: 700, border: 'none', padding: '0.8rem 1.5rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
              <Plus size={18} /> Criar Documento
            </button>
          </div>
        </div>

        {/* BARRA DE NAVEGAÇÃO DE ABAS PREMIUM */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', padding: '0.5rem', borderRadius: '12px', flexWrap: 'wrap' }}>
          {[
            { id: 'central', label: 'Central & Workflows BPM', icon: Layers },
            { id: 'lowcode', label: 'Low-Code Admin (Tipos & Forms)', icon: Cpu },
            { id: 'templates', label: 'Templates & Placeholders', icon: FileCode },
            { id: 'versionamento', label: 'Versionamento & Histórico', icon: History },
            { id: 'dashboards', label: 'Dashboards do Setor', icon: BarChart2 },
            { id: 'ia', label: 'IA Documental Contextual', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: '1 1 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '0.8rem 1.2rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  background: isActive ? 'white' : 'transparent',
                  color: isActive ? '#0f172a' : '#cbd5e1',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Icon size={18} style={{ color: isActive ? '#0f172a' : '#94a3b8' }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTEÚDO DAS ABAS */}

      {/* ABA 1: CENTRAL DOCUMENTAL & WORKFLOWS BPM */}
      {activeTab === 'central' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO DE DOCUMENTO */}
          {(isCreating || isEditing) && (
            <div className="card" style={{ borderTop: '4px solid var(--sage)', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.2rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>
                  {isCreating ? `Novo Documento Institucional (${activeUser.departamento})` : `Editar Documento: ${selectedPop?.codigo}`}
                </h2>
                <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="btn btn-secondary" style={{ borderRadius: '50%', padding: '0.5rem' }}><X size={18} /></button>
              </div>

              <form onSubmit={handleSavePop} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', padding: '1.5rem 0 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Título do Documento</label>
                    <input type="text" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Código Único</label>
                    <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} disabled={isEditing} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#f8fafc' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Tipo Documental</label>
                    <select value={formData.tipo_documental} onChange={e => setFormData({...formData, tipo_documental: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                      {tiposDoc.length === 0 ? (
                        <>
                          <option value="POP">POP (Procedimento Operacional)</option>
                          <option value="Protocolo">Protocolo Clínico</option>
                          <option value="Contrato">Contrato Jurídico</option>
                          <option value="Manual">Manual da Qualidade</option>
                          <option value="Formulário">Formulário / Registro</option>
                        </>
                      ) : (
                        tiposDoc.map(t => <option key={t.id} value={t.nome}>{t.nome} ({t.categoria})</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Categoria</label>
                    <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                      {categorias.length === 0 ? (
                        <>
                          <option value="Qualidade">Qualidade e ONA</option>
                          <option value="Assistencial">Assistencial</option>
                          <option value="Financeiro">Financeiro</option>
                          <option value="RH">Recursos Humanos</option>
                          <option value="Jurídico">Jurídico e Contratos</option>
                        </>
                      ) : (
                        categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Setor / Especialidade</label>
                    <select value={formData.setor} onChange={e => setFormData({...formData, setor: e.target.value})} disabled={!isAdminOrAuditor} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: isAdminOrAuditor ? 'white' : '#f8fafc' }}>
                      <option value="Enfermagem">Enfermagem</option>
                      <option value="Farmácia">Farmácia</option>
                      <option value="Administrativo">Administrativo</option>
                      <option value="Medicina Clínica">Medicina Clínica</option>
                      <option value="Medicina Psiquiatria">Medicina Psiquiatria</option>
                      <option value="Psicologia">Psicologia</option>
                      <option value="Qualidade e ONA">Qualidade e ONA</option>
                      <option value="Diretoria Geral">Diretoria Geral</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Etapa do Workflow</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                      <option value="Rascunho">Rascunho (Elaboração Inicial)</option>
                      <option value="Em Revisão">Em Revisão (Análise Técnica)</option>
                      <option value="Aprovado">Aprovado (Validação ONA)</option>
                      <option value="Publicado">Publicado (Vigente)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Autor Responsável</label>
                    <input type="text" value={formData.autor} onChange={e => setFormData({...formData, autor: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Aprovador Responsável</label>
                    <input type="text" value={formData.aprovador} onChange={e => setFormData({...formData, aprovador: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Conteúdo do Documento (Rich Text / Markdown)</label>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '8px 8px 0 0', padding: '0.8rem 1.2rem', background: '#f8fafc', display: 'flex', gap: '1rem', borderBottom: 'none' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--muted)' }}>Formatadores Rápidos:</span>
                    <button type="button" onClick={() => setFormData({...formData, conteudo: formData.conteudo + '\n**Negrito**'})} style={{ fontSize: '0.85rem', fontWeight: 700, background:'white', border:'1px solid var(--border)', padding:'0.2rem 0.6rem', borderRadius:'4px' }}>B</button>
                    <button type="button" onClick={() => setFormData({...formData, conteudo: formData.conteudo + '\n*Itálico*'})} style={{ fontSize: '0.85rem', fontStyle: 'italic', background:'white', border:'1px solid var(--border)', padding:'0.2rem 0.6rem', borderRadius:'4px' }}>I</button>
                    <button type="button" onClick={() => setFormData({...formData, conteudo: formData.conteudo + '\n## 1. Objetivo'})} style={{ fontSize: '0.85rem', fontWeight: 600, background:'white', border:'1px solid var(--border)', padding:'0.2rem 0.6rem', borderRadius:'4px' }}>H2</button>
                    <button type="button" onClick={() => setFormData({...formData, conteudo: formData.conteudo + '\n- Item de Verificação'})} style={{ fontSize: '0.85rem', background:'white', border:'1px solid var(--border)', padding:'0.2rem 0.6rem', borderRadius:'4px' }}>• Lista</button>
                  </div>
                  <textarea 
                    rows={14} 
                    value={formData.conteudo} 
                    onChange={e => setFormData({...formData, conteudo: e.target.value})} 
                    style={{ width: '100%', padding: '1.2rem', borderRadius: '0 0 8px 8px', border: '1px solid var(--border)', fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.7 }}
                    required 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <button type="button" onClick={() => { setIsCreating(false); setIsEditing(false); }} className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px' }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--sage)', border: 'none' }}><Save size={18} /> Salvar Documento no Workflow</button>
                </div>
              </form>
            </div>
          )}

          {/* LISTA KANBAN / TABELA DE DOCUMENTOS DO SETOR */}
          <div className="card" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: 'white' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.2rem' }}>
              <div>
                <h2 className="card-title" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FileText size={22} style={{ color: 'var(--sage)' }} /> Documentos e Protocolos Vigentes ({activeUser.departamento})
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
                  Acompanhe os fluxos de revisão, status de aprovação e prazos de SLA calculados em tempo real.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Total Exibido: <strong style={{ color: 'var(--ink)' }}>{filteredPops.length}</strong>
                </span>
              </div>
            </div>

            <div className="table-container" style={{ margin: 0 }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Código</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Título do Documento</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Tipo & Categoria</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Setor</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Versão</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Status do Workflow</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Prazo SLA</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && pops.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Carregando documentos institucionais...</td></tr>
                  ) : filteredPops.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Nenhum documento encontrado para o setor de {activeUser.departamento}.</td></tr>
                  ) : filteredPops.map(pop => {
                    const isOverdue = new Date(pop.data_limite) < new Date();
                    return (
                      <tr key={pop.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: 'white' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--sage)' }}>{pop.codigo}</td>
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--ink)' }}>{pop.titulo}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)' }}>{pop.tipo_documental || 'POP'}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px', width: 'fit-content' }}>{pop.categoria || 'Qualidade'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}><span className="badge badge-info" style={{ fontWeight: 600 }}>{pop.setor}</span></td>
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--ink)' }}>v{pop.versao}</td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${pop.status === 'Aprovado' || pop.status === 'Publicado' ? 'badge-success' : pop.status === 'Em Revisão' ? 'badge-warning' : 'badge-secondary'}`} style={{ fontWeight: 600, padding: '0.3rem 0.6rem' }}>
                            {pop.status}
                          </span>
                          {pop.status_edicao === 'Aguardando Aprovação' && (
                            <span className="badge badge-warning" style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}>
                              🟡 Edição v{pop.versao_pendente} Pendente
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {pop.data_limite ? (
                            <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, padding: '0.3rem 0.6rem' }}>
                              <Clock size={12} /> {new Date(pop.data_limite).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({isOverdue ? 'SLA Crítico' : 'SLA Ativo'})
                            </span>
                          ) : (
                            <span className="badge badge-secondary">Sem Prazo</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button onClick={() => handleViewDetails(pop.id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '6px', fontWeight: 600 }}>
                              Detalhes
                            </button>
                            <button onClick={() => { handleViewDetails(pop.id).then(() => setIsEditing(true)); }} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', borderRadius: '6px' }} title="Editar Documento">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDeletePop(pop.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.6rem', borderRadius: '6px' }} title="Remover">
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
          </div>
        </div>
      )}

      {/* ABA 2: LOW-CODE ADMIN (TIPOS, CATEGORIAS E FORMS) */}
      {activeTab === 'lowcode' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Cpu size={24} style={{ color: '#3b82f6' }} /> Painel Low-Code de Configuração Documental
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
              Crie e gerencie dinamicamente Tipos Documentais (POPs, Protocolos, Contratos, Manuais), Categorias, Workflows BPM e Formulários Dinâmicos sem a necessidade de alterar nenhuma linha de código.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {/* CRIAR TIPO DOCUMENTAL */}
            <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>Criar Tipo Documental</h3>
              </div>
              <form onSubmit={handleCreateTipo} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem 0 0' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Nome do Tipo (ex: POP, Contrato, Manual)</label>
                  <input type="text" value={newTipo.nome} onChange={e => setNewTipo({...newTipo, nome: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Categoria Alvo</label>
                  <select value={newTipo.categoria} onChange={e => setNewTipo({...newTipo, categoria: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="Qualidade">Qualidade</option>
                    <option value="Assistencial">Assistencial</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="RH">RH</option>
                    <option value="Jurídico">Jurídico</option>
                    <option value="Segurança">Segurança</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Descrição / Finalidade</label>
                  <textarea value={newTipo.descricao} onChange={e => setNewTipo({...newTipo, descricao: e.target.value})} rows={3} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Vincular Workflow BPM</label>
                  <select value={newTipo.workflow_id} onChange={e => setNewTipo({...newTipo, workflow_id: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="">Sem Workflow Específico (Padrão)</option>
                    {workflows.map(w => <option key={w.id} value={w.id}>{w.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Vincular Template Rich Text</label>
                  <select value={newTipo.template_id} onChange={e => setNewTipo({...newTipo, template_id: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="">Sem Template Específico (Padrão)</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', background: '#3b82f6', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 700 }}>
                  <Plus size={18} /> Adicionar Tipo Documental
                </button>
              </form>
            </div>

            {/* CRIAR CATEGORIA */}
            <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>Criar Categoria & Subcategorias</h3>
              </div>
              <form onSubmit={handleCreateCat} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem 0 0' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Nome da Categoria (ex: Qualidade, Assistencial)</label>
                  <input type="text" value={newCat.nome} onChange={e => setNewCat({...newCat, nome: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Setor Alvo Principal</label>
                  <select value={newCat.setor_alvo} onChange={e => setNewCat({...newCat, setor_alvo: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="Geral">Geral (Todos os Setores)</option>
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Medicina Clínica">Medicina Clínica</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Subcategorias (separadas por vírgula)</label>
                  <input type="text" value={newCat.subcategorias} onChange={e => setNewCat({...newCat, subcategorias: e.target.value})} placeholder="ex: Protocolos, Segurança, Eventos Adversos" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 'auto', background: '#10b981', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 700 }}>
                  <Plus size={18} /> Adicionar Categoria
                </button>
              </form>
            </div>

            {/* CRIAR WORKFLOW BPM */}
            <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>Criar Workflow Documental BPM</h3>
              </div>
              <form onSubmit={handleCreateWf} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem 0 0' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Nome do Workflow (ex: Workflow Contrato)</label>
                  <input type="text" value={newWf.nome} onChange={e => setNewWf({...newWf, nome: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Descrição do Fluxo</label>
                  <textarea value={newWf.descricao} onChange={e => setNewWf({...newWf, descricao: e.target.value})} rows={2} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Etapas do Workflow (separadas por vírgula)</label>
                  <input type="text" value={newWf.etapas} onChange={e => setNewWf({...newWf, etapas: e.target.value})} placeholder="ex: rascunho, assinatura, upload, validação, ativo" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>SLA Padrão (Horas)</label>
                  <input type="number" value={newWf.sla_horas} onChange={e => setNewWf({...newWf, sla_horas: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 'auto', background: '#8b5cf6', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 700 }}>
                  <Plus size={18} /> Adicionar Workflow BPM
                </button>
              </form>
            </div>

            {/* CRIAR FORMULÁRIO DINÂMICO */}
            <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>Criar Formulário & Campos Dinâmicos</h3>
              </div>
              <form onSubmit={handleCreateForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem 0 0' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Nome do Formulário</label>
                  <input type="text" value={newForm.nome} onChange={e => setNewForm({...newForm, nome: e.target.value})} placeholder="ex: Formulário de Emissão de Contrato" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Tipo Documental Associado</label>
                  <select value={newForm.tipo_documental} onChange={e => setNewForm({...newForm, tipo_documental: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="POP">POP</option>
                    <option value="Contrato">Contrato</option>
                    <option value="Protocolo">Protocolo</option>
                    <option value="Formulário">Formulário</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Setor Alvo</label>
                  <select value={newForm.setor} onChange={e => setNewForm({...newForm, setor: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="Geral">Geral</option>
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--ink)' }}>Adicionar Campo Inicial</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <input type="text" value={newForm.campoNome} onChange={e => setNewForm({...newForm, campoNome: e.target.value})} placeholder="Nome do Campo (ex: Assinatura do RT)" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <select value={newForm.campoTipo} onChange={e => setNewForm({...newForm, campoTipo: e.target.value})} style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                        <option value="texto">Texto Simples</option>
                        <option value="select">Lista Select</option>
                        <option value="upload">Upload de Arquivo</option>
                        <option value="datas">Data / Prazo</option>
                        <option value="assinaturas">Assinatura Digital</option>
                      </select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={newForm.campoObrig} onChange={e => setNewForm({...newForm, campoObrig: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                        Obrigatório
                      </label>
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 'auto', background: '#ec4899', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 700 }}>
                  <Plus size={18} /> Adicionar Formulário Dinâmico
                </button>
              </form>
            </div>
          </div>

          {/* LISTA DE CONFIGURAÇÕES ATIVAS */}
          <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.2rem' }}>
              <h3 className="card-title" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)' }}>Tipos Documentais & Workflows Ativos</h3>
            </div>
            <div className="table-container" style={{ margin: 0 }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Tipo Documental</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Categoria</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Workflow Associado</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Template Padrão</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {tiposDoc.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', background: 'white' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--ink)' }}>{t.nome}</td>
                      <td style={{ padding: '1rem' }}><span className="badge badge-info">{t.categoria}</span></td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--sage)' }}>{t.workflow_nome || 'Workflow Padrão ONA'}</td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#8b5cf6' }}>{t.template_nome || 'Template Padrão'}</td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>{t.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: TEMPLATES & PLACEHOLDERS */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileCode size={24} style={{ color: '#8b5cf6' }} /> Gestão de Templates Rich Text & Placeholders Dinâmicos
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
              Configure templates padronizados para cada tipo documental utilizando placeholders como <code>{`{{nome}}`}</code>, <code>{`{{setor}}`}</code>, <code>{`{{responsavel}}`}</code> e <code>{`{{data}}`}</code> para preenchimento automático.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {/* CRIAR TEMPLATE */}
            <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>Criar Template Rich Text</h3>
              </div>
              <form onSubmit={handleCreateTpl} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem 0 0' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Nome do Template</label>
                  <input type="text" value={newTpl.nome} onChange={e => setNewTpl({...newTpl, nome: e.target.value})} placeholder="ex: Template Padrão de Procedimento ONA" style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Tipo Documental Associado</label>
                  <select value={newTpl.tipo_documental} onChange={e => setNewTpl({...newTpl, tipo_documental: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="POP">POP</option>
                    <option value="Contrato">Contrato</option>
                    <option value="Protocolo">Protocolo</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Placeholders Permitidos (separados por vírgula)</label>
                  <input type="text" value={newTpl.placeholders} onChange={e => setNewTpl({...newTpl, placeholders: e.target.value})} style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Conteúdo Rich Text (com Placeholders)</label>
                  <textarea rows={10} value={newTpl.conteudo} onChange={e => setNewTpl({...newTpl, conteudo: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.6 }} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 'auto', background: '#8b5cf6', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 700 }}>
                  <Plus size={18} /> Salvar Template Rich Text
                </button>
              </form>
            </div>

            {/* LISTA DE TEMPLATES E SIMULADOR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>Templates Ativos & Simulador</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 0 0' }}>
                  {templates.map(tpl => (
                    <div key={tpl.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--ink)' }}>{tpl.nome}</strong>
                        <span className="badge badge-info">{tpl.tipo_documental}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {tpl.placeholders_json?.map((p: string, idx: number) => (
                          <span key={idx} style={{ background: '#e2e8f0', color: '#334155', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {'{'}{'{'}{p}{'}'}{'}'}
                          </span>
                        ))}
                      </div>
                      <button onClick={() => simularTemplate(tpl)} className="btn btn-secondary" style={{ width: 'fit-content', padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderColor: '#8b5cf6', color: '#8b5cf6', fontWeight: 600 }}>
                        ✨ Simular Preenchimento Automático
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* RESULTADO DA SIMULAÇÃO */}
              {tplSimulacao && (
                <div className="card" style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <div className="card-header" style={{ borderBottom: '1px solid #fde68a', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#92400e' }}>Resultado da Simulação: {tplSimulacao.nome}</h3>
                    <button onClick={() => setTplSimulacao(null)} className="btn btn-secondary" style={{ padding: '0.3rem', borderRadius: '50%' }}><X size={16} /></button>
                  </div>
                  <div style={{ padding: '1.5rem 0 0', whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', lineHeight: 1.8, color: '#1e293b', fontSize: '1rem' }}>
                    {tplSimulacao.texto}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: VERSIONAMENTO & HISTÓRICO */}
      {activeTab === 'versionamento' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid var(--amber)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <History size={24} style={{ color: 'var(--amber)' }} /> Histórico de Versionamento & Aprovação de Edições
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
              Visualize o histórico completo de alterações de cada documento, compare versões e aprove ou rejeite solicitações de edição pendentes com registro de justificativa para auditoria.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {/* SELEÇÃO DE DOCUMENTO PARA VER HISTÓRICO */}
            <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>Selecione um Documento</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1.5rem 0 0' }}>
                {filteredPops.map(pop => (
                  <button
                    key={pop.id}
                    onClick={() => handleViewDetails(pop.id)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: selectedPop?.id === pop.id ? '#f1f5f9' : 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedPop?.id === pop.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>{pop.codigo}: {pop.titulo}</strong>
                      <span className="badge badge-success">v{pop.versao}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Setor: {pop.setor} · Status: {pop.status}</span>
                    {pop.status_edicao === 'Aguardando Aprovação' && (
                      <span className="badge badge-warning" style={{ width: 'fit-content', marginTop: '0.2rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        🟡 Edição v{pop.versao_pendente} Pendente de Aprovação
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* PAINEL DE APROVAÇÃO E HISTÓRICO */}
            {selectedPop ? (
              <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: '4px solid var(--ink)' }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 className="card-title" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>{selectedPop.codigo}: {selectedPop.titulo}</h3>
                    <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Versão Vigente: <strong>v{selectedPop.versao}</strong> · Autor: {selectedPop.autor}</span>
                  </div>
                  <button onClick={() => setSelectedPop(null)} className="btn btn-secondary" style={{ padding: '0.3rem', borderRadius: '50%' }}><X size={16} /></button>
                </div>

                {/* EDIÇÃO PENDENTE */}
                {selectedPop.status_edicao === 'Aguardando Aprovação' && (
                  <div style={{ margin: '1.5rem 0 0', padding: '1.5rem', background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <AlertTriangle size={24} style={{ color: '#d97706' }} />
                      <div>
                        <h4 style={{ margin: 0, color: '#92400e', fontSize: '1.1rem', fontWeight: 700 }}>Solicitação de Edição Pendente (v{selectedPop.versao_pendente})</h4>
                        <p style={{ margin: 0, color: '#b45309', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                          O autor solicitou alterações neste documento. A versão vigente (v{selectedPop.versao}) continuará ativa até que a edição seja aprovada.
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #fde68a', fontFamily: 'Georgia, serif', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      <strong>Conteúdo Proposto:</strong>{'\n'}{selectedPop.conteudo_pendente}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleApproveEdit(selectedPop.id)} className="btn btn-primary" style={{ backgroundColor: 'var(--sage)', borderColor: 'var(--sage)', fontWeight: 700, padding: '0.6rem 1.2rem' }}>
                        <CheckCircle size={16} /> Aprovar e Publicar Edição
                      </button>
                      <button onClick={() => handleRejectEdit(selectedPop.id)} className="btn btn-danger" style={{ fontWeight: 700, padding: '0.6rem 1.2rem' }}>
                        <X size={16} /> Rejeitar Edição
                      </button>
                    </div>
                  </div>
                )}

                {/* HISTÓRICO DE VERSÕES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem 0 0' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} style={{ color: 'var(--muted)' }} /> Histórico de Versões Publicadas
                  </h4>
                  {selectedPop.historico_versoes?.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Nenhum histórico de versão anterior registrado para este documento.</p>
                  ) : (
                    selectedPop.historico_versoes?.map((v: any) => (
                      <div key={v.id} style={{ padding: '1.2rem', border: '1px solid var(--border)', borderRadius: '8px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className="badge badge-success" style={{ fontWeight: 700 }}>Versão {v.versao}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>{new Date(v.data_modificacao).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Autor da Modificação: <strong style={{ color: 'var(--ink)' }}>{v.autor}</strong></div>
                        <div style={{ padding: '1rem', background: 'white', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.5 }}>
                          {v.conteudo}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
                <p style={{ fontSize: '1.1rem', margin: 0 }}>Selecione um documento na lista ao lado para visualizar e gerenciar seu histórico de versões.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 5: DASHBOARDS CONTEXTUAIS DO SETOR */}
      {activeTab === 'dashboards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid var(--sage)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BarChart2 size={24} style={{ color: 'var(--sage)' }} /> Dashboards Contextuais — Setor: {activeUser.departamento}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
              Acompanhamento gerencial completo de documentos pendentes, contratos a vencer e cumprimento de SLAs operacionais no setor.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'white', padding: '1.8rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total de Documentos</span>
              <strong style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--ink)' }}>{totalSetor}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--sage)', fontWeight: 600 }}>100% Mapeados no Workflow</span>
            </div>
            <div style={{ background: 'white', padding: '1.8rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aprovados / Vigentes</span>
              <strong style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>{aprovados}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Validados pela Governança ONA</span>
            </div>
            <div style={{ background: 'white', padding: '1.8rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Em Revisão / Pendentes</span>
              <strong style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b' }}>{emRevisao}</strong>
              <span style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 600 }}>Aguardando Parecer Técnico</span>
            </div>
            <div style={{ background: 'white', padding: '1.8rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLAs Vencidos / Críticos</span>
              <strong style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444' }}>{vencidos}</strong>
              <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Ação Imediata Requerida</span>
            </div>
          </div>

          {/* LISTA DE SLAS E FILAS ASSÍNCRONAS */}
          <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.2rem' }}>
              <h3 className="card-title" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={22} style={{ color: 'var(--sage)' }} /> Fila de SLAs e Escalonamento Assíncrono (Worker)
              </h3>
            </div>
            <div className="table-container" style={{ margin: 0 }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Documento</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Setor</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Tipo de SLA</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Prazo Limite</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Status do Worker</th>
                  </tr>
                </thead>
                <tbody>
                  {slas.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Nenhum SLA pendente na fila do worker.</td></tr>
                  ) : slas.map(s => {
                    const isOver = new Date(s.data_limite) < new Date();
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: 'white' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--ink)' }}>{s.codigo}: {s.documento_titulo}</td>
                        <td style={{ padding: '1rem' }}><span className="badge badge-info">{s.setor}</span></td>
                        <td style={{ padding: '1rem', fontWeight: 600, textTransform: 'capitalize' }}>{s.tipo_sla}</td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${isOver ? 'badge-danger' : 'badge-warning'}`} style={{ fontWeight: 600, padding: '0.3rem 0.6rem' }}>
                            {new Date(s.data_limite).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`badge ${s.status_worker === 'escalonado' ? 'badge-danger' : 'badge-success'}`} style={{ fontWeight: 600, textTransform: 'uppercase', padding: '0.3rem 0.6rem' }}>
                            {s.status_worker}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 6: IA DOCUMENTAL CONTEXTUAL */}
      {activeTab === 'ia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #ec4899', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={24} style={{ color: '#ec4899' }} /> IA Documental & Análise de Impacto ONA
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
              Utilize inteligência artificial avançada para realizar buscas semânticas no acervo, analisar o impacto de alterações em fluxos operacionais e identificar automaticamente gaps documentais na acreditação.
            </p>
          </div>

          <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.2rem' }}>
              <h3 className="card-title" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)' }}>Assistente de Análise Documental</h3>
            </div>
            <form onSubmit={handleRunIa} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem 0 0' }}>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Selecione o Motor de IA</label>
                  <select value={iaAcao} onChange={e => setIaAcao(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontWeight: 600 }}>
                    <option value="busca_semantica">🔍 Busca Semântica & Recomendação de POPs</option>
                    <option value="analise_impacto">⚡ Análise de Impacto de Mudanças (Protocolos)</option>
                    <option value="identificacao_gaps">⚠️ Identificação de Gaps de Acreditação ONA</option>
                  </select>
                </div>
                {iaAcao === 'busca_semantica' && (
                  <div style={{ flex: 2, minWidth: '300px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Termo de Busca Semântica</label>
                    <input type="text" value={iaQuery} onChange={e => setIaQuery(e.target.value)} placeholder="ex: psicotrópicos, queda, infecção, glosa..." style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} required />
                  </div>
                )}
                {iaAcao === 'analise_impacto' && (
                  <div style={{ flex: 2, minWidth: '300px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--ink)' }}>Documento Alvo para Análise</label>
                    <select onChange={e => {
                      const found = pops.find(p => p.id === parseInt(e.target.value));
                      if (found) setSelectedPop(found);
                    }} style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontWeight: 600 }}>
                      {pops.map(p => <option key={p.id} value={p.id}>{p.codigo}: {p.titulo}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" disabled={iaLoading} className="btn btn-primary" style={{ width: 'fit-content', background: '#ec4899', border: 'none', padding: '0.8rem 1.8rem', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {iaLoading ? <RefreshCw className="spin" size={18} /> : <Sparkles size={18} />}
                {iaLoading ? 'Analisando com IA...' : 'Executar Motor de IA'}
              </button>
            </form>
          </div>

          {/* RESULTADOS DA IA */}
          {iaResult && (
            <div className="card" style={{ background: '#fdf2f8', border: '2px solid #fbcfe8', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid #fce7f3', paddingBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#be185d', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Sparkles size={22} style={{ color: '#ec4899' }} /> Relatório Diagnóstico da IA Documental
                </h3>
                <button onClick={() => setIaResult(null)} className="btn btn-secondary" style={{ padding: '0.3rem', borderRadius: '50%' }}><X size={16} /></button>
              </div>

              <div style={{ padding: '1.5rem 0 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* BUSCA SEMÂNTICA */}
                {iaResult.tipo === 'busca_semantica' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>Resultados Semânticos Encontrados ({iaResult.resultados?.length})</h4>
                    {iaResult.resultados?.length === 0 ? (
                      <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Nenhum documento relevante encontrado para este termo no setor.</p>
                    ) : (
                      iaResult.resultados?.map((r: any) => (
                        <div key={r.id} style={{ background: 'white', border: '1px solid #fbcfe8', borderRadius: '8px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '1.1rem', color: '#be185d' }}>{r.codigo}: {r.titulo}</strong>
                            <span className="badge badge-info">{r.setor}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {r.conteudo}
                          </p>
                          <button onClick={() => handleViewDetails(r.id)} className="btn btn-secondary" style={{ width: 'fit-content', padding: '0.3rem 0.8rem', fontSize: '0.85rem', borderColor: '#ec4899', color: '#ec4899', fontWeight: 600 }}>
                            Acessar Documento
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ANÁLISE DE IMPACTO */}
                {iaResult.tipo === 'analise_impacto' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ background: 'white', padding: '1.2rem', borderRadius: '8px', border: '1px solid #fbcfe8', flex: 1, minWidth: '200px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>Documento Analisado</span>
                        <strong style={{ fontSize: '1.1rem', color: '#be185d' }}>{iaResult.codigo}: {iaResult.documento}</strong>
                      </div>
                      <div style={{ background: 'white', padding: '1.2rem', borderRadius: '8px', border: '1px solid #fbcfe8', flex: 1, minWidth: '200px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>Impacto Operacional</span>
                        <strong style={{ fontSize: '1.1rem', color: '#ef4444' }}>{iaResult.impacto_operacional}</strong>
                      </div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fbcfe8', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <strong style={{ color: 'var(--ink)', fontSize: '1.05rem' }}>Setores Afetados pela Mudança:</strong>
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {iaResult.setores_afetados?.map((s: string, idx: number) => (
                          <span key={idx} className="badge badge-warning" style={{ fontWeight: 600, fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>{s}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fbcfe8', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <strong style={{ color: '#ef4444', fontSize: '1.05rem' }}>Riscos Identificados pela IA:</strong>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--ink)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        {iaResult.riscos_identificados?.map((r: string, idx: number) => <li key={idx}>{r}</li>)}
                      </ul>
                    </div>

                    <div style={{ background: '#ec4899', color: 'white', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <strong style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={20} /> Recomendação da IA de Governança
                      </strong>
                      <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6 }}>{iaResult.recomendacao_ia}</p>
                    </div>
                  </div>
                )}

                {/* IDENTIFICAÇÃO DE GAPS */}
                {iaResult.tipo === 'identificacao_gaps' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>Setor Analisado</span>
                      <strong style={{ fontSize: '1.3rem', color: '#be185d' }}>{iaResult.setor_analisado}</strong>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <strong style={{ color: 'var(--ink)', fontSize: '1.1rem' }}>Gaps Documentais Encontrados na Acreditação ONA:</strong>
                      {iaResult.gaps_encontrados?.map((g: any, idx: number) => (
                        <div key={idx} style={{ background: 'white', border: '1px solid #fbcfe8', borderRadius: '8px', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <span className="badge badge-info" style={{ marginBottom: '0.4rem', fontWeight: 600 }}>{g.tipo_documental}</span>
                            <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--ink)' }}>{g.gap}</strong>
                          </div>
                          <span className={`badge ${g.criticidade === 'Crítica' || g.criticidade === 'Alta' ? 'badge-danger' : 'badge-warning'}`} style={{ fontWeight: 700, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                            Criticidade: {g.criticidade}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: '#ec4899', color: 'white', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <strong style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={20} /> Plano de Ação Sugerido
                      </strong>
                      <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6 }}>{iaResult.sugestao_workflow}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
