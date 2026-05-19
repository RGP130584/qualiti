'use client';

import React from 'react';
import { OnaStoreProvider } from './store/ona.store';
import { OnaDashboard } from './components/OnaDashboard';

/**
 * Página Principal do Módulo ONA (Clean Architecture)
 * Contém apenas a inicialização do Provider de Estado e a renderização do Dashboard Central.
 * Toda a lógica de negócio, requisições e tratamento de erros estão modularizados em /services, /store e /components.
 */
export default function OnaPage() {
  return (
    <OnaStoreProvider>
      <OnaDashboard />
    </OnaStoreProvider>
  );
}
