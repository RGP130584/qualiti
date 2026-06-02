'use client';

import React, { useEffect, useState } from 'react';
import { 
  Link2, FileCode, CheckCircle, ExternalLink, 
  Server, Database, Activity, RefreshCw 
} from 'lucide-react';

export default function FhirPage() {
  const [metadata, setMetadata] = useState<any>(null);
  const [patients, setPatients] = useState<any>(null);
  const [observations, setObservations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('metadata');

  useEffect(() => {
    fetchFhirData();
  }, []);

  async function fetchFhirData() {
    setLoading(true);
    try {
      const [metaRes, ptRes, obsRes] = await Promise.all([
        fetch('/api/fhir/metadata'),
        fetch('/api/fhir/Patient'),
        fetch('/api/fhir/Observation')
      ]);

      const metaData = await metaRes.json();
      const ptData = await ptRes.json();
      const obsData = await obsRes.json();

      setMetadata(metaData);
      setPatients(ptData);
      setObservations(obsData);
    } catch (err) {
      console.error('Erro ao buscar dados FHIR:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link2 className="text-sage" style={{ color: 'var(--sage)' }} /> Interoperabilidade FHIR R4 & OpenAPI
          </h1>
          <p style={{ color: 'var(--muted)' }}>Conector nativo HL7 FHIR R4 para integração com sistemas HIS/PEP e documentação OpenAPI 3.0</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={fetchFhirData} className="btn btn-secondary">
            <RefreshCw size={16} /> Atualizar Gateway
          </button>
          <a href="/api/docs" target="_blank" className="btn btn-primary">
            <FileCode size={18} /> Swagger OpenAPI 3.0 <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* CARDS DE VISÃO GERAL DE ARQUITETURA */}
      <div className="grid-cards">
        <div className="card" style={{ borderTop: '4px solid var(--sage)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--muted)' }}>Versão FHIR Suportada</h3>
            <Server size={24} style={{ color: 'var(--sage)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>{metadata?.fhirVersion || '4.0.1'}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            CapabilityStatement ativo e respondendo
          </div>
        </div>

        <div className="card" style={{ borderTop: '4px solid var(--amber)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--muted)' }}>Pacientes Sincronizados</h3>
            <Database size={24} style={{ color: 'var(--amber)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>{patients?.total || 0} Registros</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Recurso <code>/fhir/Patient</code>
          </div>
        </div>

        <div className="card" style={{ borderTop: '4px solid #4a7ab0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--muted)' }}>Observações Clínicas</h3>
            <Activity size={24} style={{ color: '#4a7ab0' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>{observations?.total || 0} Sinais Vitais</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Recurso <code>/fhir/Observation</code>
          </div>
        </div>
      </div>

      {/* GATEWAY DE SIMULAÇÃO DE RECURSOS FHIR */}
      <div className="card" style={{ borderTop: '4px solid var(--ink)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="card-title">Gateway de Testes REST FHIR R4</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setActiveTab('metadata')} className={`btn ${activeTab === 'metadata' ? 'btn-primary' : 'btn-secondary'}`}>Capability Statement</button>
            <button onClick={() => setActiveTab('patients')} className={`btn ${activeTab === 'patients' ? 'btn-primary' : 'btn-secondary'}`}>Recurso Patient</button>
            <button onClick={() => setActiveTab('observations')} className={`btn ${activeTab === 'observations' ? 'btn-primary' : 'btn-secondary'}`}>Recurso Observation</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Carregando pacotes de interoperabilidade FHIR...</div>
        ) : (
          <div style={{ background: 'var(--ink)', color: '#7aff9a', padding: '1.5rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
            <div style={{ color: 'var(--paper)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>GET /api/fhir/{activeTab === 'metadata' ? 'metadata' : activeTab === 'patients' ? 'Patient' : 'Observation'}</span>
              <span style={{ color: 'var(--sage-light)' }}>HTTP/1.1 200 OK (application/fhir+json)</span>
            </div>
            <pre style={{ margin: 0 }}>
              {activeTab === 'metadata' && JSON.stringify(metadata, null, 2)}
              {activeTab === 'patients' && JSON.stringify(patients, null, 2)}
              {activeTab === 'observations' && JSON.stringify(observations, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}>Documentação e Contratos de Integração</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1rem' }}>
            O QualitaOS expõe todos os seus endpoints de gestão da qualidade, POPs e fluxos BPM através de um contrato OpenAPI 3.0 formal. Acesse o portal do desenvolvedor abaixo para testar endpoints interativamente via Swagger UI.
          </p>
          <a href="/api/docs" target="_blank" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <FileCode size={18} style={{ color: 'var(--sage)' }} /> Abrir Portal OpenAPI (Swagger UI) <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
