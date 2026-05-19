'use client';

import React, { useState } from 'react';
import { ShieldCheck, Plus, Calendar, Award } from 'lucide-react';
import { useAudit } from '../hooks/useAudit';
import { useOna } from '../hooks/useOna';
import { Audit } from '../types/ona.types';

export function OnaAuditPanel() {
  const { audits, scheduleNewAudit } = useAudit();
  const { currentUser, isGlobalView } = useOna();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ auditor: '', dataAuditoria: '', nivelAcreditacao: 'Nível 1 - Acreditado' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const success = await scheduleNewAudit({ 
      auditor: form.auditor, 
      dataAuditoria: form.dataAuditoria, 
      nivelAcreditacao: form.nivelAcreditacao as any,
      pontuacao: 0,
      status: 'Agendada'
    });
    if (success) {
      setShowModal(false);
      setForm({ auditor: '', dataAuditoria: '', nivelAcreditacao: 'Nível 1 - Acreditado' });
    }
    setSubmitting(false);
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} style={{ color: 'var(--sage)' }} /> Painel de Auditorias de Internação ONA
        </h3>
        {isGlobalView && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>
            <Plus size={16} /> Agendar Auditoria
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Setor Auditado</th>
              <th>Auditor Responsável</th>
              <th>Data Agendada</th>
              <th>Nível Alvo</th>
              <th>Pontuação</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {audits.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Nenhuma auditoria agendada ou registrada para o seu setor.</td></tr>
            ) : audits.map((aud: Audit) => (
              <tr key={aud.id}>
                <td style={{ fontWeight: 700, color: 'var(--muted)' }}>#{aud.id}</td>
                <td><span className="badge badge-info">{aud.setor}</span></td>
                <td style={{ fontWeight: 700, color: 'var(--ink)' }}>{aud.auditor}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                    <Calendar size={14} /> {new Date(aud.dataAuditoria).toLocaleDateString()}
                  </span>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: 'var(--sage)', fontSize: '0.9rem' }}>
                    <Award size={14} /> {aud.nivelAcreditacao}
                  </span>
                </td>
                <td style={{ fontWeight: 800 }}>{aud.pontuacao > 0 ? `${aud.pontuacao} pts` : '-'}</td>
                <td>
                  <span className={`badge ${aud.status === 'Concluída' ? 'badge-success' : aud.status === 'Em Andamento' ? 'badge-warning' : 'badge-secondary'}`}>
                    {aud.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE AGENDAMENTO DE AUDITORIA */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="card-title">Agendar Nova Auditoria ONA</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '0.3rem' }}>X</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Setor Alvo</label>
                <input type="text" value={currentUser.departamento} disabled className="input" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nome do Auditor</label>
                <input type="text" value={form.auditor} onChange={e => setForm({...form, auditor: e.target.value})} required placeholder="Ex: Dra. Ana Lima..." style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Data da Auditoria</label>
                <input type="date" value={form.dataAuditoria} onChange={e => setForm({...form, dataAuditoria: e.target.value})} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nível de Acreditação Alvo</label>
                <select value={form.nivelAcreditacao} onChange={e => setForm({...form, nivelAcreditacao: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'white' }}>
                  <option value="Nível 1 - Acreditado">Nível 1 - Acreditado (Segurança do Paciente)</option>
                  <option value="Nível 2 - Acreditado Pleno">Nível 2 - Acreditado Pleno (Gestão Integrada)</option>
                  <option value="Nível 3 - Acreditado com Excelência">Nível 3 - Acreditado com Excelência (Excelência em Gestão)</option>
                </select>
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '0.8rem', justifyContent: 'center', fontWeight: 700 }}>
                {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
