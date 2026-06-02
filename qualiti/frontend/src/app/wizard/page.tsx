'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hospital, CheckCircle, ArrowRight, Shield } from 'lucide-react';

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: 'Hospital Qualita Central',
    logo: '🏥',
    adminNome: 'Dr. Administrador',
    adminEmail: 'admin@qualitaos.com',
    adminSenha: 'admin_secure_pw',
    modulosAtivos: ['pops', 'bpm', 'ona', 'users', 'indicators', 'incidents', 'ai', 'fhir']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModuleToggle = (mod: string) => {
    const exists = formData.modulosAtivos.includes(mod);
    const updated = exists 
      ? formData.modulosAtivos.filter(m => m !== mod)
      : [...formData.modulosAtivos, mod];
    setFormData({ ...formData, modulosAtivos: updated });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/wizard/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        // Faz login automático
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.adminEmail, password: formData.adminSenha })
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          localStorage.setItem('qualita_token', loginData.token);
          router.push('/');
        } else {
          router.push('/login');
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao configurar instituição');
      }
    } catch (err) {
      setError('Erro de conexão ao configurar sistema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Hospital size={48} style={{ color: 'var(--sage)', margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink)' }}>Bem-vindo ao QualitaOS</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginTop: '0.4rem' }}>
            O sistema operacional da qualidade hospitalar. Configure sua instituição em poucos passos.
          </p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: '#ffdcd8', color: 'var(--red)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>1. Dados da Instituição</h3>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nome da Instituição Hospitalar</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Ícone / Logo (Emoji ou Texto)</label>
              <input type="text" name="logo" value={formData.logo} onChange={handleChange} required />
            </div>
            <button onClick={() => setStep(2)} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}>
              Próximo Passo <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>2. Conta de Administrador Geral</h3>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nome Completo</label>
              <input type="text" name="adminNome" value={formData.adminNome} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email de Acesso</label>
              <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Senha de Segurança</label>
              <input type="password" name="adminSenha" value={formData.adminSenha} onChange={handleChange} required />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ flexGrow: 1, padding: '0.8rem' }}>Voltar</button>
              <button onClick={() => setStep(3)} className="btn btn-primary" style={{ flexGrow: 1, padding: '0.8rem' }}>Próximo <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>3. Módulos Ativos (Acreditação ONA)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Selecione os módulos que deseja habilitar para sua instituição:</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { id: 'pops', label: 'Gestão de POPs' },
                { id: 'bpm', label: 'Fluxos e BPM' },
                { id: 'ona', label: 'Painel ONA' },
                { id: 'users', label: 'Usuários e Acesso' },
                { id: 'indicators', label: 'Indicadores e Metas' },
                { id: 'incidents', label: 'Incidentes e CAPA' },
                { id: 'ai', label: 'Assistente de IA' },
                { id: 'fhir', label: 'Conector FHIR' }
              ].map(mod => {
                const active = formData.modulosAtivos.includes(mod.id);
                return (
                  <div 
                    key={mod.id} 
                    onClick={() => handleModuleToggle(mod.id)}
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      border: `2px solid ${active ? 'var(--sage)' : 'var(--border)'}`, 
                      background: active ? 'var(--sage-pale)' : 'var(--surface)', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    <CheckCircle size={20} style={{ color: active ? 'var(--sage)' : 'var(--muted)' }} />
                    {mod.label}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ flexGrow: 1, padding: '0.8rem' }} disabled={loading}>Voltar</button>
              <button onClick={handleSubmit} className="btn btn-primary" style={{ flexGrow: 2, padding: '0.8rem', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Configurando QualitaOS...' : 'Concluir e Acessar Sistema'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
