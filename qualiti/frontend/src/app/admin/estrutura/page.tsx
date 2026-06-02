'use client';

import React, { useEffect, useState } from 'react';
import { 
  Layers, Plus, Save, X, Edit, Trash2, CheckCircle, Shield, 
  BarChart2, FileText, Menu, Compass, Eye, Filter, CheckSquare,
  Users, RefreshCw, FolderPlus, ArrowRight
} from 'lucide-react';

export default function AdminEstruturaPage() {
  const [activeTab, setActiveTab] = useState<'setores' | 'cargos' | 'tipos_documentais' | 'dashboards' | 'menus'>('setores');
  const [loading, setLoading] = useState(false);

  // Listas Dinâmicas
  const [setores, setSetores] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [tiposDoc, setTiposDoc] = useState<any[]>([]);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);

  // Modais
  const [showModalSetor, setShowModalSetor] = useState(false);
  const [showModalCargo, setShowModalCargo] = useState(false);
  const [showModalTipoDoc, setShowModalTipoDoc] = useState(false);
  const [showModalDash, setShowModalDash] = useState(false);
  const [showModalMenu, setShowModalMenu] = useState(false);

  // Formulários
  const [formSetor, setFormSetor] = useState({ id: null, nome: '', departamento_pai: 'Geral', descricao: '', categorias_customizadas: 'Contratos, Financeiro', ativo: true });
  const [formCargo, setFormCargo] = useState({ id: null, nome: '', setor_nome: 'Administrativo', rbac_role: 'Enfermeiro', permissoes_customizadas: '{"leitura": true, "escrita": false}' });
  const [formTipoDoc, setFormTipoDoc] = useState({ id: null, nome: '', categoria: 'Procedimento', nivel_acesso_padrao: 'Geral' });
  const [formDash, setFormDash] = useState({ id: null, perfil_ou_setor: 'Enfermagem', nome_visao: 'Visão Assistencial Enfermagem', widgets_json: '[{"type":"kpi","title":"LPP"},{"type":"table","title":"Protocolos"}]', is_global: false });
  const [formMenu, setFormMenu] = useState({ id: null, perfil_ou_setor: 'Enfermagem', itens_json: '[{"label":"Dashboard Enfermagem","url":"/","icon":"Hospital"},{"label":"Meus Documentos","url":"/pops","icon":"FileText"}]' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'setores') {
        const res = await fetch('/api/admin/setores');
        if (res.ok) setSetores(await res.json());
      } else if (activeTab === 'cargos') {
        const res = await fetch('/api/admin/cargos');
        if (res.ok) setCargos(await res.json());
      } else if (activeTab === 'tipos_documentais') {
        const res = await fetch('/api/admin/tipos-documentais');
        if (res.ok) setTiposDoc(await res.json());
      } else if (activeTab === 'dashboards') {
        const res = await fetch('/api/admin/dashboards-config');
        if (res.ok) setDashboards(await res.json());
      } else if (activeTab === 'menus') {
        const res = await fetch('/api/admin/menus-config');
        if (res.ok) setMenus(await res.json());
      }
    } catch (err) {
      console.error('Erro ao buscar dados administrativos', err);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // HANDLERS SETORES
  // ==========================================
  async function handleSaveSetor(e: React.FormEvent) {
    e.preventDefault();
    const categoriasArr = formSetor.categorias_customizadas.split(',').map(c => c.trim()).filter(Boolean);
    const body = {
      nome: formSetor.nome,
      departamento_pai: formSetor.departamento_pai,
      descricao: formSetor.descricao,
      categorias_customizadas: categoriasArr,
      ativo: formSetor.ativo
    };

    try {
      let res;
      if (formSetor.id) {
        res = await fetch(`/api/admin/setores/${formSetor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        res = await fetch('/api/admin/setores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      if (res.ok) {
        alert('Setor salvo com sucesso!');
        setShowModalSetor(false);
        fetchData();
      }
    } catch (err) { alert('Erro ao salvar setor'); }
  }

  async function handleDeleteSetor(id: number) {
    if (!confirm('Deseja realmente remover este setor? Todos os relacionamentos serão afetados.')) return;
    try {
      const res = await fetch(`/api/admin/setores/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) { alert('Erro ao remover setor'); }
  }

  // ==========================================
  // HANDLERS CARGOS E PERFIS
  // ==========================================
  async function handleSaveCargo(e: React.FormEvent) {
    e.preventDefault();
    try {
      const permissoesObj = JSON.parse(formCargo.permissoes_customizadas || '{}');
      const res = await fetch('/api/admin/cargos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: formCargo.nome, setor_nome: formCargo.setor_nome, rbac_role: formCargo.rbac_role, permissoes_customizadas: permissoesObj })
      });
      if (res.ok) {
        alert('Cargo salvo com sucesso!');
        setShowModalCargo(false);
        fetchData();
      }
    } catch (err) { alert('Erro ao salvar cargo. Verifique o JSON de permissões.'); }
  }

  // ==========================================
  // HANDLERS TIPOS DOCUMENTAIS
  // ==========================================
  async function handleSaveTipoDoc(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/tipos-documentais', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formTipoDoc)
      });
      if (res.ok) {
        alert('Tipo Documental salvo com sucesso!');
        setShowModalTipoDoc(false);
        fetchData();
      }
    } catch (err) { alert('Erro ao salvar tipo documental'); }
  }

  // ==========================================
  // HANDLERS DASHBOARDS E MENUS
  // ==========================================
  async function handleSaveDash(e: React.FormEvent) {
    e.preventDefault();
    try {
      const widgetsObj = JSON.parse(formDash.widgets_json || '[]');
      const res = await fetch('/api/admin/dashboards-config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil_ou_setor: formDash.perfil_ou_setor, nome_visao: formDash.nome_visao, widgets_json: widgetsObj, is_global: formDash.is_global })
      });
      if (res.ok) {
        alert('Configuração de Dashboard salva com sucesso!');
        setShowModalDash(false);
        fetchData();
      }
    } catch (err) { alert('Erro ao salvar dashboard. Verifique o JSON dos widgets.'); }
  }

  async function handleSaveMenu(e: React.FormEvent) {
    e.preventDefault();
    try {
      const itensObj = JSON.parse(formMenu.itens_json || '[]');
      const res = await fetch('/api/admin/menus-config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil_ou_setor: formMenu.perfil_ou_setor, itens_json: itensObj })
      });
      if (res.ok) {
        alert('Menu dinâmico salvo com sucesso! (Recarregue a página para ver a atualização na barra lateral caso seja o seu perfil).');
        setShowModalMenu(false);
        fetchData();
      }
    } catch (err) { alert('Erro ao salvar menu. Verifique o JSON dos itens.'); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '4rem' }}>
      {/* CABEÇALHO ADMINISTRATIVO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '2.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            <Layers size={44} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 700, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>ADMINISTRATION HUB</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.85rem' }}>Gestão Dinâmica & Multi-Tenant</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Painel de Estrutura Organizacional Dinâmica</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: '0.4rem 0 0 0', maxWidth: '85ch' }}>
              Crie, edite e reorganize setores, departamentos, cargos, tipos documentais, permissões granulares e visões de dashboards sem necessidade de alterar código manualmente.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={fetchData} className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
            <RefreshCw size={18} /> Atualizar Painel
          </button>
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO ADMINISTRATIVA */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'setores', label: '1. Setores & Departamentos', icon: Layers },
          { id: 'cargos', label: '2. Cargos & Perfis (RBAC)', icon: Users },
          { id: 'tipos_documentais', label: '3. Tipos Documentais', icon: FileText },
          { id: 'dashboards', label: '4. Visões de Dashboards', icon: BarChart2 },
          { id: 'menus', label: '5. Menus Dinâmicos', icon: Menu },
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

      {/* ========================================== */}
      {/* ABA 1: SETORES E DEPARTAMENTOS */}
      {/* ========================================== */}
      {activeTab === 'setores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Gestão de Setores & Subdepartamentos</h2>
              <p style={{ color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>Estrutura organizacional viva para segregação completa de documentos e indicadores</p>
            </div>
            <button 
              onClick={() => { setFormSetor({ id: null, nome: '', departamento_pai: 'Diretoria Geral', descricao: '', categorias_customizadas: 'Geral, Qualidade', ativo: true }); setShowModalSetor(true); }} 
              className="btn btn-primary" 
              style={{ padding: '0.8rem 1.5rem', fontWeight: 700 }}
            >
              <Plus size={18} /> Criar Novo Setor Dinâmico
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem' }}>Setores e Departamentos Cadastrados no Banco de Dados</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome do Setor</th>
                    <th>Departamento Pai</th>
                    <th>Descrição</th>
                    <th>Categorias Customizadas</th>
                    <th>Status</th>
                    <th>Ações Administrativas</th>
                  </tr>
                </thead>
                <tbody>
                  {setores.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Nenhum setor cadastrado. Use o botão acima para criar.</td></tr>
                  ) : setores.map((setor) => (
                    <tr key={setor.id}>
                      <td style={{ fontWeight: 700 }}>#{setor.id}</td>
                      <td style={{ fontWeight: 800, color: 'var(--ink)' }}>{setor.nome}</td>
                      <td style={{ fontWeight: 600, color: 'var(--sage)' }}>{setor.departamento_pai || 'Geral'}</td>
                      <td style={{ fontSize: '0.9rem', maxWidth: '300px' }}>{setor.descricao}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {setor.categorias_customizadas?.map((cat: string, i: number) => (
                            <span key={i} className="badge badge-info" style={{ fontSize: '0.75rem' }}>{cat}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${setor.ativo ? 'badge-success' : 'badge-danger'}`}>
                          {setor.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => { setFormSetor({ id: setor.id, nome: setor.nome, departamento_pai: setor.departamento_pai || '', descricao: setor.descricao || '', categorias_customizadas: setor.categorias_customizadas?.join(', ') || '', ativo: setor.ativo }); setShowModalSetor(true); }}
                            className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            <Edit size={14} /> Editar
                          </button>
                          <button onClick={() => handleDeleteSetor(setor.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                            <Trash2 size={14} /> Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 2: CARGOS E PERFIS (RBAC) */}
      {/* ========================================== */}
      {activeTab === 'cargos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Gestão de Cargos & Perfis (RBAC Avançado)</h2>
              <p style={{ color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>Permissões hierárquicas, segregação de acesso e controle granular por cargo</p>
            </div>
            <button onClick={() => { setFormCargo({ id: null, nome: '', setor_nome: 'Enfermagem', rbac_role: 'Enfermeiro', permissoes_customizadas: '{"criar_documento": true, "aprovar_documento": false, "ver_indicadores": true}' }); setShowModalCargo(true); }} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 700 }}>
              <Plus size={18} /> Criar Novo Cargo / Perfil
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem' }}>Matriz de Cargos e Permissões Customizadas</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome do Cargo</th>
                    <th>Setor Vinculado</th>
                    <th>Role RBAC Base</th>
                    <th>Permissões Granulares (JSON)</th>
                    <th>Data de Criação</th>
                  </tr>
                </thead>
                <tbody>
                  {cargos.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>Nenhum cargo customizado cadastrado.</td></tr>
                  ) : cargos.map((cargo) => (
                    <tr key={cargo.id}>
                      <td style={{ fontWeight: 700 }}>#{cargo.id}</td>
                      <td style={{ fontWeight: 800, color: 'var(--ink)' }}>{cargo.nome}</td>
                      <td style={{ fontWeight: 600, color: 'var(--sage)' }}>{cargo.setor_nome}</td>
                      <td><span className="badge" style={{ background: 'var(--ink)', color: 'white' }}>{cargo.rbac_role}</span></td>
                      <td>
                        <pre style={{ margin: 0, background: 'var(--surface)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', maxWidth: '350px', overflowX: 'auto' }}>
                          {JSON.stringify(cargo.permissoes_customizadas)}
                        </pre>
                      </td>
                      <td>{new Date(cargo.data_criacao).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 3: TIPOS DOCUMENTAIS */}
      {/* ========================================== */}
      {activeTab === 'tipos_documentais' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Gestão de Tipos Documentais</h2>
              <p style={{ color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>Classificação de documentos institucionais com níveis de acesso padrão e categorias</p>
            </div>
            <button onClick={() => setShowModalTipoDoc(true)} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 700 }}>
              <Plus size={18} /> Criar Novo Tipo Documental
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem' }}>Tipos Documentais Cadastrados</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome do Tipo Documental</th>
                    <th>Categoria Principal</th>
                    <th>Nível de Acesso Padrão</th>
                    <th>Status</th>
                    <th>Data de Criação</th>
                  </tr>
                </thead>
                <tbody>
                  {tiposDoc.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>Nenhum tipo documental cadastrado.</td></tr>
                  ) : tiposDoc.map((td) => (
                    <tr key={td.id}>
                      <td style={{ fontWeight: 700 }}>#{td.id}</td>
                      <td style={{ fontWeight: 800, color: 'var(--ink)' }}>{td.nome}</td>
                      <td><span className="badge badge-info">{td.categoria}</span></td>
                      <td style={{ fontWeight: 600 }}>{td.nivel_acesso_padrao}</td>
                      <td><span className="badge badge-success">Ativo</span></td>
                      <td>{new Date(td.data_criacao).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 4: VISÕES DE DASHBOARDS */}
      {/* ========================================== */}
      {activeTab === 'dashboards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Configuração de Dashboards Contextuais</h2>
              <p style={{ color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>Defina quais indicadores e widgets aparecem para cada perfil ou setor específico</p>
            </div>
            <button onClick={() => setShowModalDash(true)} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 700 }}>
              <Plus size={18} /> Nova Visão de Dashboard
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem' }}>Visões e Widgets Configurados</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Perfil / Setor Alvo</th>
                    <th>Nome da Visão</th>
                    <th>Widgets Configurados (JSON)</th>
                    <th>Visão Global?</th>
                    <th>Data de Criação</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboards.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>Nenhuma visão de dashboard configurada.</td></tr>
                  ) : dashboards.map((dash) => (
                    <tr key={dash.id}>
                      <td style={{ fontWeight: 700 }}>#{dash.id}</td>
                      <td style={{ fontWeight: 800, color: 'var(--sage)' }}>{dash.perfil_ou_setor}</td>
                      <td style={{ fontWeight: 700, color: 'var(--ink)' }}>{dash.nome_visao}</td>
                      <td>
                        <pre style={{ margin: 0, background: 'var(--surface)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', maxWidth: '350px', overflowX: 'auto' }}>
                          {JSON.stringify(dash.widgets_json)}
                        </pre>
                      </td>
                      <td><span className={`badge ${dash.is_global ? 'badge-success' : 'badge-info'}`}>{dash.is_global ? 'Sim (Global)' : 'Não (Específica)'}</span></td>
                      <td>{new Date(dash.data_criacao).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 5: MENUS DINÂMICOS */}
      {/* ========================================== */}
      {activeTab === 'menus' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Gestão de Menus Dinâmicos</h2>
              <p style={{ color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>Configure os itens de navegação da barra lateral para cada perfil ou setor</p>
            </div>
            <button onClick={() => setShowModalMenu(true)} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 700 }}>
              <Plus size={18} /> Configurar Menu Dinâmico
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem' }}>Menus da Barra Lateral Configurados</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Perfil ou Setor Alvo</th>
                    <th>Itens do Menu (JSON)</th>
                    <th>Data de Atualização</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>Nenhum menu dinâmico configurado.</td></tr>
                  ) : menus.map((menu) => (
                    <tr key={menu.id}>
                      <td style={{ fontWeight: 700 }}>#{menu.id}</td>
                      <td style={{ fontWeight: 800, color: 'var(--ink)' }}>{menu.perfil_ou_setor}</td>
                      <td>
                        <pre style={{ margin: 0, background: 'var(--surface)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', maxWidth: '600px', overflowX: 'auto' }}>
                          {JSON.stringify(menu.itens_json, null, 2)}
                        </pre>
                      </td>
                      <td>{new Date(menu.data_criacao).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: SETOR DINÂMICO */}
      {/* ========================================== */}
      {showModalSetor && (
        <div className="modal-overlay" onClick={() => setShowModalSetor(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="card-title">{formSetor.id ? 'Editar Setor Dinâmico' : 'Criar Novo Setor Dinâmico'}</h3>
              <button onClick={() => setShowModalSetor(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveSetor} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nome do Setor (Ex: Enfermagem, Farmácia, UTI)</label>
                <input type="text" value={formSetor.nome} onChange={e => setFormSetor({...formSetor, nome: e.target.value})} required placeholder="Nome único do setor..." />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Departamento Pai / Diretoria</label>
                <input type="text" value={formSetor.departamento_pai} onChange={e => setFormSetor({...formSetor, departamento_pai: e.target.value})} placeholder="Ex: Diretoria Assistencial..." />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Descrição do Setor</label>
                <textarea value={formSetor.descricao} onChange={e => setFormSetor({...formSetor, descricao: e.target.value})} rows={3} placeholder="Missão e escopo operacional do setor..." />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Categorias Customizadas (Separadas por vírgula)</label>
                <input type="text" value={formSetor.categorias_customizadas} onChange={e => setFormSetor({...formSetor, categorias_customizadas: e.target.value})} placeholder="Ex: Protocolos, Rotinas, Pareceres..." />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem', display: 'block' }}>Essas categorias estarão disponíveis no filtro de Gestão de Documentos deste setor.</span>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formSetor.ativo} onChange={e => setFormSetor({...formSetor, ativo: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                  Setor Ativo no Sistema
                </label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>
                <Save size={18} /> Salvar Setor Dinâmico
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: CARGO / PERFIL */}
      {/* ========================================== */}
      {showModalCargo && (
        <div className="modal-overlay" onClick={() => setShowModalCargo(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="card-title">Criar Novo Cargo / Perfil (RBAC)</h3>
              <button onClick={() => setShowModalCargo(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveCargo} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nome do Cargo (Ex: Enfermeiro Chefe, Farmacêutico RT)</label>
                <input type="text" value={formCargo.nome} onChange={e => setFormCargo({...formCargo, nome: e.target.value})} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Setor Vinculado</label>
                  <input type="text" value={formCargo.setor_nome} onChange={e => setFormCargo({...formCargo, setor_nome: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Role RBAC Base</label>
                  <input type="text" value={formCargo.rbac_role} onChange={e => setFormCargo({...formCargo, rbac_role: e.target.value})} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Permissões Granulares (Formato JSON)</label>
                <textarea value={formCargo.permissoes_customizadas} onChange={e => setFormCargo({...formCargo, permissoes_customizadas: e.target.value})} rows={4} placeholder='{"criar_documento": true, "aprovar_documento": false}' required style={{ fontFamily: 'monospace' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>
                <Save size={18} /> Salvar Cargo / Perfil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: TIPO DOCUMENTAL */}
      {/* ========================================== */}
      {showModalTipoDoc && (
        <div className="modal-overlay" onClick={() => setShowModalTipoDoc(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="card-title">Criar Novo Tipo Documental</h3>
              <button onClick={() => setShowModalTipoDoc(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveTipoDoc} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nome do Tipo (Ex: Protocolo Clínico, Regimento Interno)</label>
                <input type="text" value={formTipoDoc.nome} onChange={e => setFormTipoDoc({...formTipoDoc, nome: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Categoria Principal</label>
                <input type="text" value={formTipoDoc.categoria} onChange={e => setFormTipoDoc({...formTipoDoc, categoria: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nível de Acesso Padrão</label>
                <input type="text" value={formTipoDoc.nivel_acesso_padrao} onChange={e => setFormTipoDoc({...formTipoDoc, nivel_acesso_padrao: e.target.value})} required placeholder="Ex: Geral, Gestão, Médicos..." />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>
                <Save size={18} /> Salvar Tipo Documental
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: DASHBOARD CONFIG */}
      {/* ========================================== */}
      {showModalDash && (
        <div className="modal-overlay" onClick={() => setShowModalDash(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="card-title">Configurar Visão de Dashboard</h3>
              <button onClick={() => setShowModalDash(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveDash} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Perfil ou Setor Alvo (Ex: Enfermagem, Admin, Gestão)</label>
                <input type="text" value={formDash.perfil_ou_setor} onChange={e => setFormDash({...formDash, perfil_ou_setor: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nome da Visão</label>
                <input type="text" value={formDash.nome_visao} onChange={e => setFormDash({...formDash, nome_visao: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Widgets Configurados (JSON Array)</label>
                <textarea value={formDash.widgets_json} onChange={e => setFormDash({...formDash, widgets_json: e.target.value})} rows={4} required style={{ fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formDash.is_global} onChange={e => setFormDash({...formDash, is_global: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                  Visão Global (Aparece para todos)
                </label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>
                <Save size={18} /> Salvar Visão de Dashboard
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 5: MENU CONFIG */}
      {/* ========================================== */}
      {showModalMenu && (
        <div className="modal-overlay" onClick={() => setShowModalMenu(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="card-title">Configurar Menu Dinâmico</h3>
              <button onClick={() => setShowModalMenu(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveMenu} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Perfil ou Setor Alvo (Ex: Enfermagem, Farmácia, Admin)</label>
                <input type="text" value={formMenu.perfil_ou_setor} onChange={e => setFormMenu({...formMenu, perfil_ou_setor: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Itens do Menu (JSON Array com label, url e icon)</label>
                <textarea value={formMenu.itens_json} onChange={e => setFormMenu({...formMenu, itens_json: e.target.value})} rows={6} required style={{ fontFamily: 'monospace' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.4rem', display: 'block' }}>
                  Exemplo: <br/>
                  <code>[&#123;"label": "Dashboard", "url": "/", "icon": "Hospital"&#125;, &#123;"label": "Documentos", "url": "/pops", "icon": "FileText"&#125;]</code>
                </span>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>
                <Save size={18} /> Salvar Menu Dinâmico
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
