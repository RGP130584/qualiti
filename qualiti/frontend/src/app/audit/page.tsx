'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, Search, Filter, Plus, 
  Clock, CheckCircle, Save, X 
} from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEntidade, setFiltroEntidade] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Form state para registro manual de log externo/auditoria
  const [novoLog, setNovoLog] = useState({
    usuario: 'auditor.externo@qualitaos.com',
    acao: 'AUDIT_EXTERNAL_INSPECTION',
    entidade: 'ONA_COMPLIANCE',
    entidade_id: 'ONA-2026'
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch('/api/audit/logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Erro ao buscar logs de auditoria:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveLog(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/audit/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoLog)
      });

      if (res.ok) {
        await fetchLogs();
        setIsCreating(false);
        setNovoLog({ usuario: 'auditor.externo@qualitaos.com', acao: 'AUDIT_EXTERNAL_INSPECTION', entidade: 'ONA_COMPLIANCE', entidade_id: 'ONA-2026' });
      }
    } catch (err) {
      alert('Erro de conexão ao registrar log');
    }
  }

  const logsFiltrados = logs.filter(log => {
    const matchEntidade = filtroEntidade ? log.entidade.toLowerCase().includes(filtroEntidade.toLowerCase()) : true;
    const matchUsuario = filtroUsuario ? log.usuario.toLowerCase().includes(filtroUsuario.toLowerCase()) : true;
    return matchEntidade && matchUsuario;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck className="text-sage" style={{ color: 'var(--sage)' }} /> Auditoria e Conformidade LGPD
          </h1>
          <p style={{ color: 'var(--muted)' }}>Trilha de auditoria imutável (Event Sourcing) para acessos, modificações e relatórios de conformidade</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="btn btn-primary">
          <Plus size={18} /> Registrar Evento Externo
        </button>
      </div>

      {/* FORM DE REGISTRO MANUAL/EXTERNO */}
      {isCreating && (
        <div className="card" style={{ borderTop: '4px solid var(--sage)' }}>
          <div className="card-header">
            <h2 className="card-title">Registrar Evento de Auditoria Externa</h2>
            <button onClick={() => setIsCreating(false)} className="btn btn-secondary"><X size={18} /></button>
          </div>

          <form onSubmit={handleSaveLog} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Identificação do Auditor / Usuário</label>
                <input type="text" value={novoLog.usuario} onChange={e => setNovoLog({...novoLog, usuario: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Código da Ação (Acontecimento)</label>
                <input type="text" value={novoLog.acao} onChange={e => setNovoLog({...novoLog, acao: e.target.value})} placeholder="ex: AUDIT_INSPECTION" required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Módulo / Entidade Inspecionada</label>
                <input type="text" value={novoLog.entidade} onChange={e => setNovoLog({...novoLog, entidade: e.target.value})} placeholder="ex: ONA / POPs / USERS" required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>ID do Registro / Referência</label>
                <input type="text" value={novoLog.entidade_id} onChange={e => setNovoLog({...novoLog, entidade_id: e.target.value})} placeholder="ex: ONA-1.1" required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => setIsCreating(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary"><Save size={18} /> Registrar Log Imutável</button>
            </div>
          </form>
        </div>
      )}

      {/* BARRA DE FILTROS */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, color: 'var(--muted)' }}>
          <Filter size={18} /> Filtrar Trilha de Auditoria:
        </div>
        <div style={{ flexGrow: 1, minWidth: '220px' }}>
          <input 
            type="text" 
            value={filtroUsuario} 
            onChange={e => setFiltroUsuario(e.target.value)} 
            placeholder="Filtrar por usuário ou IP..." 
          />
        </div>
        <div style={{ flexGrow: 1, minWidth: '220px' }}>
          <input 
            type="text" 
            value={filtroEntidade} 
            onChange={e => setFiltroEntidade(e.target.value)} 
            placeholder="Filtrar por módulo (ex: POPs, AUTH, BPM)..." 
          />
        </div>
        {(filtroUsuario || filtroEntidade) && (
          <button onClick={() => { setFiltroUsuario(''); setFiltroEntidade(''); }} className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }}>
            Limpar Filtros
          </button>
        )}
      </div>

      {/* TABELA DE LOGS IMUTÁVEIS */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data e Hora</th>
              <th>Usuário / Responsável</th>
              <th>Ação Realizada</th>
              <th>Módulo / Entidade</th>
              <th>Referência (ID)</th>
              <th>Endereço IP</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Carregando trilha de auditoria...</td></tr>
            ) : logsFiltrados.map(log => (
              <tr key={log.id} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <td style={{ fontWeight: 700 }}>#{log.id}</td>
                <td>{new Date(log.data_hora).toLocaleString()}</td>
                <td style={{ fontWeight: 600, fontFamily: 'var(--font-inter)' }}>{log.usuario}</td>
                <td>
                  <span className={`badge ${log.acao.includes('DELETE') ? 'badge-danger' : log.acao.includes('CREATE') ? 'badge-success' : log.acao.includes('LOGIN') ? 'badge-info' : 'badge-warning'}`}>
                    {log.acao}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-inter)' }}>{log.entidade}</td>
                <td>{log.entidade_id || '-'}</td>
                <td style={{ color: 'var(--muted)' }}>{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
