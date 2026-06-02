import { useOnaStore } from '../store/ona.store';
import { Audit } from '../types/ona.types';

export function useAudit() {
  const { audits, scheduleNewAudit, loading } = useOnaStore();

  return {
    audits,
    scheduleNewAudit,
    loading,
    activeAudits: audits.filter(a => a.status === 'Em Andamento').length,
    completedAudits: audits.filter(a => a.status === 'Concluída').length
  };
}
