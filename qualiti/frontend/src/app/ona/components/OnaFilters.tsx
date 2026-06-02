'use client';

import React from 'react';
import { Filter, RefreshCw, Shield, User } from 'lucide-react';
import { useOna } from '../hooks/useOna';

export function OnaFilters() {
  const { 
    currentUser, setCurrentUser, sectors, selectedSector, setSelectedSector, 
    refreshContextData, refreshing, isGlobalView 
  } = useOna();

  return (
    <div style={{ 
      padding: '1.2rem 1.8rem', 
      background: 'var(--paper)', 
      border: '1px solid var(--border)', 
      borderRadius: '12px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      flexWrap: 'wrap', 
      gap: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      {/* IDENTIFICAÇÃO DO USUÁRIO E SETOR ATIVO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.8rem', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <Shield size={24} style={{ color: 'var(--sage)' }} />
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--muted)', display: 'block' }}>
            Operador Ativo · Nível de Acesso
          </span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--ink)' }}>
            {currentUser.nome} ({currentUser.role} · <span style={{ color: 'var(--sage)' }}>{currentUser.departamento}</span>)
          </strong>
        </div>
      </div>

      {/* CONTROLES DE SIMULAÇÃO E FILTRAGEM */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* SELETOR DE SIMULAÇÃO DE PERFIL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <User size={16} style={{ color: 'var(--muted)' }} />
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>Simular Perfil:</label>
          <select 
            value={currentUser.email} 
            onChange={e => {
              const val = e.target.value;
              if (val === 'maria') setCurrentUser({ nome: 'Enf. Maria Souza', role: 'Enfermeiro', departamento: 'Enfermagem', email: 'maria.souza@qualitaos.com', isGlobalAdmin: false });
              if (val === 'carlos') setCurrentUser({ nome: 'Dr. Carlos Mendes', role: 'Médico', departamento: 'Psiquiatria', email: 'carlos.mendes@qualitaos.com', isGlobalAdmin: false });
              if (val === 'rt') setCurrentUser({ nome: 'Dr. Roberto Rocha', role: 'Farmacêutico RT', departamento: 'Farmácia', email: 'roberto.rt@qualitaos.com', isGlobalAdmin: false });
              if (val === 'ana') setCurrentUser({ nome: 'Auditora Ana Lima', role: 'Auditor ONA', departamento: 'Qualidade e ONA', email: 'ana.lima@qualitaos.com', isGlobalAdmin: true });
              if (val === 'admin') setCurrentUser({ nome: 'Administrador Geral', role: 'Admin', departamento: 'Diretoria', email: 'admin@qualitaos.com', isGlobalAdmin: true });
            }}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, background: 'white', fontSize: '0.9rem' }}
          >
            <option value="maria">Enfermeiro (Enfermagem)</option>
            <option value="carlos">Médico (Psiquiatria)</option>
            <option value="rt">Farmacêutico RT (Farmácia)</option>
            <option value="ana">Auditor ONA (Global)</option>
            <option value="admin">Administrador Geral (Global)</option>
          </select>
        </div>

        {/* FILTRO DE SETORES (APENAS PARA ADMIN/AUDITOR) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Filter size={16} style={{ color: 'var(--muted)' }} />
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>Filtro de Setor:</label>
          <select 
            value={selectedSector} 
            onChange={e => setSelectedSector(e.target.value)} 
            disabled={!isGlobalView}
            style={{ 
              padding: '0.4rem 0.8rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border)', 
              fontWeight: 600, 
              background: isGlobalView ? 'white' : 'var(--surface)', 
              fontSize: '0.9rem',
              cursor: isGlobalView ? 'pointer' : 'not-allowed' 
            }}
          >
            {sectors.length === 0 ? (
              <>
                <option value="Enfermagem">Enfermagem</option>
                <option value="Psiquiatria">Psiquiatria</option>
                <option value="Farmácia">Farmácia</option>
                <option value="Administrativo">Administrativo</option>
              </>
            ) : (
              sectors.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)
            )}
          </select>
        </div>

        {/* BOTÃO DE ATUALIZAÇÃO */}
        <button 
          onClick={refreshContextData} 
          disabled={refreshing}
          className="btn btn-secondary" 
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Sincronizando...' : 'Atualizar Dados'}
        </button>
      </div>
    </div>
  );
}
