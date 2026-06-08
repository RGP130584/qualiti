export interface Pop {
  id?: number;
  titulo: string;
  codigo: string;
  versao: string;
  setor: string;
  status: string;
  conteudo: string;
  autor: string;
  aprovador: string;
  qrcode?: string;
  data_criacao?: Date | string;
  data_revisao?: Date | string;
  data_limite?: Date | string;
  notificacao_enviada?: boolean;
  titulo_pendente?: string;
  versao_pendente?: string;
  conteudo_pendente?: string;
  status_edicao?: string;
  departamento?: string;
  categoria?: string;
  tipo_documental?: string;
  nivel_acesso?: string;
  instituicao_nome?: string;
  unidade_nome?: string;
  ocr_texto?: string;
  embeddings?: any;
  documentos_impactados?: any;
  rastreabilidade_normas?: any;
  deleted_at?: Date | string | null;
  tenant_id?: string;
}

export interface PopVersao {
  id?: number;
  pop_id: number;
  versao: string;
  conteudo: string;
  autor: string;
  data_modificacao?: Date | string;
}

export interface Notificacao {
  id?: number;
  pop_id: number;
  pop_titulo: string;
  destinatario_email: string;
  destinatario_papel: string;
  mensagem: string;
  prazo_horas?: number;
  data_criacao?: Date | string;
  data_limite: Date | string;
  data_envio?: Date | string | null;
  status: string;
}
