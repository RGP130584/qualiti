'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hospital, CheckCircle, ArrowRight, ArrowLeft, Shield, Users, Layers, Zap, Plus, Trash2 } from 'lucide-react';

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Perfil da Organização
    razaoSocial: 'Hospital Geral Verse Ltda',
    nomeFantasia: 'Hospital Verse Central',
    cnpj: '12.345.678/0001-90',
    segmento: 'Hospitalar',
    logo: '🏥',
    responsavel: 'Dr. Carlos Mendes',
    
    // Step 2: Organograma Inicial (OMOC)
    primeiroSetor: 'Enfermagem',
    primeiroCargo: 'Coordenador Técnico UTI',
    vagasCargo: 2,

    // Step 3: Conta Admin & Colaboradores (OMOC/IAM)
    adminNome: 'Dr. Carlos Mendes',
    adminEmail: 'carlos.mendes@qualitaos.com',
    adminSenha: 'admin',
    colaboradoresAdicionais: [
      { nome: 'Enf. Maria Souza', email: 'maria.souza@qualitaos.com', cargo: 'Enfermeiro Assistencial' }
    ] as Array<{ nome: string; email: string; cargo: string }>,

    // Step 4: Módulos Iniciais (PAL)
    modulosAtivos: ['pops', 'bpm', 'ona', 'users']
  });

  const [colabNome, setColabNome] = useState('');
  const [colabEmail, setColabEmail] = useState('');
  const [colabCargo, setColabCargo] = useState('Enfermeiro Assistencial');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModuleToggle = (mod: string) => {
    const exists = formData.modulosAtivos.includes(mod);
    const updated = exists 
      ? formData.modulosAtivos.filter(m => m !== mod)
      : [...formData.modulosAtivos, mod];
    setFormData({ ...formData, modulosAtivos: updated });
  };

  const addColaborador = () => {
    if (!colabNome || !colabEmail || !colabCargo) return;
    if (formData.colaboradoresAdicionais.length >= 2) {
      alert('Durante a fase Beta, você pode adicionar até 2 colaboradores adicionais no setup inicial.');
      return;
    }
    setFormData({
      ...formData,
      colaboradoresAdicionais: [
        ...formData.colaboradoresAdicionais,
        { nome: colabNome, email: colabEmail, cargo: colabCargo }
      ]
    });
    setColabNome('');
    setColabEmail('');
  };

  const removeColaborador = (index: number) => {
    const updated = formData.colaboradoresAdicionais.filter((_, i) => i !== index);
    setFormData({ ...formData, colaboradoresAdicionais: updated });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    const payload = {
      nome: formData.nomeFantasia,
      logo: formData.logo,
      adminNome: formData.adminNome,
      adminEmail: formData.adminEmail,
      adminSenha: formData.adminSenha,
      modulosAtivos: formData.modulosAtivos,
      razaoSocial: formData.razaoSocial,
      nomeFantasia: formData.nomeFantasia,
      cnpj: formData.cnpj,
      segmento: formData.segmento,
      responsavel: formData.responsavel,
      primeiroSetor: formData.primeiroSetor,
      primeiroCargo: formData.primeiroCargo,
      vagasCargo: formData.vagasCargo,
      colaboradoresAdicionais: formData.colaboradoresAdicionais
    };

    try {
      const res = await fetch('/api/wizard/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        // Faz login automático do administrador
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.adminEmail, password: formData.adminSenha })
        });

        if (loginRes.ok) {
          router.push('/');
        } else {
          router.push('/login');
        }
      } else {
        setError(data.error || 'Erro ao configurar instituição');
      }
    } catch (err) {
      setError('Erro de conexão ao configurar sistema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '2rem 1rem' }}>
      <div className="auth-card" style={{ maxWidth: '650px', width: '100%' }}>
        
        {/* BRANDING HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Hospital size={44} style={{ color: 'var(--sage)', margin: '0 auto 0.8rem' }} />
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--ink)' }}>Beta Onboarding Guiado</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Preencha os passos para registrar sua instituição e inicializar os módulos.
          </p>
        </div>

        {/* STEP PROGRESS TRACKER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 0.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', background: '#e2e8f0', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', top: '15px', left: '10%', width: `${(step - 1) * 26.6}%`, height: '2px', background: '#3b82f6', zIndex: 2, transition: 'width 0.3s ease' }}></div>
          
          {[
            { s: 1, label: 'Perfil' },
            { s: 2, label: 'Estrutura' },
            { s: 3, label: 'Usuários' },
            { s: 4, label: 'Módulos' }
          ].map(item => (
            <div key={item.s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step >= item.s ? '#3b82f6' : 'white',
                border: `2px solid ${step >= item.s ? '#3b82f6' : '#cbd5e1'}`,
                color: step >= item.s ? 'white' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {item.s}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.3rem', color: step >= item.s ? '#1e293b' : '#64748b' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: '1rem', background: '#ffdcd8', color: 'var(--red)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* STEP 1: PERFIL DA ORGANIZAÇÃO */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', color: '#1e293b' }}>1. Perfil da Organização</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Razão Social</label>
                <input type="text" name="razaoSocial" value={formData.razaoSocial} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Nome Fantasia</label>
                <input type="text" name="nomeFantasia" value={formData.nomeFantasia} onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>CNPJ da Organização</label>
                <input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} required placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Segmento</label>
                <select name="segmento" value={formData.segmento} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <option value="Hospitalar">Hospitalar</option>
                  <option value="Laboratorial">Laboratorial</option>
                  <option value="Clínica Médica">Clínica Médica</option>
                  <option value="Gestão de Saúde">Gestão de Saúde</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Responsável Técnico/Administrador</label>
                <input type="text" name="responsavel" value={formData.responsavel} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Logo/Emoji</label>
                <input type="text" name="logo" value={formData.logo} onChange={handleChange} required style={{ textAlign: 'center' }} />
              </div>
            </div>

            <button onClick={() => setStep(2)} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.8rem', justifyContent: 'center' }}>
              Definir Organograma <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: ORGANOGRAMA INICIAL (OMOC) */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', color: '#1e293b' }}>2. Estrutura do Organograma Inicial</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
              Crie o primeiro setor e o cargo inicial de coordenação. Isto inicializará o organograma (OMOC) da instituição.
            </p>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Primeiro Setor / Departamento</label>
              <input type="text" name="primeiroSetor" value={formData.primeiroSetor} onChange={handleChange} required placeholder="Ex: Enfermagem ou UTI" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Cargo Inicial de Liderança</label>
                <input type="text" name="primeiroCargo" value={formData.primeiroCargo} onChange={handleChange} required placeholder="Ex: Coordenador / RT" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Limite de Vagas</label>
                <input type="number" name="vagasCargo" value={formData.vagasCargo} onChange={handleChange} required min={1} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ flexGrow: 1, padding: '0.8rem', justifyContent: 'center' }}>
                <ArrowLeft size={18} /> Voltar
              </button>
              <button onClick={() => setStep(3)} className="btn btn-primary" style={{ flexGrow: 2, padding: '0.8rem', justifyContent: 'center' }}>
                Vincular Colaboradores <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONTA ADMIN & COLABORADORES */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', color: '#1e293b' }}>3. Conta do Administrador e Colaboradores</h3>
            
            {/* ADMIN INFO */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Shield size={14} style={{ color: '#3b82f6' }} /> Dados de Administrador Geral (Líder {formData.primeiroCargo})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                <input type="text" name="adminNome" placeholder="Nome Completo" value={formData.adminNome} onChange={handleChange} required style={{ background: 'white' }} />
                <input type="email" name="adminEmail" placeholder="E-mail Acesso" value={formData.adminEmail} onChange={handleChange} required style={{ background: 'white' }} />
              </div>
              <input type="password" name="adminSenha" placeholder="Senha do Administrador" value={formData.adminSenha} onChange={handleChange} required style={{ background: 'white' }} />
            </div>

            {/* ADICIONAR COLABORADORES */}
            <div style={{ border: '1px dashed #cbd5e1', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Users size={14} style={{ color: '#10b981' }} /> Cadastrar Primeiros Colaboradores (Máx. 2 no setup)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                <input type="text" placeholder="Nome do Funcionário" value={colabNome} onChange={e => setColabNome(e.target.value)} style={{ padding: '0.5rem' }} />
                <input type="email" placeholder="E-mail" value={colabEmail} onChange={e => setColabEmail(e.target.value)} style={{ padding: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <select value={colabCargo} onChange={e => setColabCargo(e.target.value)} style={{ flexGrow: 2, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <option value="Enfermeiro Assistencial">Enfermeiro Assistencial</option>
                  <option value="Técnico de Enfermagem">Técnico de Enfermagem</option>
                  <option value="Farmacêutico RT">Farmacêutico RT</option>
                  <option value="Médico Assistencial">Médico Assistencial</option>
                </select>
                <button type="button" onClick={addColaborador} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                  <Plus size={16} /> Adicionar
                </button>
              </div>

              {/* LISTA ADICIONADOS */}
              {formData.colaboradoresAdicionais.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem' }}>
                  {formData.colaboradoresAdicionais.map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', background: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <div>
                        <strong>{c.nome}</strong> ({c.email}) - <span style={{ color: '#3b82f6', fontWeight: 600 }}>{c.cargo}</span>
                      </div>
                      <button type="button" onClick={() => removeColaborador(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ flexGrow: 1, padding: '0.8rem', justifyContent: 'center' }}>
                <ArrowLeft size={18} /> Voltar
              </button>
              <button onClick={() => setStep(4)} className="btn btn-primary" style={{ flexGrow: 2, padding: '0.8rem', justifyContent: 'center' }}>
                Ativar Módulos <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {/* STEP 4: MÓDULOS INICIAIS */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', color: '#1e293b' }}>4. Módulos Ativos do Programa Beta</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
              Selecione quais módulos serão ativados. O plano base **Essencial** inclui Gestão de POPs e Organograma. Outros módulos podem ser ativados por Trial no painel.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              {[
                { id: 'pops', label: 'Gestão de POPs (Incluso)' },
                { id: 'users', label: 'Organograma & IAM (Incluso)' },
                { id: 'bpm', label: 'Processos & BPM (Trial)' },
                { id: 'ona', label: 'Painel ONA & Checklists' },
                { id: 'indicators', label: 'KPIs e OKRs' },
                { id: 'incidents', label: 'Incidentes & CAPA' }
              ].map(mod => {
                const isMandatory = mod.id === 'pops' || mod.id === 'users';
                const active = isMandatory || formData.modulosAtivos.includes(mod.id);
                return (
                  <div 
                    key={mod.id} 
                    onClick={() => !isMandatory && handleModuleToggle(mod.id)}
                    style={{ 
                      padding: '0.8rem', 
                      borderRadius: '8px', 
                      border: `2px solid ${active ? '#3b82f6' : 'var(--border)'}`, 
                      background: active ? '#eff6ff' : 'white', 
                      cursor: isMandatory ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      opacity: isMandatory ? 0.85 : 1
                    }}
                  >
                    <CheckCircle size={18} style={{ color: active ? '#3b82f6' : '#94a3b8' }} />
                    {mod.label}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setStep(3)} className="btn btn-secondary" style={{ flexGrow: 1, padding: '0.8rem', justifyContent: 'center' }} disabled={loading}>
                Voltar
              </button>
              <button onClick={handleSubmit} className="btn btn-primary" style={{ flexGrow: 2, padding: '0.8rem', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Inicializando QualitiOS Beta...' : 'Concluir e Acessar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
