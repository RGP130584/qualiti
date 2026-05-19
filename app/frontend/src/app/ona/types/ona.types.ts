export interface Sector {
  id: number;
  nome: string;
  departamento_pai?: string;
  descricao?: string;
  ativo: boolean;
  categorias_customizadas?: string[];
}

export interface Indicator {
  id: number;
  titulo: string;
  setor: string;
  valorAtual: number;
  meta: number;
  unidade: string;
  status: 'Conforme' | 'Alerta' | 'Crítico';
  tendencia: 'up' | 'down' | 'stable';
  historico?: { mes: string; valor: number }[];
}

export interface Evidence {
  id: number;
  submoduloId: number;
  arquivoNome: string;
  arquivoUrl: string;
  enviadoPor: string;
  dataEnvio: string;
  statusAprovacao: 'Pendente' | 'Aprovado' | 'Rejeitado';
  setorRelacionado: string;
}

export interface ChecklistItem {
  id: number;
  submoduloId: number;
  pergunta: string;
  conforme: boolean;
  evidenciaId?: number;
  observacoes?: string;
  setor: string;
}

export interface ActionPlan {
  id: number;
  submoduloId: number;
  titulo: string;
  descricao: string;
  responsavel: string;
  setor: string;
  prazo: string;
  status: 'Não Iniciado' | 'Em Andamento' | 'Concluído' | 'Atrasado';
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  acoesRealizadas?: string[];
}

export interface Audit {
  id: number;
  setor: string;
  auditor: string;
  dataAuditoria: string;
  pontuacao: number;
  nivelAcreditacao: 'Nível 1 - Acreditado' | 'Nível 2 - Acreditado Pleno' | 'Nível 3 - Acreditado com Excelência' | 'Não Acreditado';
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Contestada';
  relatorioUrl?: string;
}

export interface Diagnosis {
  id: number;
  setor: string;
  submoduloId: number;
  conformidadePercentual: number;
  totalItens: number;
  itensConformes: number;
  dataUltimaAvaliacao: string;
  statusGeral: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
}

export interface DashboardConfig {
  id: number;
  perfilOuSetor: string;
  nomeVisao: string;
  widgets: { type: string; title: string; config?: Record<string, unknown> }[];
  isGlobal: boolean;
}

export interface UserContext {
  nome: string;
  role: string;
  departamento: string;
  email: string;
  isGlobalAdmin: boolean;
}
