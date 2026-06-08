'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, Users, Award, ShieldAlert, CreditCard, CheckCircle2, 
  HelpCircle, RefreshCw, Layers, ArrowUpRight, Check, AlertTriangle
} from 'lucide-react';

interface Fatura {
  id: number;
  valor: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  data_vencimento: string;
  data_pagamento?: string;
  created_at: string;
}

interface Assinatura {
  id?: number;
  tenant_id: string;
  plano_id?: number;
  status: 'ACTIVE' | 'SUSPENDED';
  plano_nome: string;
  preco_mensal: string | number;
  features_ativas?: string[];
  cota_documentos: number;
  cota_usuarios: number;
}

interface Plano {
  id: number;
  nome: string;
  features_ativas: string[];
  cota_documentos: number;
  cota_usuarios: number;
  preco_mensal: string | number;
}

interface Uso {
  cotas: {
    documentos: number;
    usuarios: number;
  };
  uso: {
    documentos: number;
    usuarios: number;
  };
}

export default function BillingPage() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [uso, setUso] = useState<Uso | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  
  // Marketplace states
  const [modulos, setModulos] = useState<any[]>([]);
  const [activatingTrialId, setActivatingTrialId] = useState<string | null>(null);
  const [requestingModuleId, setRequestingModuleId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [upgradingId, setUpgradingId] = useState<number | null>(null);

  async function fetchBillingData() {
    setLoading(true);
    setErrorMsg('');
    try {
      const [aRes, uRes, fRes, pRes, mRes] = await Promise.all([
        fetch('/api/pal/assinaturas'),
        fetch('/api/pal/uso'),
        fetch('/api/pal/faturas'),
        fetch('/api/pal/planos'),
        fetch('/api/pal/marketplace/modulos')
      ]);

      if (aRes.ok) setAssinatura(await aRes.json());
      if (uRes.ok) setUso(await uRes.json());
      if (fRes.ok) setFaturas(await fRes.json());
      if (pRes.ok) setPlanos(await pRes.json());
      if (mRes.ok) setModulos(await mRes.json());
    } catch (err) {
      console.error('Erro ao buscar dados de faturamento', err);
      setErrorMsg('Falha ao obter dados financeiros da assinatura.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBillingData();
  }, []);

  const triggerToast = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      setErrorMsg(msg);
      setSuccessMsg('');
      setTimeout(() => setErrorMsg(''), 6000);
    }
  };

  const handlePayInvoice = async (id: number) => {
    setPayingId(id);
    try {
      const res = await fetch(`/api/pal/faturas/${id}/pagar`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao pagar fatura');

      triggerToast('success', 'Fatura liquidada com sucesso! Acesso reestabelecido caso estivesse bloqueado.');
      fetchBillingData();
    } catch (err: any) {
      triggerToast('error', err.message);
    } finally {
      setPayingId(null);
    }
  };

  const handleUpgradePlan = async (planoId: number) => {
    setUpgradingId(planoId);
    try {
      const res = await fetch('/api/pal/assinaturas/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano_id: planoId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao realizar upgrade');

      triggerToast('success', 'Assinatura atualizada com sucesso! Seus limites e recursos foram redefinidos.');
      
      // Forçar atualização do layout e features no localStorage ou session
      // e atualizar dados de faturamento
      fetchBillingData();
      
      // Forçar recarga da página após 1.5s para recarregar o layout sidebar dinamicamente
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      triggerToast('error', err.message);
    } finally {
      setUpgradingId(null);
    }
  };

  const handleActivateTrial = async (moduloId: string) => {
    setActivatingTrialId(moduloId);
    try {
      const res = await fetch('/api/pal/marketplace/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulo: moduloId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao ativar trial');

      triggerToast('success', data.message || `Trial de 14 dias ativado com sucesso!`);
      fetchBillingData();

      // Forçar recarga da página após 1.5s para recarregar o layout sidebar dinamicamente
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      triggerToast('error', err.message);
    } finally {
      setActivatingTrialId(null);
    }
  };

  const handleRequestActivation = async (moduloId: string) => {
    setRequestingModuleId(moduloId);
    try {
      const res = await fetch('/api/pal/marketplace/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulo: moduloId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar solicitação');

      triggerToast('success', data.message || `Solicitação comercial de ativação registrada!`);
      fetchBillingData();
    } catch (err: any) {
      triggerToast('error', err.message);
    } finally {
      setRequestingModuleId(null);
    }
  };

  if (loading && !assinatura) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
        <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>Carregando dados financeiros e de licenciamento...</span>
      </div>
    );
  }

  // Cálculos de consumo de cota
  const docUso = uso?.uso.documentos ?? 0;
  const docCota = uso?.cotas.documentos ?? 10000;
  const docPct = Math.min((docUso / docCota) * 100, 100);

  const userUso = uso?.uso.usuarios ?? 0;
  const userCota = uso?.cotas.usuarios ?? 100;
  const userPct = Math.min((userUso / userCota) * 100, 100);

  const isDocsCritical = docPct >= 90;
  const isUsersCritical = userPct >= 90;

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* ALERTAS */}
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
          <ShieldAlert size={20} /> {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#f0fdf4', borderLeft: '4px solid #22c55e', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {/* BANNER DE SUSPENSÃO */}
      {assinatura?.status === 'SUSPENDED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fffbeb', border: '1px solid #fef3c7', borderLeft: '5px solid #d97706', color: '#92400e', padding: '1.25rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 700, fontSize: '1rem' }}>
            <AlertTriangle size={22} style={{ color: '#d97706' }} /> ASSINATURA SUSPENSA POR INADIMPLÊNCIA
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.4 }}>
            Detectamos faturas pendentes vencidas há mais de 5 dias. Para evitar o bloqueio total do acesso dos seus colaboradores, liquide a pendência abaixo na seção de faturas em aberto.
          </p>
        </div>
      )}

      {/* HEADER TELA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>Faturamento & Licenciamento</h1>
          <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Gerenciamento de cotas de uso do tenant, histórico de faturas e upgrade de recursos no marketplace.</p>
        </div>
        <button 
          onClick={fetchBillingData} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #cbd5e1', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
        >
          <RefreshCw size={16} /> Atualizar Estatísticas
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* CARDS DE CONSUMO E LIMITE DE COTAS */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} style={{ color: '#3b82f6' }} /> Consumo e Limites das Cotas
          </h3>

          {/* Cota 1: Documentos (POPs) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} style={{ color: '#64748b' }} /> Documentos Armazenados (ECM)
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDocsCritical ? '#ef4444' : '#0f172a' }}>
                {docUso} de {docCota} ({docPct.toFixed(1)}%)
              </span>
            </div>
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${docPct}%`, height: '100%', background: isDocsCritical ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '5px', transition: 'width 0.5s ease' }}></div>
            </div>
            {isDocsCritical && (
              <span style={{ fontSize: '0.78rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.4rem', fontWeight: 600 }}>
                <AlertTriangle size={12} /> Cota próxima do limite (90%+). A criação de novos POPs será bloqueada nos 100%!
              </span>
            )}
          </div>

          {/* Cota 2: Usuários */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} style={{ color: '#64748b' }} /> Usuários Ativos (IAM)
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isUsersCritical ? '#ef4444' : '#0f172a' }}>
                {userUso} de {userCota} ({userPct.toFixed(1)}%)
              </span>
            </div>
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${userPct}%`, height: '100%', background: isUsersCritical ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '5px', transition: 'width 0.5s ease' }}></div>
            </div>
            {isUsersCritical && (
              <span style={{ fontSize: '0.78rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.4rem', fontWeight: 600 }}>
                <AlertTriangle size={12} /> Cota de usuários ativos atingiu limite crítico. Contratações adicionais serão travadas.
              </span>
            )}
          </div>
        </div>

        {/* DETALHES DO PLANO ATIVO */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.8rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Plano Atual</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                background: assinatura?.status === 'ACTIVE' ? '#22c55e' : '#ef4444',
                color: 'white'
              }}>
                {assinatura?.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}
              </span>
            </div>

            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>{assinatura?.plano_nome}</h2>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0', color: '#38bdf8' }}>
              R$ {assinatura ? parseFloat(assinatura.preco_mensal.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}/mês
            </div>
            
            <p style={{ margin: '1rem 0 0 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              Sua conta está associada ao plano {assinatura?.plano_nome}. Os limites contratados cobrem as necessidades essenciais de conformidade institucional. Para liberar IA, LMS e BPMN avançado, realize o upgrade.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID Assinatura: #{assinatura?.id || 'GLOBAL_SYSTEM'}</span>
          </div>
        </div>
      </div>

      {/* GRADE DE UPGRADES DO MARKETPLACE */}
      <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Award size={20} style={{ color: '#f59e0b' }} /> Marketplace: Upgrade de Planos
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: planos.map(() => '1fr').join(' '), gap: '2rem', marginBottom: '3.5rem' }}>
        {planos.map((plano) => {
          const isCurrent = assinatura?.plano_id === plano.id;
          const features = plano.features_ativas;

          return (
            <div key={plano.id} style={{
              background: 'white',
              border: isCurrent ? '2.5px solid #3b82f6' : '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#3b82f6',
                  color: 'white',
                  padding: '0.2rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  PLANO ATIVO
                </div>
              )}

              <div>
                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{plano.nome}</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', margin: '0.8rem 0' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>R$ {parseFloat(plano.preco_mensal.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/mês</span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                  <strong>Limites:</strong> {plano.cota_documentos} docs · {plano.cota_usuarios} usuários
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: '#64748b' }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>Recursos Inclusos:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={14} style={{ color: '#10b981' }} /> Gestão de Cargos e Organograma
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={14} style={{ color: '#10b981' }} /> Gestão Documental de POPs
                  </div>
                  {features.includes('feature:lms:core') ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> LMS / Universidade Corporativa
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.4 }}>
                      <Check size={14} /> LMS / Universidade Corporativa (Bloqueado)
                    </div>
                  )}
                  {features.includes('feature:ai:ishikawa') ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> IA Ishikawa & Triagem Cognitiva
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.4 }}>
                      <Check size={14} /> IA Ishikawa & Triagem Cognitiva (Bloqueado)
                    </div>
                  )}
                  {features.includes('feature:bpm:core') ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
                      <Check size={14} style={{ color: '#10b981' }} /> BPMN Avançado & SLAs Background
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.4 }}>
                      <Check size={14} /> BPMN Avançado & SLAs Background (Bloqueado)
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => handleUpgradePlan(plano.id)}
                disabled={isCurrent || upgradingId !== null}
                style={{
                  width: '100%',
                  marginTop: '2rem',
                  padding: '0.8rem',
                  borderRadius: '10px',
                  border: isCurrent ? '1px solid #cbd5e1' : 'none',
                  background: isCurrent ? '#f8fafc' : '#3b82f6',
                  color: isCurrent ? '#94a3b8' : 'white',
                  fontWeight: 700,
                  cursor: isCurrent ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {isCurrent ? 'Plano Atual Ativo' : upgradingId === plano.id ? 'Processando...' : 'Assinar Plano'}
                {!isCurrent && <ArrowUpRight size={16} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* GRADE DE MÓDULOS DO MARKETPLACE */}
      <h3 style={{ margin: '3rem 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Layers size={20} style={{ color: '#3b82f6' }} /> Marketplace de Módulos & Integrações
      </h3>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', marginTop: '-1.2rem' }}>
        Gerencie seus módulos ativos, experimente novos recursos (Trial 14 dias) ou solicite a ativação comercial.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
        {modulos.map((m) => {
          const isActive = m.status === 'ACTIVE';
          const isTrial = m.status === 'TRIAL';
          const isPending = m.solicitacaoStatus === 'PENDENTE';
          
          return (
            <div key={m.id} style={{
              background: 'white',
              border: isActive ? '2px solid #10b981' : isTrial ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}>
              {/* Status Badge */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                {isActive && (
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                    ATIVO
                  </span>
                )}
                {isTrial && (
                  <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                    TRIAL
                  </span>
                )}
                {!isActive && !isTrial && (
                  <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                    INATIVO
                  </span>
                )}
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', paddingRight: '4.5rem' }}>
                  {m.nome}
                </h4>
                <code style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '0.15rem 0.4rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.8rem' }}>
                  {m.feature}
                </code>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4, minHeight: '3.6rem' }}>
                  {m.descricao}
                </p>
                
                {isTrial && m.trialExpiracao && (
                  <div style={{ margin: '0.8rem 0 0 0', fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>
                    Expira em: {new Date(m.trialExpiracao).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isActive ? (
                  <div style={{
                    background: '#f0fdf4',
                    color: '#166534',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    border: '1px dashed #bbf7d0'
                  }}>
                    Incluso no Plano
                  </div>
                ) : (
                  <>
                    {!isTrial && (
                      <button
                        onClick={() => handleActivateTrial(m.id)}
                        disabled={activatingTrialId !== null}
                        style={{
                          width: '100%',
                          padding: '0.55rem',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {activatingTrialId === m.id ? 'Ativando...' : 'Ativar Trial 14 Dias'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRequestActivation(m.id)}
                      disabled={isPending || requestingModuleId !== null}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        background: isPending ? '#f1f5f9' : '#3b82f6',
                        border: isPending ? '1px solid #cbd5e1' : 'none',
                        color: isPending ? '#94a3b8' : 'white',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: isPending ? 'default' : 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {requestingModuleId === m.id ? 'Enviando...' : isPending ? 'Solicitação Pendente' : 'Solicitar Ativação Comercial'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* HISTÓRICO DE FATURAS */}
      <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <CreditCard size={20} style={{ color: '#3b82f6' }} /> Histórico de Faturamento e Faturas
      </h3>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
              <th style={{ padding: '1rem 1.5rem' }}>ID Fatura</th>
              <th style={{ padding: '1rem' }}>Valor</th>
              <th style={{ padding: '1rem' }}>Data Vencimento</th>
              <th style={{ padding: '1rem' }}>Data Pagamento</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {faturas.map((f) => {
              const isPaid = f.status === 'PAID';
              return (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#334155' }}>#{f.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>R$ {parseFloat(f.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(f.data_vencimento).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{f.data_pagamento ? new Date(f.data_pagamento).toLocaleDateString('pt-BR') : '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: isPaid ? '#dcfce7' : '#fee2e2',
                      color: isPaid ? '#15803d' : '#ef4444'
                    }}>
                      {f.status === 'PENDING' ? 'Em Aberto' : isPaid ? 'Paga' : 'Vencida'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    {!isPaid && (
                      <button 
                        onClick={() => handlePayInvoice(f.id)}
                        disabled={payingId === f.id}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        {payingId === f.id ? 'Pagando...' : 'Pagar Fatura'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {faturas.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                  Nenhuma fatura registrada para este inquilino.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
