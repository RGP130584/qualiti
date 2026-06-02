/**
 * Sistema de Notificações Enterprise (Toast / Sonner Pattern)
 * Substitui completamente o uso de alert() na aplicação
 */

// Event Target customizado para disparar eventos de toast no frontend
class ToastEmitter extends EventTarget {
  success(message: string, title = 'Sucesso Operacional') {
    this.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', message, title } }));
    console.log(`[TOAST SUCCESS]: ${title} - ${message}`);
  }

  error(message: string, title = 'Falha Operacional') {
    this.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message, title } }));
    console.error(`[TOAST ERROR]: ${title} - ${message}`);
  }

  warning(message: string, title = 'Aviso ONA') {
    this.dispatchEvent(new CustomEvent('toast', { detail: { type: 'warning', message, title } }));
    console.warn(`[TOAST WARNING]: ${title} - ${message}`);
  }

  info(message: string, title = 'Informação Institucional') {
    this.dispatchEvent(new CustomEvent('toast', { detail: { type: 'info', message, title } }));
    console.info(`[TOAST INFO]: ${title} - ${message}`);
  }
}

export const toast = new ToastEmitter();
