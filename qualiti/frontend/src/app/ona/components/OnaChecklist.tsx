'use client';

import React from 'react';
import { CheckSquare, Square, CheckCircle, AlertCircle } from 'lucide-react';
import { useChecklist } from '../hooks/useChecklist';
import { ChecklistItem } from '../types/ona.types';

export function OnaChecklist() {
  const { checklist, updateChecklistItemConformity, loading } = useChecklist();

  if (loading && checklist.length === 0) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
        Carregando itens de verificação do submódulo...
      </div>
    );
  }

  if (checklist.length === 0) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
        Nenhum item de verificação cadastrado para este submódulo no seu setor.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
        <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckSquare size={20} style={{ color: 'var(--sage)' }} /> Itens de Verificação ONA (Checklist Operacional)
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid var(--border)' }}>
        {checklist.map((item: ChecklistItem) => (
          <div 
            key={item.id} 
            style={{ 
              padding: '1.2rem 2rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: '1.5rem',
              background: item.conforme ? 'rgba(34, 197, 94, 0.03)' : 'transparent',
              transition: 'background 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
              <button 
                onClick={() => updateChecklistItemConformity(item, !item.conforme)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '0.2rem', 
                  color: item.conforme ? '#16a34a' : 'var(--muted)',
                  marginTop: '0.1rem' 
                }}
              >
                {item.conforme ? <CheckSquare size={22} /> : <Square size={22} />}
              </button>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: item.conforme ? 'var(--ink)' : 'var(--muted)', fontSize: '1rem', lineHeight: 1.5 }}>
                  {item.pergunta}
                </p>
                {item.observacoes && (
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Nota: {item.observacoes}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Setor: {item.setor}</span>
                  {item.evidenciaId && <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Evidência #{item.evidenciaId} Anexada</span>}
                </div>
              </div>
            </div>

            <div>
              <span className={`badge ${item.conforme ? 'badge-success' : 'badge-warning'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {item.conforme ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {item.conforme ? 'Conforme' : 'Pendente'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
