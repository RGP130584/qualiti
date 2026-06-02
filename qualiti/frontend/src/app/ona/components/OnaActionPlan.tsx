'use client';

import React, { useState } from 'react';
import { Target, Plus, Calendar, User, CheckCircle2 } from 'lucide-react';
import { useOnaStore } from '../store/ona.store';
import { useOna } from '../hooks/useOna';
import { ActionPlan } from '../types/ona.types';

export function OnaActionPlan() {
  const { actionPlans, addNewActionPlan } = useOnaStore();
  const { currentUser } = useOna();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titulo: '', descricao: '', responsavel: '', prazo: '', prioridade: 'Média' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const success = await addNewActionPlan({
      titulo: form.titulo,
      descricao: form.descricao,
      responsavel: form.responsavel,
      prazo: form.prazo,
      prioridade: form.prioridade as any,
      status: 'Não Iniciado'
    });
    if (success) {
      setShowModal(false);
      setForm({ titulo: '', descricao: '', responsavel: '', prazo: '', prioridade: 'Média' });
    }
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={20} style={{ color: 'var(--sage)' }} /> Planos de Ação Corretiva e Preventiva (CAPA)
        </h3>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>
          <Plus size={16} /> Novo Plano de Ação
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título da Ação CAPA</th>
              <th>Setor</th>
              <th>Responsável</th>
              <th>Prazo Limite</th>
              <th>Prioridade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {actionPlans.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Nenhum plano de ação corretiva registrado para o seu setor.</td></tr>
            ) : actionPlans.map((plan: ActionPlan) => (
              <tr key={plan.id}>
                <td style={{ fontWeight: 700, color: 'var(--muted)' }}>#{plan.id}</td>
                <td>
                  <strong style={{ display: 'block', color: 'var(--ink)' }}>{plan.titulo}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{plan.descricao}</span>
                </td>
                <td><span className="badge badge-info">{plan.setor}</span></td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>
                    <User size={14} style={{ color: 'var(--muted)' }} /> {plan.responsavel}
                  </span>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                    <Calendar size={14} /> {new Date(plan.prazo).toLocaleDateString()}
                  </span>
                </td>
                <td>
                  <span className={`badge ${plan.prioridade === 'Crítica' ? 'badge-danger' : plan.prioridade === 'Alta' ? 'badge-warning' : 'badge-secondary'}`}>
                    {plan.prioridade}
                  </span>
                </td>
                <td>
                  <span className={`badge ${plan.status === 'Concluído' ? 'badge-success' : plan.status === 'Em Andamento' ? 'badge-warning' : 'badge-secondary'}`}>
                    {plan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE NOVO PLANO DE AÇÃO CAPA */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="card-title">Criar Plano de Ação (CAPA)</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}>X</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Setor Alvo</label>
                <input type="text" value={currentUser.departamento} disabled className="input" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Título da Ação</label>
                <input type="text" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} required placeholder="Ex: Revisão do Protocolo de LPP..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Descrição Detalhada</label>
                <textarea value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} rows={3} required placeholder="Descreva a causa raiz e as ações mitigatórias..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Responsável pela Execução</label>
                <input type="text" value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} required placeholder="Ex: Enf. Maria Souza..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Prazo Limite</label>
                  <input type="date" value={form.prazo} onChange={e => setForm({...form, prazo: e.target.value})} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Prioridade</label>
                  <select value={form.prioridade} onChange={e => setForm({...form, prioridade: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}>
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>
                {submitting ? 'Registrando...' : 'Confirmar Plano de Ação'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
