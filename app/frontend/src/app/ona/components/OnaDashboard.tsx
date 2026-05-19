'use client';

import React, { useState } from 'react';
import { Layers, CheckSquare, UploadCloud, Target, ShieldCheck, Activity } from 'lucide-react';
import { useOna } from '../hooks/useOna';
import { OnaFilters } from './OnaFilters';
import { OnaStatusCards } from './OnaStatusCards';
import { OnaIndicators } from './OnaIndicators';
import { OnaChecklist } from './OnaChecklist';
import { OnaEvidenceUpload } from './OnaEvidenceUpload';
import { OnaAuditPanel } from './OnaAuditPanel';
import { OnaActionPlan } from './OnaActionPlan';

export function OnaDashboard() {
  const { selectedSubmodulo, setSelectedSubmodulo, currentUser } = useOna();
  const [activeTab, setActiveTab] = useState<'checklist' | 'evidencias' | 'capa' | 'auditorias'>('checklist');

  // Submódulos ONA Padrão
  const submodulos = [
    { id: 1, label: '1. Liderança e Governança' },
    { id: 2, label: '2. Segurança do Paciente' },
    { id: 3, label: '3. Gestão Assistencial' },
    { id: 4, label: '4. Suporte Diagnóstico e Terapêutico' },
    { id: 5, label: '5. Gestão de Suprimentos e Logística' },
    { id: 6, label: '6. Gestão de Pessoas e Cultura' },
    { id: 7, label: '7. Gestão da Informação e Tecnologia' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '4rem' }}>
      {/* CABEÇALHO DO MÓDULO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '2.5rem', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
            <Layers size={44} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 700, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>ONA ACREDITATION HUB</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.85rem' }}>Manual Brasileiro de Acreditação</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Gestão de Acreditação de Internação (ONA)</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: '0.4rem 0 0 0', maxWidth: '85ch' }}>
              Plataforma contínua de avaliação de conformidade, upload de evidências e planos CAPA com segregação de acesso operacional.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem 1.2rem', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            Unidade: <strong>Matriz de Internação</strong>
          </span>
        </div>
      </div>

      {/* FILTROS CONTEXTUAIS */}
      <OnaFilters />

      {/* CARDS DE STATUS CONSOLIDADOS */}
      <OnaStatusCards />

      {/* INDICADORES OPERACIONAIS DO SETOR */}
      <OnaIndicators />

      {/* SELETOR DE SUBMÓDULOS ONA */}
      <div className="card" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>Selecione o Submódulo ONA de Avaliação:</h3>
        <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {submodulos.map(sub => {
            const isActive = selectedSubmodulo === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubmodulo(sub.id)}
                style={{
                  padding: '0.8rem 1.4rem',
                  borderRadius: '8px',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.9rem',
                  background: isActive ? 'var(--ink)' : 'var(--surface)',
                  color: isActive ? 'white' : 'var(--muted)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO OPERACIONAL */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'checklist', label: '1. Checklist Operacional ONA', icon: CheckSquare },
          { id: 'evidencias', label: '2. Evidências Comprobatórias', icon: UploadCloud },
          { id: 'capa', label: '3. Planos de Ação (CAPA)', icon: Target },
          { id: 'auditorias', label: '4. Ciclos de Auditoria', icon: ShieldCheck },
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

      {/* CONTEÚDO DA ABA ATIVA */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 'checklist' && <OnaChecklist />}
        {activeTab === 'evidencias' && <OnaEvidenceUpload />}
        {activeTab === 'capa' && <OnaActionPlan />}
        {activeTab === 'auditorias' && <OnaAuditPanel />}
      </div>
    </div>
  );
}
