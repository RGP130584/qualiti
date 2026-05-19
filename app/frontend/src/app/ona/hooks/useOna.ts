import { useOnaStore } from '../store/ona.store';
import { UserContext, Sector } from '../types/ona.types';

export function useOna() {
  const store = useOnaStore();

  return {
    currentUser: store.currentUser,
    setCurrentUser: store.setCurrentUser,
    sectors: store.sectors,
    selectedSector: store.selectedSector,
    setSelectedSector: store.setSelectedSector,
    selectedSubmodulo: store.selectedSubmodulo,
    setSelectedSubmodulo: store.setSelectedSubmodulo,
    loading: store.loading,
    refreshing: store.refreshing,
    refreshContextData: store.refreshContextData,
    isGlobalView: store.currentUser.isGlobalAdmin || store.currentUser.departamento === 'Diretoria' || store.currentUser.role.includes('Auditor')
  };
}
