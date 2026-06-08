'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, Layers, GitMerge, ShieldAlert, ArrowRight, UserPlus, 
  Trash2, Plus, RefreshCw, Briefcase, Calendar, CheckCircle2, UserCheck, XCircle
} from 'lucide-react';

interface Cargo {
  id: number;
  nome: string;
  descricao?: string;
  setor: string;
  limite_vagas: number;
}

interface Ocupacao {
  id: number;
  usuario_id: number;
  cargo_id: number;
  usuario_nome: string;
  usuario_email: string;
  cargo_nome: string;
  cargo_setor: string;
  data_inicio?: string;
  data_fim?: string;
}

interface Reporte {
  cargo_subordinado_id: number;
  cargo_superior_id: number;
  cargo_subordinado_nome?: string;
  cargo_superior_nome?: string;
  tipo?: string;
}

interface Substituto {
  id: number;
  usuario_titular_id: number;
  usuario_substituto_id: number;
  usuario_titular_nome?: string;
  usuario_substituto_nome?: string;
  data_inicio: string;
  data_fim: string;
  status: string;
}

interface User {
  id: number;
  nome: string;
  email: string;
  unidade: string;
}

export default function EstruturaPage() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [ocupacoes, setOcupacoes] = useState<Ocupacao[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [substitutos, setSubstitutos] = useState<Substituto[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [newCargo, setNewCargo] = useState({ nome: '', descricao: '', setor: 'Enfermagem', limite_vagas: 1 });
  const [newOcupacao, setNewOcupacao] = useState({ cargo_id: '', usuario_id: '', nome_novo: '', email_novo: '' });
  const [newReporte, setNewReporte] = useState({ subordinate_cargo_id: '', superior_cargo_id: '' });
  const [newSubstituto, setNewSubstituto] = useState({ usuario_titular_id: '', usuario_substituto_id: '', data_inicio: '', data_fim: '' });

  // Tab state
  const [activeTab, setActiveTab] = useState<'visual' | 'cargos' | 'colaboradores' | 'substitutos'>('visual');

  async function fetchData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [cRes, oRes, rRes, sRes, uRes] = await Promise.all([
        fetch('/api/omoc/cargos'),
        fetch('/api/omoc/ocupacoes'),
        fetch('/api/omoc/reportes'),
        fetch('/api/omoc/substitutos'),
        fetch('/api/users')
      ]);

      if (cRes.ok) setCargos(await cRes.json());
      if (oRes.ok) setOcupacoes(await oRes.json());
      if (rRes.ok) setReportes(await rRes.json());
      if (sRes.ok) setSubstitutos(await sRes.json());
      if (uRes.ok) setAllUsers(await uRes.json());
    } catch (err) {
      console.error('Erro ao buscar dados do Organograma', err);
      setErrorMsg('Falha ao conectar com a API do organograma.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      setErrorMsg(msg);
      setSuccessMsg('');
      setTimeout(() => setErrorMsg(''), 6000);
    }
  };

  const handleCreateCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/omoc/cargos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCargo)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar cargo');

      triggerToast('success', `Cargo "${data.nome}" cadastrado com sucesso!`);
      setNewCargo({ nome: '', descricao: '', setor: 'Enfermagem', limite_vagas: 1 });
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.message);
    }
  };

  const handleDeleteCargo = async (id: number) => {
    if (!confirm('Deseja realmente excluir este cargo?')) return;
    try {
      const res = await fetch(`/api/omoc/cargos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir cargo');

      triggerToast('success', 'Cargo excluído com sucesso.');
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.message);
    }
  };

  const handleCreateOcupacao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { cargo_id: Number(newOcupacao.cargo_id) };
      if (newOcupacao.usuario_id) {
        payload.usuario_id = Number(newOcupacao.usuario_id);
      } else if (newOcupacao.nome_novo && newOcupacao.email_novo) {
        payload.nome = newOcupacao.nome_novo;
        payload.email = newOcupacao.email_novo;
      } else {
        throw new Error('Selecione um colaborador existente ou preencha os dados do novo colaborador.');
      }

      const res = await fetch('/api/omoc/ocupacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao vincular colaborador');

      triggerToast('success', 'Colaborador vinculado ao cargo com sucesso!');
      setNewOcupacao({ cargo_id: '', usuario_id: '', nome_novo: '', email_novo: '' });
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.message);
    }
  };

  const handleTerminateOcupacao = async (id: number) => {
    if (!confirm('Deseja realmente desligar este colaborador do cargo? Isso liberará a vaga e desativará seu login.')) return;
    try {
      const res = await fetch(`/api/omoc/ocupacoes/${id}/terminate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao finalizar vínculo');

      triggerToast('success', 'Colaborador desligado com sucesso. Eventos e tarefas de BPM foram redirecionados.');
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.message);
    }
  };

  const handleCreateReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/omoc/reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subordinate_cargo_id: Number(newReporte.subordinate_cargo_id),
          superior_cargo_id: Number(newReporte.superior_cargo_id),
          tipo: 'direto'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao vincular reporte');

      triggerToast('success', 'Linha de reporte hierárquico registrada com sucesso!');
      setNewReporte({ subordinate_cargo_id: '', superior_cargo_id: '' });
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.message);
    }
  };

  const handleDeleteReporte = async (sub: number, sup: number) => {
    if (!confirm('Deseja remover esta linha de subordinação?')) return;
    try {
      const res = await fetch(`/api/omoc/reportes?subordinate_cargo_id=${sub}&superior_cargo_id=${sup}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover subordinação');

      triggerToast('success', 'Subordinação hierárquica removida.');
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.message);
    }
  };

  const handleCreateSubstituto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/omoc/substitutos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_titular_id: Number(newSubstituto.usuario_titular_id),
          usuario_substituto_id: Number(newSubstituto.usuario_substituto_id),
          data_inicio: newSubstituto.data_inicio,
          data_fim: newSubstituto.data_fim
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar substituto');

      triggerToast('success', 'Substituto cadastrado com sucesso!');
      setNewSubstituto({ usuario_titular_id: '', usuario_substituto_id: '', data_inicio: '', data_fim: '' });
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.message);
    }
  };

  const handleDeleteSubstituto = async (id: number) => {
    if (!confirm('Remover esta configuração de substituição temporária?')) return;
    try {
      const res = await fetch(`/api/omoc/substitutos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao deletar');

      triggerToast('success', 'Substituição removida com sucesso.');
      fetchData();
    } catch (err: any) {
      triggerToast('error', err.message);
    }
  };

  // ----------------------------------------------------
  // CONSTRUÇÃO E RENDERIZAÇÃO DA ÁRVORE VISUAL (Notion-style)
  // ----------------------------------------------------
  // Constrói árvore hierárquica
  const buildTree = () => {
    // 1. Encontra quais cargos reportam a quais
    const parentMap = new Map<number, number>(); // subordinado -> superior
    const childrenMap = new Map<number, number[]>(); // superior -> subordinados[]

    cargos.forEach(c => {
      childrenMap.set(c.id, []);
    });

    reportes.forEach(r => {
      parentMap.set(r.cargo_subordinado_id, r.cargo_superior_id);
      if (childrenMap.has(r.cargo_superior_id)) {
        childrenMap.get(r.cargo_superior_id)!.push(r.cargo_subordinado_id);
      }
    });

    // 2. Acha as raízes (cargos que não possuem superior cadastrado)
    const roots = cargos.filter(c => !parentMap.has(c.id));
    const orphans = cargos.filter(c => parentMap.has(c.id) && !cargos.some(p => p.id === parentMap.get(c.id)));

    // Junta órfãos cujos superiores foram deletados às raízes
    const allRoots = [...roots, ...orphans];

    return { allRoots, childrenMap };
  };

  const { allRoots, childrenMap } = buildTree();

  // Renderiza um nó da árvore recursivamente
  const renderNode = (cargoId: number, depth = 0) => {
    const cargo = cargos.find(c => c.id === cargoId);
    if (!cargo) return null;

    // Achar ocupantes ativos deste cargo
    const activeOcups = ocupacoes.filter(o => o.cargo_id === cargoId && (!o.data_fim || new Date(o.data_fim) > new Date()));
    const childIds = childrenMap.get(cargoId) || [];

    return (
      <div key={cargoId} style={{ marginLeft: depth > 0 ? `${depth * 2.5}rem` : 0, position: 'relative', marginBottom: '1rem' }}>
        {/* Linha de conexão visual */}
        {depth > 0 && (
          <div style={{
            position: 'absolute',
            left: `-${1.5}rem`,
            top: '1.2rem',
            width: '1.5rem',
            height: '2px',
            background: 'var(--border, #cbd5e1)',
          }} />
        )}
        
        {/* Cartão do Cargo */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: '500px',
          position: 'relative',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }} className="hover:shadow-md hover:scale-[1.01]">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', background: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
              {cargo.setor}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              Vagas: {activeOcups.length}/{cargo.limite_vagas}
            </span>
          </div>

          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            {cargo.nome}
          </h4>
          
          {cargo.descricao && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
              {cargo.descricao}
            </p>
          )}

          {/* Ocupantes da Vaga */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: activeOcups.length > 0 ? '1px solid #f1f5f9' : 'none', paddingTop: activeOcups.length > 0 ? '0.5rem' : 0 }}>
            {activeOcups.map(oc => (
              <div key={oc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                    {oc.usuario_nome.charAt(0)}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{oc.usuario_nome}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.4rem' }}>({oc.usuario_email})</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleTerminateOcupacao(oc.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                  title="Desligar Colaborador"
                >
                  <XCircle size={15} />
                </button>
              </div>
            ))}

            {activeOcups.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Briefcase size={12} /> Nenhuma vaga ocupada (Cargo Vago)
              </span>
            )}
          </div>
        </div>

        {/* Renderiza Recursivamente os subordinados */}
        {childIds.length > 0 && (
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {childIds.map(childId => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* ALERTAS */}
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <ShieldAlert size={20} /> {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#f0fdf4', borderLeft: '4px solid #22c55e', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {/* HEADER TELA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>Organograma Institucional</h1>
          <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Módulo OMOC: Definição de cargos, prevenção de subordinação cíclica, interinidades e governança.</p>
        </div>
        <button 
          onClick={fetchData} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #cbd5e1', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
        >
          <RefreshCw size={16} /> Atualizar Painel
        </button>
      </div>

      {/* TABS DE NAVEGAÇÃO INTERNA */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '1.5rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('visual')} 
          style={{ padding: '0.8rem 0.2rem', background: 'none', border: 'none', borderBottom: activeTab === 'visual' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'visual' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
        >
          Visualizador Hierárquico (Notion-style)
        </button>
        <button 
          onClick={() => setActiveTab('cargos')} 
          style={{ padding: '0.8rem 0.2rem', background: 'none', border: 'none', borderBottom: activeTab === 'cargos' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'cargos' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
        >
          Configurar Cargos & Reportes
        </button>
        <button 
          onClick={() => setActiveTab('colaboradores')} 
          style={{ padding: '0.8rem 0.2rem', background: 'none', border: 'none', borderBottom: activeTab === 'colaboradores' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'colaboradores' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
        >
          Vincular Colaboradores
        </button>
        <button 
          onClick={() => setActiveTab('substitutos')} 
          style={{ padding: '0.8rem 0.2rem', background: 'none', border: 'none', borderBottom: activeTab === 'substitutos' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'substitutos' ? '#0f172a' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
        >
          Substitutos Temporários
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
          <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>Carregando dados da estrutura corporativa...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: VISUALIZADOR HIERÁRQUICO */}
          {activeTab === 'visual' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem', minHeight: '400px' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Árvore de Reportes da Unidade</h3>
              
              {allRoots.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {allRoots.map(root => renderNode(root.id))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Layers size={40} style={{ color: '#94a3b8' }} />
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Nenhum cargo estruturado neste organograma.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONFIGURAR CARGOS & REPORTES */}
          {activeTab === 'cargos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* CADASTRO DE CARGOS */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                  <Plus size={18} style={{ color: '#3b82f6' }} /> Adicionar Novo Cargo
                </h3>
                <form onSubmit={handleCreateCargo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Nome do Cargo</label>
                    <input 
                      type="text" 
                      value={newCargo.nome} 
                      onChange={e => setNewCargo(prev => ({ ...prev, nome: e.target.value }))}
                      required 
                      placeholder="Ex: Supervisor de Enfermagem"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Setor</label>
                    <select 
                      value={newCargo.setor} 
                      onChange={e => setNewCargo(prev => ({ ...prev, setor: e.target.value }))}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="Administrativo">Administrativo</option>
                      <option value="Enfermagem">Enfermagem</option>
                      <option value="Medicina Clínica">Medicina Clínica</option>
                      <option value="Psicologia">Psicologia</option>
                      <option value="Farmácia">Farmácia</option>
                      <option value="Gestão">Gestão</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Limite de Vagas (Lotação Máxima)</label>
                      <input 
                        type="number" 
                        value={newCargo.limite_vagas} 
                        onChange={e => setNewCargo(prev => ({ ...prev, limite_vagas: Number(e.target.value) }))}
                        required 
                        min={1} 
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Descrição</label>
                    <textarea 
                      value={newCargo.descricao} 
                      onChange={e => setNewCargo(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Breve descrição das atribuições..."
                      rows={3}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'none' }}
                    />
                  </div>
                  <button type="submit" style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '0.7rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    Salvar Cargo
                  </button>
                </form>

                {/* LISTA DE CARGOS */}
                <h4 style={{ margin: '2rem 0 1rem 0' }}>Cargos Cadastrados ({cargos.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {cargos.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#334155' }}>{c.nome}</span>
                        <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.5rem', color: '#475569' }}>
                          {c.setor}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteCargo(c.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* REPORTES (HIERARQUIA) */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                  <GitMerge size={18} style={{ color: '#10b981' }} /> Vincular Linha de Reporte
                </h3>
                <form onSubmit={handleCreateReporte} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Cargo Subordinado</label>
                    <select 
                      value={newReporte.subordinate_cargo_id} 
                      onChange={e => setNewReporte(prev => ({ ...prev, subordinate_cargo_id: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Selecione...</option>
                      {cargos.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.setor})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ background: '#f1f5f9', padding: '0.4rem', borderRadius: '50%' }}>
                      <ArrowRight size={18} style={{ transform: 'rotate(90deg)', color: '#64748b' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Cargo Superior (Chefia Direta)</label>
                    <select 
                      value={newReporte.superior_cargo_id} 
                      onChange={e => setNewReporte(prev => ({ ...prev, superior_cargo_id: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Selecione...</option>
                      {cargos.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.setor})</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" style={{ width: '100%', background: '#10b981', color: 'white', padding: '0.7rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    Salvar Relação
                  </button>
                </form>

                {/* LISTA DE REPORTES */}
                <h4 style={{ margin: '2rem 0 1rem 0' }}>Subordinações Ativas ({reportes.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {reportes.map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#475569' }}>{r.cargo_subordinado_nome}</span>
                        <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{r.cargo_superior_nome}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteReporte(r.cargo_subordinado_id, r.cargo_superior_id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VINCULAR COLABORADORES */}
          {activeTab === 'colaboradores' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* FORM DE VINCULAÇÃO */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                  <UserPlus size={18} style={{ color: '#3b82f6' }} /> Alocar Colaborador na Vaga
                </h3>
                <form onSubmit={handleCreateOcupacao} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Cargo Alvo</label>
                    <select 
                      value={newOcupacao.cargo_id} 
                      onChange={e => setNewOcupacao(prev => ({ ...prev, cargo_id: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Selecione...</option>
                      {cargos.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.setor})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.8rem' }}>Opção A: Selecionar Usuário Existente</div>
                    <select 
                      value={newOcupacao.usuario_id} 
                      onChange={e => setNewOcupacao(prev => ({ ...prev, usuario_id: e.target.value, nome_novo: '', email_novo: '' }))}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Selecione um usuário...</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.8rem' }}>Opção B: Contratar e Criar Novo Usuário</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <input 
                        type="text" 
                        placeholder="Nome Completo" 
                        value={newOcupacao.nome_novo}
                        onChange={e => setNewOcupacao(prev => ({ ...prev, nome_novo: e.target.value, usuario_id: '' }))}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                      <input 
                        type="email" 
                        placeholder="E-mail Corporativo" 
                        value={newOcupacao.email_novo}
                        onChange={e => setNewOcupacao(prev => ({ ...prev, email_novo: e.target.value, usuario_id: '' }))}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  <button type="submit" style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '0.7rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' }}>
                    Contratar / Vincular Colaborador
                  </button>
                </form>
              </div>

              {/* LISTA DE OCUPAÇÕES */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.15rem' }}>Lotação Ativa de Colaboradores ({ocupacoes.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {ocupacoes.map(oc => {
                    const isTerminated = oc.data_fim && new Date(oc.data_fim) <= new Date();
                    return (
                      <div key={oc.id} style={{ padding: '0.8rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', opacity: isTerminated ? 0.5 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#334155', fontSize: '0.95rem' }}>{oc.usuario_nome}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{oc.usuario_email}</div>
                            <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700, marginTop: '0.4rem' }}>
                              {oc.cargo_nome} ({oc.cargo_setor})
                            </div>
                          </div>
                          {!isTerminated ? (
                            <button 
                              onClick={() => handleTerminateOcupacao(oc.id)}
                              style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              Desligar
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', background: '#cbd5e1', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                              Desligado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUBSTITUTOS TEMPORÁRIOS */}
          {activeTab === 'substitutos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '2rem' }}>
              {/* FORM SUBST */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                  <UserCheck size={18} style={{ color: '#3b82f6' }} /> Programar Substituição
                </h3>
                <form onSubmit={handleCreateSubstituto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Colaborador Titular</label>
                    <select 
                      value={newSubstituto.usuario_titular_id} 
                      onChange={e => setNewSubstituto(prev => ({ ...prev, usuario_titular_id: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Selecione...</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Colaborador Substituto Temporário</label>
                    <select 
                      value={newSubstituto.usuario_substituto_id} 
                      onChange={e => setNewSubstituto(prev => ({ ...prev, usuario_substituto_id: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Selecione...</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Data de Início</label>
                    <input 
                      type="datetime-local" 
                      value={newSubstituto.data_inicio} 
                      onChange={e => setNewSubstituto(prev => ({ ...prev, data_inicio: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>Data de Término</label>
                    <input 
                      type="datetime-local" 
                      value={newSubstituto.data_fim} 
                      onChange={e => setNewSubstituto(prev => ({ ...prev, data_fim: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <button type="submit" style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '0.7rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    Programar Substituição
                  </button>
                </form>
              </div>

              {/* LISTA SUBST */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.15rem' }}>Substituições Temporárias Cadastradas ({substitutos.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {substitutos.map(s => {
                    const isTodayActive = s.status === 'ATIVA';
                    return (
                      <div key={s.id} style={{ padding: '0.8rem', background: '#f8fafc', borderRadius: '10px', border: isTodayActive ? '1.5px solid #22c55e' : '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.9rem' }}>{s.usuario_titular_nome}</span>
                              <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                              <span style={{ fontWeight: 800, color: '#3b82f6', fontSize: '0.9rem' }}>{s.usuario_substituto_nome}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Calendar size={13} />
                              {new Date(s.data_inicio).toLocaleString()} até {new Date(s.data_fim).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: isTodayActive ? '#dcfce7' : s.status === 'INATIVA' ? '#f3f4f6' : '#fef9c3',
                              color: isTodayActive ? '#15803d' : s.status === 'INATIVA' ? '#4b5563' : '#a16207'
                            }}>
                              {s.status}
                            </span>
                            <button 
                              onClick={() => handleDeleteSubstituto(s.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {substitutos.length === 0 && (
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                      Nenhuma substituição programada.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
