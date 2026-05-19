import { handleApiError } from '../utils/error-handler';
import { 
  Diagnosis, Evidence, ChecklistItem, ActionPlan, Audit, Indicator, Sector, DashboardConfig 
} from '../types/ona.types';

/**
 * Camada de Serviços Centralizada do Módulo ONA
 * Desacopla as chamadas de API dos componentes visuais
 */
export const onaService = {
  async getSectorsConfig(): Promise<{ success: boolean; data?: Sector[]; message?: string }> {
    try {
      const res = await fetch('/api/admin/setores');
      if (!res.ok) throw new Error('Falha ao buscar configuração de setores');
      const data: Sector[] = await res.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error, 'Erro ao buscar configuração de setores');
    }
  },

  async getIndicators(setorAlvo?: string): Promise<{ success: boolean; data?: Indicator[]; message?: string }> {
    try {
      let url = '/api/indicators';
      if (setorAlvo && setorAlvo !== 'Diretoria' && setorAlvo !== 'Qualidade e ONA') {
        url += `?setor=${encodeURIComponent(setorAlvo)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao buscar indicadores operacionais');
      const data: Indicator[] = await res.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error, 'Erro ao buscar indicadores operacionais');
    }
  },

  async getDashboardsConfig(perfilOuSetor: string): Promise<{ success: boolean; data?: DashboardConfig[]; message?: string }> {
    try {
      const res = await fetch(`/api/admin/dashboards-config?perfil=${encodeURIComponent(perfilOuSetor)}`);
      if (!res.ok) throw new Error('Falha ao buscar configurações de visões contextuais');
      const data: DashboardConfig[] = await res.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error, 'Erro ao buscar configurações de visões contextuais');
    }
  },

  async getChecklist(submoduloId: number, setorAlvo?: string): Promise<{ success: boolean; data?: ChecklistItem[]; message?: string }> {
    try {
      let url = `/api/ona/checklist?submoduloId=${submoduloId}`;
      if (setorAlvo && setorAlvo !== 'Diretoria' && setorAlvo !== 'Qualidade e ONA') {
        url += `&setor=${encodeURIComponent(setorAlvo)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao buscar itens de verificação ONA');
      const data: ChecklistItem[] = await res.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error, 'Erro ao buscar itens de verificação ONA');
    }
  },

  async updateChecklist(item: ChecklistItem): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/ona/checklist/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error('Falha ao atualizar conformidade do item');
      return { success: true, message: 'Conformidade atualizada com sucesso' };
    } catch (error) {
      return handleApiError(error, 'Erro ao atualizar conformidade do item');
    }
  },

  async getEvidences(submoduloId: number, setorAlvo?: string): Promise<{ success: boolean; data?: Evidence[]; message?: string }> {
    try {
      let url = `/api/ona/evidences?submoduloId=${submoduloId}`;
      if (setorAlvo && setorAlvo !== 'Diretoria' && setorAlvo !== 'Qualidade e ONA') {
        url += `&setor=${encodeURIComponent(setorAlvo)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao buscar evidências de acreditação');
      const data: Evidence[] = await res.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error, 'Erro ao buscar evidências de acreditação');
    }
  },

  async uploadEvidence(formData: FormData): Promise<{ success: boolean; data?: Evidence; message?: string }> {
    try {
      const res = await fetch('/api/ona/evidences', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Falha ao fazer upload da evidência ONA');
      const data: Evidence = await res.json();
      return { success: true, data, message: 'Evidência anexada com sucesso' };
    } catch (error) {
      return handleApiError(error, 'Erro ao fazer upload da evidência ONA');
    }
  },

  async getActionPlans(submoduloId: number, setorAlvo?: string): Promise<{ success: boolean; data?: ActionPlan[]; message?: string }> {
    try {
      let url = `/api/ona/action-plans?submoduloId=${submoduloId}`;
      if (setorAlvo && setorAlvo !== 'Diretoria' && setorAlvo !== 'Qualidade e ONA') {
        url += `&setor=${encodeURIComponent(setorAlvo)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao buscar planos de ação (CAPA)');
      const data: ActionPlan[] = await res.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error, 'Erro ao buscar planos de ação (CAPA)');
    }
  },

  async createActionPlan(plan: Partial<ActionPlan>): Promise<{ success: boolean; data?: ActionPlan; message?: string }> {
    try {
      const res = await fetch('/api/ona/action-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      if (!res.ok) throw new Error('Falha ao registrar novo plano de ação');
      const data: ActionPlan = await res.json();
      return { success: true, data, message: 'Plano de ação CAPA criado com sucesso' };
    } catch (error) {
      return handleApiError(error, 'Erro ao registrar novo plano de ação');
    }
  },

  async updateActionPlanStatus(id: number, status: ActionPlan['status']): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/ona/action-plans/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Falha ao atualizar status do plano de ação');
      return { success: true, message: 'Status do plano atualizado com sucesso' };
    } catch (error) {
      return handleApiError(error, 'Erro ao atualizar status do plano de ação');
    }
  },

  async getAudits(setorAlvo?: string): Promise<{ success: boolean; data?: Audit[]; message?: string }> {
    try {
      let url = '/api/ona/audits';
      if (setorAlvo && setorAlvo !== 'Diretoria' && setorAlvo !== 'Qualidade e ONA') {
        url += `?setor=${encodeURIComponent(setorAlvo)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao buscar auditorias agendadas');
      const data: Audit[] = await res.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error, 'Erro ao buscar auditorias agendadas');
    }
  },

  async createAudit(audit: Partial<Audit>): Promise<{ success: boolean; data?: Audit; message?: string }> {
    try {
      const res = await fetch('/api/ona/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audit)
      });
      if (!res.ok) throw new Error('Falha ao agendar auditoria de internação');
      const data: Audit = await res.json();
      return { success: true, data, message: 'Auditoria ONA agendada com sucesso' };
    } catch (error) {
      return handleApiError(error, 'Erro ao agendar auditoria de internação');
    }
  },

  async createDiagnosis(diagnosis: Partial<Diagnosis>): Promise<{ success: boolean; data?: Diagnosis; message?: string }> {
    try {
      const res = await fetch('/api/ona/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diagnosis)
      });
      if (!res.ok) throw new Error('Falha ao gerar diagnóstico ONA');
      const data: Diagnosis = await res.json();
      return { success: true, data, message: 'Diagnóstico operacional ONA gerado com sucesso' };
    } catch (error) {
      return handleApiError(error, 'Erro ao gerar diagnóstico ONA');
    }
  },

  async updateStatus(submoduloId: number, statusGeral: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/ona/submodulos/${submoduloId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusGeral })
      });
      if (!res.ok) throw new Error('Falha ao atualizar status de conformidade do submódulo');
      return { success: true, message: 'Status geral do submódulo atualizado com sucesso' };
    } catch (error) {
      return handleApiError(error, 'Erro ao atualizar status de conformidade do submódulo');
    }
  }
};
