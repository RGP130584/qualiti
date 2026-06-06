'use client';

import React from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useIndicators } from '../hooks/useIndicators';

export function OnaIndicators() {
  const { indicators, loading } = useIndicators();

  if (loading && indicators.length === 0) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
        Carregando indicadores operacionais de internação...
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
        Nenhum indicador de internação cadastrado ou visível para o seu setor.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
        <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} style={{ color: 'var(--sage)' }} /> Indicadores Operacionais de Internação (KPIs)
        </h3>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título do Indicador</th>
              <th>Setor Responsável</th>
              <th>Valor Atual</th>
              <th>Meta ONA</th>
              <th>Status</th>
              <th>Tendência</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map(ind => (
              <tr key={ind.id}>
                <td style={{ fontWeight: 700, color: 'var(--muted)' }}>#{ind.id}</td>
                <td style={{ fontWeight: 700, color: 'var(--ink)' }}>{ind.titulo}</td>
                <td><span className="badge badge-info">{ind.setor}</span></td>
                <td style={{ fontWeight: 800 }}>{ind.valorAtual} {ind.unidade}</td>
                <td style={{ fontWeight: 600, color: 'var(--muted)' }}>{ind.meta} {ind.unidade}</td>
                <td>
                  <span className={`badge ${ind.status === 'Conforme' ? 'badge-success' : ind.status === 'Alerta' ? 'badge-warning' : 'badge-danger'}`}>
                    {ind.status}
                  </span>
                </td>
                <td>
                  {ind.tendencia === 'up' ? (
                    <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                      <ArrowUpRight size={16} /> Subindo
                    </span>
                  ) : ind.tendencia === 'down' ? (
                    <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                      <ArrowDownRight size={16} /> Caindo
                    </span>
                  ) : (
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                      <Minus size={16} /> Estável
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
