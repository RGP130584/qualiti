import { useOnaStore } from '../store/ona.store';

export function useEvidence() {
  const { evidences, addNewEvidence, loading } = useOnaStore();

  return {
    evidences,
    addNewEvidence,
    loading,
    totalEvidences: evidences.length,
    pendingEvidences: evidences.filter(e => e.statusAprovacao === 'Pendente').length
  };
}
