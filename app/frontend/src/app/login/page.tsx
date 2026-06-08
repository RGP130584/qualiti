'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hospital, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@qualitaos.com');
  const [password, setPassword] = useState('admin123'); // Senha do seed inicial
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        router.push('/');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor de autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Hospital size={48} style={{ color: 'var(--sage)', margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink)' }}>Acesso ao QualitaOS</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginTop: '0.4rem' }}>
            Faça login para acessar o sistema operacional da qualidade hospitalar.
          </p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: '#ffdcd8', color: 'var(--red)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <Mail size={16} style={{ color: 'var(--muted)' }} /> Email Profissional
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="ex: admin@qualitaos.com" 
              required 
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <Lock size={16} style={{ color: 'var(--muted)' }} /> Senha
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Autenticando...' : 'Entrar no Sistema'} <ArrowRight size={18} />
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <a href="/wizard" style={{ color: 'var(--sage)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
              Cadastrar nova instituição
            </a>
          </div>
        </form>

        <div style={{ marginTop: '2rem', padding: '1.2rem', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--muted)' }}>
          <strong style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--ink)' }}>💡 Dica de Acesso Rápido (Demonstração):</strong>
          Utilize o email <strong>admin@qualitaos.com</strong> e senha <strong>admin123</strong> para acessar com permissões de Administrador Geral.
        </div>
      </div>
    </div>
  );
}
