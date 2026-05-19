'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckSquare, Play, Plus, Clock, 
  ArrowRight, CheckCircle, AlertCircle, X, Save 
} from 'lucide-react';

export default function BpmPage() {
  const [fluxos, setFluxos] = useState<any[]>([]);
  const [execucoes, setExecucoes] = useState<any[]>([]);
  const [selectedExec, setSelectedExec] = useState<any>(null);
  const [isCreatingFluxo, setIsCreatingFluxo] = useState(false);
  const [isStartingExec, setIsStartingExec] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [novoFluxo, setNovoFluxo] = useState({
    nome: '',
    descricao: '',
    sla_horas: 24,
    nodesStr: 'Início, Revisão Técnica, Aprovação Diretoria, Publicado'
  });

  const [novaExec, setNovaExec] = useState({
    fluxo_id: '',
    solicitante: 'Enf. Maria Souza'
  });

  useEffect(() => {
    fetchBpmData();
  }, []);

  async function fetchBpmData() {
    setLoading(true);
    try {
      const [fluxosRes, execRes] = await Promise.all([
        fetch('/api/bpm/fluxos'),
        fetch('/api/bpm/execucoes')
      ]);
      const fluxosData = await fluxosRes.json();
      const execData = await execRes.json();
      setFluxos(fluxosData);
      setExecucoes(execData);
      if (fluxosData.length > 0) {
        setNovaExec(prev => ({ ...prev, fluxo_id: fluxosData[0].id }));
      }
    } catch (err) {
      console.error('Erro ao buscar dados BPM:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveFluxo(e: React.FormEvent) {
    e.preventDefault();
    try {
      const nodeNames = novoFluxo.nodesStr.split(',').map(s => s.trim()).filter(Boolean);
      const nodes = nodeNames.map((name, idx) => ({
        id: `node_${idx}`,
        label: name,
        type: idx === 0 ? 'start' : idx === nodeNames.length - 1 ? 'end' : 'task'
      }));

      const edges = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
      }

      const bpmn_json = { nodes, edges };

      const res = await fetch('/api/bpm/fluxos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoFluxo.nome,
          descricao: novoFluxo.descricao,
          sla_horas: novoFluxo.sla_horas,
          bpmn_json
        })
      });

      if (res.ok) {
        await fetchBpmData();
        setIsCreatingFluxo(false);
        setNovoFluxo({ nome: '', descricao: '', sla_horas: 24, nodesStr: 'Início, Revisão Técnica, Aprovação Diretoria, Publicado' });
      }
    } catch (err) {
      alert('Erro ao salvar fluxo BPM');
    }
  }

  async function handleStartExecution(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/bpm/execucoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaExec)
      });

      if (res.ok) {
        await fetchBpmData();
        setIsStartingExec(false);
      }
    } catch (err) {
      alert('Erro ao iniciar processo');
    }
  }

  async function handleAvancarEtapa(execId: number, proximaEtapa: string, statusFinal?: string) {
    try {
      const res = await fetch(`/api/bpm/execucoes/${execId}/avancar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: 'Admin',
          proxima_etapa: proximaEtapa,
          status_final: statusFinal
        })
      });

      if (res.ok) {
        await fetchBpmData();
        const updated = await res.json();
        if (selectedExec?.id === execId) setSelectedExec(updated);
      }
    } catch (err) {
      alert('Erro ao avançar etapa do processo');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Fluxos e Motor BPM</h1>
          <p style={{ color: 'var(--muted)' }}>Motor de processos embutido para controle de fluxos hospitalares e monitoramento de SLA</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setIsCreatingFluxo(true)} className="btn btn-secondary">
            <Plus size={18} /> Novo Fluxo BPM
          </button>
          <button onClick={() => setIsStartingExec(true)} className="btn btn-primary">
            <Play size={18} /> Iniciar Processo
          </button>
        </div>
      </div>

      {/* FORMULÁRIO DE NOVO FLUXO */}
      {isCreatingFluxo && (
        <div className="card" style={{ borderTop: '4px solid var(--sage)' }}>
          <div className="card-header">
            <h2 className="card-title">Configurar Novo Fluxo de Processo (BPMN Lite)</h2>
            <button onClick={() => setIsCreatingFluxo(false)} className="btn btn-secondary"><X size={18} /></button>
          </div>

          <form onSubmit={handleSaveFluxo} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Nome do Fluxo</label>
                <input type="text" value={novoFluxo.nome} onChange={e => setNovoFluxo({...novoFluxo, nome: e.target.value})} placeholder="ex: Protocolo de Alta Hospitalar" required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>SLA Padrão (Horas)</label>
                <input type="number" value={novoFluxo.sla_horas} onChange={e => setNovoFluxo({...novoFluxo, sla_horas: parseInt(e.target.value)})} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Descrição do Objetivo</label>
              <textarea rows={3} value={novoFluxo.descricao} onChange={e => setNovoFluxo({...novoFluxo, descricao: e.target.value})} placeholder="Descreva a finalidade deste fluxo de processo..." required />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Etapas do Processo (Separadas por vírgula)</label>
              <input type="text" value={novoFluxo.nodesStr} onChange={e => setNovoFluxo({...novoFluxo, nodesStr: e.target.value})} placeholder="Início, Etapa 1, Etapa 2, Fim" required />
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.4rem', display: 'block' }}>
                O motor BPM criará automaticamente as conexões e transições entre cada etapa listada.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => setIsCreatingFluxo(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary"><Save size={18} /> Salvar Fluxo</button>
            </div>
          </form>
        </div>
      )}

      {/* FORMULÁRIO DE INICIAR EXECUÇÃO */}
      {isStartingExec && (
        <div className="card" style={{ borderTop: '4px solid var(--amber)' }}>
          <div className="card-header">
            <h2 className="card-title">Iniciar Nova Execução de Processo</h2>
            <button onClick={() => setIsStartingExec(false)} className="btn btn-secondary"><X size={18} /></button>
          </div>

          <form onSubmit={handleStartExecution} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Selecione o Fluxo de Processo</label>
                <select value={novaExec.fluxo_id} onChange={e => setNovaExec({...novaExec, fluxo_id: e.target.value})} required>
                  {fluxos.map(f => (
                    <option key={f.id} value={f.id}>{f.nome} (SLA: {f.sla_horas}h)</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Profissional Solicitante</label>
                <input type="text" value={novaExec.solicitante} onChange={e => setNovaExec({...novaExec, solicitante: e.target.value})} required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" onClick={() => setIsStartingExec(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary"><Play size={18} /> Iniciar Processo</button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE EXECUÇÕES EM ANDAMENTO */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Acompanhamento de Execuções e SLAs</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fluxo de Processo</th>
                <th>Solicitante</th>
                <th>Etapa Atual</th>
                <th>Status</th>
                <th>Início</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && execucoes.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Carregando processos...</td></tr>
              ) : execucoes.map(exec => (
                <tr key={exec.id}>
                  <td style={{ fontWeight: 700 }}>#{exec.id}</td>
                  <td style={{ fontWeight: 600 }}>{exec.fluxo_nome}</td>
                  <td>{exec.solicitante}</td>
                  <td><span className="badge badge-info">{exec.etapa_atual}</span></td>
                  <td>
                    <span className={`badge ${exec.status === 'Concluído' ? 'badge-success' : 'badge-warning'}`}>
                      {exec.status}
                    </span>
                  </td>
                  <td>{new Date(exec.data_inicio).toLocaleString()}</td>
                  <td>
                    <button onClick={() => setSelectedExec(exec)} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}>
                      Acompanhar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETALHES DA EXECUÇÃO SELECIONADA */}
      {selectedExec && (
        <div className="card" style={{ borderTop: '4px solid var(--ink)' }}>
          <div className="card-header">
            <div>
              <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>Execução #{selectedExec.id}</span>
              <h2 className="card-title" style={{ fontSize: '1.6rem' }}>{selectedExec.fluxo_nome}</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                Solicitante: <strong>{selectedExec.solicitante}</strong> · SLA: {selectedExec.sla_horas} horas
              </div>
            </div>
            <button onClick={() => setSelectedExec(null)} className="btn btn-secondary"><X size={18} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
            {/* LINHA DO TEMPO DAS ETAPAS */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Linha do Tempo de Execução</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
                {selectedExec.log_execucao?.map((log: any, idx: number) => (
                  <div key={idx} style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: '-1.55rem', 
                      top: '0.2rem', 
                      width: '14px', 
                      height: '14px', 
                      borderRadius: '50%', 
                      background: log.status === 'Concluído' ? 'var(--sage)' : 'var(--amber)',
                      border: '2px solid white'
                    }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '1rem' }}>{log.etapa}</strong>
                      <span className={`badge ${log.status === 'Concluído' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>{log.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{log.data}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AÇÕES DE AVANÇO DE ETAPA */}
            {selectedExec.status !== 'Concluído' && (
              <div style={{ padding: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Avançar Fluxo de Processo</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleAvancarEtapa(selectedExec.id, 'Revisão Técnica')} className="btn btn-secondary">
                    Avancar para Revisão Técnica <ArrowRight size={16} />
                  </button>
                  <button onClick={() => handleAvancarEtapa(selectedExec.id, 'Aprovação Diretoria')} className="btn btn-secondary">
                    Avançar para Aprovação Diretoria <ArrowRight size={16} />
                  </button>
                  <button onClick={() => handleAvancarEtapa(selectedExec.id, 'Encerrado', 'Concluído')} className="btn btn-primary">
                    <CheckCircle size={16} /> Concluir e Encerrar Processo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
