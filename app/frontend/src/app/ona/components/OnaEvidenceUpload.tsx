'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useEvidence } from '../hooks/useEvidence';
import { useOna } from '../hooks/useOna';
import { Evidence } from '../types/ona.types';

export function OnaEvidenceUpload() {
  const { evidences, addNewEvidence } = useEvidence();
  const { selectedSubmodulo, currentUser } = useOna();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('submoduloId', String(selectedSubmodulo));
    formData.append('enviadoPor', currentUser.nome);
    formData.append('setorRelacionado', currentUser.departamento);

    const success = await addNewEvidence(formData);
    if (success) {
      setSelectedFile(null);
    }
    setUploading(false);
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '1.5rem 2rem', background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
        <h3 className="card-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadCloud size={20} style={{ color: 'var(--sage)' }} /> Gestão e Upload de Evidências ONA
        </h3>
      </div>

      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* ÁREA DE UPLOAD */}
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '2px dashed var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ padding: '1rem', background: 'white', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <UploadCloud size={36} style={{ color: 'var(--sage)' }} />
            </div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Anexar Evidência Comprobatória</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '400px' }}>
              Selecione relatórios, atas, pareceres ou certificados comprobatórios para auditoria ONA do submódulo atual.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="file" 
              id="file-upload" 
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }} 
            />
            <label 
              htmlFor="file-upload" 
              className="btn btn-secondary" 
              style={{ cursor: 'pointer', padding: '0.6rem 1.2rem', fontWeight: 600, background: 'white' }}
            >
              {selectedFile ? selectedFile.name : 'Escolher Arquivo...'}
            </label>

            <button 
              type="submit" 
              disabled={!selectedFile || uploading} 
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}
            >
              {uploading ? 'Enviando...' : 'Fazer Upload de Evidência'}
            </button>
          </div>
        </form>

        {/* LISTA DE EVIDÊNCIAS ANEXADAS */}
        <div>
          <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>Evidências do Submódulo Atual</h4>
          {evidences.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Nenhuma evidência anexada para este submódulo no seu setor.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {evidences.map((ev: Evidence) => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '8px', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FileText size={24} style={{ color: 'var(--muted)' }} />
                    <div>
                      <strong style={{ display: 'block', color: 'var(--ink)' }}>{ev.arquivoNome}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Enviado por {ev.enviadoPor} em {new Date(ev.dataEnvio).toLocaleDateString()} · Setor: {ev.setorRelacionado}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={`badge ${ev.statusAprovacao === 'Aprovado' ? 'badge-success' : ev.statusAprovacao === 'Pendente' ? 'badge-warning' : 'badge-danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {ev.statusAprovacao === 'Aprovado' ? <CheckCircle size={14} /> : ev.statusAprovacao === 'Pendente' ? <Clock size={14} /> : <XCircle size={14} />}
                      {ev.statusAprovacao}
                    </span>
                    <a href={ev.arquivoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                      Visualizar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
