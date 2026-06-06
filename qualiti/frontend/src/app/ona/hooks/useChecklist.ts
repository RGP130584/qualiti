import { useOnaStore } from '../store/ona.store';
import { ChecklistItem } from '../types/ona.types';

export function useChecklist() {
  const { checklist, updateChecklistItemConformity, loading } = useOnaStore();

  const totalItems = checklist.length;
  const conformingItems = checklist.filter(c => c.conforme).length;
  const conformityPercentage = totalItems > 0 ? Math.round((conformingItems / totalItems) * 100) : 0;

  return {
    checklist,
    updateChecklistItemConformity,
    loading,
    totalItems,
    conformingItems,
    conformityPercentage
  };
}
