'use client';

import React from 'react';
import { Award, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useChecklist } from '../hooks/useChecklist';
import { useIndicators } from '../hooks/useIndicators';
import { useEvidence } from '../hooks/useEvidence';
import { useAudit } from '../hooks/useAudit';

export function OnaStatusCards() {
  const { conformityPercentage, totalItems } = useChecklist();
  const { totalIndicators, conformingIndicators } = useIndicators();
  const { totalEvidences, pendingEvidences } = useEvidence();
  const { activeAudits } = useAudit();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
      {/* CARD 1: CONFORMIDADE ONA */}
      <div style={{ padding: '1.5rem', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', color: '#0284c7' }}>
          <Award size={32} />
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>Conformidade do Submódulo</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
            <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)' }}>{conformityPercentage}%</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>({totalItems} itens)</span>
          </div>
        </div>
      </div>

      {/* CARD 2: INDICADORES DE INTERNAÇÃO */}
      <div style={{ padding: '1.5rem', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', color: '#16a34a' }}>
          <CheckCircle size={32} />
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>KPIs Conformes</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
            <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)' }}>{conformingIndicators}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>de {totalIndicators}</span>
          </div>
        </div>
      </div>

      {/* CARD 3: EVIDÊNCIAS PENDENTES */}
      <div style={{ padding: '1.5rem', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1rem', background: pendingEvidences > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', color: pendingEvidences > 0 ? '#d97706' : '#16a34a' }}>
          <AlertTriangle size={32} />
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>Evidências Pendentes</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
            <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)' }}>{pendingEvidences}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>de {totalEvidences} anexos</span>
          </div>
        </div>
      </div>

      {/* CARD 4: AUDITORIAS ATIVAS */}
      <div style={{ padding: '1.5rem', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#4f46e5' }}>
          <ShieldCheck size={32} />
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>Auditorias em Andamento</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
            <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)' }}>{activeAudits}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>ciclos ONA ativos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
