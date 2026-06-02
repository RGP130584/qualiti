/**
 * Centralizador de tratamento de erros de API do Módulo ONA
 * Proíbe o uso de alert() e padroniza o retorno de falhas operacionais
 */
export function handleApiError(error: unknown, fallbackMessage = 'Erro interno no servidor'): { success: boolean; message: string; errorDetails?: unknown } {
  console.error('[ONA API ERROR]:', error);

  const message = error instanceof Error ? error.message : fallbackMessage;

  return {
    success: false,
    message,
    errorDetails: error
  };
}
