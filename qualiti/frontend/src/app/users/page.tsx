'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, Plus, Edit, Trash2, Shield, 
  CheckCircle, XCircle, X, Save, Award, UserCheck
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [funcoes, setFuncoes] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state do Usuário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    rbac_role: 'Coordenador / RT (Responsável Técnico)',
    departamento: 'Enfermagem',
    unidade: 'Unidade Central',
    mfa_enabled: false
  });

  // Form state da nova Função
  const [funcaoData, setFuncaoData] = useState({
    nome: '',
    is_rt: false,
    descricao: ''
  });
  const [isCreatingFuncao, setIsCreatingFuncao] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchFuncoes();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/v2/core-admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFuncoes() {
    try {
      const res = await fetch('/api/v2/core-admin/funcoes');
      if (res.ok) {
        const data = await res.json();
        setFuncoes(Array.isArray(data) ? data : []);
      } else {
        setFuncoes([]);
      }
    } catch (err) {
      console.error('Erro ao buscar funções:', err);
      setFuncoes([]);
    }
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = isCreating ? '/api/v2/core-admin/users' : `/api/v2/core-admin/users/${selectedUser.id}`;
      const method = isCreating ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('qualita_token')}` },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchUsers();
        setIsCreating(false);
        setIsEditing(false);
        setSelectedUser(null);
      } else {
        alert('Erro ao salvar usuário. O email pode já estar cadastrado.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar usuário');
    }
  }

  async function handleDeleteUser(id: number, email: string) {
    if (email === 'admin@qualitaos.com') {
      alert('Não é permitido remover o Administrador Geral do sistema.');
      return;
    }
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    try {
      const res = await fetch(`/api/v2/core-admin/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('qualita_token')}` } });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (err) {
      alert('Erro ao remover usuário');
    }
  }

  async function handleSaveFuncao(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/v2/core-admin/funcoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('qualita_token')}` },
        body: JSON.stringify(funcaoData)
      });
      if (res.ok) {
        await fetchFuncoes();
        setFuncaoData({ nome: '', is_rt: false, descricao: '' });
        setIsCreatingFuncao(false);
      } else {
        alert('Erro ao cadastrar função. O nome pode já existir.');
      }
    } catch (err) {
      alert('Erro de conexão ao cadastrar função');
    }
  }

  async function handleDeleteFuncao(id: number) {
    if (!confirm('Tem certeza que deseja remover este cargo/função do menu editável?')) return;
    try {
      const res = await fetch(`/api/v2/core-admin/funcoes/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('qualita_token')}` } });
      if (res.ok) {
        await fetchFuncoes();
      }
    } catch (err) {
      alert('Erro ao remover função');
    }
  }

  function startCreate() {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedUser(null);
    setFormData({
      nome: '',
      email: '',
      senha: 'senha_padrao_123',
      rbac_role: 'Coordenador / RT (Responsável Técnico)',
      departamento: 'Enfermagem',
      unidade: 'Unidade Central',
      mfa_enabled: false
    });
  }

  function startEdit(user: any) {
    setIsEditing(true);
    setIsCreating(false);
    setSelectedUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '', // Não atualiza senha no modo de edição simples
      rbac_role: user.rbac_role,
      departamento: user.departamento,
      unidade: user.unidade,
      mfa_enabled: user.mfa_enabled
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* HEADER DE USUÁRIOS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Usuários, Setores e Funções (RT)</h1>
          <p style={{ color: 'var(--muted)' }}>Organize a equipe por Setores/Especialidades, defina os Coordenadores / Responsáveis Técnicos (RT) e edite os cargos disponíveis.</p>
        </div>
        <button onClick={startCreate} className="btn btn-primary">
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      {/* FORMULÁRIO DE USUÁRIO */}
      {(isCreating || isEditing) && (
        <div className="card" style={{ borderTop: '4px solid var(--sage)' }}>
          <div className="card-header">
            <h2 className="card-title">{isCreating ? 'Cadastrar Novo Usuário / RT' : `Editar Usuário: ${selectedUser.nome}`}</h2>
            <button onClick={() => { setIsCreating(false); setIsEditing(false); }} className="btn btn-secondary"><X size={18} /></button>
          </div>

          <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nome Completo</label>
                <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Email Profissional</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isEditing} required />
              </div>

              {isCreating && (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Senha Temporária</label>
                  <input type="text" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} required />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Função / Cargo Institucional (RT / RBAC)</label>
                <select value={formData.rbac_role} onChange={e => setFormData({...formData, rbac_role: e.target.value})}>
                  <option value="Admin">Admin</option>
                  <option value="Gestor da Qualidade">Gestor da Qualidade</option>
                  {funcoes.map((f: any) => (
                    <option key={f.id} value={f.nome}>
                      {f.nome} {f.is_rt ? '👑 [RT Oficial]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Setor / Especialidade</label>
                <select value={formData.departamento} onChange={e => setFormData({...formData, departamento: e.target.value})}>
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
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Unidade Hospitalar</label>
                <input type="text" value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})} required />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1.8rem' }}>
                <input 
                  type="checkbox" 
                  checked={formData.mfa_enabled} 
                  onChange={e => setFormData({...formData, mfa_enabled: e.target.checked})} 
                  id="mfa_check"
                  style={{ width: 'auto' }}
                />
                <label htmlFor="mfa_check" style={{ fontWeight: 600, cursor: 'pointer' }}>Exigir MFA (TOTP / Autenticador)</label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => { setIsCreating(false); setIsEditing(false); }} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary"><Save size={18} /> Salvar Usuário</button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE USUÁRIOS */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome Completo</th>
              <th>Email</th>
              <th>Função / Cargo (RT)</th>
              <th>Setor / Especialidade</th>
              <th>Unidade</th>
              <th>MFA</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Carregando usuários...</td></tr>
            ) : users.map(u => {
              const isRT = u.rbac_role.includes('RT') || u.rbac_role.includes('Responsável Técnico');
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${isRT ? 'badge-danger' : u.rbac_role === 'Admin' ? 'badge-info' : 'badge-success'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      {isRT && <Award size={14} />} {u.rbac_role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--sage)' }}>{u.departamento}</td>
                  <td>{u.unidade}</td>
                  <td>
                    {u.mfa_enabled ? (
                      <span style={{ color: 'var(--sage)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                        <CheckCircle size={16} /> Ativo
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <XCircle size={16} /> Inativo
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => startEdit(u)} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} title="Editar">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id, u.email)} className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }} title="Remover">
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

      {/* MENU EDITÁVEL DE FUNÇÕES E CARGOS INSTITUCIONAIS */}
      <div className="card" style={{ borderTop: '4px solid var(--amber)', marginTop: '2rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={22} style={{ color: 'var(--amber)' }} /> Menu / Cadastro Editável de Funções e Cargos
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Adicione ou remova cargos e defina quais funções possuem atribuição de Responsável Técnico (RT) perante a ONA e conselhos.</p>
          </div>
          {!isCreatingFuncao && (
            <button onClick={() => setIsCreatingFuncao(true)} className="btn btn-primary" style={{ backgroundColor: 'var(--amber)' }}>
              <Plus size={18} /> Cadastrar Nova Função
            </button>
          )}
        </div>

        {isCreatingFuncao && (
          <form onSubmit={handleSaveFuncao} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Nova Função Institucional</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nome da Função / Cargo</label>
                <input 
                  type="text" 
                  value={funcaoData.nome} 
                  onChange={e => setFuncaoData({...funcaoData, nome: e.target.value})} 
                  placeholder="Ex: Farmacêutico RT, Enfermeiro Chefe" 
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Descrição / Atribuição</label>
                <input 
                  type="text" 
                  value={funcaoData.descricao} 
                  onChange={e => setFuncaoData({...funcaoData, descricao: e.target.value})} 
                  placeholder="Ex: Responsável técnico pela farmácia" 
                  required 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1.8rem' }}>
                <input 
                  type="checkbox" 
                  checked={funcaoData.is_rt} 
                  onChange={e => setFuncaoData({...funcaoData, is_rt: e.target.checked})} 
                  id="rt_check"
                  style={{ width: 'auto' }}
                />
                <label htmlFor="rt_check" style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--red)' }}>👑 É Coordenador / Responsável Técnico (RT)?</label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => setIsCreatingFuncao(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--amber)' }}><Save size={18} /> Salvar Cargo</button>
            </div>
          </form>
        )}

        <div className="table-container" style={{ marginTop: '1.5rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do Cargo / Função</th>
                <th>Atribuição de RT?</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcoes.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 700 }}>#{f.id}</td>
                  <td style={{ fontWeight: 600, color: f.is_rt ? 'var(--red)' : 'var(--ink)' }}>
                    {f.nome}
                  </td>
                  <td>
                    {f.is_rt ? (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Award size={14} /> Sim (RT Oficial)
                      </span>
                    ) : (
                      <span className="badge badge-secondary">Não</span>
                    )}
                  </td>
                  <td>{f.descricao}</td>
                  <td>
                    <button onClick={() => handleDeleteFuncao(f.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }} title="Remover">
                      <Trash2 size={14} />
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
