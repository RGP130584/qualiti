import { useOnaStore } from '../store/ona.store';

export function useIndicators() {
  const { indicators, loading } = useOnaStore();

  const totalIndicators = indicators.length;
  const conformingIndicators = indicators.filter(i => i.status === 'Conforme').length;
  const alertIndicators = indicators.filter(i => i.status === 'Alerta').length;
  const criticalIndicators = indicators.filter(i => i.status === 'Crítico').length;

  return {
    indicators,
    loading,
    totalIndicators,
    conformingIndicators,
    alertIndicators,
    criticalIndicators
  };
}
