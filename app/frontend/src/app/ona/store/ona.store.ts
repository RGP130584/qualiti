'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Sector, Indicator, Evidence, ChecklistItem, ActionPlan, Audit, UserContext 
} from '../types/ona.types';
import { onaService } from '../services/ona.service';
import { toast } from '../utils/notifications';

interface OnaStoreState {
  // Contexto de Usuário Ativo
  currentUser: UserContext;
  setCurrentUser: (user: UserContext) => void;

  // Listas Dinâmicas
  sectors: Sector[];
  indicators: Indicator[];
  evidences: Evidence[];
  checklist: ChecklistItem[];
  actionPlans: ActionPlan[];
  audits: Audit[];

  // Seleções e Filtros Ativos
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  selectedSubmodulo: number;
  setSelectedSubmodulo: (id: number) => void;

  // Loading States
  loading: boolean;
  refreshing: boolean;

  // Ações de Store (Mutations)
  fetchInitialData: () => Promise<void>;
  refreshContextData: () => Promise<void>;
  updateChecklistItemConformity: (item: ChecklistItem, conforme: boolean) => Promise<void>;
  addNewEvidence: (formData: FormData) => Promise<boolean>;
  addNewActionPlan: (plan: Partial<ActionPlan>) => Promise<boolean>;
  scheduleNewAudit: (audit: Partial<Audit>) => Promise<boolean>;
}

const OnaStoreContext = createContext<OnaStoreState | null>(null);

export function OnaStoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserContext>({
    nome: 'Enf. Maria Souza',
    role: 'Enfermeiro',
    departamento: 'Enfermagem',
    email: 'maria.souza@qualitaos.com',
    isGlobalAdmin: false
  });

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);

  const [selectedSector, setSelectedSector] = useState<string>('Enfermagem');
  const [selectedSubmodulo, setSelectedSubmodulo] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Efeito de inicialização e mudança de usuário/setor
  useEffect(() => {
    fetchInitialData();
  }, [currentUser, selectedSector, selectedSubmodulo]);

  async function fetchInitialData() {
    setLoading(true);
    await loadData();
    setLoading(false);
  }

  async function refreshContextData() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Dados operacionais sincronizados com sucesso');
  }

  async function loadData() {
    const isGlobal = currentUser.isGlobalAdmin || currentUser.departamento === 'Diretoria' || currentUser.role.includes('Auditor');
    const targetSector = isGlobal ? selectedSector : currentUser.departamento;

    const [secRes, indRes, evRes, chkRes, plnRes, audRes] = await Promise.all([
      onaService.getSectorsConfig(),
      onaService.getIndicators(targetSector),
      onaService.getEvidences(selectedSubmodulo, targetSector),
      onaService.getChecklist(selectedSubmodulo, targetSector),
      onaService.getActionPlans(selectedSubmodulo, targetSector),
      onaService.getAudits(targetSector)
    ]);

    if (secRes.success && secRes.data) setSectors(secRes.data);
    if (indRes.success && indRes.data) setIndicators(indRes.data);
    if (evRes.success && evRes.data) setEvidences(evRes.data);
    if (chkRes.success && chkRes.data) setChecklist(chkRes.data);
    if (plnRes.success && plnRes.data) setActionPlans(plnRes.data);
    if (audRes.success && audRes.data) setAudits(audRes.data);
  }

  // ==========================================
  // MUTATIONS COM OPTIMISTIC UPDATES
  // ==========================================
  async function updateChecklistItemConformity(item: ChecklistItem, conforme: boolean) {
    // Optimistic update
    setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, conforme } : c));
    
    const res = await onaService.updateChecklist({ ...item, conforme });
    if (res.success) {
      toast.success(res.message || 'Conformidade atualizada');
    } else {
      // Rollback
      setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, conforme: item.conforme } : c));
      toast.error(res.message || 'Erro ao atualizar conformidade');
    }
  }

  async function addNewEvidence(formData: FormData): Promise<boolean> {
    const res = await onaService.uploadEvidence(formData);
    if (res.success && res.data) {
      setEvidences(prev => [res.data!, ...prev]);
      toast.success(res.message || 'Evidência anexada');
      return true;
    }
    toast.error(res.message || 'Erro ao anexar evidência');
    return false;
  }

  async function addNewActionPlan(plan: Partial<ActionPlan>): Promise<boolean> {
    const res = await onaService.createActionPlan({ ...plan, submoduloId: selectedSubmodulo, setor: currentUser.departamento });
    if (res.success && res.data) {
      setActionPlans(prev => [res.data!, ...prev]);
      toast.success(res.message || 'Plano de ação criado');
      return true;
    }
    toast.error(res.message || 'Erro ao criar plano de ação');
    return false;
  }

  async function scheduleNewAudit(audit: Partial<Audit>): Promise<boolean> {
    const res = await onaService.createAudit({ ...audit, setor: currentUser.departamento });
    if (res.success && res.data) {
      setAudits(prev => [res.data!, ...prev]);
      toast.success(res.message || 'Auditoria agendada com sucesso');
      return true;
    }
    toast.error(res.message || 'Erro ao agendar auditoria');
    return false;
  }

  const value: OnaStoreState = {
    currentUser, setCurrentUser,
    sectors, indicators, evidences, checklist, actionPlans, audits,
    selectedSector, setSelectedSector, selectedSubmodulo, setSelectedSubmodulo,
    loading, refreshing,
    fetchInitialData, refreshContextData, updateChecklistItemConformity, addNewEvidence, addNewActionPlan, scheduleNewAudit
  };

  // Utiliza React.createElement para garantir compatibilidade JSX em arquivo .ts puro
  return React.createElement(OnaStoreContext.Provider, { value }, children);
}

export function useOnaStore(): OnaStoreState {
  const context = useContext(OnaStoreContext);
  if (!context) throw new Error('useOnaStore deve ser usado dentro de um OnaStoreProvider');
  return context;
}
